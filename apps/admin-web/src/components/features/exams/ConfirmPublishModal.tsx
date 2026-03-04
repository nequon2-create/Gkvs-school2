import { useState } from 'react';
import './ConfirmPublishModal.css';

interface ConfirmPublishModalProps {
    examName: string;
    className: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmPublishModal({
    examName,
    className,
    onConfirm,
    onCancel,
}: ConfirmPublishModalProps) {
    const [confirming, setConfirming] = useState(false);

    const handleConfirm = async () => {
        setConfirming(true);
        await onConfirm();
        setConfirming(false);
    };

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">📢 Publish Exam?</h2>
                </div>

                <div className="modal-body">
                    <p className="publish-message">
                        You're about to publish:
                    </p>
                    <div className="exam-info">
                        <strong>"{examName}"</strong>
                        <span className="class-info">for {className}</span>
                    </div>

                    <div className="visibility-info">
                        <p className="info-title">This will make the exam visible to:</p>
                        <ul className="visibility-list">
                            <li>✓ Students in {className}</li>
                            <li>✓ Parents of students</li>
                        </ul>
                    </div>

                    <div className="future-note">
                        <span className="note-icon">💡</span>
                        <span className="note-text">
                            Future: Notifications will be sent automatically
                        </span>
                    </div>
                </div>

                <div className="modal-actions">
                    <button
                        className="btn-cancel"
                        onClick={onCancel}
                        disabled={confirming}
                    >
                        Cancel
                    </button>
                    <button
                        className="btn-confirm-publish"
                        onClick={handleConfirm}
                        disabled={confirming}
                    >
                        {confirming ? 'Publishing...' : 'Publish Exam'}
                    </button>
                </div>
            </div>
        </div>
    );
}
