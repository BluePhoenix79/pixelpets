import React from 'react';
import type { ActionType } from '../../types';
import styles from '../../pages/PetCare/PetCare.module.css';

// Asset Imports
import foodImg from '../../assets/food.png';
import playImg from '../../assets/play.png';
import cleanImg from '../../assets/clean.png';
import restImg from '../../assets/rest.png';
import vetImg from '../../assets/vet.png';
import toyImg from '../../assets/toy.png';

interface ActionButtonsProps {
  balance: number;
  onAction: (action: ActionType) => void;
  disabled?: boolean;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({ 
  balance, 
  onAction,
  disabled = false
}) => {
  const actions = [
    { action: 'feed' as ActionType, icon: foodImg, name: 'Feed', cost: 10 },
    { action: 'play' as ActionType, icon: playImg, name: 'Play', cost: 5 },
    { action: 'clean' as ActionType, icon: cleanImg, name: 'Clean', cost: 8 },
    { action: 'rest' as ActionType, icon: restImg, name: 'Rest', cost: 0 },
    { action: 'vet' as ActionType, icon: vetImg, name: 'Vet', cost: 50 },
    { action: 'toy' as ActionType, icon: toyImg, name: 'Buy Toy', cost: 25 },
  ];

  return (
    <div className={styles.actionsSection}>
      <h3>Care Actions</h3>
      <div className={styles.actionsGrid}>
        {actions.map((btn) => (
          <button 
            key={btn.action} 
            className={styles.actionBtn} 
            onClick={() => onAction(btn.action)}
            disabled={disabled || btn.cost > balance}
          >
            <span className={styles.actionIcon}>
              <img src={btn.icon} className={styles.pixelIcon} alt={btn.name} />
            </span>
            <span className={styles.actionName}>{btn.name}</span>
            <span className={styles.actionCost}>
              {btn.cost === 0 ? 'Free' : `$${btn.cost}`}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
