export interface Transaction {
    date: string;
    amount: number;
    description: string;
    category: string;
    source?: 'csv' | 'pdf' | 'manual' | 'openfinance';
    type?: string;
    usuario?: string;
}

export interface DashboardData {
    dashboard: {
        total_spending: number;
        spending_by_category: Record<string, number>;
        transaction_count: number;
        generated_at: string;
    };
    transactions: Transaction[];
}
