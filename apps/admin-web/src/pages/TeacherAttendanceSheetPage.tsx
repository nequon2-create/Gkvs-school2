import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BackButton } from '../components/common';

interface Teacher {
    id: string;
    full_name: string;
    registration_number: string;
}

export function TeacherAttendanceSheetPage() {
    const nowIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const [selectedYear, setSelectedYear] = useState(nowIST.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(nowIST.getMonth() + 1);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [attendanceMap, setAttendanceMap] = useState<Map<string, Map<number, boolean>>>(new Map());
    const [loading, setLoading] = useState(true);

    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    const dayNumbers = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    useEffect(() => {
        fetchAll();
    }, [selectedYear, selectedMonth]);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const { data: teacherData } = await supabase
                .from('teachers')
                .select('id, full_name, registration_number')
                .order('full_name');
            setTeachers(teacherData || []);

            const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
            const endDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

            const { data: attData } = await supabase
                .from('teacher_attendance')
                .select('teacher_id, date, is_present')
                .gte('date', startDate)
                .lte('date', endDate);

            const map = new Map<string, Map<number, boolean>>();
            for (const rec of (attData || [])) {
                const day = new Date(rec.date).getDate();
                if (!map.has(rec.teacher_id)) map.set(rec.teacher_id, new Map());
                map.get(rec.teacher_id)!.set(day, rec.is_present);
            }
            setAttendanceMap(map);
        } catch (err) {
            console.error('Error loading teacher sheet:', err);
        } finally {
            setLoading(false);
        }
    };

    const getStatus = (teacherId: string, day: number): boolean | null => {
        const dayMap = attendanceMap.get(teacherId);
        if (!dayMap || !dayMap.has(day)) return null;
        return dayMap.get(day)!;
    };

    const getTeacherStats = (teacherId: string) => {
        const dayMap = attendanceMap.get(teacherId) || new Map<number, boolean>();
        const present = [...dayMap.values()].filter(v => v === true).length;
        const absent = [...dayMap.values()].filter(v => v === false).length;
        const pct = present + absent > 0 ? Math.round((present / (present + absent)) * 100) : null;
        return { present, absent, pct };
    };

    const handleExport = () => {
        const monthName = new Date(selectedYear, selectedMonth - 1, 1)
            .toLocaleString('default', { month: 'long' });
        const headers = ['Reg No', 'Name', ...dayNumbers.map(String), 'Present', 'Absent', '%'];
        const rows = teachers.map(t => {
            const stats = getTeacherStats(t.id);
            const days = dayNumbers.map(d => {
                const s = getStatus(t.id, d);
                return s === true ? 'P' : s === false ? 'A' : '';
            });
            return [t.registration_number, t.full_name, ...days, String(stats.present), String(stats.absent), stats.pct != null ? `${stats.pct}%` : '—'];
        });
        const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `teacher_attendance_${monthName}_${selectedYear}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const monthOptions = Array.from({ length: 12 }, (_, i) => ({
        value: i + 1,
        label: new Date(2024, i, 1).toLocaleString('default', { month: 'long' })
    }));

    return (
        <div style={{ padding: '32px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                    <BackButton to="/attendance/teachers" />
                    <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#1D1D1F', margin: '8px 0 4px 0' }}>
                        Teacher Attendance Sheet
                    </h1>
                    <p style={{ fontSize: '14px', color: '#86868B' }}>
                        {new Date(selectedYear, selectedMonth - 1, 1).toLocaleString('default', { month: 'long' })} {selectedYear}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <select
                        value={selectedMonth}
                        onChange={e => setSelectedMonth(Number(e.target.value))}
                        style={{ height: '40px', padding: '0 12px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.12)', fontSize: '14px' }}
                    >
                        {monthOptions.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                    <select
                        value={selectedYear}
                        onChange={e => setSelectedYear(Number(e.target.value))}
                        style={{ height: '40px', padding: '0 12px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.12)', fontSize: '14px' }}
                    >
                        {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <button
                        onClick={handleExport}
                        style={{ height: '40px', padding: '0 16px', background: '#34C759', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
                    >
                        📥 Export CSV
                    </button>
                    <button
                        onClick={() => window.print()}
                        style={{ height: '40px', padding: '0 16px', background: '#0071E3', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
                    >
                        🖨️ Print
                    </button>
                </div>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', fontSize: '13px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '14px', height: '14px', borderRadius: '4px', background: '#34C759', display: 'inline-block' }} /> P = Present
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '14px', height: '14px', borderRadius: '4px', background: '#FF3B30', display: 'inline-block' }} /> A = Absent
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '14px', height: '14px', borderRadius: '4px', background: '#E5E7EB', display: 'inline-block' }} /> — = Not Marked
                </span>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '80px', color: '#86868B' }}>Loading...</div>
            ) : teachers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px', background: '#fff', borderRadius: '18px', border: '1px solid rgba(0,0,0,0.08)' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>👨‍🏫</div>
                    <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#1D1D1F' }}>No teachers found</h3>
                </div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{
                        width: '100%', borderCollapse: 'collapse', fontSize: '12px',
                        background: '#fff', borderRadius: '16px', overflow: 'hidden',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    }}>
                        <thead>
                            <tr style={{ background: '#1D1D1F', color: '#fff' }}>
                                <th style={{ padding: '12px 8px', textAlign: 'left', position: 'sticky', left: 0, background: '#1D1D1F', zIndex: 2, minWidth: '90px', fontSize: '11px' }}>
                                    Reg No
                                </th>
                                <th style={{ padding: '12px 8px', textAlign: 'left', position: 'sticky', left: '90px', background: '#1D1D1F', zIndex: 2, minWidth: '180px', fontSize: '11px' }}>
                                    Teacher Name
                                </th>
                                {dayNumbers.map(d => (
                                    <th key={d} style={{ padding: '10px 4px', textAlign: 'center', minWidth: '28px', fontSize: '11px' }}>
                                        {d}
                                    </th>
                                ))}
                                <th style={{ padding: '10px 8px', textAlign: 'center', minWidth: '50px', fontSize: '11px', background: '#2D2D2F' }}>P</th>
                                <th style={{ padding: '10px 8px', textAlign: 'center', minWidth: '50px', fontSize: '11px', background: '#2D2D2F' }}>A</th>
                                <th style={{ padding: '10px 8px', textAlign: 'center', minWidth: '50px', fontSize: '11px', background: '#2D2D2F' }}>%</th>
                            </tr>
                        </thead>
                        <tbody>
                            {teachers.map((teacher, idx) => {
                                const stats = getTeacherStats(teacher.id);
                                return (
                                    <tr key={teacher.id} style={{ background: idx % 2 === 0 ? '#fff' : '#F9FAFB' }}>
                                        <td style={{
                                            padding: '8px', fontSize: '11px', color: '#86868B', fontWeight: '600',
                                            position: 'sticky', left: 0, background: idx % 2 === 0 ? '#fff' : '#F9FAFB',
                                            zIndex: 1, borderRight: '1px solid #E5E7EB'
                                        }}>
                                            {teacher.registration_number}
                                        </td>
                                        <td style={{
                                            padding: '8px', fontSize: '12px', fontWeight: '600', color: '#1D1D1F',
                                            position: 'sticky', left: '90px', background: idx % 2 === 0 ? '#fff' : '#F9FAFB',
                                            zIndex: 1, borderRight: '2px solid #E5E7EB', whiteSpace: 'nowrap'
                                        }}>
                                            {teacher.full_name}
                                        </td>
                                        {dayNumbers.map(d => {
                                            const status = getStatus(teacher.id, d);
                                            return (
                                                <td key={d} style={{ padding: '4px 2px', textAlign: 'center' }}>
                                                    {status === true ? (
                                                        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '5px', background: '#34C759', color: '#fff', fontSize: '10px', fontWeight: '700' }}>P</span>
                                                    ) : status === false ? (
                                                        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '5px', background: '#FF3B30', color: '#fff', fontSize: '10px', fontWeight: '700' }}>A</span>
                                                    ) : (
                                                        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '5px', background: '#F3F4F6', color: '#D1D5DB', fontSize: '10px' }}>—</span>
                                                    )}
                                                </td>
                                            );
                                        })}
                                        <td style={{ padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: '700', color: '#34C759', background: 'rgba(52,199,89,0.06)' }}>{stats.present}</td>
                                        <td style={{ padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: '700', color: '#FF3B30', background: 'rgba(255,59,48,0.06)' }}>{stats.absent}</td>
                                        <td style={{
                                            padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: '700',
                                            color: stats.pct == null ? '#86868B' : stats.pct >= 75 ? '#34C759' : stats.pct >= 50 ? '#FF9500' : '#FF3B30'
                                        }}>
                                            {stats.pct != null ? `${stats.pct}%` : '—'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    .print-table, .print-table * { visibility: visible; }
                    @page { size: A4 landscape; margin: 10mm; }
                }
            `}</style>
        </div>
    );
}
