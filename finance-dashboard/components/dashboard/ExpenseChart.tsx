"use client"

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ExpenseChartProps {
    data: Record<string, number>;
}

// Neon color palette for dark mode
const COLORS = [
    "#0075D9", // Primary Neon Blue
    "#00C6FF", // Sky Blue
    "#00E1FF", // Cyan
    "#0A1128", // Navy
    "#94A3B8", // Slate
    "#38BDF8", // Light Blue
    "#0EA5E9", // Ocean
    "#7DD3FC", // Pastel Blue
];

export function ExpenseChart({ data }: ExpenseChartProps) {
    const chartData = Object.entries(data).map(([name, value]) => ({
        name,
        value: Math.abs(value), // Ensure positive for pie chart
    })).sort((a, b) => b.value - a.value);

    return (
        <Card className="col-span-1 rounded-[24px] border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white overflow-hidden">
            <CardHeader>
                <CardTitle className="text-lg font-bold text-slate-800">Gastos por Categoria</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={90}
                            paddingAngle={8}
                            stroke="none"
                            dataKey="value"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={4} />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value: any) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0)}
                            contentStyle={{ 
                                backgroundColor: 'white', 
                                border: 'none', 
                                borderRadius: '16px',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                                padding: '12px'
                            }}
                            itemStyle={{ color: '#0A1128', fontWeight: 'bold' }}
                        />
                        <Legend iconType="circle" />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
