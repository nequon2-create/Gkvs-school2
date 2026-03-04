import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './LoginPage.css'; // Reuse the same styles

export function SignUpPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const { signUp } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        // Validation
        if (password !== confirmPassword) {
            setError('❌ Passwords do not match. Please try again.');
            return;
        }

        if (password.length < 6) {
            setError('❌ Password must be at least 6 characters long.');
            return;
        }

        setLoading(true);

        try {
            await signUp(email, password, fullName);

            // Success - show message and redirect
            console.log('✅ Sign up successful!');
            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 2000);

        } catch (err: any) {
            console.error('❌ Sign up error:', err);

            // Provide specific error messages
            if (err.message?.includes('already registered') || err.message?.includes('already been registered')) {
                setError('❌ This email is already registered. Please sign in instead.');
            } else if (err.message?.includes('Invalid email')) {
                setError('❌ Please provide a valid email address.');
            } else if (err.message?.includes('Password should be')) {
                setError('❌ Password must be at least 6 characters with a mix of letters and numbers.');
            } else {
                setError(`❌ ${err.message || 'Failed to create account. Please try again.'}`);
            }
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <img
                        src="/src/assets/logo.jpeg"
                        alt="School Logo"
                        className="school-logo"
                    />
                    <h1>Grameen Krida vasati shale sharan sirasagi</h1>
                    <p className="location">{import.meta.env.VITE_SCHOOL_LOCATION}</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <h2>Create Admin Account</h2>

                    {error && <div className="error-message">{error}</div>}
                    {success && <div className="success-message">✅ Account created! Redirecting to login...</div>}

                    <div className="form-group">
                        <label htmlFor="fullName">Full Name (Optional)</label>
                        <input
                            id="fullName"
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Enter your full name"
                            autoComplete="name"
                            disabled={loading || success}
                        />
                    </div>

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
                            disabled={loading || success}
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
                            placeholder="At least 8 characters"
                            autoComplete="new-password"
                            disabled={loading || success}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            placeholder="Re-enter your password"
                            autoComplete="new-password"
                            disabled={loading || success}
                        />
                    </div>

                    <button
                        type="submit"
                        className="login-button"
                        disabled={loading || success}
                    >
                        {loading ? 'Creating account...' : success ? 'Success!' : 'Sign Up'}
                    </button>

                    <div className="auth-links">
                        <p>
                            Already have an account? <Link to="/login">Sign In</Link>
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
