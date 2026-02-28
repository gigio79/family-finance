import React from 'react';

interface StatCardProps {
  icon: string;
  label: string;
  value: string;
  variant?: 'default' | 'positive' | 'negative';
  subtitle?: string;
  badge?: React.ReactNode;
}

export function StatCard({ icon, label, value, variant = 'default', subtitle, badge }: StatCardProps) {
  const variantClass = variant === 'positive' ? 'positive' : variant === 'negative' ? 'negative' : '';
  
  return (
    <div className={`stat-card ${variantClass}`}>
      <span className="stat-icon">{icon}</span>
      <div className="stat-label">{label}</div>
      <div className={`stat-value ${variantClass}`}>{value}</div>
      {subtitle && <div className="stat-change text-muted">{subtitle}</div>}
      {badge && <div className="stat-change">{badge}</div>}
    </div>
  );
}

interface LoadingSkeletonProps {
  height?: number | string;
  width?: number | string;
  borderRadius?: string;
}

export function LoadingSkeleton({ height = 120, width = '100%', borderRadius = 'var(--radius-lg)' }: LoadingSkeletonProps) {
  return (
    <div 
      className="skeleton" 
      style={{ height, width, borderRadius }} 
    />
  );
}

interface EmptyStateProps {
  icon: string;
  title: string;
  message: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="empty-state card">
      <div className="empty-state-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{message}</p>
      {action}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ 
  title = 'Erro', 
  message, 
  onRetry 
}: ErrorStateProps) {
  return (
    <div className="empty-state card">
      <div className="empty-state-icon">⚠️</div>
      <h3>{title}</h3>
      <p>{message}</p>
      {onRetry && (
        <button className="btn btn-primary" onClick={onRetry}>
          Tentar novamente
        </button>
      )}
    </div>
  );
}

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'pending';
  children: React.ReactNode;
}

export function Badge({ variant = 'default', children }: BadgeProps) {
  const variantClass = {
    default: '',
    success: 'badge-confirmed',
    warning: 'badge-pending',
    danger: 'badge-danger',
    pending: 'badge-pending'
  }[variant];

  return (
    <span className={`badge ${variantClass}`}>
      {children}
    </span>
  );
}
