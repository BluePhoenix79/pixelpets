import { supabase } from './supabase.js';

let currentUser = null;
let currentPet = null;
let petId = null;

const COSTS = {
    feed: 10,
    play: 5,
    clean: 8,
    rest: 0,
    vet: 50,
    toy: 25
};

async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        window.location.href = 'auth.html';
        return;
    }

    currentUser = user;
    document.getElementById('user-info').style.display = 'flex';

    const urlParams = new URLSearchParams(window.location.search);
    petId = urlParams.get('id');

    if (!petId) {
        window.location.href = 'index.html';
        return;
    }

    await loadPet();
    await loadUserBalance();
    await loadExpenses();
    await loadTasks();
    setupEventListeners();
    startStatDecay();
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
    await applyTimedDecay();
    displayPet();
}

async function applyTimedDecay() {
    const lastUpdated = new Date(currentPet.last_updated);
    const now = new Date();
    const hoursPassed = (now - lastUpdated) / (1000 * 60 * 60);

    if (hoursPassed > 0.1) {
        const decayAmount = Math.floor(hoursPassed * 2);

        currentPet.hunger = Math.max(0, currentPet.hunger - decayAmount);
        currentPet.happiness = Math.max(0, currentPet.happiness - Math.floor(decayAmount * 0.5));
        currentPet.cleanliness = Math.max(0, currentPet.cleanliness - Math.floor(decayAmount * 0.8));

        if (currentPet.hunger < 30 || currentPet.cleanliness < 30) {
            currentPet.health = Math.max(0, currentPet.health - Math.floor(decayAmount * 0.3));
        }

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
    const { data } = await supabase
        .from('user_finances')
        .select('balance')
        .eq('user_id', currentUser.id)
        .maybeSingle();

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

    displayPet();
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
}

async function deductBalance(amount) {
    const { data: finance } = await supabase
        .from('user_finances')
        .select('*')
        .eq('user_id', currentUser.id)
        .maybeSingle();

    if (finance) {
        await supabase
            .from('user_finances')
            .update({
                balance: finance.balance - amount,
                total_spent: finance.total_spent + amount
            })
            .eq('user_id', currentUser.id);

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
                : `<button class="task-complete-btn" onclick="completeTask('${task.id}')">Complete</button>`
            }
        </div>
    `).join('');
}

window.completeTask = async function(taskId) {
    const { data: task } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .maybeSingle();

    if (!task || task.completed) return;

    await supabase
        .from('tasks')
        .update({
            completed: true,
            completed_at: new Date().toISOString()
        })
        .eq('id', taskId);

    const { data: finance } = await supabase
        .from('user_finances')
        .select('*')
        .eq('user_id', currentUser.id)
        .maybeSingle();

    if (finance) {
        await supabase
            .from('user_finances')
            .update({
                balance: finance.balance + task.reward_amount,
                total_earned: finance.total_earned + task.reward_amount
            })
            .eq('user_id', currentUser.id);
    }

    await loadUserBalance();
    await loadTasks();
};

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

    for (const task of selectedTasks) {
        await supabase.from('tasks').insert({
            user_id: currentUser.id,
            task_name: task.name,
            reward_amount: task.reward,
            completed: false
        });
    }

    await loadTasks();
}

checkAuth();
