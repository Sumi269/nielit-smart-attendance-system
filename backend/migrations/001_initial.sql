CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'staff'
        CHECK (role IN ('admin', 'staff', 'viewer')),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS courses (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS batches (
    id BIGSERIAL PRIMARY KEY,
    course_id BIGINT NOT NULL REFERENCES courses(id),
    name TEXT NOT NULL,
    academic_year TEXT NOT NULL,
    start_date DATE,
    end_date DATE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (course_id, name, academic_year)
);

CREATE TABLE IF NOT EXISTS students (
    id BIGSERIAL PRIMARY KEY,
    student_code TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS batch_students (
    student_id BIGINT NOT NULL REFERENCES students(id),
    batch_id BIGINT NOT NULL REFERENCES batches(id),
    enrolled_on DATE NOT NULL DEFAULT CURRENT_DATE,
    left_on DATE,
    PRIMARY KEY (student_id, batch_id)
);

CREATE TABLE IF NOT EXISTS class_sessions (
    id BIGSERIAL PRIMARY KEY,
    batch_id BIGINT NOT NULL REFERENCES batches(id),
    session_date DATE NOT NULL,
    title TEXT NOT NULL DEFAULT 'Class',
    status TEXT NOT NULL DEFAULT 'held'
        CHECK (status IN ('held', 'cancelled')),
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendance_records (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT NOT NULL REFERENCES class_sessions(id),
    student_id BIGINT NOT NULL REFERENCES students(id),
    status TEXT NOT NULL
        CHECK (status IN ('present', 'absent', 'leave', 'excused')),
    source TEXT NOT NULL DEFAULT 'manual'
        CHECK (source IN ('manual', 'voice', 'import', 'device')),
    marked_by BIGINT REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (session_id, student_id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id BIGINT,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_students_name
    ON students(full_name);

CREATE INDEX IF NOT EXISTS idx_batches_course
    ON batches(course_id);

CREATE INDEX IF NOT EXISTS idx_sessions_batch_date
    ON class_sessions(batch_id, session_date);

CREATE INDEX IF NOT EXISTS idx_attendance_session_student
    ON attendance_records(session_id, student_id);

CREATE INDEX IF NOT EXISTS idx_audit_created
    ON audit_logs(created_at DESC);
    CREATE TABLE IF NOT EXISTS biometric_devices (
    id BIGSERIAL PRIMARY KEY,
    device_code TEXT NOT NULL UNIQUE,
    device_name TEXT NOT NULL,
    device_type TEXT NOT NULL,
    batch_id BIGINT REFERENCES batches(id),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    last_seen_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);