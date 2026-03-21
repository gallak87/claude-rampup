import type { RiskLevel } from '../types/probe';

interface CardProps {
  level?: RiskLevel | 'neutral';
  className?: string;
  children: React.ReactNode;
}

export function Card({ level = 'neutral', className = '', children }: CardProps) {
  return (
    <div className={`card card--${level}${className ? ` ${className}` : ''}`}>
      {children}
    </div>
  );
}
