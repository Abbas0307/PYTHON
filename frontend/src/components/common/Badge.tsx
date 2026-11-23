import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'violet' | 'emerald' | 'amber' | 'rose' | 'slate' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'violet',
  size = 'md',
  className = '',
  icon
}) => {
  const variantStyles = {
    violet: 'bg-mindora-lavender text-mindora-primary border border-mindora-primary/20',
    emerald: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border border-amber-200',
    rose: 'bg-rose-50 text-rose-700 border border-rose-200',
    slate: 'bg-slate-100 text-slate-700 border border-slate-200',
    neutral: 'bg-white text-mindora-darkText border border-mindora-border shadow-sm'
  };

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-0.5 rounded-full font-medium',
    md: 'text-xs px-3 py-1 rounded-full font-semibold tracking-wide'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}>
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
};
