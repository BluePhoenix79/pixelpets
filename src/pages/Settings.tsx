import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [username, setUsername] = useState(user?.user_metadata?.username || '');
    const [theme, setTheme] = useState(localStorage.getItem('theme-preference') || 'system');

    const handleSave = async () => {
        await supabase.auth.updateUser({
            data: { username }
        });
        alert('Saved!');
    };

    const handleThemeChange = (newTheme: string) => {
        setTheme(newTheme);
        localStorage.setItem('theme-preference', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
        if (newTheme === 'system') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '1rem' }} className="settings-container">
            <header className="title">
                <h1>Settings</h1>
            </header>
            <div className="setting-card">
                <div className="form-group">
                    <label>Username</label>
                    <input value={username} onChange={e => setUsername(e.target.value)} />
                </div>
                <div className="form-group">
                    <label>Theme</label>
                    <select value={theme} onChange={e => handleThemeChange(e.target.value)}>
                        <option value="system">System</option>
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                    </select>
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button className="inline-btn" onClick={handleSave}>Save Profile</button>
                    <button className="inline-btn" onClick={() => navigate('/dashboard')}>Back</button>
                </div>
            </div>
        </div>
    );
};

export default Settings;
