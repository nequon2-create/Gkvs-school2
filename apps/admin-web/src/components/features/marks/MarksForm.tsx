// Marks Entry Form component
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useMarks } from '../../../hooks/useMarks';
import type { CreateMarksInput } from '../../../types/marks.types';
import { calculateGrade, calculatePercentage, validateMarks } from '../../../utils/gradeCalculator';
import './MarksForm.css';

interface Student {
    id: string;
    full_name: string;
    roll_number: string;
    registration_number: string;
}

interface MarksEntryRow {
    student_id: string;
    student_name: string;
    roll_number: string;
    marks_obtained: number | '';
    remarks?: string;
    is_absent?: boolean;
}

export function MarksForm() {
    const { bulkCreateMarks } = useMarks();

    // Filter states
    const [exams, setExams] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedExam, setSelectedExam] = useState('');
    const [selectedClass, setSelectedClass] = useState('');
    const [subject, setSubject] = useState('');
    const [maxMarks, setMaxMarks] = useState<number>(100);

    // Form data
    const [students, setStudents] = useState<Student[]>([]);
    const [entries, setEntries] = useState<MarksEntryRow[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // UI states
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchExams();
        fetchClasses();
    }, []);

    useEffect(() => {
        if (selectedClass) {
            fetchStudents();
        }
    }, [selectedClass]);

    const fetchExams = async () => {
        const { data } = await supabase
            .from('exams')
            .select('id, exam_name, exam_type, class_id')
            .order('created_at', { ascending: false });

        if (data) setExams(data);
    };

    const fetchClasses = async () => {
        const { data } = await supabase
            .from('classes')
            .select('id, class_name, section')
            .order('class_name', { ascending: true });

        if (data) setClasses(data);
    };

    const fetchStudents = async () => {
        const { data } = await supabase
            .from('students')
            .select('id, full_name, roll_number, registration_number')
            .eq('class_id', selectedClass)
            .order('roll_number', { ascending: true });

        if (data) {
            setStudents(data);
            // Initialize entries
            setEntries(data.map(s => ({
                student_id: s.id,
                student_name: s.full_name,
                roll_number: s.roll_number,
                marks_obtained: '',
                is_absent: false
            })));
        }
    };

    const handleProceed = () => {
        // Validation
        const newErrors: Record<string, string> = {};

        if (!selectedExam) newErrors.exam = 'Please select an exam';
        if (!selectedClass) newErrors.class = 'Please select a class';
        if (!subject) newErrors.subject = 'Please enter subject name';
        if (maxMarks <= 0) newErrors.maxMarks = 'Max marks must be greater than 0';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});
        setShowForm(true);
    };

    const handleMarksChange = (index: number, value: string) => {
        const newEntries = [...entries];

        if (value === '') {
            newEntries[index].marks_obtained = '';
            newEntries[index].is_absent = false;
        } else {
            const marksValue = parseFloat(value);
            if (!isNaN(marksValue)) {
                newEntries[index].marks_obtained = marksValue;
                newEntries[index].is_absent = false;
            }
        }

        setEntries(newEntries);
    };

    const handleRemarksChange = (index: number, value: string) => {
        const newEntries = [...entries];
        newEntries[index].remarks = value;
        setEntries(newEntries);
    };

    const handleAbsentToggle = (index: number) => {
        const newEntries = [...entries];
        newEntries[index].is_absent = !newEntries[index].is_absent;
        if (newEntries[index].is_absent) {
            newEntries[index].marks_obtained = 0;
        }
        setEntries(newEntries);
    };

    const handleMarkAllPresent = () => {
        setEntries(prev => prev.map(e => ({
            ...e,
            is_absent: false
        })));
    };

    const handleMarkAllAbsent = () => {
        setEntries(prev => prev.map(e => ({
            ...e,
            is_absent: true,
            marks_obtained: 0
        })));
    };

    const validateEntries = (): boolean => {
        let valid = true;
        const newErrors: Record<string, string> = {};

        entries.forEach((entry, index) => {
            if (entry.marks_obtained === '') return; // Skip empty entries

            const marksValue = typeof entry.marks_obtained === 'number' ? entry.marks_obtained : 0;
            const error = validateMarks(marksValue, maxMarks);

            if (error) {
                newErrors[`entry_${index}`] = error;
                valid = false;
            }
        });

        setErrors(newErrors);
        return valid;
    };

    const handleSaveAll = async () => {
        if (!validateEntries()) {
            alert('Please fix validation errors before saving');
            return;
        }

        try {
            setSaving(true);

            // Filter only entries with marks
            const marksToSave = entries.filter(e => e.marks_obtained !== '').map(e => ({
                student_id: e.student_id,
                exam_id: selectedExam,
                subject: subject,
                marks_obtained: typeof e.marks_obtained === 'number' ? e.marks_obtained : 0,
                max_marks: maxMarks,
                remarks: e.remarks
            } as CreateMarksInput));

            if (marksToSave.length === 0) {
                alert('Please enter marks for at least one student');
                return;
            }

            // Save using bulk create
            await bulkCreateMarks({
                exam_id: selectedExam,
                class_id: selectedClass,
                marks: marksToSave.map(m => ({
                    registration_number: students.find(s => s.id === m.student_id)?.registration_number || '',
                    subject: m.subject,
                    marks_obtained: m.marks_obtained,
                    max_marks: m.max_marks,
                    remarks: m.remarks
                }))
            });

            alert(`Successfully saved marks for ${marksToSave.length} students!`);

            // Reset form
            setShowForm(false);
            setEntries(students.map(s => ({
                student_id: s.id,
                student_name: s.full_name,
                roll_number: s.roll_number,
                marks_obtained: '',
                is_absent: false
            })));
        } catch (error) {
            console.error('Error saving marks:', error);
            alert('Failed to save marks. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const getEnteredCount = () => {
        return entries.filter(e => e.marks_obtained !== '').length;
    };

    if (!showForm) {
        return (
            <div className="marks-form-setup">
                <h2>Enter Marks</h2>
                <p className="subtitle">Select exam, class, and subject to begin entering marks</p>

                <div className="setup-grid">
                    <div className="form-group">
                        <label className="form-label required">Exam</label>
                        <select
                            className={`form-select ${errors.exam ? 'error' : ''}`}
                            value={selectedExam}
                            onChange={(e) => setSelectedExam(e.target.value)}
                        >
                            <option value="">Select Exam</option>
                            {(exams || []).map(exam => (
                                <option key={exam.id} value={exam.id}>
                                    {exam.exam_name} ({exam.exam_type})
                                </option>
                            ))}
                        </select>
                        {errors.exam && <span className="error-text">{errors.exam}</span>}
                    </div>

                    <div className="form-group">
                        <label className="form-label required">Class</label>
                        <select
                            className={`form-select ${errors.class ? 'error' : ''}`}
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                        >
                            <option value="">Select Class</option>
                            {(classes || []).map(cls => (
                                <option key={cls.id} value={cls.id}>
                                    {cls.class_name}{cls.section ? ` - ${cls.section}` : ''}
                                </option>
                            ))}
                        </select>
                        {errors.class && <span className="error-text">{errors.class}</span>}
                    </div>

                    <div className="form-group">
                        <label className="form-label required">Subject</label>
                        <input
                            type="text"
                            className={`form-input ${errors.subject ? 'error' : ''}`}
                            placeholder="e.g., Mathematics"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                        />
                        {errors.subject && <span className="error-text">{errors.subject}</span>}
                    </div>

                    <div className="form-group">
                        <label className="form-label required">Maximum Marks</label>
                        <input
                            type="number"
                            className={`form-input ${errors.maxMarks ? 'error' : ''}`}
                            placeholder="100"
                            value={maxMarks}
                            onChange={(e) => setMaxMarks(parseInt(e.target.value) || 0)}
                            min="1"
                        />
                        {errors.maxMarks && <span className="error-text">{errors.maxMarks}</span>}
                    </div>
                </div>

                {students.length > 0 && (
                    <div className="student-count">
                        📊 {students.length} students in selected class
                    </div>
                )}

                <button
                    className="btn-primary"
                    onClick={handleProceed}
                    disabled={!selectedExam || !selectedClass || !subject || students.length === 0}
                >
                    Proceed to Enter Marks
                </button>
            </div>
        );
    }

    return (
        <div className="marks-form-container">
            <div className="marks-form-header">
                <div>
                    <h2>Enter Marks</h2>
                    <p className="form-subtitle">
                        {subject} • {exams.find(e => e.id === selectedExam)?.exam_name} •
                        {classes.find(c => c.id === selectedClass)?.class_name} •
                        Max Marks: {maxMarks}
                    </p>
                </div>
                <button className="btn-secondary" onClick={() => setShowForm(false)}>
                    Change Filters
                </button>
            </div>

            <div className="marks-toolbar">
                <div className="progress-indicator">
                    <span className="progress-text">
                        {getEnteredCount()} / {students.length} students marked
                    </span>
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{ width: `${(getEnteredCount() / students.length) * 100}%` }}
                        />
                    </div>
                </div>

                <div className="bulk-actions">
                    <button className="btn-small" onClick={handleMarkAllPresent}>
                        Mark All Present
                    </button>
                    <button className="btn-small btn-danger" onClick={handleMarkAllAbsent}>
                        Mark All Absent
                    </button>
                </div>
            </div>

            <div className="marks-table-wrapper">
                <table className="marks-entry-table">
                    <thead>
                        <tr>
                            <th>Roll No</th>
                            <th>Student Name</th>
                            <th>Marks (/{maxMarks})</th>
                            <th>%</th>
                            <th>Grade</th>
                            <th>Absent</th>
                            <th>Remarks</th>
                        </tr>
                    </thead>
                    <tbody>
                        {entries.map((entry, index) => {
                            const marksValue = typeof entry.marks_obtained === 'number' ? entry.marks_obtained : 0;
                            const percentage = entry.marks_obtained !== ''
                                ? calculatePercentage(marksValue, maxMarks)
                                : 0;
                            const grade = entry.marks_obtained !== ''
                                ? calculateGrade(marksValue, maxMarks)
                                : '--';
                            const hasError = errors[`entry_${index}`];

                            return (
                                <tr key={entry.student_id} className={entry.is_absent ? 'absent-row' : ''}>
                                    <td>{entry.roll_number}</td>
                                    <td className="student-name">{entry.student_name}</td>
                                    <td>
                                        <input
                                            type="number"
                                            className={`marks-input ${hasError ? 'error' : ''}`}
                                            value={entry.marks_obtained}
                                            onChange={(e) => handleMarksChange(index, e.target.value)}
                                            disabled={entry.is_absent}
                                            min="0"
                                            max={maxMarks}
                                            step="0.5"
                                            placeholder="0"
                                        />
                                        {hasError && <span className="inline-error">{hasError}</span>}
                                    </td>
                                    <td className="percentage">{entry.marks_obtained !== '' ? percentage.toFixed(2) : '--'}%</td>
                                    <td>
                                        <span className={`grade-badge grade-${grade.toLowerCase().replace('+', 'plus')}`}>
                                            {grade}
                                        </span>
                                    </td>
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={entry.is_absent}
                                            onChange={() => handleAbsentToggle(index)}
                                            className="absent-checkbox"
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="text"
                                            className="remarks-input"
                                            value={entry.remarks || ''}
                                            onChange={(e) => handleRemarksChange(index, e.target.value)}
                                            placeholder="Optional"
                                        />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="marks-form-footer">
                <button
                    className="btn-primary btn-large"
                    onClick={handleSaveAll}
                    disabled={saving || getEnteredCount() === 0}
                >
                    {saving ? 'Saving...' : `Save Marks (${getEnteredCount()} students)`}
                </button>
            </div>
        </div>
    );
}
