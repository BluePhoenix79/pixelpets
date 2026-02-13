import express from 'express';
import sql from 'mssql';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

let pool;

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    port: Number(process.env.DB_PORT) || 1433,
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

function getPool() {
    if (!pool) throw new Error('Database connection not established');
    return pool;
}

sql.connect(config).then(p => {
    pool = p;
    console.log('✅ Connected to Azure SQL Database');
}).catch(err => {
    console.error('❌ Database connection failed!');
    console.error('Error Message:', err.message); 
    console.error('Error Code:', err.code);
});

const app = express();
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');

    // Intercept OPTIONS method
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(express.json());

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`, req.body);
    next();
});

const JWT_SECRET = process.env.JWT_SECRET || 'ilikecodingandfbla';

// ==================== AUTH MIDDLEWARE ====================

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid or expired token' });
        req.user = user;
        next();
    });
}

// ==================== AUTH ENDPOINTS ====================

// Sign Up
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { email, password, username } = req.body;

        if (!email || !password || !username) {
            return res.status(400).json({ error: 'Email, password, and username are required' });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Check if email already exists
        const existingEmail = await getPool().request()
            .input('email', sql.NVarChar, email.toLowerCase())
            .query('SELECT id FROM auth.users WHERE email = @email');
        if (existingEmail.recordset.length > 0) {
            return res.status(400).json({ error: 'An account with this email already exists' });
        }

        // Check if username already exists
        const existingUsername = await getPool().request()
            .input('username', sql.NVarChar, username)
            .query('SELECT id FROM auth.users WHERE username = @username');
        if (existingUsername.recordset.length > 0) {
            return res.status(400).json({ error: 'Username is already taken' });
        }

        // Hash password and create user
        const hashedPassword = await bcrypt.hash(password, 10);
        const userResult = await getPool().request()
            .input('email', sql.NVarChar, email.toLowerCase())
            .input('password', sql.NVarChar, hashedPassword)
            .input('username', sql.NVarChar, username)
            .query(`
                INSERT INTO [auth].[users] (email, encrypted_password, username, show_on_leaderboard)
                OUTPUT INSERTED.id, INSERTED.email, INSERTED.username
                VALUES (@email, @password, @username, 1)
            `);

        const newUser = userResult.recordset[0];

        // Create starting finances
        await getPool().request()
            .input('user_id', sql.UniqueIdentifier, newUser.id)
            .query(`
                INSERT INTO user_finances (user_id, balance, total_earned, total_spent)
                VALUES (@user_id, 50, 50, 0)
            `);

        // Generate JWT
        const token = jwt.sign(
            { id: newUser.id, email: newUser.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({ user: newUser, token });
    } catch (err) {
        console.error('--- SIGNUP ERROR DEBUGGING ---');
        console.error('Message:', err.message);
        console.error('Stack:', err.stack);
        
        res.status(500).json({ error: err.message || 'Failed to create account' });
    }
});

// Sign In
app.post('/api/auth/signin', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const userResult = await getPool().request()
            .input('email', sql.NVarChar, email.toLowerCase())
            .query('SELECT id, email, encrypted_password, username FROM [auth].[users] WHERE email = @email');

        if (userResult.recordset.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = userResult.recordset[0];
        const passwordMatch = await bcrypt.compare(password, user.encrypted_password);

        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            user: { id: user.id, email: user.email, username: user.username },
            token
        });
    } catch (err) {
        console.error('Signin error:', err);
        res.status(500).json({ error: 'Failed to sign in' });
    }
});

// Get current user (verify token)
app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const result = await getPool().request()
            .input('id', sql.UniqueIdentifier, req.user.id)
            .query('SELECT id, email, username, show_on_leaderboard FROM auth.users WHERE id = @id');

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result.recordset[0];
        res.json({
            id: user.id,
            email: user.email,
            username: user.username,
            show_on_leaderboard: user.show_on_leaderboard,
            hasProfile: !!user.username
        });
    } catch (err) {
        console.error('Get user error:', err);
        res.status(500).json({ error: 'Failed to get user' });
    }
});

// Update username
app.patch('/api/auth/username', authenticateToken, async (req, res) => {
    try {
        const { username } = req.body;
        if (!username) return res.status(400).json({ error: 'Username is required' });

        const existing = await getPool().request()
            .input('username', sql.NVarChar, username)
            .query('SELECT id FROM auth.users WHERE username = @username');
        if (existing.recordset.length > 0) {
            return res.status(400).json({ error: 'Username is already taken' });
        }

        await getPool().request()
            .input('id', sql.UniqueIdentifier, req.user.id)
            .input('username', sql.NVarChar, username)
            .query('UPDATE auth.users SET username = @username, updated_at = SYSDATETIMEOFFSET() WHERE id = @id');

        res.json({ message: 'Username updated successfully' });
    } catch (err) {
        console.error('Update username error:', err);
        res.status(500).json({ error: 'Failed to update username' });
    }
});

// Update password
app.patch('/api/auth/password', authenticateToken, async (req, res) => {
    try {
        const { newPassword } = req.body;
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await getPool().request()
            .input('id', sql.UniqueIdentifier, req.user.id)
            .input('password', sql.NVarChar, hashedPassword)
            .query('UPDATE auth.users SET encrypted_password = @password, updated_at = SYSDATETIMEOFFSET() WHERE id = @id');

        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        console.error('Update password error:', err);
        res.status(500).json({ error: 'Failed to update password' });
    }
});

// Update leaderboard visibility
app.patch('/api/auth/visibility', authenticateToken, async (req, res) => {
    try {
        const { show_on_leaderboard } = req.body;
        await getPool().request()
            .input('id', sql.UniqueIdentifier, req.user.id)
            .input('show', sql.Bit, show_on_leaderboard)
            .query('UPDATE auth.users SET show_on_leaderboard = @show WHERE id = @id');

        res.json({ message: 'Visibility updated' });
    } catch (err) {
        console.error('Update visibility error:', err);
        res.status(500).json({ error: 'Failed to update visibility' });
    }
});

// ==================== PETS ENDPOINTS ====================

// Get all pets for a user
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

// Get a single pet that belongs to a user
app.get('/api/pet/:petId/:userId', async (req, res) => {
    try {
        const result = await getPool().request()
            .input('petId', sql.UniqueIdentifier, req.params.petId)
            .input('userId', sql.UniqueIdentifier, req.params.userId)
            .query('SELECT * FROM pets WHERE id = @petId AND owner_id = @userId');
        res.json(result.recordset[0] || null);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch pet' });
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

// Update pet stats
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

// Rename pet
app.patch('/api/pets/:id/rename', async (req, res) => {
    try {
        const { name } = req.body;
        await getPool().request()
            .input('id', sql.UniqueIdentifier, req.params.id)
            .input('name', sql.NVarChar, name)
            .query('UPDATE pets SET name = @name WHERE id = @id');
        res.json({ message: 'Pet renamed successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to rename pet' });
    }
});

// Update pet leaderboard visibility
app.patch('/api/pets/:id/visibility', async (req, res) => {
    try {
        const { show_on_leaderboard } = req.body;
        await getPool().request()
            .input('id', sql.UniqueIdentifier, req.params.id)
            .input('show', sql.Bit, show_on_leaderboard)
            .query('UPDATE pets SET show_on_leaderboard = @show WHERE id = @id');
        res.json({ message: 'Pet visibility updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update pet visibility' });
    }
});

// Delete pet (and all related records)
app.delete('/api/pets/:id', async (req, res) => {
    try {
        const petId = req.params.id;
        await getPool().request()
            .input('petId', sql.UniqueIdentifier, petId)
            .query('DELETE FROM achievements WHERE pet_id = @petId');
        await getPool().request()
            .input('petId', sql.UniqueIdentifier, petId)
            .query('DELETE FROM expenses WHERE pet_id = @petId');
        await getPool().request()
            .input('petId', sql.UniqueIdentifier, petId)
            .query('DELETE FROM savings_goals WHERE pet_id = @petId');
        await getPool().request()
            .input('petId', sql.UniqueIdentifier, petId)
            .query('DELETE FROM pets WHERE id = @petId');
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete pet' });
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

// Get completed task count
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

// Create user finances
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

// ==================== EXPENSES ENDPOINTS ====================

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

// ==================== ACHIEVEMENTS ENDPOINTS ====================

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

// Create an achievement (with duplicate check)
app.post('/api/achievements', async (req, res) => {
    try {
        const { user_id, pet_id, achievement_id } = req.body;

        const existing = await getPool().request()
            .input('user_id', sql.UniqueIdentifier, user_id)
            .input('pet_id', sql.UniqueIdentifier, pet_id)
            .input('achievement_id', sql.NVarChar, achievement_id)
            .query('SELECT id FROM achievements WHERE user_id = @user_id AND pet_id = @pet_id AND achievement_id = @achievement_id');

        if (existing.recordset.length > 0) {
            return res.json(existing.recordset[0]);
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

// ==================== USER STREAKS ENDPOINTS ====================

// Get user streak
app.get('/api/user_streaks/:userId', async (req, res) => {
    try {
        const result = await getPool().request()
            .input('userId', sql.UniqueIdentifier, req.params.userId)
            .query('SELECT * FROM user_streaks WHERE user_id = @userId');

        const streak = result.recordset[0];
        if (streak?.login_dates) {
            try { streak.login_dates = JSON.parse(streak.login_dates); }
            catch (e) { streak.login_dates = []; }
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
        const loginDatesStr = JSON.stringify(login_dates || []);

        const existing = await getPool().request()
            .input('user_id', sql.UniqueIdentifier, user_id)
            .query('SELECT user_id FROM user_streaks WHERE user_id = @user_id');

        let result;
        if (existing.recordset.length > 0) {
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
        if (returnData?.login_dates) {
            try { returnData.login_dates = JSON.parse(returnData.login_dates); }
            catch (e) { returnData.login_dates = []; }
        }
        res.json(returnData);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to upsert streak' });
    }
});

// ==================== SAVINGS GOALS ENDPOINTS ====================

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

// ==================== LEADERBOARD ENDPOINTS ====================

// Balance leaderboard
app.get('/api/leaderboard/balance', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const result = await getPool().request()
            .input('limit', sql.Int, limit)
            .query(`
                SELECT TOP (@limit)
                    f.user_id,
                    f.balance,
                    u.username
                FROM user_finances f
                LEFT JOIN auth.users u ON f.user_id = u.id
                WHERE ISNULL(u.show_on_leaderboard, 1) = 1
                ORDER BY f.balance DESC
            `);
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch balance leaderboard' });
    }
});

// Level leaderboard
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
                    u.username
                FROM pets p
                LEFT JOIN auth.users u ON p.owner_id = u.id
                WHERE ISNULL(p.show_on_leaderboard, 1) = 1
                    AND ISNULL(u.show_on_leaderboard, 1) = 1
                ORDER BY p.level DESC, p.xp DESC
            `);
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch level leaderboard' });
    }
});

// Streak leaderboard
app.get('/api/leaderboard/streak', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const result = await getPool().request()
            .input('limit', sql.Int, limit)
            .query(`
                SELECT TOP (@limit)
                    s.user_id,
                    s.current_streak,
                    u.username
                FROM user_streaks s
                LEFT JOIN auth.users u ON s.user_id = u.id
                WHERE ISNULL(u.show_on_leaderboard, 1) = 1
                ORDER BY s.current_streak DESC
            `);
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch streak leaderboard' });
    }
});

// ==================== SERVER START ====================

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});