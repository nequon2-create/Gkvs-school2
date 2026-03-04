import { Outlet } from 'react-router-dom';
import { DashboardLayout } from './DashboardLayout';

export function DashboardRouteLayout() {
    return (
        <DashboardLayout>
            <Outlet />
        </DashboardLayout>
    );
}
