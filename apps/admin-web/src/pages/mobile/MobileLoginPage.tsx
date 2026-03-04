import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export function MobileLoginPage() {
    const { role } = useParams<{ role: 'parent' | 'teacher' }>();
    const navigate = useNavigate();
    const [registrationNumber, setRegistrationNumber] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Find user by registration number
            const table = role === 'parent' ? 'students' : 'teachers';
            const { data: userData } = await supabase
                .from(table)
                .select('user_id, id, full_name')
                .eq('registration_number', registrationNumber)
                .single();

            if (!userData) {
                setError('Invalid registration number');
                setLoading(false);
                return;
            }

            // Login with Supabase auth (you'll need to get email from user_id)
            // For now, simulating login
            console.log('✅ Login successful:', userData);

            // Store in localStorage
            localStorage.setItem('mobile_user', JSON.stringify({
                role,
                id: userData.id,
                name: userData.full_name,
            }));

            // Navigate to respective app
            if (role === 'parent') {
                navigate('/mobile/parent/home');
            } else {
                navigate('/mobile/teacher/home');
            }
        } catch (err: any) {
            console.error('Login error:', err);
            setError('Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

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
            <div
                style={{
                    background: '#fff',
                    borderRadius: '24px',
                    padding: '40px',
                    maxWidth: '400px',
                    width: '100%',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                }}
            >
                {/* Back Button */}
                <button
                    onClick={() => navigate('/mobile')}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#0071E3',
                        fontSize: '15px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        marginBottom: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                    }}
                >
                    ← Back
                </button>

                {/* Icon */}
                <div
                    style={{
                        fontSize: '64px',
                        textAlign: 'center',
                        marginBottom: '24px',
                    }}
                >
                    {role === 'parent' ? '👨‍👩‍👧‍👦' : '👨‍🏫'}
                </div>

                <h1
                    style={{
                        fontSize: '28px',
                        fontWeight: '700',
                        color: '#1D1D1F',
                        textAlign: 'center',
                        marginBottom: '8px',
                    }}
                >
                    {role === 'parent' ? 'Parent Login' : 'Teacher Login'}
                </h1>
                <p
                    style={{
                        fontSize: '15px',
                        color: '#86868B',
                        textAlign: 'center',
                        marginBottom: '32px',
                    }}
                >
                    Enter your credentials to continue
                </p>

                <form onSubmit={handleLogin}>
                    {/* Registration Number */}
                    <div style={{ marginBottom: '20px' }}>
                        <label
                            style={{
                                display: 'block',
                                fontSize: '13px',
                                fontWeight: '600',
                                color: '#1D1D1F',
                                marginBottom: '8px',
                            }}
                        >
                            Registration Number
                        </label>
                        <input
                            type="text"
                            value={registrationNumber}
                            onChange={(e) => setRegistrationNumber(e.target.value)}
                            placeholder={role === 'parent' ? 'STU001' : 'TR001'}
                            required
                            style={{
                                width: '100%',
                                height: '48px',
                                padding: '0 16px',
                                border: '1px solid rgba(0,0,0,0.1)',
                                borderRadius: '12px',
                                fontSize: '15px',
                            }}
                        />
                    </div>

                    {/* Password */}
                    <div style={{ marginBottom: '24px' }}>
                        <label
                            style={{
                                display: 'block',
                                fontSize: '13px',
                                fontWeight: '600',
                                color: '#1D1D1F',
                                marginBottom: '8px',
                            }}
                        >
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password"
                            required
                            style={{
                                width: '100%',
                                height: '48px',
                                padding: '0 16px',
                                border: '1px solid rgba(0,0,0,0.1)',
                                borderRadius: '12px',
                                fontSize: '15px',
                            }}
                        />
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div
                            style={{
                                padding: '12px',
                                background: '#FFE5E5',
                                borderRadius: '8px',
                                color: '#FF453A',
                                fontSize: '14px',
                                marginBottom: '20px',
                            }}
                        >
                            {error}
                        </div>
                    )}

                    {/* Login Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            height: '52px',
                            background: loading ? '#86868B' : '#0071E3',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '980px',
                            fontSize: '17px',
                            fontWeight: '600',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            boxShadow: '0 4px 12px rgba(0,113,227,0.3)',
                        }}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    );
}
