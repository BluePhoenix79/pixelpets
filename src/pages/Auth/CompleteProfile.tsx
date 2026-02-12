import { useState, FormEvent, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import styles from "./Auth.module.css";
import dogImg from "../../assets/dog.png";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function CompleteProfile() {
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { user, refreshProfile, hasProfile, loading } = useAuth();
  const navigate = useNavigate();

  // Effect to redirect if already has profile
  useEffect(() => {
    if (hasProfile && !loading) {
      navigate("/dashboard", { replace: true });
    }
  }, [hasProfile, loading, navigate]);

  if (loading || hasProfile) {
    return (
      <div className={styles.authPage}>
        <div style={{ color: "white", textAlign: "center", marginTop: "20vh" }}>
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim()) {
      setError("Username is required");
      return;
    }

    if (username.length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }

    setIsLoading(true);

    try {
      if (!user) throw new Error("No user found");

      const token = localStorage.getItem("pixelpets_token");
      if (!token) throw new Error("Not authenticated");

      // Create profile
      const profileResponse = await fetch(`${API_URL}/api/profiles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: user.id,
          username: username.trim(),
          show_on_leaderboard: true,
        }),
      });

      if (!profileResponse.ok) {
        const data = await profileResponse.json();
        throw new Error(data.error || "Failed to create profile");
      }

      // Check if wallet exists, if not create it
      const financeResponse = await fetch(`${API_URL}/api/finances/${user.id}`);
      const financeData = await financeResponse.json();

      if (!financeData) {
        await fetch(`${API_URL}/api/finances`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            user_id: user.id,
            balance: 100,
            total_earned: 100,
            total_spent: 0,
          }),
        });
      }

      // Refresh auth context to know we have a profile now
      await refreshProfile();

      navigate("/dashboard");
    } catch (err: any) {
      console.error("Profile completion error:", err);
      setError(err.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.authPage}>
      <div
        className={styles.splitScreen}
        style={{ maxWidth: "600px", minHeight: "auto" }}
      >
        <div className={styles.leftPanel}>
          <div className={styles.authHeader}>
            <img
              src={dogImg}
              alt="Pixel Pet"
              className={styles.petIcon}
              style={{ margin: "0 auto 20px", display: "block" }}
            />
            <h1>One Last Step!</h1>
            <p className={styles.subtitle}>
              Choose a username to start your adventure.
            </p>
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
              <div
                className={`${styles.message} ${styles.error}`}
                style={{ marginBottom: "20px" }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isLoading}
            >
              {isLoading ? "Setting up..." : "Start Playing"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
