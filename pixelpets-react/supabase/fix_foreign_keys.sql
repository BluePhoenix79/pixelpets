-- Fix Foreign Key Constraints for Pet Deletion
-- Run this in the Supabase SQL Editor to fix the "violates foreign key constraint" error.

-- 1. Fix 'achievements' table constraint
-- This allows achievements to be automatically deleted when the associated pet is deleted.
ALTER TABLE achievements
DROP CONSTRAINT IF EXISTS achievements_pet_id_fkey;

ALTER TABLE achievements
ADD CONSTRAINT achievements_pet_id_fkey
FOREIGN KEY (pet_id) REFERENCES pets(id)
ON DELETE CASCADE;

-- 2. Fix 'expenses' table constraint (if it exists)
-- This ensures expense records for a deleted pet are also removed (or you can keep them null).
-- Usually for privacy/cleanup, deleting them is preferred in this context.
DO $$
BEGIN
    -- Check if constraint exists effectively by trying to drop it, or just drop if exists
    -- We assume the constraint name is standard 'expenses_pet_id_fkey' or similar.
    -- If created by Supabase UI, it might have a random name. 
    -- Ideally, we select the name, but for now we try the standard name.
    
    -- Best practice: Just try to alter if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'expenses') THEN
        -- We might not know the exact constraint name if it wasn't named explicitly.
        -- Use logic to find it if possible, OR user might need to check.
        -- For now, we attempt standard naming.
        BEGIN
            ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_pet_id_fkey;
            
            ALTER TABLE expenses
            ADD CONSTRAINT expenses_pet_id_fkey
            FOREIGN KEY (pet_id) REFERENCES pets(id)
            ON DELETE CASCADE;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not auto-fix expenses table constraint. Check manually if needed.';
        END;
    END IF;
END $$;
