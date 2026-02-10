import { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // Import Auth Context
import styles from './Landing.module.css';
import dogImg from '../../assets/dog.png';
import catImg from '../../assets/cat.png';
import mouseImg from '../../assets/mouse.png';

export default function Landing() {
  const infoSectionRef = useRef<HTMLElement>(null);
  const { user } = useAuth(); // Add useAuth hook
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Scroll animation with IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.visible);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
    );

    // Observe all info cards
    const cards = infoSectionRef.current?.querySelectorAll(`.${styles.infoCard}`);
    cards?.forEach((card, index) => {
      // Add staggered animation delay
      (card as HTMLElement).style.transitionDelay = `${index * 0.1}s`;
      observer.observe(card);
    });

    // Also observe the CTA section
    const cta = infoSectionRef.current?.querySelector(`.${styles.ctaSection}`);
    if (cta) {
      (cta as HTMLElement).style.transitionDelay = '0.4s';
      observer.observe(cta);
    }

    return () => observer.disconnect();
  }, []);

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


          
          <div className={styles.scrollIndicator}>
            <span>SCROLL FOR INFO</span>
            <div className={styles.arrow}>v</div>
          </div>
        </div>
      </section>

      <section className={styles.infoSection} ref={infoSectionRef}>
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
           <div className={styles.ctaButtons}>
             <Link to="/auth" className={styles.secondaryButton} state={{ mode: 'signup' }}>CREATE ACCOUNT</Link>
             <Link to="/auth" className={styles.secondaryOutlineButton} state={{ mode: 'login' }}>LOG IN</Link>
           </div>
        </div>
      </section>
      
      <footer className={styles.footer}>
        <p>&copy; 2026 PixelPets. All rights reserved.</p>
      </footer>
    </div>
  );
}
