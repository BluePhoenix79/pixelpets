import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Auth = () => {
    const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        setLoading(true);

        try {
            if (activeTab === 'login') {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                // Navigation handled by useEffect
            } else {
                if (password.length < 6) {
                    throw new Error('Password must be at least 6 characters');
                }
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                setMessage({ text: 'Account created! Logging you in...', type: 'success' });
            }
        } catch (err: any) {
            setMessage({ text: err.message, type: 'error' });
            setLoading(false);
        }
    };

    return (
        <main>
            <section id="controls" aria-label="Authentication">
                <div id="auth-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'login' ? 'active' : ''}`}
                        onClick={() => setActiveTab('login')}
                    >
                        Login
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'signup' ? 'active' : ''}`}
                        onClick={() => setActiveTab('signup')}
                    >
                        Sign Up
                    </button>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            required
                            placeholder="Enter your email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            required
                            placeholder={activeTab === 'signup' ? "Create a password (min 6 characters)" : "Enter your password"}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                    </div>

                    <button type="submit" disabled={loading}>
                        {loading ? 'Processing...' : (activeTab === 'login' ? 'Login' : 'Create Account')}
                    </button>

                    {message && (
                        <div className={`message ${message.type}`} style={{ display: 'block' }}>
                            {message.text}
                        </div>
                    )}
                </form>
            </section>
        </main>
    )
}
export default Auth;
