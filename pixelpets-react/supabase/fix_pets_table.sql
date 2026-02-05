-- SQL to fix pet deletion and love stat issues
-- Run this in your Supabase SQL editor

-- 1. Add DELETE policy for pets table (allows users to delete their own pets)
DROP POLICY IF EXISTS "Users can delete their own pets" ON pets;
CREATE POLICY "Users can delete their own pets" ON pets
    FOR DELETE
    USING (auth.uid() = owner_id);

-- 2. Ensure the 'love' column exists in the pets table with a default of 50
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pets' AND column_name = 'love'
    ) THEN
        ALTER TABLE pets ADD COLUMN love INTEGER DEFAULT 50;
    END IF;
END $$;

-- 3. Set all existing pets' love to 50 if NULL
UPDATE pets SET love = 50 WHERE love IS NULL;

-- 4. Verify: Check pets table structure
-- SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name = 'pets';
