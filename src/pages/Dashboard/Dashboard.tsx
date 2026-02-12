import { useState, useEffect, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { getFinances } from "../../lib/api";
import { getPets } from "../../lib/api";
import { patchFinances } from "../../lib/api";
import { createPet } from "../../lib/api";
import type { Pet, PetSpecies } from "../../types";
import styles from "./Dashboard.module.css";
import dogImg from "../../assets/dog.png";
import catImg from "../../assets/cat.png";
import birdImg from "../../assets/bird.png";
import fishImg from "../../assets/fish.png";
import mouseImg from "../../assets/mouse.png";
import moneyBagImg from "../../assets/money_bag.png";
import heartImg from "../../assets/heart.png";
import starImg from "../../assets/star.png";
import lightningImg from "../../assets/lightning.png";

const PET_IMAGES: Record<PetSpecies, string> = {
  dog: dogImg,
  cat: catImg,
  bird: birdImg,
  fish: fishImg,
  mouse: mouseImg,
};

export default function Dashboard() {
  const { user, signOut, isGuest } = useAuth();
  const navigate = useNavigate();
  const [pets, setPets] = useState<Pet[]>([]);
  const [balance, setBalance] = useState(0);
  const [petName, setPetName] = useState("");
  const [petSpecies, setPetSpecies] = useState<PetSpecies | "">("");
  const [isCreating, setIsCreating] = useState(false);
  const [showNewPetForm, setShowNewPetForm] = useState(false);

  useEffect(() => {
    if (user || isGuest) {
      loadUserData();
    }
  }, [user, isGuest]);

  const loadUserData = async () => {
    if (isGuest) {
      // Guest Mode: Load from Local Storage
      const savedBalance = localStorage.getItem("pixelpets_guest_balance");
      const savedPets = localStorage.getItem("pixelpets_guest_pets");

      let balanceToSet = savedBalance ? parseFloat(savedBalance) : 0;
      if (balanceToSet === 0) {
        balanceToSet = 50;
        localStorage.setItem("pixelpets_guest_balance", "50");
      }

      setBalance(balanceToSet);
      if (savedPets) setPets(JSON.parse(savedPets));
      return;
    }

    if (!user) return;

    const financeData = await getFinances(user.id);

    if (financeData) {
      setBalance(financeData.balance);
    }

    const petsData = await getPets(user.id);

    if (petsData) {
      setPets(petsData);

      // UX Improvement 1: Starter Money
      // If user has 0 pets and less than $50, give them enough to start
      if (petsData.length === 0 && (!financeData || financeData.balance < 50)) {
        try {
          await patchFinances(user.id, {
            balance: 50,
            total_earned: financeData?.total_earned || 0,
          });
          setBalance(50);
        } catch (error) {
          console.error("Failed to reset balance:", error);
        }
      }
    }
  };

  const handleCreatePet = async (e: FormEvent) => {
    e.preventDefault();

    if (!petName || !petSpecies || (!user && !isGuest)) {
      alert("Please fill in all fields");
      return;
    }

    // Check if user has enough balance ($50 to adopt a pet)
    const PET_COST = 50;
    if (balance < PET_COST) {
      alert(
        `Not enough money! You need $${PET_COST} to adopt a pet. Current balance: $${balance.toFixed(2)}`,
      );
      return;
    }

    setIsCreating(true);

    if (isGuest) {
      // Guest Mode: Save to Local Storage
      const newBalance = balance - PET_COST;
      const newPet: Pet = {
        id: `guest_pet_${Date.now()}`,
        owner_id: "guest_user",
        name: petName,
        species: petSpecies as PetSpecies,
        created_at: new Date().toISOString(),
        hunger: 50,
        happiness: 50,
        energy: 50,
        cleanliness: 50,
        health: 50,
        love: 50,
        level: 1,
        xp: 0,
      } as Pet; // Cast to Pet to avoid missing optional fields matching DB type

      const currentPets = JSON.parse(
        localStorage.getItem("pixelpets_guest_pets") || "[]",
      );
      const updatedPets = [newPet, ...currentPets];

      localStorage.setItem("pixelpets_guest_balance", newBalance.toString());
      localStorage.setItem("pixelpets_guest_pets", JSON.stringify(updatedPets));

      setBalance(newBalance);
      setPets(updatedPets);
      setPetName("");
      setPetSpecies("");
      setShowNewPetForm(false);
      setIsCreating(false);
      return;
    }

    // Deduct the pet adoption cost
    if (!user) return;

    // Optimistic UI update
    setBalance((prev) => prev - PET_COST);

    const newPetData = {
      name: petName,
      species: petSpecies,
      owner_id: user.id,
      hunger: 50,
      happiness: 50,
      energy: 50,
      cleanliness: 50,
      health: 50,
      love: 50,
      xp: 0,
      level: 1,
      created_at: new Date().toISOString(),
    };

    try {
      // Deduct the pet adoption cost
      await patchFinances(user.id, {
        balance: balance - PET_COST,
      });

      // Create the pet
      await createPet(newPetData);

      // Success - clear form and reload
      setPetName("");
      setPetSpecies("");
      setShowNewPetForm(false);
      await loadUserData();
    } catch (error) {
      // Refund if anything failed
      const currentFinance = await getFinances(user.id);
      if (currentFinance) {
        await patchFinances(user.id, {
          balance: (currentFinance.balance || 0) + PET_COST,
        });
      }
      setBalance((prev) => prev + PET_COST);
      alert(
        "Error creating pet: " +
          (error instanceof Error ? error.message : "Unknown error"),
      );
    }

    setIsCreating(false);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const handlePetClick = (petId: string) => {
    const pet = pets.find((p) => p.id === petId);
    navigate(`/pet/${petId}`, { state: { pet } });
  };

  return (
    <div className={styles.dashboardPage}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logoSection}>
          <h1 className={styles.logo}>PixelPets</h1>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.settingsBtn}
            onClick={() => navigate("/leaderboard")}
          >
            Leaderboard
          </button>
          <button
            className={styles.settingsBtn}
            onClick={() => navigate("/settings")}
          >
            Settings
          </button>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* Balance Card */}
      <div className={styles.balanceCard}>
        <div className={styles.balanceIcon}>
          <img src={moneyBagImg} alt="money" />
        </div>
        <div className={styles.balanceInfo}>
          <span className={styles.balanceLabel}>Balance</span>
          <span className={styles.balanceAmount}>${balance.toFixed(2)}</span>
        </div>
      </div>

      {/* Main Content */}
      <main className={styles.mainContent}>
        {/* Pets Section */}
        <section className={styles.petsSection}>
          <div className={styles.sectionHeader}>
            <h2>Your Pets</h2>
            <button
              className={styles.addPetBtn}
              onClick={() => setShowNewPetForm(!showNewPetForm)}
            >
              {showNewPetForm ? "Cancel" : "Create New Pet"}
            </button>
          </div>

          {/* New Pet Form (Collapsible) */}
          {showNewPetForm && (
            <form
              className={styles.newPetForm}
              onSubmit={handleCreatePet}
              autoComplete="off"
            >
              <div className={styles.formRow}>
                <input
                  type="text"
                  placeholder="Pet Name"
                  value={petName}
                  onChange={(e) => setPetName(e.target.value)}
                  required
                />
                <select
                  value={petSpecies}
                  onChange={(e) => setPetSpecies(e.target.value as PetSpecies)}
                  required
                >
                  <option value="">Select Species</option>
                  <option value="dog">Dog</option>
                  <option value="cat">Cat</option>
                  <option value="bird">Bird</option>
                  <option value="fish">Fish</option>
                  <option value="mouse">Mouse</option>
                </select>
                <button
                  type="submit"
                  className={styles.createBtn}
                  disabled={isCreating || balance < 50}
                >
                  {isCreating ? "Adopting..." : "Adopt ($50)"}
                </button>
              </div>
              {balance < 50 && (
                <p
                  style={{
                    color: "#ef4444",
                    marginTop: "12px",
                    fontSize: "0.9rem",
                  }}
                >
                  You need $50 to adopt a pet. Complete tasks to earn more!
                </p>
              )}
            </form>
          )}

          {/* Pet Cards Grid */}
          {pets.length > 0 ? (
            <div className={styles.petsGrid}>
              {pets.map((pet) => (
                <div
                  key={pet.id}
                  className={styles.petCard}
                  onClick={() => handlePetClick(pet.id)}
                >
                  <div className={styles.petImageWrapper}>
                    <img
                      src={PET_IMAGES[pet.species]}
                      alt={pet.species}
                      className={styles.petImage}
                    />
                  </div>
                  <div className={styles.petInfo}>
                    <h3 className={styles.petName}>{pet.name}</h3>
                    <span className={styles.petSpecies}>
                      {pet.species.charAt(0).toUpperCase() +
                        pet.species.slice(1)}
                    </span>
                  </div>
                  <div className={styles.petStats}>
                    <div className={styles.miniStat}>
                      {/* Heart Image */}
                      <span className={styles.statLabel}>
                        <img src={heartImg} alt="Health" />
                      </span>
                      <div className={styles.miniBar}>
                        <div
                          style={{
                            width: `${pet.health}%`,
                            background: "#ef4444",
                          }}
                        />
                      </div>
                    </div>
                    <div className={styles.miniStat}>
                      {/* Star Image */}
                      <span className={styles.statLabel}>
                        <img src={starImg} alt="Happiness" />
                      </span>
                      <div className={styles.miniBar}>
                        <div
                          style={{
                            width: `${pet.happiness}%`,
                            background: "#eab308",
                          }}
                        />
                      </div>
                    </div>
                    <div className={styles.miniStat}>
                      {/* Lightning Image */}
                      <span className={styles.statLabel}>
                        <img src={lightningImg} alt="Energy" />
                      </span>
                      <div className={styles.miniBar}>
                        <div
                          style={{
                            width: `${pet.energy}%`,
                            background: "#3b82f6",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <button className={styles.careBtn}>PLAY NOW</button>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcons}>
                <img src={dogImg} alt="dog" />
                <img src={catImg} alt="cat" />
                <img src={birdImg} alt="bird" />
              </div>
              <h3>No pets found</h3>
              <p>Create a pet to get started!</p>
              <button
                className={styles.getStartedBtn}
                onClick={() => setShowNewPetForm(true)}
              >
                Create Pet
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
