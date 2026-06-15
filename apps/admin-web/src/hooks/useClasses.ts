import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Class, CreateClassInput, UpdateClassInput } from '../types/class.types';

export function useClasses() {
    const [classes, setClasses] = useState<Class[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchClasses = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const { data, error: fetchError } = await supabase
                .from('classes')
                .select('*')
                .order('numeric_value', { ascending: true })
                .order('class_name', { ascending: true });

            if (fetchError) throw fetchError;

            setClasses(data || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch classes');
            console.error('Error fetching classes:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchClasses();
    }, [fetchClasses]);

    const createClass = async (input: CreateClassInput): Promise<{ success: boolean; error?: string }> => {
        try {
            const { error: insertError } = await supabase
                .from('classes')
                .insert([{
                    ...input,
                    numeric_value: parseInt(input.class_name.replace(/\D/g, '')) || 0,
                }]);

            if (insertError) throw insertError;

            await fetchClasses();
            return { success: true };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create class';
            console.error('Error creating class:', err);
            return { success: false, error: errorMessage };
        }
    };

    const updateClass = async (id: string, input: UpdateClassInput): Promise<{ success: boolean; error?: string }> => {
        try {
            const updatePayload = {
                ...input,
                ...(input.class_name ? { numeric_value: parseInt(input.class_name.replace(/\D/g, '')) || 0 } : {})
            };

            const { error: updateError } = await supabase
                .from('classes')
                .update(updatePayload)
                .eq('id', id);

            if (updateError) throw updateError;

            await fetchClasses();
            return { success: true };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update class';
            console.error('Error updating class:', err);
            return { success: false, error: errorMessage };
        }
    };

    const deleteClass = async (id: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const { error: deleteError } = await supabase
                .from('classes')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;

            await fetchClasses();
            return { success: true };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete class';
            console.error('Error deleting class:', err);
            return { success: false, error: errorMessage };
        }
    };

    const createMultipleClasses = async (classNames: string[], academicYearId: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const classInputs = classNames.map(name => ({
                class_name: name,
                numeric_value: parseInt(name.replace(/\D/g, '')) || 0,
                academic_year_id: academicYearId,
            }));

            const { error: insertError } = await supabase
                .from('classes')
                .insert(classInputs);

            if (insertError) throw insertError;

            await fetchClasses();
            return { success: true };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create classes';
            console.error('Error creating multiple classes:', err);
            return { success: false, error: errorMessage };
        }
    };

    return {
        classes,
        loading,
        error,
        createClass,
        updateClass,
        deleteClass,
        createMultipleClasses,
        refetch: fetchClasses,
    };
}
