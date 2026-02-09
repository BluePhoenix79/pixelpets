import { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import styles from './Auth.module.css'; // Reuse Auth styles
import dogImg from '../../assets/dog.png';

export default function CompleteProfile() {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { user, refreshProfile, hasProfile, loading } = useAuth();
  const navigate = useNavigate();

  // Effect to redirect if already has profile
  useEffect(() => {
      if (hasProfile && !loading) {
          navigate('/dashboard', { replace: true });
      }
  }, [hasProfile, loading, navigate]);

  if (loading || hasProfile) {
      return (
        <div className={styles.authPage}>
          <div style={{ color: 'white', textAlign: 'center', marginTop: '20vh' }}>
            <h2>Loading...</h2>
          </div>
        </div>
      );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Username is required');
      return;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    setIsLoading(true);

    try {
      if (!user) throw new Error('No user found');

      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          username: username.trim(),
          show_on_leaderboard: true
        });

      if (updateError) throw updateError;

      // check if wallet exists, if not create it
      const { data: wallet } = await supabase
        .from('user_finances')
        .select('user_id')
        .eq('user_id', user.id)
        .single();
      
      if (!wallet) {
          await supabase.from('user_finances').insert({
              user_id: user.id,
              balance: 100 // Starting balance
          });
      }

      // Refresh auth context to know we have a profile now
      await refreshProfile();
      
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Profile completion error:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.splitScreen} style={{ maxWidth: '600px', minHeight: 'auto' }}>
        <div className={styles.leftPanel}>
          <div className={styles.authHeader}>
             <img src={dogImg} alt="Pixel Pet" className={styles.petIcon} style={{ margin: '0 auto 20px', display: 'block' }} />
             <h1>One Last Step!</h1>
             <p className={styles.subtitle}>Choose a username to start your adventure.</p>
          </div>

          <form className={styles.authForm} onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="username">USERNAME</label>
              <input 
                id="username" 
                type="text" 
                required 
                placeholder="PixelMaster99"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
              />
            </div>

            {error && (
                <div className={`${styles.message} ${styles.error}`} style={{ marginBottom: '20px' }}>
                    {error}
                </div>
            )}

            <button type="submit" className={styles.submitBtn} disabled={isLoading}>
              {isLoading ? 'Setting up...' : 'Start Playing'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
