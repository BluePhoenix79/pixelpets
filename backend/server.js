const express = require('express');
const sql = require('mssql');
const cors = require('cors');
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
    port : Number(process.env.DB_PORT),
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

// ==================== API ENDPOINTS ====================

// Get all pets for a user
app.get('/api/pets/:id', async (req, res) => {
    try {
        const result = await getPool().request()
            .input('id', sql.UniqueIdentifier, req.params.id)
            .query('SELECT * FROM pets WHERE id = @id');
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch pets' });
    }
});

app.delete('/api/tasks/incomplete/:userId', async (req, res) => {
  await pool.request()
    .input('userId', sql.UniqueIdentifier, req.params.userId)
    .query('DELETE FROM tasks WHERE user_id = @userId AND completed = 0');
  res.sendStatus(204);
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
        const { hunger, happiness, energy, cleanliness, health } = req.body;
        const result = await getPool().request()
            .input('id', sql.UniqueIdentifier, req.params.id)
            .input('hunger', sql.Int, hunger)
            .input('happiness', sql.Int, happiness)
            .input('energy', sql.Int, energy)
            .input('cleanliness', sql.Int, cleanliness)
            .input('health', sql.Int, health)
            .query(`
                UPDATE pets 
                SET hunger = @hunger, 
                    happiness = @happiness, 
                    energy = @energy,
                    cleanliness = @cleanliness,
                    health = @health,
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

// Get a single pet that belongs to a user
app.get("/api/pet/:petId/:userId", async (req, res) => {
  try {
    const result = await pool.request()
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});