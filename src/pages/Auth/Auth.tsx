import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import dogImg from '../../assets/dog.png';
import catImg from '../../assets/cat.png';
import birdImg from '../../assets/bird.png';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import styles from './Auth.module.css';

type AuthTab = 'login' | 'signup';

interface MessageState {
  text: string;
  type: 'error' | 'success' | '';
}

export default function Auth() {
  const [activeTab, setActiveTab] = useState<AuthTab>('login');
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState<MessageState>({ text: '', type: '' });
  const [isLoading, setIsLoading] = useState(false);
  
  const { signIn, signUp, loginAsGuest } = useAuth(); // Destructure loginAsGuest
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  const navigate = useNavigate();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });
    setIsLoading(true);

    const { error } = await signIn(loginEmail, loginPassword);

    if (error) {
      setMessage({ text: error.message, type: 'error' });
    } else {
      navigate('/dashboard');
    }
    setIsLoading(false);
  };
 
// ... (skip down to render)



  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    if (!username.trim()) {
      setMessage({ text: 'Username is required', type: 'error' });
      return;
    }

    if (signupPassword.length < 6) {
      setMessage({ text: 'Password must be at least 6 characters', type: 'error' });
      return;
    }

    setIsLoading(true);
    const { error } = await signUp(signupEmail, signupPassword, username);

    if (error) {
      setMessage({ text: error.message, type: 'error' });
    } else {
      setMessage({ text: 'Account created! Logging you in...', type: 'success' });
      navigate('/dashboard');
    }
    setIsLoading(false);
  };

  const handleGoogleLogin = async () => {
    console.log("Initiating Google Login...");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      if (error) {
        console.error("Google Auth Error:", error);
        throw error;
      }
    } catch (error: any) {
      console.error("Catch Error:", error);
      setMessage({ text: `Auth Error: ${error.message || 'Check console'}`, type: 'error' });
    }
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.splitScreen}>
        
        {/* Left Panel - Auth Form */}
        <div className={styles.leftPanel}>
          <div className={styles.authHeader}>
            <div className={styles.petIcons}>
               <img src={dogImg} className={styles.petIcon} alt="dog" style={{ animationDelay: '0s' }} />
               <img src={catImg} className={styles.petIcon} alt="cat" style={{ animationDelay: '1s' }} />
               <img src={birdImg} className={styles.petIcon} alt="bird" style={{ animationDelay: '2s' }} />
            </div>
            <h1>PixelPets</h1>
            <p className={styles.subtitle}>Your digital companion awaits</p>
          </div>

          <div className={`${styles.authTabs} ${activeTab === 'signup' ? styles.switched : ''}`}>
            <div className={styles.tabSlider} style={{ transform: activeTab === 'login' ? 'translateX(0)' : 'translateX(100%)' }} />
            <button 
              className={`${styles.tabBtn} ${activeTab === 'login' ? styles.active : ''}`}
              onClick={() => { setActiveTab('login'); setMessage({ text: '', type: '' }); }}
            >
              Login
            </button>
            <button 
              className={`${styles.tabBtn} ${activeTab === 'signup' ? styles.active : ''}`}
              onClick={() => { setActiveTab('signup'); setMessage({ text: '', type: '' }); }}
            >
              Sign Up
            </button>
          </div>

          {activeTab === 'login' && (
            <form className={styles.authForm} onSubmit={handleLogin}>
              <div className={styles.formGroup}>
                <label htmlFor="login-email">EMAIL</label>
                <input 
                  id="login-email" 
                  type="email" 
                  required 
                  placeholder="name@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="login-password">PASSWORD</label>
                <input 
                  id="login-password" 
                  type="password" 
                  required 
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
              </div>

              <button type="submit" className={styles.submitBtn} disabled={isLoading}>
                {isLoading ? 'Logging in...' : 'Sign In'}
              </button>
            </form>
          )}

          {activeTab === 'signup' && (
            <form className={styles.authForm} onSubmit={handleSignup}>
              <div className={styles.formGroup}>
                <label htmlFor="signup-username">USERNAME</label>
                <input 
                  id="signup-username" 
                  type="text" 
                  required 
                  placeholder="PixelMaster99"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="signup-email">EMAIL</label>
                <input 
                  id="signup-email" 
                  type="email" 
                  required 
                  placeholder="name@example.com"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="signup-password">PASSWORD</label>
                <input 
                  id="signup-password" 
                  type="password" 
                  required 
                  placeholder="Create a password (min 6 characters)"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                />
              </div>

              <button type="submit" className={styles.submitBtn} disabled={isLoading}>
                {isLoading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          )}

          {message.text && (
            <div className={`${styles.message} ${styles[message.type]}`}>
              {message.type === 'error' && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="15" y1="9" x2="9" y2="15"></line>
                      <line x1="9" y1="9" x2="15" y2="15"></line>
                  </svg>
              )}
              {message.type === 'success' && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
              )}
              <span>{message.text}</span>
            </div>
          )}

          <div className={styles.divider}>OR</div>

          <button 
            onClick={handleGoogleLogin}
            className={styles.googleBtn}
            type="button"
          >
            <img 
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
              alt="Google" 
              className={styles.googleIcon} 
            />
            Sign in with Google
          </button>

          <button 
            onClick={() => {
                if (!localStorage.getItem('pixelpets_guest_pets')) {
                    localStorage.setItem('pixelpets_guest_balance', '50');
                    localStorage.setItem('pixelpets_guest_pets', '[]');
                }
                loginAsGuest();
                navigate('/dashboard');
            }}
            className={styles.quickPlayBtn}
            type="button"
          >
             <span>🎮</span> Play Offline
          </button>
        </div>

        {/* Right Panel - Hero / Game Preview */}
        <div className={styles.rightPanel}>
          <div className={styles.heroContent}>
            {activeTab === 'login' ? (
              <>
                <h2 key="login-title" className={styles.fadeText}>Welcome Back!</h2>
                <p key="login-desc" className={styles.fadeText}>Adopt, feed, and play with your own digital pets.</p>
                <div className={styles.heroDecor}>
                   <div className={styles.decorCircle}></div>
                   <img key="login-pet" src={dogImg} className={styles.heroPet} alt="Hero Dog" />
                </div>
              </>
            ) : (
              <>
                <h2 key="signup-title" className={styles.fadeText}>Join the Adventure!</h2>
                <p key="signup-desc" className={styles.fadeText}>Start your journey and collect unique pixel pets today.</p>
                <div className={styles.heroDecor}>
                   <div className={styles.decorCircle}></div>
                   <img key="signup-pet" src={catImg} className={styles.heroPet} alt="Hero Cat" />
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
