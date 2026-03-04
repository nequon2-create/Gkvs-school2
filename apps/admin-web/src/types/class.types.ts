export interface Class {
    id: string;
    class_name: string;
    academic_year_id: string;
    created_at: string;
    updated_at: string;
}

export interface CreateClassInput {
    class_name: string;
    academic_year_id: string;
}

export interface UpdateClassInput {
    class_name?: string;
    academic_year_id?: string;
}
