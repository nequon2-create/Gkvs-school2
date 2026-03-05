// Custom hook for student profile management
import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type {
    StudentProfile,
    AcademicRecord,
    OverallAcademicStats,
    AttendanceSummary,
    UpdateStudentInput,
    MonthlyAttendance,
    SubjectPerformance
} from '../types/profile.types';
import {
    calculateOverallPercentage,
    getOverallGrade,
    getAttendanceStatus,
    calculateAttendancePercentage,
    groupBySubject,
    getRecentRecords,
    calculateSubjectAverage,
    getMonthName
} from '../utils/profileUtils';

export function useStudentProfile(_studentId?: string) {
    const [profile, setProfile] = useState<StudentProfile | null>(null);
    const [academicHistory, setAcademicHistory] = useState<AcademicRecord[]>([]);
    const [academicStats, setAcademicStats] = useState<OverallAcademicStats | null>(null);
    const [attendance, setAttendance] = useState<AttendanceSummary | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Fetch complete student profile with related data
     */
    const fetchProfile = useCallback(async (id: string) => {
        if (!id) {
            setError('Student ID is required');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Fetch student profile with class and academic year info
            const { data: studentData, error: studentError } = await supabase
                .from('students')
                .select(`
          *,
          classes:class_id (
            id,
            class_name,
            section
          ),
          academic_years:academic_year_id (
            id,
            year_name
          )
        `)
                .eq('id', id)
                .single();

            if (studentError) throw studentError;

            if (studentData) {
                const profileData: StudentProfile = {
                    ...studentData,
                    class_name: studentData.classes?.class_name,
                    section: studentData.classes?.section,
                    academic_year_name: studentData.academic_years?.year_name
                };
                setProfile(profileData);
            }

            // Fetch academic history (marks)
            await fetchAcademicHistory(id);

            // Fetch attendance
            await fetchAttendanceSummary(id);

        } catch (err) {
            console.error('Error fetching student profile:', err);
            setError(err instanceof Error ? err.message : 'Failed to load profile');
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Fetch academic history and calculate stats
     */
    const fetchAcademicHistory = useCallback(async (id: string) => {
        try {
            // Fetch all marks with exam details
            const { data: marksData, error: marksError } = await supabase
                .from('marks')
                .select(`
          *,
          exams:exam_id (
            id,
            exam_name,
            exam_type,
            exam_date
          )
        `)
                .eq('student_id', id)
                .order('created_at', { ascending: false });

            if (marksError) throw marksError;

            if (marksData) {
                // Map to AcademicRecord format
                const records: AcademicRecord[] = marksData.map(mark => ({
                    id: mark.id,
                    exam_id: mark.exam_id,
                    exam_name: mark.exams?.exam_name || 'Unknown Exam',
                    exam_type: mark.exams?.exam_type || 'Unknown',
                    exam_date: mark.exams?.exam_date || '',
                    subject: mark.subject,
                    marks_obtained: mark.marks_obtained,
                    max_marks: mark.max_marks,
                    percentage: mark.percentage,
                    grade: mark.grade,
                    remarks: mark.remarks
                }));

                setAcademicHistory(records);

                // Calculate academic stats
                if (records.length > 0) {
                    const stats = calculateAcademicStats(records);
                    setAcademicStats(stats);
                }
            }
        } catch (err) {
            console.error('Error fetching academic history:', err);
        }
    }, []);

    /**
     * Fetch attendance summary
     */
    const fetchAttendanceSummary = useCallback(async (id: string) => {
        try {
            const { data: attendanceData, error: attendanceError } = await supabase
                .from('attendance')
                .select('*')
                .eq('student_id', id)
                .order('date', { ascending: true });

            if (attendanceError) throw attendanceError;

            if (attendanceData && attendanceData.length > 0) {
                const summary = calculateAttendanceSummaryData(attendanceData);
                setAttendance(summary);
            } else {
                // No attendance records yet
                setAttendance({
                    total_days: 0,
                    present_days: 0,
                    absent_days: 0,
                    late_days: 0,
                    excused_days: 0,
                    attendance_percentage: 0,
                    status: 'poor',
                    monthly_breakdown: []
                });
            }
        } catch (err) {
            console.error('Error fetching attendance:', err);
        }
    }, []);

    /**
     * Calculate academic statistics from records
     */
    const calculateAcademicStats = (records: AcademicRecord[]): OverallAcademicStats => {
        const overallPercentage = calculateOverallPercentage(records);
        const overallGrade = getOverallGrade(overallPercentage);

        // Group by subject
        const subjectGroups = groupBySubject(records);

        // Calculate subject-wise performance
        const subjectPerformance: SubjectPerformance[] = Object.entries(subjectGroups).map(
            ([subject, subjectRecords]) => {
                const marks = subjectRecords.map(r => r.marks_obtained);

                // Count grades
                const gradeDistribution: Record<string, number> = {};
                subjectRecords.forEach(record => {
                    gradeDistribution[record.grade] = (gradeDistribution[record.grade] || 0) + 1;
                });

                return {
                    subject,
                    total_exams: subjectRecords.length,
                    average_percentage: calculateSubjectAverage(subjectRecords),
                    highest_marks: Math.max(...marks),
                    lowest_marks: Math.min(...marks),
                    grade_distribution: gradeDistribution
                };
            }
        );

        // Get recent exams
        const recentExams = getRecentRecords(records, 5);

        return {
            total_exams: records.length,
            total_subjects: Object.keys(subjectGroups).length,
            overall_percentage: overallPercentage,
            overall_grade: overallGrade,
            subject_performance: subjectPerformance,
            recent_exams: recentExams
        };
    };

    /**
     * Calculate attendance summary from raw attendance data
     */
    const calculateAttendanceSummaryData = (data: any[]): AttendanceSummary => {
        const total = data.length;
        const present = data.filter(d => d.status === 'present').length;
        const absent = data.filter(d => d.status === 'absent').length;
        const late = data.filter(d => d.status === 'late').length;
        const excused = data.filter(d => d.status === 'excused').length;

        const percentage = calculateAttendancePercentage(present + late, total);
        const status = getAttendanceStatus(percentage);

        // Group by month for monthly breakdown
        const monthlyMap = new Map<string, MonthlyAttendance>();

        data.forEach(record => {
            const date = new Date(record.date);
            const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;

            if (!monthlyMap.has(monthKey)) {
                monthlyMap.set(monthKey, {
                    month: getMonthName(date.getMonth() + 1, true),
                    year: date.getFullYear(),
                    present: 0,
                    absent: 0,
                    late: 0,
                    excused: 0,
                    total: 0,
                    percentage: 0
                });
            }

            const monthData = monthlyMap.get(monthKey)!;
            monthData.total++;

            if (record.status === 'present') monthData.present++;
            else if (record.status === 'absent') monthData.absent++;
            else if (record.status === 'late') monthData.late++;
            else if (record.status === 'excused') monthData.excused++;
        });

        // Calculate percentages for each month
        const monthlyBreakdown: MonthlyAttendance[] = Array.from(monthlyMap.values()).map(
            month => ({
                ...month,
                percentage: calculateAttendancePercentage(month.present + month.late, month.total)
            })
        );

        return {
            total_days: total,
            present_days: present,
            absent_days: absent,
            late_days: late,
            excused_days: excused,
            attendance_percentage: percentage,
            status,
            monthly_breakdown: monthlyBreakdown
        };
    };

    /**
     * Update student profile information
     */
    const updateProfile = useCallback(async (updates: UpdateStudentInput) => {
        if (!profile) {
            setError('No profile loaded');
            return { success: false, error: 'No profile loaded' };
        }

        try {
            setLoading(true);

            const { data, error: updateError } = await supabase
                .from('students')
                .update(updates)
                .eq('id', profile.id)
                .select()
                .single();

            if (updateError) throw updateError;

            if (data) {
                setProfile(prev => prev ? { ...prev, ...data } : null);
            }

            return { success: true };
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to update profile';
            setError(errorMsg);
            return { success: false, error: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [profile]);

    /**
     * Upload and update profile photo
     */
    const updatePhoto = useCallback(async (file: File) => {
        if (!profile) {
            return { success: false, error: 'No profile loaded' };
        }

        try {
            setLoading(true);

            // Upload to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${profile.id}-${Date.now()}.${fileExt}`;
            const filePath = `students/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('profiles')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('profiles')
                .getPublicUrl(filePath);

            const photoUrl = urlData.publicUrl;

            // Update student record
            const { error: updateError } = await supabase
                .from('students')
                .update({ photo_url: photoUrl })
                .eq('id', profile.id);

            if (updateError) throw updateError;

            setProfile(prev => prev ? { ...prev, photo_url: photoUrl } : null);

            return { success: true, url: photoUrl };
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to upload photo';
            return { success: false, error: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [profile]);

    /**
     * Refresh all profile data
     */
    const refreshData = useCallback(() => {
        if (profile?.id) {
            return fetchProfile(profile.id);
        }
    }, [profile, fetchProfile]);

    return {
        profile,
        academicHistory,
        academicStats,
        attendance,
        loading,
        error,
        fetchProfile,
        updateProfile,
        updatePhoto,
        refreshData
    };
}
