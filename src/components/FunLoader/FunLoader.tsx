import React, { useState, useEffect } from 'react';
import styles from './FunLoader.module.css';
import dogImg from '../../assets/dog.png';
import catImg from '../../assets/cat.png';
import birdImg from '../../assets/bird.png';

export const FunLoader: React.FC = () => {
  const [text, setText] = useState('Generating question...');
  
  const funnyTexts = [
    'Herding kittens...',
    'Chasing tails...',
    'Digging for answers...',
    'Counting kibble...',
    'Waking up the hamster...',
    'Consulting the wise owl...',
    'Fetching data...'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setText(funnyTexts[Math.floor(Math.random() * funnyTexts.length)]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.loaderContainer}>
      <div className={styles.petParade}>
        <div className={styles.bouncer} style={{ animationDelay: '0s' }}>
          <img src={dogImg} alt="dog" className={styles.pixelIcon} />
        </div>
        <div className={styles.bouncer} style={{ animationDelay: '0.2s' }}>
           <img src={catImg} alt="cat" className={styles.pixelIcon} />
        </div>
        <div className={styles.bouncer} style={{ animationDelay: '0.4s' }}>
           <img src={birdImg} alt="bird" className={styles.pixelIcon} />
        </div>
      </div>
      <div className={styles.loadingText}>{text}</div>
    </div>
  );
};
