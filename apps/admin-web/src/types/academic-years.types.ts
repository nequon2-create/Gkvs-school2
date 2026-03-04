export interface AcademicYear {
    id: string;
    year_name: string;
    start_date: string;
    end_date: string;
    is_current: boolean;
    created_by: string | null;
    created_at: string;
    updated_at: string;
}

export interface CreateAcademicYearInput {
    year_name: string;
    start_date: string;
    end_date: string;
    is_current?: boolean;
}

export interface UpdateAcademicYearInput {
    id: string;
    year_name?: string;
    start_date?: string;
    end_date?: string;
    is_current?: boolean;
}

export type AcademicYearStatus = 'current' | 'past' | 'upcoming' | 'all';
