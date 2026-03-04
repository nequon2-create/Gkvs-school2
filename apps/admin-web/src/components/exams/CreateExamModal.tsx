import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

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
        // Fetch classes
        const { data: classesData } = await supabase
            .from('classes')
            .select('id, class_name, section')
            .order('class_name');
        setClasses(classesData || []);

        // Fetch academic years
        const { data: yearsData } = await supabase
            .from('academic_years')
            .select('id, year_name')
            .order('year_name', { ascending: false });
        setAcademicYears(yearsData || []);

        // Fetch subjects
        const { data: subjectsData } = await supabase
            .from('subjects')
            .select('id, subject_name')
            .order('subject_name');

        const initialSchedules: SubjectSchedule[] =
            subjectsData?.map((s) => ({
                subject_id: s.id,
                subject_name: s.subject_name,
                date: '',
                time: '09:00',
                selected: false,
            })) || [];

        setSchedules(initialSchedules);
    };

    const handleScheduleChange = (subjectId: string, field: 'selected' | 'date' | 'time', value: any) => {
        setSchedules((prev) =>
            prev.map((s) => (s.subject_id === subjectId ? { ...s, [field]: value } : s))
        );
    };

    const handlePublish = async () => {
        if (!examName || !examType || !selectedYear || !selectedClass) {
            alert('Please fill all required fields');
            return;
        }

        const selectedSchedules = schedules.filter((s) => s.selected && s.date);
        if (selectedSchedules.length === 0) {
            alert('Please select at least one subject with a date');
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
                    exam_name: examName,
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
                exam_time: s.time,
                duration_minutes: 60,
            }));

            const { error: schedulesError } = await supabase
                .from('exam_schedules')
                .insert(scheduleInserts);

            if (schedulesError) throw schedulesError;

            alert('Exam timetable published successfully!');
            onSuccess();
        } catch (err) {
            console.error('Error publishing exam:', err);
            alert('Failed to publish exam timetable');
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
                background: 'rgba(0,0,0,0.5)',
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
                    background: '#fff',
                    borderRadius: '24px',
                    padding: '40px',
                    maxWidth: '700px',
                    width: '100%',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                }}
            >
                <h2
                    style={{
                        fontSize: '28px',
                        fontWeight: '700',
                        color: '#1D1D1F',
                        marginBottom: '32px',
                    }}
                >
                    Create Exam Timetable
                </h2>

                {/* Basic Info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', color: '#86868B', marginBottom: '8px' }}>
                            Exam Name *
                        </label>
                        <input
                            type="text"
                            value={examName}
                            onChange={(e) => setExamName(e.target.value)}
                            placeholder="e.g., First Term FA1"
                            style={{
                                width: '100%',
                                height: '44px',
                                padding: '0 16px',
                                borderRadius: '10px',
                                border: '1px solid rgba(0,0,0,0.1)',
                                fontSize: '15px',
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '13px', color: '#86868B', marginBottom: '8px' }}>
                            Exam Type *
                        </label>
                        <select
                            value={examType}
                            onChange={(e) => setExamType(e.target.value)}
                            style={{
                                width: '100%',
                                height: '44px',
                                padding: '0 16px',
                                borderRadius: '10px',
                                border: '1px solid rgba(0,0,0,0.1)',
                                fontSize: '15px',
                            }}
                        >
                            <option value="">Select Type</option>
                            <option value="FA1">FA1</option>
                            <option value="FA2">FA2</option>
                            <option value="FA3">FA3</option>
                            <option value="FA4">FA4</option>
                            <option value="SA1">SA1</option>
                            <option value="SA2">SA2</option>
                        </select>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', color: '#86868B', marginBottom: '8px' }}>
                            Academic Year *
                        </label>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            style={{
                                width: '100%',
                                height: '44px',
                                padding: '0 16px',
                                borderRadius: '10px',
                                border: '1px solid rgba(0,0,0,0.1)',
                                fontSize: '15px',
                            }}
                        >
                            <option value="">Select Year</option>
                            {academicYears.map((year) => (
                                <option key={year.id} value={year.id}>
                                    {year.year_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '13px', color: '#86868B', marginBottom: '8px' }}>
                            Class *
                        </label>
                        <select
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            style={{
                                width: '100%',
                                height: '44px',
                                padding: '0 16px',
                                borderRadius: '10px',
                                border: '1px solid rgba(0,0,0,0.1)',
                                fontSize: '15px',
                            }}
                        >
                            <option value="">Select Class</option>
                            {classes.map((cls) => (
                                <option key={cls.id} value={cls.id}>
                                    {cls.class_name} {cls.section && `- ${cls.section}`}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Subjects Schedule */}
                <div style={{ marginBottom: '32px' }}>
                    <h3 style={{ fontSize: '17px', fontWeight: '600', marginBottom: '16px' }}>
                        Select Subjects & Schedule
                    </h3>
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {schedules.map((schedule) => (
                            <div
                                key={schedule.subject_id}
                                style={{
                                    padding: '16px',
                                    background: schedule.selected ? '#E8F4FF' : '#F5F5F7',
                                    borderRadius: '12px',
                                    marginBottom: '12px',
                                    border: schedule.selected ? '2px solid #0071E3' : '2px solid transparent',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <input
                                        type="checkbox"
                                        checked={schedule.selected}
                                        onChange={(e) =>
                                            handleScheduleChange(schedule.subject_id, 'selected', e.target.checked)
                                        }
                                        style={{ width: '20px', height: '20px' }}
                                    />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '15px', fontWeight: '600', color: '#1D1D1F' }}>
                                            {schedule.subject_name}
                                        </div>
                                    </div>
                                    {schedule.selected && (
                                        <>
                                            <input
                                                type="date"
                                                value={schedule.date}
                                                onChange={(e) =>
                                                    handleScheduleChange(schedule.subject_id, 'date', e.target.value)
                                                }
                                                style={{
                                                    padding: '8px 12px',
                                                    borderRadius: '8px',
                                                    border: '1px solid rgba(0,0,0,0.1)',
                                                    fontSize: '14px',
                                                }}
                                            />
                                            <input
                                                type="time"
                                                value={schedule.time}
                                                onChange={(e) =>
                                                    handleScheduleChange(schedule.subject_id, 'time', e.target.value)
                                                }
                                                style={{
                                                    padding: '8px 12px',
                                                    borderRadius: '8px',
                                                    border: '1px solid rgba(0,0,0,0.1)',
                                                    fontSize: '14px',
                                                }}
                                            />
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={onClose}
                        style={{
                            flex: 1,
                            padding: '14px',
                            background: 'rgba(0,0,0,0.03)',
                            border: '1px solid rgba(0,0,0,0.1)',
                            borderRadius: '12px',
                            fontSize: '15px',
                            fontWeight: '500',
                            cursor: 'pointer',
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handlePublish}
                        disabled={publishing}
                        style={{
                            flex: 1,
                            padding: '14px',
                            background: publishing ? '#86868B' : '#0071E3',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '15px',
                            fontWeight: '600',
                            cursor: publishing ? 'not-allowed' : 'pointer',
                            boxShadow: '0 2px 8px rgba(0,113,227,0.3)',
                        }}
                    >
                        {publishing ? 'Publishing...' : 'Publish Timetable'}
                    </button>
                </div>
            </div>
        </div>
    );
}
