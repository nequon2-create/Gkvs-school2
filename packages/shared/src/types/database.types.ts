export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    // Allows to automatically instantiate createClient with right options
    // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
    __InternalSupabase: {
        PostgrestVersion: "14.1"
    }
    public: {
        Tables: {
            academic_years: {
                Row: {
                    created_at: string | null
                    created_by: string | null
                    end_date: string
                    id: string
                    is_current: boolean | null
                    start_date: string
                    updated_at: string | null
                    year_name: string
                }
                Insert: {
                    created_at?: string | null
                    created_by?: string | null
                    end_date: string
                    id?: string
                    is_current?: boolean | null
                    start_date: string
                    updated_at?: string | null
                    year_name: string
                }
                Update: {
                    created_at?: string | null
                    created_by?: string | null
                    end_date?: string
                    id?: string
                    is_current?: boolean | null
                    start_date?: string
                    updated_at?: string | null
                    year_name?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "academic_years_created_by_fkey"
                        columns: ["created_by"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            attendance: {
                Row: {
                    class_id: string | null
                    created_at: string | null
                    date: string
                    id: string
                    marked_by: string | null
                    status: string | null
                    student_id: string | null
                    subject_id: string | null
                }
                Insert: {
                    class_id?: string | null
                    created_at?: string | null
                    date: string
                    id?: string
                    marked_by?: string | null
                    status?: string | null
                    student_id?: string | null
                    subject_id?: string | null
                }
                Update: {
                    class_id?: string | null
                    created_at?: string | null
                    date?: string
                    id?: string
                    marked_by?: string | null
                    status?: string | null
                    student_id?: string | null
                    subject_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "attendance_class_id_fkey"
                        columns: ["class_id"]
                        isOneToOne: false
                        referencedRelation: "classes"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "attendance_marked_by_fkey"
                        columns: ["marked_by"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "attendance_student_id_fkey"
                        columns: ["student_id"]
                        isOneToOne: false
                        referencedRelation: "students"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "attendance_subject_id_fkey"
                        columns: ["subject_id"]
                        isOneToOne: false
                        referencedRelation: "subjects"
                        referencedColumns: ["id"]
                    },
                ]
            }
            certificates: {
                Row: {
                    conduct: string | null
                    created_at: string | null
                    id: string
                    issue_date: string | null
                    issued_by: string | null
                    student_id: string | null
                    type: string
                }
                Insert: {
                    conduct?: string | null
                    created_at?: string | null
                    id?: string
                    issue_date?: string | null
                    issued_by?: string | null
                    student_id?: string | null
                    type: string
                }
                Update: {
                    conduct?: string | null
                    created_at?: string | null
                    id?: string
                    issue_date?: string | null
                    issued_by?: string | null
                    student_id?: string | null
                    type?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "certificates_issued_by_fkey"
                        columns: ["issued_by"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "certificates_student_id_fkey"
                        columns: ["student_id"]
                        isOneToOne: false
                        referencedRelation: "students"
                        referencedColumns: ["id"]
                    },
                ]
            }
            classes: {
                Row: {
                    academic_year_id: string | null
                    class_name: string
                    class_teacher_id: string | null
                    created_at: string | null
                    id: string
                    section: string | null
                    updated_at: string | null
                }
                Insert: {
                    academic_year_id?: string | null
                    class_name: string
                    class_teacher_id?: string | null
                    created_at?: string | null
                    id?: string
                    section?: string | null
                    updated_at?: string | null
                }
                Update: {
                    academic_year_id?: string | null
                    class_name?: string
                    class_teacher_id?: string | null
                    created_at?: string | null
                    id?: string
                    section?: string | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "classes_academic_year_id_fkey"
                        columns: ["academic_year_id"]
                        isOneToOne: false
                        referencedRelation: "academic_years"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "fk_class_teacher"
                        columns: ["class_teacher_id"]
                        isOneToOne: false
                        referencedRelation: "teachers"
                        referencedColumns: ["id"]
                    },
                ]
            }
            events: {
                Row: {
                    created_at: string | null
                    date: string
                    description: string | null
                    id: string
                    images: string[] | null
                    title: string
                    type: string | null
                    updated_at: string | null
                    videos: string[] | null
                }
                Insert: {
                    created_at?: string | null
                    date: string
                    description?: string | null
                    id?: string
                    images?: string[] | null
                    title: string
                    type?: string | null
                    updated_at?: string | null
                    videos?: string[] | null
                }
                Update: {
                    created_at?: string | null
                    date?: string
                    description?: string | null
                    id?: string
                    images?: string[] | null
                    title?: string
                    type?: string | null
                    updated_at?: string | null
                    videos?: string[] | null
                }
                Relationships: []
            }
            exams: {
                Row: {
                    academic_year_id: string | null
                    class_id: string | null
                    created_at: string | null
                    end_date: string | null
                    exam_date: string | null
                    exam_name: string
                    exam_type: string | null
                    id: string
                    is_published: boolean | null
                    updated_at: string | null
                }
                Insert: {
                    academic_year_id?: string | null
                    class_id?: string | null
                    created_at?: string | null
                    end_date?: string | null
                    exam_date?: string | null
                    exam_name: string
                    exam_type?: string | null
                    id?: string
                    is_published?: boolean | null
                    updated_at?: string | null
                }
                Update: {
                    academic_year_id?: string | null
                    class_id?: string | null
                    created_at?: string | null
                    end_date?: string | null
                    exam_date?: string | null
                    exam_name?: string
                    exam_type?: string | null
                    id?: string
                    is_published?: boolean | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "exams_academic_year_id_fkey"
                        columns: ["academic_year_id"]
                        isOneToOne: false
                        referencedRelation: "academic_years"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "exams_class_id_fkey"
                        columns: ["class_id"]
                        isOneToOne: false
                        referencedRelation: "classes"
                        referencedColumns: ["id"]
                    },
                ]
            }
            fee_payments: {
                Row: {
                    amount: number
                    collected_by: string | null
                    created_at: string | null
                    id: string
                    payment_date: string | null
                    payment_method: string | null
                    receipt_number: string | null
                    remarks: string | null
                    student_fee_id: string | null
                }
                Insert: {
                    amount: number
                    collected_by?: string | null
                    created_at?: string | null
                    id?: string
                    payment_date?: string | null
                    payment_method?: string | null
                    receipt_number?: string | null
                    remarks?: string | null
                    student_fee_id?: string | null
                }
                Update: {
                    amount?: number
                    collected_by?: string | null
                    created_at?: string | null
                    id?: string
                    payment_date?: string | null
                    payment_method?: string | null
                    receipt_number?: string | null
                    remarks?: string | null
                    student_fee_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "fee_payments_collected_by_fkey"
                        columns: ["collected_by"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "fee_payments_student_fee_id_fkey"
                        columns: ["student_fee_id"]
                        isOneToOne: false
                        referencedRelation: "student_fees"
                        referencedColumns: ["id"]
                    },
                ]
            }
            fee_structure: {
                Row: {
                    academic_year_id: string | null
                    amount: number
                    class_id: string | null
                    created_at: string | null
                    id: string
                    installments: number | null
                    updated_at: string | null
                }
                Insert: {
                    academic_year_id?: string | null
                    amount: number
                    class_id?: string | null
                    created_at?: string | null
                    id?: string
                    installments?: number | null
                    updated_at?: string | null
                }
                Update: {
                    academic_year_id?: string | null
                    amount?: number
                    class_id?: string | null
                    created_at?: string | null
                    id?: string
                    installments?: number | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "fee_structure_academic_year_id_fkey"
                        columns: ["academic_year_id"]
                        isOneToOne: false
                        referencedRelation: "academic_years"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "fee_structure_class_id_fkey"
                        columns: ["class_id"]
                        isOneToOne: false
                        referencedRelation: "classes"
                        referencedColumns: ["id"]
                    },
                ]
            }
            homework: {
                Row: {
                    attachments: string[] | null
                    class_id: string | null
                    created_at: string | null
                    description: string | null
                    due_date: string | null
                    id: string
                    subject_id: string | null
                    teacher_id: string | null
                    title: string
                    updated_at: string | null
                    student_ids: string[] | null
                }
                Insert: {
                    attachments?: string[] | null
                    class_id?: string | null
                    created_at?: string | null
                    description?: string | null
                    due_date?: string | null
                    id?: string
                    subject_id?: string | null
                    teacher_id?: string | null
                    title: string
                    updated_at?: string | null
                    student_ids?: string[] | null
                }
                Update: {
                    attachments?: string[] | null
                    class_id?: string | null
                    created_at?: string | null
                    description?: string | null
                    due_date?: string | null
                    id?: string
                    subject_id?: string | null
                    teacher_id?: string | null
                    title?: string
                    updated_at?: string | null
                    student_ids?: string[] | null
                }
                Relationships: [
                    {
                        foreignKeyName: "homework_class_id_fkey"
                        columns: ["class_id"]
                        isOneToOne: false
                        referencedRelation: "classes"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "homework_subject_id_fkey"
                        columns: ["subject_id"]
                        isOneToOne: false
                        referencedRelation: "subjects"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "homework_teacher_id_fkey"
                        columns: ["teacher_id"]
                        isOneToOne: false
                        referencedRelation: "teachers"
                        referencedColumns: ["id"]
                    },
                ]
            }
            marks: {
                Row: {
                    created_at: string | null
                    exam_id: string | null
                    grade: string | null
                    id: string
                    marks_obtained: number | null
                    max_marks: number | null
                    remarks: string | null
                    student_id: string | null
                    subject_id: string | null
                    updated_at: string | null
                }
                Insert: {
                    created_at?: string | null
                    exam_id?: string | null
                    grade?: string | null
                    id?: string
                    marks_obtained?: number | null
                    max_marks?: number | null
                    remarks?: string | null
                    student_id?: string | null
                    subject_id?: string | null
                    updated_at?: string | null
                }
                Update: {
                    created_at?: string | null
                    exam_id?: string | null
                    grade?: string | null
                    id?: string
                    marks_obtained?: number | null
                    max_marks?: number | null
                    remarks?: string | null
                    student_id?: string | null
                    subject_id?: string | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "marks_exam_id_fkey"
                        columns: ["exam_id"]
                        isOneToOne: false
                        referencedRelation: "exams"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "marks_student_id_fkey"
                        columns: ["student_id"]
                        isOneToOne: false
                        referencedRelation: "students"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "marks_subject_id_fkey"
                        columns: ["subject_id"]
                        isOneToOne: false
                        referencedRelation: "subjects"
                        referencedColumns: ["id"]
                    },
                ]
            }
            notifications: {
                Row: {
                    action_url: string | null
                    created_at: string | null
                    id: string
                    message: string | null
                    read: boolean | null
                    title: string
                    type: string | null
                    user_id: string | null
                }
                Insert: {
                    action_url?: string | null
                    created_at?: string | null
                    id?: string
                    message?: string | null
                    read?: boolean | null
                    title: string
                    type?: string | null
                    user_id?: string | null
                }
                Update: {
                    action_url?: string | null
                    created_at?:

                    string | null
                    id?: string
                    message?: string | null
                    read?: boolean | null
                    title?: string
                    type?: string | null
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "notifications_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            parents: {
                Row: {
                    created_at: string | null
                    email: string | null
                    full_name: string
                    id: string
                    occupation: string | null
                    phone: string | null
                    relationship: string | null
                    updated_at: string | null
                    user_id: string | null
                }
                Insert: {
                    created_at?: string | null
                    email?: string | null
                    full_name: string
                    id?: string
                    occupation?: string | null
                    phone?: string | null
                    relationship?: string | null
                    updated_at?: string | null
                    user_id?: string | null
                }
                Update: {
                    created_at?: string | null
                    email?: string | null
                    full_name?: string
                    id?: string
                    occupation?: string | null
                    phone?: string | null
                    relationship?: string | null
                    updated_at?: string | null
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "parents_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: true
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            student_fees: {
                Row: {
                    academic_year_id: string | null
                    created_at: string | null
                    id: string
                    paid_amount: number | null
                    pending_amount: number | null
                    student_id: string | null
                    total_amount: number
                    updated_at: string | null
                }
                Insert: {
                    academic_year_id?: string | null
                    created_at?: string | null
                    id?: string
                    paid_amount?: number | null
                    pending_amount?: number | null
                    student_id?: string | null
                    total_amount: number
                    updated_at?: string | null
                }
                Update: {
                    academic_year_id?: string | null
                    created_at?: string | null
                    id?: string
                    paid_amount?: number | null
                    pending_amount?: number | null
                    student_id?: string | null
                    total_amount?: number
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "student_fees_academic_year_id_fkey"
                        columns: ["academic_year_id"]
                        isOneToOne: false
                        referencedRelation: "academic_years"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "student_fees_student_id_fkey"
                        columns: ["student_id"]
                        isOneToOne: false
                        referencedRelation: "students"
                        referencedColumns: ["id"]
                    },
                ]
            }
            students: {
                Row: {
                    academic_year_id: string | null
                    address: string | null
                    class_id: string | null
                    created_at: string | null
                    dob: string | null
                    email: string | null
                    full_name: string
                    gender: string | null
                    id: string
                    parent_id: string | null
                    phone: string | null
                    photo_url: string | null
                    registration_number: string
                    roll_number: number | null
                    section: string | null
                    updated_at: string | null
                    user_id: string | null
                }
                Insert: {
                    academic_year_id?: string | null
                    address?: string | null
                    class_id?: string | null
                    created_at?: string | null
                    dob?: string | null
                    email?: string | null
                    full_name: string
                    gender?: string | null
                    id?: string
                    parent_id?: string | null
                    phone?: string | null
                    photo_url?: string | null
                    registration_number: string
                    roll_number?: number | null
                    section?: string | null
                    updated_at?: string | null
                    user_id?: string | null
                }
                Update: {
                    academic_year_id?: string | null
                    address?: string | null
                    class_id?: string | null
                    created_at?: string | null
                    dob?: string | null
                    email?: string | null
                    full_name?: string
                    gender?: string | null
                    id?: string
                    parent_id?: string | null
                    phone?: string | null
                    photo_url?: string | null
                    registration_number?: string
                    roll_number?: number | null
                    section?: string | null
                    updated_at?: string | null
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "students_academic_year_id_fkey"
                        columns: ["academic_year_id"]
                        isOneToOne: false
                        referencedRelation: "academic_years"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "students_class_id_fkey"
                        columns: ["class_id"]
                        isOneToOne: false
                        referencedRelation: "classes"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "students_parent_id_fkey"
                        columns: ["parent_id"]
                        isOneToOne: false
                        referencedRelation: "parents"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "students_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: true
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            subjects: {
                Row: {
                    class_id: string | null
                    created_at: string | null
                    id: string
                    subject_code: string
                    subject_name: string
                    teacher_id: string | null
                    updated_at: string | null
                }
                Insert: {
                    class_id?: string | null
                    created_at?: string | null
                    id?: string
                    subject_code: string
                    subject_name: string
                    teacher_id?: string | null
                    updated_at?: string | null
                }
                Update: {
                    class_id?: string | null
                    created_at?: string | null
                    id?: string
                    subject_code?: string
                    subject_name?: string
                    teacher_id?: string | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "subjects_class_id_fkey"
                        columns: ["class_id"]
                        isOneToOne: false
                        referencedRelation: "classes"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "subjects_teacher_id_fkey"
                        columns: ["teacher_id"]
                        isOneToOne: false
                        referencedRelation: "teachers"
                        referencedColumns: ["id"]
                    },
                ]
            }
            teacher_ratings: {
                Row: {
                    created_at: string | null
                    id: string
                    rating: number | null
                    review: string | null
                    student_id: string | null
                    teacher_id: string | null
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    rating?: number | null
                    review?: string | null
                    student_id?: string | null
                    teacher_id?: string | null
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    rating?: number | null
                    review?: string | null
                    student_id?: string | null
                    teacher_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "teacher_ratings_student_id_fkey"
                        columns: ["student_id"]
                        isOneToOne: false
                        referencedRelation: "students"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "teacher_ratings_teacher_id_fkey"
                        columns: ["teacher_id"]
                        isOneToOne: false
                        referencedRelation: "teachers"
                        referencedColumns: ["id"]
                    },
                ]
            }
            teachers: {
                Row: {
                    created_at: string | null
                    doj: string | null
                    email: string | null
                    full_name: string
                    id: string
                    phone: string | null
                    photo_url: string | null
                    qualification: string | null
                    registration_number: string
                    subjects: string[] | null
                    updated_at: string | null
                    user_id: string | null
                }
                Insert: {
                    created_at?: string | null
                    doj?: string | null
                    email?: string | null
                    full_name: string
                    id?: string
                    phone?: string | null
                    photo_url?: string | null
                    qualification?: string | null
                    registration_number: string
                    subjects?: string[] | null
                    updated_at?: string | null
                    user_id?: string | null
                }
                Update: {
                    created_at?: string | null
                    doj?: string | null
                    email?: string | null
                    full_name?: string
                    id?: string
                    phone?: string | null
                    photo_url?: string | null
                    qualification?: string | null
                    registration_number?: string
                    subjects?: string[] | null
                    updated_at?: string | null
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "teachers_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: true
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            users: {
                Row: {
                    created_at: string | null
                    email: string
                    id: string
                    role: Database["public"]["Enums"]["user_role"]
                    updated_at: string | null
                }
                Insert: {
                    created_at?: string | null
                    email: string
                    id?: string
                    role: Database["public"]["Enums"]["user_role"]
                    updated_at?: string | null
                }
                Update: {
                    created_at?: string | null
                    email?: string
                    id?: string
                    role?: Database["public"]["Enums"]["user_role"]
                    updated_at?: string | null
                }
                Relationships: []
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            get_class_student_count: { Args: { class_uuid: string }; Returns: number }
            get_student_attendance_percentage: {
                Args: { end_date: string; start_date: string; student_uuid: string }
                Returns: number
            }
            get_student_exam_average: {
                Args: { exam_uuid: string; student_uuid: string }
                Returns: number
            }
            get_teacher_average_rating: {
                Args: { teacher_uuid: string }
                Returns: number
            }
            get_user_role: { Args: { user_uuid: string }; Returns: string }
        }
        Enums: {
            user_role: "admin" | "teacher" | "parent" | "student"
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
    DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
            Row: infer R
        }
    ? R
    : never
    : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
            Row: infer R
        }
    ? R
    : never
    : never

export type TablesInsert<
    DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Insert: infer I
    }
    ? I
    : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
    }
    ? I
    : never
    : never

export type TablesUpdate<
    DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Update: infer U
    }
    ? U
    : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
    }
    ? U
    : never
    : never

export type Enums<
    DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
    EnumName extends DefaultSchemaEnumNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
    public: {
        Enums: {
            user_role: ["admin", "teacher", "parent", "student"],
        },
    },
} as const
