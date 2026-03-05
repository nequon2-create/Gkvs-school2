// Custom hook for teacher profile management
import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { TeacherProfile, UpdateTeacherInput } from '../types/profile.types';

interface ClassInfo {
    id: string;
    class_name: string;
    section: string;
    student_count: number;
}

export function useTeacherProfile(_teacherId?: string) {
    const [profile, setProfile] = useState<TeacherProfile | null>(null);
    const [classes] = useState<ClassInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Fetch complete teacher profile
     */
    const fetchProfile = useCallback(async (id: string) => {
        if (!id) {
            setError('Teacher ID is required');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Fetch teacher profile
            const { data: teacherData, error: teacherError } = await supabase
                .from('teachers')
                .select('*')
                .eq('id', id)
                .single();

            if (teacherError) throw teacherError;

            if (teacherData) {
                setProfile(teacherData as TeacherProfile);
            }

            // Fetch classes taught by this teacher (if class_teacher field exists)
            // For now, we'll skip this as the schema may not have this relationship
            // await fetchClasses(id);

        } catch (err) {
            console.error('Error fetching teacher profile:', err);
            setError(err instanceof Error ? err.message : 'Failed to load profile');
        } finally {
            setLoading(false);
        }
    }, []);



    /**
     * Update teacher profile information
     */
    const updateProfile = useCallback(async (updates: UpdateTeacherInput) => {
        if (!profile) {
            setError('No profile loaded');
            return { success: false, error: 'No profile loaded' };
        }

        try {
            setLoading(true);

            const { data, error: updateError } = await supabase
                .from('teachers')
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
            const filePath = `teachers/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('profiles')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('profiles')
                .getPublicUrl(filePath);

            const photoUrl = urlData.publicUrl;

            // Update teacher record
            const { error: updateError } = await supabase
                .from('teachers')
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
        classes,
        loading,
        error,
        fetchProfile,
        updateProfile,
        updatePhoto,
        refreshData
    };
}
