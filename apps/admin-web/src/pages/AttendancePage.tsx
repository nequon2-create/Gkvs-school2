import { useNavigate } from 'react-router-dom';

export function AttendancePage() {
    const navigate = useNavigate();

    return (
        <div style={{ padding: '32px' }}>
            <h1
                style={{
                    fontSize: '40px',
                    fontWeight: '700',
                    color: '#1D1D1F',
                    marginBottom: '40px',
                }}
            >
                Attendance Management
            </h1>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '24px',
                    maxWidth: '800px',
                }}
            >
                {/* Student Attendance Card */}
                <div
                    onClick={() => navigate('/attendance/students')}
                    style={{
                        background: '#fff',
                        border: '1px solid rgba(0,0,0,0.1)',
                        borderRadius: '18px',
                        padding: '40px',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                    }}
                >
                    <div style={{ fontSize: '64px', marginBottom: '16px' }}>👨🎓</div>
                    <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#1D1D1F' }}>
                        Student Attendance
                    </h2>
                    <p style={{ fontSize: '15px', color: '#86868B', marginTop: '8px' }}>
                        View and manage student attendance records
                    </p>
                </div>

                {/* Teacher Attendance Card */}
                <div
                    onClick={() => navigate('/attendance/teachers')}
                    style={{
                        background: '#fff',
                        border: '1px solid rgba(0,0,0,0.1)',
                        borderRadius: '18px',
                        padding: '40px',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                    }}
                >
                    <div style={{ fontSize: '64px', marginBottom: '16px' }}>👨🏫</div>
                    <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#1D1D1F' }}>
                        Teacher Attendance
                    </h2>
                    <p style={{ fontSize: '15px', color: '#86868B', marginTop: '8px' }}>
                        View and manage teacher attendance records
                    </p>
                </div>
            </div>
        </div>
    );
}
