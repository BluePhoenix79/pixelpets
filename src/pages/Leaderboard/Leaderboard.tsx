import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import styles from './Leaderboard.module.css';

type LeaderboardTab = 'balance' | 'level' | 'streak';

interface LeaderboardEntry {
    id: string; // user_id or pet_id
    username: string;
    value: number;
    subtext?: string;
}

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('balance');
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchLeaderboard();
  }, [activeTab]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    let entries: LeaderboardEntry[] = [];

    try {
        if (activeTab === 'balance') {
            // First get finances
            const { data: finances, error: finError } = await supabase
                .from('user_finances')
                .select('user_id, balance')
                .order('balance', { ascending: false })
                .limit(50);
            
            if (finError) console.error('Finance error:', finError);
            
            if (finances && finances.length > 0) {
                // Then get profiles for usernames
                const userIds = finances.map(f => f.user_id);
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('user_id, username, show_on_leaderboard')
                    .in('user_id', userIds);
                
                const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
                
                entries = finances
                    .filter(f => {
                        const profile = profileMap.get(f.user_id);
                        return !profile || profile.show_on_leaderboard !== false;
                    })
                    .map(f => {
                        const profile = profileMap.get(f.user_id);
                        return {
                            id: f.user_id,
                            username: profile?.username || 'Trainer',
                            value: f.balance,
                            subtext: 'Net Worth'
                        };
                    });
            }
        } else if (activeTab === 'level') {
            const { data: pets, error: petError } = await supabase
                .from('pets')
                .select('id, name, level, xp, owner_id, show_on_leaderboard')
                .order('level', { ascending: false })
                .order('xp', { ascending: false }) // Secondary sort by XP
                .limit(50);
            
            if (petError) console.error('Pet error:', petError);

            if (pets && pets.length > 0) {
                const ownerIds = [...new Set(pets.map(p => p.owner_id))];
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('user_id, username')
                    .in('user_id', ownerIds);
                
                const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
                
                entries = pets
                    .filter(p => p.show_on_leaderboard !== false)
                    .map(p => {
                        // Formula: TotalXP = 50 * L * (L-1) + currentXP
                        const lvl = p.level || 1;
                        const totalXP = (50 * lvl * (lvl - 1)) + (p.xp || 0);
                        return {
                            id: p.id,
                            username: p.name,
                            value: totalXP, // Show Total XP as the primary value? Or keep Level? User said "show total xp"
                            // If user wants to rank by Total XP, I should probably render Total XP as the value.
                            // But wait, the sort was by Level then XP, which is effectively Total XP.
                            // Let's show Level in subtext and Total XP as main value?
                            // Or "Lvl 5 • 2500 Total XP"
                            subtext: `${p.level} Level(s) • ${profileMap.get(p.owner_id)?.username || 'Unknown'}`
                        };
                    });
            }
        } else if (activeTab === 'streak') {
            const { data: streaks, error: streakError } = await supabase
                .from('user_streaks')
                .select('user_id, current_streak')
                .order('current_streak', { ascending: false })
                .limit(50);
            
            if (streakError) console.error('Streak error:', streakError);

            if (streaks && streaks.length > 0) {
                const userIds = streaks.map(s => s.user_id);
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('user_id, username, show_on_leaderboard')
                    .in('user_id', userIds);
                
                const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
                
                entries = streaks
                    .filter(s => {
                        const profile = profileMap.get(s.user_id);
                        return !profile || profile.show_on_leaderboard !== false;
                    })
                    .map(s => {
                        const profile = profileMap.get(s.user_id);
                        return {
                            id: s.user_id,
                            username: profile?.username || 'Trainer',
                            value: s.current_streak,
                            subtext: 'Day Streak'
                        };
                    });
            }
        }
    } catch (err) {
        console.error("Error fetching leaderboard:", err);
        // If error, likely offline or connection issue
        setData([]);
    }
    
    setData(entries);
    setLoading(false);
  };

  const formatValue = (val: number) => {
      if (activeTab === 'balance') return `$${val.toFixed(2)}`;
      if (activeTab === 'level') return `${val.toLocaleString()} XP`;
      return `${val} Day(s)`;
  };

  return (
    <div className={styles.leaderboardPage}>
      <button className={styles.backBtn} onClick={() => navigate(-1)}>
        Back
      </button>

      <div className={styles.header}>
        <h1>Global Leaderboard</h1>
      </div>

      <div className={styles.tabs}>
        <button 
            className={`${styles.tab} ${activeTab === 'balance' ? styles.active : ''}`}
            onClick={() => setActiveTab('balance')}
        >
            Richest Trainers
        </button>
        <button 
            className={`${styles.tab} ${activeTab === 'level' ? styles.active : ''}`}
            onClick={() => setActiveTab('level')}
        >
            Top Pets
        </button>
        <button 
            className={`${styles.tab} ${activeTab === 'streak' ? styles.active : ''}`}
            onClick={() => setActiveTab('streak')}
        >
            Most Dedicated
        </button>
      </div>

      {loading ? (
          <div className={styles.loading}>Loading rankings...</div>
      ) : (
          <div className={styles.leaderboardList}>
              {data.length === 0 ? (
                  <div className={styles.emptyState}>No data yet. Be the first!</div>
              ) : (
                  data.map((entry, index) => (
                      <div key={entry.id} className={`${styles.rankCard} ${index === 0 ? styles.rank1 : index === 1 ? styles.rank2 : index === 2 ? styles.rank3 : ''}`}>
                          <div className={styles.rankPosition}>#{index + 1}</div>
                          <div className={styles.userInfo}>
                              <div className={styles.username}>{entry.username}</div>
                              {entry.subtext && <div className={styles.subtext}>{entry.subtext}</div>}
                          </div>
                          <div className={styles.score}>
                              {formatValue(entry.value)}
                          </div>
                      </div>
                  ))
              )}
               {data.length === 0 && !loading && (
                   <div style={{ marginTop: '20px', color: '#64748b', fontSize: '0.9rem' }}>
                       Unable to load rankings. Check your internet connection.
                   </div>
               )}
          </div>
      )}
    </div>
  );
}
