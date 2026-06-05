import { useNavigate } from 'react-router-dom';

export function AttendancePage() {
    const navigate = useNavigate();

    return (
        <div style={{ padding: '40px', background: '#F8FAFC', minHeight: '100vh' }}>
            <div style={{ marginBottom: '40px' }}>
                <h1
                    style={{
                        fontSize: '32px',
                        fontWeight: '800',
                        color: '#0F172A',
                        letterSpacing: '-0.5px',
                    }}
                >
                    Attendance Management
                </h1>
                <p style={{ fontSize: '15px', color: '#64748B', marginTop: '6px' }}>
                    Select student or teacher modules to track schedules, logs, and monthly reports
                </p>
            </div>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                    gap: '28px',
                    maxWidth: '900px',
                }}
            >
                {/* Student Attendance Card */}
                <div
                    onClick={() => navigate('/attendance/students')}
                    style={{
                        background: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: '24px',
                        padding: '40px 32px',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01)',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-6px)';
                        e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(168,85,247,0.1), 0 10px 10px -5px rgba(168,85,247,0.04)';
                        e.currentTarget.style.borderColor = '#C084FC';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01)';
                        e.currentTarget.style.borderColor = '#E2E8F0';
                    }}
                >
                    <div style={{
                        width: '64px', height: '64px', borderRadius: '18px',
                        background: 'linear-gradient(135deg, #F3E8FF, #E9D5FF)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '32px', marginBottom: '24px'
                    }}>
                        👨‍🎓
                    </div>
                    <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0F172A' }}>
                        Student Attendance
                    </h2>
                    <p style={{ fontSize: '14px', color: '#64748B', marginTop: '10px', lineHeight: '20px' }}>
                        View monthly attendance sheets, check roll logs, and input class-wise logs.
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '24px', fontSize: '13px', fontWeight: '600', color: '#A855F7' }}>
                        Open Module <span style={{ transition: 'transform 0.2s' }}>→</span>
                    </div>
                </div>

                {/* Teacher Attendance Card */}
                <div
                    onClick={() => navigate('/attendance/teachers')}
                    style={{
                        background: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: '24px',
                        padding: '40px 32px',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01)',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-6px)';
                        e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(236,72,153,0.1), 0 10px 10px -5px rgba(236,72,153,0.04)';
                        e.currentTarget.style.borderColor = '#F472B6';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01)';
                        e.currentTarget.style.borderColor = '#E2E8F0';
                    }}
                >
                    <div style={{
                        width: '64px', height: '64px', borderRadius: '18px',
                        background: 'linear-gradient(135deg, #FCE7F3, #FBCFE8)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '32px', marginBottom: '24px'
                    }}>
                        👨‍🏫
                    </div>
                    <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0F172A' }}>
                        Teacher Attendance
                    </h2>
                    <p style={{ fontSize: '14px', color: '#64748B', marginTop: '10px', lineHeight: '20px' }}>
                        Track teacher logs, review presence averages, and view monthly schedules.
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '24px', fontSize: '13px', fontWeight: '600', color: '#EC4899' }}>
                        Open Module <span>→</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
