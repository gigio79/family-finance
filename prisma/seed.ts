import "dotenv/config";
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

async function main() {
    console.log('🌱 Testing database connection...');

    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL não está definida');
    }

    const connectionString = process.env.DATABASE_URL.includes('sslmode') 
        ? process.env.DATABASE_URL 
        : `${process.env.DATABASE_URL}?sslmode=require`;

    const pool = new Pool({ 
        connectionString,
        ssl: { 
            rejectUnauthorized: true 
        }
    });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    try {
        // Test connection
        await prisma.$connect();
        console.log('✅ Database connected successfully!');

        // Test simple query
        const families = await prisma.family.findMany();
        console.log(`📊 Found ${families.length} families`);

        // Seed initial data if empty
        if (families.length === 0) {
            console.log('🌱 Seeding initial data...');

            // Create a sample family
            const family = await prisma.family.create({
                data: {
                    name: 'Família Silva'
                }
            });
            console.log('✅ Created family:', family.name);

            // Create a user
            const user = await prisma.user.create({
                data: {
                    email: 'admin@silva.com',
                    name: 'João Silva',
                    password: '$2b$10$dummy.hash.for.demo', // dummy hash
                    role: 'ADMIN',
                    familyId: family.id,
                    points: 0,
                    streak: 0
                }
            });
            console.log('✅ Created user:', user.name);

            // Create categories
            const categories = await prisma.category.createMany({
                data: [
                    { name: 'Alimentação', type: 'EXPENSE', familyId: family.id },
                    { name: 'Transporte', type: 'EXPENSE', familyId: family.id },
                    { name: 'Salário', type: 'INCOME', familyId: family.id },
                    { name: 'Investimentos', type: 'INCOME', familyId: family.id }
                ]
            });
            console.log('✅ Created categories');

            // Create accounts
            const accounts = await prisma.account.createMany({
                data: [
                    { name: 'Conta Corrente', type: 'BANK', balance: 5000, familyId: family.id },
                    { name: 'Cartão de Crédito', type: 'CREDIT_CARD', balance: -1200, limit: 3000, familyId: family.id }
                ]
            });
            console.log('✅ Created accounts');

            console.log('🎉 Seeding completed!');
        } else {
            console.log('ℹ️ Database already has data, skipping seed');
        }

        console.log('🎉 Basic database test completed!');
    } catch (error) {
        console.error('❌ Database test failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

main()
    .catch(e => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    });
