import { useNavigate } from 'react-router-dom';

export function RoleSelectionPage() {
    const navigate = useNavigate();

    return (
        <div
            style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
            }}
        >
            <div style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
                {/* Logo */}
                <div
                    style={{
                        width: '100px',
                        height: '100px',
                        background: '#fff',
                        borderRadius: '50%',
                        margin: '0 auto 32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '48px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                    }}
                >
                    🏫
                </div>

                <h1
                    style={{
                        fontSize: '32px',
                        fontWeight: '700',
                        color: '#fff',
                        marginBottom: '12px',
                    }}
                >
                    Welcome
                </h1>
                <p
                    style={{
                        fontSize: '17px',
                        color: 'rgba(255,255,255,0.9)',
                        marginBottom: '48px',
                    }}
                >
                    Select your role to continue
                </p>

                {/* Parent/Student Button */}
                <button
                    onClick={() => navigate('/mobile/login/parent')}
                    style={{
                        width: '100%',
                        padding: '20px',
                        background: '#fff',
                        border: 'none',
                        borderRadius: '16px',
                        marginBottom: '16px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                        transition: 'transform 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                    <div style={{ fontSize: '48px', marginBottom: '8px' }}>👨‍👩‍👧‍👦</div>
                    <div style={{ fontSize: '21px', fontWeight: '700', color: '#1D1D1F' }}>
                        Parent / Student
                    </div>
                    <div style={{ fontSize: '14px', color: '#86868B', marginTop: '4px' }}>
                        View student progress & results
                    </div>
                </button>

                {/* Teacher Button */}
                <button
                    onClick={() => navigate('/mobile/login/teacher')}
                    style={{
                        width: '100%',
                        padding: '20px',
                        background: '#fff',
                        border: 'none',
                        borderRadius: '16px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                        transition: 'transform 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                    <div style={{ fontSize: '48px', marginBottom: '8px' }}>👨‍🏫</div>
                    <div style={{ fontSize: '21px', fontWeight: '700', color: '#1D1D1F' }}>
                        Teacher
                    </div>
                    <div style={{ fontSize: '14px', color: '#86868B', marginTop: '4px' }}>
                        Manage classes & attendance
                    </div>
                </button>
            </div>
        </div>
    );
}
