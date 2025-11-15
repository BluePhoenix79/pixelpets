import { supabase } from './supabase.js';
import { increaseBalance, decreaseBalance, ensureFinance } from './finances.js';

// Current session user and selected pet state
let currentUser = null;
let currentPet = null;
let petId = null;
// In-session cache to avoid duplicate popups
const shownAchievementIds = new Set();
// Client-side state for tasks answered incorrectly in this session
const incorrectTaskIds = new Set();
let shownSavingsGoalPopup = false;
let spendingChartInstance = null;
let balanceHistoryChartInstance = null;

function showSavingsGoalPopup() {
    const popupContainer = document.getElementById('achievement-popup-container');
    const popup = document.createElement('div');
    popup.className = 'achievement-popup show';
    popup.innerHTML = `
        <div class="popup-header">
            <span class="popup-icon">🎉</span>
            <span>Goal Reached!</span>
        </div>
        <div class="popup-list">
            <div class="popup-item">
                <div class="popup-name">You've reached your savings goal!</div>
            </div>
        </div>
        <button class="popup-close">&times;</button>
    `;
    popup.querySelector('.popup-close').addEventListener('click', () => {
        popup.remove();
    });
    popupContainer.appendChild(popup);
    setTimeout(() => {
        popup.remove();
    }, 5000);
}

// --- Utility Functions ---
const delay = ms => new Promise(res => setTimeout(res, ms));

// --- FBLA Questions ---
const FBLA_QUESTIONS = [
    {
        question: "Which of the following is NOT one of the FBLA-PBL goals?",
        options: ["Develop competent, aggressive business leadership.", "Encourage members in the development of individual projects which contribute to the improvement of home, business, and community.", "Develop character, prepare for useful citizenship, and foster patriotism.", "Encourage and practice efficient money management."],
        answer: 1
    },
    {
        question: "What are the three words on the FBLA-PBL emblem?",
        options: ["Service, Education, and Progress", "Leadership, Service, and Career", "Community, Opportunity, and Success", "Knowledge, Leadership, and Community"],
        answer: 0
    },
    {
        question: "In the FBLA Creed, what is the first line?",
        options: ["I believe education is the right of every person.", "I believe in the future of agriculture, with a faith born not of words but of deeds.", "I believe that every person should prepare for a useful occupation.", "I believe that the American business system is the best in the world."],
        answer: 0
    },
    {
        question: "Which national officer is responsible for keeping accurate minutes of all national officer meetings?",
        options: ["President", "Treasurer", "Secretary", "Parliamentarian"],
        answer: 2
    },
    {
        question: "What is the name of the national FBLA-PBL publication for members?",
        options: ["Tomorrow's Business Leader", "The Professional Edge", "FBLA-PBL Adviser Hotline", "The Business Journal"],
        answer: 0
    },
    {
        question: "The first FBLA chapter was chartered in what state in 1942?",
        options: ["Iowa", "Georgia", "Virginia", "Tennessee"],
        answer: 3
    },
    {
        question: "In parliamentary procedure, what motion is used to immediately end a debate?",
        options: ["Adjourn", "Point of Order", "Previous Question", "Recess"],
        answer: 2
    },
    {
        question: "The FBLA-PBL National Center is located in which city?",
        options: ["Washington, D.C.", "Reston, Virginia", "New York, New York", "Chicago, Illinois"],
        answer: 1
    },
    {
        question: "What does the 'PBL' in FBLA-PBL stand for?",
        options: ["Professional Business Leaders", "Public Business League", "Phi Beta Lambda", "Progressive Business Liaisons"],
        answer: 2
    },
    {
        question: "Which of these is the last of the nine goals of FBLA-PBL?",
        options: ["Strengthen the confidence of students in themselves and their work.", "Facilitate the transition from school to work.", "Assist students in the establishment of occupational goals.", "Encourage scholarship and promote school loyalty."],
        answer: 1
    },
    {
        question: "What is the FBLA-PBL motto?",
        options: ["Service, Education, and Progress", "Preparing Leaders for the World of Business", "Education for Business, Business for Education", "Future Business Leaders of Tomorrow"],
        answer: 0
    },
    {
        question: "How many competitive events categories are there at the National Leadership Conference?",
        options: ["3 categories", "4 categories", "5 categories", "6 categories"],
        answer: 1
    },
    {
        question: "What year was FBLA-PBL founded?",
        options: ["1937", "1940", "1942", "1945"],
        answer: 2
    },
    {
        question: "Which colors represent FBLA-PBL?",
        options: ["Red, White, and Blue", "Blue and Gold", "Navy Blue, Royal Blue, and Gold", "Silver and Blue"],
        answer: 2
    },
    {
        question: "What does BAA stand for in the FBLA division structure?",
        options: ["Business Achievement Awards", "Business Administration Association", "Business Advisers of America", "Business Alumni Association"],
        answer: 0
    },
    {
        question: "How many FBLA-PBL goals are there in total?",
        options: ["7 goals", "8 goals", "9 goals", "10 goals"],
        answer: 2
    },
    {
        question: "What is the official flower of FBLA-PBL?",
        options: ["Red Rose", "Blue Rose", "Yellow Rose", "White Rose"],
        answer: 1
    },
    {
        question: "In Robert's Rules of Order, what vote is required to adopt the 'Previous Question' motion?",
        options: ["Simple majority", "Two-thirds vote", "Three-fourths vote", "Unanimous consent"],
        answer: 1
    },
    {
        question: "Which national officer presides over meetings in the absence of the President?",
        options: ["Secretary", "Vice President", "Treasurer", "Reporter"],
        answer: 1
    },
    {
        question: "What is the minimum GPA requirement to hold a national FBLA-PBL office?",
        options: ["2.5", "3.0", "3.5", "3.75"],
        answer: 1
    },
    {
        question: "How many divisions does FBLA-PBL have?",
        options: ["2 divisions", "3 divisions", "4 divisions", "5 divisions"],
        answer: 2
    },
    {
        question: "What does the FBLA Creed emphasize as essential for success?",
        options: ["Competition and determination", "Education and hard work", "Networking and connections", "Innovation and creativity"],
        answer: 1
    },
    {
        question: "The American Enterprise Project is primarily focused on:",
        options: ["Financial literacy education", "Free enterprise system education", "Leadership training", "Career development"],
        answer: 1
    },
    {
        question: "Which parliamentary motion requires a second?",
        options: ["Point of Order", "Request for Information", "Main Motion", "Division of Assembly"],
        answer: 2
    },
    {
        question: "What is the maximum number of times a member can run for the same national officer position?",
        options: ["Once", "Twice", "Three times", "No limit"],
        answer: 1
    },
    {
        question: "FBLA members who earn recognition through competitive events receive:",
        options: ["Medals and ribbons", "Trophies and plaques", "Certificates and pins", "Scholarships only"],
        answer: 1
    },
    {
        question: "The March of Dimes is historically associated with FBLA as:",
        options: ["The founding sponsor", "A national service partner", "The scholarship fund provider", "The competitive events sponsor"],
        answer: 1
    },
    {
        question: "In which month is FBLA Week typically celebrated?",
        options: ["January", "February", "March", "April"],
        answer: 1
    },
    {
        question: "What is the primary purpose of the FBLA National Awards Program?",
        options: ["Provide scholarships", "Recognize achievement and service", "Fund chapter activities", "Promote business careers"],
        answer: 1
    },
    {
        question: "The FBLA-PBL Professional Division is called:",
        options: ["Professional Leadership", "Phi Beta Lambda (PBL)", "Business Professionals of America", "FBLA Alumni"],
        answer: 1
    },
    {
        question: "Which competitive event tests knowledge of FBLA-PBL specifically?",
        options: ["Business Ethics", "FBLA Principles and Procedures", "Introduction to Business", "American Enterprise"],
        answer: 1
    },
    {
        question: "According to FBLA guidelines, how many members must a chapter have to be chartered?",
        options: ["At least 5 members", "At least 10 members", "At least 15 members", "At least 20 members"],
        answer: 0
    },
    {
        question: "The FBLA-PBL mission statement emphasizes bringing what to students?",
        options: ["Career opportunities", "Business and education together", "Leadership training exclusively", "Entrepreneurial skills"],
        answer: 1
    },
    {
        question: "What does 'aggressive business leadership' in the FBLA goals refer to?",
        options: ["Competitive business tactics", "Assertive and proactive leadership", "Hostile takeover strategies", "Dominant market positioning"],
        answer: 1
    },
    {
        question: "The Institute for Leaders is an FBLA program designed for:",
        options: ["New members only", "State officers", "National officer candidates", "All competitive event winners"],
        answer: 1
    },
    {
        question: "Which of the following is a National Fall Leadership Conference goal?",
        options: ["Elect national officers", "Conduct competitive events", "Provide leadership training", "Award scholarships"],
        answer: 2
    },
    {
        question: "In parliamentary procedure, a motion to 'Lay on the Table' is used to:",
        options: ["End debate immediately", "Postpone consideration temporarily", "Refer to a committee", "Close nominations"],
        answer: 1
    },
    {
        question: "The FBLA-PBL Professional Division serves which group?",
        options: ["High school students", "Middle school students", "College/university students and alumni", "Business teachers only"],
        answer: 2
    },
    {
        question: "What is the deadline for National Awards Program submissions?",
        options: ["December 1", "January 15", "March 1", "Varies by state"],
        answer: 2
    },
    {
        question: "Which FBLA publication is specifically for chapter advisers?",
        options: ["Tomorrow's Business Leader", "The Professional Edge", "FBLA-PBL Adviser Hotline", "Business Education Forum"],
        answer: 2
    }
];
let currentTaskInfo = null; // To store task details while question is being answered

// --- DOM Elements ---
const questionModal = document.getElementById('task-question-modal');
const closeQuestionModalBtn = document.getElementById('close-question-modal');
const questionText = document.getElementById('question-text');
const answerOptionsContainer = document.getElementById('answer-options');
const submitAnswerBtn = document.getElementById('submit-answer-btn');
const questionResult = document.getElementById('question-result');





const COSTS = {
    feed: 10,
    play: 5,
    clean: 8,
    rest: 0,
    vet: 50,
    toy: 25
};

const ACHIEVEMENTS = [
    {
        id: 'perfect_health',
        name: 'Perfect Health',
        description: 'Maintain 100% health for your pet',
        icon: '💚',
        check: (pet) => pet.health === 100,
        progress: (pet) => (pet.health / 100) * 100
    },
    {
        id: 'happy_pet',
        name: 'Happiness Master',
        description: 'Keep your pet\'s happiness above 90%',
        icon: '😊',
        check: (pet) => pet.happiness >= 90,
        progress: (pet) => (pet.happiness / 90) * 100
    },
    {
        id: 'well_fed',
        name: 'Gourmet Chef',
        description: 'Keep your pet well-fed with hunger above 80%',
        icon: '🍖',
        check: (pet) => pet.hunger >= 80,
        progress: (pet) => (pet.hunger / 80) * 100
    },
    {
        id: 'clean_pet',
        name: 'Squeaky Clean',
        description: 'Maintain cleanliness above 85%',
        icon: '✨',
        check: (pet) => pet.cleanliness >= 85,
        progress: (pet) => (pet.cleanliness / 85) * 100
    },
    {
        id: 'energetic',
        name: 'Full of Energy',
        description: 'Keep energy levels above 75%',
        icon: '⚡',
        check: (pet) => pet.energy >= 75,
        progress: (pet) => (pet.energy / 75) * 100
    },
    // Finance and activity based achievements (require DB checks)
    {
        id: 'wealthy_balance',
        name: 'Wealthy Saver',
        description: 'Reach a balance of $100 or more',
        icon: '💰',
        asyncCheck: async (userId) => {
            const { data } = await supabase.from('user_finances').select('balance').eq('user_id', userId).maybeSingle();
            return data && data.balance >= 100;
        },
        progress: (pet, stats = {}) => {
            const bal = stats.balance || 0;
            return Math.min(100, (bal / 100) * 100);
        }
    },
    {
        id: 'big_spender',
        name: 'Big Spender',
        description: 'Spend $100 total on your pet',
        icon: '🧾',
        asyncCheck: async (userId) => {
            const { data } = await supabase.from('user_finances').select('total_spent').eq('user_id', userId).maybeSingle();
            return data && data.total_spent >= 100;
        },
        progress: (pet, stats = {}) => {
            const spent = stats.total_spent || 0;
            return Math.min(100, (spent / 100) * 100);
        }
    },
    {
        id: 'task_master',
        name: 'Task Master',
        description: 'Complete 5 tasks',
        icon: '🏆',
        asyncCheck: async (userId) => {
            const { count } = await supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('completed', true);
            return (count || 0) >= 5;
        },
        progress: (pet, stats = {}) => {
            const done = stats.tasks_done || 0;
            return Math.min(100, (done / 5) * 100);
        }
    },
    {
        id: 'vet_visitor',
        name: 'Veterinarian',
        description: 'Visit the vet at least once',
        icon: '🏥',
        asyncCheck: async (userId, petId) => {
            const { count } = await supabase.from('expenses').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('pet_id', petId).eq('expense_type', 'vet');
            return (count || 0) >= 1;
        },
        progress: (pet, stats = {}) => {
            const vetCount = stats.vet_count || 0;
            return Math.min(100, vetCount >= 1 ? 100 : 0);
        }
    },
    {
        id: 'toy_collector',
        name: 'Toy Collector',
        description: 'Buy 3 toys for your pet',
        icon: '🧸',
        asyncCheck: async (userId, petId) => {
            const { count } = await supabase.from('expenses').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('pet_id', petId).eq('expense_type', 'toy');
            return (count || 0) >= 3;
        },
        progress: (pet, stats = {}) => {
            const toyCount = stats.toy_count || 0;
            return Math.min(100, (toyCount / 3) * 100);
        }
    }
];

async function loadAchievements() {
    const achievementsList = document.querySelector('.achievement-grid');
    
    // Get user's achievements from the database
    const { data: userAchievements } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('pet_id', petId);

    const completedAchievements = new Set(
        userAchievements?.map(a => a.achievement_id) || []
    );
    // Best-effort gather DB stats to give progress for achievements that depend on finances/tasks
    const stats = {};
    try {
        const { data: finances } = await supabase.from('user_finances').select('*').eq('user_id', currentUser.id).maybeSingle();
        stats.balance = finances?.balance || 0;
        stats.total_spent = finances?.total_spent || 0;
    } catch (e) {
        stats.balance = 0;
        stats.total_spent = 0;
    }

    try {
        const tasksRes = await supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('user_id', currentUser.id).eq('completed', true);
        stats.tasks_done = tasksRes.count || 0;
    } catch (e) {
        stats.tasks_done = 0;
    }

    try {
        const vetRes = await supabase.from('expenses').select('id', { count: 'exact', head: true }).eq('user_id', currentUser.id).eq('pet_id', petId).eq('expense_type', 'vet');
        stats.vet_count = vetRes.count || 0;
    } catch (e) {
        stats.vet_count = 0;
    }

    try {
        const toyRes = await supabase.from('expenses').select('id', { count: 'exact', head: true }).eq('user_id', currentUser.id).eq('pet_id', petId).eq('expense_type', 'toy');
        stats.toy_count = toyRes.count || 0;
    } catch (e) {
        stats.toy_count = 0;
    }

    achievementsList.innerHTML = ACHIEVEMENTS.map(achievement => {
        const isCompleted = completedAchievements.has(achievement.id);
        const progress = typeof achievement.progress === 'function' ? achievement.progress(currentPet, stats) : 0;
        
        return `
            <div class="achievement-item ${isCompleted ? 'completed' : ''}">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-info">
                    <div class="achievement-name">${achievement.name}</div>
                    <div class="achievement-description">${achievement.description}</div>
                    <div class="achievement-progress">
                        <div class="achievement-progress-bar" style="width: ${Math.min(100, progress)}%"></div>
                    </div>
                </div>
                <div class="achievement-completed">Complete!</div>
            </div>
        `;
    }).join('');
}

async function checkAchievements() {
    // Get current achievements
    const { data: userAchievements } = await supabase
        .from('achievements')
        .select('achievement_id')
        .eq('user_id', currentUser.id)
        .eq('pet_id', petId);

    const completedAchievements = new Set(
        userAchievements?.map(a => a.achievement_id) || []
    );

    // Gather some quick stats for progress functions (best-effort)
    const { data: finances } = await supabase.from('user_finances').select('*').eq('user_id', currentUser.id).maybeSingle();
    const stats = {
        balance: finances?.balance || 0,
        total_spent: finances?.total_spent || 0
    };

    try {
        const tasksRes = await supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('user_id', currentUser.id).eq('completed', true);
        stats.tasks_done = tasksRes.count || 0;
    } catch (e) {
        stats.tasks_done = 0;
    }

    try {
        const vetRes = await supabase.from('expenses').select('id', { count: 'exact', head: true }).eq('user_id', currentUser.id).eq('pet_id', petId).eq('expense_type', 'vet');
        stats.vet_count = vetRes.count || 0;
    } catch (e) {
        stats.vet_count = 0;
    }

    try {
        const toyRes = await supabase.from('expenses').select('id', { count: 'exact', head: true }).eq('user_id', currentUser.id).eq('pet_id', petId).eq('expense_type', 'toy');
        stats.toy_count = toyRes.count || 0;
    } catch (e) {
        stats.toy_count = 0;
    }

    const inserts = [];

    // Check each achievement (supports asyncCheck when provided)
    for (const achievement of ACHIEVEMENTS) {
        if (completedAchievements.has(achievement.id)) continue;

        let achieved = false;
        if (achievement.asyncCheck) {
            try {
                achieved = await achievement.asyncCheck(currentUser.id, petId);
            } catch (err) {
                achieved = false;
                console.warn('Achievement asyncCheck failed', achievement.id, err);
            }
        } else if (achievement.check) {
            achieved = achievement.check(currentPet);
        }

        if (achieved) {
            inserts.push({
                user_id: currentUser.id,
                pet_id: petId,
                achievement_id: achievement.id,
                completed_at: new Date().toISOString()
            });
        }
    }

    let newlyUnlocked = [];
    if (inserts.length > 0) {
        // Insert all new achievements in one batch and get inserted rows
        const { data: inserted, error: insertErr } = await supabase.from('achievements').insert(inserts).select();
        if (insertErr) {
            console.error('Error inserting achievements', insertErr);
        } else if (inserted && inserted.length) {
            // Map inserted achievement_ids back to ACHIEVEMENTS definitions
            const insertedIds = new Set(inserted.map(i => i.achievement_id));
            newlyUnlocked = ACHIEVEMENTS.filter(a => insertedIds.has(a.id));
        }
    }

    // Filter out any that were already shown during this session and show popup for the rest
    const toShow = newlyUnlocked.filter(a => !shownAchievementIds.has(a.id));
    if (toShow.length > 0) {
        toShow.forEach(a => shownAchievementIds.add(a.id));
    }

    // Refresh achievements display to show completed state and updated progress
    await loadAchievements();
}

async function checkAuth() {
    try {
        console.log('=== STARTING checkAuth ===');
        
        // Show loading state
        document.body.style.opacity = '0';
        
        // Read the pet id from the query string FIRST
        const urlParams = new URLSearchParams(window.location.search);
        petId = urlParams.get('id');
        console.log('1. Pet ID from URL:', petId);
        console.log('2. Full URL:', window.location.href);
        
        const { data: { user }, error } = await supabase.auth.getUser();
        console.log('3. User check:', user ? 'User found' : 'No user', error);

        if (error || !user) {
            console.log('4. REDIRECTING: No user found');
            await delay(300);
            window.location.href = 'home.html';
            return;
        }

        // set the current user and reveal header UI
        currentUser = user;
        console.log('5. Current user set:', currentUser.id);
        
        if (!petId) {
            console.log('6. REDIRECTING: No pet ID in URL');
            await delay(300);
            window.location.href = 'index.html';
            return;
        }
        
        console.log('7. About to load pet data...');

        // Ensure the user_finances row exists, then load pet data and finances
        await Promise.all([
            ensureFinance(currentUser.id),
            loadPet(),
            loadUserBalance(),
            loadExpenses(),
            loadTasks(),
            loadAchievements(),
            loadTotalSpent(),
            loadSavingsGoal(),
            delay(500) // Minimum loading time for smooth appearance
        ]);
        
        console.log('8. All data loaded successfully');
        document.getElementById('user-info').style.display = 'flex';

        setupEventListeners();
        startStatDecay();

        // Fade in content
        document.body.style.transition = 'opacity 0.5s ease-in-out';
        document.body.style.opacity = '1';
    } catch (err) {
        console.error('9. ERROR in checkAuth:', err);
        await delay(300);
        window.location.href = 'home.html';
    }
}

async function loadPet() {
    const { data: pet, error } = await supabase
        .from('pets')
        .select('*')
        .eq('id', petId)
        .eq('owner_id', currentUser.id)
        .maybeSingle();

    console.log('Raw pet data from database:', pet);
    console.log('Database error (if any):', error);

    if (!pet || error) {
        alert('Pet not found');
        window.location.href = 'index.html';
        return;
    }

    currentPet = pet;
    console.log('Current pet loaded:', currentPet); // ADD THIS
    
    // Display current stats immediately
    displayPet();
    
    
    console.log('Pet loaded - Stats:', {
        hunger: currentPet.hunger,
        happiness: currentPet.happiness,
        cleanliness: currentPet.cleanliness,
        health: currentPet.health,
        energy: currentPet.energy,
        last_updated: currentPet.last_updated
    });
    
    // Display current stats immediately
    displayPet();
    
    // Then apply any time-based decay if needed
    await applyTimedDecay();
    
    console.log('After applyTimedDecay - Stats:', {
        hunger: currentPet.hunger,
        happiness: currentPet.happiness,
        cleanliness: currentPet.cleanliness,
        health: currentPet.health,
        energy: currentPet.energy
    });
    
    // Update display with decayed stats
    displayPet();
}

async function applyTimedDecay() {
    const lastUpdated = new Date(currentPet.last_updated);
    const now = new Date();
    const hoursPassed = (now - lastUpdated) / (1000 * 60 * 60);

    console.log('Time check - Hours passed:', hoursPassed.toFixed(2));
    console.log('Current pet stats before decay:', {
        hunger: currentPet.hunger,
        happiness: currentPet.happiness,
        cleanliness: currentPet.cleanliness,
        health: currentPet.health,
        energy: currentPet.energy
    });

    // Only apply decay if at least 1 hour has passed
    if (hoursPassed >= 1) {
        // Much gentler decay - only 1 point per hour for main stats
        const decayAmount = Math.floor(hoursPassed);

        currentPet.hunger = Math.max(0, currentPet.hunger - decayAmount);
        currentPet.happiness = Math.max(0, currentPet.happiness - Math.floor(decayAmount * 0.5));
        currentPet.cleanliness = Math.max(0, currentPet.cleanliness - Math.floor(decayAmount * 0.8));

        // Only decay health if stats are critically low
        if (currentPet.hunger < 20 || currentPet.cleanliness < 20) {
            currentPet.health = Math.max(0, currentPet.health - Math.floor(decayAmount * 0.2));
        }

        // Persist the decayed stats back to the database
        await updatePetInDatabase();
        console.log('Applied time-based decay. Decay amount:', decayAmount);
        console.log('Stats after decay:', {
            hunger: currentPet.hunger,
            happiness: currentPet.happiness,
            cleanliness: currentPet.cleanliness,
            health: currentPet.health,
            energy: currentPet.energy
        });
    } else {
        console.log('No decay applied - less than 1 hour passed');
    }
}

function startStatDecay() {
    // Slower decay while actively viewing the pet (every 30 seconds instead of 10)
    setInterval(async () => {
        // Gentle decay
        currentPet.hunger = Math.max(0, currentPet.hunger - 1);
        currentPet.cleanliness = Math.max(0, currentPet.cleanliness - 1);

        // Random happiness decay (less frequent)
        if (Math.random() > 0.7) {
            currentPet.happiness = Math.max(0, currentPet.happiness - 1);
        }

        // Health decay only if stats are critically low
        if (currentPet.hunger < 15 || currentPet.cleanliness < 15) {
            currentPet.health = Math.max(0, currentPet.health - 1);
        }

        // Save changes periodically and update the UI
        await updatePetInDatabase();
        displayPet();
    }, 30000); // 30 seconds for more balanced gameplay
}

function displayPet() {
    document.getElementById('pet-emoji').textContent = getPetEmoji(currentPet.species);
    document.getElementById('pet-name').textContent = currentPet.name;
    document.getElementById('pet-mood').textContent = getMoodEmoji();
    document.getElementById('pet-status').textContent = getPetStatus();

    updateStatBar('hunger', currentPet.hunger);
    updateStatBar('happiness', currentPet.happiness);
    updateStatBar('energy', currentPet.energy);
    updateStatBar('cleanliness', currentPet.cleanliness);
    updateStatBar('health', currentPet.health);
}

function updateStatBar(stat, value) {
    const bar = document.getElementById(`${stat}-bar`);
    const valueSpan = document.getElementById(`${stat}-value`);

    bar.style.width = `${value}%`;
    valueSpan.textContent = `${value}/100`;

    if (value < 30) {
        bar.style.background = 'linear-gradient(90deg, #dc2626, #ef4444)';
    } else if (value < 60) {
        bar.style.background = 'linear-gradient(90deg, #f59e0b, #fbbf24)';
    } else {
        bar.style.background = 'linear-gradient(90deg, var(--fbla-blue-600), var(--fbla-gold))';
    }
}

function getPetStatus() {
    const avgStat = (currentPet.hunger + currentPet.happiness + currentPet.energy + currentPet.cleanliness + currentPet.health) / 5;
    
    // Check for specific critical conditions first
    if (currentPet.health < 20) {
        return 'Needs urgent medical attention! 🏥';
    }
    
    if (currentPet.hunger < 15) {
        return 'Starving and weak... 🍽️';
    }
    
    if (currentPet.cleanliness < 15) {
        return 'Desperately needs a bath! 🛁';
    }
    
    if (currentPet.energy < 15) {
        return 'Exhausted and can barely move... 😴';
    }
    
    // Check for multiple low stats
    const lowStats = [
        currentPet.hunger < 30,
        currentPet.happiness < 30,
        currentPet.cleanliness < 30,
        currentPet.energy < 30
    ].filter(Boolean).length;
    
    if (lowStats >= 3) {
        return 'In really bad shape - needs lots of care! 😰';
    }
    
    if (lowStats >= 2) {
        return 'Struggling with multiple needs... 😟';
    }
    
    // Normal status ranges based on average
    if (avgStat > 90) {
        return 'Living the dream! Absolutely perfect! ✨';
    }
    if (avgStat > 85) {
        return 'Thriving and full of life! 🌟';
    }
    if (avgStat > 75) {
        return 'Very happy and content! 😊';
    }
    if (avgStat > 65) {
        return 'Happy and healthy! 💚';
    }
    if (avgStat > 55) {
        return 'Doing pretty well overall! 👍';
    }
    if (avgStat > 45) {
        return 'Doing okay, but could use some attention 🤔';
    }
    if (avgStat > 35) {
        return 'Starting to feel neglected... 😕';
    }
    if (avgStat > 25) {
        return 'Not doing well, needs care soon! ⚠️';
    }
    if (avgStat > 15) {
        return 'Struggling badly and needs immediate care! 🚨';
    }
    
    return 'Critical condition! Needs help NOW! 🆘';
}

function getMoodEmoji() {
    const avgStat = (currentPet.hunger + currentPet.happiness + currentPet.energy + currentPet.cleanliness + currentPet.health) / 5;
    
    // Special moods based on specific stats
    if (currentPet.happiness > 90 && avgStat > 80) return '🤩'; // Ecstatic
    if (currentPet.energy < 20) return '😴'; // Sleepy
    if (currentPet.hunger < 20) return '😫'; // Hungry/distressed
    if (currentPet.cleanliness < 20) return '🤢'; // Dirty/sick
    if (currentPet.health < 30) return '🤒'; // Sick
    
    // General mood ranges
    if (avgStat > 85) return '😄'; // Very happy
    if (avgStat > 70) return '😊'; // Happy
    if (avgStat > 55) return '🙂'; // Content
    if (avgStat > 40) return '😐'; // Neutral
    if (avgStat > 25) return '😟'; // Worried
    if (avgStat > 15) return '😢'; // Sad
    
    return '😭'; // Very sad/critical
}

function getPetEmoji(species) {
    const emojis = {
        dog: '🐶',
        cat: '🐱',
        bird: '🐦',
        fish: '🐠',
        mouse: '🐭'
    };
    return emojis[species] || '🐾';
}

async function loadUserBalance() {
    const { data, error } = await supabase
        .from('user_finances')
        .select('balance')
        .eq('user_id', currentUser.id)
        .maybeSingle();

    if (error) {
        console.error('Error loading user balance:', error);
        return;
    }

    if (data) {
        document.getElementById('balance-amount').textContent = `$${data.balance.toFixed(2)}`;
        return data.balance;
    }
    return 0;
}

async function loadExpenses() {
    const { data: expenses, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('pet_id', petId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error loading expenses:', error);
        return [];
    }

    return expenses || [];
}

function setupEventListeners() {
    document.getElementById('logout-btn').addEventListener('click', async () => {
        // Fade out before redirect
        document.body.style.transition = 'opacity 0.3s ease-out';
        document.body.style.opacity = '0';
        
        await delay(300);
        await supabase.auth.signOut();
        window.location.href = 'home.html';
    });
    
    document.getElementById('settings-btn').addEventListener('click', () => {
        // Fade out before redirect
        document.body.style.transition = 'opacity 0.3s ease-out';
        document.body.style.opacity = '0';
        
        setTimeout(() => {
            window.location.href = '../settings/settings.html';
        }, 300);
    });
    
    document.getElementById('back-btn').addEventListener('click', () => {
        // Fade out before redirect
        document.body.style.transition = 'opacity 0.3s ease-out';
        document.body.style.opacity = '0';
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 300);
    });

    document.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const action = btn.dataset.action;
            const cost = parseInt(btn.dataset.cost);
            await performAction(action, cost);
        });
    });

    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            switchTab(tab);
        });
    });

    document.getElementById('generate-tasks-btn').addEventListener('click', generateTasks);

    document.getElementById('tasks-list').addEventListener('click', async (e) => {
        if (e.target.classList.contains('task-complete-btn')) {
            const taskId = e.target.dataset.taskId;
            await triggerTaskQuestion(taskId);
        }
    });

    // Modal listeners
    closeQuestionModalBtn.addEventListener('click', () => questionModal.style.display = 'none');
    submitAnswerBtn.addEventListener('click', handleSubmitAnswer);
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');

    if (tabName === 'budget') {
        // Render charts when budget tab is active
        loadExpenses().then(expenses => renderSpendingChart(expenses));
        fetchBalanceHistory().then(history => renderBalanceHistoryChart(history));
    }
}

async function performAction(action, cost) {
    const balance = await loadUserBalance();

    if (cost > balance) {
        alert('Not enough money! Complete tasks to earn more.');
        return;
    }

    console.log('Before action - Pet stats:', {
        hunger: currentPet.hunger,
        happiness: currentPet.happiness,
        energy: currentPet.energy,
        cleanliness: currentPet.cleanliness,
        health: currentPet.health
    });

    const actionMap = {
        feed: () => {
            currentPet.hunger = Math.min(100, currentPet.hunger + 30);
            currentPet.happiness = Math.min(100, currentPet.happiness + 5);
            return { item: 'Pet Food', type: 'food' };
        },
        play: () => {
            currentPet.happiness = Math.min(100, currentPet.happiness + 20);
            currentPet.energy = Math.max(0, currentPet.energy - 10);
            currentPet.hunger = Math.max(0, currentPet.hunger - 5);
            return { item: 'Playtime', type: 'toy' };
        },
        clean: () => {
            currentPet.cleanliness = Math.min(100, currentPet.cleanliness + 40);
            currentPet.happiness = Math.min(100, currentPet.happiness + 10);
            return { item: 'Bath & Grooming', type: 'supplies' };
        },
        rest: () => {
            currentPet.energy = Math.min(100, currentPet.energy + 30);
            currentPet.hunger = Math.max(0, currentPet.hunger - 5);
            return { item: 'Rest', type: 'rest' };
        },
        vet: () => {
            currentPet.health = 100;
            currentPet.happiness = Math.max(0, currentPet.happiness - 10);
            return { item: 'Veterinary Care', type: 'vet' };
        },
        toy: () => {
            currentPet.happiness = Math.min(100, currentPet.happiness + 30);
            return { item: 'New Toy', type: 'toy' };
        }
    };

    const result = actionMap[action]();

    console.log('After action - Pet stats:', {
        hunger: currentPet.hunger,
        happiness: currentPet.happiness,
        energy: currentPet.energy,
        cleanliness: currentPet.cleanliness,
        health: currentPet.health
    });

    // CRITICAL: Save to database immediately
    await updatePetInDatabase();

    // Handle expenses
    if (cost > 0 && result) {
        await deductBalance(cost);
        await addExpense(result.item, result.type, cost);
        await loadExpenses();
    }

    // Refresh balance display after action
    await loadUserBalance();
    displayPet();
    
    // Re-check achievements after any action
    await checkAchievements();

    // Update charts if budget tab is active
    if (document.querySelector('.tab-button[data-tab="budget"]').classList.contains('active')) {
        loadExpenses().then(expenses => renderSpendingChart(expenses));
        fetchBalanceHistory().then(history => renderBalanceHistoryChart(history));
    }
    
    console.log('Action completed and saved to database');
}

async function updatePetInDatabase() {
    console.log('Saving pet stats to database:', {
        hunger: currentPet.hunger,
        happiness: currentPet.happiness,
        energy: currentPet.energy,
        cleanliness: currentPet.cleanliness,
        health: currentPet.health
    });

    const { data, error } = await supabase
        .from('pets')
        .update({
            hunger: currentPet.hunger,
            happiness: currentPet.happiness,
            energy: currentPet.energy,
            cleanliness: currentPet.cleanliness,
            health: currentPet.health,
            last_updated: new Date().toISOString()
        })
        .eq('id', petId)
        .select();

    if (error) {
        console.error('Error saving pet to database:', error);
    } else {
        console.log('Pet saved successfully:', data);
    }
    
    // Check achievements after pet stats update
    checkAchievements();
}

async function deductBalance(amount) {
    // Use helper to safely decrement balance and increment total_spent
    const updatedFinance = await decreaseBalance(currentUser.id, amount);
    if (updatedFinance) {
        document.getElementById('balance-amount').textContent = `$${updatedFinance.balance}`;
        await loadUserBalance();
        await loadTotalSpent();
        await updateSavingsGoalProgress();
    }
}



async function addExpense(itemName, type, amount) {
    await supabase.from('expenses').insert({
        pet_id: petId,
        user_id: currentUser.id,
        expense_type: type,
        item_name: itemName,
        amount: amount
    });
}

async function fetchBalanceHistory() {
    // Fetch all expenses and tasks to reconstruct balance history
    const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('amount, created_at')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: true });

    const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('reward_amount, completed_at')
        .eq('user_id', currentUser.id)
        .eq('completed', true)
        .order('created_at', { ascending: true }); // Order by created_at for tasks too

    if (expensesError) console.error('Error fetching expenses for history:', expensesError);
    if (tasksError) console.error('Error fetching tasks for history:', tasksError);

    const events = [];
    if (expenses) {
        expenses.forEach(exp => events.push({ type: 'expense', amount: exp.amount, date: new Date(exp.created_at) }));
    }
    if (tasks) {
        tasks.forEach(task => events.push({ type: 'task', amount: task.reward_amount, date: new Date(task.completed_at) })); // Use completed_at for tasks
    }

    events.sort((a, b) => a.date - b.date);

    let currentBalance = (await loadUserBalance()) || 0; // Get current balance
    const balanceHistory = [{ date: new Date(), balance: currentBalance }]; // Start with current balance

    // Reconstruct history backwards from current balance
    for (let i = events.length - 1; i >= 0; i--) {
        const event = events[i];
        if (event.type === 'expense') {
            currentBalance += event.amount; // If it was an expense, add it back
        } else if (event.type === 'task') {
            currentBalance -= event.amount; // If it was a task reward, subtract it
        }
        balanceHistory.unshift({ date: event.date, balance: currentBalance });
    }
    
    // Ensure unique dates for chart labels
    const uniqueHistory = [];
    const dates = new Set();
    for (const entry of balanceHistory) {
        const dateString = entry.date.toDateString();
        if (!dates.has(dateString)) {
            uniqueHistory.push(entry);
            dates.add(dateString);
        } else {
            // If date exists, update the balance for that date
            uniqueHistory[uniqueHistory.length - 1].balance = entry.balance;
        }
    }

    return uniqueHistory;
}

function renderSpendingChart(expenses) {
    const ctx = document.getElementById('spendingChart').getContext('2d');

    const categories = {};
    expenses.forEach(exp => {
        categories[exp.expense_type] = (categories[exp.expense_type] || 0) + exp.amount;
    });

    const data = {
        labels: Object.keys(categories),
        datasets: [{
            data: Object.values(categories),
            backgroundColor: [
                '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
            ],
            hoverBackgroundColor: [
                '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
            ]
        }]
    };

    if (spendingChartInstance) {
        spendingChartInstance.destroy();
    }
    spendingChartInstance = new Chart(ctx, {
        type: 'pie',
        data: data,
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    }
                }
            }
        }
    });
}

function renderBalanceHistoryChart(historyData) {
    const ctx = document.getElementById('balanceHistoryChart').getContext('2d');

    const labels = historyData.map(entry => entry.date.toLocaleDateString());
    const dataPoints = historyData.map(entry => entry.balance);

    const data = {
        labels: labels,
        datasets: [{
            label: 'Balance',
            data: dataPoints,
            fill: false,
            borderColor: getComputedStyle(document.documentElement).getPropertyValue('--fbla-blue-600'),
            tension: 0.1
        }]
    };

    if (balanceHistoryChartInstance) {
        balanceHistoryChartInstance.destroy();
    }
    balanceHistoryChartInstance = new Chart(ctx, {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-muted')
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-muted')
                    }
                },
                y: {
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-muted')
                    }
                }
            }
        }
    });
}

async function loadTasks() {
    const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('completed', false) 
        .order('created_at', { ascending: false });

    const tasksList = document.getElementById('tasks-list');

    if (!tasks || tasks.length === 0) {
        tasksList.innerHTML = '<p class="no-data">No tasks available. Generate new ones!</p>';
        return;
    }

    tasksList.innerHTML = '';
    for (const task of tasks) {
        const isIncorrect = incorrectTaskIds.has(task.id);
        const taskItem = document.createElement('div');
        taskItem.className = 'task-item';
        if (isIncorrect) {
            taskItem.classList.add('incorrect');
        }
        taskItem.dataset.taskId = task.id;

        const taskInfo = document.createElement('div');
        taskInfo.className = 'task-info';

        const taskName = document.createElement('div');
        taskName.className = 'task-name';
        taskName.textContent = task.task_name;

        const taskReward = document.createElement('div');
        taskReward.className = 'task-reward';
        taskReward.textContent = `Reward: +$${task.reward_amount}`;

        const button = document.createElement('button');
        button.className = 'task-complete-btn';
        button.dataset.taskId = task.id;
        if (isIncorrect) {
            button.textContent = 'Incorrect';
            button.disabled = true;
        } else {
            button.textContent = 'Complete';
        }

        taskInfo.appendChild(taskName);
        taskInfo.appendChild(taskReward);
        taskItem.appendChild(taskInfo);
        taskItem.appendChild(button);
        tasksList.appendChild(taskItem);
    }
}

async function triggerTaskQuestion(taskId) {
    if (incorrectTaskIds.has(taskId)) return;

    const { data: task } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .maybeSingle();

    if (!task || task.completed) return;

    currentTaskInfo = {
        id: task.id,
        reward: Number(task.reward_amount) || 0,
        question: FBLA_QUESTIONS[Math.floor(Math.random() * FBLA_QUESTIONS.length)]
    };

    questionText.textContent = currentTaskInfo.question.question;
    answerOptionsContainer.innerHTML = '';
    currentTaskInfo.question.options.forEach((option, index) => {
        const label = document.createElement('label');
        label.className = 'answer-option';

        const input = document.createElement('input');
        input.type = 'radio';
        input.name = 'answer';
        input.value = index;

        label.appendChild(input);
        label.appendChild(document.createTextNode(option));
        answerOptionsContainer.appendChild(label);
    });
    questionResult.textContent = '';
    questionModal.style.display = 'block';
}

async function handleSubmitAnswer() {
    const selectedOption = document.querySelector('input[name="answer"]:checked');
    if (!selectedOption) {
        alert('Please select an answer.');
        return;
    }

    submitAnswerBtn.disabled = true;
    const isCorrect = parseInt(selectedOption.value) === currentTaskInfo.question.answer;

    if (isCorrect) {
        questionResult.textContent = `Correct! You earned $${currentTaskInfo.reward}!`;
        questionResult.style.color = '#22c55e';

        try {
            const { data: currentFinance, error: fetchError } = await supabase
                .from('user_finances')
                .select('*')
                .eq('user_id', currentUser.id)
                .single();

            if (fetchError) {
                console.error('Error fetching balance:', fetchError);
                return;
            }

            const newBalance = currentFinance.balance + currentTaskInfo.reward;
            const newTotalEarned = currentFinance.total_earned + currentTaskInfo.reward;

            const { data: updatedFinance, error: updateError } = await supabase
                .from('user_finances')
                .update({
                    balance: newBalance,
                    total_earned: newTotalEarned
                })
                .eq('user_id', currentUser.id)
                .select()
                .single();

            if (updateError) {
                console.error('Error updating balance:', updateError);
            } else {
                document.getElementById('balance-amount').textContent = `$${updatedFinance.balance.toFixed(2)}`;
                console.log('Balance updated successfully to:', updatedFinance.balance);
                await updateSavingsGoalProgress();
            }
        } catch (err) {
            console.error('Error updating balance:', err);
        }

        const taskItem = document.querySelector(`[data-task-id="${currentTaskInfo.id}"]`);
        if (taskItem) {
            taskItem.classList.add('correct');
            const btn = taskItem.querySelector('.task-complete-btn');
            if (btn) {
                btn.textContent = 'Correct';
                btn.disabled = true;
            }
        }
        
        await supabase
            .from('tasks')
            .update({ completed: true, completed_at: new Date().toISOString() })
            .eq('id', currentTaskInfo.id);

    } else {
        questionResult.textContent = 'Incorrect.';
        questionResult.style.color = '#dc2626';
        
        incorrectTaskIds.add(currentTaskInfo.id);
        
        const taskItem = document.querySelector(`[data-task-id="${currentTaskInfo.id}"]`);
        if (taskItem) {
            taskItem.classList.add('incorrect');
            const btn = taskItem.querySelector('.task-complete-btn');
            if (btn) {
                btn.textContent = 'Incorrect';
                btn.disabled = true;
            }
        }
    }

    setTimeout(async () => {
        questionModal.style.display = 'none';
        currentTaskInfo = null;
        submitAnswerBtn.disabled = false;
        await checkAchievements();
        // Update charts if budget tab is active
        if (document.querySelector('.tab-button[data-tab="budget"]').classList.contains('active')) {
            loadExpenses().then(expenses => renderSpendingChart(expenses));
            fetchBalanceHistory().then(history => renderBalanceHistoryChart(history));
        }
    }, 2000);
}

async function generateTasks() {
    incorrectTaskIds.clear();

    const taskTemplates = [
        { name: 'Clean your room', reward: 15 },
        { name: 'Do homework for 30 minutes', reward: 12 },
        { name: 'Help with dishes', reward: 10 },
        { name: 'Take out the trash', reward: 8 },
        { name: 'Read for 20 minutes', reward: 12 },
        { name: 'Exercise for 15 minutes', reward: 15 },
        { name: 'Water the plants', reward: 8 },
        { name: 'Organize your desk', reward: 10 },
        { name: 'Help prepare a meal', reward: 14 },
        { name: 'Practice a skill', reward: 12 }
    ];

    const selectedTasks = taskTemplates
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

    try {
        await supabase
            .from('tasks')
            .delete()
            .eq('user_id', currentUser.id)
            .eq('status', 'pending');

        const inserts = selectedTasks.map(t => ({
            user_id: currentUser.id,
            task_name: t.name,
            reward_amount: t.reward,
            completed: false
        }));

        const { error } = await supabase.from('tasks').insert(inserts);
        if (error) throw error;

        await loadTasks();
    } catch (err) {
        console.error('Error generating tasks:', err);
        alert('Unable to generate tasks right now. Check console for details.');
    }
}

async function loadTotalSpent() {
    const { data, error } = await supabase
        .from('user_finances')
        .select('total_spent')
        .eq('user_id', currentUser.id)
        .maybeSingle();

    if (error) {
        console.error('Error loading total spent:', error);
        return;
    }

    if (data) {
        document.getElementById('total-spent-amount').textContent = `$${data.total_spent.toFixed(2)}`;
    }
}

async function loadSavingsGoal() {
    const { data: goal, error } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('pet_id', petId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) {
        console.error('Error loading savings goal:', error);
        return;
    }

    if (goal) {
        document.getElementById('savings-goal-status').textContent = `Goal: $${goal.goal_amount.toFixed(2)}`;
        document.getElementById('savings-goal-progress').style.display = 'block';
        updateSavingsGoalProgress();
    } else {
        document.getElementById('savings-goal-status').textContent = 'No goal set.';
        document.getElementById('savings-goal-progress').style.display = 'none';
    }
}

async function updateSavingsGoalProgress() {
    const { data: goal, error } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('pet_id', petId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error || !goal) {
        return;
    }

    const balance = parseFloat(document.getElementById('balance-amount').textContent.replace('$', ''));
    const progress = Math.min(100, (balance / goal.goal_amount) * 100);
    document.getElementById('savings-goal-progress-bar').style.width = `${progress}%`;
    document.getElementById('savings-goal-progress-value').textContent = `$${balance.toFixed(2)} / $${goal.goal_amount.toFixed(2)}`;

    if (balance >= goal.goal_amount && !shownSavingsGoalPopup) {
        showSavingsGoalPopup();
        shownSavingsGoalPopup = true;
    }
}

async function setSavingsGoal() {
    const goalAmount = parseFloat(document.getElementById('savings-goal-input').value);
    if (isNaN(goalAmount) || goalAmount <= 0) {
        alert('Please enter a valid goal amount.');
        return;
    }

    const { error } = await supabase.from('savings_goals').insert({
        user_id: currentUser.id,
        pet_id: petId,
        goal_amount: goalAmount
    });

    if (error) {
        console.error('Error setting savings goal:', error);
        alert('Failed to set savings goal.');
        return;
    }

    shownSavingsGoalPopup = false;
    await loadSavingsGoal();
    await updateSavingsGoalProgress();
    // Update charts if budget tab is active
    if (document.querySelector('.tab-button[data-tab="budget"]').classList.contains('active')) {
        loadExpenses().then(expenses => renderSpendingChart(expenses));
        fetchBalanceHistory().then(history => renderBalanceHistoryChart(history));
    }
}

document.getElementById('set-savings-goal-btn').addEventListener('click', setSavingsGoal);

checkAuth();