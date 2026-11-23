import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverable = false,
  padding = 'md',
  onClick
}) => {
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border border-mindora-border shadow-soft ${
        hoverable ? 'transition-card hover:border-mindora-primary/30' : ''
      } ${paddingStyles[padding]} ${className}`}
    >
      {children}
    </div>
  );
};
