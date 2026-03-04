import type { ExamListItem } from '../../../types/exam.types';
import { getSubjectEmoji } from '../../../types/exam.types';
import { format } from 'date-fns';
import './ExamCard.css';

interface ExamCardProps {
    exam: ExamListItem;
    onEdit: (exam: ExamListItem) => void;
    onDelete: (examId: string) => void;
    onTogglePublish: (examId: string, currentStatus: boolean) => void;
}

export function ExamCard({ exam, onEdit, onDelete, onTogglePublish }: ExamCardProps) {
    const emoji = getSubjectEmoji(exam.subject);
    const className = exam.classes?.class_name || 'N/A';
    const section = exam.classes?.section || '';
    const yearName = exam.academic_years?.year_name || 'N/A';

    const formattedDate = format(new Date(exam.exam_date), 'MMM dd, yyyy');
    const formattedTime = exam.exam_time
        ? format(new Date(`2000-01-01T${exam.exam_time}`), 'hh:mm a')
        : null;

    const cardClass = `exam-card ${exam.is_published ? 'published' : 'draft'} ${exam.isUpcoming ? 'upcoming' : exam.isPast ? 'past' : ''
        }`;

    return (
        <div className={cardClass}>
            <div className="card-header">
                <div className="subject-emoji">{emoji}</div>
                <div className="subject-name">{exam.subject}</div>
            </div>

            <h3 className="exam-title">{exam.exam_name}</h3>

            {exam.description && (
                <p className="exam-description">{exam.description}</p>
            )}

            <div className="exam-meta">
                <div className="meta-row">
                    <span className="meta-label">Class:</span>
                    <span className="meta-value">
                        {className}{section && ` - ${section}`}
                    </span>
                </div>
                <div className="meta-row">
                    <span className="meta-label">Year:</span>
                    <span className="meta-value">{yearName}</span>
                </div>
            </div>

            <div className="exam-schedule">
                <div className="schedule-item">
                    <span className="schedule-icon">📅</span>
                    <span>{formattedDate}</span>
                </div>
                {formattedTime && (
                    <div className="schedule-item">
                        <span className="schedule-icon">⏰</span>
                        <span>{formattedTime}</span>
                    </div>
                )}
                {exam.duration_minutes && (
                    <div className="schedule-item">
                        <span className="schedule-icon">⏱️</span>
                        <span>{exam.duration_minutes} min</span>
                    </div>
                )}
                <div className="schedule-item">
                    <span className="schedule-icon">💯</span>
                    <span>{exam.total_marks} marks</span>
                </div>
            </div>

            {exam.isUpcoming && exam.daysUntilExam !== undefined && (
                <div className="days-until">
                    {exam.daysUntilExam === 0
                        ? 'Today'
                        : exam.daysUntilExam === 1
                            ? 'Tomorrow'
                            : `In ${exam.daysUntilExam} days`}
                </div>
            )}

            <div className="card-status">
                {exam.is_published ? (
                    <span className="status-badge published">
                        <span className="badge-dot">●</span> Published
                    </span>
                ) : (
                    <span className="status-badge draft">
                        <span className="badge-dot">●</span> Draft
                    </span>
                )}
            </div>

            <div className="card-actions">
                <button
                    className="action-btn edit-btn"
                    onClick={() => onEdit(exam)}
                    title="Edit exam"
                >
                    ✏️ Edit
                </button>
                <button
                    className={`action-btn publish-btn ${exam.is_published ? 'unpublish' : ''}`}
                    onClick={() => onTogglePublish(exam.id, exam.is_published)}
                    title={exam.is_published ? 'Unpublish exam' : 'Publish exam'}
                >
                    {exam.is_published ? '📝 Unpublish' : '📢 Publish'}
                </button>
                <button
                    className="action-btn delete-btn"
                    onClick={() => onDelete(exam.id)}
                    title="Delete exam"
                >
                    🗑️ Delete
                </button>
            </div>
        </div>
    );
}
