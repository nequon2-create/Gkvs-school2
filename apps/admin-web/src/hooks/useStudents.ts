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
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState<FilterOptions>({});

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
        } catch (err: any) {
            const errorMessage = err.message || 'Failed to fetch students';
            setError(errorMessage);
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const searchStudents = useCallback((query: string) => {
        setSearchQuery(query);
    }, []);

    const filterStudents = useCallback((filters: FilterOptions) => {
        setFilters(filters);
    }, []);

    useEffect(() => {
        let isCancelled = false;

        const applyFiltersAndSearch = async () => {
            // 1. If filtering by a historical academic year, fetch from history
            if (filters.academicYearId && !filters.skipHistory) {
                try {
                    const { data: yearData } = await supabase
                        .from('academic_years')
                        .select('is_current')
                        .eq('id', filters.academicYearId)
                        .single();

                    if (yearData && !yearData.is_current) {
                        setLoading(true);
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

                        if (historyError) throw historyError;

                        if (isCancelled) return;

                        let historicalStudents = (historyData || []).map((h: any) => ({
                            ...h.students,
                            class_id: h.class_id,
                            academic_year_id: h.academic_year_id,
                            is_active: h.status === 'active' || h.status === 'completed',
                            classes: h.classes,
                            academic_years: h.academic_years
                        })) as StudentListItem[];

                        // Apply remaining filters locally on historical data
                        if (filters.classId) {
                            historicalStudents = historicalStudents.filter(s => s.class_id === filters.classId);
                        }
                        if (filters.gender) {
                            historicalStudents = historicalStudents.filter(s => s.gender === filters.gender);
                        }
                        if (filters.isActive !== undefined) {
                            historicalStudents = historicalStudents.filter(s => s.is_active === filters.isActive);
                        }

                        // Apply search query locally
                        if (searchQuery.trim()) {
                            const searchLower = searchQuery.toLowerCase();
                            historicalStudents = historicalStudents.filter(student =>
                                student.full_name.toLowerCase().includes(searchLower) ||
                                student.registration_number.toLowerCase().includes(searchLower) ||
                                student.parent_name?.toLowerCase().includes(searchLower)
                            );
                        }

                        setStudents(historicalStudents);
                        setLoading(false);
                        return;
                    }
                } catch (err) {
                    console.error('Failed to filter historical students', err);
                    setLoading(false);
                }
            }

            // 2. Normal local filtering for current active students
            let result = [...allStudents];

            if (filters.classId) {
                result = result.filter(s => s.class_id === filters.classId);
            }
            if (filters.academicYearId) {
                result = result.filter(s => s.academic_year_id === filters.academicYearId);
            }
            if (filters.gender) {
                result = result.filter(s => s.gender === filters.gender);
            }
            if (filters.isActive !== undefined) {
                result = result.filter(s => s.is_active === filters.isActive);
            }

            // Apply search query locally
            if (searchQuery.trim()) {
                const searchLower = searchQuery.toLowerCase();
                result = result.filter(student =>
                    student.full_name.toLowerCase().includes(searchLower) ||
                    student.registration_number.toLowerCase().includes(searchLower) ||
                    student.parent_name?.toLowerCase().includes(searchLower)
                );
            }

            if (!isCancelled) {
                setStudents(result);
            }
        };

        applyFiltersAndSearch();

        return () => {
            isCancelled = true;
        };
    }, [allStudents, filters, searchQuery]);

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
