import type { Database } from './database.types';

// Convenience types for table operations
export type User = Database['public']['Tables']['users']['Row'];
export type Student = Database['public']['Tables']['students']['Row'];
export type Teacher = Database['public']['Tables']['teachers']['Row'];
export type Parent = Database['public']['Tables']['parents']['Row'];
export type Class = Database['public']['Tables']['classes']['Row'];
export type Subject = Database['public']['Tables']['subjects']['Row'];
export type AcademicYear = Database['public']['Tables']['academic_years']['Row'];
export type Attendance = Database['public']['Tables']['attendance']['Row'];
export type Exam = Database['public']['Tables']['exams']['Row'];
export type Mark = Database['public']['Tables']['marks']['Row'];
export type FeeStructure = Database['public']['Tables']['fee_structure']['Row'];
export type StudentFee = Database['public']['Tables']['student_fees']['Row'];
export type FeePayment = Database['public']['Tables']['fee_payments']['Row'];
export type Event = Database['public']['Tables']['events']['Row'];
export type Homework = Database['public']['Tables']['homework']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];
export type Certificate = Database['public']['Tables']['certificates']['Row'];
export type TeacherRating = Database['public']['Tables']['teacher_ratings']['Row'];

// Insert types
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type StudentInsert = Database['public']['Tables']['students']['Insert'];
export type TeacherInsert = Database['public']['Tables']['teachers']['Insert'];
export type ParentInsert = Database['public']['Tables']['parents']['Insert'];
export type ClassInsert = Database['public']['Tables']['classes']['Insert'];
export type SubjectInsert = Database['public']['Tables']['subjects']['Insert'];
export type AcademicYearInsert = Database['public']['Tables']['academic_years']['Insert'];
export type AttendanceInsert = Database['public']['Tables']['attendance']['Insert'];
export type ExamInsert = Database['public']['Tables']['exams']['Insert'];
export type MarkInsert = Database['public']['Tables']['marks']['Insert'];
export type FeePaymentInsert = Database['public']['Tables']['fee_payments']['Insert'];
export type EventInsert = Database['public']['Tables']['events']['Insert'];
export type HomeworkInsert = Database['public']['Tables']['homework']['Insert'];
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];

// Update types
export type UserUpdate = Database['public']['Tables']['users']['Update'];
export type StudentUpdate = Database['public']['Tables']['students']['Update'];
export type TeacherUpdate = Database['public']['Tables']['teachers']['Update'];
export type ParentUpdate = Database['public']['Tables']['parents']['Update'];
export type ClassUpdate = Database['public']['Tables']['classes']['Update'];
export type SubjectUpdate = Database['public']['Tables']['subjects']['Update'];
export type AcademicYearUpdate = Database['public']['Tables']['academic_years']['Update'];
export type ExamUpdate = Database['public']['Tables']['exams']['Update'];
export type MarkUpdate = Database['public']['Tables']['marks']['Update'];

// Enum types
export type UserRole = Database['public']['Enums']['user_role'];

// Common UI types
export interface SelectOption {
    value: string;
    label: string;
}

export interface PaginationParams {
    page: number;
    pageSize: number;
}

export interface SortParams {
    field: string;
    direction: 'asc' | 'desc';
}

export interface FilterParams {
    [key: string]: string | number | boolean | null;
}

// API Response types
export interface ApiResponse<T> {
    data: T | null;
    error: Error | null;
    isLoading: boolean;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface StudentEnrollmentHistory {
    id: string;
    student_id: string;
    academic_year_id: string;
    class_id: string;
    status: 'active' | 'completed' | 'transferred' | 'alumni';
    created_at: string;
    updated_at: string;
}

// Student with relations
export interface StudentWithRelations extends Student {
    parent?: Parent | null;
    class?: Class | null;
    academic_year?: AcademicYear | null;
    user?: User | null;
}

// Teacher with relations
export interface TeacherWithRelations extends Teacher {
    user?: User | null;
    classes?: Class[];
    subjectDetails?: Subject[];
}

// Class with relations
export interface ClassWithRelations extends Class {
    academic_year?: AcademicYear | null;
    class_teacher?: Teacher | null;
    students?: Student[];
    subjects?: Subject[];
}

// Form state types
export interface FormErrors {
    [key: string]: string | undefined;
}

export interface FormState<T> {
    values: T;
    errors: FormErrors;
    touched: { [key: string]: boolean };
    isSubmitting: boolean;
}
