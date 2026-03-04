import { useNavigate } from 'react-router-dom';

interface MobileBottomNavProps {
    active: 'home' | 'events' | 'exams' | 'profile' | 'attendance';
    role: 'parent' | 'teacher';
}

export function MobileBottomNav({ active, role }: MobileBottomNavProps) {
    const navigate = useNavigate();

    const parentTabs = [
        { id: 'home', icon: '🏠', label: 'Home', path: '/mobile/parent/home' },
        { id: 'events', icon: '📅', label: 'Events', path: '/mobile/parent/events' },
        { id: 'exams', icon: '📝', label: 'Exams', path: '/mobile/parent/exams' },
        { id: 'profile', icon: '👤', label: 'Profile', path: '/mobile/parent/profile' },
    ];

    const teacherTabs = [
        { id: 'home', icon: '🏠', label: 'Home', path: '/mobile/teacher/home' },
        { id: 'events', icon: '📅', label: 'Events', path: '/mobile/teacher/events' },
        { id: 'attendance', icon: '✅', label: 'Attendance', path: '/mobile/teacher/attendance' },
        { id: 'profile', icon: '👤', label: 'Profile', path: '/mobile/teacher/profile' },
    ];

    const tabs = role === 'parent' ? parentTabs : teacherTabs;

    return (
        <div
            style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                background: '#fff',
                borderTop: '1px solid #EFEFEF',
                display: 'flex',
                justifyContent: 'space-around',
                padding: '12px 0',
                boxShadow: '0 -2px 8px rgba(0,0,0,0.05)',
            }}
        >
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => navigate(tab.path)}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '8px 16px',
                    }}
                >
                    <span style={{ fontSize: '24px' }}>{tab.icon}</span>
                    <span
                        style={{
                            fontSize: '11px',
                            fontWeight: active === tab.id ? '600' : '400',
                            color: active === tab.id ? '#0071E3' : '#86868B',
                        }}
                    >
                        {tab.label}
                    </span>
                </button>
            ))}
        </div>
    );
}
