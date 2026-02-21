import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import bcrypt from 'bcryptjs';

const adapter = new PrismaLibSql({
    url: process.env.DATABASE_URL || 'file:./dev.db',
});

const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🌱 Seeding database...');

    // Clean existing data
    await prisma.chatMessage.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.achievement.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.budget.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();
    await prisma.family.deleteMany();

    const password = await bcrypt.hash('123456', 12);

    // Create family
    const family = await prisma.family.create({
        data: { name: 'Família Demo' },
    });

    // Create users
    const admin = await prisma.user.create({
        data: {
            name: 'João Silva',
            email: 'joao@demo.com',
            password,
            role: 'ADMIN',
            familyId: family.id,
            points: 150,
            streak: 5,
        },
    });

    const member = await prisma.user.create({
        data: {
            name: 'Maria Silva',
            email: 'maria@demo.com',
            password,
            role: 'MEMBER',
            familyId: family.id,
            points: 85,
            streak: 3,
        },
    });

    // Create categories
    const cats = await Promise.all([
        prisma.category.create({ data: { name: 'Alimentação', icon: '🍔', color: '#ef4444', familyId: family.id, rules: JSON.stringify(['restaurante', 'ifood', 'mercado', 'supermercado']) } }),
        prisma.category.create({ data: { name: 'Transporte', icon: '🚗', color: '#f59e0b', familyId: family.id, rules: JSON.stringify(['uber', '99', 'posto', 'combustível']) } }),
        prisma.category.create({ data: { name: 'Moradia', icon: '🏠', color: '#3b82f6', familyId: family.id, rules: JSON.stringify(['aluguel', 'condomínio', 'luz', 'água']) } }),
        prisma.category.create({ data: { name: 'Saúde', icon: '💊', color: '#10b981', familyId: family.id, rules: JSON.stringify(['farmácia', 'médico', 'hospital']) } }),
        prisma.category.create({ data: { name: 'Educação', icon: '📚', color: '#8b5cf6', familyId: family.id, rules: JSON.stringify(['escola', 'curso', 'livro']) } }),
        prisma.category.create({ data: { name: 'Lazer', icon: '🎮', color: '#ec4899', familyId: family.id, rules: JSON.stringify(['cinema', 'netflix', 'spotify']) } }),
        prisma.category.create({ data: { name: 'Salário', icon: '💰', color: '#22c55e', familyId: family.id, rules: JSON.stringify(['salário', 'pagamento']) } }),
        prisma.category.create({ data: { name: 'Outros', icon: '📦', color: '#6366f1', familyId: family.id, rules: JSON.stringify([]) } }),
    ]);

    const [alimentacao, transporte, moradia, saude, educacao, lazer, salario, outros] = cats;

    // Create current month transactions
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const transactions = [
        // Income
        { amount: 8500, description: 'Salário João', date: new Date(currentYear, currentMonth, 5), type: 'INCOME', categoryId: salario.id, userId: admin.id },
        { amount: 4200, description: 'Salário Maria', date: new Date(currentYear, currentMonth, 5), type: 'INCOME', categoryId: salario.id, userId: member.id },
        { amount: 1200, description: 'Freelance Design', date: new Date(currentYear, currentMonth, 15), type: 'INCOME', categoryId: salario.id, userId: admin.id },

        // Expenses
        { amount: 850, description: 'Supermercado Extra', date: new Date(currentYear, currentMonth, 3), type: 'EXPENSE', categoryId: alimentacao.id, userId: member.id },
        { amount: 120, description: 'iFood - Jantar', date: new Date(currentYear, currentMonth, 7), type: 'EXPENSE', categoryId: alimentacao.id, userId: admin.id },
        { amount: 65, description: 'Padaria São Jorge', date: new Date(currentYear, currentMonth, 10), type: 'EXPENSE', categoryId: alimentacao.id, userId: member.id },
        { amount: 280, description: 'Restaurante Sabor', date: new Date(currentYear, currentMonth, 14), type: 'EXPENSE', categoryId: alimentacao.id, userId: admin.id },
        { amount: 450, description: 'Supermercado Carrefour', date: new Date(currentYear, currentMonth, 18), type: 'EXPENSE', categoryId: alimentacao.id, userId: member.id },

        { amount: 250, description: 'Uber - Semana', date: new Date(currentYear, currentMonth, 6), type: 'EXPENSE', categoryId: transporte.id, userId: admin.id },
        { amount: 180, description: 'Combustível', date: new Date(currentYear, currentMonth, 12), type: 'EXPENSE', categoryId: transporte.id, userId: member.id },
        { amount: 45, description: 'Estacionamento', date: new Date(currentYear, currentMonth, 16), type: 'EXPENSE', categoryId: transporte.id, userId: admin.id },

        { amount: 2200, description: 'Aluguel', date: new Date(currentYear, currentMonth, 1), type: 'EXPENSE', categoryId: moradia.id, userId: admin.id, recurring: true },
        { amount: 550, description: 'Condomínio', date: new Date(currentYear, currentMonth, 1), type: 'EXPENSE', categoryId: moradia.id, userId: admin.id, recurring: true },
        { amount: 280, description: 'Luz / Energia', date: new Date(currentYear, currentMonth, 8), type: 'EXPENSE', categoryId: moradia.id, userId: admin.id },
        { amount: 95, description: 'Internet Fibra', date: new Date(currentYear, currentMonth, 10), type: 'EXPENSE', categoryId: moradia.id, userId: admin.id, recurring: true },

        { amount: 180, description: 'Farmácia Drogasil', date: new Date(currentYear, currentMonth, 9), type: 'EXPENSE', categoryId: saude.id, userId: member.id },
        { amount: 350, description: 'Consulta médica', date: new Date(currentYear, currentMonth, 13), type: 'EXPENSE', categoryId: saude.id, userId: admin.id },

        { amount: 250, description: 'Curso Online', date: new Date(currentYear, currentMonth, 4), type: 'EXPENSE', categoryId: educacao.id, userId: admin.id },

        { amount: 55, description: 'Netflix + Spotify', date: new Date(currentYear, currentMonth, 2), type: 'EXPENSE', categoryId: lazer.id, userId: admin.id, recurring: true },
        { amount: 120, description: 'Cinema + Pipoca', date: new Date(currentYear, currentMonth, 11), type: 'EXPENSE', categoryId: lazer.id, userId: member.id },
    ];

    // Previous month transactions (for CFO comparison)
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const prevTransactions = [
        { amount: 8500, description: 'Salário João', date: new Date(prevYear, prevMonth, 5), type: 'INCOME', categoryId: salario.id, userId: admin.id },
        { amount: 4200, description: 'Salário Maria', date: new Date(prevYear, prevMonth, 5), type: 'INCOME', categoryId: salario.id, userId: member.id },
        { amount: 700, description: 'Supermercado', date: new Date(prevYear, prevMonth, 3), type: 'EXPENSE', categoryId: alimentacao.id, userId: member.id },
        { amount: 100, description: 'iFood', date: new Date(prevYear, prevMonth, 8), type: 'EXPENSE', categoryId: alimentacao.id, userId: admin.id },
        { amount: 200, description: 'Uber', date: new Date(prevYear, prevMonth, 6), type: 'EXPENSE', categoryId: transporte.id, userId: admin.id },
        { amount: 2200, description: 'Aluguel', date: new Date(prevYear, prevMonth, 1), type: 'EXPENSE', categoryId: moradia.id, userId: admin.id },
        { amount: 550, description: 'Condomínio', date: new Date(prevYear, prevMonth, 1), type: 'EXPENSE', categoryId: moradia.id, userId: admin.id },
        { amount: 150, description: 'Farmácia', date: new Date(prevYear, prevMonth, 10), type: 'EXPENSE', categoryId: saude.id, userId: member.id },
        { amount: 55, description: 'Netflix + Spotify', date: new Date(prevYear, prevMonth, 2), type: 'EXPENSE', categoryId: lazer.id, userId: admin.id },
    ];

    for (const tx of [...transactions, ...prevTransactions]) {
        await prisma.transaction.create({
            data: {
                amount: tx.amount,
                description: tx.description,
                date: tx.date,
                type: tx.type,
                categoryId: tx.categoryId,
                userId: tx.userId,
                familyId: family.id,
                recurring: (tx as any).recurring || false,
                status: 'CONFIRMED',
                source: 'MANUAL',
            },
        });
    }

    // Create budgets
    const monthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    await prisma.budget.createMany({
        data: [
            { month: monthStr, limit: 2000, categoryId: alimentacao.id, familyId: family.id },
            { month: monthStr, limit: 600, categoryId: transporte.id, familyId: family.id },
            { month: monthStr, limit: 3500, categoryId: moradia.id, familyId: family.id },
            { month: monthStr, limit: 800, categoryId: saude.id, familyId: family.id },
            { month: monthStr, limit: 300, categoryId: lazer.id, familyId: family.id },
        ],
    });

    // Create achievements
    await prisma.achievement.create({
        data: { type: 'RECORDER', name: 'Registrador', icon: '📝', userId: admin.id },
    });

    console.log('✅ Seed complete!');
    console.log('');
    console.log('📧 Demo accounts:');
    console.log('   Admin: joao@demo.com / 123456');
    console.log('   Membro: maria@demo.com / 123456');
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
