// src/types/marks.types.ts
// Complete marks type definitions

export type Grade = 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';

export type MarksStatus = 'pass' | 'fail' | 'absent' | 'pending';

export interface Mark {
    id: string;
    student_id: string;
    exam_id: string;
    marks_obtained: number;
    grade: Grade;
    status: MarksStatus;
    remarks?: string;
    created_at: string;
    updated_at: string;
}

// Marks with joined relationship data - used by hooks and pages
export interface MarksWithDetails {
    id: string;
    student_id: string;
    exam_id: string;
    subject_id?: string | null;
    marks_obtained: number;
    max_marks?: number | null;
    percentage?: number | null;
    grade?: Grade | null;
    remarks?: string | null;
    created_at: string;
    updated_at: string;
    // Joined relationships
    student?: {
        id?: string;
        full_name: string;
        registration_number?: string;
        photo_url?: string;
        roll_number?: string;
        class_id?: string;
    };
    students?: {
        id: string;
        full_name: string;
        registration_number: string;
        photo_url?: string;
        roll_number?: string;
        class_id?: string;
    };
    exam?: {
        id?: string;
        exam_name: string;
        exam_type?: string | null;
        class_id?: string | null;
    };
    exams?: {
        id: string;
        exam_name: string;
        exam_type?: string | null;
        class_id?: string | null;
    };
    subjects?: {
        id: string;
        subject_name: string;
    };
    classes?: {
        id: string;
        class_name: string;
        section?: string;
    };
}

// Database table type matching actual Supabase schema
// Actual columns: id, student_id, exam_id, subject_id, marks_obtained, max_marks, grade, remarks, created_at, updated_at, percentage
export interface MarksRecord {
    id: string;
    student_id: string;
    exam_id: string;
    subject_id?: string | null;
    marks_obtained: number;
    max_marks: number;
    percentage?: number | null; // Stored/calculated in DB
    grade?: Grade | null;       // Stored/calculated in DB
    remarks?: string | null;
    created_at: string;
    updated_at: string;
}

export interface MarksEntry {
    student_id: string;
    exam_id: string;
    marks_obtained: number;
    grade?: Grade;
    remarks?: string;
}

// For creating new marks - used by useMarks.ts
// Note: no 'subject' text field - uses subject_id FK instead
export interface CreateMarksInput {
    student_id: string;
    exam_id: string;
    subject_id: string;
    marks_obtained: number;
    max_marks: number;
    remarks?: string;
}

// For updating existing marks - used by useMarks.ts
export interface UpdateMarksInput {
    marks_obtained?: number;
    max_marks?: number;
    remarks?: string;
}

// For filtering marks - used by useMarks.ts
export interface MarksFilters {
    exam_id?: string;
    class_id?: string;
    subject_id?: string;
    student_id?: string;
    grade?: Grade;
    search?: string; // Search by student name
}

// Statistics for marks - used by useMarks.ts
export interface MarksStats {
    total_students: number;
    average_percentage: number;
    highest_marks: number;
    lowest_marks: number;
    topper?: {
        student_name: string;
        marks: number;
        percentage: number;
    };
    grade_distribution: {
        grade: Grade;
        count: number;
        percentage: number;
    }[];
    pass_percentage: number; // % of students with grade D or better
}

// For subject-wise statistics - used by useMarks.ts
export interface SubjectStats {
    subject: string;
    average_marks: number;
    average_percentage: number;
    highest_marks: number;
    lowest_marks: number;
    total_students: number;
}

// For bulk upload from Excel - used by useMarks.ts
export interface BulkMarksInput {
    exam_id: string;
    class_id: string;
    marks: {
        registration_number: string; // To identify student
        subject: string;             // Subject name (looked up to find subject_id)
        marks_obtained: number;
        max_marks: number;
        remarks?: string;
    }[];
}

// Excel row structure - used by excelParser.ts
export interface ExcelMarksRow {
    'Registration Number': string;
    'Student Name': string; // Read-only, for reference
    [subject: string]: string | number; // Dynamic subject columns
}

// Validation error - used by excelParser.ts
export interface MarksValidationError {
    row?: number;
    field: string;
    message: string;
    value?: any;
}

export interface GradeConfig {
    grade: Grade;
    minMarks: number;
    maxMarks: number;
    label: string;
    color: string;
}

export const GRADE_CONFIG: GradeConfig[] = [
    { grade: 'A+', minMarks: 90, maxMarks: 100, label: 'Outstanding', color: '#30D158' },
    { grade: 'A', minMarks: 70, maxMarks: 89, label: 'Excellent', color: '#34C759' },
    { grade: 'B+', minMarks: 50, maxMarks: 69, label: 'Very Good', color: '#0071E3' },
    { grade: 'B', minMarks: 30, maxMarks: 49, label: 'Good', color: '#2997FF' },
    { grade: 'C', minMarks: 0, maxMarks: 29, label: 'Average', color: '#FF9F0A' },
];

// GRADE_COLORS constant for gradeCalculator.ts
export const GRADE_COLORS: Record<Grade, string> = {
    'A+': '#30D158',
    'A': '#34C759',
    'B+': '#0071E3',
    'B': '#2997FF',
    'C+': '#FF9F0A',
    'C': '#FF9500',
    'D': '#FF6B00',
    'F': '#FF453A',
};

export function calculateGrade(marksObtained: number, totalMarks: number): Grade {
    const percentage = (marksObtained / totalMarks) * 100;
    if (percentage >= 90) return 'A+';
    if (percentage >= 70) return 'A';
    if (percentage >= 50) return 'B+';
    if (percentage >= 30) return 'B';
    return 'C';
}

export function getGradeColor(grade: Grade): string {
    return GRADE_CONFIG.find((g) => g.grade === grade)?.color ?? '#86868B';
}

export function getGradeLabel(grade: Grade): string {
    return GRADE_CONFIG.find((g) => g.grade === grade)?.label ?? 'Unknown';
}
