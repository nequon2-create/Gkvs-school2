import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type {
    AttendanceRecord,
    AttendanceStats,
    ClassAttendanceStats,
    AttendanceFilters,
    MarkAttendanceInput,
    BulkAttendanceInput,
    AttendanceGraphData,
} from '../types/attendance.types';
import { format, sub } from 'date-fns';

interface UseAttendanceReturn {
    records: AttendanceRecord[];
    loading: boolean;
    error: string | null;
    fetchAttendance: (filters?: AttendanceFilters) => Promise<void>;
    markAttendance: (input: MarkAttendanceInput) => Promise<boolean>;
    bulkMarkAttendance: (input: BulkAttendanceInput) => Promise<boolean>;
    updateAttendance: (id: string, status: string, remarks?: string) => Promise<boolean>;
    deleteAttendance: (id: string) => Promise<boolean>;
    getStudentStats: (studentId: string, startDate?: string, endDate?: string) => Promise<AttendanceStats | null>;
    getClassStats: (classId: string, date: string) => Promise<ClassAttendanceStats | null>;
    getTrendData: (filters?: AttendanceFilters) => Promise<AttendanceGraphData[]>;
}

export function useAttendance(): UseAttendanceReturn {
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch attendance records with optional filters
    const fetchAttendance = useCallback(async (filters?: AttendanceFilters) => {
        try {
            setLoading(true);
            setError(null);

            console.log('📚 Fetching attendance records...', filters);

            let query = supabase
                .from('student_attendance')
                .select(`
                    *,
                    students (
                        id,
                        full_name,
                        registration_number,
                        photo_url,
                        gender
                    ),
                    classes (
                        id,
                        class_name,
                        section
                    )
                `)
                .order('date', { ascending: false })
                .order('created_at', { ascending: false });

            // Apply filters
            if (filters?.startDate) {
                query = query.gte('date', filters.startDate);
            }
            if (filters?.endDate) {
                query = query.lte('date', filters.endDate);
            }
            if (filters?.classId) {
                query = query.eq('class_id', filters.classId);
            }
            // Note: attendance table has no academic_year_id column - filtering not supported at DB level
            if (filters?.status) {
                query = query.eq('is_present', filters.status === 'present');
            }

            const { data, error: fetchError } = await query;

            if (fetchError) throw fetchError;

            // Filter by gender if needed (client-side since it's a join)
            let filteredData = data || [];
            if (filters?.gender) {
                filteredData = filteredData.filter(
                    (record: any) => record.students?.gender === filters.gender
                );
            }

            console.log(`✅ Fetched ${filteredData.length} attendance records`);
            setRecords(filteredData);
        } catch (err: any) {
            console.error('❌ Error fetching attendance:', err);
            setError(err.message || 'Failed to fetch attendance');
        } finally {
            setLoading(false);
        }
    }, []);

    // Mark attendance for a single student
    const markAttendance = useCallback(async (input: MarkAttendanceInput): Promise<boolean> => {
        try {
            console.log('✏️ Marking attendance:', input);

            // Get current user and academic year
            const { data: { user } } = await supabase.auth.getUser();

            // Get student's class and academic year
            const { data: student } = await supabase
                .from('students')
                .select('class_id, academic_year_id')
                .eq('id', input.studentId)
                .single();

            if (!student) throw new Error('Student not found');

            const attendanceData = {
                student_id: input.studentId,
                class_id: student.class_id,
                date: input.date,
                is_present: input.status === 'present',
                marked_by: user?.id,
            };

            // Upsert (insert or update if exists)
            const { error: upsertError } = await supabase
                .from('student_attendance')
                .upsert(attendanceData, {
                    onConflict: 'student_id,date',
                });

            if (upsertError) throw upsertError;

            console.log('✅ Attendance marked successfully');
            return true;
        } catch (err: any) {
            console.error('❌ Error marking attendance:', err);
            setError(err.message || 'Failed to mark attendance');
            return false;
        }
    }, []);

    // Bulk mark attendance for multiple students
    const bulkMarkAttendance = useCallback(async (input: BulkAttendanceInput): Promise<boolean> => {
        try {
            console.log(`📝 Bulk marking attendance for ${input.records.length} students`);

            const { data: { user } } = await supabase.auth.getUser();

            const attendanceRecords = input.records.map(record => ({
                student_id: record.studentId,
                class_id: input.classId,
                date: input.date,
                is_present: record.status === 'present',
                marked_by: user?.id,
            }));

            // Upsert all records at once
            const { error: upsertError } = await supabase
                .from('student_attendance')
                .upsert(attendanceRecords, {
                    onConflict: 'student_id,date',
                });

            if (upsertError) throw upsertError;

            console.log('✅ Bulk attendance marked successfully');
            return true;
        } catch (err: any) {
            console.error('❌ Error in bulk marking:', err);
            setError(err.message || 'Failed to mark bulk attendance');
            return false;
        }
    }, []);

    // Update existing attendance record
    const updateAttendance = useCallback(async (
        id: string,
        status: string,
        remarks?: string
    ): Promise<boolean> => {
        try {
            console.log('🔄 Updating attendance:', id);

            const { error: updateError } = await supabase
                .from('student_attendance')
                .update({
                    is_present: status === 'present',
                    notes: remarks || null,
                })
                .eq('id', id);

            if (updateError) throw updateError;

            console.log('✅ Attendance updated');
            return true;
        } catch (err: any) {
            console.error('❌ Error updating attendance:', err);
            setError(err.message || 'Failed to update attendance');
            return false;
        }
    }, []);

    // Delete attendance record
    const deleteAttendance = useCallback(async (id: string): Promise<boolean> => {
        try {
            console.log('🗑️ Deleting attendance:', id);

            const { error: deleteError } = await supabase
                .from('student_attendance')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;

            console.log('✅ Attendance deleted');
            return true;
        } catch (err: any) {
            console.error('❌ Error deleting attendance:', err);
            setError(err.message || 'Failed to delete attendance');
            return false;
        }
    }, []);

    // Get attendance statistics for a student
    const getStudentStats = useCallback(async (
        studentId: string,
        startDate?: string,
        endDate?: string
    ): Promise<AttendanceStats | null> => {
        try {
            console.log('📊 Calculating student stats:', studentId);

            let query = supabase
                .from('student_attendance')
                .select('is_present')
                .eq('student_id', studentId);

            if (startDate) query = query.gte('date', startDate);
            if (endDate) query = query.lte('date', endDate);

            const { data, error: fetchError } = await query;

            if (fetchError) throw fetchError;

            const totalDays = data?.length || 0;
            const presentDays = data?.filter(r => r.is_present === true).length || 0;
            const absentDays = data?.filter(r => r.is_present === false).length || 0;
            const lateDays = 0; // Not supported in new schema
            const excusedDays = 0; // Not supported in new schema balance with absents etc if needed

            const attendancePercentage = totalDays > 0
                ? Math.round((presentDays / totalDays) * 100 * 10) / 10
                : 0;

            return {
                totalDays,
                presentDays,
                absentDays,
                lateDays,
                excusedDays,
                attendancePercentage,
            };
        } catch (err: any) {
            console.error('❌ Error calculating stats:', err);
            return null;
        }
    }, []);

    // Get class attendance statistics for a specific date
    const getClassStats = useCallback(async (
        classId: string,
        date: string
    ): Promise<ClassAttendanceStats | null> => {
        try {
            console.log('📊 Calculating class stats:', classId, date);

            // Get total students in class
            const { data: students } = await supabase
                .from('students')
                .select('id')
                .eq('class_id', classId)
                .eq('is_active', true);

            const totalStudents = students?.length || 0;

            // Get attendance for this class on this date
            const { data: attendance } = await supabase
                .from('student_attendance')
                .select('is_present')
                .eq('class_id', classId)
                .eq('date', date);

            const presentCount = attendance?.filter(r => r.is_present === true).length || 0;
            const absentCount = attendance?.filter(r => r.is_present === false).length || 0;
            const lateCount = 0;
            const excusedCount = 0;

            const attendancePercentage = totalStudents > 0
                ? Math.round((presentCount / totalStudents) * 100 * 10) / 10
                : 0;

            // Get class info
            const { data: classInfo } = await supabase
                .from('classes')
                .select('class_name, section')
                .eq('id', classId)
                .single();

            return {
                classId,
                className: classInfo?.class_name || '',
                section: classInfo?.section,
                totalStudents,
                presentCount,
                absentCount,
                lateCount,
                excusedCount,
                attendancePercentage,
                date,
            };
        } catch (err: any) {
            console.error('❌ Error calculating class stats:', err);
            return null;
        }
    }, []);

    // Get trend data for graphs
    const getTrendData = useCallback(async (
        filters?: AttendanceFilters
    ): Promise<AttendanceGraphData[]> => {
        try {
            console.log('📈 Fetching trend data...', filters);

            // Default to last 30 days if no date range specified
            const endDate = filters?.endDate || format(new Date(), 'yyyy-MM-dd');
            const startDate = filters?.startDate || format(sub(new Date(), { days: 30 }), 'yyyy-MM-dd');

            let query = supabase
                .from('student_attendance')
                .select('date, is_present')
                .gte('date', startDate)
                .lte('date', endDate);

            if (filters?.classId) {
                query = query.eq('class_id', filters.classId);
            }

            const { data, error: fetchError } = await query;

            if (fetchError) throw fetchError;

            // Group by date and calculate counts
            const groupedByDate = (data || []).reduce((acc: any, record: any) => {
                const date = record.date;
                if (!acc[date]) {
                    acc[date] = {
                        date,
                        presentCount: 0,
                        absentCount: 0,
                        lateCount: 0,
                        excusedCount: 0,
                        totalStudents: 0,
                    };
                }

                acc[date].totalStudents++;
                if (record.is_present === true) acc[date].presentCount++;
                if (record.is_present === false) acc[date].absentCount++;
                acc[date].lateCount = 0;
                acc[date].excusedCount = 0;

                return acc;
            }, {});

            // Convert to array and calculate percentages
            const trendData: AttendanceGraphData[] = Object.values(groupedByDate).map((day: any) => ({
                ...day,
                attendancePercentage: day.totalStudents > 0
                    ? Math.round((day.presentCount / day.totalStudents) * 100 * 10) / 10
                    : 0,
            }));

            // Sort by date
            trendData.sort((a, b) => a.date.localeCompare(b.date));

            console.log(`✅ Generated ${trendData.length} data points for trend`);
            return trendData;
        } catch (err: any) {
            console.error('❌ Error fetching trend data:', err);
            return [];
        }
    }, []);

    return {
        records,
        loading,
        error,
        fetchAttendance,
        markAttendance,
        bulkMarkAttendance,
        updateAttendance,
        deleteAttendance,
        getStudentStats,
        getClassStats,
        getTrendData,
    };
}
