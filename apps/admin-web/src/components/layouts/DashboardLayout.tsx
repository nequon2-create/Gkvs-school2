import React from 'react';
import { Sidebar } from './Sidebar';
import './DashboardLayout.css';

export interface DashboardLayoutProps {
    children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="dashboard-main">
                <div className="dashboard-content">
                    {children}
                </div>
            </main>
        </div>
    );
}
