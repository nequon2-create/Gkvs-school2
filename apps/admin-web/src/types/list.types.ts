export interface FilterOptions {
    classId?: string;
    academicYearId?: string;
    gender?: 'male' | 'female' | 'other';
    isActive?: boolean;
    subject?: string;
    qualification?: string;
    skipHistory?: boolean;
}

export interface SearchQuery {
    query: string;
    field?: 'name' | 'registration' | 'email' | 'phone';
}

export interface StudentListItem {
    id: string;
    registration_number: string;
    full_name: string;
    gender: string;
    photo_url?: string;
    parent_name: string;
    parent_phone: string;
    parent_email?: string;
    class_id: string;
    academic_year_id: string;
    is_active: boolean;
    created_at: string;
    classes?: {
        id: string;
        class_name: string;
        section?: string;
    };
    academic_years?: {
        id: string;
        year_name: string;
    };
}

export interface TeacherListItem {
    id: string;
    registration_number: string;
    full_name: string;
    gender?: string | null;
    photo_url?: string | null;
    phone?: string | null;
    email?: string | null;
    subjects?: string[] | null;
    qualification?: string | null;
    doj?: string | null;
    created_at: string;
}

export interface PaginationOptions {
    page: number;
    pageSize: number;
    total: number;
}
