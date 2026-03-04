// Exam Management Type Definitions
// Actual DB columns: id, exam_name, exam_type, class_id, academic_year_id, exam_date, end_date, is_published, created_at, updated_at

export type ExamStatus = 'draft' | 'published';

export type ExamType = 'FA1' | 'FA2' | 'FA3' | 'FA4' | 'SA1' | 'SA2' | 'Midterm' | 'Final';

export interface Exam {
    id: string;
    exam_name: string;
    exam_type?: string | null;      // FA1, FA2, SA1, SA2, Midterm, Final
    class_id?: string | null;
    academic_year_id?: string | null;
    exam_date?: string | null;      // ISO date string (YYYY-MM-DD)
    end_date?: string | null;       // ISO date string (YYYY-MM-DD)
    is_published: boolean;
    created_at: string;
    updated_at: string;
    // Joined data
    classes?: {
        id: string;
        class_name: string;
        section?: string;
    };
    academic_years?: {
        id: string;
        year_name: string;
        is_current: boolean;
    };
}

export interface CreateExamInput {
    exam_name: string;
    exam_type?: string;
    class_id?: string;
    academic_year_id?: string;
    exam_date?: string;
    end_date?: string;
}

export interface UpdateExamInput {
    id: string;
    exam_name?: string;
    exam_type?: string;
    class_id?: string;
    academic_year_id?: string;
    exam_date?: string;
    end_date?: string;
    is_published?: boolean;
}

export interface ExamFilters {
    classId?: string;
    academicYearId?: string;
    examType?: string;
    isPublished?: boolean;
    startDate?: string;
    endDate?: string;
}

export interface ExamStats {
    totalExams: number;
    publishedExams: number;
    draftExams: number;
    upcomingExams: number;
    pastExams: number;
}

export interface ExamListItem extends Exam {
    isUpcoming: boolean;
    isPast: boolean;
    daysUntilExam?: number;
}

// Exam types for dropdown
export const EXAM_TYPES: ExamType[] = ['FA1', 'FA2', 'FA3', 'FA4', 'SA1', 'SA2', 'Midterm', 'Final'];

// Common subjects for dropdown
export const COMMON_SUBJECTS = [
    'Mathematics',
    'English',
    'Science',
    'Social Studies',
    'Hindi',
    'Physics',
    'Chemistry',
    'Biology',
    'History',
    'Geography',
    'Computer Science',
    'Physical Education',
    'Art',
    'Music',
    'Environmental Science',
] as const;

// Subject emoji mapping
export const SUBJECT_EMOJIS: Record<string, string> = {
    'Mathematics': '📘',
    'English': '📖',
    'Science': '🔬',
    'Social Studies': '🌍',
    'Hindi': '📚',
    'Physics': '⚛️',
    'Chemistry': '🧪',
    'Biology': '🧬',
    'History': '📜',
    'Geography': '🗺️',
    'Computer Science': '💻',
    'Physical Education': '⚽',
    'Art': '🎨',
    'Music': '🎵',
    'Environmental Science': '🌱',
    'default': '📝',
};

export function getSubjectEmoji(subject: string): string {
    return SUBJECT_EMOJIS[subject] || SUBJECT_EMOJIS.default;
}
