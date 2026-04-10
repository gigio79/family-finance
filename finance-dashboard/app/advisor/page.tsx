import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdvisorPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <Bot className="h-8 w-8 text-primary" />
                    Consultor Financeiro IA
                </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle>Análise e Insights</CardTitle>
                        <CardDescription>
                            Análise inteligente dos seus hábitos financeiros e saúde econômica.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                            <div className="flex items-start gap-4">
                                <Sparkles className="h-5 w-5 text-yellow-500 mt-1" />
                                <div className="space-y-1">
                                    <h4 className="font-semibold">Alerta de Gastos: Alimentação</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Você gastou <b>15% a mais</b> em restaurantes este mês comparado à sua média. Considere cozinhar em casa neste fim de semana para equilibrar o orçamento.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                            <div className="flex items-start gap-4">
                                <Sparkles className="h-5 w-5 text-blue-500 mt-1" />
                                <div className="space-y-1">
                                    <h4 className="font-semibold">Otimização de Assinaturas</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Detectamos pagamentos recorrentes para <b>Netflix</b> e <b>Amazon Prime</b>. Você os utiliza frequentemente, então parecem ser um bom valor.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Perguntar ao Consultor</CardTitle>
                        <CardDescription>Obtenha conselhos financeiros personalizados</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Conectando ao banco de dados financeiro...
                            </p>
                            <Button className="w-full" disabled>
                                Iniciar Chat (Em Breve)
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
