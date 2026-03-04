import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { BackButton } from '../components/common';
import { TeacherProfileForm } from '../components/features/profiles/TeacherProfileForm';
import type { TeacherFormData, Gender } from '../types/profile.types';
// import { useProfileCreation } from '../hooks/useProfileCreation'; // Unused

export function EditTeacherProfilePage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // const { academicYears, classes, loadingYears, loadingClasses } = useProfileCreation(); // Unused
    // const listsLoading = loadingYears || loadingClasses; // Unused
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [initialData, setInitialData] = useState<Partial<TeacherFormData> | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (id) fetchTeacher(id);
    }, [id]);

    const fetchTeacher = async (teacherId: string) => {
        try {
            const { data, error } = await supabase
                .from('teachers')
                .select('*')
                .eq('id', teacherId)
                .single();

            if (error) throw error;

            setInitialData({
                full_name: data.full_name,
                gender: data.gender as Gender,
                date_of_birth: data.date_of_birth || '',
                subject: data.subjects?.[0] || '', // Assuming single subject input form for primary subject
                qualification: data.qualification || '',
                phone: data.phone || '',
                email: data.email || '',
                photo_url: data.photo_url || '',
                address: data.address || '',
                login_id: data.login_id || '',
                // password left empty
            });

        } catch (err: any) {
            console.error('Error fetching teacher:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (data: TeacherFormData) => {
        if (!id) return;
        setUpdating(true);
        setError(null);

        try {
            // Prepare update payload
            const updates: any = {
                full_name: data.full_name,
                gender: data.gender,
                date_of_birth: data.date_of_birth,
                subjects: [data.subject], // Transforming back to array
                qualification: data.qualification,
                phone: data.phone,
                email: data.email,
                photo_url: data.photo_url || null,
                address: data.address || null,
                login_id: data.login_id,
                updated_at: new Date().toISOString(),
            };

            if (data.password) {
                updates.password = data.password;
            }

            const { error: updateError } = await supabase
                .from('teachers')
                .update(updates)
                .eq('id', id);

            if (updateError) throw updateError;

            navigate(`/teachers/${id}`);

        } catch (err: any) {
            console.error('Error updating teacher:', err);
            setError(err.message);
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center">Loading teacher details...</div>;
    }

    if (error) {
        return (
            <div className="p-8 text-center">
                <div className="text-red-600 mb-4">Error: {error}</div>
                <button onClick={() => navigate(`/teachers/${id}`)} className="btn btn-secondary">
                    Back to Profile
                </button>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="mb-6 flex items-center gap-4">
                <BackButton to={`/teachers/${id}`} />
                <h1 className="text-2xl font-bold">Edit Teacher Profile</h1>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                {initialData && (
                    <TeacherProfileForm
                        onSubmit={handleUpdate}
                        loading={updating}
                        initialData={initialData}
                        isEditing={true}
                    />
                )}
            </div>
        </div>
    );
}
