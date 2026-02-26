import { useState, useEffect, useCallback } from 'react';

export interface DashboardData {
  income: number;
  expenses: number;
  balance: number;
  categoryBreakdown: CategoryBreakdown[];
  monthlyTrend: MonthlyTrend[];
  projectedBalance: number;
  futureInstallments?: FutureInstallment[];
  currentMonthInstallments?: number;
  pendingCount: number;
  transactionCount: number;
}

export interface CategoryBreakdown {
  name: string;
  total: number;
  color: string;
  icon: string;
}

export interface MonthlyTrend {
  month: string;
  income: number;
  expenses: number;
  balance: number;
}

export interface FutureInstallment {
  month: string;
  amount: number;
}

export interface UseDashboardReturn {
  data: DashboardData | null;
  error: string | null;
  isLoading: boolean;
  refetch: () => void;
}

export function useDashboard(): UseDashboardReturn {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/dashboard', {
        credentials: 'include'
      });
      
      console.log('Dashboard response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Dashboard error response:', errorText);
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.error || `Erro ${response.status}`);
        } catch {
          throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }
      }
      
      const result = await response.json();
      
      console.log('Dashboard result received');
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Dashboard fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    error,
    isLoading,
    refetch: fetchData
  };
}

export function useFetch<T>(url: string): {
  data: T | null;
  error: string | null;
  isLoading: boolean;
  refetch: () => void;
} {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [url]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, error, isLoading, refetch: fetchData };
}
