-- 1. Add the System Owner role while preserving existing roles.
ALTER TABLE users
DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users
ADD CONSTRAINT users_role_check
CHECK (role IN ('owner', 'admin', 'staff', 'viewer'));

-- 2. Add account approval fields.
ALTER TABLE users
ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'approved';

ALTER TABLE users
ADD COLUMN IF NOT EXISTS approved_by BIGINT REFERENCES users(id);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS created_by BIGINT REFERENCES users(id);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 3. Restrict approval status values.
ALTER TABLE users
DROP CONSTRAINT IF EXISTS users_approval_status_check;

ALTER TABLE users
ADD CONSTRAINT users_approval_status_check
CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- 4. Preserve existing accounts as approved.
UPDATE users
SET approved_at = COALESCE(approved_at, created_at)
WHERE approval_status = 'approved';

-- 5. Add indexes for account management.
CREATE INDEX IF NOT EXISTS idx_users_approval_status
ON users(approval_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_users_role_active
ON users(role, active);

-- 6. Permit only one active System Owner.
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_single_active_owner
ON users(role)
WHERE role = 'owner' AND active = TRUE;