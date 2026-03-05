import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './LoginPage.css';

export function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signIn } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            console.log('🔐 Starting sign in process...');
            await signIn(email, password);

            // Success - signIn now waits for user data to be loaded
            console.log('✅ Sign in successful, user data loaded, navigating to dashboard...');
            navigate('/dashboard');

        } catch (err: any) {
            console.error('❌ Sign in error:', err);

            // Provide specific error messages
            if (err.message?.includes('Invalid login credentials')) {
                setError('❌ Invalid email or password. Please check and try again.');
            } else if (err.message?.includes('Email not confirmed')) {
                setError('❌ Please confirm your email address before logging in.');
            } else if (err.message?.includes('Invalid API key')) {
                setError('❌ System configuration error. Please contact administrator.');
            } else if (err.message?.includes('User not found')) {
                setError('❌ No account found with this email address.');
            } else {
                setError(`❌ ${err.message || 'Failed to sign in. Please try again.'}`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <img
                        src="/logo.jpeg"
                        alt="School Logo"
                        className="school-logo"
                    />
                    <h1>Grameen Krida vasati shale sharan sirasagi</h1>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <h2>Admin Login</h2>

                    {error && <div className="error-message">{error}</div>}

                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="admin@gkvsschool.com"
                            autoComplete="email"
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Enter your password"
                            autoComplete="current-password"
                            disabled={loading}
                        />
                    </div>

                    <button
                        type="submit"
                        className="login-button"
                        disabled={loading}
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>

                    <a href="/forgot-password" className="forgot-password">
                        Forgot Password?
                    </a>

                    <div className="auth-links">
                        <p>
                            Don't have an account? <Link to="/signup">Sign Up</Link>
                        </p>
                    </div>
                </form>

                <div className="login-footer">
                    <p className="help-text">
                        <strong>Need help?</strong> Contact your system administrator.
                    </p>
                </div>
            </div>
        </div>
    );
}
