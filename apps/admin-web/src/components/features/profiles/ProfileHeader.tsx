// Instagram-style Profile Header Component
import { useState, useRef } from 'react';
import { calculateAge, getGenderIcon, formatDate, getInitials, getProfileColor } from '../../../utils/profileUtils';
import type { StudentProfile, TeacherProfile } from '../../../types/profile.types';
import './ProfileStyles.css';

interface ProfileHeaderProps {
    profile: StudentProfile | TeacherProfile;
    type: 'student' | 'teacher';
    onEdit: () => void;
    onPhotoUpload: (file: File) => void;
    isEditable?: boolean;
}

export function ProfileHeader({ profile, type, onEdit, onPhotoUpload, isEditable = true }: ProfileHeaderProps) {
    const [isHoveringPhoto, setIsHoveringPhoto] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const age = calculateAge(profile.date_of_birth);
    const genderIcon = getGenderIcon(profile.gender);
    const initials = getInitials(profile.full_name);
    const profileColor = getProfileColor(profile.full_name);

    const handlePhotoClick = () => {
        if (isEditable && fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type and size
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                alert('File size must be less than 5MB');
                return;
            }
            onPhotoUpload(file);
        }
    };

    return (
        <div className="profile-header">
            <div className="profile-header-content">
                {/* Profile Photo */}
                <div
                    className="profile-photo-container"
                    onMouseEnter={() => setIsHoveringPhoto(true)}
                    onMouseLeave={() => setIsHoveringPhoto(false)}
                    onClick={handlePhotoClick}
                >
                    {profile.photo_url ? (
                        <img src={profile.photo_url} alt={profile.full_name} className="profile-photo" />
                    ) : (
                        <div className="profile-photo-placeholder" style={{ backgroundColor: profileColor }}>
                            <span className="profile-initials">{initials}</span>
                        </div>
                    )}
                    {isEditable && isHoveringPhoto && (
                        <div className="profile-photo-overlay">
                            <span className="photo-upload-icon">📷</span>
                            <span className="photo-upload-text">Change Photo</span>
                        </div>
                    )}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden-file-input"
                    />
                </div>

                {/* Profile Info */}
                <div className="profile-header-info">
                    <div className="profile-name-section">
                        <h1 className="profile-name">{profile.full_name}</h1>
                        <span className="profile-gender-icon">{genderIcon}</span>
                        {profile.is_active ? (
                            <span className="status-badge active">Active</span>
                        ) : (
                            <span className="status-badge inactive">Inactive</span>
                        )}
                    </div>

                    <p className="profile-registration">
                        <span className="reg-label">Registration No:</span>
                        <span className="reg-number">{profile.registration_number}</span>
                    </p>

                    {/* Quick Stats */}
                    <div className="profile-quick-stats">
                        <div className="stat-item">
                            <span className="stat-icon">🎂</span>
                            <span className="stat-value">{age} years</span>
                        </div>

                        {type === 'student' && (profile as StudentProfile).class_name && (
                            <div className="stat-item">
                                <span className="stat-icon">📚</span>
                                <span className="stat-value">
                                    {(profile as StudentProfile).class_name}
                                    {(profile as StudentProfile).section && ` - ${(profile as StudentProfile).section}`}
                                </span>
                            </div>
                        )}

                        {type === 'teacher' && (profile as TeacherProfile).joining_date && (
                            <div className="stat-item">
                                <span className="stat-icon">📅</span>
                                <span className="stat-value">
                                    Joined {formatDate((profile as TeacherProfile).joining_date, 'short')}
                                </span>
                            </div>
                        )}

                        {type === 'student' && (profile as StudentProfile).roll_number && (
                            <div className="stat-item">
                                <span className="stat-icon">🔢</span>
                                <span className="stat-value">Roll No: {(profile as StudentProfile).roll_number}</span>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    {isEditable && (
                        <div className="profile-actions">
                            <button className="btn-edit-profile" onClick={onEdit}>
                                ✏️ Edit Profile
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
