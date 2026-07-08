-- ====================================================================
-- Learnser AI: Database Setup & Remote Procedure Call (RPC) Script
-- ====================================================================
-- Copy and paste this script directly into the Supabase SQL Editor
-- (https://supabase.com/dashboard/project/_/sql) and click RUN.

-- 1. Create the jee_questions Table
CREATE TABLE IF NOT EXISTS jee_questions (
    id TEXT PRIMARY KEY,
    subject TEXT NOT NULL,
    chapter TEXT NOT  NULL,
    topic TEXT,
    difficulty TEXT,
    year INTEGER,
    question_text TEXT NOT NULL,
    options JSONB, -- Array of strings (choices A, B, C, D)
    correct_answer TEXT,
    explanation TEXT
);

-- Enable Read-Only Row Level Security (RLS) for anonymous access
ALTER TABLE jee_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" 
ON jee_questions 
FOR SELECT 
TO anon, authenticated 
USING (true);

-- 2. Create the jee_chapters View
-- This view retrieves a list of unique subjects and chapters for the pre-test setup.
CREATE OR REPLACE VIEW jee_chapters AS
SELECT DISTINCT 
    subject, 
    chapter
FROM jee_questions
ORDER BY subject, chapter;

-- 3. Create the get_random_balanced_questions Stored Procedure (RPC)
-- This fetches difficulty-balanced questions for a list of chapters.
CREATE OR REPLACE FUNCTION get_random_balanced_questions(
  selected_chapters TEXT[],
  total_limit INT
)
RETURNS SETOF jee_questions
LANGUAGE plpgsql
AS $$
DECLARE
  easy_limit INT;
  medium_limit INT;
  hard_limit INT;
  total_selected INT;
  needed INT;
BEGIN
  -- Calculate target counts for each difficulty tier:
  -- 30% Easy, 50% Medium, 20% Hard
  easy_limit := ROUND(total_limit * 0.3);
  medium_limit := ROUND(total_limit * 0.5);
  hard_limit := total_limit - easy_limit - medium_limit;

  -- Create a temporary table to accumulate the balanced questions
  CREATE TEMP TABLE temp_selected_questions ON COMMIT DROP AS
  SELECT * FROM jee_questions WHERE FALSE;

  -- A. Fetch random Easy questions
  INSERT INTO temp_selected_questions
  SELECT * FROM jee_questions
  WHERE chapter = ANY(selected_chapters)
    AND LOWER(difficulty) = 'easy'
  ORDER BY RANDOM()
  LIMIT easy_limit;

  -- B. Fetch random Medium questions
  INSERT INTO temp_selected_questions
  SELECT * FROM jee_questions
  WHERE chapter = ANY(selected_chapters)
    AND (LOWER(difficulty) = 'medium' OR difficulty IS NULL OR difficulty = '')
  ORDER BY RANDOM()
  LIMIT medium_limit;

  -- C. Fetch random Hard questions
  INSERT INTO temp_selected_questions
  SELECT * FROM jee_questions
  WHERE chapter = ANY(selected_chapters)
    AND LOWER(difficulty) = 'hard'
  ORDER BY RANDOM()
  LIMIT hard_limit;

  -- Check total questions accumulated so far
  SELECT COUNT(*) INTO total_selected FROM temp_selected_questions;

  -- D. Seamless Backfill: If the target limit is not met, backfill with ANY difficulty
  IF total_selected < total_limit THEN
    needed := total_limit - total_selected;
    
    INSERT INTO temp_selected_questions
    SELECT * FROM jee_questions
    WHERE chapter = ANY(selected_chapters)
      AND id NOT IN (SELECT id FROM temp_selected_questions)
    ORDER BY RANDOM()
    LIMIT needed;
  END IF;

  -- Return final set of randomized balanced questions
  RETURN QUERY 
  SELECT * FROM temp_selected_questions
  ORDER BY RANDOM()
  LIMIT total_limit;
END;
$$;
