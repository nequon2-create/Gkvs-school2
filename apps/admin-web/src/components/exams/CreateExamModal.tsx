import { useState, useEffect } from 'react';
import { X, Layers, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { AppleDateTimePicker } from '../common/AppleDateTimePicker';

interface SubjectSchedule {
    subject_id: string;
    subject_name: string;
    date: string;
    time: string;
    selected: boolean;
}

interface CreateExamModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export function CreateExamModal({ onClose, onSuccess }: CreateExamModalProps) {
    const [examName, setExamName] = useState('');
    const [examType, setExamType] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedClass, setSelectedClass] = useState('');
    const [classes, setClasses] = useState<any[]>([]);
    const [academicYears, setAcademicYears] = useState<any[]>([]);
    const [schedules, setSchedules] = useState<SubjectSchedule[]>([]);
    const [publishing, setPublishing] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
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
    };

    useEffect(() => {
        if (selectedClass) {
            fetchSubjects(selectedClass);
        } else {
            setSchedules([]);
        }
    }, [selectedClass]);

    const fetchSubjects = async (classId: string) => {
        const { data: subjectsData } = await supabase
            .from('subjects')
            .select('id, subject_name, class_id')
            .or(`class_id.eq.${classId},class_id.is.null`)
            .order('subject_name');

        if (subjectsData) {
            const sorted = [...subjectsData].sort((a: any, b: any) => {
                if (a.class_id && !b.class_id) return -1;
                if (!a.class_id && b.class_id) return 1;
                return 0;
            });
            const unique: any[] = [];
            const seen = new Set();
            for (const item of sorted) {
                const nameKey = item.subject_name.trim().toLowerCase();
                if (!seen.has(nameKey)) {
                    seen.add(nameKey);
                    unique.push(item);
                }
            }
            // Default tomorrow's date for ease of scheduling
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const defaultDateStr = tomorrow.toISOString().split('T')[0];

            const initialSchedules: SubjectSchedule[] = unique.map((s) => ({
                subject_id: s.id,
                subject_name: s.subject_name,
                date: defaultDateStr,
                time: '09:30',
                selected: false,
            }));
            setSchedules(initialSchedules);
        } else {
            setSchedules([]);
        }
    };

    const handleScheduleChange = (subjectId: string, field: 'selected' | 'date' | 'time', value: any) => {
        setSchedules((prev) =>
            prev.map((s) => (s.subject_id === subjectId ? { ...s, [field]: value } : s))
        );
    };

    const handlePublish = async () => {
        if (!examName || !examType || !selectedYear || !selectedClass) {
            alert('Please fill all required fields (Exam Name, Type, Academic Year, and Class).');
            return;
        }

        const selectedSchedules = schedules.filter((s) => s.selected && s.date);
        if (selectedSchedules.length === 0) {
            alert('Please check at least one subject and set its date & time.');
            return;
        }

        setPublishing(true);

        try {
            // Calculate start and end dates
            const dates = selectedSchedules.map((s) => new Date(s.date));
            const startDate = new Date(Math.min(...dates.map((d) => d.getTime())));
            const endDate = new Date(Math.max(...dates.map((d) => d.getTime())));

            // Create exam timetable
            const { data: timetableData, error: timetableError } = await supabase
                .from('exam_timetables')
                .insert({
                    exam_name: examName.trim(),
                    exam_type: examType,
                    class_id: selectedClass,
                    academic_year_id: selectedYear,
                    start_date: startDate.toISOString().split('T')[0],
                    end_date: endDate.toISOString().split('T')[0],
                    is_published: true,
                })
                .select()
                .single();

            if (timetableError) throw timetableError;

            // Create exam schedules
            const scheduleInserts = selectedSchedules.map((s) => ({
                exam_timetable_id: timetableData.id,
                subject_id: s.subject_id,
                exam_date: s.date,
                exam_time: s.time || '09:30',
                duration_minutes: 60,
            }));

            const { error: schedulesError } = await supabase
                .from('exam_schedules')
                .insert(scheduleInserts);

            if (schedulesError) throw schedulesError;

            alert('✅ Exam timetable published successfully!');
            onSuccess();
        } catch (err: any) {
            console.error('Error publishing exam:', err);
            alert('Failed to publish exam timetable: ' + (err.message || 'Unknown error'));
        } finally {
            setPublishing(false);
        }
    };

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
                            <span>Apple Timetable Creator</span>
                        </div>
                        <h2 style={{ fontSize: '26px', fontWeight: '700', color: '#1D1D1F', margin: 0, letterSpacing: '-0.02em' }}>
                            Create Exam Timetable
                        </h2>
                        <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#86868B' }}>
                            Set up exam info and scroll to pick date & time for each subject.
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
                            transition: 'all 0.15s ease',
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Basic Info Fields */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1D1D1F', marginBottom: '6px' }}>
                            Exam Name <span style={{ color: '#FF3B30' }}>*</span>
                        </label>
                        <input
                            type="text"
                            value={examName}
                            onChange={(e) => setExamName(e.target.value)}
                            placeholder="e.g., First Term FA1 / Final Exam"
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
                                transition: 'all 0.2s ease',
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
                            <option value="">Select Exam Type</option>
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
                            <option value="">Select Academic Year</option>
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
                            <option value="">Select Class</option>
                            {classes.map((cls) => (
                                <option key={cls.id} value={cls.id}>
                                    {cls.class_name} {cls.section ? `(${cls.section})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Subject Schedule Section */}
                <div style={{ marginBottom: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <div>
                            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1D1D1F', margin: 0 }}>
                                Subject Schedules
                            </h3>
                            <span style={{ fontSize: '13px', color: '#86868B' }}>
                                Select subjects and scroll to pick exam date & time.
                            </span>
                        </div>
                        {schedules.length > 0 && (
                            <button
                                type="button"
                                onClick={() => {
                                    const allSelected = schedules.every((s) => s.selected);
                                    setSchedules((prev) => prev.map((s) => ({ ...s, selected: !allSelected })));
                                }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#0071E3',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    padding: '4px 8px',
                                }}
                            >
                                {schedules.every((s) => s.selected) ? 'Deselect All' : 'Select All'}
                            </button>
                        )}
                    </div>

                    <div style={{ maxHeight: '360px', overflowY: 'auto', paddingRight: '4px' }}>
                        {schedules.length === 0 ? (
                            <div style={{ color: '#86868B', fontSize: '14px', textAlign: 'center', padding: '36px', background: '#F5F5F7', borderRadius: '16px' }}>
                                <Layers size={24} style={{ color: '#86868B', marginBottom: '8px', opacity: 0.6 }} />
                                <div>{selectedClass ? 'No subjects found for this class.' : 'Please choose a class above to load subjects.'}</div>
                            </div>
                        ) : (
                            schedules.map((schedule) => (
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
                                                {schedule.selected ? 'Scheduled for exam' : 'Not included'}
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
                            ))
                        )}
                    </div>
                </div>

                {/* Footer Buttons */}
                <div style={{ display: 'flex', gap: '12px', paddingTop: '16px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            flex: 1,
                            height: '46px',
                            background: '#F5F5F7',
                            border: '1px solid rgba(0,0,0,0.06)',
                            borderRadius: '12px',
                            fontSize: '15px',
                            fontWeight: '500',
                            color: '#1D1D1F',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handlePublish}
                        disabled={publishing}
                        style={{
                            flex: 1.5,
                            height: '46px',
                            background: publishing ? '#8E8E93' : '#0071E3',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '15px',
                            fontWeight: '600',
                            cursor: publishing ? 'not-allowed' : 'pointer',
                            boxShadow: '0 2px 8px rgba(0,113,227,0.3)',
                            transition: 'all 0.15s ease',
                        }}
                    >
                        {publishing ? 'Publishing...' : 'Publish Timetable'}
                    </button>
                </div>
            </div>
        </div>
    );
}
