import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { BackButton } from '../components/common';

interface Teacher {
    id: string;
    full_name: string;
    registration_number: string;
    photo_url?: string;
    isPresent?: boolean | null; // null = not marked yet
}

export function TeacherAttendancePage() {
    const navigate = useNavigate();

    const nowIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const [selectedYear, setSelectedYear] = useState(nowIST.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(nowIST.getMonth() + 1);
    const [selectedDay, setSelectedDay] = useState(nowIST.getDate());
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null); // teacher ID being saved

    useEffect(() => {
        fetchTeachers();
    }, [selectedYear, selectedMonth, selectedDay]);

    const fetchTeachers = async () => {
        setLoading(true);
        try {
            const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;

            // Fetch all active teachers
            const { data: teacherData, error: tErr } = await supabase
                .from('teachers')
                .select('id, full_name, registration_number, photo_url')
                .order('full_name');
            if (tErr) throw tErr;

            // Fetch existing attendance records for selected date
            const { data: attData } = await supabase
                .from('teacher_attendance')
                .select('teacher_id, is_present')
                .eq('date', dateStr);

            const attMap = new Map<string, boolean>();
            (attData || []).forEach(r => attMap.set(r.teacher_id, r.is_present));

            const list = (teacherData || []).map(t => ({
                ...t,
                isPresent: attMap.has(t.id) ? attMap.get(t.id)! : null,
            }));
            setTeachers(list);
        } catch (err) {
            console.error('Error fetching teachers:', err);
        } finally {
            setLoading(false);
        }
    };

    const markAttendance = async (teacherId: string, isPresent: boolean) => {
        setSaving(teacherId);
        try {
            const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
            const { data: userData } = await supabase.auth.getUser();

            const { error } = await supabase
                .from('teacher_attendance')
                .upsert({
                    teacher_id: teacherId,
                    date: dateStr,
                    is_present: isPresent,
                    marked_by: userData?.user?.id,
                    marked_at: new Date().toISOString(),
                }, { onConflict: 'teacher_id,date' });

            if (error) throw error;

            // Update local state
            setTeachers(prev => prev.map(t =>
                t.id === teacherId ? { ...t, isPresent } : t
            ));
        } catch (err) {
            console.error('Error marking attendance:', err);
            alert('Failed to save. Please try again.');
        } finally {
            setSaving(null);
        }
    };

    const daysInSelectedMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    const dayOptions = Array.from({ length: daysInSelectedMonth }, (_, i) => i + 1);
    const monthOptions = Array.from({ length: 12 }, (_, i) => ({
        value: i + 1,
        label: new Date(2024, i, 1).toLocaleString('default', { month: 'long' })
    }));

    const presentCount = teachers.filter(t => t.isPresent === true).length;
    const absentCount = teachers.filter(t => t.isPresent === false).length;
    const unmarkedCount = teachers.filter(t => t.isPresent === null).length;

    const dateLabel = new Date(selectedYear, selectedMonth - 1, selectedDay)
        .toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    return (
        <div style={{ padding: '32px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
                <div>
                    <BackButton to="/attendance" />
                    <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#1D1D1F', margin: '8px 0 4px 0' }}>
                        Teacher Attendance
                    </h1>
                    <p style={{ fontSize: '14px', color: '#86868B' }}>{dateLabel}</p>
                </div>
                <button
                    onClick={() => navigate('/attendance/teachers/sheet')}
                    style={{
                        padding: '10px 20px', background: '#0071E3', color: '#fff',
                        border: 'none', borderRadius: '980px', fontSize: '14px',
                        fontWeight: '600', cursor: 'pointer',
                    }}
                >
                    📋 View Monthly Sheet
                </button>
            </div>

            {/* Date Selector */}
            <div style={{
                background: '#fff', border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: '16px', padding: '20px', marginBottom: '24px',
            }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#1D1D1F', marginBottom: '14px' }}>
                    Select Date
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <select
                        value={selectedYear}
                        onChange={e => setSelectedYear(Number(e.target.value))}
                        style={{ height: '40px', padding: '0 12px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.12)', fontSize: '14px' }}
                    >
                        {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <select
                        value={selectedMonth}
                        onChange={e => { setSelectedMonth(Number(e.target.value)); setSelectedDay(1); }}
                        style={{ height: '40px', padding: '0 12px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.12)', fontSize: '14px' }}
                    >
                        {monthOptions.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                    <select
                        value={selectedDay}
                        onChange={e => setSelectedDay(Number(e.target.value))}
                        style={{ height: '40px', padding: '0 12px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.12)', fontSize: '14px' }}
                    >
                        {dayOptions.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
            </div>

            {/* Summary Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
                <div style={{ background: 'rgba(52,199,89,0.09)', borderRadius: '14px', padding: '16px', textAlign: 'center', border: '1px solid rgba(52,199,89,0.2)' }}>
                    <div style={{ fontSize: '28px', fontWeight: '800', color: '#34C759' }}>{presentCount}</div>
                    <div style={{ fontSize: '13px', color: '#34C759', fontWeight: '600' }}>✅ Present</div>
                </div>
                <div style={{ background: 'rgba(255,59,48,0.09)', borderRadius: '14px', padding: '16px', textAlign: 'center', border: '1px solid rgba(255,59,48,0.2)' }}>
                    <div style={{ fontSize: '28px', fontWeight: '800', color: '#FF3B30' }}>{absentCount}</div>
                    <div style={{ fontSize: '13px', color: '#FF3B30', fontWeight: '600' }}>❌ Absent</div>
                </div>
                <div style={{ background: '#F5F5F7', borderRadius: '14px', padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '28px', fontWeight: '800', color: '#86868B' }}>{unmarkedCount}</div>
                    <div style={{ fontSize: '13px', color: '#86868B', fontWeight: '600' }}>⏳ Unmarked</div>
                </div>
            </div>

            {/* Teacher List */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#86868B' }}>Loading teachers...</div>
            ) : (
                <div style={{ display: 'grid', gap: '10px' }}>
                    {teachers.map(teacher => {
                        const isSaving = saving === teacher.id;
                        return (
                            <div
                                key={teacher.id}
                                style={{
                                    border: `1px solid ${teacher.isPresent === true ? 'rgba(52,199,89,0.3)' : teacher.isPresent === false ? 'rgba(255,59,48,0.3)' : 'rgba(0,0,0,0.08)'}`,
                                    borderRadius: '14px',
                                    padding: '16px 20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px',
                                    transition: 'all 0.2s ease',
                                    background: teacher.isPresent === true ? 'rgba(52,199,89,0.04)' : teacher.isPresent === false ? 'rgba(255,59,48,0.04)' : '#fff',
                                }}
                            >
                                {/* Avatar */}
                                <div style={{
                                    width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
                                    background: teacher.photo_url
                                        ? `url(${teacher.photo_url}) center/cover no-repeat`
                                        : 'linear-gradient(135deg,#667eea,#764ba2)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#fff', fontSize: '18px', fontWeight: '700',
                                }}>
                                    {!teacher.photo_url && teacher.full_name.charAt(0).toUpperCase()}
                                </div>

                                {/* Info */}
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '15px', fontWeight: '600', color: '#1D1D1F' }}>{teacher.full_name}</div>
                                    <div style={{ fontSize: '12px', color: '#86868B' }}>{teacher.registration_number}</div>
                                </div>

                                {/* Status badge */}
                                {teacher.isPresent !== null && (
                                    <div style={{
                                        fontSize: '12px', fontWeight: '600', padding: '4px 12px',
                                        borderRadius: '20px',
                                        background: teacher.isPresent ? 'rgba(52,199,89,0.15)' : 'rgba(255,59,48,0.15)',
                                        color: teacher.isPresent ? '#34C759' : '#FF3B30',
                                    }}>
                                        {teacher.isPresent ? 'Present' : 'Absent'}
                                    </div>
                                )}

                                {/* Mark buttons */}
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={() => markAttendance(teacher.id, true)}
                                        disabled={isSaving}
                                        style={{
                                            width: '40px', height: '40px', borderRadius: '10px',
                                            border: '2px solid',
                                            borderColor: teacher.isPresent === true ? '#34C759' : '#E5E7EB',
                                            background: teacher.isPresent === true ? '#34C759' : '#fff',
                                            color: teacher.isPresent === true ? '#fff' : '#34C759',
                                            fontSize: '18px', cursor: isSaving ? 'wait' : 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            transition: 'all 0.2s',
                                        }}
                                        title="Mark Present"
                                    >
                                        ✓
                                    </button>
                                    <button
                                        onClick={() => markAttendance(teacher.id, false)}
                                        disabled={isSaving}
                                        style={{
                                            width: '40px', height: '40px', borderRadius: '10px',
                                            border: '2px solid',
                                            borderColor: teacher.isPresent === false ? '#FF3B30' : '#E5E7EB',
                                            background: teacher.isPresent === false ? '#FF3B30' : '#fff',
                                            color: teacher.isPresent === false ? '#fff' : '#FF3B30',
                                            fontSize: '18px', cursor: isSaving ? 'wait' : 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            transition: 'all 0.2s',
                                        }}
                                        title="Mark Absent"
                                    >
                                        ✗
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
