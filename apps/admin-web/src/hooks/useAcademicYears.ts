import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { AcademicYear, CreateAcademicYearInput, UpdateAcademicYearInput } from '../types/academic-years.types';

interface UseAcademicYearsReturn {
    years: AcademicYear[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    createYear: (data: CreateAcademicYearInput) => Promise<{ success: boolean; error?: string }>;
    updateYear: (data: UpdateAcademicYearInput) => Promise<{ success: boolean; error?: string }>;
    deleteYear: (id: string) => Promise<{ success: boolean; error?: string }>;
    setCurrentYear: (id: string) => Promise<{ success: boolean; error?: string }>;
}

export function useAcademicYears(): UseAcademicYearsReturn {
    const [years, setYears] = useState<AcademicYear[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchYears = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const { data, error: fetchError } = await supabase
                .from('academic_years')
                .select('*')
                .order('start_date', { ascending: false });

            if (fetchError) throw fetchError;

            setYears(data || []);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch academic years';
            setError(errorMessage);
            console.error('Error fetching academic years:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchYears();
    }, [fetchYears]);

    const createYear = async (data: CreateAcademicYearInput) => {
        try {
            // If is_current is true, first unmark all other years
            if (data.is_current) {
                await supabase
                    .from('academic_years')
                    .update({ is_current: false })
                    .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all
            }

            const { error: insertError } = await supabase
                .from('academic_years')
                .insert([data]);

            if (insertError) throw insertError;

            await fetchYears();
            return { success: true };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create academic year';
            console.error('Error creating academic year:', err);
            return { success: false, error: errorMessage };
        }
    };

    const updateYear = async (data: UpdateAcademicYearInput) => {
        try {
            const { id, ...updateData } = data;

            // If is_current is being set to true, first unmark all other years
            if (updateData.is_current) {
                await supabase
                    .from('academic_years')
                    .update({ is_current: false })
                    .neq('id', id);
            }

            const { error: updateError } = await supabase
                .from('academic_years')
                .update(updateData)
                .eq('id', id);

            if (updateError) throw updateError;

            await fetchYears();
            return { success: true };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update academic year';
            console.error('Error updating academic year:', err);
            return { success: false, error: errorMessage };
        }
    };

    const deleteYear = async (id: string) => {
        try {
            const { error: deleteError } = await supabase
                .from('academic_years')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;

            await fetchYears();
            return { success: true };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete academic year';
            console.error('Error deleting academic year:', err);
            return { success: false, error: errorMessage };
        }
    };

    const setCurrentYear = async (id: string) => {
        try {
            // First, unmark all years as current
            await supabase
                .from('academic_years')
                .update({ is_current: false })
                .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all

            // Then mark the selected year as current
            const { error: updateError } = await supabase
                .from('academic_years')
                .update({ is_current: true })
                .eq('id', id);

            if (updateError) throw updateError;

            await fetchYears();
            return { success: true };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to set current year';
            console.error('Error setting current year:', err);
            return { success: false, error: errorMessage };
        }
    };

    return {
        years,
        loading,
        error,
        refetch: fetchYears,
        createYear,
        updateYear,
        deleteYear,
        setCurrentYear,
    };
}
