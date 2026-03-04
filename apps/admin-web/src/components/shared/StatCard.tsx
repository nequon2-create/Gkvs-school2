import type { LucideIcon } from 'lucide-react';
import './StatCard.css';

export interface StatCardProps {
    icon: LucideIcon;
    title: string;
    value: string | number;
    change?: number;
    trend?: 'up' | 'down' | 'neutral';
    loading?: boolean;
    color?: 'blue' | 'emerald' | 'amber' | 'red' | 'purple';
}

export function StatCard({
    icon: Icon,
    title,
    value,
    change,
    trend = 'neutral',
    loading = false,
    color = 'blue'
}: StatCardProps) {
    if (loading) {
        return (
            <div className="stat-card">
                <div className="stat-card-content">
                    <div className="skeleton" style={{ width: '48px', height: '48px', borderRadius: '12px' }} />
                    <div className="stat-info">
                        <div className="skeleton" style={{ width: '120px', height: '16px', marginBottom: '8px' }} />
                        <div className="skeleton" style={{ width: '80px', height: '32px', marginBottom: '4px' }} />
                        <div className="skeleton" style={{ width: '100px', height: '14px' }} />
                    </div>
                </div>
            </div>
        );
    }

    const getTrendIcon = () => {
        if (trend === 'up') return '↗';
        if (trend === 'down') return '↘';
        return '→';
    };

    const getTrendClass = () => {
        if (trend === 'up') return 'trend-up';
        if (trend === 'down') return 'trend-down';
        return 'trend-neutral';
    };

    return (
        <div className="stat-card animate-scale-in hover-lift">
            <div className="stat-card-content">
                <div className={`stat-icon stat-icon-${color}`}>
                    <Icon size={24} strokeWidth={2} />
                </div>
                <div className="stat-info">
                    <h3 className="stat-title">{title}</h3>
                    <p className="stat-value">{value}</p>
                    {change !== undefined && (
                        <span className={`stat-change ${getTrendClass()}`}>
                            <span className="trend-icon">{getTrendIcon()}</span>
                            {Math.abs(change)}% {trend === 'up' ? 'increase' : trend === 'down' ? 'decrease' : 'change'}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
