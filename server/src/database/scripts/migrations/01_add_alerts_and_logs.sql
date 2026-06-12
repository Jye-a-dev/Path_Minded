-- =========================================================
-- Academic Alerts and Advising Logs Migration
-- =========================================================

-- Create ENUMs if not exist
DO $$ BEGIN
    CREATE TYPE alert_type AS ENUM (
        'PROBATION_RISK',
        'GPA_WARNING',
        'CREDIT_WARNING'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE alert_status AS ENUM (
        'ACTIVE',
        'RESOLVED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create academic_alerts table
CREATE TABLE IF NOT EXISTS academic_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    alert_type alert_type NOT NULL,
    alert_status alert_status DEFAULT 'ACTIVE',
    gpa NUMERIC(4,2),
    total_credits INT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create advising_logs table
CREATE TABLE IF NOT EXISTS advising_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    advisor_id UUID REFERENCES advisors(id) ON DELETE SET NULL,
    alert_id UUID REFERENCES academic_alerts(id) ON DELETE SET NULL,
    log_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_alerts_student_id ON academic_alerts(student_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON academic_alerts(alert_status);
CREATE INDEX IF NOT EXISTS idx_advising_logs_student_id ON advising_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_advising_logs_alert_id ON advising_logs(alert_id);

-- Create triggers to update updated_at column
DROP TRIGGER IF EXISTS trg_academic_alerts_updated_at ON academic_alerts;
CREATE TRIGGER trg_academic_alerts_updated_at
BEFORE UPDATE ON academic_alerts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_advising_logs_updated_at ON advising_logs;
CREATE TRIGGER trg_advising_logs_updated_at
BEFORE UPDATE ON advising_logs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
