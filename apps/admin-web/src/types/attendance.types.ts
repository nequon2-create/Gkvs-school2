// Attendance Management Type Definitions

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface AttendanceRecord {
    id: string;
    student_id: string;
    class_id: string;
    academic_year_id: string;
    date: string; // ISO date string (YYYY-MM-DD)
    status: AttendanceStatus;
    marked_by?: string;
    remarks?: string;
    created_at: string;
    updated_at: string;
    // Joined data
    students?: {
        id: string;
        full_name: string;
        registration_number: string;
        photo_url?: string;
        gender: string;
    };
    classes?: {
        id: string;
        class_name: string;
        section?: string;
    };
}

export interface AttendanceStats {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    excusedDays: number;
    attendancePercentage: number;
}

export interface ClassAttendanceStats {
    classId: string;
    className: string;
    section?: string;
    totalStudents: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    excusedCount: number;
    attendancePercentage: number;
    date: string;
}

export interface AttendanceFilters {
    startDate?: string;
    endDate?: string;
    classId?: string;
    academicYearId?: string;
    gender?: 'male' | 'female' | 'other';
    status?: AttendanceStatus;
}

export interface MarkAttendanceInput {
    studentId: string;
    date: string;
    status: AttendanceStatus;
    remarks?: string;
}

export interface BulkAttendanceInput {
    date: string;
    classId: string;
    academicYearId: string;
    records: Array<{
        studentId: string;
        status: AttendanceStatus;
        remarks?: string;
    }>;
}

export interface AttendanceGraphData {
    date: string;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    excusedCount: number;
    totalStudents: number;
    attendancePercentage: number;
}

export interface MonthlyAttendanceData {
    month: string; // e.g., "Jan 2026"
    presentDays: number;
    absentDays: number;
    lateDays: number;
    excusedDays: number;
}

export interface GenderAttendanceData {
    gender: 'male' | 'female' | 'other';
    presentCount: number;
    absentCount: number;
    attendancePercentage: number;
}

export interface ExcelAttendanceRow {
    registrationNumber: string;
    studentName?: string;
    status: string;
    remarks?: string;
    // Validation results
    isValid?: boolean;
    error?: string;
}

export interface AttendanceValidationResult {
    valid: ExcelAttendanceRow[];
    invalid: ExcelAttendanceRow[];
    totalRows: number;
    validCount: number;
    invalidCount: number;
}
