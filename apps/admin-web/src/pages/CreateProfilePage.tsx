import { useState } from 'react';
import { DashboardLayout } from '../components/layouts';
import { BackButton } from '../components/common';
import {
    ProfileTypeToggle,
    StudentProfileForm,
    TeacherProfileForm,
} from '../components/features/profiles';
import { useProfileCreation } from '../hooks/useProfileCreation';
import type { ProfileType, StudentFormData, TeacherFormData } from '../types/profile.types';
import './CreateProfilePage.css';

export function CreateProfilePage() {
    const {
        academicYears,
        classes,
        loadingYears,
        loadingClasses,
        createStudent,
        createTeacher,
    } = useProfileCreation();

    const [activeType, setActiveType] = useState<ProfileType>('student');
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const handleStudentSubmit = async (data: StudentFormData) => {
        setSubmitting(true);
        setSuccess(false);

        try {
            const result = await createStudent(data);

            if (result.success) {
                setSuccess(true);
                setSuccessMessage(`✅ Student "${data.full_name}" created successfully!`);

                // Auto-hide success message after 5 seconds
                setTimeout(() => {
                    setSuccess(false);
                    setSuccessMessage('');
                }, 5000);
            } else {
                alert(result.error || 'Failed to create student profile');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleTeacherSubmit = async (data: TeacherFormData) => {
        setSubmitting(true);
        setSuccess(false);

        try {
            const result = await createTeacher(data);

            if (result.success) {
                setSuccess(true);
                setSuccessMessage(`✅ Teacher "${data.full_name}" created successfully!`);

                // Auto-hide success message after 5 seconds
                setTimeout(() => {
                    setSuccess(false);
                    setSuccessMessage('');
                }, 5000);
            } else {
                alert(result.error || 'Failed to create teacher profile');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="create-profile-page">
                {/* Header */}
                <header className="page-header animate-fade-in">
                    <div>
                        <BackButton to="/dashboard" />
                        <h1 className="page-title">Create Profile</h1>
                        <p className="page-subtitle">Add new student or teacher to the system</p>
                    </div>
                </header>

                {/* Success Message */}
                {success && (
                    <div className="success-banner animate-slide-in">
                        <svg
                            className="success-icon"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            width="20"
                            height="20"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                        <span>{successMessage}</span>
                    </div>
                )}

                {/* Profile Type Toggle */}
                <ProfileTypeToggle activeType={activeType} onTypeChange={setActiveType} />

                {/* Active Form */}
                <div className="form-container">
                    {activeType === 'student' ? (
                        <StudentProfileForm
                            onSubmit={handleStudentSubmit}
                            academicYears={academicYears}
                            classes={classes}
                            loading={submitting}
                            loadingYears={loadingYears}
                            loadingClasses={loadingClasses}
                        />
                    ) : (
                        <TeacherProfileForm
                            onSubmit={handleTeacherSubmit}
                            loading={submitting}
                        />
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
