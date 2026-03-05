import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { TeacherListItem, FilterOptions } from '../types/list.types';

interface UseTeachersReturn {
    teachers: TeacherListItem[];
    loading: boolean;
    error: string | null;
    fetchTeachers: () => Promise<void>;
    searchTeachers: (query: string) => void;
    filterTeachers: (filters: FilterOptions) => void;
    deleteTeacher: (id: string) => Promise<boolean>;
    refreshTeachers: () => Promise<void>;
}

export function useTeachers(): UseTeachersReturn {
    const [teachers, setTeachers] = useState<TeacherListItem[]>([]);
    const [allTeachers, setAllTeachers] = useState<TeacherListItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchTeachers = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('👨‍🏫 Fetching teachers from database...');

            const { data, error: fetchError } = await supabase
                .from('teachers')
                .select('*')
                .order('full_name', { ascending: true });

            if (fetchError) {
                console.error('❌ Error fetching teachers:', fetchError);
                throw fetchError;
            }

            console.log(`✅ Fetched ${data?.length || 0} teachers`);
            setAllTeachers(data || []);
            setTeachers(data || []);
        } catch (err: any) {
            const errorMessage = err.message || 'Failed to fetch teachers';
            setError(errorMessage);
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const searchTeachers = useCallback((query: string) => {
        if (!query.trim()) {
            setTeachers(allTeachers);
            return;
        }

        const searchLower = query.toLowerCase();
        const filtered = allTeachers.filter(teacher =>
            teacher.full_name.toLowerCase().includes(searchLower) ||
            teacher.registration_number.toLowerCase().includes(searchLower) ||
            teacher.email?.toLowerCase().includes(searchLower)
        );

        console.log(`🔍 Search results: ${filtered.length} teachers`);
        setTeachers(filtered);
    }, [allTeachers]);

    const filterTeachers = useCallback((filters: FilterOptions) => {
        let filtered = [...allTeachers];

        if (filters.subject) {
            filtered = filtered.filter(t =>
                t.subjects?.some(s => s.toLowerCase().includes(filters.subject!.toLowerCase()))
            );
        }

        if (filters.qualification) {
            filtered = filtered.filter(t =>
                t.qualification?.toLowerCase().includes(filters.qualification!.toLowerCase())
            );
        }

        if (filters.isActive !== undefined) {
            filtered = filtered.filter((t: any) => t.is_active === filters.isActive);
        }

        console.log(`🎯 Filter results: ${filtered.length} teachers`);
        setTeachers(filtered);
    }, [allTeachers]);

    const deleteTeacher = useCallback(async (id: string): Promise<boolean> => {
        try {
            console.log(`🗑️ Deleting teacher: ${id}`);

            const { error: deleteError } = await supabase
                .from('teachers')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;

            console.log('✅ Teacher deleted successfully');
            await fetchTeachers();
            return true;
        } catch (err: any) {
            console.error('❌ Error deleting teacher:', err);
            setError(err.message || 'Failed to delete teacher');
            return false;
        }
    }, [fetchTeachers]);

    const refreshTeachers = useCallback(async () => {
        await fetchTeachers();
    }, [fetchTeachers]);

    useEffect(() => {
        fetchTeachers();
    }, [fetchTeachers]);

    return {
        teachers,
        loading,
        error,
        fetchTeachers,
        searchTeachers,
        filterTeachers,
        deleteTeacher,
        refreshTeachers,
    };
}
