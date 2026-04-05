import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseNotificationWithAI } from '@/lib/notification-parser';

/**
 * Webhook para receber notificações do Macrodroid
 * Esperado: POST /api/webhooks/notifications
 * Body: { title: string, text: string, appPackage: string, familyId: string, apiKey?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, text, appPackage, familyId, apiKey } = body;

    if (!text || !familyId) {
      return NextResponse.json(
        { error: 'text e familyId são obrigatórios' },
        { status: 400 }
      );
    }

    // Valida a família existe
    const family = await prisma.family.findUnique({
      where: { id: familyId }
    });

    if (!family) {
      return NextResponse.json(
        { error: 'Família não encontrada' },
        { status: 404 }
      );
    }

    // Encontra um usuário admin da família para atribuir a transação
    const adminUser = await prisma.user.findFirst({
      where: {
        familyId,
        role: 'ADMIN'
      }
    });

    if (!adminUser) {
      return NextResponse.json(
        { error: 'Nenhum usuário ADMIN encontrado na família' },
        { status: 400 }
      );
    }

    // Combina título + texto para análise
    const fullNotification = `${title || ''}${title ? ' - ' : ''}${text}`.trim();

    // Parse com IA
    const parsedData = await parseNotificationWithAI(fullNotification, appPackage || '');

    if (!parsedData) {
      return NextResponse.json(
        { error: 'Não foi possível interpretar a notificação' },
        { status: 400 }
      );
    }

    // Encontra a conta (PicPay, Mercado Pago, etc)
    const account = await prisma.account.findFirst({
      where: {
        familyId,
        name: {
          contains: parsedData.accountName,
          mode: 'insensitive'
        }
      }
    });

    if (!account) {
      return NextResponse.json(
        { 
          error: `Conta "${parsedData.accountName}" não encontrada. Crie a conta primeiro.`,
          parsed: parsedData,
          nextSteps: [
            '1. Crie uma conta com o nome reconhecido (PicPay, Mercado Pago, etc)',
            '2. Tente enviar a notificação novamente'
          ]
        },
        { status: 404 }
      );
    }

    // Encontra a categoria (opcional)
    let categoryId: string | undefined;
    if (parsedData.category) {
      const category = await prisma.category.findFirst({
        where: {
          familyId,
          name: {
            contains: parsedData.category,
            mode: 'insensitive'
          }
        }
      });
      categoryId = category?.id;
    }

    // Cria a transação como PENDING (precisa revisar antes de confirmar)
    const transaction = await prisma.transaction.create({
      data: {
        familyId,
        userId: adminUser.id,
        accountId: account.id,
        categoryId,
        type: parsedData.type,
        amount: parsedData.amount,
        description: parsedData.description,
        date: new Date(),
        status: 'PENDING', // Para revisar depois
        source: 'NOTIFICATION' // Rastreia origem da notificação
        // metadata será adicionado após migration
      }
    });

    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.id,
        description: transaction.description,
        amount: transaction.amount,
        type: transaction.type,
        status: transaction.status,
        account: account.name,
        category: parsedData.category,
        person: parsedData.person,
        confidence: parsedData.confidence
      },
      message: 'Transação criada como PENDING. Revise no app antes de confirmar.'
    }, { status: 201 });

  } catch (error) {
    console.error('Erro ao processar notificação:', error);
    return NextResponse.json(
      { error: 'Erro ao processar notificação', details: String(error) },
      { status: 500 }
    );
  }
}
