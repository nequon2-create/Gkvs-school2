import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { BackButton } from '../components/common';
import { StudentProfileForm } from '../components/features/profiles/StudentProfileForm';
import { useProfileCreation } from '../hooks/useProfileCreation';
import type { StudentFormData, Gender } from '../types/profile.types';

export function EditStudentProfilePage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { academicYears, classes, loadingYears, loadingClasses } = useProfileCreation();
    const listsLoading = loadingYears || loadingClasses;

    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [initialData, setInitialData] = useState<Partial<StudentFormData> | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (id) fetchStudent(id);
    }, [id]);

    const fetchStudent = async (studentId: string) => {
        try {
            const { data, error } = await supabase
                .from('students')
                .select('*')
                .eq('id', studentId)
                .single();

            if (error) throw error;

            // Map DB data to Form Data
            // Note: DB typically uses snake_case, FormData uses snake_case, so mapping should be direct for most fields.
            // Check for missing fields or type mismatches.

            setInitialData({
                full_name: data.full_name,
                gender: data.gender as Gender,
                date_of_birth: data.date_of_birth || '',
                parent_name: data.parent_name || '',
                parent_phone: data.parent_phone || '',
                parent_email: data.parent_email || '',
                academic_year_id: data.academic_year_id,
                class_id: data.class_id,
                photo_url: data.photo_url || '',
                address: data.address || '',
                login_id: data.login_id || '',
                // password is purposefully left empty
                aadhar_number: data.aadhar_number || '',
                is_first_admission: data.is_first_admission ?? false,
                past_school_name: data.past_school_name || '',
                past_class: data.past_class || '',
            });

        } catch (err: any) {
            console.error('Error fetching student:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (data: StudentFormData) => {
        if (!id) return;
        setUpdating(true);
        setError(null);

        try {
            // Prepare update payload
            const updates: any = {
                full_name: data.full_name,
                gender: data.gender,
                date_of_birth: data.date_of_birth,
                parent_name: data.parent_name,
                parent_phone: data.parent_phone,
                parent_email: data.parent_email || null,
                academic_year_id: data.academic_year_id,
                class_id: data.class_id,
                photo_url: data.photo_url || null,
                address: data.address || null,
                login_id: data.login_id,
                aadhar_number: data.aadhar_number,
                is_first_admission: data.is_first_admission,
                past_school_name: data.past_school_name || null,
                past_class: data.past_class || null,
                updated_at: new Date().toISOString(),
            };

            // Only update password if provided
            if (data.password) {
                updates.password = data.password;
            }

            const { error: updateError } = await supabase
                .from('students')
                .update(updates)
                .eq('id', id);

            if (updateError) throw updateError;

            // Redirect back to profile
            navigate(`/students/${id}`);

        } catch (err: any) {
            console.error('Error updating student:', err);
            setError(err.message);
        } finally {
            setUpdating(false);
        }
    };

    if (loading || listsLoading) {
        return <div className="p-8 text-center">Loading student details...</div>;
    }

    if (error) {
        return (
            <div className="p-8 text-center">
                <div className="text-red-600 mb-4">Error: {error}</div>
                <button onClick={() => navigate(`/students/${id}`)} className="btn btn-secondary">
                    Back to Profile
                </button>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="mb-6 flex items-center gap-4">
                <BackButton to={`/students/${id}`} />
                <h1 className="text-2xl font-bold">Edit Student Profile</h1>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                {initialData && (
                    <StudentProfileForm
                        onSubmit={handleUpdate}
                        academicYears={academicYears}
                        classes={classes}
                        loading={updating}
                        initialData={initialData}
                        isEditing={true}
                    />
                )}
            </div>
        </div>
    );
}
