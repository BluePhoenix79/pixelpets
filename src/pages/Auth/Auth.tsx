
import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import dogImg from '../../assets/dog.png';
import catImg from '../../assets/cat.png';
import birdImg from '../../assets/bird.png';
import fishImg from '../../assets/fish.png';
import mouseImg from '../../assets/mouse.png';
import { useAuth } from '../../context/AuthContext';
import styles from './Auth.module.css';

type AuthTab = 'login' | 'signup';

interface MessageState {
  text: string;
  type: 'error' | 'success' | '';
}

export default function Auth() {
  const [activeTab, setActiveTab] = useState<AuthTab>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [loginMessage, setLoginMessage] = useState<MessageState>({ text: '', type: '' });
  const [signupMessage, setSignupMessage] = useState<MessageState>({ text: '', type: '' });
  const [isLoading, setIsLoading] = useState(false);
  
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoginMessage({ text: '', type: '' });
    setIsLoading(true);

    const { error } = await signIn(loginEmail, loginPassword);

    if (error) {
      setLoginMessage({ text: error.message, type: 'error' });
    } else {
      setLoginMessage({ text: 'Login successful!', type: 'success' });
      navigate('/dashboard');
    }
    setIsLoading(false);
  };

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setSignupMessage({ text: '', type: '' });

    if (signupPassword.length < 6) {
      setSignupMessage({ text: 'Password must be at least 6 characters', type: 'error' });
      return;
    }

    setIsLoading(true);
    const { error } = await signUp(signupEmail, signupPassword);

    if (error) {
      setSignupMessage({ text: error.message, type: 'error' });
    } else {
      setSignupMessage({ text: 'Account created! Logging you in...', type: 'success' });
      navigate('/dashboard');
    }
    setIsLoading(false);
  };

  return (
    <div className={styles.authPage}>
      <header className="title">
        <h1>PixelPets</h1>
        <div className="pet-icons">
          <img src={dogImg} className="pet-icon" alt="dog" style={{ width: '48px', height: '48px' }} />
          <img src={catImg} className="pet-icon" alt="cat" style={{ width: '48px', height: '48px' }} />
          <img src={birdImg} className="pet-icon" alt="bird" style={{ width: '48px', height: '48px' }} />
          <img src={fishImg} className="pet-icon" alt="fish" style={{ width: '48px', height: '48px' }} />
          <img src={mouseImg} className="pet-icon" alt="mouse" style={{ width: '48px', height: '48px' }} />
        </div>
      </header>

      <main>
        <section className="controls" aria-label="Authentication">
          <div className={styles.authTabs}>
            <button 
              className={`${styles.tabBtn} ${activeTab === 'login' ? styles.active : ''}`}
              onClick={() => setActiveTab('login')}
            >
              Login
            </button>
            <button 
              className={`${styles.tabBtn} ${activeTab === 'signup' ? styles.active : ''}`}
              onClick={() => setActiveTab('signup')}
            >
              Sign Up
            </button>
          </div>

          {activeTab === 'login' && (
            <form className={styles.authForm} onSubmit={handleLogin}>
              <div className="form-group">
                <label htmlFor="login-email">Email</label>
                <input 
                  id="login-email" 
                  type="email" 
                  required 
                  placeholder="Enter your email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="login-password">Password</label>
                <input 
                  id="login-password" 
                  type="password" 
                  required 
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
              </div>

              <button type="submit" className={styles.submitBtn} disabled={isLoading}>
                {isLoading ? 'Logging in...' : 'Login'}
              </button>
              
              {loginMessage.text && (
                <div className={`message ${loginMessage.type}`}>
                  {loginMessage.text}
                </div>
              )}
            </form>
          )}

          {activeTab === 'signup' && (
            <form className={styles.authForm} onSubmit={handleSignup}>
              <div className="form-group">
                <label htmlFor="signup-email">Email</label>
                <input 
                  id="signup-email" 
                  type="email" 
                  required 
                  placeholder="Enter your email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="signup-password">Password</label>
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
              
              {signupMessage.text && (
                <div className={`message ${signupMessage.type}`}>
                  {signupMessage.text}
                </div>
              )}
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
