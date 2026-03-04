import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Home,
    Calendar,
    Users,
    UserCheck,
    ClipboardList,
    FileText,
    GraduationCap,
    Award,
    CreditCard,
    Settings,
    BookOpen,
    CalendarDays,
    TrendingUp
} from 'lucide-react';
// Context imports removed since logout was migrated to Settings
import './Sidebar.css';

interface NavItem {
    icon: React.ReactElement;
    label: string;
    path: string;
}

const navigationItems: NavItem[] = [
    { icon: <Home size={20} />, label: 'Dashboard', path: '/dashboard' },
    { icon: <Calendar size={20} />, label: 'Academic Years', path: '/academic-years' },
    { icon: <BookOpen size={20} />, label: 'Classes', path: '/classes' },
    { icon: <UserCheck size={20} />, label: 'Create Profile', path: '/create-profile' },
    { icon: <Users size={20} />, label: 'Students', path: '/students' },
    { icon: <GraduationCap size={20} />, label: 'Teachers', path: '/teachers' },
    { icon: <ClipboardList size={20} />, label: 'Attendance', path: '/attendance' },
    { icon: <BookOpen size={20} />, label: 'Homework', path: '/homework' },
    { icon: <FileText size={20} />, label: 'Exams', path: '/exams' },
    { icon: <FileText size={20} />, label: 'Marks', path: '/marks' },
    { icon: <TrendingUp size={20} />, label: 'Promotions', path: '/promotions' },
    { icon: <Award size={20} />, label: 'Certification', path: '/certification' },
    { icon: <CreditCard size={20} />, label: 'Billing', path: '/billing' },
    { icon: <CalendarDays size={20} />, label: 'Events & Calendar', path: '/events' },
    { icon: <Settings size={20} />, label: 'Settings', path: '/settings' },
];

export function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();

    const isActive = (path: string) => {
        return location.pathname === path;
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="logo-container">
                    <img
                        src="/src/assets/logo.jpeg"
                        alt="School Logo"
                        className="sidebar-logo"
                    />
                    <div className="school-info">
                        <h2 className="school-name">Grameen Krida vasati shale sharan sirasagi</h2>
                    </div>
                </div>
            </div>

            <nav className="sidebar-nav">
                {navigationItems.map((item) => (
                    <button
                        key={item.path}
                        className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                        onClick={() => navigate(item.path)}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        <span className="nav-label">{item.label}</span>
                    </button>
                ))}
            </nav>

            <div className="sidebar-footer">
                {/* User info and log-out removed per user request (now inside Settings) */}
            </div>
        </aside>
    );
}
