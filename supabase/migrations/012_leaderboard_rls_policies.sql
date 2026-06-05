-- Add policies to allow teachers and parents to view marks for class leaderboard calculations

-- Drop existing policies if they exist to prevent conflicts
DROP POLICY IF EXISTS "Teachers can view all marks for leaderboard" ON public.marks;
DROP POLICY IF EXISTS "Parents can view class marks for leaderboard" ON public.marks;

-- Policy: Allow teachers to view all marks (so they can see leaderboard for any class)
CREATE POLICY "Teachers can view all marks for leaderboard"
    ON public.marks
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'teacher'
        )
    );

-- Policy: Allow parents to view marks of all students in their child's class
CREATE POLICY "Parents can view class marks for leaderboard"
    ON public.marks
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            JOIN public.parents p ON p.user_id = u.id
            JOIN public.students child ON child.parent_id = p.id
            JOIN public.students peer ON peer.class_id = child.class_id
            WHERE u.id = auth.uid()
            AND u.role = 'parent'
            AND peer.id = marks.student_id
        )
    );
