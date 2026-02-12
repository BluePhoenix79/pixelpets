import { useState, useEffect } from "react";
import styles from "./AdminPanel.module.css";

interface Profile {
  user_id: string; // Updated to match schema
  username: string;
  show_on_leaderboard: boolean; // Updated to match schema
}

interface Pet {
  id: string;
  name: string;
  owner_id: string;
  show_on_leaderboard: boolean;
  level: number;
}

export default function AdminPanel() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<"users" | "pets">("users");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(false);

  // Konami Code Sequence
  const konamiCode = [
    "ArrowUp",
    "ArrowUp",
    "ArrowDown",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "ArrowLeft",
    "ArrowRight",
    "b",
    "a",
  ];
  const [inputHistory, setInputHistory] = useState<string[]>([]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setInputHistory((prev) => {
        const newHistory = [...prev, e.key];
        if (newHistory.length > konamiCode.length) {
          newHistory.shift();
        }
        return newHistory;
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (inputHistory.join("") === konamiCode.join("")) {
      setIsVisible(true);
      if (activeTab === "users") fetchProfiles();
      else fetchPets();
      setInputHistory([]); // Reset
    }
  }, [inputHistory]);

  useEffect(() => {
    if (isVisible) {
      if (activeTab === "users") fetchProfiles();
      else fetchPets();
    }
  }, [activeTab, isVisible]);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("pixelpets_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/profiles`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (response.ok) {
        const data = await response.json();
        setProfiles(data);
      } else {
        console.error("Error fetching profiles");
      }
    } catch (error) {
      console.error("Error fetching profiles:", error);
    }
    setLoading(false);
  };

  const fetchPets = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("pixelpets_token");
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/pets`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        // Sort by level descending
        setPets(data.sort((a: Pet, b: Pet) => b.level - a.level));
      } else {
        console.error("Error fetching pets");
      }
    } catch (error) {
      console.error("Error fetching pets:", error);
    }
    setLoading(false);
  };

  const toggleVisibility = async (userId: string, currentStatus: boolean) => {
    // Optimistic update
    setProfiles((prev) =>
      prev.map((p) =>
        p.user_id === userId
          ? { ...p, show_on_leaderboard: !currentStatus }
          : p,
      ),
    );

    try {
      const token = localStorage.getItem("pixelpets_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/profiles/${userId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ show_on_leaderboard: !currentStatus }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      // Revert on error
      setProfiles((prev) =>
        prev.map((p) =>
          p.user_id === userId
            ? { ...p, show_on_leaderboard: currentStatus }
            : p,
        ),
      );
      alert("Failed to update. Check console/permissions.");
    }
  };

  const togglePetVisibility = async (petId: string, currentStatus: boolean) => {
    // Optimistic update
    setPets((prev) =>
      prev.map((p) =>
        p.id === petId ? { ...p, show_on_leaderboard: !currentStatus } : p,
      ),
    );

    try {
      const token = localStorage.getItem("pixelpets_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/pets/${petId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ show_on_leaderboard: !currentStatus }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update");
      }
    } catch (error) {
      console.error("Error updating pet:", error);
      // Revert on error
      setPets((prev) =>
        prev.map((p) =>
          p.id === petId ? { ...p, show_on_leaderboard: currentStatus } : p,
        ),
      );
      alert("Failed to update pet. Check console/permissions.");
    }
  };

  if (!isVisible) return null;

  return (
    <div className={styles.adminOverlay}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <h2>🕵️‍♂️ SECRET ADMIN PANEL</h2>
          <button
            className={styles.closeBtn}
            onClick={() => setIsVisible(false)}
          >
            ×
          </button>
        </div>

        <div style={{ display: "flex", borderBottom: "1px solid #334155" }}>
          <button
            className={styles.tabBtn}
            style={{
              flex: 1,
              padding: "15px",
              background: activeTab === "users" ? "#334155" : "transparent",
              color: "white",
              border: "none",
              cursor: "pointer",
              fontWeight: activeTab === "users" ? "bold" : "normal",
            }}
            onClick={() => setActiveTab("users")}
          >
            Users
          </button>
          <button
            className={styles.tabBtn}
            style={{
              flex: 1,
              padding: "15px",
              background: activeTab === "pets" ? "#334155" : "transparent",
              color: "white",
              border: "none",
              cursor: "pointer",
              fontWeight: activeTab === "pets" ? "bold" : "normal",
            }}
            onClick={() => setActiveTab("pets")}
          >
            Pets
          </button>
        </div>

        <div className={styles.content}>
          {loading ? (
            <p style={{ color: "#fff" }}>Loading data...</p>
          ) : activeTab === "users" ? (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>ID</th>
                  <th>Show on Billboard</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((profile) => (
                  <tr key={profile.user_id}>
                    <td>{profile.username}</td>
                    <td style={{ fontSize: "0.8em", color: "#94a3b8" }}>
                      {profile.user_id}
                    </td>
                    <td>
                      <label className={styles.toggleSwitch}>
                        <input
                          type="checkbox"
                          checked={profile.show_on_leaderboard}
                          onChange={() =>
                            toggleVisibility(
                              profile.user_id,
                              profile.show_on_leaderboard,
                            )
                          }
                        />
                        <span className={styles.slider}></span>
                      </label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Pet Name</th>
                  <th>Level</th>
                  <th>Owner ID</th>
                  <th>Show</th>
                </tr>
              </thead>
              <tbody>
                {pets.map((pet) => (
                  <tr key={pet.id}>
                    <td>{pet.name}</td>
                    <td>{pet.level}</td>
                    <td style={{ fontSize: "0.8em", color: "#94a3b8" }}>
                      {pet.owner_id}
                    </td>
                    <td>
                      <label className={styles.toggleSwitch}>
                        <input
                          type="checkbox"
                          checked={pet.show_on_leaderboard !== false}
                          onChange={() =>
                            togglePetVisibility(
                              pet.id,
                              pet.show_on_leaderboard !== false,
                            )
                          }
                        />
                        <span className={styles.slider}></span>
                      </label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
