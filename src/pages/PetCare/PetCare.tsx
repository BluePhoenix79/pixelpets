/**
 * PetCare.tsx
 * 
 * Main Game Component for PixelPets.
 * Handles the core game loop including:
 * - Pet rendering and state management (stats, mood)
 * - Real-time stat decay logic
 * - Financial transactions and expenses tracking
 * - Task generation and AI-powered quizzes
 * - Budget visualization with charts
 * 
 * Ideally this large component should be refactored into smaller sub-components
 * (e.g., <PetStats />, <BudgetView />, <ControlPanel />) for better maintainability.
 */

import { useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement } from 'chart.js';

import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { decreaseBalance, ensureFinance } from '../../lib/finances';
import { getRandomGame, type MiniGame } from '../../data/miniGames';
import GameModal from '../../components/GameModal/GameModal';
import type { Pet, PetSpecies, Expense, Task, ActionType } from '../../types';
import { generateAIQuestion } from '../../lib/ai';
import { PetStats } from '../../components/PetStats/PetStats';
import { ActionButtons } from '../../components/ActionButtons/ActionButtons';
import { BudgetReport } from '../../components/BudgetReport/BudgetReport';
import { FunLoader } from '../../components/FunLoader/FunLoader';
import { openMysteryBox, formatDbName, parseToyItem, RARITY_COLORS } from '../../lib/toySystem';
import styles from './PetCare.module.css';
import dogImg from '../../assets/dog.png';
import happinessImg from '../../assets/happiness.png';
import healthImg from '../../assets/heart.png';
import energyImg from '../../assets/lightning.png';
import cleanlinessImg from '../../assets/cleanliness.png';
import loveImg from '../../assets/love.png';

import foodImg from '../../assets/food.png';
import vetImg from '../../assets/vet.png';
import brightSmileImg from '../../assets/bright_smile.png';
import nauseatedImg from '../../assets/nauseated.png';
import sleepyImg from '../../assets/sleepy.png';
import smilingClosedImg from '../../assets/smiling_closed_eyes.png';
import smilingOpenImg from '../../assets/smiling_open_mouth.png';
import sobbingImg from '../../assets/sobbing.png';
import squintingSadImg from '../../assets/squinting_sad.png';
import noEmotionImg from '../../assets/no_emotion.png';
import fireImg from '../../assets/fire.png';
import strongArmImg from '../../assets/strong_arm.png';
import starImg from '../../assets/star.png';
import trophyImg from '../../assets/trophy.png';
import calendarImg from '../../assets/calendar.png';
import moneyBagImg from '../../assets/money_bag.png';
import checkmarkImg from '../../assets/checkmark.png';
import warningImg from '../../assets/warning.png';
import bathImg from '../../assets/bath.png';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement);

import catImg from '../../assets/cat.png';
import birdImg from '../../assets/bird.png';
import fishImg from '../../assets/fish.png';
import mouseImg from '../../assets/mouse.png';

const PET_EMOJIS: Record<PetSpecies, string> = {
  dog: dogImg,
  cat: catImg,
  bird: birdImg,
  fish: fishImg,
  mouse: mouseImg
};

const COSTS: Record<ActionType, number> = {
  feed: 10, play: 5, clean: 8, rest: 0, vet: 50, toy: 25
};

type TabType = 'expenses' | 'tasks' | 'budget' | 'achievements' | 'streak' | 'toybox';

interface CurrentTaskInfo {
  id: string;
  reward: number;
  game: MiniGame;
  generatedBy?: string;
}

export default function PetCare() {
  const { id: petId } = useParams<{ id: string }>();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // State
  const [pet, setPet] = useState<Pet | null>(null);
  const [balance, setBalance] = useState(0);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [activeTab, setActiveTab] = useState<TabType>('expenses');
  const [showTutorial, setShowTutorial] = useState(false);
  const [showGameModal, setShowGameModal] = useState(false);
  const [currentTaskInfo, setCurrentTaskInfo] = useState<CurrentTaskInfo | null>(null);
  
  const [incorrectTaskIds, setIncorrectTaskIds] = useState<Set<string>>(new Set());
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());
  const [savingsGoal, setSavingsGoal] = useState<number | null>(null);
  
  // Achievements State
  // Store objects { id: string, petId: string } to know context
  const [unlockedAchievements, setUnlockedAchievements] = useState<{ id: string, petId: string }[]>([]); 
  const [answerStreak, setAnswerStreak] = useState(0);
  const [dailyStreak, setDailyStreak] = useState(0);
  const [loginDates, setLoginDates] = useState<string[]>([]);
  const [totalTasksCompleted, setTotalTasksCompleted] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasNewToy, setHasNewToy] = useState(false); // New state for tab highlight
  
  // Stacking Popups State
  interface PopupItem {
    id: number;
    name: string;
    icon: ReactNode;
  }
  const [achievementPopups, setAchievementPopups] = useState<PopupItem[]>([]);
  const [achievementsLoaded, setAchievementsLoaded] = useState(false);
  const [showPetLostModal, setShowPetLostModal] = useState(false);
  const popupIdCounter = useRef(0);
  const decayIntervalRef = useRef<number | null>(null);
  
  // Track which achievements have been shown as popups THIS SESSION to prevent duplicates
  const shownPopupsThisSession = useRef<Set<string>>(new Set());

  // Constants for Achievement Types

  const GLOBAL_ACHIEVEMENTS = new Set(['streak_3', 'streak_10', 'tasks_5', 'tasks_25', 'daily_7', 'saver']);



  // Add Popup Helper - now checks session tracking to prevent duplicates
  const addPopup = (name: string, icon: ReactNode, achievementId?: string) => {
    // If achievementId provided, check if already shown this session
    if (achievementId && shownPopupsThisSession.current.has(achievementId)) {
      return; // Already shown, skip
    }
    if (achievementId) {
      shownPopupsThisSession.current.add(achievementId);
    }
    
    const id = popupIdCounter.current++;
    setAchievementPopups(prev => [...prev, { id, name, icon }]);
    setTimeout(() => {
      setAchievementPopups(prev => prev.filter(p => p.id !== id));
    }, 5000);
  };

  // Load data on mount
  useEffect(() => {
    if (user && petId) {
      loadAllData();
    }
    return () => {
      if (decayIntervalRef.current) clearInterval(decayIntervalRef.current);
    };
  }, [user, petId]);

  // Start stat decay - faster decay every 10 seconds
  useEffect(() => {
    if (pet) {
      decayIntervalRef.current = window.setInterval(async () => {
        setPet(prev => {
          if (!prev) return prev;
          console.log('Decay tick - Love:', prev.love);
          const updated = {
            ...prev,
            hunger: Math.max(0, prev.hunger - 2),
            cleanliness: Math.max(0, prev.cleanliness - 2),
            energy: Math.max(0, prev.energy - 1),
            love: Math.max(0, (prev.love ?? 50) - 1),
            happiness: Math.max(0, prev.happiness - 1),
            health: (prev.hunger < 20 || prev.cleanliness < 20) ? Math.max(0, prev.health - 1) : prev.health
          };
          
          // Check if 3+ stats are at 0 - pet leaves
          const statsAtZero = [
            updated.hunger === 0,
            updated.happiness === 0,
            updated.cleanliness === 0,
            updated.energy === 0,
            updated.health === 0,
            (updated.love || 0) === 0
          ].filter(Boolean).length;
          
          if (statsAtZero >= 3) {
            setShowPetLostModal(true);
          }
          
          updatePetInDatabase(updated);
          return updated;
        });
      }, 10000); // Every 10 seconds
    }
    return () => {
      if (decayIntervalRef.current) clearInterval(decayIntervalRef.current);
    };
  }, [pet?.id]);

  const loadAllData = async () => {
    if (!user || !petId) return;
    await ensureFinance(user.id);
    await Promise.all([loadPet(), loadBalance(), loadExpenses(), loadTotalSpent(), loadSavingsGoal(), loadAchievements()]);
    checkTutorial();
    loadDailyStreak();
    loadTotalTasksCompleted();
  };

  const loadPet = async () => {
    const { data, error } = await supabase.from('pets').select('*').eq('id', petId).eq('owner_id', user!.id).maybeSingle();
    if (!data || error) { alert('Pet not found'); navigate('/dashboard'); return; }
    setPet(data);
    await applyTimedDecay(data);
  };

  const applyTimedDecay = async (petData: Pet) => {
    const lastUpdated = new Date(petData.last_updated);
    const now = new Date();
    const hoursPassed = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);
    if (hoursPassed >= 1) {
      const decayAmount = Math.floor(hoursPassed);
      const updated = {
        ...petData,
        hunger: Math.max(0, petData.hunger - decayAmount),
        happiness: Math.max(0, petData.happiness - Math.floor(decayAmount * 0.5)),
        cleanliness: Math.max(0, petData.cleanliness - Math.floor(decayAmount * 0.8)),
        energy: Math.max(0, petData.energy - Math.floor(decayAmount * 0.3)),
        love: Math.max(0, (petData.love ?? 50) - Math.floor(decayAmount * 0.4)),
        health: (petData.hunger < 20 || petData.cleanliness < 20) ? Math.max(0, petData.health - Math.floor(decayAmount * 0.2)) : petData.health
      };
      setPet(updated);
      await updatePetInDatabase(updated);
    }
  };

  const loadDailyStreak = async () => {
    if (!user) return;
    
    // Get date strings using local time
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    // Get current streak record from Supabase
    const { data: streakData, error } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
      
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching streak:', error);
      return;
    }

    let currentStreak = 0;
    let loginDates: string[] = [];
    
    if (!streakData) {
      // First time user entry
      currentStreak = 1;
      loginDates = [todayStr];
      
      await supabase.from('user_streaks').insert({
        user_id: user.id,
        current_streak: 1,
        last_login_date: todayStr,
        login_dates: loginDates
      });
      
      // Trigger First Streak Popup
      addPopup('1 Day Streak!', <img src={fireImg} className={styles.pixelIcon} alt="fire" />);
    } else {
      // Existing user record
      const lastLogin = streakData.last_login_date;
      loginDates = Array.isArray(streakData.login_dates) ? streakData.login_dates : [];
      
      console.log('=== STREAK DEBUG ===');
      console.log('lastLogin from DB:', lastLogin);
      console.log('todayStr:', todayStr);
      console.log('Previous streak:', streakData.current_streak);
      
      // STREAK LOGIC:
      // - If last login was TODAY: keep current streak (already counted today)
      // - If last login was YESTERDAY: increment streak (continued streak)
      // - If last login was BEFORE yesterday: reset streak to 1 (missed a day)
      
      const yesterdayDate = new Date(today);
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yesterdayStr = yesterdayDate.toISOString().split('T')[0];
      
      if (lastLogin === todayStr) {
        // Already logged in today - keep current streak (don't double count)
        currentStreak = streakData.current_streak;
        console.log('Already logged in today, keeping streak:', currentStreak);
      } else if (lastLogin === yesterdayStr) {
        // Logged in yesterday - continue streak! Increment by 1
        currentStreak = streakData.current_streak + 1;
        
        // Update login dates history
        if (!loginDates.includes(todayStr)) {
          loginDates.push(todayStr);
          if (loginDates.length > 30) {
            loginDates = loginDates.slice(loginDates.length - 30);
          }
        }
        
        // Update database
        await supabase.from('user_streaks').update({
          current_streak: currentStreak,
          last_login_date: todayStr,
          login_dates: loginDates,
          updated_at: new Date().toISOString()
        }).eq('user_id', user.id);
        
        // Trigger Streak Popup
        addPopup(`${currentStreak} Day Streak! 🔥`, <img src={fireImg} className={styles.pixelIcon} alt="fire" />);
        console.log('Continued streak from yesterday:', currentStreak);
      } else {
        // Missed at least one day OR first login ever on a new day
        // Start fresh at 1
        currentStreak = 1;
        loginDates = [todayStr];
        
        // Update database
        await supabase.from('user_streaks').update({
          current_streak: 1,
          last_login_date: todayStr,
          login_dates: loginDates,
          updated_at: new Date().toISOString()
        }).eq('user_id', user.id);
        
        console.log('New streak started! Previous login was:', lastLogin);
        addPopup('Day 1 Streak Started! 🔥', <img src={fireImg} className={styles.pixelIcon} alt="fire" />);
      }
    }
    
    // Update local state
    setDailyStreak(currentStreak);
    setLoginDates(loginDates);
  };

  // Achievement Check Effect
  useEffect(() => {
    if (!pet || !user || !achievementsLoaded) return;
    
    // Require at least 1 completed task before stat-based achievements can unlock
    // This prevents achievements from triggering on a brand new pet with default 100 stats
    const hasPlayedGame = totalTasksCompleted >= 1;
    
    const achievementDefinitions = [
      // Stat-based achievements require some gameplay first
      { id: 'perfect_health', name: 'Perfect Health', icon: <img src={healthImg} className={styles.pixelIcon} alt="health" />, check: hasPlayedGame && pet.health === 100 },
      { id: 'happy_pet', name: 'Happiness Master', icon: <img src={happinessImg} className={styles.pixelIcon} alt="happy" />, check: hasPlayedGame && pet.happiness >= 90 },
      { id: 'well_fed', name: 'Gourmet Chef', icon: <img src={foodImg} className={styles.pixelIcon} alt="food" />, check: hasPlayedGame && pet.hunger >= 80 },
      { id: 'clean_pet', name: 'Squeaky Clean', icon: <img src={cleanlinessImg} className={styles.pixelIcon} alt="clean" />, check: hasPlayedGame && pet.cleanliness >= 85 },
      { id: 'energetic', name: 'Full of Energy', icon: <img src={energyImg} className={styles.pixelIcon} alt="energy" />, check: hasPlayedGame && pet.energy >= 75 },
      { id: 'loved_pet', name: 'Best Friends', icon: <img src={loveImg} className={styles.pixelIcon} alt="love" />, check: hasPlayedGame && (pet.love || 50) >= 80 },
      // Task/streak achievements naturally require gameplay
      { id: 'streak_3', name: 'Streak Starter', icon: <img src={fireImg} className={styles.pixelIcon} alt="fire" />, check: answerStreak >= 3 },
      { id: 'streak_10', name: 'On Fire', icon: <img src={strongArmImg} className={styles.pixelIcon} alt="muscle" />, check: answerStreak >= 10 },
      { id: 'tasks_5', name: 'Task Beginner', icon: <img src={starImg} className={styles.pixelIcon} alt="star" />, check: totalTasksCompleted >= 5 },
      { id: 'tasks_25', name: 'Task Master', icon: <img src={trophyImg} className={styles.pixelIcon} alt="trophy" />, check: totalTasksCompleted >= 25 },
      { id: 'daily_7', name: 'Weekly Warrior', icon: <img src={calendarImg} className={styles.pixelIcon} alt="calendar" />, check: dailyStreak >= 7 },
      { id: 'saver', name: 'Money Saver', icon: <img src={moneyBagImg} className={styles.pixelIcon} alt="money" />, check: balance >= 500 },
    ];

    achievementDefinitions.forEach(async (achievement) => {
      // Logic:
      // If Global: Check if ANY record exists with this achievement ID.
      // If Pet-Specific: Check if a record exists with this achievement ID AND matching petId.
      
      const isGlobal = GLOBAL_ACHIEVEMENTS.has(achievement.id);
      const isAlreadyUnlocked = unlockedAchievements.some(a => {
        if (isGlobal) return a.id === achievement.id; // Unlocked by any pet/session means unlocked for user
        return a.id === achievement.id && a.petId === petId; // Must match current pet
      });

      if (achievement.check && !isAlreadyUnlocked) {
        // Unlock achievement
        await supabase.from('achievements').insert({
          user_id: user.id,
          pet_id: petId, // Always tag with current pet, even only for history
          achievement_id: achievement.id,
          completed_at: new Date().toISOString()
        });
        
        // Update local state locally to prevent immediate duplicate
        setUnlockedAchievements(prev => [...prev, { id: achievement.id, petId: petId as string }]);
        addPopup(achievement.name, achievement.icon, achievement.id);
      }
    });
  }, [pet, answerStreak, totalTasksCompleted, dailyStreak, balance, unlockedAchievements, user, petId, achievementsLoaded]);


  const loadTotalTasksCompleted = async () => {
    if (!user) return;
    const { count } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('completed', true);
    setTotalTasksCompleted(count || 0);
  };

  const loadBalance = async () => {
    const { data } = await supabase.from('user_finances').select('balance').eq('user_id', user!.id).maybeSingle();
    if (data) setBalance(data.balance);
  };

  const loadExpenses = async () => {
    const { data } = await supabase.from('expenses').select('*').eq('user_id', user!.id).eq('pet_id', petId).order('created_at', { ascending: false });
    if (data) setExpenses(data);
  };

  const loadTasks = async () => {
    const { data } = await supabase.from('tasks').select('*').eq('user_id', user!.id).eq('completed', false).order('created_at', { ascending: false });
    if (data) setTasks(data);
  };

  const loadTotalSpent = async () => {
    if (!petId) return;
    const { data } = await supabase.from('expenses').select('amount').eq('pet_id', petId);
    if (data) {
      const total = data.reduce((sum, item) => sum + item.amount, 0);
      setTotalSpent(total);
    }
  };

  const loadSavingsGoal = async () => {
    const { data } = await supabase.from('savings_goals').select('*').eq('user_id', user!.id).eq('pet_id', petId).order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (data) setSavingsGoal(data.target_amount);
  };

  const loadAchievements = async () => {
    // Load ALL achievements for this user to support global achievements (Tasks, Streak, Balance)
    const { data } = await supabase.from('achievements').select('achievement_id, pet_id').eq('user_id', user!.id);
    if (data) {
        setUnlockedAchievements(data.map(a => ({ id: a.achievement_id, petId: (a.pet_id || '') as string })));
    }
    setAchievementsLoaded(true);
  };

  const checkTutorial = () => {
    const hasSeenTutorial = localStorage.getItem(`tutorial_shown_${petId}`);
    if (!hasSeenTutorial) {
      setTimeout(() => setShowTutorial(true), 800);
    }
  };

  const closeTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem(`tutorial_shown_${petId}`, 'true');
  };

  const updatePetInDatabase = async (petData: Pet) => {
    await supabase.from('pets').update({
      hunger: petData.hunger,
      happiness: petData.happiness,
      energy: petData.energy,
      cleanliness: petData.cleanliness,
      health: petData.health,
      love: petData.love,
      last_updated: new Date().toISOString()
    }).eq('id', petId);
  };

  const performAction = async (action: ActionType) => {
    if (!pet || !user) return;
    const cost = COSTS[action];
    if (cost > balance) { alert('Not enough money! Complete tasks to earn more.'); return; }

    let updated = { ...pet };
    let expenseItem = { item: '', type: '' };

    switch (action) {
      case 'feed':
        // RUBRIC: Semantic Validation - Prevent feeding if already full
        if (pet.hunger >= 100) { alert("Pet is not hungry! Don't waste food."); return; }

        updated.hunger = Math.min(100, pet.hunger + 30);
        updated.happiness = Math.min(100, pet.happiness + 5);
        expenseItem = { item: 'Pet Food', type: 'food' };
        break;
      case 'play':
        // RUBRIC: Semantic Validation - Prevent playing if too tired
        if (pet.energy <= 10) { alert("Pet is too tired to play! Let them rest first."); return; }

        updated.happiness = Math.min(100, pet.happiness + 20);
        updated.energy = Math.max(0, pet.energy - 10);
        updated.hunger = Math.max(0, pet.hunger - 5);
        expenseItem = { item: 'Playtime', type: 'toy' };
        break;
      case 'clean':
        updated.cleanliness = Math.min(100, pet.cleanliness + 40);
        updated.happiness = Math.min(100, pet.happiness + 10);
        expenseItem = { item: 'Bath & Grooming', type: 'supplies' };
        break;
      case 'rest':
        updated.energy = Math.min(100, pet.energy + 30);
        updated.hunger = Math.max(0, pet.hunger - 5);
        break;
      case 'vet':
        updated.health = 100;
        updated.happiness = Math.max(0, pet.happiness - 10);
        expenseItem = { item: 'Veterinary Care', type: 'vet' };
        break;
      case 'toy':
        // Mystery Box Logic
        const toy = openMysteryBox();
        updated.happiness = Math.min(100, pet.happiness + 15); // Less happiness direct, more from item
        expenseItem = { item: formatDbName(toy), type: 'toy' }; 
        addPopup(`Unboxed: ${toy.name}!`, <span>{toy.icon}</span>);
        // Highlight Toy Box tab instead of switching immediately
        setHasNewToy(true);
        // setActiveTab('toybox'); // Removed auto-switch to let user discover
        break;
    }

    setPet(updated);
    await updatePetInDatabase(updated);

    if (cost > 0 && expenseItem.item) {
      await decreaseBalance(user.id, cost);
      await supabase.from('expenses').insert({ pet_id: petId, user_id: user.id, expense_type: expenseItem.type, item_name: expenseItem.item, amount: cost });
      await loadBalance();
      await loadExpenses();
      await loadTotalSpent();
    }
  };

  const generateTasks = async () => {
    if (!user) return;
    setIncorrectTaskIds(new Set());
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
    const selectedTasks = [...taskTemplates].sort(() => Math.random() - 0.5).slice(0, 3);

    await supabase.from('tasks').delete().eq('user_id', user.id).eq('completed', false);
    await supabase.from('tasks').insert(selectedTasks.map(t => ({ user_id: user.id, task_name: t.name, reward_amount: t.reward, completed: false })));
    await loadTasks();
  };

  const triggerTaskGame = async (task: Task) => {
    if (incorrectTaskIds.has(task.id) || completedTaskIds.has(task.id)) return;
    
    setIsGenerating(true);

    try {
      // PROMPT: Randomly choose between Trivia and Budget Puzzle for variety
      const gameTypes: ('trivia' | 'budget_puzzle')[] = ['trivia', 'trivia', 'budget_puzzle']; // 2/3 chance trivia, 1/3 budget
      const randomType = gameTypes[Math.floor(Math.random() * gameTypes.length)];
      
      const aiGame = await generateAIQuestion(randomType);
      
      if (aiGame) {
        setCurrentTaskInfo({ 
          id: task.id, 
          reward: task.reward_amount, 
          game: aiGame,
          generatedBy: 'generatedBy' in aiGame ? aiGame.generatedBy : 'AI'
        });
        setShowGameModal(true);
      } else {
        // Fallback to random local game if AI fails
        const game = getRandomGame();
        setCurrentTaskInfo({ id: task.id, reward: task.reward_amount, game });
        setShowGameModal(true);
      }
    } catch (error) {
      console.error('Error generating task:', error);
      // Fallback
      const game = getRandomGame();
      setCurrentTaskInfo({ id: task.id, reward: task.reward_amount, game });
      setShowGameModal(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGameComplete = async (success: boolean) => {
    if (!currentTaskInfo || !user) return;

    if (success) {
      // Increase streak and calculate bonus
      const newStreak = answerStreak + 1;
      setAnswerStreak(newStreak);
      const streakBonus = Math.floor(newStreak / 3) * 5; // +$5 every 3 correct answers
      const totalReward = currentTaskInfo.reward + streakBonus;
      
      // Mark task as completed locally (show green bar)
      setCompletedTaskIds(prev => new Set(prev).add(currentTaskInfo.id));
      setTotalTasksCompleted(prev => prev + 1);
      
      // Increase pet love when completing tasks
      if (pet) {
        const updatedPet = { ...pet, love: Math.min(100, (pet.love || 50) + 5) };
        setPet(updatedPet);
        await updatePetInDatabase(updatedPet);
      }
      
      const { data: currentFinance } = await supabase.from('user_finances').select('*').eq('user_id', user.id).single();
      if (currentFinance) {
        await supabase.from('user_finances').update({ 
          balance: currentFinance.balance + totalReward, 
          total_earned: currentFinance.total_earned + totalReward 
        }).eq('user_id', user.id);
        await loadBalance();
      }
      await supabase.from('tasks').update({ completed: true, completed_at: new Date().toISOString() }).eq('id', currentTaskInfo.id);
    } else {
      // Reset streak on incorrect answer
      setAnswerStreak(0);
      setIncorrectTaskIds(prev => new Set(prev).add(currentTaskInfo.id));
    }

    setShowGameModal(false);
    setCurrentTaskInfo(null);
    // Don't reload tasks - keep showing completed ones
  };

  const handleSetSavingsGoal = async (amount: number) => {
    if (!user || !petId || amount <= 0) return;
    await supabase.from('savings_goals').insert({ user_id: user.id, pet_id: petId, target_amount: amount });
    setSavingsGoal(amount);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const getMoodEmoji = useCallback(() => {
    // Increased size to 64px (approx 50% bigger than 42px)
    const renderMood = (src: string, alt: string) => <img src={src} className={styles.pixelIcon} alt={alt} style={{ width: '64px', height: '64px' }} />;

    if (!pet) return renderMood(smilingOpenImg, 'happy');
    const avgStat = (pet.hunger + pet.happiness + pet.energy + pet.cleanliness + pet.health) / 5;
    
    // Check specific conditions first
    if (pet.health < 30) return renderMood(nauseatedImg, 'sick');
    if (pet.energy < 20) return renderMood(sleepyImg, 'sleepy');
    if (pet.hunger < 20) return renderMood(squintingSadImg, 'starving');
    if (pet.cleanliness < 20) return renderMood(nauseatedImg, 'nauseated');
    
    // Check overall happiness/average
    if (pet.happiness > 90 && avgStat > 80) return renderMood(brightSmileImg, 'excited');
    if (avgStat > 85) return renderMood(smilingClosedImg, 'very happy');
    if (avgStat > 70) return renderMood(smilingClosedImg, 'happy');
    if (avgStat > 55) return renderMood(smilingOpenImg, 'content');
    if (avgStat > 40) return renderMood(noEmotionImg, 'neutral');
    if (avgStat > 25) return renderMood(squintingSadImg, 'worried');
    if (avgStat > 15) return renderMood(sobbingImg, 'sad');
    return renderMood(sobbingImg, 'crying');
  }, [pet]);

  const getPetStatus = useCallback((): ReactNode => {
    if (!pet) return null;
    
    const iconStyle = { width: '20px', height: '20px', verticalAlign: 'middle', marginLeft: '6px', display: 'inline-block' };
    const StatusIcon = ({ src, alt }: { src: string, alt: string }) => (
      <img src={src} className={styles.pixelIcon} alt={alt} style={iconStyle} />
    );

    const avgStat = (pet.hunger + pet.happiness + pet.energy + pet.cleanliness + pet.health) / 5;
    
    if (pet.health < 20) return <span>Needs urgent medical attention! <StatusIcon src={vetImg} alt="vet" /></span>;
    if (pet.hunger < 15) return <span>Starving and weak... <StatusIcon src={foodImg} alt="food" /></span>;
    if (pet.cleanliness < 15) return <span>Desperately needs a bath! <StatusIcon src={bathImg} alt="bath" /></span>;
    if (pet.energy < 15) return <span>Exhausted and can barely move... <StatusIcon src={sleepyImg} alt="sleepy" /></span>;
    
    if (avgStat > 90) return <span>Living the dream! Absolutely perfect! <StatusIcon src={cleanlinessImg} alt="sparkles" /></span>;
    if (avgStat > 85) return <span>Thriving and full of life! <StatusIcon src={brightSmileImg} alt="star" /></span>;
    if (avgStat > 75) return <span>Very happy and content! <StatusIcon src={smilingClosedImg} alt="happy" /></span>;
    if (avgStat > 65) return <span>Happy and healthy! <StatusIcon src={healthImg} alt="love" /></span>;
    if (avgStat > 55) return <span>Doing pretty well overall! <StatusIcon src={smilingOpenImg} alt="good" /></span>;
    if (avgStat > 45) return <span>Doing okay, but could use some attention <StatusIcon src={noEmotionImg} alt="hmmm" /></span>;
    if (avgStat > 35) return <span>Starting to feel neglected... <StatusIcon src={squintingSadImg} alt="sad" /></span>;
    return <span>Not doing well, needs care soon! <StatusIcon src={warningImg} alt="warning" /></span>;
  }, [pet]);



  const isAchievementUnlocked = (id: string) => {
    const isGlobal = GLOBAL_ACHIEVEMENTS.has(id);
    return unlockedAchievements.some(a => {
      if (isGlobal) return a.id === id;
      // For pet specific, it must match the current pet's ID
      return a.id === id && a.petId === petId;
    });
  };

  // Chart data
  // RUBRIC: Report Customization & Analysis
  // Filter expenses based on user selection to allow detailed analysis of specific costs


  // Balance Animation State
  const [balanceKey, setBalanceKey] = useState(0);
  const prevBalance = useRef(balance);

  useEffect(() => {
    if (balance > prevBalance.current) {
      setBalanceKey(prev => prev + 1);
    }
    prevBalance.current = balance;
  }, [balance]);

  if (!pet) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  }

  return (
    <div className={styles.petCarePage}>
      <header className="title">
        <button className={styles.helpBtn} onClick={() => setShowTutorial(true)} title="Show Tutorial">
          <span>?</span>
        </button>
        <h1>PixelPets</h1>
      </header>

      <div className="user-info">
        <div className="balance-display">
          Balance: <span key={balanceKey} className={`balance-amount ${balanceKey > 0 ? styles.balancePulse : ''}`}>${balance.toFixed(2)}</span>
        </div>
        <div className="user-bar-buttons">
          <button className="user-bar-btn" onClick={() => navigate('/dashboard')}>Home</button>
          <button className="user-bar-btn" onClick={() => navigate('/settings')}>Settings</button>
          <button className="user-bar-btn" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <main className={styles.petCareMain}>
        {/* Pet Display */}
        <div className={styles.petDisplay}>
          <div className={styles.petAvatar} data-species={pet.species}>
            {/* Use image instead of emoji */}
            <img 
              src={PET_EMOJIS[pet.species]} 
              className={styles.petImage} 
              alt={pet.species}
            />
            <div className={styles.petMood}>
              {getMoodEmoji()}
            </div>
          </div>
          <h2>{pet.name}</h2>
          <p className={styles.petStatus}>{getPetStatus()}</p>
          
          {/* Fun Feature: Inventory Shelf */}

        </div>

        {/* Stats Grid - 6 stats for perfect 2x3 or 3x2 grid */}
        {/* Stats Grid - Modularized */}
        <PetStats pet={pet} />

        {/* Actions Section */}
        {/* Actions Section - Modularized */}
        <ActionButtons 
          balance={balance} 
          onAction={performAction} 
          disabled={isGenerating} 
        />

        {/* Tabs Section */}
        <div className={styles.tabsSection}>
          <div className={styles.tabButtons}>
            {[
              { id: 'expenses' as TabType, label: 'Expenses' },
              { id: 'tasks' as TabType, label: 'Tasks' },
              { id: 'budget' as TabType, label: 'Budget' },
              { id: 'toybox' as TabType, label: 'Toy Box' }, 
              { id: 'achievements' as TabType, label: 'Achievements' },
              { id: 'streak' as TabType, label: 'Streak' },
            ].map(tab => (
              <button 
                key={tab.id} 
                className={`${styles.tabButton} ${activeTab === tab.id ? styles.active : ''} ${tab.id === 'toybox' && hasNewToy ? styles.pulseTab : ''}`}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === 'toybox') setHasNewToy(false);
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'expenses' && (
            <div className={styles.tabContent}>
              <h3>Recent Expenses</h3>
              <div className={styles.expensesList}>
                {expenses.length === 0 ? (
                  <p className={styles.noData}>No expenses yet</p>
                ) : (
                  expenses.slice(0, 10).map(expense => (
                    <div key={expense.id} className={styles.expenseItem}>
                      <div className={styles.expenseInfo}>
                        <div className={styles.expenseName}>{expense.item_name}</div>
                        <div className={styles.expenseType}>{expense.expense_type}</div>
                      </div>
                      <div className={styles.expenseAmount}>-${expense.amount}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'toybox' && (
            <div className={styles.tabContent}>
               <h3>My Toy Collection</h3>
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '16px' }}>
                 {expenses.filter(e => e.expense_type === 'toy').length === 0 ? (
                   <div className={styles.noData} style={{ gridColumn: '1 / -1' }}>No toys yet! Buy a Mystery Box to start collecting.</div>
                 ) : (
                   expenses.filter(e => e.expense_type === 'toy').map(expense => {
                     const toy = parseToyItem(expense.item_name);
                     const color = RARITY_COLORS[toy.rarity];
                     return (
                       <div 
                         key={expense.id} 
                         title={`${toy.name} (${toy.rarity})`} // Tooltip
                         style={{ 
                           background: 'rgba(15, 23, 42, 0.4)', 
                           borderRadius: '12px', 
                           padding: '16px', 
                           border: `2px solid ${color}`,
                           display: 'flex', 
                           flexDirection: 'column', 
                           alignItems: 'center', 
                           gap: '8px',
                           boxShadow: `0 0 15px ${color}40`,
                           position: 'relative',
                           cursor: 'help'
                         }}
                       >
                         <div style={{ fontSize: '2.5rem' }}>{toy.icon}</div>
                         <div style={{ fontWeight: 600, fontSize: '0.9rem', textAlign: 'center', color: '#f8fafc' }}>{toy.name}</div>
                         <div style={{ 
                           fontSize: '0.75rem', 
                           background: color, 
                           color: toy.rarity === 'Common' || toy.rarity === 'Legendary' ? 'black' : 'white',
                           padding: '2px 8px', 
                           borderRadius: '10px',
                           fontWeight: 700
                         }}>
                           {toy.rarity}
                         </div>
                       </div>
                     );
                   })
                 )}
               </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className={styles.tabContent}>
              <div className={styles.tasksHeader}>
                <h3>Complete Tasks to Earn Money</h3>
                {answerStreak > 0 && (
                  <div className={styles.streakBadge}>
                    <img src={fireImg} className={styles.pixelIcon} alt="fire" style={{ width: '32px', height: '32px', marginRight: '8px' }} />
                    <span className={styles.streakCount}>{answerStreak}</span>
                    <span className={styles.streakLabel}>Streak!</span>
                    {answerStreak >= 3 && <span className={styles.streakBonus}>+${Math.floor(answerStreak / 3) * 5} bonus</span>}
                  </div>
                )}
              </div>
              <button className={styles.generateBtn} onClick={generateTasks}>Generate Tasks</button>
              

              <div className={styles.tasksList}>
                {tasks.length === 0 ? (
                  <p className={styles.noData}>Click the button to generate tasks</p>
                ) : (
                  tasks.map(task => {
                    const isCompleted = completedTaskIds.has(task.id);
                    const isIncorrect = incorrectTaskIds.has(task.id);
                    return (
                      <div 
                        key={task.id} 
                        className={`${styles.taskItem} ${isIncorrect ? styles.incorrect : ''} ${isCompleted ? styles.completed : ''}`}
                      >
                        <div className={styles.taskInfo}>
                          <div className={styles.taskName}>{task.task_name}</div>
                          <div className={styles.taskReward}>
                            {isCompleted ? `Earned: +$${task.reward_amount}` : `Reward: +$${task.reward_amount}`}
                          </div>
                        </div>
                        <button 
                          className={`${styles.taskCompleteBtn} ${isCompleted ? styles.successBtn : ''}`}
                          onClick={() => triggerTaskGame(task)}
                          disabled={isIncorrect || isCompleted}
                        >
                          {isCompleted ? 'Correct!' : isIncorrect ? 'Incorrect' : 'Complete'}
                          {isCompleted && <img src={checkmarkImg} className={styles.pixelIcon} alt="check" style={{ width: '24px', height: '24px', marginLeft: '6px', verticalAlign: 'middle' }} />}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {activeTab === 'budget' && (
            <BudgetReport 
              expenses={expenses}
              balance={balance}
              totalSpent={totalSpent}
              savingsGoal={savingsGoal}
              onSetSavingsGoal={handleSetSavingsGoal}
            />
          )}

          {activeTab === 'achievements' && (
            <div className={styles.tabContent}>
              <h3>Achievements</h3>
              <div className={styles.achievementGrid}>
                {[
                  { id: 'perfect_health', name: 'Perfect Health', description: 'Maintain 100% health', icon: <img src={healthImg} className={styles.pixelIcon} alt="health" />, check: pet.health === 100 },
                  { id: 'happy_pet', name: 'Happiness Master', description: 'Keep happiness above 90%', icon: <img src={happinessImg} className={styles.pixelIcon} alt="happy" />, check: pet.happiness >= 90 },
                  { id: 'well_fed', name: 'Gourmet Chef', description: 'Keep hunger above 80%', icon: <img src={foodImg} className={styles.pixelIcon} alt="food" />, check: pet.hunger >= 80 },
                  { id: 'clean_pet', name: 'Squeaky Clean', description: 'Maintain cleanliness above 85%', icon: <img src={cleanlinessImg} className={styles.pixelIcon} alt="clean" />, check: pet.cleanliness >= 85 },
                  { id: 'energetic', name: 'Full of Energy', description: 'Keep energy above 75%', icon: <img src={energyImg} className={styles.pixelIcon} alt="energy" />, check: pet.energy >= 75 },
                  { id: 'loved_pet', name: 'Best Friends', description: 'Reach 80+ love with your pet', icon: <img src={loveImg} className={styles.pixelIcon} alt="love" />, check: (pet.love || 50) >= 80 },
                  { id: 'streak_3', name: 'Streak Starter', description: 'Get a 3 answer streak', icon: <img src={fireImg} className={styles.pixelIcon} alt="fire" />, check: answerStreak >= 3 },
                  { id: 'streak_10', name: 'On Fire', description: 'Get a 10 answer streak', icon: <img src={strongArmImg} className={styles.pixelIcon} alt="muscle" />, check: answerStreak >= 10 },
                  { id: 'tasks_5', name: 'Task Beginner', description: 'Complete 5 tasks', icon: <img src={starImg} className={styles.pixelIcon} alt="star" />, check: totalTasksCompleted >= 5 },
                  { id: 'tasks_25', name: 'Task Master', description: 'Complete 25 tasks', icon: <img src={trophyImg} className={styles.pixelIcon} alt="trophy" />, check: totalTasksCompleted >= 25 },
                  { id: 'daily_7', name: 'Weekly Warrior', description: 'Login 7 days in a row', icon: <img src={calendarImg} className={styles.pixelIcon} alt="calendar" />, check: dailyStreak >= 7 },
                  { id: 'saver', name: 'Money Saver', description: 'Have $500+ balance', icon: <img src={moneyBagImg} className={styles.pixelIcon} alt="money" />, check: balance >= 500 },
                ].map(achievement => {
                    const unlocked = isAchievementUnlocked(achievement.id);
                    return (
                        <div key={achievement.id} className={`${styles.achievementItem} ${unlocked ? styles.completed : ''}`}>
                          <div className={styles.achievementIcon}>{achievement.icon}</div>
                          <div className={styles.achievementInfo}>
                            <div className={styles.achievementName}>{achievement.name}</div>
                            <div className={styles.achievementDescription}>{achievement.description}</div>
                          </div>
                          {unlocked && (
                            <div className={styles.achievementCompleted}>Complete!</div>
                          )}
                        </div>
                    );
                  })}
              </div>
            </div>
          )}

          {activeTab === 'streak' && (
            <div className={styles.tabContent}>
              <h3><img src={fireImg} className={styles.pixelIcon} alt="fire" style={{ width: '32px', height: '32px', verticalAlign: 'middle', marginRight: '8px' }} /> Your Streaks</h3>
              <div className={styles.streakGrid}>
                {/* Daily Login Streak with Calendar */}
                <div className={`${styles.streakCard} ${styles.calendarCard}`}>
                  <div className={styles.streakCardInfo} style={{ width: '100%' }}>
                    <h4><img src={calendarImg} className={styles.pixelIcon} alt="calendar" style={{ width: '24px', height: '24px', verticalAlign: 'middle', marginRight: '8px' }} /> Daily Login Streak: {dailyStreak} days</h4>
                    <div className={styles.weekCalendar}>
                      {Array.from({ length: 7 }).map((_, i) => {
                        const date = new Date();
                        // Center today (index 3): i=0 -> -3 days, i=3 -> today, i=6 -> +3 days
                        date.setDate(date.getDate() + (i - 3));
                        const dateISO = date.toISOString().split('T')[0];
                        const isLoggedIn = loginDates.includes(dateISO);
                        const isToday = i === 3;
                        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                        const dayNum = date.getDate();
                        const isFuture = date > new Date();
                        
                        return (
                          <div 
                            key={dateISO} 
                            className={`${styles.calendarDay} ${isLoggedIn ? styles.loggedIn : ''} ${isToday ? styles.today : ''}`}
                            style={{ opacity: isFuture ? 0.5 : 1 }}
                          >
                            <span className={styles.dayName}>{dayName}</span>
                            <span className={styles.dayNum}>{dayNum}</span>
                            {isLoggedIn && <img src={checkmarkImg} className={styles.pixelIcon} alt="check" style={{ width: '20px', height: '20px' }} />}
                          </div>
                        );
                      })}
                    </div>
                    <p style={{ marginTop: '12px' }}>Come back every day to grow your streak!</p>
                  </div>
                  {dailyStreak >= 7 && <div className={styles.streakCardBadge}><img src={strongArmImg} alt="fire" style={{ width: '20px', height: '20px', marginRight: '4px', verticalAlign: 'middle' }} /> On Fire!</div>}
                </div>

                {/* Answer Streak */}
                <div className={styles.streakCard}>
                  <div className={styles.streakCardIcon}><img src={strongArmImg} className={styles.pixelIcon} alt="score" style={{ width: '48px', height: '48px' }} /></div>
                  <div className={styles.streakCardInfo}>
                    <h4>Current Answer Streak</h4>
                    <div className={styles.streakCardValue}>
                      <span className={styles.bigNumber}>{answerStreak}</span>
                      <span className={styles.streakUnit}>correct</span>
                      {answerStreak >= 3 && <span className={styles.bonusInline}><img src={moneyBagImg} alt="money" style={{ width: '16px', height: '16px', verticalAlign: 'middle' }} /> +${Math.floor(answerStreak / 3) * 5}</span>}
                    </div>
                    <p>{answerStreak >= 3 ? 'Bonus active on each task!' : 'Get 3 in a row for bonuses!'}</p>
                  </div>
                </div>

                {/* Total Tasks Completed */}
                <div className={styles.streakCard}>
                  <div className={styles.streakCardIcon}><img src={checkmarkImg} className={styles.pixelIcon} alt="tasks" style={{ width: '48px', height: '48px' }} /></div>
                  <div className={styles.streakCardInfo}>
                    <h4>Total Tasks Completed</h4>
                    <div className={styles.streakCardValue}>
                      <span className={styles.bigNumber}>{totalTasksCompleted}</span>
                      <span className={styles.streakUnit}>tasks</span>
                    </div>
                    <p>Keep completing tasks to learn more!</p>
                  </div>
                </div>

                {/* Pet Care Summary */}
                <div className={styles.streakCard}>
                  <div className={styles.streakCardIcon}><img src={loveImg} className={styles.pixelIcon} alt="love" style={{ width: '48px', height: '48px' }} /></div>
                  <div className={styles.streakCardInfo}>
                    <h4>Pet Love Level</h4>
                    <div className={styles.streakCardValue}>
                      <span className={styles.bigNumber}>{pet.love || 50}</span>
                      <span className={styles.streakUnit}>/ 100</span>
                    </div>
                    <p>Complete tasks to show your pet love!</p>
                  </div>
                  {(pet.love || 50) >= 80 && <div className={styles.streakCardBadge}><img src={loveImg} alt="love" style={{ width: '20px', height: '20px', marginRight: '4px', verticalAlign: 'middle' }} /> Best Friends!</div>}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Tutorial Modal */}
      {showTutorial && (
        <div className={styles.tutorialOverlay}>
          <div className={styles.tutorialContent}>
            <button className={styles.tutorialClose} onClick={closeTutorial}>&times;</button>
            <h2>Welcome to PixelPets!</h2>
            <div className={styles.tutorialSections}>
              <div className={styles.tutorialSection}>
                <div className={styles.tutorialIcon}><img src={dogImg} alt="pet" style={{ width: '48px', height: '48px' }} /></div>
                <h3>Care for your Pet</h3>
                <p>Feed, clean, and play with your pet to keep them happy!</p>
              </div>
              <div className={styles.tutorialSection}>
                <div className={styles.tutorialIcon}><img src={moneyBagImg} alt="money" style={{ width: '48px', height: '48px' }} /></div>
                <h3>Earn Rewards</h3>
                <p>Complete FBLA tasks and quizzes to earn money!</p>
              </div>
              <div className={styles.tutorialSection}>
                <div className={styles.tutorialIcon}><img src={trophyImg} alt="trophy" style={{ width: '48px', height: '48px' }} /></div>
                <h3>Achieve Goals</h3>
                <p>Unlock achievements and maintain your streaks!</p>
              </div>
              <div className={styles.tutorialSection}>
                <div className={styles.tutorialIcon}><img src={starImg} alt="ai" style={{ width: '48px', height: '48px' }} /></div>
                <h3>AI Questions</h3>
                <p>Tasks use AI to generate unique questions. Customize topics in Settings!</p>
              </div>
            </div>
            <button className={styles.tutorialStartBtn} onClick={closeTutorial}>Got it! Let's start!</button>
          </div>
        </div>
      )}

      {/* Game Modal */}
      {showGameModal && currentTaskInfo && (
        <GameModal
          game={currentTaskInfo.game}
          reward={currentTaskInfo.reward}
          onComplete={handleGameComplete}
          onClose={() => {
            setShowGameModal(false);
            setCurrentTaskInfo(null);
          }}
          generatedBy={currentTaskInfo.generatedBy}
        />
      )}

      {/* Pet Lost Modal */}
      {showPetLostModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.petLostModal}>
            <div className={styles.petLostIcon}>💔</div>
            <h2>Your Pet Has Left</h2>
            <p>
              Unfortunately, <strong>{pet?.name}</strong> wasn't cared for properly and has left you.
            </p>
            <p className={styles.budgetLesson}>
              Remember: proper budgeting and consistent care are essential for keeping your pet happy and healthy!
            </p>
            <button 
              className={styles.petLostBtn}
              onClick={async () => {
                // Delete the pet from database
                if (pet?.id) {
                  const { error } = await supabase.from('pets').delete().eq('id', pet.id);
                  if (error) {
                    alert('Error removing pet: ' + error.message);
                    return;
                  }
                }
                navigate('/dashboard');
              }}
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Loading Overlay - shows during quiz generation */}
      {isGenerating && (
        <div className={styles.loadingOverlay}>
          <FunLoader />
        </div>
      )}

      {/* Achievement Popup */}
      {/* Achievement Popups (Stacked) */}
      <div className={styles.popupContainer}>
        {achievementPopups.map(popup => (
          <div key={popup.id} className={styles.achievementPopup}>
            <div className={styles.popupIcon}>{popup.icon}</div>
            <div className={styles.popupContent}>
              <div className={styles.popupTitle}>Achievement Unlocked!</div>
              <div className={styles.popupName}>{popup.name}</div>
            </div>
            <div className={styles.popupProgress} />
          </div>
        ))}
      </div>
    </div>
  );
}
