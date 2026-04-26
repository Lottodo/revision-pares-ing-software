-- Migration: add_rejected_status_and_specialty
-- NOTE: This migration is intentionally a no-op.
-- The REJECTED status was already applied via schema push.
-- Specialty column already exists in the database.
SELECT 1;
