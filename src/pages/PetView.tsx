import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { increaseBalance, decreaseBalance, ensureFinance } from '../lib/finances';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title } from 'chart.js';
import { Pie, Line } from 'react-chartjs-2';
import { format } from 'date-fns';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title);

interface Pet {
    id: string;
    name: string;
    species: string;
    hunger: number;
    happiness: number;
    energy: number;
    cleanliness: number;
    health: number;
    last_updated: string;
}

interface Expense {
    id: string;
    expense_type: string;
    amount: number;
    created_at: string;
}

interface Task {
    id: string;
    task_name: string;
    reward_amount: number;
    completed: boolean;
}

interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    check?: (pet: Pet) => boolean;
    asyncCheck?: (userId: string, petId: string) => Promise<boolean>;
    progress: (pet: Pet, stats: any) => number;
}

const COSTS: Record<string, number> = { feed: 10, play: 5, clean: 8, rest: 0, vet: 50, toy: 25 };

// Using partial implementation of achievements for brevity, full list can be added
const ACHIEVEMENTS_DEF: Achievement[] = [
    { id: 'perfect_health', name: 'Perfect Health', description: 'Maintain 100% health', icon: '💚', check: p => p.health === 100, progress: p => p.health },
    { id: 'happy_pet', name: 'Happiness Master', description: 'Happiness > 90%', icon: '😊', check: p => p.happiness >= 90, progress: p => (p.happiness / 90) * 100 },
    // ... add others as needed
];

const PetView = () => {
    const { id: petId } = useParams<{ id: string }>();
    const { user, signOut } = useAuth();
    const navigate = useNavigate();

    const [pet, setPet] = useState<Pet | null>(null);
    const [balance, setBalance] = useState(0);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [activeTab, setActiveTab] = useState('expenses');

    // UI state
    const [tutorialShown, setTutorialShown] = useState(false);

    // Charts Data
    const [spendingData, setSpendingData] = useState<any>(null);
    const [balanceHistoryData, setBalanceHistoryData] = useState<any>(null);

    const decayInterval = useRef<any>(null);

    useEffect(() => {
        if (!user || !petId) return;

        const init = async () => {
            await ensureFinance(user.id);
            await loadPet();
            await loadBalance();
            await loadExpenses();
            await loadTasks();
        };
        init();

        // Start decay
        decayInterval.current = setInterval(() => {
            applyDecay();
        }, 30000);

        return () => {
            if (decayInterval.current) clearInterval(decayInterval.current);
        };
    }, [user, petId]);

    useEffect(() => {
        if (pet) {
            // Apply timed decay logic from loaded 'last_updated'
            // For now, simpler implementation: just checking decay regularly
            // In a real app, calculate diff from last_updated on mount
        }
    }, [pet?.id]);

    useEffect(() => {
        if (expenses.length > 0) updateSpendingChart();
    }, [expenses]);

    const loadPet = async () => {
        if (!user || !petId) return;
        const { data, error } = await supabase.from('pets').select('*').eq('id', petId).single();
        if (error) {
            console.error(error);
            navigate('/dashboard');
            return;
        }
        setPet(data);
    };

    const loadBalance = async () => {
        if (!user) return;
        const { data } = await supabase.from('user_finances').select('balance').eq('user_id', user.id).single();
        if (data) setBalance(data.balance);
    };

    const loadExpenses = async () => {
        if (!user || !petId) return;
        const { data } = await supabase.from('expenses').select('*').eq('pet_id', petId).order('created_at', { ascending: false });
        if (data) setExpenses(data);
    };

    const loadTasks = async () => {
        if (!user) return;
        const { data } = await supabase.from('tasks').select('*').eq('user_id', user.id).eq('completed', false);
        if (data) setTasks(data);
    }

    const applyDecay = async () => {
        // Simplified decay for React demo
        setPet(prev => {
            if (!prev) return null;
            const newPet = { ...prev };
            newPet.hunger = Math.max(0, newPet.hunger - 1);
            newPet.cleanliness = Math.max(0, newPet.cleanliness - 1);
            if (Math.random() > 0.7) newPet.happiness = Math.max(0, newPet.happiness - 1);
            if (newPet.hunger < 15 || newPet.cleanliness < 15) newPet.health = Math.max(0, newPet.health - 1);

            // Sync with DB detached from render
            supabase.from('pets').update({
                hunger: newPet.hunger,
                cleanliness: newPet.cleanliness,
                happiness: newPet.happiness,
                health: newPet.health,
                last_updated: new Date().toISOString()
            }).eq('id', prev.id).then();

            return newPet;
        });
    };

    const performAction = async (action: string) => {
        if (!pet || !user) return;
        const cost = COSTS[action];

        if (cost > balance) {
            alert('Not enough money!');
            return;
        }

        const newPet = { ...pet };
        let item = '';
        let type = '';

        switch (action) {
            case 'feed':
                newPet.hunger = Math.min(100, newPet.hunger + 30);
                newPet.happiness = Math.min(100, newPet.happiness + 5);
                item = 'Pet Food'; type = 'food';
                break;
            case 'play':
                newPet.happiness = Math.min(100, newPet.happiness + 20);
                newPet.energy = Math.max(0, newPet.energy - 10);
                newPet.hunger = Math.max(0, newPet.hunger - 5);
                item = 'Playtime'; type = 'toy';
                break;
            case 'clean':
                newPet.cleanliness = Math.min(100, newPet.cleanliness + 40);
                newPet.happiness = Math.min(100, newPet.happiness + 10);
                item = 'Bath'; type = 'supplies';
                break;
            case 'rest':
                newPet.energy = Math.min(100, newPet.energy + 30);
                newPet.hunger = Math.max(0, newPet.hunger - 5);
                item = 'Rest'; type = 'rest';
                break;
            // ... add others
            case 'vet':
                newPet.health = 100;
                item = 'Vet Visit'; type = 'vet';
                break;
            case 'toy':
                newPet.happiness = Math.min(100, newPet.happiness + 30);
                item = 'New Toy'; type = 'toy';
                break;
        }

        // Optimistic update
        setPet(newPet);

        // DB Updates
        await supabase.from('pets').update({
            hunger: newPet.hunger,
            happiness: newPet.happiness,
            energy: newPet.energy,
            cleanliness: newPet.cleanliness,
            health: newPet.health,
            last_updated: new Date().toISOString()
        }).eq('id', pet.id);

        if (cost > 0) {
            await decreaseBalance(user.id, cost);
            loadBalance(); // Refresh balance
            await supabase.from('expenses').insert({
                pet_id: pet.id, user_id: user.id, expense_type: type, item_name: item, amount: cost
            });
            loadExpenses();
        }
    };

    const generateTasks = async () => {
        if (!user) return;
        const templates = [
            { name: 'Clean your room', reward: 15 },
            { name: 'Do homework', reward: 12 },
            // ...
        ];
        const selected = templates.slice(0, 3);
        const inserts = selected.map(t => ({ user_id: user.id, task_name: t.name, reward_amount: t.reward, completed: false }));
        await supabase.from('tasks').insert(inserts);
        loadTasks();
    };

    const completeTask = async (taskId: string, reward: number) => {
        if (!user) return;
        // In real app, show Trivia Modal here. For migration MVP, just complete it.
        await increaseBalance(user.id, reward);
        await supabase.from('tasks').update({ completed: true, completed_at: new Date().toISOString() }).eq('id', taskId);
        loadTasks();
        loadBalance();
    }

    const updateSpendingChart = () => {
        const categories: Record<string, number> = {};
        expenses.forEach(e => {
            categories[e.expense_type] = (categories[e.expense_type] || 0) + e.amount;
        });

        setSpendingData({
            labels: Object.keys(categories),
            datasets: [{
                data: Object.values(categories),
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
            }]
        });
    };

    if (!pet) return <div>Loading Pet...</div>;

    const getBarColor = (val: number) => {
        if (val < 30) return 'linear-gradient(90deg, #dc2626, #ef4444)';
        if (val < 60) return 'linear-gradient(90deg, #f59e0b, #fbbf24)';
        return 'linear-gradient(90deg, var(--fbla-blue-600), var(--fbla-gold))';
    };

    return (
        <div className="pet-care-main"> {/* Using legacy class for layout */}
            <div className="pet-display">
                <div className="pet-avatar">
                    <div className="pet-emoji">{pet.species === 'dog' ? '🐶' : '🐾'}</div>
                    <div className="pet-mood">{pet.happiness > 50 ? '😊' : '😢'}</div>
                </div>
                <h2>{pet.name}</h2>
                <div className="pet-status">Status: {pet.health > 50 ? 'Healthy' : 'Sick'}</div>
                <button onClick={() => navigate('/dashboard')} style={{ marginTop: '10px' }}>Back</button>
            </div>

            <div className="stats-grid">
                {['hunger', 'happiness', 'energy', 'cleanliness', 'health'].map(stat => (
                    <div className="stat-card" key={stat}>
                        <div className="stat-info">
                            <label style={{ textTransform: 'capitalize' }}>{stat}</label>
                            <div className="stat-bar">
                                <div className="stat-fill" style={{
                                    width: `${(pet as any)[stat]}%`,
                                    background: getBarColor((pet as any)[stat])
                                }}></div>
                            </div>
                            <span>{(pet as any)[stat]}/100</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="actions-section">
                <h3>Care Actions</h3>
                <div className="actions-grid">
                    {Object.entries(COSTS).map(([action, cost]) => (
                        <button key={action} className="action-btn" onClick={() => performAction(action)}>
                            <span className="action-name" style={{ textTransform: 'capitalize' }}>{action}</span>
                            <span className="action-cost">{cost > 0 ? `$${cost}` : 'Free'}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="tabs-section">
                <div className="tab-buttons">
                    <button className={`tab-button ${activeTab === 'expenses' ? 'active' : ''}`} onClick={() => setActiveTab('expenses')}>Expenses</button>
                    <button className={`tab-button ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}>Earn Money</button>
                    <button className={`tab-button ${activeTab === 'budget' ? 'active' : ''}`} onClick={() => setActiveTab('budget')}>Budget</button>
                </div>

                {activeTab === 'expenses' && (
                    <div className="tab-content active">
                        <div className="expenses-list">
                            {expenses.length === 0 && <p className="no-data">No expenses yet</p>}
                            {expenses.map(exp => (
                                <div key={exp.id} className="expense-item">
                                    <div className="expense-info">
                                        <div className="expense-name">{exp.expense_type}</div>
                                        <div className="expense-amount">-${exp.amount}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'tasks' && (
                    <div className="tab-content active">
                        <button className="generate-btn" onClick={generateTasks}>Generate Tasks</button>
                        <div className="tasks-list">
                            {tasks.map(task => (
                                <div key={task.id} className="task-item" onClick={() => completeTask(task.id, task.reward_amount)}>
                                    <div className="task-info">
                                        <div className="task-name">{task.task_name}</div>
                                        <div className="task-reward">+${task.reward_amount}</div>
                                    </div>
                                    <button className="task-complete-btn">Complete</button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'budget' && (
                    <div className="tab-content active">
                        <div className="charts-container" style={{ height: '300px' }}>
                            {spendingData && <Pie data={spendingData} />}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PetView;
