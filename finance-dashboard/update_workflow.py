import json
import uuid

# Load original workflow
with open("C:/Users/Giovanni/.gemini/antigravity/brain/85ae5a2f-0ee5-435e-8e6f-7e74d9b21add/.system_generated/steps/661/output.txt", "r", encoding="utf-8") as f:
    data = json.load(f)["data"]

nodes = data["nodes"]
connections = data["connections"]

# Helper to find node by name
def get_node_index(name):
    for i, n in enumerate(nodes):
        if n["name"] == name:
            return i
    return -1

# 1. Create New Nodes
switch_node = {
    "id": "Check Source",
    "name": "Check Source",
    "type": "n8n-nodes-base.if",
    "typeVersion": 1,
    "position": [200, 240],
    "parameters": {
        "conditions": {
            "string": [
                {
                    "value1": "={{ $json.source }}",
                    "value2": "pdf"
                }
            ]
        }
    }
}

read_pdf_node = {
    "id": "Read PDF",
    "name": "Read PDF",
    "type": "n8n-nodes-base.readPDF",
    "typeVersion": 1,
    "position": [200, 440],
    "parameters": {
        "binaryPropertyName": "data"
    }
}

ai_extractor_node = {
    "id": "AI Extractor",
    "name": "AI Extractor",
    "type": "@n8n/n8n-nodes-langchain.agent",
    "typeVersion": 1.7,
    "position": [400, 440],
    "parameters": {
        "options": {
            "systemMessage": "Extract transactions from the text. Return a JSON array strictly. Example: [{\"date\": \"2024-02-10\", \"amount\": -50.00, \"description\": \"UBER\"}]. Amount must be number. Negative for expenses."
        },
        "text": "={{ $json.text }}"
    }
}

# Transform AI output (string/json) to n8n items
normalize_pdf_node = {
    "id": "Normalize PDF",
    "name": "Normalize PDF",
    "type": "n8n-nodes-base.code",
    "typeVersion": 2,
    "position": [620, 440],
    "parameters": {
        "jsCode": """
// AI output is usually in 'output' field as string or json
const aiKey = 'output';
let transactions = [];
try {
  const text = items[0].json[aiKey];
  // clean markdown code blocks
  const jsonText = text.replace(/```json/g, '').replace(/```/g, '').trim();
  transactions = JSON.parse(jsonText);
} catch (e) {
  // fallback
  transactions = [];
}

return transactions.map(t => ({
  json: {
    date: t.date,
    amount: t.amount,
    description: t.description,
    source: 'pdf'
  }
}));
"""
    }
}

merge_node = {
    "id": "Merge Inputs",
    "name": "Merge Inputs",
    "type": "n8n-nodes-base.merge",
    "typeVersion": 3,
    "position": [600, 100], 
    "parameters": {
        "mode": "append"
    }
}

# Add new nodes
nodes.extend([switch_node, read_pdf_node, ai_extractor_node, normalize_pdf_node, merge_node])

# 2. Update Connections

# Remove Webhook -> Parse CSV
if "Webhook" in connections:
    del connections["Webhook"]

# Remove Parse CSV -> Limit Batches
if "Parse CSV" in connections:
    del connections["Parse CSV"]

# Rebuild connections
new_connections = {
    "Webhook": {
        "main": [[{"node": "Check Source", "type": "main", "index": 0}]]
    },
    "Check Source": {
        "main": [
            [{"node": "Read PDF", "type": "main", "index": 0}], # True (PDF)
            [{"node": "Parse CSV", "type": "main", "index": 0}]  # False (CSV)
        ]
    },
    "Read PDF": {
        "main": [[{"node": "AI Extractor", "type": "main", "index": 0}]]
    },
    "AI Extractor": {
        "main": [[{"node": "Normalize PDF", "type": "main", "index": 0}]]
    },
    "Normalize PDF": {
        "main": [[{"node": "Merge Inputs", "type": "main", "index": 0}]] # Input 1 (PDF) - Merge inputs are 0 and 1
    },
    "Parse CSV": {
        "main": [[{"node": "Merge Inputs", "type": "main", "index": 1}]] # Input 2 (CSV)
    },
    "Merge Inputs": {
        "main": [[{"node": "Limit Batches", "type": "main", "index": 0}]]
    },
    # Ensure AI Extractor uses the same OpenAI Model
    "OpenAI Model": {
        "ai_languageModel": [
            [
                {"node": "AI Agent", "type": "ai_languageModel", "index": 0},
                {"node": "AI Extractor", "type": "ai_languageModel", "index": 0} # Share model
            ]
        ]
    }
}

# Merge existing connections that were NOT deleted (like Limit Batches -> Filter Code, etc.)
for key, val in data["connections"].items():
    if key not in ["Webhook", "Parse CSV", "OpenAI Model"]:
        new_connections[key] = val

data["connections"] = new_connections
data["nodes"] = nodes

# Save updated workflow
with open("updated_workflow.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2)

print("Workflow JSON updated.")
