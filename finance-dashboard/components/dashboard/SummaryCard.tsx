import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface SummaryCardProps {
    title: string;
    value: string;
    icon: LucideIcon;
    description?: string;
    trend?: string; // e.g. "+12% from last month"
}

export function SummaryCard({ title, value, icon: Icon, description }: SummaryCardProps) {
    return (
        <Card className="rounded-[24px] border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white overflow-hidden transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                    {title}
                </CardTitle>
                <div className="bg-primary/10 p-2 rounded-full">
                    <Icon className="h-4 w-4 text-primary" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold text-slate-900">{value}</div>
                {description && (
                    <p className="text-xs text-slate-400 mt-1">
                        {description}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
