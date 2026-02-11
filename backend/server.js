const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Database configuration
const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    port: Number(process.env.DB_PORT),
    options: {
        encrypt: true,
        trustServerCertificate: false
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

// Connect to database
let pool;
sql.connect(config).then(p => {
    pool = p;
    console.log('Connected to Azure SQL Database');
}).catch(err => {
    console.error('Database connection failed:', err);
});

function getPool() {
    if (!pool) {
        throw new Error('Database connection not established');
    }
    return pool;
}

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
}

// ==================== PETS ENDPOINTS ====================

// Get all pets for a user (by owner_id)
app.get('/api/pets/:userId', async (req, res) => {
    try {
        const result = await getPool().request()
            .input('userId', sql.UniqueIdentifier, req.params.userId)
            .query('SELECT * FROM pets WHERE owner_id = @userId ORDER BY created_at DESC');
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch pets' });
    }
});

// Get a single pet by ID (with owner verification)
app.get("/api/pet/:petId/:userId", async (req, res) => {
    try {
        const result = await getPool().request()
            .input("petId", sql.UniqueIdentifier, req.params.petId)
            .input("userId", sql.UniqueIdentifier, req.params.userId)
            .query(`
                SELECT *
                FROM pets
                WHERE id = @petId AND owner_id = @userId
            `);

        res.json(result.recordset[0] || null);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch pet" });
    }
});

// Create a new pet
app.post('/api/pets', async (req, res) => {
    try {
        const { name, species, owner_id } = req.body;
        const result = await getPool().request()
            .input('name', sql.NVarChar, name)
            .input('species', sql.NVarChar, species)
            .input('owner_id', sql.UniqueIdentifier, owner_id)
            .query(`
                INSERT INTO pets (name, species, owner_id)
                OUTPUT INSERTED.*
                VALUES (@name, @species, @owner_id)
            `);
        res.json(result.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create pet' });
    }
});

// Update pet stats (UPDATED - includes love, xp, level)
app.patch('/api/pets/:id', async (req, res) => {
    try {
        const { hunger, happiness, energy, cleanliness, health, love, xp, level } = req.body;
        
        const result = await getPool().request()
            .input('id', sql.UniqueIdentifier, req.params.id)
            .input('hunger', sql.Int, hunger)
            .input('happiness', sql.Int, happiness)
            .input('energy', sql.Int, energy)
            .input('cleanliness', sql.Int, cleanliness)
            .input('health', sql.Int, health)
            .input('love', sql.Int, love)
            .input('xp', sql.Int, xp)
            .input('level', sql.Int, level)
            .query(`
                UPDATE pets 
                SET hunger = @hunger, 
                    happiness = @happiness, 
                    energy = @energy,
                    cleanliness = @cleanliness,
                    health = @health,
                    love = @love,
                    xp = @xp,
                    level = @level,
                    last_updated = SYSDATETIMEOFFSET()
                OUTPUT INSERTED.*
                WHERE id = @id
            `);
        res.json(result.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update pet' });
    }
});

// Delete pet
app.delete('/api/pets/:id', async (req, res) => {
    try {
        await getPool().request()
            .input('id', sql.UniqueIdentifier, req.params.id)
            .query('DELETE FROM pets WHERE id = @id');
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete pet' });
    }
});

// Update pet visibility on leaderboard (NEW)
app.patch('/api/pets/:id/visibility', async (req, res) => {
    try {
        const { show_on_leaderboard } = req.body;
        await getPool().request()
            .input('id', sql.UniqueIdentifier, req.params.id)
            .input('show_on_leaderboard', sql.Bit, show_on_leaderboard)
            .query('UPDATE pets SET show_on_leaderboard = @show_on_leaderboard WHERE id = @id');
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update pet visibility' });
    }
});

// Rename pet (NEW)
app.patch('/api/pets/:id/rename', async (req, res) => {
    try {
        const { name } = req.body;
        const result = await getPool().request()
            .input('id', sql.UniqueIdentifier, req.params.id)
            .input('name', sql.NVarChar, name)
            .query('UPDATE pets SET name = @name OUTPUT INSERTED.* WHERE id = @id');
        res.json(result.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to rename pet' });
    }
});

// ==================== TASKS ENDPOINTS ====================

// Get all tasks for a user
app.get('/api/tasks/:userId', async (req, res) => {
    try {
        const result = await getPool().request()
            .input('userId', sql.UniqueIdentifier, req.params.userId)
            .query('SELECT * FROM tasks WHERE user_id = @userId ORDER BY created_at DESC');
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

// Create a new task
app.post('/api/tasks', async (req, res) => {
    try {
        const { user_id, task_name, reward_amount } = req.body;
        const result = await getPool().request()
            .input('user_id', sql.UniqueIdentifier, user_id)
            .input('task_name', sql.NVarChar, task_name)
            .input('reward_amount', sql.Int, reward_amount || 50)
            .query(`
                INSERT INTO tasks (user_id, task_name, reward_amount)
                OUTPUT INSERTED.*
                VALUES (@user_id, @task_name, @reward_amount)
            `);
        res.json(result.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create task' });
    }
});

// Complete a task
app.patch('/api/tasks/:id/complete', async (req, res) => {
    try {
        const result = await getPool().request()
            .input('id', sql.UniqueIdentifier, req.params.id)
            .query(`
                UPDATE tasks 
                SET completed = 1, 
                    completed_at = SYSDATETIMEOFFSET(),
                    status = 'completed'
                OUTPUT INSERTED.*
                WHERE id = @id
            `);
        res.json(result.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to complete task' });
    }
});

// Delete incomplete tasks for a user
app.delete('/api/tasks/incomplete/:userId', async (req, res) => {
    try {
        await getPool().request()
            .input('userId', sql.UniqueIdentifier, req.params.userId)
            .query('DELETE FROM tasks WHERE user_id = @userId AND completed = 0');
        res.sendStatus(204);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete tasks' });
    }
});

// Get task count (completed) for user (NEW)
app.get('/api/tasks/:userId/count', async (req, res) => {
    try {
        const result = await getPool().request()
            .input('userId', sql.UniqueIdentifier, req.params.userId)
            .query('SELECT COUNT(*) as count FROM tasks WHERE user_id = @userId AND completed = 1');
        res.json({ count: result.recordset[0].count });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to count tasks' });
    }
});

// ==================== FINANCES ENDPOINTS ====================

// Get user finances
app.get('/api/finances/:userId', async (req, res) => {
    try {
        const result = await getPool().request()
            .input('userId', sql.UniqueIdentifier, req.params.userId)
            .query('SELECT * FROM user_finances WHERE user_id = @userId');
        res.json(result.recordset[0] || null);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch finances' });
    }
});

// Create user finances (NEW)
app.post('/api/finances', async (req, res) => {
    try {
        const { user_id, balance, total_earned, total_spent } = req.body;
        const result = await getPool().request()
            .input('user_id', sql.UniqueIdentifier, user_id)
            .input('balance', sql.Int, balance || 50)
            .input('total_earned', sql.Int, total_earned || 50)
            .input('total_spent', sql.Int, total_spent || 0)
            .query(`
                INSERT INTO user_finances (user_id, balance, total_earned, total_spent)
                OUTPUT INSERTED.*
                VALUES (@user_id, @balance, @total_earned, @total_spent)
            `);
        res.json(result.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create finances' });
    }
});

// Update user finances
app.patch('/api/finances/:userId', async (req, res) => {
    try {
        const { balance, total_earned, total_spent } = req.body;
        const result = await getPool().request()
            .input('userId', sql.UniqueIdentifier, req.params.userId)
            .input('balance', sql.Int, balance)
            .input('total_earned', sql.Int, total_earned)
            .input('total_spent', sql.Int, total_spent)
            .query(`
                UPDATE user_finances 
                SET balance = @balance,
                    total_earned = @total_earned,
                    total_spent = @total_spent,
                    updated_at = SYSDATETIMEOFFSET()
                OUTPUT INSERTED.*
                WHERE user_id = @userId
            `);
        res.json(result.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update finances' });
    }
});

// ==================== EXPENSES ENDPOINTS (NEW) ====================

// Get expenses for a user and pet
app.get('/api/expenses/:userId/:petId', async (req, res) => {
    try {
        const result = await getPool().request()
            .input('userId', sql.UniqueIdentifier, req.params.userId)
            .input('petId', sql.UniqueIdentifier, req.params.petId)
            .query('SELECT * FROM expenses WHERE user_id = @userId AND pet_id = @petId ORDER BY created_at DESC');
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch expenses' });
    }
});

// Get all expenses for a pet
app.get('/api/expenses/pet/:petId', async (req, res) => {
    try {
        const result = await getPool().request()
            .input('petId', sql.UniqueIdentifier, req.params.petId)
            .query('SELECT * FROM expenses WHERE pet_id = @petId ORDER BY created_at DESC');
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch expenses' });
    }
});

// Create an expense
app.post('/api/expenses', async (req, res) => {
    try {
        const { pet_id, user_id, expense_type, item_name, amount } = req.body;
        const result = await getPool().request()
            .input('pet_id', sql.UniqueIdentifier, pet_id)
            .input('user_id', sql.UniqueIdentifier, user_id)
            .input('expense_type', sql.NVarChar, expense_type)
            .input('item_name', sql.NVarChar, item_name)
            .input('amount', sql.Int, amount)
            .query(`
                INSERT INTO expenses (pet_id, user_id, expense_type, item_name, amount)
                OUTPUT INSERTED.*
                VALUES (@pet_id, @user_id, @expense_type, @item_name, @amount)
            `);
        res.json(result.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create expense' });
    }
});

// ==================== ACHIEVEMENTS ENDPOINTS (NEW) ====================

// Get achievements for a user
app.get('/api/achievements/:userId', async (req, res) => {
    try {
        const result = await getPool().request()
            .input('userId', sql.UniqueIdentifier, req.params.userId)
            .query('SELECT * FROM achievements WHERE user_id = @userId');
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch achievements' });
    }
});

// Create an achievement
app.post('/api/achievements', async (req, res) => {
    try {
        const { user_id, pet_id, achievement_id } = req.body;
        
        // Check if already exists
        const existing = await getPool().request()
            .input('user_id', sql.UniqueIdentifier, user_id)
            .input('pet_id', sql.UniqueIdentifier, pet_id)
            .input('achievement_id', sql.NVarChar, achievement_id)
            .query('SELECT id FROM achievements WHERE user_id = @user_id AND pet_id = @pet_id AND achievement_id = @achievement_id');
        
        if (existing.recordset.length > 0) {
            return res.json(existing.recordset[0]); // Already exists
        }
        
        const result = await getPool().request()
            .input('user_id', sql.UniqueIdentifier, user_id)
            .input('pet_id', sql.UniqueIdentifier, pet_id)
            .input('achievement_id', sql.NVarChar, achievement_id)
            .query(`
                INSERT INTO achievements (user_id, pet_id, achievement_id)
                OUTPUT INSERTED.*
                VALUES (@user_id, @pet_id, @achievement_id)
            `);
        res.json(result.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create achievement' });
    }
});

// ==================== USER STREAKS ENDPOINTS (NEW) ====================

// Get user streak
app.get('/api/user_streaks/:userId', async (req, res) => {
    try {
        const result = await getPool().request()
            .input('userId', sql.UniqueIdentifier, req.params.userId)
            .query('SELECT * FROM user_streaks WHERE user_id = @userId');
        
        const streak = result.recordset[0];
        if (streak && streak.login_dates) {
            try {
                streak.login_dates = JSON.parse(streak.login_dates);
            } catch (e) {
                streak.login_dates = [];
            }
        }
        
        res.json(streak || null);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch streak' });
    }
});

// Upsert user streak
app.post('/api/user_streaks', async (req, res) => {
    try {
        const { user_id, current_streak, last_login_date, login_dates } = req.body;
        
        // Check if exists
        const existing = await getPool().request()
            .input('user_id', sql.UniqueIdentifier, user_id)
            .query('SELECT user_id FROM user_streaks WHERE user_id = @user_id');
        
        let result;
        const loginDatesStr = JSON.stringify(login_dates || []);
        
        if (existing.recordset.length > 0) {
            // Update
            result = await getPool().request()
                .input('user_id', sql.UniqueIdentifier, user_id)
                .input('current_streak', sql.Int, current_streak)
                .input('last_login_date', sql.Date, last_login_date)
                .input('login_dates', sql.NVarChar, loginDatesStr)
                .query(`
                    UPDATE user_streaks 
                    SET current_streak = @current_streak,
                        last_login_date = @last_login_date,
                        login_dates = @login_dates,
                        updated_at = SYSDATETIMEOFFSET()
                    OUTPUT INSERTED.*
                    WHERE user_id = @user_id
                `);
        } else {
            // Insert
            result = await getPool().request()
                .input('user_id', sql.UniqueIdentifier, user_id)
                .input('current_streak', sql.Int, current_streak)
                .input('last_login_date', sql.Date, last_login_date)
                .input('login_dates', sql.NVarChar, loginDatesStr)
                .query(`
                    INSERT INTO user_streaks (user_id, current_streak, last_login_date, login_dates)
                    OUTPUT INSERTED.*
                    VALUES (@user_id, @current_streak, @last_login_date, @login_dates)
                `);
        }
        
        const returnData = result.recordset[0];
        if (returnData && returnData.login_dates) {
            try {
                returnData.login_dates = JSON.parse(returnData.login_dates);
            } catch (e) {
                returnData.login_dates = [];
            }
        }
        
        res.json(returnData);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to upsert streak' });
    }
});

// ==================== SAVINGS GOALS ENDPOINTS (NEW) ====================

// Get savings goal
app.get('/api/savings/:userId/:petId', async (req, res) => {
    try {
        const result = await getPool().request()
            .input('userId', sql.UniqueIdentifier, req.params.userId)
            .input('petId', sql.UniqueIdentifier, req.params.petId)
            .query('SELECT * FROM savings_goals WHERE user_id = @userId AND pet_id = @petId ORDER BY created_at DESC');
        res.json(result.recordset[0] || null);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch savings goal' });
    }
});

// Create savings goal
app.post('/api/savings', async (req, res) => {
    try {
        const { user_id, pet_id, target_amount } = req.body;
        const result = await getPool().request()
            .input('user_id', sql.UniqueIdentifier, user_id)
            .input('pet_id', sql.UniqueIdentifier, pet_id)
            .input('target_amount', sql.Decimal(18, 2), target_amount)
            .query(`
                INSERT INTO savings_goals (user_id, pet_id, goal_amount)
                OUTPUT INSERTED.*
                VALUES (@user_id, @pet_id, @target_amount)
            `);
        res.json(result.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create savings goal' });
    }
});

// Update savings goal
app.patch('/api/savings/:userId/:petId', async (req, res) => {
    try {
        const { targetAmount } = req.body;
        const result = await getPool().request()
            .input('userId', sql.UniqueIdentifier, req.params.userId)
            .input('petId', sql.UniqueIdentifier, req.params.petId)
            .input('targetAmount', sql.Decimal(18, 2), targetAmount)
            .query(`
                UPDATE savings_goals 
                SET goal_amount = @targetAmount
                OUTPUT INSERTED.*
                WHERE user_id = @userId AND pet_id = @petId
            `);
        res.json(result.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update savings goal' });
    }
});

// ==================== PROFILES ENDPOINTS (NEW) ====================

// Get profile
app.get('/api/profiles/:userId', async (req, res) => {
    try {
        const result = await getPool().request()
            .input('userId', sql.UniqueIdentifier, req.params.userId)
            .query('SELECT * FROM profiles WHERE user_id = @userId');
        res.json(result.recordset[0] || null);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// Create or update profile (upsert)
app.post('/api/profiles', async (req, res) => {
    try {
        const { user_id, username, show_on_leaderboard } = req.body;
        
        // Check if exists
        const existing = await getPool().request()
            .input('user_id', sql.UniqueIdentifier, user_id)
            .query('SELECT user_id FROM profiles WHERE user_id = @user_id');
        
        let result;
        if (existing.recordset.length > 0) {
            // Update
            result = await getPool().request()
                .input('user_id', sql.UniqueIdentifier, user_id)
                .input('username', sql.NVarChar, username)
                .input('show_on_leaderboard', sql.Bit, show_on_leaderboard !== false)
                .query(`
                    UPDATE profiles 
                    SET username = @username,
                        show_on_leaderboard = @show_on_leaderboard,
                        updated_at = SYSDATETIMEOFFSET()
                    OUTPUT INSERTED.*
                    WHERE user_id = @user_id
                `);
        } else {
            // Insert
            result = await getPool().request()
                .input('user_id', sql.UniqueIdentifier, user_id)
                .input('username', sql.NVarChar, username)
                .input('show_on_leaderboard', sql.Bit, show_on_leaderboard !== false)
                .query(`
                    INSERT INTO profiles (user_id, username, show_on_leaderboard)
                    OUTPUT INSERTED.*
                    VALUES (@user_id, @username, @show_on_leaderboard)
                `);
        }
        
        res.json(result.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create profile' });
    }
});

// Update profile
app.patch('/api/profiles/:userId', async (req, res) => {
    try {
        const { username, show_on_leaderboard } = req.body;
        const result = await getPool().request()
            .input('userId', sql.UniqueIdentifier, req.params.userId)
            .input('username', sql.NVarChar, username)
            .input('show_on_leaderboard', sql.Bit, show_on_leaderboard)
            .query(`
                UPDATE profiles 
                SET username = @username,
                    show_on_leaderboard = @show_on_leaderboard,
                    updated_at = SYSDATETIMEOFFSET()
                OUTPUT INSERTED.*
                WHERE user_id = @userId
            `);
        res.json(result.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// ==================== LEADERBOARD ENDPOINTS (NEW) ====================

// Get balance leaderboard
app.get('/api/leaderboard/balance', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const result = await getPool().request()
            .input('limit', sql.Int, limit)
            .query(`
                SELECT TOP (@limit) 
                    f.user_id, 
                    f.balance, 
                    p.username,
                    ISNULL(p.show_on_leaderboard, 1) as show_on_leaderboard
                FROM user_finances f
                LEFT JOIN profiles p ON f.user_id = p.user_id
                WHERE ISNULL(p.show_on_leaderboard, 1) = 1
                ORDER BY f.balance DESC
            `);
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch balance leaderboard' });
    }
});

// Get level leaderboard
app.get('/api/leaderboard/level', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const result = await getPool().request()
            .input('limit', sql.Int, limit)
            .query(`
                SELECT TOP (@limit)
                    p.id,
                    p.name,
                    p.level,
                    p.xp,
                    p.owner_id,
                    pr.username,
                    ISNULL(p.show_on_leaderboard, 1) as show_on_leaderboard
                FROM pets p
                LEFT JOIN profiles pr ON p.owner_id = pr.user_id
                WHERE ISNULL(p.show_on_leaderboard, 1) = 1
                ORDER BY p.level DESC, p.xp DESC
            `);
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch level leaderboard' });
    }
});

// Get streak leaderboard
app.get('/api/leaderboard/streak', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const result = await getPool().request()
            .input('limit', sql.Int, limit)
            .query(`
                SELECT TOP (@limit)
                    s.user_id,
                    s.current_streak,
                    p.username,
                    ISNULL(p.show_on_leaderboard, 1) as show_on_leaderboard
                FROM user_streaks s
                LEFT JOIN profiles p ON s.user_id = p.user_id
                WHERE ISNULL(p.show_on_leaderboard, 1) = 1
                ORDER BY s.current_streak DESC
            `);
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch streak leaderboard' });
    }
});

// Sign Up
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { email, password, username } = req.body;

        // Validation
        if (!email || !password || !username) {
            return res.status(400).json({ error: 'Email, password, and username are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Check if user already exists
        const existingUser = await getPool().request()
            .input('email', sql.NVarChar, email.toLowerCase())
            .query('SELECT id FROM auth.users WHERE email = @email');

        if (existingUser.recordset.length > 0) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }

        // Check if username is taken
        const existingUsername = await getPool().request()
            .input('username', sql.NVarChar, username)
            .query('SELECT user_id FROM profiles WHERE username = @username');

        if (existingUsername.recordset.length > 0) {
            return res.status(400).json({ error: 'Username is already taken' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user in auth.users table
        const userResult = await getPool().request()
            .input('email', sql.NVarChar, email.toLowerCase())
            .input('password', sql.NVarChar, hashedPassword)
            .query(`
                INSERT INTO auth.users (email, encrypted_password)
                OUTPUT INSERTED.id, INSERTED.email, INSERTED.created_at
                VALUES (@email, @password)
            `);

        const newUser = userResult.recordset[0];

        // Create profile
        await getPool().request()
            .input('user_id', sql.UniqueIdentifier, newUser.id)
            .input('username', sql.NVarChar, username)
            .query(`
                INSERT INTO profiles (user_id, username, show_on_leaderboard)
                VALUES (@user_id, @username, 1)
            `);

        // Create user finances
        await getPool().request()
            .input('user_id', sql.UniqueIdentifier, newUser.id)
            .query(`
                INSERT INTO user_finances (user_id, balance, total_earned, total_spent)
                VALUES (@user_id, 50, 50, 0)
            `);

        // Generate JWT token
        const token = jwt.sign(
            { id: newUser.id, email: newUser.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            user: {
                id: newUser.id,
                email: newUser.email,
                username: username
            },
            token
        });
    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({ error: 'Failed to create account' });
    }
});

// Sign In
app.post('/api/auth/signin', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Get user from database
        const userResult = await getPool().request()
            .input('email', sql.NVarChar, email.toLowerCase())
            .query('SELECT id, email, encrypted_password FROM auth.users WHERE email = @email');

        if (userResult.recordset.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = userResult.recordset[0];

        // Verify password
        const passwordMatch = await bcrypt.compare(password, user.encrypted_password);

        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Get profile
        const profileResult = await getPool().request()
            .input('user_id', sql.UniqueIdentifier, user.id)
            .query('SELECT username FROM profiles WHERE user_id = @user_id');

        const username = profileResult.recordset[0]?.username || null;

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            user: {
                id: user.id,
                email: user.email,
                username: username
            },
            token
        });
    } catch (err) {
        console.error('Signin error:', err);
        res.status(500).json({ error: 'Failed to sign in' });
    }
});

// Get Current User (verify token and return user data)
app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const userResult = await getPool().request()
            .input('userId', sql.UniqueIdentifier, req.user.id)
            .query('SELECT id, email, created_at FROM auth.users WHERE id = @userId');

        if (userResult.recordset.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = userResult.recordset[0];

        // Get profile
        const profileResult = await getPool().request()
            .input('user_id', sql.UniqueIdentifier, user.id)
            .query('SELECT username, show_on_leaderboard FROM profiles WHERE user_id = @user_id');

        const profile = profileResult.recordset[0];

        res.json({
            id: user.id,
            email: user.email,
            username: profile?.username || null,
            hasProfile: !!profile
        });
    } catch (err) {
        console.error('Get user error:', err);
        res.status(500).json({ error: 'Failed to get user' });
    }
});

// Update Password
app.patch('/api/auth/password', authenticateToken, async (req, res) => {
    try {
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await getPool().request()
            .input('userId', sql.UniqueIdentifier, req.user.id)
            .input('password', sql.NVarChar, hashedPassword)
            .query('UPDATE auth.users SET encrypted_password = @password WHERE id = @userId');

        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        console.error('Update password error:', err);
        res.status(500).json({ error: 'Failed to update password' });
    }
});

// Update Email
app.patch('/api/auth/email', authenticateToken, async (req, res) => {
    try {
        const { newEmail } = req.body;

        if (!newEmail) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // Check if email is already taken
        const existing = await getPool().request()
            .input('email', sql.NVarChar, newEmail.toLowerCase())
            .query('SELECT id FROM auth.users WHERE email = @email');

        if (existing.recordset.length > 0) {
            return res.status(400).json({ error: 'Email is already taken' });
        }

        await getPool().request()
            .input('userId', sql.UniqueIdentifier, req.user.id)
            .input('email', sql.NVarChar, newEmail.toLowerCase())
            .query('UPDATE auth.users SET email = @email, updated_at = SYSDATETIMEOFFSET() WHERE id = @userId');

        res.json({ message: 'Email updated successfully' });
    } catch (err) {
        console.error('Update email error:', err);
        res.status(500).json({ error: 'Failed to update email' });
    }
});

// Export the middleware for use in other routes
module.exports = { authenticateToken };

// ==================== SERVER START ====================

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});