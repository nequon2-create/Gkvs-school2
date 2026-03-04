-- ============================================================
-- ATTENDANCE SYSTEM MIGRATION
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Create teacher_attendance table
CREATE TABLE IF NOT EXISTS teacher_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  is_present BOOLEAN DEFAULT false,
  marked_by UUID REFERENCES users(id),
  marked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(teacher_id, date)
);

-- 2. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_teacher_attendance_date ON teacher_attendance(date);
CREATE INDEX IF NOT EXISTS idx_teacher_attendance_teacher_id ON teacher_attendance(teacher_id);

-- 3. Enable RLS
ALTER TABLE teacher_attendance ENABLE ROW LEVEL SECURITY;

-- 4. Admin can do everything
CREATE POLICY "admin_manage_teacher_attendance"
  ON teacher_attendance
  FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- 5. Teachers can view their own attendance records
CREATE POLICY "teacher_view_own_attendance"
  ON teacher_attendance
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM teachers WHERE teachers.id = teacher_attendance.teacher_id AND teachers.user_id = auth.uid())
  );

-- 6. Verify student attendance table structure (for reference, no changes needed)
-- attendance table columns: id, student_id, class_id, date, status, teacher_id, marked_by, created_at
-- status = 'present' | 'absent' | 'late'
