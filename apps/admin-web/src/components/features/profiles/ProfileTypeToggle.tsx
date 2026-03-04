import type { ProfileType } from '../../../types/profile.types';
import './ProfileTypeToggle.css';

export interface ProfileTypeToggleProps {
    activeType: ProfileType;
    onTypeChange: (type: ProfileType) => void;
}

export function ProfileTypeToggle({ activeType, onTypeChange }: ProfileTypeToggleProps) {
    return (
        <div className="profile-type-toggle">
            <button
                className={`toggle-btn ${activeType === 'student' ? 'active' : ''}`}
                onClick={() => onTypeChange('student')}
            >
                👨‍🎓 Student
            </button>
            <button
                className={`toggle-btn ${activeType === 'teacher' ? 'active' : ''}`}
                onClick={() => onTypeChange('teacher')}
            >
                👩‍🏫 Teacher
            </button>
        </div>
    );
}
