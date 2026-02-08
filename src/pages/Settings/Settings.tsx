import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import type { Pet, ThemePreference } from '../../types';
import { QUESTION_TOPICS, getQuestionTopic, setQuestionTopic, getCustomTopic, setCustomTopic, getDifficulty, setDifficulty, Difficulty } from '../../lib/ai';
import styles from './Settings.module.css';
import settingImg from '../../assets/setting.png';

export default function Settings() {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  
  const [pets, setPets] = useState<Pet[]>([]);
  const [username, setUsername] = useState('');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' as 'success' | 'error' | '' });
  const [questionTopic, setQuestionTopicState] = useState(getQuestionTopic());
  const [customTopic, setCustomTopicState] = useState(getCustomTopic());
  const [difficulty, setDifficultyState] = useState<Difficulty>(getDifficulty());
  const [showOnLeaderboard, setShowOnLeaderboard] = useState(true);

  useEffect(() => {
    if (user) {
      setUsername(user.user_metadata?.username || '');
      loadPets();
      loadLeaderboardPreference();
    }
  }, [user]);

  const loadLeaderboardPreference = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('show_on_leaderboard')
      .eq('user_id', user.id)
      .maybeSingle();
    if (data) {
      setShowOnLeaderboard(data.show_on_leaderboard !== false);
    }
  };

  const loadPets = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('pets')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setPets(data);
  };

  const handleUserLeaderboardToggle = async (value: boolean) => {
    if (!user) return;
    setShowOnLeaderboard(value);
    await supabase.from('profiles').upsert({
      user_id: user.id,
      username: user.user_metadata?.username || user.email?.split('@')[0] || 'Trainer',
      show_on_leaderboard: value
    }, { onConflict: 'user_id' });
  };

  const handlePetLeaderboardToggle = async (petId: string, value: boolean) => {
    await supabase.from('pets').update({ show_on_leaderboard: value }).eq('id', petId);
    loadPets();
  };

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  const handleThemeChange = (newTheme: ThemePreference) => {
    setTheme(newTheme);
  };

  const handleTopicChange = (topicId: string) => {
    setQuestionTopicState(topicId);
    setQuestionTopic(topicId);
  };

  const handleCustomTopicChange = (topic: string) => {
    setCustomTopicState(topic);
    setCustomTopic(topic);
  };

  const handleDifficultyChange = (diff: Difficulty) => {
    setDifficultyState(diff);
    setDifficulty(diff);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleSaveUsername = async () => {
    if (!user) return;
    const originalUsername = user.user_metadata?.username || '';
    
    if (username === originalUsername) {
      setIsEditingUsername(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      data: { username }
    });

    if (error) {
      showMessage(`Error: ${error.message}`, 'error');
    } else {
      showMessage('Username updated successfully!', 'success');
    }
    setIsEditingUsername(false);
  };

  const handlePasswordUpdate = async (e: FormEvent) => {
    e.preventDefault();
    
    if (newPassword.length < 6) {
      showMessage('Password must be at least 6 characters long.', 'error');
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      showMessage(`Error: ${error.message}`, 'error');
    } else {
      showMessage('Password updated successfully!', 'success');
      setNewPassword('');
    }
  };

  const handleRenamePet = async (petId: string, currentName: string) => {
    const newName = prompt(`Enter new name for ${currentName}:`, currentName);
    if (!newName || newName === currentName) return;

    const { error } = await supabase.from('pets').update({ name: newName }).eq('id', petId);
    
    if (error) {
      alert('Error updating pet name: ' + error.message);
    } else {
      showMessage('Pet name updated!', 'success');
      loadPets();
    }
  };

  const handleDeletePet = async (petId: string, petName: string) => {
    if (!confirm(`Delete ${petName}? This cannot be undone!`)) return;
    if (!confirm(`Are you SURE? This will delete all data for ${petName}!`)) return;

    try {
      await supabase.from('achievements').delete().eq('pet_id', petId);
      await supabase.from('expenses').delete().eq('pet_id', petId);
      await supabase.from('savings_goals').delete().eq('pet_id', petId);
      await supabase.from('pets').delete().eq('id', petId);
      
      showMessage(`${petName} deleted`, 'success');
      loadPets();
    } catch (error) {
      alert('Error deleting pet: ' + (error as Error).message);
    }
  };

  return (
    <div className={styles.settingsPage}>
      <header className="title">
        <h1>Settings</h1>
        <div className="pet-icons">
          <img src={settingImg} className="pet-icon" alt="settings" style={{ width: '48px', height: '48px', animation: 'spin 4s linear infinite' }} />
        </div>
      </header>

      <div className="user-info" style={{ justifyContent: 'center' }}>
        <div className="user-bar-buttons">
          <button className="user-bar-btn" onClick={() => navigate('/dashboard')}>Home</button>
          <button className="user-bar-btn" onClick={() => navigate(-1)}>Back to Pet</button>
          <button className="user-bar-btn" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <main>
        <div className={styles.settingsContainer}>
          {message.text && (
            <div className={`message ${message.type}`}>{message.text}</div>
          )}

          <div className={styles.settingCard}>
            <h2>Your Pets</h2>
            <div className={styles.petsManagement}>
              {pets.length === 0 ? (
                <p className={styles.noPets}>No pets yet</p>
              ) : (
                pets.map((pet) => (
                  <div key={pet.id} className={styles.petItem}>
                    <div>
                      <strong>{pet.name}</strong>
                      <span className={styles.petSpecies}>({pet.species})</span>
                    </div>
                    <div className={styles.petActions}>
                      <button 
                        className={`${styles.toggleBtn} ${pet.show_on_leaderboard !== false ? styles.toggleOn : styles.toggleOff}`}
                        onClick={() => handlePetLeaderboardToggle(pet.id, pet.show_on_leaderboard === false)}
                        title="Show on Leaderboard"
                      >
                        {pet.show_on_leaderboard !== false ? 'Visible' : 'Hidden'}
                      </button>
                      <button 
                        className={styles.renameBtn}
                        onClick={() => handleRenamePet(pet.id, pet.name)}
                      >
                        Rename
                      </button>
                      <button 
                        className={styles.deleteBtn}
                        onClick={() => handleDeletePet(pet.id, pet.name)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className={styles.settingCard}>
            <h2>Account</h2>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input type="email" id="email" value={user?.email || ''} disabled />
            </div>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <div className={styles.inputWithButton}>
                <input 
                  type="text" 
                  id="username" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={!isEditingUsername}
                  placeholder="No username set"
                />
                <button 
                  className={styles.inlineBtn}
                  onClick={() => isEditingUsername ? handleSaveUsername() : setIsEditingUsername(true)}
                >
                  {isEditingUsername ? 'Save' : 'Edit'}
                </button>
              </div>
            </div>
          </div>

          <div className={styles.settingCard}>
            <h2>Change Password</h2>
            <form onSubmit={handlePasswordUpdate}>
              <div className="form-group">
                <label htmlFor="new-password">New Password</label>
                <input 
                  type="password" 
                  id="new-password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required 
                  minLength={6} 
                  placeholder="Enter new password (min. 6 characters)"
                />
              </div>
              <button type="submit" className={styles.updatePasswordBtn}>Update Password</button>
            </form>
          </div>

          <div className={styles.settingCard}>
            <h2>Theme</h2>
            <div className="form-group">
              <label htmlFor="theme-select">Theme</label>
              <select 
                id="theme-select"
                value={theme}
                onChange={(e) => handleThemeChange(e.target.value as ThemePreference)}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>
          </div>

          <div className={styles.settingCard}>
            <h2>AI Question Topics</h2>
            <p className={styles.settingDescription}>Choose what topics AI-generated questions will focus on.</p>
            <div className="form-group">
              <label htmlFor="topic-select">Topic</label>
              <select 
                id="topic-select"
                value={questionTopic}
                onChange={(e) => handleTopicChange(e.target.value)}
              >
                {QUESTION_TOPICS.map(topic => (
                  <option key={topic.id} value={topic.id}>{topic.label}</option>
                ))}
                <option value="custom">Custom Topic...</option>
              </select>
            </div>
            {questionTopic === 'custom' && (
              <div className="form-group">
                <label htmlFor="custom-topic">Custom Topic</label>
                <input 
                  type="text" 
                  id="custom-topic" 
                  value={customTopic}
                  onChange={(e) => handleCustomTopicChange(e.target.value)}
                  placeholder="e.g., accounting basics, stock market"
                />
              </div>
            )}

            <div className="form-group" style={{ marginTop: '16px' }}>
              <label htmlFor="difficulty-select">Difficulty</label>
              <select 
                id="difficulty-select"
                value={difficulty}
                onChange={(e) => handleDifficultyChange(e.target.value as Difficulty)}
              >
                <option value="easy">Easy (Beginner)</option>
                <option value="medium">Medium (Standard)</option>
                <option value="hard">Hard (Advanced)</option>
              </select>
            </div>
          </div>

          <div className={styles.settingCard}>
            <h2>Leaderboard Privacy</h2>
            <p className={styles.settingDescription}>Control your visibility on the global leaderboard. Use the toggle next to each pet above to control pet visibility.</p>
            
            <div className={styles.toggleRow}>
              <label htmlFor="user-leaderboard">Show me on leaderboard</label>
              <input 
                type="checkbox" 
                id="user-leaderboard"
                checked={showOnLeaderboard}
                onChange={(e) => handleUserLeaderboardToggle(e.target.checked)}
                className={styles.toggleCheckbox}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
