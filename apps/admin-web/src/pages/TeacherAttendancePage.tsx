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
    history?: boolean[];
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

            // Fetch last 30 days of logs for sparklines
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const { data: sparkData } = await supabase
                .from('teacher_attendance')
                .select('teacher_id, date, is_present')
                .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
                .order('date', { ascending: true });

            const sparkMap = new Map<string, boolean[]>();
            (sparkData || []).forEach(r => {
                const list = sparkMap.get(r.teacher_id) || [];
                list.push(r.is_present);
                if (list.length > 8) list.shift();
                sparkMap.set(r.teacher_id, list);
            });

            const attMap = new Map<string, boolean>();
            (attData || []).forEach(r => attMap.set(r.teacher_id, r.is_present));

            const list = (teacherData || []).map(t => ({
                ...t,
                isPresent: attMap.has(t.id) ? attMap.get(t.id)! : null,
                history: sparkMap.get(t.id) || [true, true, true, true, true, true, true, true],
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

    const renderSparkline = (history: boolean[] | undefined) => {
        const points = history || [true, true, true, true, true, true, true, true];
        const width = 110;
        const height = 24;
        const padding = 2;
        const step = (width - padding * 2) / (points.length - 1);
        
        const coordinates = points.map((p, index) => {
            const x = padding + index * step;
            const y = p ? padding + 4 : height - padding - 4;
            return `${x},${y}`;
        });

        const pathData = `M ${coordinates.join(' L ')}`;
        
        return (
            <svg width={width} height={height} style={{ overflow: 'visible' }}>
                <defs>
                    <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#A855F7" stopOpacity="0.2"/>
                        <stop offset="100%" stopColor="#A855F7" stopOpacity="0"/>
                    </linearGradient>
                </defs>
                <path
                    d={`${pathData} L ${padding + (points.length - 1) * step},${height} L ${padding},${height} Z`}
                    fill="url(#sparkGrad)"
                />
                <path
                    d={pathData}
                    fill="none"
                    stroke="#A855F7"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                {coordinates.length > 0 && (
                    <circle
                        cx={parseFloat(coordinates[coordinates.length - 1].split(',')[0])}
                        cy={parseFloat(coordinates[coordinates.length - 1].split(',')[1])}
                        r="3.5"
                        fill="#A855F7"
                        stroke="#FFFFFF"
                        strokeWidth="1.5"
                    />
                )}
            </svg>
        );
    };

    return (
        <div style={{ padding: '40px', background: '#F8FAFC', minHeight: '100vh' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                <div>
                    <BackButton to="/attendance" />
                    <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#0F172A', margin: '12px 0 6px 0', letterSpacing: '-0.5px' }}>
                        Teacher Attendance Logs
                    </h1>
                    <p style={{ fontSize: '14px', color: '#64748B', fontWeight: '500' }}>{dateLabel}</p>
                </div>
                <button
                    onClick={() => navigate('/attendance/teachers/sheet')}
                    style={{
                        padding: '12px 24px', background: '#0F172A', color: '#fff',
                        border: 'none', borderRadius: '14px', fontSize: '14px',
                        fontWeight: '600', cursor: 'pointer',
                        boxShadow: '0 4px 6px -1px rgba(15,23,42,0.15)'
                    }}
                >
                    📋 View Monthly Sheet
                </button>
            </div>

            {/* Date Selector */}
            <div style={{
                background: '#fff', border: '1px solid #E2E8F0',
                borderRadius: '20px', padding: '20px', marginBottom: '28px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A', marginBottom: '14px' }}>
                    Select Date
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <select
                        value={selectedYear}
                        onChange={e => setSelectedYear(Number(e.target.value))}
                        style={{ height: '40px', padding: '0 12px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '14px', color: '#0F172A', fontWeight: '500' }}
                    >
                        {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <select
                        value={selectedMonth}
                        onChange={e => { setSelectedMonth(Number(e.target.value)); setSelectedDay(1); }}
                        style={{ height: '40px', padding: '0 12px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '14px', color: '#0F172A', fontWeight: '500' }}
                    >
                        {monthOptions.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                    <select
                        value={selectedDay}
                        onChange={e => setSelectedDay(Number(e.target.value))}
                        style={{ height: '40px', padding: '0 12px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '14px', color: '#0F172A', fontWeight: '500' }}
                    >
                        {dayOptions.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
            </div>

            {/* Summary Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
                <div style={{ background: '#F0FDF4', borderRadius: '16px', padding: '18px', textAlign: 'center', border: '1px solid #DCFCE7' }}>
                    <div style={{ fontSize: '28px', fontWeight: '800', color: '#16A34A' }}>{presentCount}</div>
                    <div style={{ fontSize: '13px', color: '#15803D', fontWeight: '600', marginTop: '2px' }}>✅ Present</div>
                </div>
                <div style={{ background: '#FEF2F2', borderRadius: '16px', padding: '18px', textAlign: 'center', border: '1px solid #FEE2E2' }}>
                    <div style={{ fontSize: '28px', fontWeight: '800', color: '#DC2626' }}>{absentCount}</div>
                    <div style={{ fontSize: '13px', color: '#B91C1C', fontWeight: '600', marginTop: '2px' }}>❌ Absent</div>
                </div>
                <div style={{ background: '#F8FAFC', borderRadius: '16px', padding: '18px', textAlign: 'center', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '28px', fontWeight: '800', color: '#64748B' }}>{unmarkedCount}</div>
                    <div style={{ fontSize: '13px', color: '#475569', fontWeight: '600', marginTop: '2px' }}>⏳ Unmarked</div>
                </div>
            </div>

            {/* Teacher List */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#64748B', fontSize: '14px' }}>Loading teachers...</div>
            ) : (
                <div style={{ display: 'grid', gap: '12px' }}>
                    {teachers.map(teacher => {
                        const isSaving = saving === teacher.id;
                        return (
                            <div
                                key={teacher.id}
                                style={{
                                    border: '1px solid #E2E8F0',
                                    borderRadius: '16px',
                                    padding: '16px 24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '24px',
                                    transition: 'all 0.2s ease',
                                    background: '#FFFFFF',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.01)'
                                }}
                            >
                                {/* Avatar */}
                                <div style={{
                                    width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
                                    background: teacher.photo_url
                                        ? `url(${teacher.photo_url}) center/cover no-repeat`
                                        : 'linear-gradient(135deg,#A855F7,#EC4899)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#fff', fontSize: '16px', fontWeight: '700',
                                }}
                                >
                                    {!teacher.photo_url && teacher.full_name.charAt(0).toUpperCase()}
                                </div>

                                {/* Info */}
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A' }}>{teacher.full_name}</div>
                                    <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>{teacher.registration_number}</div>
                                </div>

                                {/* Live Sparkline graph for attendance trend */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                                    <span style={{ fontSize: '10px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Attendance Trend</span>
                                    {renderSparkline(teacher.history)}
                                </div>

                                {/* Status badge */}
                                {teacher.isPresent !== null && (
                                    <div style={{
                                        fontSize: '12px', fontWeight: '700', padding: '6px 14px',
                                        borderRadius: '12px',
                                        background: teacher.isPresent ? '#DCFCE7' : '#FEE2E2',
                                        color: teacher.isPresent ? '#15803D' : '#B91C1C',
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
                                            width: '40px', height: '40px', borderRadius: '12px',
                                            border: '2px solid',
                                            borderColor: teacher.isPresent === true ? '#16A34A' : '#E2E8F0',
                                            background: teacher.isPresent === true ? '#16A34A' : '#fff',
                                            color: teacher.isPresent === true ? '#fff' : '#16A34A',
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
                                            width: '40px', height: '40px', borderRadius: '12px',
                                            border: '2px solid',
                                            borderColor: teacher.isPresent === false ? '#DC2626' : '#E2E8F0',
                                            background: teacher.isPresent === false ? '#DC2626' : '#fff',
                                            color: teacher.isPresent === false ? '#fff' : '#DC2626',
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
