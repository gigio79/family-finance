"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

interface Transaction {
  id: string;
  amount: number;
  description: string;
  date: string;
  type: "INCOME" | "EXPENSE";
  status: string;
  source: string;
  recurring: boolean;
  isInstallment: boolean;
  installmentGroupId: string | null;
  installmentNumber: number | null;
  totalInstallments: number | null;
  accountId: string | null;
  account: { id: string; name: string; icon: string; color: string; type: string } | null;
  category: { id: string; name: string; icon: string; color: string } | null;
  user: { id: string; name: string };
}

interface Category {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  icon: string;
  color: string;
}

interface Account {
  id: string;
  name: string;
  type: "CASH" | "BANK" | "CREDIT_CARD";
  icon: string;
  color: string;
  limit?: number;
  closingDay?: number;
  dueDay?: number;
}

type TransactionFormType = "INCOME" | "EXPENSE";

interface TransactionFormState {
  amount: string;
  description: string;
  date: string;
  type: TransactionFormType;
  categoryId: string;
  recurring: boolean;
  recurringInterval: string;
  isInstallment: boolean;
  totalInstallments: number;
  firstInstallmentDate: string;
  accountId: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showInstallmentsModal, setShowInstallmentsModal] = useState(false);

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [installments, setInstallments] = useState<Transaction[]>([]);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [filterType, setFilterType] = useState<"" | "INCOME" | "EXPENSE">("");
  const [filterCategory, setFilterCategory] = useState("");

  const [form, setForm] = useState<TransactionFormState>(() => {
    const today = new Date().toISOString().split("T")[0];
    return {
      amount: "",
      description: "",
      date: today,
      type: "EXPENSE",
      categoryId: "",
      recurring: false,
      recurringInterval: "",
      isInstallment: false,
      totalInstallments: 2,
      firstInstallmentDate: today,
      accountId: ""
    };
  });

  const searchParams = useSearchParams();

  const loadData = () => {
    const params = new URLSearchParams();
    if (filterType) params.set("type", filterType);
    if (filterCategory) params.set("categoryId", filterCategory);

    Promise.all([
      fetch(`/api/transactions?${params.toString()}`).then(r => r.json()),
      fetch("/api/categories").then(r => r.json()),
      fetch("/api/accounts").then(r => r.json())
    ]).then(([txs, cats, accs]) => {
      setTransactions(Array.isArray(txs) ? txs : []);
      setCategories(Array.isArray(cats) ? cats : []);
      setAccounts(Array.isArray(accs) ? accs : []);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, [filterType, filterCategory]);

  useEffect(() => {
    const shouldOpenAddMenu = searchParams.get("add") === "1";
    if (shouldOpenAddMenu) {
      setShowTypeMenu(true);
    }
  }, [searchParams]);

  const fmt = (n: number) =>
    n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const filteredCategories = categories.filter(c => c.type === form.type);

  const resetFormForType = (type: TransactionFormType) => {
    const today = new Date().toISOString().split("T")[0];
    setForm({
      amount: "",
      description: "",
      date: today,
      type,
      categoryId: "",
      recurring: false,
      recurringInterval: "",
      isInstallment: false,
      totalInstallments: 2,
      firstInstallmentDate: today,
      accountId: ""
    });
  };

  const openNewTransaction = (type: TransactionFormType) => {
    setEditingTx(null);
    resetFormForType(type);
    setShowTypeMenu(false);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.isInstallment && form.type === "INCOME") {
      alert("Parcelamento não disponível para receitas!");
      return;
    }

    const payload = {
      ...form,
      accountId:
        form.type === "EXPENSE" && form.accountId ? form.accountId : null,
      totalInstallments: form.isInstallment
        ? parseInt(form.totalInstallments as unknown as string, 10)
        : null,
      firstInstallmentDate: form.isInstallment ? form.firstInstallmentDate : null
    };

    const method = editingTx ? "PUT" : "POST";
    const body = editingTx ? { id: editingTx.id, ...payload } : payload;

    const res = await fetch("/api/transactions", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (res.ok) {
      try {
        const result = await res.json();
        if (result?.message) {
          alert(result.message);
        }
      } catch {
        // ignore parse errors
      }

      setShowModal(false);
      setEditingTx(null);
      resetFormForType("EXPENSE");
      loadData();
    }
  };

  const handleDelete = async (id: string, installmentGroupId?: string | null) => {
    if (installmentGroupId) {
      if (!confirm("Cancelar todas as parcelas futuras?")) return;
      await fetch(
        `/api/transactions?installmentGroupId=${installmentGroupId}&cancelFrom=1`,
        { method: "DELETE" }
      );
    } else {
      if (!confirm("Remover esta transação?")) return;
      await fetch(`/api/transactions?id=${id}`, { method: "DELETE" });
    }
    loadData();
  };

  const openEdit = (tx: Transaction) => {
    setEditingTx(tx);
    const baseDate = tx.date.split("T")[0];
    setForm({
      amount: tx.amount.toString(),
      description: tx.description.replace(/ \(\d+\/\d+\)/, ""),
      date: baseDate,
      type: tx.type,
      categoryId: tx.category?.id || "",
      recurring: tx.recurring,
      recurringInterval: "",
      isInstallment: tx.isInstallment,
      totalInstallments: tx.totalInstallments || 2,
      firstInstallmentDate: baseDate,
      accountId: tx.account?.id || ""
    });
    setShowTypeMenu(false);
    setShowModal(true);
  };

  const viewInstallments = async (groupId: string) => {
    setSelectedGroupId(groupId);
    const res = await fetch(`/api/transactions?installmentGroupId=${groupId}`);
    const data = await res.json();
    setInstallments(data);
    setShowInstallmentsModal(true);
  };

  const groupedTransactions = transactions.reduce(
    (acc, tx) => {
      if (tx.isInstallment && tx.installmentGroupId) {
        if (!acc[tx.installmentGroupId]) {
          acc[tx.installmentGroupId] = tx;
        }
      } else {
        acc[tx.id] = tx;
      }
      return acc;
    },
    {} as Record<string, Transaction>
  );

  const descriptionPlaceholder =
    form.type === "INCOME"
      ? "Ex: Salário, Freelance, Pix recebido, Venda..."
      : "Ex: Notebook, Supermercado, Conta de luz...";

  const submitColor = form.type === "INCOME" ? "#10b981" : "#ef4444";

  const typePillStyle =
    form.type === "INCOME"
      ? {
          background: "rgba(16, 185, 129, 0.12)",
          color: "#059669",
          border: "1px solid rgba(16, 185, 129, 0.35)"
        }
      : {
          background: "rgba(239, 68, 68, 0.12)",
          color: "#b91c1c",
          border: "1px solid rgba(239, 68, 68, 0.35)"
        };

  return (
    <div className="animate-fade">
      <div className="page-header">
        <h1>💳 Transações</h1>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          📝 <strong>Registre aqui todas as entradas e saídas de dinheiro da sua família.</strong> Cada transação impacta o saldo das contas e ajuda no controle financeiro.
        </p>
      </div>

      <div className="filters-bar">
        <div
          className={`filter-chip ${filterType === "" ? "active" : ""}`}
          onClick={() => setFilterType("")}
        >
          📋 Todas
        </div>
        <div
          className={`filter-chip ${
            filterType === "INCOME" ? "active" : ""
          }`}
          onClick={() => setFilterType("INCOME")}
        >
          💰 Receitas
        </div>
        <div
          className={`filter-chip ${
            filterType === "EXPENSE" ? "active" : ""
          }`}
          onClick={() => setFilterType("EXPENSE")}
        >
          💸 Despesas
        </div>
        <select
          className="form-select"
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          style={{ maxWidth: 200 }}
        >
          <option value="">Todas categorias</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div
          className="skeleton"
          style={{ height: 300, borderRadius: "var(--radius-lg)" }}
        />
      ) : Object.keys(groupedTransactions).length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state-icon">💸</div>
          <h3>Nenhuma transação encontrada</h3>
          <p>Comece registrando sua primeira transação!</p>
          <button
            className="btn btn-primary"
            onClick={() => setShowTypeMenu(true)}
          >
            ➕ Adicionar
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th>Categoria</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(groupedTransactions).map(tx => (
                <tr key={tx.id}>
                  <td>{new Date(tx.date).toLocaleDateString("pt-BR")}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>
                      {tx.isInstallment ? (
                        <span
                          style={{
                            cursor: "pointer",
                            color: "var(--primary)",
                            textDecoration: "underline"
                          }}
                          onClick={() =>
                            viewInstallments(tx.installmentGroupId!)
                          }
                          title="Ver todas as parcelas"
                        >
                          {tx.description.replace(/ \(\d+\/\d+\)/, "")} (
                          {tx.installmentNumber}/{tx.totalInstallments})
                        </span>
                      ) : (
                        tx.description
                      )}
                    </div>
                    {tx.recurring && (
                      <span
                        className="badge badge-pending"
                        style={{ marginTop: 2 }}
                      >
                        🔄 Recorrente
                      </span>
                    )}
                    {tx.isInstallment && (
                      <span
                        className="badge badge-confirmed"
                        style={{ marginTop: 2 }}
                      >
                        📊 Parcelado
                      </span>
                    )}
                  </td>
                  <td>
                    {tx.category ? (
                      <span
                        className="badge"
                        style={{
                          background: `${tx.category.color}20`,
                          color: tx.category.color
                        }}
                      >
                        {tx.category.icon} {tx.category.name}
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td>
                    <span
                      style={{
                        fontWeight: 700,
                        color:
                          tx.type === "INCOME"
                            ? "var(--success)"
                            : "var(--danger)"
                      }}
                    >
                      {tx.type === "INCOME" ? "+" : "-"}
                      {fmt(tx.amount)}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        tx.status === "CONFIRMED"
                          ? "badge-confirmed"
                          : "badge-pending"
                      }`}
                    >
                      {tx.status === "CONFIRMED" ? "✅" : "⏳"}{" "}
                      {tx.status === "CONFIRMED"
                        ? "Confirmada"
                        : tx.status === "CANCELLED"
                        ? "❌ Cancelada"
                        : "Pendente"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "0.25rem" }}>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => openEdit(tx)}
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() =>
                          handleDelete(tx.id, tx.installmentGroupId)
                        }
                        title="Remover"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showTypeMenu && (
        <div
          className="modal-overlay"
          onClick={() => setShowTypeMenu(false)}
        >
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>➕ Adicionar</h2>
              <button
                className="modal-close"
                onClick={() => setShowTypeMenu(false)}
              >
                ×
              </button>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
                marginTop: "0.5rem"
              }}
            >
              <button
                type="button"
                className="btn w-full"
                style={{
                  justifyContent: "flex-start",
                  background:
                    "linear-gradient(135deg, #10b981, #22c55e)",
                  border: "none",
                  borderRadius: "var(--radius-lg)",
                  padding: "0.9rem 1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem"
                }}
                onClick={() => openNewTransaction("INCOME")}
              >
                <span style={{ fontSize: "1.4rem" }}>💰</span>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start"
                  }}
                >
                  <span
                    style={{
                      fontWeight: 600,
                      color: "#f9fafb",
                      letterSpacing: 0.1
                    }}
                  >
                    + Receita
                  </span>
                  <span
                    className="text-sm"
                    style={{
                      marginTop: 2,
                      color: "rgba(15, 23, 42, 0.9)"
                    }}
                  >
                    Salário, freelance, Pix recebido, vendas...
                  </span>
                </div>
              </button>

              <button
                type="button"
                className="btn w-full"
                style={{
                  justifyContent: "flex-start",
                  background:
                    "linear-gradient(135deg, #ef4444, #f97316)",
                  border: "none",
                  borderRadius: "var(--radius-lg)",
                  padding: "0.9rem 1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem"
                }}
                onClick={() => openNewTransaction("EXPENSE")}
              >
                <span style={{ fontSize: "1.4rem" }}>💸</span>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start"
                  }}
                >
                  <span
                    style={{
                      fontWeight: 600,
                      color: "#f9fafb",
                      letterSpacing: 0.1
                    }}
                  >
                    + Despesa
                  </span>
                  <span
                    className="text-sm"
                    style={{
                      marginTop: 2,
                      color: "rgba(15, 23, 42, 0.9)"
                    }}
                  >
                    Compras, contas, mercado, assinaturas...
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {editingTx
                  ? "✏️ Editar Transação"
                  : form.type === "INCOME"
                  ? "➕ Nova Receita"
                  : "➕ Nova Despesa"}
              </h2>
              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Tipo</label>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    padding: "0.35rem 0.75rem",
                    borderRadius: "999px",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    ...typePillStyle
                  }}
                >
                  <span>{form.type === "INCOME" ? "💰" : "💸"}</span>
                  <span>
                    {form.type === "INCOME" ? "Receita" : "Despesa"}
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Valor Total (R$)</label>
                <p className="text-xs text-muted" style={{ margin: '0 0 0.5rem 0' }}>Informe o valor total da transação.</p>
                <input
                  className="form-input"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={form.amount}
                  onChange={e =>
                    setForm({ ...form, amount: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Descrição</label>
                <p className="text-xs text-muted" style={{ margin: '0 0 0.5rem 0' }}>O que foi comprado ou recebido.</p>
                <input
                  className="form-input"
                  type="text"
                  placeholder={descriptionPlaceholder}
                  value={form.description}
                  onChange={e =>
                    setForm({ ...form, description: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Data</label>
                <input
                  className="form-input"
                  type="date"
                  value={form.date}
                  onChange={e =>
                    setForm({
                      ...form,
                      date: e.target.value,
                      firstInstallmentDate: e.target.value
                    })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Categoria</label>
                <select
                  className="form-select"
                  value={form.categoryId}
                  onChange={e =>
                    setForm({ ...form, categoryId: e.target.value })
                  }
                  required
                >
                  <option value="">Selecione...</option>
                  {filteredCategories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {form.type === "EXPENSE" && accounts.filter(a => a.type === "CREDIT_CARD").length > 0 && (
                <div className="form-group">
                  <label className="form-label">Cartão de Crédito</label>
                  <select
                    className="form-select"
                    value={form.accountId}
                    onChange={e =>
                      setForm({ ...form, accountId: e.target.value })
                    }
                  >
                    <option value="">À vista (dinheiro/débito)</option>
                    {accounts.filter(a => a.type === "CREDIT_CARD").map(card => (
                      <option key={card.id} value={card.id}>
                        {card.icon} {card.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {form.type === "EXPENSE" && form.accountId && accounts.find(a => a.id === form.accountId)?.type === "CREDIT_CARD" && (
                <div
                  className="form-group"
                  style={{
                    padding: "1rem",
                    background: "var(--bg-secondary)",
                    borderRadius: "var(--radius-md)",
                    marginBottom: "1rem"
                  }}
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      cursor: "pointer"
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={form.isInstallment}
                      onChange={e =>
                        setForm({
                          ...form,
                          isInstallment: e.target.checked,
                          totalInstallments: e.target.checked
                            ? form.totalInstallments
                            : 0
                        })
                      }
                    />
                    <span className="form-label" style={{ margin: 0 }}>
                      💳 Compra parcelada
                    </span>
                  </label>

                  {form.isInstallment && (
                    <div
                      style={{
                        marginTop: "1rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.75rem"
                      }}
                    >
                      <div>
                        <label className="form-label">
                          Número de parcelas
                        </label>
                        <select
                          className="form-select"
                          value={form.totalInstallments}
                          onChange={e =>
                            setForm({
                              ...form,
                              totalInstallments: parseInt(
                                e.target.value,
                                10
                              )
                            })
                          }
                        >
                          {[...Array(35)].map((_, i) => (
                            <option key={i + 2} value={i + 2}>
                              {i + 2}x
                            </option>
                          ))}
                        </select>
                      </div>
                      {form.amount && (
                        <div
                          className="text-sm"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          Valor por parcela:{" "}
                          <strong>
                            {fmt(
                              parseFloat(form.amount) /
                                (form.totalInstallments || 1)
                            )}
                          </strong>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <button
                className="btn w-full"
                type="submit"
                style={{
                  background: submitColor,
                  borderColor: submitColor,
                  color: "#fff"
                }}
              >
                {editingTx ? "💾 Salvar" : "✅ Registrar"}
              </button>
            </form>
          </div>
        </div>
      )}

      {showInstallmentsModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowInstallmentsModal(false)}
        >
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📊 Todas as Parcelas</h2>
              <button
                className="modal-close"
                onClick={() => setShowInstallmentsModal(false)}
              >
                ×
              </button>
            </div>
            <div style={{ maxHeight: 400, overflow: "auto" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Data</th>
                    <th>Valor</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {installments.map(tx => (
                    <tr key={tx.id}>
                      <td>
                        {tx.installmentNumber}/{tx.totalInstallments}
                      </td>
                      <td>
                        {new Date(tx.date).toLocaleDateString("pt-BR")}
                      </td>
                      <td
                        style={{
                          fontWeight: 700,
                          color: "var(--danger)"
                        }}
                      >
                        {fmt(tx.amount)}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            tx.status === "CONFIRMED"
                              ? "badge-confirmed"
                              : "badge-pending"
                          }`}
                        >
                          {tx.status === "CONFIRMED" ? "✅" : "❌"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

