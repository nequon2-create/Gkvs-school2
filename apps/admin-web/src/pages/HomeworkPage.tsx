import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { BookOpen, Plus, Trash2, Calendar as CalendarIcon, X, Lock, UploadCloud, Clock, Sparkles } from 'lucide-react';
import { AppleDatePicker } from '../components/common/AppleDatePicker';
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
    attachments?: string[];
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
    const [dueDatePreset, setDueDatePreset] = useState<'tomorrow' | 'in2days' | 'in3days' | 'custom'>('tomorrow');
    const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);

    // Calculate preset date
    const setPreset = (preset: 'tomorrow' | 'in2days' | 'in3days' | 'custom') => {
        setDueDatePreset(preset);
        const now = new Date();
        if (preset === 'tomorrow') {
            now.setDate(now.getDate() + 1);
            setDueDate(now.toISOString().split('T')[0]);
        } else if (preset === 'in2days') {
            now.setDate(now.getDate() + 2);
            setDueDate(now.toISOString().split('T')[0]);
        } else if (preset === 'in3days') {
            now.setDate(now.getDate() + 3);
            setDueDate(now.toISOString().split('T')[0]);
        }
    };

    useEffect(() => {
        fetchData();
        setPreset('tomorrow');
    }, []);

    useEffect(() => {
        if (selectedClassId) {
            fetchSubjects(selectedClassId);
        } else {
            setSubjects([]);
            setSubjectId('');
        }
    }, [selectedClassId]);

    // Handle file selection
    const handleFileSelect = (file: File) => {
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) {
            alert('File size exceeds 10MB limit.');
            return;
        }
        setAttachmentFile(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
    };

    const handleRemoveFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        setAttachmentFile(null);
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

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
            const { data: classData } = await supabase
                .from('classes')
                .select('*')
                .eq('is_active', true)
                .order('numeric_value', { ascending: true });
            setClasses(classData || []);

            // 48-Hour Auto Cleanup Rule:
            // 1. Delete all homework created older than 48 hours in the database
            const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
            await supabase
                .from('homework')
                .delete()
                .lt('created_at', fortyEightHoursAgo);

            // 2. Fetch active homework created within the last 48 hours
            const { data: hwData, error } = await supabase
                .from('homework')
                .select('*, classes(id, class_name, section), teachers(full_name), subjects(subject_name)')
                .gte('created_at', fortyEightHoursAgo)
                .order('created_at', { ascending: false });

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

                if (uploadError) {
                    // Fallback to student-gallery if teacher-gallery is restricted
                    const { error: fbErr } = await supabase.storage
                        .from('student-gallery')
                        .upload(filePath, attachmentFile);
                    if (fbErr) throw new Error('Failed to upload image: ' + uploadError.message);
                    const { data: { publicUrl } } = supabase.storage
                        .from('student-gallery')
                        .getPublicUrl(filePath);
                    attachments.push(publicUrl);
                } else {
                    const { data: { publicUrl } } = supabase.storage
                        .from('teacher-gallery')
                        .getPublicUrl(filePath);
                    attachments.push(publicUrl);
                }
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
            setPreviewUrl(null);
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
            setHomework((prev) => prev.filter((hw) => hw.id !== id));
            if (selectedHomework?.id === id) setSelectedHomework(null);
        } catch (error) {
            console.error('Error deleting homework:', error);
        }
    };

    const getRemainingHoursBadge = (createdAt: string) => {
        const createdTime = new Date(createdAt).getTime();
        const expiryTime = createdTime + 48 * 60 * 60 * 1000;
        const diffMs = expiryTime - Date.now();
        if (diffMs <= 0) return { text: 'Expiring soon', urgent: true };
        const hours = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60)));
        return { text: `${hours}h left`, urgent: hours < 12 };
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
                <div>
                    <h1 className="hw-title">
                        Homework <span className="hw-count">({homework.length} active)</span>
                    </h1>
                    <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#86868B' }}>
                        Assignments auto-expire and clear from the database after 48 hours.
                    </p>
                </div>

                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="hw-create-btn"
                >
                    <Plus size={16} />
                    <span>Create Homework</span>
                </button>
            </div>

            {/* Cards Grid */}
            <div className="hw-grid">
                {homework.length === 0 ? (
                    <div className="hw-empty">
                        <div style={{ fontSize: '48px', marginBottom: '12px' }}>📚</div>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1D1D1F', margin: '0 0 6px 0' }}>
                            No Active Homework
                        </h3>
                        <p style={{ margin: 0, fontSize: '14px', color: '#86868B' }}>
                            Homework assignments created in the last 48 hours will appear here.
                        </p>
                    </div>
                ) : (
                    homework.map((hw) => {
                        const remaining = getRemainingHoursBadge(hw.created_at);
                        return (
                            <div
                                key={hw.id}
                                onClick={() => setSelectedHomework(hw)}
                                className="hw-card"
                            >
                                <div className="hw-card-inner">
                                    <div className="hw-card-top">
                                        <div className="hw-card-badge">
                                            <BookOpen size={15} className="hw-card-icon" />
                                            <span className="hw-card-subject">
                                                {(hw as any).subjects?.subject_name || 'General'}
                                            </span>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span
                                                className={`hw-timer-badge ${remaining.urgent ? 'urgent' : ''}`}
                                                title="Auto-removes from database after 48 hours"
                                            >
                                                <Clock size={11} />
                                                {remaining.text}
                                            </span>

                                            <button
                                                onClick={(e) => handleDelete(hw.id, e)}
                                                className="hw-card-delete-icon"
                                                title="Delete Homework"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    </div>

                                    <h3 className="hw-card-title" title={hw.title}>
                                        {hw.title}
                                    </h3>

                                    <p className="hw-card-desc">
                                        Class {hw.classes?.class_name} {hw.classes?.section || ''}
                                        {hw.description ? ` • ${hw.description}` : ''}
                                    </p>

                                    <div className="hw-card-footer">
                                        <div className="hw-card-footer-text">
                                            <span>Assigned By {hw.teachers?.full_name || 'Admin'}</span>
                                            <span className="hw-card-divider">|</span>
                                            <span>
                                                Due{' '}
                                                {hw.due_date
                                                    ? new Date(hw.due_date).toLocaleDateString([], {
                                                          month: 'short',
                                                          day: 'numeric',
                                                      })
                                                    : 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Details Modal */}
            {selectedHomework && (
                <div className="modal-overlay" onClick={() => setSelectedHomework(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
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
                                    Class {selectedHomework.classes?.class_name}{' '}
                                    {selectedHomework.classes?.section || ''}
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
                                        {selectedHomework.due_date
                                            ? new Date(selectedHomework.due_date).toLocaleDateString([], {
                                                  weekday: 'long',
                                                  year: 'numeric',
                                                  month: 'long',
                                                  day: 'numeric',
                                              })
                                            : 'Not specified'}
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
                                    {selectedHomework.description || (
                                        <span className="instructions-empty">No additional details provided.</span>
                                    )}
                                </div>

                                {(selectedHomework as any).attachments &&
                                    (selectedHomework as any).attachments.length > 0 && (
                                        <div style={{ marginTop: '20px' }}>
                                            <h4 className="instructions-header" style={{ marginBottom: '8px' }}>
                                                Attached Photo
                                            </h4>
                                            <img
                                                src={(selectedHomework as any).attachments[0]}
                                                alt="Homework Attachment"
                                                style={{
                                                    width: '100%',
                                                    maxHeight: '340px',
                                                    objectFit: 'contain',
                                                    borderRadius: '12px',
                                                    border: '1px solid #E2E8F0',
                                                    marginTop: '6px',
                                                }}
                                            />
                                        </div>
                                    )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Apple-Grade Create Homework Modal */}
            {isAddModalOpen && (
                <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
                    <div
                        className="modal-content create-modal-content apple-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Apple Modal Header */}
                        <div className="apple-modal-header">
                            <div>
                                <div className="apple-pill-badge">
                                    <Sparkles size={12} />
                                    <span>Apple Assignment Standard</span>
                                </div>
                                <h2 className="apple-modal-title">Create Homework</h2>
                                <p className="apple-modal-subtitle">
                                    Assignments will be visible for 48 hours, then automatically removed from the system.
                                </p>
                            </div>
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="apple-modal-close"
                                aria-label="Close"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleAddHomework} className="form-body">
                            {/* Class & Subject Selector Row */}
                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">
                                        Class Target <span className="form-required">*</span>
                                    </label>
                                    <div className="apple-select-wrapper">
                                        <select
                                            required
                                            value={selectedClassId}
                                            onChange={(e) => setSelectedClassId(e.target.value)}
                                            className="form-control apple-select"
                                        >
                                            <option value="">Select a class...</option>
                                            {classes.map((cls) => (
                                                <option key={cls.id} value={cls.id}>
                                                    Class {cls.class_name} {cls.section ? `(${cls.section})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Subject</label>
                                    <div className="apple-select-wrapper">
                                        <select
                                            value={subjectId}
                                            onChange={(e) => setSubjectId(e.target.value)}
                                            className="form-control apple-select"
                                        >
                                            <option value="">Select a subject...</option>
                                            {subjects.map((s) => (
                                                <option key={s.id} value={s.id}>
                                                    {s.subject_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Title Field */}
                            <div className="form-group">
                                <label className="form-label">
                                    Homework Title <span className="form-required">*</span>
                                </label>
                                <input
                                    required
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Chapter 4 Exercises 1-15"
                                    className="form-control apple-input"
                                />
                            </div>

                            {/* Instructions Field */}
                            <div className="form-group">
                                <label className="form-label">Details & Instructions</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Provide assignment details, reading chapters, or specific instructions..."
                                    rows={3}
                                    className="form-control apple-textarea"
                                />
                            </div>

                            {/* Apple Photo Attachment Zone */}
                            <div className="form-group">
                                <label className="form-label">Attach Photo (Optional)</label>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            handleFileSelect(e.target.files[0]);
                                        }
                                    }}
                                />

                                {!previewUrl ? (
                                    <div
                                        className={`apple-dropzone ${isDragging ? 'dragging' : ''}`}
                                        onClick={() => fileInputRef.current?.click()}
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            setIsDragging(true);
                                        }}
                                        onDragLeave={() => setIsDragging(false)}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            setIsDragging(false);
                                            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                                handleFileSelect(e.dataTransfer.files[0]);
                                            }
                                        }}
                                    >
                                        <div className="apple-dropzone-icon">
                                            <UploadCloud size={24} color="#0071E3" />
                                        </div>
                                        <div className="apple-dropzone-text">
                                            <span className="apple-dropzone-main">
                                                Click to upload photo or drag & drop
                                            </span>
                                            <span className="apple-dropzone-sub">
                                                JPG, PNG or WebP up to 10MB
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="apple-attachment-preview">
                                        <img
                                            src={previewUrl}
                                            alt="Attachment preview"
                                            className="apple-preview-thumb"
                                        />
                                        <div className="apple-preview-info">
                                            <span className="apple-preview-name">
                                                {attachmentFile?.name || 'Photo attached'}
                                            </span>
                                            <span className="apple-preview-size">
                                                {attachmentFile
                                                    ? `${Math.round(attachmentFile.size / 1024)} KB`
                                                    : 'Ready'}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            className="apple-preview-remove"
                                            onClick={handleRemoveFile}
                                            title="Remove image"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Apple Due Date Presets & Picker */}
                            <div className="form-group">
                                <label className="form-label">
                                    Due Date <span className="form-required">*</span>
                                </label>

                                <div className="apple-segmented-group">
                                    <button
                                        type="button"
                                        className={`apple-segment ${dueDatePreset === 'tomorrow' ? 'active' : ''}`}
                                        onClick={() => setPreset('tomorrow')}
                                    >
                                        Tomorrow
                                    </button>
                                    <button
                                        type="button"
                                        className={`apple-segment ${dueDatePreset === 'in2days' ? 'active' : ''}`}
                                        onClick={() => setPreset('in2days')}
                                    >
                                        In 2 Days
                                    </button>
                                    <button
                                        type="button"
                                        className={`apple-segment ${dueDatePreset === 'in3days' ? 'active' : ''}`}
                                        onClick={() => setPreset('in3days')}
                                    >
                                        In 3 Days
                                    </button>
                                    <button
                                        type="button"
                                        className={`apple-segment ${dueDatePreset === 'custom' ? 'active' : ''}`}
                                        onClick={() => setDueDatePreset('custom')}
                                    >
                                        Custom
                                    </button>
                                </div>

                                {dueDatePreset === 'custom' ? (
                                    <div style={{ marginTop: '8px' }}>
                                        <AppleDatePicker
                                            value={dueDate}
                                            onChange={(d) => setDueDate(d)}
                                            required
                                            minYear={new Date().getFullYear()}
                                            maxYear={new Date().getFullYear() + 1}
                                            defaultYear={new Date().getFullYear()}
                                        />
                                    </div>
                                ) : (
                                    <div className="apple-due-preview">
                                        <CalendarIcon size={14} color="#0071E3" />
                                        <span>
                                            Due on{' '}
                                            {dueDate
                                                ? new Date(dueDate).toLocaleDateString('en-GB', {
                                                      weekday: 'short',
                                                      day: 'numeric',
                                                      month: 'short',
                                                      year: 'numeric',
                                                  })
                                                : '—'}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Apple Actions */}
                            <div className="apple-form-actions">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="apple-btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="apple-btn-primary"
                                >
                                    {submitting ? 'Publishing...' : 'Publish Homework'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
