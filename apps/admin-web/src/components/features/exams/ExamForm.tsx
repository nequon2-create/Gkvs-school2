import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAcademicYears } from '../../../hooks/useAcademicYears';
import type { CreateExamInput, Exam } from '../../../types/exam.types';
import { format } from 'date-fns';
import './ExamForm.css';

interface ExamFormProps {
    exam?: Exam; // If provided, form is in edit mode
    onSubmit: (data: CreateExamInput, publish: boolean) => Promise<boolean>;
    onCancel: () => void;
}

export function ExamForm({ exam, onSubmit, onCancel }: ExamFormProps) {
    const { years: academicYears } = useAcademicYears();
    const [classes, setClasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState<CreateExamInput>({
        exam_name: exam?.exam_name || '',
        exam_type: exam?.exam_type || 'FA1',
        class_id: exam?.class_id || '',
        academic_year_id: exam?.academic_year_id || '',
        exam_date: exam?.exam_date || format(new Date(), 'yyyy-MM-dd'),
        end_date: exam?.end_date || format(new Date(), 'yyyy-MM-dd'),
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        fetchClasses();
    }, []);

    useEffect(() => {
        // Auto-select current academic year if creating new exam
        if (!exam && academicYears.length > 0 && !formData.academic_year_id) {
            const current = academicYears.find(y => y.is_current);
            if (current) {
                setFormData(prev => ({ ...prev, academic_year_id: current.id }));
            }
        }
    }, [academicYears, exam]);

    const fetchClasses = async () => {
        try {
            console.log('🔄 Fetching classes for exam form...');

            const { data, error } = await supabase
                .from('classes')
                .select('id, class_name, section')
                .order('class_name', { ascending: true }); // ✅ No is_active, no numeric_value

            if (error) {
                console.error('❌ Error fetching classes:', error);
                setClasses([]);
                return;
            }

            console.log('✅ Classes loaded for exam form:', data?.length, 'classes');
            setClasses(data || []);
        } catch (err) {
            console.error('❌ Unexpected error:', err);
            setClasses([]);
        }
    };

    const handleChange = (field: keyof CreateExamInput, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error for this field
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.exam_name.trim()) {
            newErrors.exam_name = 'Exam name is required';
        }
        if (!formData.class_id) {
            newErrors.class_id = 'Class is required';
        }
        if (!formData.academic_year_id) {
            newErrors.academic_year_id = 'Academic year is required';
        }
        if (!formData.exam_date) {
            newErrors.exam_date = 'Exam date is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (publish: boolean = false) => {
        if (!validate()) return;

        setLoading(true);
        const success = await onSubmit(formData, publish);
        setLoading(false);

        if (success) {
            // Form will be closed by parent
        }
    };

    const isEditMode = !!exam;

    return (
        <div className="exam-form">
            <div className="form-header">
                <h2 className="form-title">
                    {isEditMode ? 'Edit Exam' : 'Create New Exam'}
                </h2>
                <p className="form-subtitle">
                    {isEditMode ? 'Update exam details' : 'Fill in the exam information'}
                </p>
            </div>

            <div className="form-content">
                {/* Basic Information */}
                <div className="form-section">
                    <h3 className="section-title">Basic Information</h3>

                    <div className="form-group">
                        <label className="form-label required">Exam Name</label>
                        <input
                            type="text"
                            className={`form-input ${errors.exam_name ? 'error' : ''}`}
                            placeholder="e.g., Mid-Term Examination"
                            value={formData.exam_name}
                            onChange={(e) => handleChange('exam_name', e.target.value)}
                        />
                        {errors.exam_name && <span className="error-text">{errors.exam_name}</span>}
                    </div>

                </div>

                {/* Exam Details */}
                <div className="form-section">
                    <h3 className="section-title">Exam Details</h3>

                    <div className="form-row-3">
                        <div className="form-group">
                            <label className="form-label required">Exam Type</label>
                            <select
                                className={`form-select ${errors.exam_type ? 'error' : ''}`}
                                value={formData.exam_type}
                                onChange={(e) => handleChange('exam_type', e.target.value)}
                            >
                                <option value="FA1">FA1</option>
                                <option value="FA2">FA2</option>
                                <option value="FA3">FA3</option>
                                <option value="FA4">FA4</option>
                                <option value="SA1">SA1</option>
                                <option value="SA2">SA2</option>
                                <option value="Midterm">Midterm</option>
                                <option value="Final">Final</option>
                            </select>
                            {errors.exam_type && <span className="error-text">{errors.exam_type}</span>}
                        </div>

                        <div className="form-group">
                            <label className="form-label required">Class</label>
                            <select
                                className={`form-select ${errors.class_id ? 'error' : ''}`}
                                value={formData.class_id}
                                onChange={(e) => handleChange('class_id', e.target.value)}
                            >
                                <option value="">Select Class</option>
                                {(classes || []).map(cls => (
                                    <option key={cls.id} value={cls.id}>
                                        {cls.class_name}{cls.section ? ` - ${cls.section}` : ''}
                                    </option>
                                ))}
                            </select>
                            {errors.class_id && <span className="error-text">{errors.class_id}</span>}
                            {classes.length === 0 && (
                                <span className="error-text">⚠️ No classes found. Please add classes first.</span>
                            )}
                        </div>

                        <div className="form-group">
                            <label className="form-label required">Academic Year</label>
                            <select
                                className={`form-select ${errors.academic_year_id ? 'error' : ''}`}
                                value={formData.academic_year_id}
                                onChange={(e) => handleChange('academic_year_id', e.target.value)}
                            >
                                <option value="">Select Year</option>
                                {(academicYears || []).map(year => (
                                    <option key={year.id} value={year.id}>
                                        {year.year_name} {year.is_current && '(Current)'}
                                    </option>
                                ))}
                            </select>
                            {errors.academic_year_id && <span className="error-text">{errors.academic_year_id}</span>}
                        </div>
                    </div>
                </div>

                {/* Schedule */}
                <div className="form-section">
                    <h3 className="section-title">Schedule</h3>

                    <div className="form-row-3">
                        <div className="form-group">
                            <label className="form-label required">Date</label>
                            <input
                                type="date"
                                className={`form-input ${errors.exam_date ? 'error' : ''}`}
                                value={formData.exam_date}
                                onChange={(e) => handleChange('exam_date', e.target.value)}
                            />
                            {errors.exam_date && <span className="error-text">{errors.exam_date}</span>}
                        </div>

                        <div className="form-group">
                            <label className="form-label required">End Date</label>
                            <input
                                type="date"
                                className={`form-input ${errors.end_date ? 'error' : ''}`}
                                value={formData.end_date || ''}
                                onChange={(e) => handleChange('end_date', e.target.value)}
                            />
                            {errors.end_date && <span className="error-text">{errors.end_date}</span>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Form Actions */}
            <div className="form-actions">
                <button
                    type="button"
                    className="btn-secondary"
                    onClick={onCancel}
                    disabled={loading}
                >
                    Cancel
                </button>
                <button
                    type="button"
                    className="btn-draft"
                    onClick={() => handleSubmit(false)}
                    disabled={loading}
                >
                    {loading ? 'Saving...' : 'Save as Draft'}
                </button>
                <button
                    type="button"
                    className="btn-publish"
                    onClick={() => handleSubmit(true)}
                    disabled={loading}
                >
                    {loading ? 'Publishing...' : isEditMode ? 'Save & Publish' : 'Create & Publish'}
                </button>
            </div>
        </div>
    );
}
