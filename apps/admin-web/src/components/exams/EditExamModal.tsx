import { useState, useEffect } from 'react';
import { X, Sparkles, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { AppleDateTimePicker } from '../common/AppleDateTimePicker';

interface SubjectSchedule {
    subject_id: string;
    subject_name: string;
    date: string;
    time: string;
    selected: boolean;
    schedule_id?: string;
}

interface EditExamModalProps {
    examId: string;
    onClose: () => void;
    onSuccess: () => void;
}

export function EditExamModal({ examId, onClose, onSuccess }: EditExamModalProps) {
    const [examName, setExamName] = useState('');
    const [examType, setExamType] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedClass, setSelectedClass] = useState('');
    const [classes, setClasses] = useState<any[]>([]);
    const [academicYears, setAcademicYears] = useState<any[]>([]);
    const [schedules, setSchedules] = useState<SubjectSchedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, [examId]);

    const loadData = async () => {
        try {
            setLoading(true);

            // Fetch classes & years
            const { data: classesData } = await supabase
                .from('classes')
                .select('id, class_name, section')
                .order('numeric_value', { ascending: true })
                .order('class_name', { ascending: true });
            setClasses(classesData || []);

            const { data: yearsData } = await supabase
                .from('academic_years')
                .select('id, year_name')
                .order('year_name', { ascending: false });
            setAcademicYears(yearsData || []);

            // Fetch current exam timetable
            const { data: examData, error: examError } = await supabase
                .from('exam_timetables')
                .select('*')
                .eq('id', examId)
                .single();

            if (examError) throw examError;

            setExamName(examData.exam_name || '');
            setExamType(examData.exam_type || '');
            setSelectedYear(examData.academic_year_id || '');
            setSelectedClass(examData.class_id || '');

            // Fetch existing schedules
            const { data: schedData } = await supabase
                .from('exam_schedules')
                .select('id, subject_id, exam_date, exam_time, subjects(subject_name)')
                .eq('exam_timetable_id', examId);

            // Fetch all subjects for this class
            const { data: subjectsData } = await supabase
                .from('subjects')
                .select('id, subject_name, class_id')
                .or(`class_id.eq.${examData.class_id},class_id.is.null`)
                .order('subject_name');

            const schedMap = new Map<string, any>();
            (schedData || []).forEach((sc: any) => {
                schedMap.set(sc.subject_id, sc);
            });

            const unique: any[] = [];
            const seen = new Set();
            (subjectsData || []).forEach((s: any) => {
                const nameKey = s.subject_name.trim().toLowerCase();
                if (!seen.has(nameKey)) {
                    seen.add(nameKey);
                    unique.push(s);
                }
            });

            // Tomorrow as fallback
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const defaultDateStr = tomorrow.toISOString().split('T')[0];

            const builtSchedules: SubjectSchedule[] = unique.map((s) => {
                const existing = schedMap.get(s.id);
                return {
                    subject_id: s.id,
                    subject_name: s.subject_name,
                    date: existing?.exam_date || defaultDateStr,
                    time: existing?.exam_time || '09:30',
                    selected: !!existing,
                    schedule_id: existing?.id,
                };
            });

            setSchedules(builtSchedules);
        } catch (err: any) {
            console.error('Error loading exam for editing:', err);
            alert('Failed to load exam details: ' + (err.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    const handleScheduleChange = (subjectId: string, field: 'selected' | 'date' | 'time', value: any) => {
        setSchedules((prev) =>
            prev.map((s) => (s.subject_id === subjectId ? { ...s, [field]: value } : s))
        );
    };

    const handleSave = async () => {
        if (!examName || !examType || !selectedYear || !selectedClass) {
            alert('Please fill all required fields.');
            return;
        }

        const selectedSchedules = schedules.filter((s) => s.selected && s.date);
        if (selectedSchedules.length === 0) {
            alert('Please select at least one subject with a date & time.');
            return;
        }

        setSaving(true);
        try {
            // Recalculate start and end dates
            const dates = selectedSchedules.map((s) => new Date(s.date));
            const startDate = new Date(Math.min(...dates.map((d) => d.getTime())));
            const endDate = new Date(Math.max(...dates.map((d) => d.getTime())));

            // 1. Update exam_timetables
            const { error: updateError } = await supabase
                .from('exam_timetables')
                .update({
                    exam_name: examName.trim(),
                    exam_type: examType,
                    class_id: selectedClass,
                    academic_year_id: selectedYear,
                    start_date: startDate.toISOString().split('T')[0],
                    end_date: endDate.toISOString().split('T')[0],
                    updated_at: new Date().toISOString(),
                })
                .eq('id', examId);

            if (updateError) throw updateError;

            // 2. Synchronize schedules: delete old and insert updated
            await supabase
                .from('exam_schedules')
                .delete()
                .eq('exam_timetable_id', examId);

            const scheduleInserts = selectedSchedules.map((s) => ({
                exam_timetable_id: examId,
                subject_id: s.subject_id,
                exam_date: s.date,
                exam_time: s.time || '09:30',
                duration_minutes: 60,
            }));

            const { error: schedError } = await supabase
                .from('exam_schedules')
                .insert(scheduleInserts);

            if (schedError) throw schedError;

            alert('✅ Exam timetable updated successfully!');
            onSuccess();
        } catch (err: any) {
            console.error('Error saving exam:', err);
            alert('Failed to update exam: ' + (err.message || 'Unknown error'));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to permanently delete this exam timetable?')) return;

        try {
            const { error } = await supabase
                .from('exam_timetables')
                .delete()
                .eq('id', examId);

            if (error) throw error;
            alert('Exam timetable deleted successfully');
            onSuccess();
        } catch (err: any) {
            console.error('Error deleting exam:', err);
            alert('Failed to delete exam: ' + (err.message || 'Unknown error'));
        }
    };

    if (loading) {
        return (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                <div style={{ background: '#fff', padding: '32px 48px', borderRadius: '18px', fontSize: '15px', color: '#1D1D1F' }}>
                    Loading exam timetable...
                </div>
            </div>
        );
    }

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.45)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '20px',
            }}
            onClick={onClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: '#FFFFFF',
                    borderRadius: '24px',
                    padding: '36px',
                    maxWidth: '760px',
                    width: '100%',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    boxShadow: '0 24px 64px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.06)',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif',
                }}
            >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
                    <div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', background: 'rgba(0,113,227,0.08)', borderRadius: '980px', color: '#0071E3', fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>
                            <Sparkles size={13} />
                            <span>Edit Mode</span>
                        </div>
                        <h2 style={{ fontSize: '26px', fontWeight: '700', color: '#1D1D1F', margin: 0, letterSpacing: '-0.02em' }}>
                            Edit Exam Timetable
                        </h2>
                        <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#86868B' }}>
                            Modify exam details, subjects, dates, and times.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            border: 'none',
                            background: '#F5F5F7',
                            color: '#86868B',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Form Inputs */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1D1D1F', marginBottom: '6px' }}>
                            Exam Name <span style={{ color: '#FF3B30' }}>*</span>
                        </label>
                        <input
                            type="text"
                            value={examName}
                            onChange={(e) => setExamName(e.target.value)}
                            placeholder="e.g., First Term FA1"
                            style={{
                                width: '100%',
                                height: '44px',
                                padding: '0 14px',
                                borderRadius: '12px',
                                border: '1px solid rgba(0,0,0,0.12)',
                                background: '#FBFBFC',
                                fontSize: '15px',
                                outline: 'none',
                                boxSizing: 'border-box',
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1D1D1F', marginBottom: '6px' }}>
                            Exam Type <span style={{ color: '#FF3B30' }}>*</span>
                        </label>
                        <select
                            value={examType}
                            onChange={(e) => setExamType(e.target.value)}
                            style={{
                                width: '100%',
                                height: '44px',
                                padding: '0 14px',
                                borderRadius: '12px',
                                border: '1px solid rgba(0,0,0,0.12)',
                                background: '#FBFBFC',
                                fontSize: '15px',
                                outline: 'none',
                                boxSizing: 'border-box',
                            }}
                        >
                            <option value="FA1">Formative Assessment 1 (FA1)</option>
                            <option value="FA2">Formative Assessment 2 (FA2)</option>
                            <option value="FA3">Formative Assessment 3 (FA3)</option>
                            <option value="FA4">Formative Assessment 4 (FA4)</option>
                            <option value="SA1">Summative Assessment 1 (SA1)</option>
                            <option value="SA2">Summative Assessment 2 (SA2)</option>
                            <option value="Mid-Term">Mid-Term Exam</option>
                            <option value="Final">Final Board/Annual Exam</option>
                        </select>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '28px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1D1D1F', marginBottom: '6px' }}>
                            Academic Year <span style={{ color: '#FF3B30' }}>*</span>
                        </label>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            style={{
                                width: '100%',
                                height: '44px',
                                padding: '0 14px',
                                borderRadius: '12px',
                                border: '1px solid rgba(0,0,0,0.12)',
                                background: '#FBFBFC',
                                fontSize: '15px',
                                outline: 'none',
                                boxSizing: 'border-box',
                            }}
                        >
                            {academicYears.map((year) => (
                                <option key={year.id} value={year.id}>
                                    {year.year_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1D1D1F', marginBottom: '6px' }}>
                            Class Target <span style={{ color: '#FF3B30' }}>*</span>
                        </label>
                        <select
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            style={{
                                width: '100%',
                                height: '44px',
                                padding: '0 14px',
                                borderRadius: '12px',
                                border: '1px solid rgba(0,0,0,0.12)',
                                background: '#FBFBFC',
                                fontSize: '15px',
                                outline: 'none',
                                boxSizing: 'border-box',
                            }}
                        >
                            {classes.map((cls) => (
                                <option key={cls.id} value={cls.id}>
                                    {cls.class_name} {cls.section ? `(${cls.section})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Subject Schedule */}
                <div style={{ marginBottom: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <div>
                            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1D1D1F', margin: 0 }}>
                                Subject Schedules
                            </h3>
                            <span style={{ fontSize: '13px', color: '#86868B' }}>
                                Modify exam dates and times via Apple scroll wheel.
                            </span>
                        </div>
                    </div>

                    <div style={{ maxHeight: '360px', overflowY: 'auto', paddingRight: '4px' }}>
                        {schedules.map((schedule) => (
                            <div
                                key={schedule.subject_id}
                                style={{
                                    padding: '16px',
                                    background: schedule.selected ? 'rgba(0, 113, 227, 0.04)' : '#F5F5F7',
                                    borderRadius: '16px',
                                    marginBottom: '12px',
                                    border: schedule.selected ? '1.5px solid #0071E3' : '1.5px solid transparent',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '16px',
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', flex: 1 }}>
                                    <input
                                        type="checkbox"
                                        checked={schedule.selected}
                                        onChange={(e) =>
                                            handleScheduleChange(schedule.subject_id, 'selected', e.target.checked)
                                        }
                                        style={{
                                            width: '20px',
                                            height: '20px',
                                            accentColor: '#0071E3',
                                            cursor: 'pointer',
                                        }}
                                    />
                                    <div>
                                        <div style={{ fontSize: '15px', fontWeight: '600', color: '#1D1D1F' }}>
                                            {schedule.subject_name}
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#86868B' }}>
                                            {schedule.selected ? 'Scheduled' : 'Excluded from exam'}
                                        </div>
                                    </div>
                                </label>

                                {schedule.selected && (
                                    <div style={{ width: '280px' }}>
                                        <AppleDateTimePicker
                                            dateValue={schedule.date}
                                            timeValue={schedule.time}
                                            onDateChange={(newDate) => handleScheduleChange(schedule.subject_id, 'date', newDate)}
                                            onTimeChange={(newTime) => handleScheduleChange(schedule.subject_id, 'time', newTime)}
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer Buttons */}
                <div style={{ display: 'flex', gap: '12px', paddingTop: '16px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                    <button
                        type="button"
                        onClick={handleDelete}
                        style={{
                            padding: '0 18px',
                            height: '46px',
                            background: '#FFF0F0',
                            border: '1px solid rgba(255, 59, 48, 0.2)',
                            borderRadius: '12px',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#FF3B30',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                        }}
                    >
                        <Trash2 size={16} />
                        Delete
                    </button>
                    <div style={{ flex: 1 }} />
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            padding: '0 24px',
                            height: '46px',
                            background: '#F5F5F7',
                            border: '1px solid rgba(0,0,0,0.06)',
                            borderRadius: '12px',
                            fontSize: '15px',
                            fontWeight: '500',
                            color: '#1D1D1F',
                            cursor: 'pointer',
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        style={{
                            padding: '0 28px',
                            height: '46px',
                            background: saving ? '#8E8E93' : '#0071E3',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '15px',
                            fontWeight: '600',
                            cursor: saving ? 'not-allowed' : 'pointer',
                            boxShadow: '0 2px 8px rgba(0,113,227,0.3)',
                        }}
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}
