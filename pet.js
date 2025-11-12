import { supabase } from './supabase.js';
import { increaseBalance, decreaseBalance, ensureFinance } from './finances.js';

// Current session user and selected pet state
let currentUser = null;
let currentPet = null;
let petId = null;
// In-session cache to avoid duplicate popups
const shownAchievementIds = new Set();

// Cost table used by the UI action buttons
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
        // best-effort progress: if balance not available, return 0
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

    // lightweight counts (may return null if DB doesn't support head/count the same way)
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
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        window.location.href = 'auth.html';
        return;
    }

    // set the current user and reveal header UI
    currentUser = user;
    document.getElementById('user-info').style.display = 'flex';

    // Read the pet id from the query string; redirect home if missing
    const urlParams = new URLSearchParams(window.location.search);
    petId = urlParams.get('id');

    if (!petId) {
        window.location.href = 'index.html';
        return;
    }

    // Ensure the user_finances row exists, then load pet data and finances
    await ensureFinance(currentUser.id);
    await loadPet();
    await loadUserBalance();
    await loadExpenses();
    await loadTasks();
    setupEventListeners();
    startStatDecay();
    loadAchievements();
}

async function loadPet() {
    const { data: pet, error } = await supabase
        .from('pets')
        .select('*')
        .eq('id', petId)
        .eq('owner_id', currentUser.id)
        .maybeSingle();

    if (!pet || error) {
        alert('Pet not found');
        window.location.href = 'index.html';
        return;
    }

    currentPet = pet;
    // If some time passed while the user was away, apply decay to stats
    await applyTimedDecay();
    displayPet();
}

async function applyTimedDecay() {
    const lastUpdated = new Date(currentPet.last_updated);
    const now = new Date();
    const hoursPassed = (now - lastUpdated) / (1000 * 60 * 60);

        // Only apply decay if at least a small fraction of an hour has passed
        if (hoursPassed > 0.1) {
        const decayAmount = Math.floor(hoursPassed * 2);

        currentPet.hunger = Math.max(0, currentPet.hunger - decayAmount);
        currentPet.happiness = Math.max(0, currentPet.happiness - Math.floor(decayAmount * 0.5));
        currentPet.cleanliness = Math.max(0, currentPet.cleanliness - Math.floor(decayAmount * 0.8));

        if (currentPet.hunger < 30 || currentPet.cleanliness < 30) {
            currentPet.health = Math.max(0, currentPet.health - Math.floor(decayAmount * 0.3));
        }

        // Persist the decayed stats back to the database
        await updatePetInDatabase();
    }
}

function startStatDecay() {
    setInterval(async () => {
        currentPet.hunger = Math.max(0, currentPet.hunger - 1);
        currentPet.cleanliness = Math.max(0, currentPet.cleanliness - 1);

        if (Math.random() > 0.7) {
            currentPet.happiness = Math.max(0, currentPet.happiness - 1);
        }

        if (currentPet.hunger < 20 || currentPet.cleanliness < 20) {
            currentPet.health = Math.max(0, currentPet.health - 1);
        }

        // Save changes periodically and update the UI
        await updatePetInDatabase();
        displayPet();
    }, 30000);
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

function getMoodEmoji() {
    const avgStat = (currentPet.hunger + currentPet.happiness + currentPet.energy + currentPet.cleanliness + currentPet.health) / 5;

    if (avgStat > 80) return '😄';
    if (avgStat > 60) return '😊';
    if (avgStat > 40) return '😐';
    if (avgStat > 20) return '😟';
    return '😢';
}

function getPetStatus() {
    const avgStat = (currentPet.hunger + currentPet.happiness + currentPet.energy + currentPet.cleanliness + currentPet.health) / 5;

    if (avgStat > 80) return 'Thriving and full of life!';
    if (avgStat > 60) return 'Happy and healthy!';
    if (avgStat > 40) return 'Doing okay, but needs attention';
    if (avgStat > 20) return 'Struggling and needs care';
    return 'Critical condition! Needs immediate care!';
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
        document.getElementById('balance-amount').textContent = `$${data.balance}`;
        return data.balance;
    }
    return 0;
}

function setupEventListeners() {
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
            await completeTask(taskId);
        }
    });
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');
}

async function performAction(action, cost) {
    const balance = await loadUserBalance();

    if (cost > balance) {
        alert('Not enough money! Complete tasks to earn more.');
        return;
    }

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
            return null;
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

    await updatePetInDatabase();

    if (cost > 0 && result) {
        await deductBalance(cost);
        await addExpense(result.item, result.type, cost);
        await loadExpenses();
    }

    // Refresh balance display after action
    await loadUserBalance();
    displayPet();
    // Re-check achievements after any action that may have inserted expenses or changed finances
    await checkAchievements();
}

async function updatePetInDatabase() {
    await supabase
        .from('pets')
        .update({
            hunger: currentPet.hunger,
            happiness: currentPet.happiness,
            energy: currentPet.energy,
            cleanliness: currentPet.cleanliness,
            health: currentPet.health,
            last_updated: new Date().toISOString()
        })
        .eq('id', petId);
    
    // Check achievements after pet stats update
    checkAchievements();
}

async function deductBalance(amount) {
    // Use helper to safely decrement balance and increment total_spent
    const updatedFinance = await decreaseBalance(currentUser.id, amount);
    if (updatedFinance) {
        document.getElementById('balance-amount').textContent = `$${updatedFinance.balance}`;
        await loadUserBalance();
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

async function resetExpenses() {
    // Delete all expenses for this pet when page loads
    await supabase
        .from('expenses')
        .delete()
        .eq('pet_id', petId)
        .eq('user_id', currentUser.id);
}

async function loadExpenses() {
    const { data: expenses } = await supabase
        .from('expenses')
        .select('*')
        .eq('pet_id', petId)
        .order('created_at', { ascending: false })
        .limit(10);

    const expensesList = document.getElementById('expenses-list');

    if (!expenses || expenses.length === 0) {
        expensesList.innerHTML = '<p class="no-data">No expenses yet</p>';
        return;
    }

    expensesList.innerHTML = expenses.map(expense => `
        <div class="expense-item">
            <div class="expense-info">
                <div class="expense-name">${expense.item_name}</div>
                <div class="expense-type">${expense.expense_type} • ${new Date(expense.created_at).toLocaleDateString()}</div>
            </div>
            <div class="expense-amount">-$${expense.amount}</div>
        </div>
    `).join('');
}

async function loadTasks() {
    const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

    const tasksList = document.getElementById('tasks-list');

    if (!tasks || tasks.length === 0) {
        tasksList.innerHTML = '<p class="no-data">Click the button to generate tasks</p>';
        return;
    }

    tasksList.innerHTML = tasks.map(task => `
        <div class="task-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
            <div class="task-info">
                <div class="task-name">${task.task_name}</div>
                <div class="task-reward">Reward: +$${task.reward_amount}</div>
            </div>
            ${task.completed
                ? '<span style="color: #22c55e; font-weight: 600;">✓ Completed</span>'
                : `<button class="task-complete-btn" data-task-id="${task.id}">Complete</button>`
            }
        </div>
    `).join('');
}

async function completeTask(taskId) {
    const { data: task } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .maybeSingle();

    // Ignore missing tasks or already completed ones
    if (!task || task.completed) return;

    // Mark task as completed
    await supabase
        .from('tasks')
        .update({
            completed: true,
            completed_at: new Date().toISOString()
        })
        .eq('id', taskId);

    // Update user finances with reward
    // Safely credit the user's account using helper
    const reward = Number(task.reward_amount) || 0;
    const updatedFinance = await increaseBalance(currentUser.id, reward);

    if (updatedFinance) {
        document.getElementById('balance-amount').textContent = `$${updatedFinance.balance}`;
    }

    await loadTasks();
    await checkAchievements();
}

async function generateTasks() {
    const taskTemplates = [
        { name: 'Clean your room', reward: 50 },
        { name: 'Do homework for 30 minutes', reward: 40 },
        { name: 'Help with dishes', reward: 30 },
        { name: 'Take out the trash', reward: 20 },
        { name: 'Read for 20 minutes', reward: 35 },
        { name: 'Exercise for 15 minutes', reward: 45 },
        { name: 'Water the plants', reward: 25 },
        { name: 'Organize your desk', reward: 30 },
        { name: 'Help prepare a meal', reward: 40 },
        { name: 'Practice a skill', reward: 35 }
    ];

    const selectedTasks = taskTemplates
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

    try {
        // Remove any existing tasks for the user before creating new ones
        await supabase
            .from('tasks')
            .delete()
            .eq('user_id', currentUser.id);

        // Insert the newly generated tasks in a single batch
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

checkAuth();