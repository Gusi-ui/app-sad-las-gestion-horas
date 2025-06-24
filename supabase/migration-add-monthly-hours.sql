-- Migration to add monthly_hours to users table
-- This field stores the total monthly hours assigned to each user

-- Add monthly_hours column to users table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'monthly_hours'
  ) THEN
    ALTER TABLE users ADD COLUMN monthly_hours DECIMAL DEFAULT 0;
    RAISE NOTICE 'Added monthly_hours column to users table';
  ELSE
    RAISE NOTICE 'monthly_hours column already exists in users table';
  END IF;
END $$;

-- Add comment to the column
COMMENT ON COLUMN users.monthly_hours IS 'Total monthly hours assigned to the user (e.g., 86h). All workers will use from this budget according to their assigned days.';

-- Set a default value for existing users (can be updated later)
UPDATE users SET monthly_hours = 0 WHERE monthly_hours IS NULL; 