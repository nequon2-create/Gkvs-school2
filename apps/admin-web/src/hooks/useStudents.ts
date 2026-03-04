import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { StudentListItem, FilterOptions } from '../types/list.types';

interface UseStudentsReturn {
    students: StudentListItem[];
    loading: boolean;
    error: string | null;
    fetchStudents: () => Promise<void>;
    searchStudents: (query: string) => void;
    filterStudents: (filters: FilterOptions) => void;
    deleteStudent: (id: string) => Promise<boolean>;
    refreshStudents: () => Promise<void>;
}

export function useStudents(): UseStudentsReturn {
    const [students, setStudents] = useState<StudentListItem[]>([]);
    const [allStudents, setAllStudents] = useState<StudentListItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchStudents = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('📚 Fetching students from database...');

            let query = supabase
                .from('students')
                .select(`
                    *,
                    classes (
                        id,
                        class_name,
                        section
                    ),
                    academic_years (
                        id,
                        year_name
                    )
                `)
                .order('full_name', { ascending: true });

            const { data, error: fetchError } = await query;

            if (fetchError) {
                console.error('❌ Error fetching students:', fetchError);
                throw fetchError;
            }

            console.log(`✅ Fetched ${data?.length || 0} students`);
            setAllStudents(data || []);
            setStudents(data || []);
        } catch (err: any) {
            const errorMessage = err.message || 'Failed to fetch students';
            setError(errorMessage);
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const searchStudents = useCallback((query: string) => {
        if (!query.trim()) {
            setStudents(allStudents);
            return;
        }

        const searchLower = query.toLowerCase();
        const filtered = allStudents.filter(student =>
            student.full_name.toLowerCase().includes(searchLower) ||
            student.registration_number.toLowerCase().includes(searchLower) ||
            student.parent_name?.toLowerCase().includes(searchLower)
        );

        console.log(`🔍 Search results: ${filtered.length} students`);
        setStudents(filtered);
    }, [allStudents]);

    const filterStudents = useCallback(async (filters: FilterOptions) => {

        try {
            // Check if filtering by a specific academic year that might be historical
            if (filters.academicYearId && !filters.skipHistory) {
                const { data: yearData } = await supabase
                    .from('academic_years')
                    .select('is_current')
                    .eq('id', filters.academicYearId)
                    .single();

                if (yearData && !yearData.is_current) {
                    setLoading(true);

                    // Fetch historical data
                    const { data: historyData, error: historyError } = await supabase
                        .from('student_enrollment_history')
                        .select(`
                            status,
                            class_id,
                            academic_year_id,
                            students (*),
                            classes (id, class_name, section),
                            academic_years (id, year_name)
                        `)
                        .eq('academic_year_id', filters.academicYearId);

                    if (historyError) {
                        console.error('❌ Error fetching historical students:', historyError);
                        throw historyError;
                    }

                    // Map history format to match StudentListItem format
                    let historicalStudents = (historyData || []).map((h: any) => ({
                        ...h.students,
                        class_id: h.class_id,
                        academic_year_id: h.academic_year_id,
                        is_active: h.status === 'active' || h.status === 'completed',
                        classes: h.classes,
                        academic_years: h.academic_years
                    })) as StudentListItem[];

                    // Apply remaining local filters
                    if (filters.classId) {
                        historicalStudents = historicalStudents.filter(s => s.class_id === filters.classId);
                    }
                    if (filters.gender) {
                        historicalStudents = historicalStudents.filter(s => s.gender === filters.gender);
                    }
                    if (filters.isActive !== undefined) {
                        historicalStudents = historicalStudents.filter(s => s.is_active === filters.isActive);
                    }

                    console.log(`🎯 Historical Filter results: ${historicalStudents.length} students`);
                    setStudents(historicalStudents);
                    return;
                }
            }
        } catch (err) {
            console.error('Failed to filter historical students', err);
        } finally {
            setLoading(false);
        }

        // Normal local filtering for current active students
        let filtered = [...allStudents];

        if (filters.classId) {
            filtered = filtered.filter(s => s.class_id === filters.classId);
        }

        if (filters.academicYearId) {
            filtered = filtered.filter(s => s.academic_year_id === filters.academicYearId);
        }

        if (filters.gender) {
            filtered = filtered.filter(s => s.gender === filters.gender);
        }

        if (filters.isActive !== undefined) {
            filtered = filtered.filter(s => s.is_active === filters.isActive);
        }

        console.log(`🎯 Filter results: ${filtered.length} students`);
        setStudents(filtered);
    }, [allStudents]);

    const deleteStudent = useCallback(async (id: string): Promise<boolean> => {
        try {
            console.log(`🗑️ Deleting student: ${id}`);

            const { error: deleteError } = await supabase
                .from('students')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;

            console.log('✅ Student deleted successfully');
            await fetchStudents();
            return true;
        } catch (err: any) {
            console.error('❌ Error deleting student:', err);
            setError(err.message || 'Failed to delete student');
            return false;
        }
    }, [fetchStudents]);

    const refreshStudents = useCallback(async () => {
        await fetchStudents();
    }, [fetchStudents]);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    return {
        students,
        loading,
        error,
        fetchStudents,
        searchStudents,
        filterStudents,
        deleteStudent,
        refreshStudents,
    };
}
