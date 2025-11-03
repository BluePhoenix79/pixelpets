/*
  # Virtual Pet Manager Database Schema

  ## Overview
  Creates tables for managing virtual pets with care tracking, emotional states, and financial management.

  ## New Tables
  
  ### `pets`
  Stores pet information and current state
  - `id` (uuid, primary key)
  - `name` (text) - Pet's name
  - `species` (text) - dog, cat, bird, fish, mouse
  - `created_at` (timestamptz) - When pet was created
  - `hunger` (integer) - 0-100, lower is hungrier
  - `happiness` (integer) - 0-100
  - `energy` (integer) - 0-100
  - `cleanliness` (integer) - 0-100
  - `health` (integer) - 0-100
  - `last_updated` (timestamptz) - For state decay over time
  - `owner_id` (uuid) - References auth.users
  
  ### `user_finances`
  Tracks user's in-game currency and budget
  - `user_id` (uuid, primary key) - References auth.users
  - `balance` (integer) - Current money available
  - `total_earned` (integer) - Lifetime earnings
  - `total_spent` (integer) - Lifetime spending
  - `updated_at` (timestamptz)
  
  ### `expenses`
  Records all pet care expenses
  - `id` (uuid, primary key)
  - `pet_id` (uuid) - References pets
  - `user_id` (uuid) - References auth.users
  - `expense_type` (text) - food, vet, toy, supplies
  - `item_name` (text) - What was purchased
  - `amount` (integer) - Cost in game currency
  - `created_at` (timestamptz)
  
  ### `tasks`
  Tasks users can complete to earn money
  - `id` (uuid, primary key)
  - `user_id` (uuid) - References auth.users
  - `task_name` (text)
  - `reward_amount` (integer)
  - `completed` (boolean)
  - `completed_at` (timestamptz)
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Users can only access their own pets, finances, expenses, and tasks
  - Authenticated users required for all operations
*/

-- Create pets table
CREATE TABLE IF NOT EXISTS pets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  species text NOT NULL CHECK (species IN ('dog', 'cat', 'bird', 'fish', 'mouse')),
  created_at timestamptz DEFAULT now(),
  hunger integer DEFAULT 50 CHECK (hunger >= 0 AND hunger <= 100),
  happiness integer DEFAULT 70 CHECK (happiness >= 0 AND happiness <= 100),
  energy integer DEFAULT 80 CHECK (energy >= 0 AND energy <= 100),
  cleanliness integer DEFAULT 100 CHECK (cleanliness >= 0 AND cleanliness <= 100),
  health integer DEFAULT 100 CHECK (health >= 0 AND health <= 100),
  last_updated timestamptz DEFAULT now(),
  owner_id uuid REFERENCES auth.users(id) NOT NULL
);

ALTER TABLE pets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pets"
  ON pets FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can create own pets"
  ON pets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own pets"
  ON pets FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete own pets"
  ON pets FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- Create user_finances table
CREATE TABLE IF NOT EXISTS user_finances (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id),
  balance integer DEFAULT 1000 CHECK (balance >= 0),
  total_earned integer DEFAULT 1000,
  total_spent integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_finances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own finances"
  ON user_finances FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own finances"
  ON user_finances FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own finances"
  ON user_finances FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id uuid REFERENCES pets(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  expense_type text NOT NULL CHECK (expense_type IN ('food', 'vet', 'toy', 'supplies')),
  item_name text NOT NULL,
  amount integer NOT NULL CHECK (amount >= 0),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own expenses"
  ON expenses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own expenses"
  ON expenses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  task_name text NOT NULL,
  reward_amount integer DEFAULT 50 CHECK (reward_amount >= 0),
  completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pets_owner ON pets(owner_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_pet ON expenses(pet_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id);
