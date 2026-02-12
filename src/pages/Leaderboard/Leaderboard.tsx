import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getLeaderboardByBalance } from "../../lib/api";
import { getLeaderboardByLevel } from "../../lib/api";
import { getLeaderboardByStreak } from "../../lib/api";
import styles from "./Leaderboard.module.css";

type LeaderboardTab = "balance" | "level" | "streak";

interface LeaderboardEntry {
  id: string; // user_id or pet_id
  username: string;
  value: number;
  subtext?: string;
}

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState<LeaderboardTab>("balance");
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchLeaderboard = async () => {
    setLoading(true);
    let entries: LeaderboardEntry[] = [];

    try {
      if (activeTab === "balance") {
        // First get finances
        const finances = await getLeaderboardByBalance(50);

        if (finances && finances.length > 0) {
          // Data is already formatted by the API with usernames
          entries = finances
            .filter((f) => f.show_on_leaderboard !== false)
            .map((f) => ({
              id: f.user_id,
              username: f.username || "Trainer",
              value: f.balance,
              subtext: "Net Worth",
            }));
        }
      } else if (activeTab === "level") {
        const pets = await getLeaderboardByLevel(50);

        if (pets && pets.length > 0) {
          entries = pets
            .filter((p) => p.show_on_leaderboard !== false)
            .map((p) => {
              const lvl = p.level || 1;
              const totalXP = 50 * lvl * (lvl - 1) + (p.xp || 0);
              return {
                id: p.id,
                username: p.name,
                value: totalXP,
                subtext: `Lvl ${lvl} • ${p.owner_username || "Unknown"}`,
              };
            });
        }
      } else if (activeTab === "streak") {
        const streaks = await getLeaderboardByStreak(50);

        if (streaks && streaks.length > 0) {
          entries = streaks
            .filter((s) => s.show_on_leaderboard !== false)
            .map((s) => ({
              id: s.user_id,
              username: s.username || "Trainer",
              value: s.current_streak,
              subtext: "Day Streak",
            }));
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

  useEffect(() => {
    fetchLeaderboard();
  }, [activeTab]);

  const formatValue = (val: number) => {
    if (activeTab === "balance") return `$${val.toFixed(2)}`;
    if (activeTab === "level") return `${val.toLocaleString()} XP`;
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
          className={`${styles.tab} ${activeTab === "balance" ? styles.active : ""}`}
          onClick={() => setActiveTab("balance")}
        >
          Richest Trainers
        </button>
        <button
          className={`${styles.tab} ${activeTab === "level" ? styles.active : ""}`}
          onClick={() => setActiveTab("level")}
        >
          Top Pets
        </button>
        <button
          className={`${styles.tab} ${activeTab === "streak" ? styles.active : ""}`}
          onClick={() => setActiveTab("streak")}
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
              <div
                key={entry.id}
                className={`${styles.rankCard} ${index === 0 ? styles.rank1 : index === 1 ? styles.rank2 : index === 2 ? styles.rank3 : ""}`}
              >
                <div className={styles.rankPosition}>#{index + 1}</div>
                <div className={styles.userInfo}>
                  <div className={styles.username}>{entry.username}</div>
                  {entry.subtext && (
                    <div className={styles.subtext}>{entry.subtext}</div>
                  )}
                </div>
                <div className={styles.score}>{formatValue(entry.value)}</div>
              </div>
            ))
          )}
          {data.length === 0 && !loading && (
            <div
              style={{
                marginTop: "20px",
                color: "#64748b",
                fontSize: "0.9rem",
              }}
            >
              Unable to load rankings. Check your internet connection.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
