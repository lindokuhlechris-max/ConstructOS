import React from 'react';
import { Card, CardContent, cn } from './ui';
import { LucideIcon } from 'lucide-react';

export interface KPIMetric {
  id?: string;
  label: string;
  value: string | number;
  subtext?: string;
  subtextColor?: string;
  icon?: LucideIcon | React.ComponentType<{ className?: string }> | React.ReactNode;
  iconBgColor?: string;
  iconColor?: string;
  trend?: {
    value: string;
    direction?: 'up' | 'down' | 'neutral';
    color?: string;
  };
}

export interface KPIGridProps {
  metrics: KPIMetric[];
  className?: string;
  onMetricClick?: (metric: KPIMetric) => void;
}

export function KPIGrid({ metrics, className, onMetricClick }: KPIGridProps) {
  return (
    <div className={cn("grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3", className)}>
      {metrics.map((metric, idx) => {
        const renderIcon = () => {
          if (!metric.icon) return null;
          if (React.isValidElement(metric.icon)) {
            return metric.icon;
          }
          const IconComp = metric.icon as React.ComponentType<{ className?: string }>;
          return <IconComp className={`h-3.5 w-3.5 ${metric.iconColor || 'text-[#0B5FFF]'}`} />;
        };

        return (
          <Card 
            key={metric.id || idx} 
            onClick={() => onMetricClick?.(metric)}
            className={cn(
              "transition-all duration-200 border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl overflow-hidden",
              onMetricClick ? "cursor-pointer hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800" : ""
            )}
          >
            <CardContent className="p-3.5 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <p className="text-[10px] text-gray-500 dark:text-slate-400 font-bold uppercase tracking-wider truncate">
                  {metric.label}
                </p>
                {metric.icon && (
                  <div className={`p-1 rounded-lg flex items-center justify-center shrink-0 ${metric.iconBgColor || 'bg-blue-50 dark:bg-blue-950/40'}`}>
                    {renderIcon()}
                  </div>
                )}
              </div>

              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
                  {metric.value}
                </span>

                {metric.trend && (
                  <span className={`text-xs font-semibold ${metric.trend.color || 'text-[#0B5FFF]'}`}>
                    {metric.trend.value}
                  </span>
                )}
              </div>

              {metric.subtext && (
                <p className={`text-[11px] font-medium mt-1 ${metric.subtextColor || 'text-slate-500 dark:text-slate-400'}`}>
                  {metric.subtext}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
