"use client"

import { useState } from 'react';
import { UploadArea } from '@/components/transactions/UploadArea';
import { ManualForm } from '@/components/transactions/ManualForm';
import { TransactionTable } from '@/components/transactions/TransactionTable';
import { SummaryCard } from '@/components/dashboard/SummaryCard';
import { ExpenseChart } from '@/components/dashboard/ExpenseChart';
import { NotificationReview } from '@/components/transactions/NotificationReview';
import { uploadFile, sendTransaction } from '@/lib/api';
import { DashboardData, Transaction } from '@/lib/types';
import {
  DollarSign,
  CreditCard,
  Wallet,
  TrendingUp,
  Activity,
  User,
  Sparkles
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);

  // Mock initial data or fetch from backend on load? 
  // Ideally fetch, but we rely on webhook response for update right now.

  const handleUpload = async (file: File) => {
    try {
      setLoading(true);
      const res = await uploadFile(file);
      setData(res);
    } catch (error) {
      console.error(error);
      alert('Falha ao processar o arquivo');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async (transaction: Partial<Transaction>) => {
    try {
      setLoading(true);
      const res = await sendTransaction(transaction);
      setData(res);
    } catch (error) {
      console.error(error);
      alert('Failed to save transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 lg:p-10 bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h2 className="text-4xl font-extrabold tracking-tighter text-slate-900">Dashboard</h2>
            <p className="text-slate-500 font-medium">Bem-vindo de volta, Giovanni.</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="bg-white border border-slate-100 shadow-sm text-slate-600 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Sincronizado
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Gastos Totais"
          value={data ? formatCurrency(data.dashboard.total_spending) : "R$ 0,00"}
          icon={DollarSign}
        />
        <SummaryCard
          title="Transações"
          value={data ? data.dashboard.transaction_count.toString() : "0"}
          icon={Activity}
        />
        <SummaryCard
          title="Categorias"
          value={data ? Object.keys(data.dashboard.spending_by_category).length.toString() : "0"}
          icon={TrendingUp}
        />
        <SummaryCard
          title="Saldo Estimado"
          value="R$ 12.450,00"
          icon={Wallet}
          description="+20.1% em relação ao mês anterior"
        />
      </div>

      {/* Seção de Revisão de Notificações */}
      <NotificationReview />

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <Tabs defaultValue="list" className="space-y-4">
            <TabsList className="bg-slate-100/50 p-1 rounded-full border border-slate-100">
              <TabsTrigger value="list" className="rounded-full px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary font-bold">Transações</TabsTrigger>
              <TabsTrigger value="analytics" className="rounded-full px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary font-bold">Análise Visual</TabsTrigger>
            </TabsList>
            <TabsContent value="list" className="space-y-4">
              <Card className="rounded-[32px] border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl font-bold text-slate-800">Histórico Recente</CardTitle>
                  <CardDescription>
                    Você realizou {data ? data.dashboard.transaction_count : 0} transações este mês.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TransactionTable transactions={data ? data.transactions : []} />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="analytics" className="space-y-4">
              <ExpenseChart data={data ? data.dashboard.spending_by_category : {}} />
            </TabsContent>
          </Tabs>
        </div>

        <div className="lg:col-span-3 space-y-4">
          <Card className="rounded-[32px] border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white overflow-hidden">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-slate-800">Lançamento Rápido</CardTitle>
              <CardDescription>Adicione manualmente ou via extrato</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs defaultValue="manual" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-slate-50 p-1 rounded-xl">
                  <TabsTrigger value="manual" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold">Manual</TabsTrigger>
                  <TabsTrigger value="upload" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold">Upload</TabsTrigger>
                </TabsList>
                <TabsContent value="manual" className="pt-4">
                  <ManualForm onSubmit={handleManualSubmit} isLoading={loading} />
                </TabsContent>
                <TabsContent value="upload" className="pt-4">
                  <UploadArea onUpload={handleUpload} isUploading={loading} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Placeholder for AI Advisor */}
          <Card className="rounded-[32px] border-none bg-gradient-to-br from-primary to-[#00C6FF] text-white shadow-xl shadow-primary/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform">
                <Sparkles className="h-24 w-24" />
            </div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-bold">
                Consultor Financeiro IA
              </CardTitle>
              <CardDescription className="text-white/80 font-medium">
                Receba insights exclusivos sobre seus gastos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-white/90 leading-relaxed">
                "Giovanni, notei que seus gastos com iFood aumentaram 15% este mês. Que tal um lembrete?"
              </p>
              <Button variant="secondary" className="w-full mt-6 rounded-full font-bold bg-white text-primary hover:bg-white/90">
                Ver Insights
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
