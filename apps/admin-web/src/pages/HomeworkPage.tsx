import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BookOpen, Plus, Trash2, Calendar as CalendarIcon, X, Lock } from 'lucide-react';
import './HomeworkPage.css';

interface ClassData {
    id: string;
    class_name: string;
    section: string | null;
}

interface Subject {
    id: string;
    subject_name: string;
}

interface Homework {
    id: string;
    title: string;
    description: string;
    due_date: string;
    created_at: string;
    teachers?: {
        full_name: string;
    };
    subject_id: string;
    subjects?: { subject_name: string };
    classes: ClassData;
}

export function HomeworkPage() {
    const [homework, setHomework] = useState<Homework[]>([]);
    const [classes, setClasses] = useState<ClassData[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [selectedClassId, setSelectedClassId] = useState('');
    const [subjectId, setSubjectId] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [attachmentFile, setAttachmentFile] = useState<File | null>(null);

    const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);

    useEffect(() => {
        fetchData();
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setDueDate(tomorrow.toISOString().split('T')[0]);
    }, []);

    useEffect(() => {
        if (selectedClassId) {
            fetchSubjects(selectedClassId);
        } else {
            setSubjects([]);
            setSubjectId('');
        }
    }, [selectedClassId]);

    const fetchSubjects = async (classId: string) => {
        const { data } = await supabase
            .from('subjects')
            .select('id, subject_name, class_id')
            .or(`class_id.eq.${classId},class_id.is.null`)
            .order('subject_name');
        
        if (data) {
            const sorted = [...data].sort((a: any, b: any) => {
                if (a.class_id && !b.class_id) return -1;
                if (!a.class_id && b.class_id) return 1;
                return 0;
            });
            const unique: Subject[] = [];
            const seen = new Set();
            for (const item of sorted) {
                const nameKey = item.subject_name.trim().toLowerCase();
                if (!seen.has(nameKey)) {
                    seen.add(nameKey);
                    unique.push(item);
                }
            }
            setSubjects(unique);
        }
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const { data: classData } = await supabase.from('classes').select('*').eq('is_active', true).order('numeric_value', { ascending: true });
            setClasses(classData || []);

            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            const { data: hwData, error } = await supabase.from('homework').select('*, classes(id, class_name, section), teachers(full_name), subjects(subject_name)').gt('created_at', twentyFourHoursAgo).order('created_at', { ascending: false });

            if (error) throw error;
            setHomework((hwData as any) || []);
        } catch (error) {
            console.error('Error fetching homework:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddHomework = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            let attachments: string[] = [];

            if (attachmentFile) {
                const ext = attachmentFile.name.split('.').pop() || 'jpg';
                const fileName = `hw_admin_${Date.now()}.${ext}`;
                const filePath = `admin/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('teacher-gallery')
                    .upload(filePath, attachmentFile);

                if (uploadError) throw new Error('Failed to upload image: ' + uploadError.message);

                const { data: { publicUrl } } = supabase.storage
                    .from('teacher-gallery')
                    .getPublicUrl(filePath);

                attachments.push(publicUrl);
            }

            const { error } = await supabase.from('homework').insert({
                class_id: selectedClassId,
                subject_id: subjectId || null,
                title: title.trim(),
                description: description.trim(),
                due_date: dueDate || null,
                attachments: attachments,
            });
            if (error) throw error;

            setIsAddModalOpen(false);
            setSelectedClassId('');
            setSubjectId('');
            setTitle('');
            setDescription('');
            setAttachmentFile(null);
            fetchData();
        } catch (error: any) {
            console.error('Error adding homework:', error);
            alert(error.message || 'Failed to publish homework');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this homework?')) return;
        try {
            const { error } = await supabase.from('homework').delete().eq('id', id);
            if (error) throw error;
            setHomework(prev => prev.filter(hw => hw.id !== id));
            if (selectedHomework?.id === id) setSelectedHomework(null);
        } catch (error) {
            console.error('Error deleting homework:', error);
        }
    };

    if (loading) {
        return (
            <div className="loader-container">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="hw-page">
            {/* Header */}
            <div className="hw-header">
                <h1 className="hw-title">
                    Homework <span className="hw-count">({homework.length})</span>
                </h1>

                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="hw-create-btn"
                >
                    <Plus size={16} />
                    Create Homework
                </button>
            </div>

            {/* Cards Grid */}
            <div className="hw-grid">
                {homework.length === 0 ? (
                    <div className="hw-empty">
                        No active homework available.
                    </div>
                ) : (
                    homework.map((hw) => (
                        <div
                            key={hw.id}
                            onClick={() => setSelectedHomework(hw)}
                            className="hw-card"
                        >
                            <div className="hw-card-inner">
                                <div className="hw-card-top">
                                    <div className="hw-card-badge">
                                        <BookOpen size={16} className="hw-card-icon" />
                                        <span className="hw-card-subject">
                                            {(hw as any).subjects?.subject_name || 'General'}
                                        </span>
                                    </div>
                                    <button
                                        onClick={(e) => handleDelete(hw.id, e)}
                                        className="hw-card-modify"
                                        title="Delete Homework"
                                    >
                                        <Trash2 size={12} />
                                        Modify
                                    </button>
                                </div>

                                <h3 className="hw-card-title" title={hw.title}>
                                    {hw.title}
                                </h3>

                                <p className="hw-card-desc">
                                    Class {hw.classes?.class_name} {hw.classes?.section || ''}
                                    {hw.description ? ` • ${hw.description}` : ''}
                                </p>

                                <div className="hw-card-footer">
                                    <Lock size={12} className="hw-card-footer-icon" />
                                    <div className="hw-card-footer-text">
                                        Assigned By {hw.teachers?.full_name || 'Admin'}
                                        <span className="hw-card-divider">|</span>
                                        Due {hw.due_date ? new Date(hw.due_date).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'N/A'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Full Details Modal */}
            {selectedHomework && (
                <div className="modal-overlay" onClick={() => setSelectedHomework(null)}>
                    <div
                        className="modal-content"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="modal-header">
                            <h2 className="modal-title">
                                <BookOpen size={18} className="modal-title-icon" />
                                {selectedHomework.title}
                            </h2>
                            <button onClick={() => setSelectedHomework(null)} className="modal-close">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="tag-row">
                                <div className="tag-class">
                                    Class {selectedHomework.classes?.class_name} {selectedHomework.classes?.section || ''}
                                </div>
                                {(selectedHomework as any).subjects?.subject_name && (
                                    <div className="tag-subject">
                                        {(selectedHomework as any).subjects.subject_name}
                                    </div>
                                )}
                            </div>

                            <div className="info-grid">
                                <div className="info-box">
                                    <span className="info-label">Due Date</span>
                                    <span className="info-value">
                                        <CalendarIcon size={16} className="info-icon" />
                                        {selectedHomework.due_date ? new Date(selectedHomework.due_date).toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Not specified'}
                                    </span>
                                </div>
                                <div className="info-box">
                                    <span className="info-label">Assigned By</span>
                                    <span className="info-value">
                                        <Lock size={16} className="info-icon" />
                                        {selectedHomework.teachers?.full_name || 'Admin'}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <h4 className="instructions-header">Instructions</h4>
                                <div className="instructions-text">
                                    {selectedHomework.description || <span className="instructions-empty">No additional details provided.</span>}
                                </div>
                                {(selectedHomework as any).attachments && (selectedHomework as any).attachments.length > 0 && (
                                    <div style={{ marginTop: '16px' }}>
                                        <h4 className="instructions-header" style={{ marginBottom: '8px' }}>Attached Photo</h4>
                                        <img src={(selectedHomework as any).attachments[0]} alt="Homework Attachment" style={{ width: '100%', maxHeight: '300px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #E2E8F0', marginTop: '4px' }} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Homework Modal */}
            {isAddModalOpen && (
                <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
                    <div className="modal-content create-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title" style={{ color: '#1E293B' }}>Create Homework</h2>
                            <button onClick={() => setIsAddModalOpen(false)} className="modal-close">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleAddHomework} className="form-body">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">Class Target <span className="form-required">*</span></label>
                                    <select
                                        required
                                        value={selectedClassId}
                                        onChange={(e) => setSelectedClassId(e.target.value)}
                                        className="form-control"
                                    >
                                        <option value="">Select a class...</option>
                                        {classes.map(cls => (
                                            <option key={cls.id} value={cls.id}>
                                                {cls.class_name} {cls.section || ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Subject</label>
                                    <select
                                        value={subjectId}
                                        onChange={(e) => setSubjectId(e.target.value)}
                                        className="form-control"
                                    >
                                        <option value="">Select a subject...</option>
                                        {subjects.map(s => (
                                            <option key={s.id} value={s.id}>{s.subject_name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Homework Title <span className="form-required">*</span></label>
                                <input
                                    required
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Chapter 4 Exercises 1-15"
                                    className="form-control"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Details & Instructions</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Provide assignment details, reading chapters, or specific instructions..."
                                    rows={4}
                                    className="form-control"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Attach Photo (Optional)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)}
                                    className="form-control"
                                    style={{ padding: '10px' }}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Due Date <span className="form-required">*</span></label>
                                <input
                                    required
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="form-control"
                                />
                            </div>

                            <div className="form-actions">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="btn-cancel"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="btn-submit"
                                >
                                    {submitting ? 'Publishing...' : 'Publish'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
