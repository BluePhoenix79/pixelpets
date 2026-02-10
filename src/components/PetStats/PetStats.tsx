import React from 'react';
import type { Pet } from '../../types';
import styles from '../../pages/PetCare/PetCare.module.css';

// Asset Imports
import foodImg from '../../assets/food.png';
import happinessImg from '../../assets/happiness.png';
import energyImg from '../../assets/lightning.png';
import cleanlinessImg from '../../assets/cleanliness.png';
import healthImg from '../../assets/heart.png';
import loveImg from '../../assets/love.png';
import warningImg from '../../assets/warning.png';

interface PetStatsProps {
  pet: Pet;
}

export const PetStats: React.FC<PetStatsProps> = ({ pet }) => {
  // Calculate dynamic hue from 0 (Red) to 120 (Green)
  // 0% = Red, 50% = Yellow, 100% = Green
  const getStatHue = (value: number) => {
    if (value <= 15) return 0; // Red for critical (<15%)
    if (value <= 50) {
      // Interpolate 0 -> 45 (Red -> Gold/Dark Yellow)
      return (value - 15) * (45 / 35); 
    }
    // Interpolate 45 -> 120 (Gold -> Green)
    return 45 + ((value - 50) * (75 / 50));
  };

  const isStatCritical = (value: number) => value < 20;

  const stats = [
    { key: 'hunger', icon: foodImg, label: 'Hunger', value: pet.hunger },
    { key: 'happiness', icon: happinessImg, label: 'Happiness', value: pet.happiness },
    { key: 'energy', icon: energyImg, label: 'Energy', value: pet.energy },
    { key: 'cleanliness', icon: cleanlinessImg, label: 'Cleanliness', value: pet.cleanliness },
    { key: 'health', icon: healthImg, label: 'Health', value: pet.health },
    { key: 'love', icon: loveImg, label: 'Love', value: pet.love ?? 50 },
  ];

  return (
    <div className={styles.statsGrid}>
      {stats.map((stat) => {
        const hue = getStatHue(stat.value);
        const color = `hsl(${hue}, 85%, 50%)`; // Dynamic vibrant color
        const glowColor = `hsla(${hue}, 85%, 50%, 0.6)`;
        
        return (
          <div 
            key={stat.key} 
            className={`${styles.statCard} ${isStatCritical(stat.value) ? styles.statCritical : ''}`}
            // Pass dynamic color as CSS variable for hover effects
            style={{ 
                '--stat-color': color, 
                '--stat-glow': glowColor 
            } as React.CSSProperties} 
          >
            <div className={styles.statIcon}>
              <img src={stat.icon} className={styles.pixelIcon} alt={stat.label} />
              {isStatCritical(stat.value) && (
                <img src={warningImg} className={styles.warningIcon} alt="warning" />
              )}
            </div>
            <div className={styles.statInfo}>
              <label>{stat.label}</label>
              <div className={styles.statBar}>
                <div 
                  className={styles.statFill} 
                  style={{ 
                      width: `${stat.value}%`, 
                      background: `linear-gradient(90deg, hsl(${hue}, 85%, 45%), hsl(${hue}, 85%, 55%))`
                  }} 
                />
              </div>
              <span>{stat.value}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
