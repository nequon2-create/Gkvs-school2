export type ProfileType = 'student' | 'teacher';

export type Gender = 'male' | 'female' | 'other';

export interface StudentFormData {
    full_name: string;
    gender: Gender;
    date_of_birth: string;
    parent_name: string;
    parent_phone: string;
    parent_email?: string;
    academic_year_id: string;
    class_id: string;
    photo_url?: string;
    address?: string;
    login_id: string;
    password: string;
    aadhar_number: string;
    is_first_admission: boolean;
    past_school_name?: string;
    past_class?: string;
}

export interface TeacherFormData {
    full_name: string;
    gender: Gender;
    date_of_birth: string;
    subject: string;
    qualification: string;
    phone: string;
    email: string;
    photo_url?: string;
    address?: string;
    login_id: string;
    password: string;
}

export interface ValidationError {
    field: string;
    message: string;
}

export interface CreateProfileResult {
    success: boolean;
    error?: string;
    id?: string;
}

// ==================== Profile View Types ====================

export interface StudentProfile {
    id: string;
    registration_number: string;
    full_name: string;
    gender: string;
    date_of_birth: string;
    photo_url?: string | null;
    class_id: string;
    class_name?: string;
    section?: string;
    roll_number: string;
    academic_year_id: string;
    academic_year_name?: string;
    parent_name?: string | null;
    parent_phone?: string | null;
    parent_email?: string | null;
    address?: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    aadhar_number?: string | null;
    is_first_admission?: boolean | null;
    past_school_name?: string | null;
    past_class?: string | null;
}

export interface TeacherProfile {
    id: string;
    registration_number: string;
    full_name: string;
    gender: string;
    date_of_birth: string;
    photo_url?: string | null;
    qualification?: string | null;
    subjects?: string[] | null;
    joining_date?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface AcademicRecord {
    id: string;
    exam_id: string;
    exam_name: string;
    exam_type: string;
    exam_date: string;
    subject: string;
    marks_obtained: number;
    max_marks: number;
    percentage: number;
    grade: string;
    remarks?: string | null;
}

export interface SubjectPerformance {
    subject: string;
    total_exams: number;
    average_percentage: number;
    highest_marks: number;
    lowest_marks: number;
    grade_distribution: Record<string, number>;
}

export interface OverallAcademicStats {
    total_exams: number;
    total_subjects: number;
    overall_percentage: number;
    overall_grade: string;
    subject_performance: SubjectPerformance[];
    recent_exams: AcademicRecord[];
}

export interface AttendanceSummary {
    total_days: number;
    present_days: number;
    absent_days: number;
    late_days: number;
    excused_days: number;
    attendance_percentage: number;
    status: 'excellent' | 'good' | 'fair' | 'poor';
    monthly_breakdown: MonthlyAttendance[];
}

export interface MonthlyAttendance {
    month: string;
    year: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    total: number;
    percentage: number;
}

export interface UpdateStudentInput {
    full_name?: string;
    gender?: string;
    date_of_birth?: string;
    parent_name?: string;
    parent_phone?: string;
    parent_email?: string;
    address?: string;
    class_id?: string;
    roll_number?: string;
    section?: string;
}

export interface UpdateTeacherInput {
    full_name?: string;
    gender?: string;
    date_of_birth?: string;
    qualification?: string;
    subjects?: string[];
    phone?: string;
    email?: string;
    address?: string;
    joining_date?: string;
}

export interface PhotoUploadResult {
    success: boolean;
    url?: string;
    error?: string;
}

export interface ProfileViewState {
    profile: StudentProfile | TeacherProfile | null;
    academicHistory?: AcademicRecord[];
    academicStats?: OverallAcademicStats;
    attendance?: AttendanceSummary;
    loading: boolean;
    error: string | null;
}

export type AttendanceStatus = 'excellent' | 'good' | 'fair' | 'poor';

