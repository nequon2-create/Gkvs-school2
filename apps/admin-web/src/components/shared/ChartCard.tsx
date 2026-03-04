import React from 'react';
import './ChartCard.css';

export interface ChartCardProps {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    loading?: boolean;
    error?: string;
    actions?: React.ReactNode;
}

export function ChartCard({
    title,
    subtitle,
    children,
    loading = false,
    error,
    actions
}: ChartCardProps) {
    return (
        <div className="chart-card animate-fade-in hover-lift">
            <div className="chart-card-header">
                <div className="chart-card-title-group">
                    <h3 className="chart-card-title">{title}</h3>
                    {subtitle && <p className="chart-card-subtitle">{subtitle}</p>}
                </div>
                {actions && <div className="chart-card-actions">{actions}</div>}
            </div>

            <div className="chart-card-content">
                {loading ? (
                    <div className="chart-loading">
                        <div className="skeleton" style={{ width: '100%', height: '200px' }} />
                    </div>
                ) : error ? (
                    <div className="chart-error">
                        <span className="error-icon">⚠️</span>
                        <p>{error}</p>
                    </div>
                ) : (
                    children
                )}
            </div>
        </div>
    );
}
