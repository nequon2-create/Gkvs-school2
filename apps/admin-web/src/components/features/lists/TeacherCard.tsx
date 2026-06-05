import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { TeacherListItem } from '../../../types/list.types';
import './TeacherCard.css';

interface TeacherCardProps {
    teacher: TeacherListItem;
    rating?: number;
    reviewsCount?: number;
    onView?: (teacher: TeacherListItem) => void;
    onEdit?: (teacher: TeacherListItem) => void;
    onDelete?: (teacher: TeacherListItem) => void;
}

export function TeacherCard({ teacher, rating, reviewsCount, onView, onEdit, onDelete }: TeacherCardProps) {
    const navigate = useNavigate();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleDeleteClick = () => {
        setShowDeleteConfirm(true);
    };

    const handleConfirmDelete = () => {
        onDelete?.(teacher);
        setShowDeleteConfirm(false);
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
        <div
            className="teacher-card"
            onClick={() => navigate(`/teachers/${teacher.id}`)}
            style={{ cursor: 'pointer' }}
        >
            <div className="teacher-card-header">
                <div className="teacher-avatar">
                    {teacher.photo_url ? (
                        <img src={teacher.photo_url} alt={teacher.full_name} />
                    ) : (
                        <div className="teacher-avatar-placeholder">
                            {getInitials(teacher.full_name)}
                        </div>
                    )}
                </div>
                <div className="teacher-info">
                    <h3 className="teacher-name">{teacher.full_name}</h3>
                    <div className="teacher-meta-row">
                        <span className="teacher-reg">{teacher.registration_number}</span>
                        {rating !== undefined && rating > 0 && (
                            <span className="teacher-card-rating">
                                <span className="star-icon">★</span>
                                <span className="rating-val">{rating.toFixed(1)}</span>
                                <span className="reviews-count">({reviewsCount})</span>
                            </span>
                        )}
                    </div>
                </div>
                {teacher.qualification && (
                    <div className="teacher-qualification">
                        <span className="qualification-badge">{teacher.qualification}</span>
                    </div>
                )}
            </div>

            <div className="teacher-card-body">
                {teacher.subjects && teacher.subjects.length > 0 && (
                    <div className="subject-tags">
                        {teacher.subjects.map((subject, index) => (
                            <span key={index} className="subject-tag">
                                {subject}
                            </span>
                        ))}
                    </div>
                )}

                <div className="teacher-detail">
                    <svg className="detail-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M14.6667 11.28V13.28C14.6675 13.4657 14.6294 13.6494 14.555 13.8195C14.4807 13.9897 14.3716 14.1424 14.2348 14.2679C14.0979 14.3934 13.9364 14.489 13.7605 14.5485C13.5847 14.6079 13.3983 14.6299 13.2133 14.6133C11.1619 14.3904 9.19137 13.6894 7.46 12.5667C5.84919 11.5431 4.48353 10.1775 3.46 8.56668C2.33334 6.82668 1.63244 4.84734 1.41333 2.78668C1.39667 2.60235 1.41854 2.41667 1.4777 2.24135C1.53687 2.06603 1.63195 1.90493 1.75674 1.76835C1.88154 1.63178 2.03335 1.52269 2.20276 1.44798C2.37217 1.37327 2.55523 1.33464 2.74 1.33501H4.74C5.06353 1.33169 5.37723 1.4488 5.62248 1.66403C5.86773 1.87926 6.02805 2.17834 6.07333 2.50001C6.15769 3.14336 6.31428 3.77503 6.54 4.38001C6.62974 4.62971 6.64908 4.89905 6.59591 5.15901C6.54274 5.41896 6.41928 5.65886 6.24 5.85334L5.39333 6.70001C6.34215 8.37571 7.7576 9.79119 9.43333 10.74L10.28 9.89334C10.4745 9.71406 10.7144 9.5906 10.9743 9.53743C11.2343 9.48426 11.5036 9.5036 11.7533 9.59334C12.3583 9.81907 12.99 9.97566 13.6333 10.06C13.9592 10.1057 14.2617 10.2694 14.4767 10.5192C14.6917 10.7691 14.8055 11.0879 14.8 11.4167V13.28H14.6667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>{teacher.phone}</span>
                </div>

                <div className="teacher-detail">
                    <svg className="detail-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M2.66667 2.66667H13.3333C14.0667 2.66667 14.6667 3.26667 14.6667 4V12C14.6667 12.7333 14.0667 13.3333 13.3333 13.3333H2.66667C1.93333 13.3333 1.33333 12.7333 1.33333 12V4C1.33333 3.26667 1.93333 2.66667 2.66667 2.66667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M14.6667 4L8 8.66667L1.33333 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="truncate">{teacher.email}</span>
                </div>
            </div>

            <div className="teacher-card-actions" onClick={(e) => e.stopPropagation()}>
                <button className="action-btn action-btn-view" onClick={() => onView?.(teacher)}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M0.666667 8S3.33333 2.66667 8 2.66667 15.3333 8 15.3333 8 12.6667 13.3333 8 13.3333 0.666667 8 0.666667 8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M8 10C9.10457 10 10 9.10457 10 8C10 6.89543 9.10457 6 8 6C6.89543 6 6 6.89543 6 8C6 9.10457 6.89543 10 8 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    View
                </button>
                <button className="action-btn action-btn-edit" onClick={() => onEdit?.(teacher)}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M11.3333 1.99999C11.5084 1.82494 11.7163 1.68605 11.9451 1.59129C12.1739 1.49653 12.4191 1.44775 12.6667 1.44775C12.9142 1.44775 13.1594 1.49653 13.3882 1.59129C13.617 1.68605 13.8249 1.82494 14 1.99999C14.1751 2.17504 14.3139 2.38289 14.4087 2.61168C14.5035 2.84047 14.5522 3.08569 14.5522 3.33332C14.5522 3.58095 14.5035 3.82618 14.4087 4.05497C14.3139 4.28376 14.1751 4.49161 14 4.66666L5 13.6667L1.33333 14.6667L2.33333 11L11.3333 1.99999Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Edit
                </button>
                <button className="action-btn action-btn-delete" onClick={handleDeleteClick}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M2 4H3.33333H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M12.6667 4V13.3333C12.6667 13.6869 12.5262 14.0261 12.2761 14.2761C12.0261 14.5262 11.6869 14.6667 11.3333 14.6667H4.66666C4.31304 14.6667 3.97389 14.5262 3.72385 14.2761C3.4738 14.0261 3.33333 13.6869 3.33333 13.3333V4M5.33333 4V2.66667C5.33333 2.31304 5.4738 1.97391 5.72385 1.72386C5.97389 1.47381 6.31304 1.33334 6.66666 1.33334H9.33333C9.68695 1.33334 10.0261 1.47381 10.2761 1.72386C10.5262 1.97391 10.6667 2.31304 10.6667 2.66667V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Delete
                </button>
            </div>

            {showDeleteConfirm && (
                <div className="delete-confirm-overlay" onClick={() => setShowDeleteConfirm(false)}>
                    <div className="delete-confirm-dialog" onClick={(e) => e.stopPropagation()}>
                        <h4>Delete Teacher?</h4>
                        <p>Are you sure you want to delete <strong>{teacher.full_name}</strong>? This action cannot be undone.</p>
                        <div className="delete-confirm-actions">
                            <button className="btn-cancel" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                            <button className="btn-confirm-delete" onClick={handleConfirmDelete}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
