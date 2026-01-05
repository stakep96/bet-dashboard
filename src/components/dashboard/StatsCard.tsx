import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon?: ReactNode;
  className?: string;
  variant?: 'default' | 'success' | 'danger';
}

export function StatsCard({ 
  title, 
  value, 
  change, 
  changeLabel,
  icon,
  className,
  variant = 'default'
}: StatsCardProps) {
  const isPositive = change !== undefined && change >= 0;

  return (
    <div className={cn(
      "bg-card rounded-xl p-5 border border-border shadow-sm hover:shadow-md transition-shadow",
      className
    )}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
        )}
      </div>
      
      <div className="flex items-end justify-between">
        <div>
          <p className={cn(
            "text-2xl font-bold",
            variant === 'success' && "text-success",
            variant === 'danger' && "text-destructive"
          )}>
            {value}
          </p>
          
          {change !== undefined && (
            <div className="flex items-center gap-1.5 mt-1">
              <span className={cn(
                "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium",
                isPositive 
                  ? "bg-success/10 text-success" 
                  : "bg-destructive/10 text-destructive"
              )}>
                {isPositive ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {isPositive ? '+' : ''}{change.toFixed(2)}%
              </span>
              {changeLabel && (
                <span className="text-xs text-muted-foreground">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
