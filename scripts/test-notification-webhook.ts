#!/usr/bin/env node

/**
 * Script de teste para validar a integração de notificações
 * Execute: npx ts-node scripts/test-notification-webhook.ts
 * OU: node scripts/test-notification-webhook.js
 */

const examples = [
  {
    name: '✅ PicPay - Pix Recebido',
    body: {
      title: 'PicPay',
      text: 'Debora Ribeiro enviou um Pix de R$20,00 para voce.',
      appPackage: 'com.picpay'
    },
    expected: {
      type: 'INCOME',
      amount: 20.00,
      account: 'PicPay'
    }
  },
  {
    name: '✅ Mercado Pago - Pagamento Efetuado',
    body: {
      title: 'Mercado Pago',
      text: 'Você pagou R$35,90 em SuperMercado XYZ com Pix',
      appPackage: 'com.mercadopago'
    },
    expected: {
      type: 'EXPENSE',
      amount: 35.90,
      account: 'Mercado Pago'
    }
  },
  {
    name: '✅ PicPay - Você Enviou Pix',
    body: {
      title: 'PicPay',
      text: 'Você enviou Pix de R$100,00 para João Silva',
      appPackage: 'com.picpay'
    },
    expected: {
      type: 'EXPENSE',
      amount: 100.00,
      account: 'PicPay'
    }
  },
  {
    name: '✅ Mercado Pago - Recebimento',
    body: {
      title: 'Mercado Pago',
      text: 'Você recebeu R$50,00 de transferência de Maria',
      appPackage: 'com.mercadopago'
    },
    expected: {
      type: 'INCOME',
      amount: 50.00,
      account: 'Mercado Pago'
    }
  },
  {
    name: '✅ PicPay - Compra com QR Code',
    body: {
      title: 'PicPay',
      text: 'Você pagou R$12,50 com QR Code na Padaria do João',
      appPackage: 'com.picpay'
    },
    expected: {
      type: 'EXPENSE',
      amount: 12.50,
      account: 'PicPay'
    }
  }
];

async function testWebhook(example: typeof examples[0], apiUrl: string, familyId: string) {
  console.log(`\n🧪 Testando: ${example.name}`);
  console.log(`   URL: ${apiUrl}`);
  
  try {
    const response = await fetch(`${apiUrl}/api/webhooks/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...example.body,
        familyId
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`   ✅ Status ${response.status}`);
      console.log(`   Resultado:`);
      console.log(`     - Descrição: ${data.transaction.description}`);
      console.log(`     - Valor: R$${data.transaction.amount}`);
      console.log(`     - Tipo: ${data.transaction.type}`);
      console.log(`     - Conta: ${data.transaction.account}`);
      console.log(`     - Status: ${data.transaction.status}`);
      console.log(`     - Confiabilidade: ${(data.transaction.confidence * 100).toFixed(0)}%`);

      // Validações
      const pass = 
        data.transaction.type === example.expected.type &&
        data.transaction.amount === example.expected.amount &&
        data.transaction.account === example.expected.account;

      if (pass) {
        console.log(`   ✅ PASSOU em todas as validações!`);
      } else {
        console.log(`   ⚠️  Validações falharam:`);
        if (data.transaction.type !== example.expected.type) {
          console.log(`      - Tipo esperado ${example.expected.type}, recebeu ${data.transaction.type}`);
        }
        if (data.transaction.amount !== example.expected.amount) {
          console.log(`      - Valor esperado ${example.expected.amount}, recebeu ${data.transaction.amount}`);
        }
      }
    } else {
      console.log(`   ❌ Status ${response.status}`);
      console.log(`   Erro: ${data.error}`);
      if (data.parsed) {
        console.log(`   Parsed: ${JSON.stringify(data.parsed, null, 2)}`);
      }
      if (data.nextSteps) {
        console.log(`   Próximos passos:`);
        data.nextSteps.forEach((step: string) => console.log(`      - ${step}`));
      }
    }
  } catch (error) {
    console.log(`   ❌ ERRO: ${error}`);
    console.log(`   Verifique se:`);
    console.log(`      - O servidor está rodando em ${apiUrl}`);
    console.log(`      - O familyId está correto`);
    console.log(`      - Não há firewall bloqueando a conexão`);
  }
}

async function main() {
  const apiUrl = process.argv[2] || 'http://localhost:3000';
  const familyId = process.argv[3];

  console.log('═══════════════════════════════════════════════════════════');
  console.log('🚀 Teste de Webhook - Notificações Automáticas');
  console.log('═══════════════════════════════════════════════════════════');

  if (!familyId) {
    console.log('\n❌ Family ID não fornecido!');
    console.log('\nUso:');
    console.log('  npx ts-node scripts/test-notification-webhook.ts <API_URL> <FAMILY_ID>');
    console.log('\nExemplos:');
    console.log('  npm run test:webhook http://localhost:3000 abc123defg');
    console.log('  npm run test:webhook https://seu-app.com familia-uuid-aqui');
    console.log('\n💡 Para encontrar seu Family ID:');
    console.log('  1. Abra http://localhost:3000 no navegador');
    console.log('  2. Console (F12) → Execute:');
    console.log('     JSON.parse(localStorage.getItem("session") || "{}").familyId');
    process.exit(1);
  }

  console.log(`\n✓ API URL: ${apiUrl}`);
  console.log(`✓ Family ID: ${familyId}`);
  console.log('\nExecutando testes...');

  // Testa cada exemplo em sequência
  for (const example of examples) {
    await testWebhook(example, apiUrl, familyId);
    // Aguarda um pouco entre requests
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('✅ Testes Completos!');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('\n📝 Próximos passos:');
  console.log('1. Acesse http://localhost:3000/dashboard/transactions');
  console.log('2. Filtre por Status "PENDING"');
  console.log('3. Confirme ou rejeite as transações');
  console.log('\n💡 Se algum teste falhar:');
  console.log('- Verifique se tem as contas "PicPay" e "Mercado Pago" criadas');
  console.log('- Consulte MACRODROID_SETUP.md para mais detalhes');
}

main();
