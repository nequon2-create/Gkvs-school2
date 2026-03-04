import { useState } from 'react';
import { X } from 'lucide-react';
import type { AcademicYear, CreateAcademicYearInput } from '../../../types/academic-years.types';
import { generateYearName, isValidDateRange } from '../../../utils/academicYearHelpers';
import './AcademicYearForm.css';

export interface AcademicYearFormProps {
    year?: AcademicYear;
    onSubmit: (data: CreateAcademicYearInput) => Promise<void>;
    onCancel: () => void;
    loading?: boolean;
}

export function AcademicYearForm({ year, onSubmit, onCancel, loading = false }: AcademicYearFormProps) {
    const [formData, setFormData] = useState<CreateAcademicYearInput>({
        year_name: year?.year_name || '',
        start_date: year?.start_date || '',
        end_date: year?.end_date || '',
        is_current: year?.is_current || false,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleStartDateChange = (startDate: string) => {
        setFormData(prev => ({
            ...prev,
            start_date: startDate,
            year_name: startDate ? generateYearName(startDate) : prev.year_name,
        }));
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.year_name.trim()) {
            newErrors.year_name = 'Year name is required';
        }

        if (!formData.start_date) {
            newErrors.start_date = 'Start date is required';
        }

        if (!formData.end_date) {
            newErrors.end_date = 'End date is required';
        }

        if (formData.start_date && formData.end_date && !isValidDateRange(formData.start_date, formData.end_date)) {
            newErrors.end_date = 'End date must be after start date';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        await onSubmit(formData);
    };

    return (
        <div className="academic-year-form-overlay" onClick={onCancel}>
            <div className="academic-year-form-modal animate-scale-in" onClick={(e) => e.stopPropagation()}>
                <div className="form-header">
                    <h2 className="form-title">{year ? 'Edit Academic Year' : 'Create Academic Year'}</h2>
                    <button className="close-btn" onClick={onCancel} type="button">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="form-body">
                    <div className="form-group">
                        <label htmlFor="year_name" className="form-label">
                            Year Name
                        </label>
                        <input
                            id="year_name"
                            type="text"
                            className={`form-input ${errors.year_name ? 'error' : ''}`}
                            value={formData.year_name}
                            onChange={(e) => setFormData({ ...formData, year_name: e.target.value })}
                            placeholder="e.g., 2024-2025"
                            disabled={loading}
                        />
                        {errors.year_name && <span className="error-message">{errors.year_name}</span>}
                        <span className="form-hint">Auto-generated from start date</span>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="start_date" className="form-label">
                                Start Date
                            </label>
                            <input
                                id="start_date"
                                type="date"
                                className={`form-input ${errors.start_date ? 'error' : ''}`}
                                value={formData.start_date}
                                onChange={(e) => handleStartDateChange(e.target.value)}
                                disabled={loading}
                            />
                            {errors.start_date && <span className="error-message">{errors.start_date}</span>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="end_date" className="form-label">
                                End Date
                            </label>
                            <input
                                id="end_date"
                                type="date"
                                className={`form-input ${errors.end_date ? 'error' : ''}`}
                                value={formData.end_date}
                                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                disabled={loading}
                            />
                            {errors.end_date && <span className="error-message">{errors.end_date}</span>}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={formData.is_current}
                                onChange={(e) => setFormData({ ...formData, is_current: e.target.checked })}
                                disabled={loading}
                                className="checkbox-input"
                            />
                            <span>Set as current academic year</span>
                        </label>
                        <span className="form-hint">This will unmark any previously set current year</span>
                    </div>

                    <div className="form-footer">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={onCancel}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : year ? 'Update Year' : 'Create Year'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
