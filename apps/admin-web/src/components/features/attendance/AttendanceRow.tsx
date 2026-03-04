import { useState } from 'react';
import type { StudentListItem } from '../../../types/list.types';
import type { AttendanceStatus } from '../../../types/attendance.types';
import './AttendanceRow.css';

interface AttendanceRowProps {
    student: StudentListItem;
    currentStatus?: AttendanceStatus;
    currentRemarks?: string;
    onUpdate: (status: AttendanceStatus, remarks?: string) => void;
}

export function AttendanceRow({ student, currentStatus, currentRemarks, onUpdate }: AttendanceRowProps) {
    const [showRemarks, setShowRemarks] = useState(!!currentRemarks);
    const [remarks, setRemarks] = useState(currentRemarks || '');

    const handleStatusChange = (status: AttendanceStatus) => {
        onUpdate(status, remarks || undefined);
    };

    const handleRemarksChange = (value: string) => {
        setRemarks(value);
        onUpdate(currentStatus || 'present', value || undefined);
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className={`attendance-row ${currentStatus ? 'marked' : ''}`}>
            <div className="student-info-section">
                <div className="student-avatar">
                    {student.photo_url ? (
                        <img src={student.photo_url} alt={student.full_name} />
                    ) : (
                        <div className="avatar-placeholder">
                            {getInitials(student.full_name)}
                        </div>
                    )}
                </div>
                <div className="student-details">
                    <h4 className="student-name">{student.full_name}</h4>
                    <p className="student-reg">{student.registration_number}</p>
                </div>
            </div>

            <div className="status-buttons">
                <button
                    className={`status-btn present-btn ${currentStatus === 'present' ? 'active' : ''}`}
                    onClick={() => handleStatusChange('present')}
                    type="button"
                >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M13.3333 4L6 11.3333L2.66667 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Present
                </button>
                <button
                    className={`status-btn absent-btn ${currentStatus === 'absent' ? 'active' : ''}`}
                    onClick={() => handleStatusChange('absent')}
                    type="button"
                >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    Absent
                </button>
                <button
                    className={`status-btn late-btn ${currentStatus === 'late' ? 'active' : ''}`}
                    onClick={() => handleStatusChange('late')}
                    type="button"
                >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M8 14.6667C11.6819 14.6667 14.6667 11.6819 14.6667 8C14.6667 4.3181 11.6819 1.33333 8 1.33333C4.3181 1.33333 1.33333 4.3181 1.33333 8C1.33333 11.6819 4.3181 14.6667 8 14.6667Z" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M8 4V8L10.6667 9.33333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    Late
                </button>
                <button
                    className={`status-btn excused-btn ${currentStatus === 'excused' ? 'active' : ''}`}
                    onClick={() => handleStatusChange('excused')}
                    type="button"
                >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M14 10.6667V5.33333C14 4.97971 13.8595 4.64057 13.6095 4.39052C13.3594 4.14048 13.0203 4 12.6667 4H3.33333C2.97971 4 2.64057 4.14048 2.39052 4.39052C2.14048 4.64057 2 4.97971 2 5.33333V10.6667C2 11.0203 2.14048 11.3594 2.39052 11.6095C2.64057 11.8595 2.97971 12 3.33333 12H12.6667C13.0203 12 13.3594 11.8595 13.6095 11.6095C13.8595 11.3594 14 11.0203 14 10.6667Z" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M14 5.33333L8 8.66667L2 5.33333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Excused
                </button>
            </div>

            <div className="remarks-section">
                {!showRemarks ? (
                    <button
                        className="add-remarks-btn"
                        onClick={() => setShowRemarks(true)}
                        type="button"
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M8 3.33333V12.6667M3.33333 8H12.6667" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        Add remarks
                    </button>
                ) : (
                    <div className="remarks-input-wrapper">
                        <input
                            type="text"
                            className="remarks-input"
                            placeholder="Optional remarks..."
                            value={remarks}
                            onChange={(e) => handleRemarksChange(e.target.value)}
                        />
                        <button
                            className="close-remarks-btn"
                            onClick={() => {
                                setShowRemarks(false);
                                setRemarks('');
                                handleRemarksChange('');
                            }}
                            type="button"
                        >
                            ✕
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
