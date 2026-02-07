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
  const getStatColor = (value: number) => {
    if (value < 30) return 'linear-gradient(90deg, #dc2626, #ef4444)';
    if (value < 60) return 'linear-gradient(90deg, #f59e0b, #fbbf24)';
    return 'linear-gradient(90deg, var(--fbla-blue-600), var(--fbla-gold))';
  };

  const isStatCritical = (value: number) => value < 20;
  const isStatLow = (value: number) => value < 40;

  const stats = [
    { key: 'hunger', icon: foodImg, label: 'Hunger', value: pet.hunger },
    { key: 'happiness', icon: happinessImg, label: 'Happiness', value: pet.happiness },
    { key: 'energy', icon: energyImg, label: 'Energy', value: pet.energy },
    { key: 'cleanliness', icon: cleanlinessImg, label: 'Cleanliness', value: pet.cleanliness },
    { key: 'health', icon: healthImg, label: 'Health', value: pet.health },
    { key: 'love', icon: loveImg, label: 'Love', value: pet.love || 50 },
  ];

  return (
    <div className={styles.statsGrid}>
      {stats.map((stat) => (
        <div 
          key={stat.key} 
          className={`${styles.statCard} ${isStatCritical(stat.value) ? styles.statCritical : isStatLow(stat.value) ? styles.statWarning : ''}`}
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
                style={{ width: `${stat.value}%`, background: getStatColor(stat.value) }} 
              />
            </div>
            <span>{stat.value}%</span>
          </div>
        </div>
      ))}
    </div>
  );
};
