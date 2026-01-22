import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../Landing.css';

const Landing = () => {
    const navigate = useNavigate();

    return (
        <div className="landing-wrapper">
            <header>
                <div className="header-content">
                    <div className="logo">
                        <span className="logo-icon">🐾</span>
                        <h1>PixelPets</h1>
                    </div>
                    <nav>
                        <a href="#about">About</a>
                        <a href="#features">Features</a>
                        <a href="#start">Play</a>
                    </nav>
                </div>
            </header>

            <main>
                <section className="scroll-section">
                    <div className="container">
                        <div className="hero">
                            <div className="hero-icon">🐶🐱🐰</div>
                            <h2>Your Digital Companion Awaits!</h2>
                            <p style={{ color: '#718096', fontSize: '1.1rem', marginBottom: '1.5rem' }}>
                                Create, nurture, and watch your virtual pet grow
                            </p>
                        </div>
                    </div>
                </section>

                <section className="scroll-section" id="about">
                    <div className="container">
                        <div className="content-section">
                            <h3>What is PixelPets?</h3>
                            <p>
                                Step into the world of digital pet ownership! PixelPets is an interactive experience where you raise and care for your very own digital companion. Choose from different pet types, give them a unique name, and watch as they respond to your love and attention with changing emotions, behaviors, and appearances.
                            </p>
                            <p>
                                But pet ownership isn't just fun and games—it's also about responsibility! Learn valuable lessons about budgeting and financial planning as you manage the costs of keeping your pet happy and healthy.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="scroll-section">
                    <div className="container">
                        <div className="content-section">
                            <h3>How It Works</h3>
                            <p>
                                Your journey begins with choosing and naming your perfect pet companion. From there, you'll engage in daily care activities that shape your pet's happiness and development. Every decision matters—will you spend your currency on premium food or save up for that special toy?
                            </p>
                            <p>
                                As you care for your pet, they'll develop and change over time! Consistent attention leads to evolution, new tricks, and special badges. Neglect, however, will show in their mood and health. The choice is yours—will you be the best pet parent possible?
                            </p>
                        </div>
                    </div>
                </section>

                <section className="scroll-section" id="features">
                    <div className="container">
                        <div className="content-section">
                            <h3>Game Features</h3>
                            <div className="features-grid">
                                <div className="feature-card">
                                    <h4>Customize Your Pet</h4>
                                    <p>Choose your pet type, name them, and make them uniquely yours!</p>
                                </div>
                                <div className="feature-card">
                                    <h4>Daily Care</h4>
                                    <p>Feed, play, rest, clean, and perform health checks to keep your pet thriving.</p>
                                </div>
                                <div className="feature-card">
                                    <h4>Emotional Responses</h4>
                                    <p>Watch your pet react with happiness, sadness, energy, or sickness based on your care.</p>
                                </div>
                                <div className="feature-card">
                                    <h4>Budget Management</h4>
                                    <p>Track expenses including food, vet visits, toys, and supplies with in-game currency.</p>
                                </div>
                            </div>
                        </div>

                        <div className="highlights">
                            <h2 style={{ color: '#1e3a8a', marginBottom: '1rem' }}>Learning Objectives</h2>
                            <ul>
                                <li>Understand the financial responsibilities of pet ownership</li>
                                <li>Learn to budget and manage resources effectively</li>
                                <li>Develop empathy through caring for a digital companion</li>
                                <li>Track expenses including food costs, veterinary care, and entertainment</li>
                                <li>Set savings goals and earn currency through tasks and achievements</li>
                                <li>Watch your pet evolve, learn tricks, and earn badges as you progress</li>
                            </ul>
                        </div>

                        <div className="cta-section" id="start">
                            <p className="tagline">
                                Ready to begin your virtual pet journey?
                            </p>
                            <button className="start-button" onClick={() => navigate('/auth')}>
                                Start Playing Now!
                            </button>
                        </div>
                    </div>
                </section>
            </main>

            <footer>
                <div className="footer-content">
                    <p>&copy; 2025 PixelPets. All rights reserved.</p>
                    <div className="footer-links">
                        <a href="#">Privacy Policy</a>
                        <a href="#">Terms of Service</a>
                        <a href="#">Contact Us</a>
                        <a href="#">Help & Support</a>
                    </div>
                    <p style={{ marginTop: '1rem', color: '#a0aec0', fontSize: '0.9rem' }}>
                        Made for pet lovers everywhere!
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
