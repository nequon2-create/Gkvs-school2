import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useClasses } from '../hooks/useClasses';
import { useAcademicYears } from '../hooks/useAcademicYears';
import { useStudents } from '../hooks/useStudents';
import { BackButton } from '../components/common';
import './PromotionsPage.css';

export function PromotionsPage() {
    const { classes } = useClasses();
    const { years } = useAcademicYears();
    const { students, filterStudents } = useStudents();

    // Source
    const [sourceYearId, setSourceYearId] = useState('');
    const [sourceClassId, setSourceClassId] = useState('');

    // Destination
    const [destYearId, setDestYearId] = useState('');
    const [destClassId, setDestClassId] = useState('');

    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const [isPromoting, setIsPromoting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Initial load: Set source year to current year if available
    useEffect(() => {
        if (years.length > 0 && !sourceYearId) {
            const currentYear = years.find(y => y.is_current);
            if (currentYear) setSourceYearId(currentYear.id);
        }
    }, [years, sourceYearId]);

    // Fetch students when source changes
    useEffect(() => {
        if (sourceYearId && sourceClassId) {
            filterStudents({ academicYearId: sourceYearId, classId: sourceClassId, isActive: true, skipHistory: true });
        } else {
            filterStudents({ classId: 'NONE', skipHistory: true }); // to clear list
        }
    }, [sourceYearId, sourceClassId, filterStudents]);

    // Auto-select all students when list loads
    useEffect(() => {
        if (students.length > 0) {
            setSelectedStudentIds(students.map(s => s.id));
        } else {
            setSelectedStudentIds([]);
        }
    }, [students]);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedStudentIds(students.map(s => s.id));
        } else {
            setSelectedStudentIds([]);
        }
    };

    const handleSelectStudent = (id: string) => {
        setSelectedStudentIds(prev =>
            prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
        );
    };

    const handlePromote = async () => {
        if (!destYearId || !destClassId) {
            setMessage({ type: 'error', text: 'Please select destination academic year and class.' });
            return;
        }
        if (selectedStudentIds.length === 0) {
            setMessage({ type: 'error', text: 'Please select at least one student to promote.' });
            return;
        }

        try {
            setIsPromoting(true);
            setMessage(null);

            const { error } = await supabase.rpc('promote_students', {
                p_student_ids: selectedStudentIds,
                p_new_class_id: destClassId,
                p_new_academic_year_id: destYearId
            });

            if (error) throw error;

            setMessage({ type: 'success', text: `Successfully promoted ${selectedStudentIds.length} students!` });

            // Refresh list by triggering filter again
            filterStudents({ academicYearId: sourceYearId, classId: sourceClassId, isActive: true, skipHistory: true });

            // Clear selections
            setSelectedStudentIds([]);
            setDestClassId('');

        } catch (err: any) {
            console.error('Promotion error:', err);
            setMessage({ type: 'error', text: err.message || 'Failed to promote students' });
        } finally {
            setIsPromoting(false);
        }
    };

    const allSelected = students.length > 0 && selectedStudentIds.length === students.length;

    return (
        <div className="promotions-page">
            <div className="promotions-header">
                <BackButton to="/dashboard" />
                <h1>Bulk Promotions</h1>
                <p>Promote students from one class to another for a new academic year.</p>
            </div>

            {message && (
                <div className={`message-banner ${message.type}`}>
                    {message.text}
                </div>
            )}

            <div className="promotions-container">
                {/* Source Panel */}
                <div className="promotion-panel">
                    <h2>Step 1: Select Source</h2>

                    <div className="form-group">
                        <label>From Academic Year</label>
                        <select
                            className="form-select"
                            value={sourceYearId}
                            onChange={(e) => setSourceYearId(e.target.value)}
                        >
                            <option value="">Select Year</option>
                            {years.map(year => (
                                <option key={year.id} value={year.id}>
                                    {year.year_name} {year.is_current ? '(Current)' : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>From Class</label>
                        <select
                            className="form-select"
                            value={sourceClassId}
                            onChange={(e) => setSourceClassId(e.target.value)}
                            disabled={!sourceYearId}
                        >
                            <option value="">Select Class</option>
                            {classes.map(c => (
                                <option key={c.id} value={c.id}>{c.class_name}</option>
                            ))}
                        </select>
                    </div>

                    {sourceClassId && students.length > 0 && (
                        <div className="students-selection-list">
                            <label className="students-select-all">
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    onChange={handleSelectAll}
                                />
                                Select All ({students.length} Students)
                            </label>

                            {students.map(student => (
                                <label key={student.id} className="student-selection-item">
                                    <input
                                        type="checkbox"
                                        checked={selectedStudentIds.includes(student.id)}
                                        onChange={() => handleSelectStudent(student.id)}
                                    />
                                    <div className="student-profile-pic-container">
                                        {student.photo_url ? (
                                            <img src={student.photo_url} alt="" className="student-profile-pic" />
                                        ) : (
                                            <div className="student-profile-pic-placeholder">
                                                {student.full_name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="student-info">
                                        <span className="student-name">{student.full_name}</span>
                                        <span className="student-reg">{student.registration_number}</span>
                                    </div>
                                </label>
                            ))}
                        </div>
                    )}

                    {sourceClassId && students.length === 0 && (
                        <div className="empty-students">
                            No active students found in this class.
                        </div>
                    )}
                </div>

                {/* Destination Panel */}
                <div className="promotion-panel">
                    <h2>Step 2: Select Destination</h2>

                    <div className="form-group">
                        <label>To Academic Year</label>
                        <select
                            className="form-select"
                            value={destYearId}
                            onChange={(e) => setDestYearId(e.target.value)}
                        >
                            <option value="">Select Next Year</option>
                            {years.map(year => (
                                <option key={year.id} value={year.id}>
                                    {year.year_name} {year.is_current ? '(Current)' : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>To Class</label>
                        <select
                            className="form-select"
                            value={destClassId}
                            onChange={(e) => setDestClassId(e.target.value)}
                            disabled={!destYearId}
                        >
                            <option value="">Select Next Class</option>
                            {classes.map(c => (
                                <option key={c.id} value={c.id}>{c.class_name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="action-section">
                        <button
                            className="promote-btn"
                            disabled={isPromoting || !destYearId || !destClassId || selectedStudentIds.length === 0}
                            onClick={handlePromote}
                        >
                            {isPromoting ? 'Promoting...' : `Promote ${selectedStudentIds.length} Students`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
