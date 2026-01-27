import { Link } from 'react-router-dom';
import styles from './Landing.module.css';
import dogImg from '../../assets/dog.png';
import catImg from '../../assets/cat.png';
import mouseImg from '../../assets/mouse.png';

export default function Landing() {
  return (
    <div className={styles.landingPage}>
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <div className={styles.titleWrapper}>
            <h1 className={styles.mainTitle}>PIXEL PETS</h1>
            <div className={styles.subtitle}>DIGITAL COMPANION SIMULATOR</div>
          </div>

          <div className={styles.petShowcase}>
            <div className={styles.floatingPet}>
              <img src={dogImg} alt="dog" />
            </div>
            <div className={styles.floatingPet}>
              <img src={catImg} alt="cat" />
            </div>
            <div className={styles.floatingPet}>
              <img src={mouseImg} alt="mouse" />
            </div>
          </div>

          <Link to="/auth" className={styles.playButton}>
            START GAME
          </Link>
          
          <div className={styles.scrollIndicator}>
            <span>SCROLL FOR INFO</span>
            <div className={styles.arrow}>↓</div>
          </div>
        </div>
      </section>

      <section className={styles.infoSection}>
        <div className={styles.infoContainer}>
          <div className={styles.infoCard}>
            <h2>ADOPT & RAISE</h2>
            <p>Choose your perfect pixel companion. Name them, love them, and watch them grow!</p>
          </div>
          
          <div className={styles.infoCard}>
            <h2>LEARN BUDGETING</h2>
            <p>Manage your finances, earn rewards, and make smart spending decisions for your pet.</p>
          </div>

          <div className={styles.infoCard}>
            <h2>DAILY STREAKS</h2>
            <p>Log in every day to keep your streak alive and earn bonus rewards!</p>
          </div>
          
          <div className={styles.infoCard}>
            <h2>AI CHALLENGES</h2>
            <p>Complete unique, AI-generated quests and trivia to level up your knowledge.</p>
          </div>
        </div>

        <div className={styles.ctaSection}>
           <h2>READY TO PLAY?</h2>
           <Link to="/auth" className={styles.secondaryButton}>CREATE ACCOUNT</Link>
        </div>
      </section>
      
      <footer className={styles.footer}>
        <p>&copy; 2026 PixelPets. All rights reserved.</p>
      </footer>
    </div>
  );
}
