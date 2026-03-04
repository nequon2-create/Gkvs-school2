export type UserRole = 'teacher' | 'parent';

export interface LoggedInUser {
    id: string;
    role: UserRole;
    full_name: string;
    login_id: string;
    // Teacher-specific
    registration_number?: string;
    subjects?: string[];
    phone?: string;
    email?: string;
    photo_url?: string;
    // Student/Parent-specific
    class_id?: string;
    section?: string;
    roll_number?: string;
    academic_year_id?: string;
}

export interface Student {
    id: string;
    registration_number: string | null;
    full_name: string;
    date_of_birth: string | null;
    gender: string | null;
    class_id: string | null;
    section: string | null;
    roll_number: string | null;
    photo_url: string | null;
    parent_name: string | null;
    parent_phone: string | null;
    parent_email: string | null;
    address: string | null;
    academic_year_id: string | null;
    is_active: boolean | null;
    login_id: string | null;
}

export interface Teacher {
    id: string;
    user_id: string | null;
    registration_number: string;
    full_name: string;
    photo_url: string | null;
    phone: string | null;
    email: string | null;
    subjects: string[] | null;
    doj: string | null;
    qualification: string | null;
    gender: string | null;
    date_of_birth: string | null;
    address: string | null;
    login_id: string | null;
}

export interface SchoolClass {
    id: string;
    class_name: string;
    section: string | null;
    academic_year_id: string | null;
    class_teacher_id: string | null;
    numeric_value: number | null;
    is_active: boolean | null;
}

export interface AttendanceRecord {
    id: string;
    student_id: string | null;
    class_id: string | null;
    date: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    subject_id: string | null;
    marked_by: string | null;
    teacher_id: string | null;
}

export interface Event {
    id: string;
    title: string;
    description: string | null;
    date: string;
    type: string | null;
    images: string[] | null;
    videos: string[] | null;
    created_at: string | null;
}

export interface ExamTimetable {
    id: string;
    exam_name: string;
    exam_type: 'FA1' | 'FA2' | 'Midterm' | 'Final' | null;
    class_id: string | null;
    academic_year_id: string | null;
    start_date: string | null;
    end_date: string | null;
    is_published: boolean | null;
}

export interface ExamSchedule {
    id: string;
    exam_timetable_id: string | null;
    subject_id: string | null;
    exam_date: string;
    exam_time: string;
    duration_minutes: number | null;
    subjects?: {
        subject_name: string;
        subject_code: string;
    };
}

export interface Homework {
    id: string;
    teacher_id: string | null;
    class_id: string | null;
    subject_id: string | null;
    title: string;
    description: string | null;
    due_date: string | null;
    attachments: string[] | null;
    created_at: string | null;
}

export interface Notification {
    id: string;
    user_id: string | null;
    title: string;
    message: string | null;
    type: string | null;
    read: boolean | null;
    action_url: string | null;
    created_at: string | null;
}

export interface StudentFee {
    id: string;
    student_id: string | null;
    academic_year_id: string | null;
    total_amount: number;
    amount_paid: number | null;
    amount_pending: number | null;
}

export interface FeeReceipt {
    id: string;
    receipt_number: number;
    student_id: string;
    receipt_date: string;
    academic_year_id: string;
    total_amount: number;
    amount_paid: number;
    amount_pending: number;
    payment_mode: 'Cash' | 'UPI' | 'Card' | 'Cheque';
    payment_status: 'Paid' | 'Partial' | 'Pending';
}

export interface TeacherRating {
    id: string;
    teacher_id: string | null;
    student_id: string | null;
    rating: number | null;
    review: string | null;
    created_at: string | null;
}

// Navigation param lists
export type RootStackParamList = {
    RoleSelection: undefined;
    Login: { role: UserRole };
    ParentTabs: undefined;
    TeacherTabs: undefined;
    AddHomework: { editId?: string } | undefined;
    TeacherClassList: undefined;
    TeacherStudentList: { classId: string; className: string };
    StudentProfile: { studentId: string };
    Receipts: { studentId: string };
};

export type ParentTabParamList = {
    Home: undefined;
    Events: undefined;
    Exams: undefined;
    Profile: undefined;
};

export type TeacherTabParamList = {
    Home: undefined;
    Events: undefined;
    Attendance: undefined;
    Profile: undefined;
};
