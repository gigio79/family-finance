-- Migration: Add credit card fields to Account
-- Created at: 2026-02-27

-- Add credit card fields to Account table
ALTER TABLE "Account" ADD COLUMN "limit" DOUBLE PRECISION;
ALTER TABLE "Account" ADD COLUMN "closingDay" INTEGER;
ALTER TABLE "Account" ADD COLUMN "dueDay" INTEGER;

-- Drop old CreditCard table if exists and migrate data to Account
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'CreditCard') THEN
        -- Insert credit cards as accounts
        INSERT INTO "Account" (id, name, "type", "limit", "closingDay", "dueDay", "color", "icon", "familyId", "createdAt")
        SELECT id, name, 'CREDIT_CARD', "limit", "closingDay", "dueDay", "color", "icon", "familyId", "createdAt"
        FROM "CreditCard"
        ON CONFLICT DO NOTHING;
        
        -- Update transactions to use accountId instead of creditCardId
        UPDATE "Transaction" t
        SET "accountId" = c.id
        FROM "CreditCard" c
        WHERE t."creditCardId" = c.id;
        
        -- Drop old columns from Transaction
        ALTER TABLE "Transaction" DROP COLUMN IF EXISTS "creditCardId";
        ALTER TABLE "Transaction" DROP COLUMN IF EXISTS "isCreditCardExpense";
        
        -- Drop CreditCard table
        DROP TABLE IF EXISTS "CreditCard";
    END IF;
END
$$;

-- Create index on account type
CREATE INDEX IF NOT EXISTS "Account_type_idx" ON "Account" ("type");
