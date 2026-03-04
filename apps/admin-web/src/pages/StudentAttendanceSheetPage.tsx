import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { BackButton } from '../components/common';

interface Student {
    id: string;
    full_name: string;
    registration_number: string;
    roll_number?: string;
}

export function StudentAttendanceSheetPage() {
    const { classId } = useParams<{ classId: string }>();

    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
    const [className, setClassName] = useState('');
    const [students, setStudents] = useState<Student[]>([]);
    const [attendanceMap, setAttendanceMap] = useState<Map<string, Map<number, string>>>(new Map());
    const [loading, setLoading] = useState(true);
    const printRef = useRef<HTMLDivElement>(null);

    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    const dayNumbers = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    useEffect(() => {
        if (classId) fetchAll();
    }, [classId, selectedYear, selectedMonth]);

    const fetchAll = async () => {
        setLoading(true);
        try {
            // Fetch class name
            const { data: classData } = await supabase
                .from('classes')
                .select('class_name, section')
                .eq('id', classId)
                .single();
            if (classData) {
                setClassName(`Class ${classData.class_name}${classData.section ? ` - ${classData.section}` : ''}`);
            }

            // Fetch students
            const { data: studentData } = await supabase
                .from('students')
                .select('id, full_name, registration_number, roll_number')
                .eq('class_id', classId)
                .eq('is_active', true)
                .order('roll_number');
            setStudents(studentData || []);

            const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
            const endDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

            const { data: attendanceData } = await supabase
                .from('student_attendance')
                .select('student_id, date, is_present')
                .eq('class_id', classId)
                .gte('date', startDate)
                .lte('date', endDate);

            // Build map: student_id → { day → status }
            const map = new Map<string, Map<number, string>>();
            for (const rec of (attendanceData || [])) {
                const day = new Date(rec.date).getDate();
                if (!map.has(rec.student_id)) map.set(rec.student_id, new Map());
                map.get(rec.student_id)!.set(day, rec.is_present ? 'present' : 'absent');
            }
            setAttendanceMap(map);
        } catch (err) {
            console.error('Error loading sheet:', err);
        } finally {
            setLoading(false);
        }
    };

    // Real-time updates
    useEffect(() => {
        if (!classId) return;
        const channel = supabase
            .channel(`sheet-${classId}-${selectedYear}-${selectedMonth}`)
            .on('postgres_changes', {
                event: '*', schema: 'public', table: 'student_attendance',
                filter: `class_id=eq.${classId}`
            }, () => fetchAll())
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [classId, selectedYear, selectedMonth]);

    const getStatus = (studentId: string, day: number): string => {
        return attendanceMap.get(studentId)?.get(day) || '';
    };

    const getStudentStats = (studentId: string) => {
        const dayMap = attendanceMap.get(studentId) || new Map();
        const present = [...dayMap.values()].filter(s => s === 'present').length;
        const absent = [...dayMap.values()].filter(s => s === 'absent').length;
        const pct = present + absent > 0 ? Math.round((present / (present + absent)) * 100) : '-';
        return { present, absent, pct };
    };

    const handlePrint = () => window.print();

    const handleExcelExport = () => {
        // Build CSV data
        const monthName = new Date(selectedYear, selectedMonth - 1, 1)
            .toLocaleString('default', { month: 'long' });

        const headers = ['Reg No', 'Name', ...dayNumbers.map(d => String(d)), 'Present', 'Absent', '%'];
        const rows = students.map(s => {
            const stats = getStudentStats(s.id);
            const days = dayNumbers.map(d => {
                const status = getStatus(s.id, d);
                return status === 'present' ? 'P' : status === 'absent' ? 'A' : '';
            });
            return [s.registration_number, s.full_name, ...days, String(stats.present), String(stats.absent), `${stats.pct}%`];
        });

        const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance_${className.replace(/\s+/g, '_')}_${monthName}_${selectedYear}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const monthOptions = Array.from({ length: 12 }, (_, i) => ({
        value: i + 1,
        label: new Date(2024, i, 1).toLocaleString('default', { month: 'long' })
    }));

    const yearOptions = [2024, 2025, 2026, 2027];

    return (
        <div style={{ padding: '32px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                    <BackButton to="/attendance/students" />
                    <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#1D1D1F', margin: '8px 0 4px 0' }}>
                        {className} — Attendance Sheet
                    </h1>
                    <p style={{ fontSize: '14px', color: '#86868B' }}>
                        {new Date(selectedYear, selectedMonth - 1, 1).toLocaleString('default', { month: 'long' })} {selectedYear}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Month/Year Selectors */}
                    <select
                        value={selectedMonth}
                        onChange={e => setSelectedMonth(Number(e.target.value))}
                        style={{ height: '40px', padding: '0 12px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.12)', fontSize: '14px', cursor: 'pointer' }}
                    >
                        {monthOptions.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                    <select
                        value={selectedYear}
                        onChange={e => setSelectedYear(Number(e.target.value))}
                        style={{ height: '40px', padding: '0 12px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.12)', fontSize: '14px', cursor: 'pointer' }}
                    >
                        {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <button
                        onClick={handleExcelExport}
                        style={{ height: '40px', padding: '0 16px', background: '#34C759', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        📥 Export CSV
                    </button>
                    <button
                        onClick={handlePrint}
                        style={{ height: '40px', padding: '0 16px', background: '#0071E3', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        🖨️ Print
                    </button>
                </div>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', fontSize: '13px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#34C759', display: 'inline-block' }} />
                    P = Present
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#FF3B30', display: 'inline-block' }} />
                    A = Absent
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#E5E7EB', display: 'inline-block' }} />
                    — = Not Marked
                </span>
                <span style={{ marginLeft: 'auto', fontSize: '13px', color: '#86868B' }}>
                    🔄 Auto-updates when teachers mark attendance
                </span>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '80px', color: '#86868B' }}>Loading attendance sheet...</div>
            ) : students.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px', background: '#fff', borderRadius: '18px', border: '1px solid rgba(0,0,0,0.08)' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
                    <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#1D1D1F' }}>No students in this class</h3>
                </div>
            ) : (
                <div id="sheet-print" ref={printRef} style={{ overflowX: 'auto' }}>
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
                                <th style={{ padding: '12px 8px', textAlign: 'left', position: 'sticky', left: '90px', background: '#1D1D1F', zIndex: 2, minWidth: '160px', fontSize: '11px' }}>
                                    Name
                                </th>
                                {dayNumbers.map(d => (
                                    <th key={d} style={{ padding: '10px 4px', textAlign: 'center', minWidth: '28px', fontWeight: '600', fontSize: '11px' }}>
                                        {d}
                                    </th>
                                ))}
                                <th style={{ padding: '10px 8px', textAlign: 'center', minWidth: '52px', fontSize: '11px', background: '#2D2D2F' }}>
                                    P
                                </th>
                                <th style={{ padding: '10px 8px', textAlign: 'center', minWidth: '52px', fontSize: '11px', background: '#2D2D2F' }}>
                                    A
                                </th>
                                <th style={{ padding: '10px 8px', textAlign: 'center', minWidth: '48px', fontSize: '11px', background: '#2D2D2F' }}>
                                    %
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map((student, idx) => {
                                const stats = getStudentStats(student.id);
                                return (
                                    <tr
                                        key={student.id}
                                        style={{ background: idx % 2 === 0 ? '#fff' : '#F9FAFB' }}
                                    >
                                        <td style={{
                                            padding: '8px', fontSize: '11px', color: '#86868B', fontWeight: '600',
                                            position: 'sticky', left: 0, background: idx % 2 === 0 ? '#fff' : '#F9FAFB',
                                            zIndex: 1, borderRight: '1px solid #E5E7EB'
                                        }}>
                                            {student.registration_number}
                                        </td>
                                        <td style={{
                                            padding: '8px', fontSize: '12px', fontWeight: '600', color: '#1D1D1F',
                                            position: 'sticky', left: '90px', background: idx % 2 === 0 ? '#fff' : '#F9FAFB',
                                            zIndex: 1, borderRight: '2px solid #E5E7EB', whiteSpace: 'nowrap'
                                        }}>
                                            {student.full_name}
                                        </td>
                                        {dayNumbers.map(d => {
                                            const status = getStatus(student.id, d);
                                            return (
                                                <td key={d} style={{ padding: '4px 2px', textAlign: 'center' }}>
                                                    {status === 'present' ? (
                                                        <span style={{
                                                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                            width: '22px', height: '22px', borderRadius: '5px',
                                                            background: '#34C759', color: '#fff', fontSize: '10px', fontWeight: '700'
                                                        }}>P</span>
                                                    ) : status === 'absent' ? (
                                                        <span style={{
                                                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                            width: '22px', height: '22px', borderRadius: '5px',
                                                            background: '#FF3B30', color: '#fff', fontSize: '10px', fontWeight: '700'
                                                        }}>A</span>
                                                    ) : (
                                                        <span style={{
                                                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                            width: '22px', height: '22px', borderRadius: '5px',
                                                            background: '#F3F4F6', color: '#D1D5DB', fontSize: '10px'
                                                        }}>—</span>
                                                    )}
                                                </td>
                                            );
                                        })}
                                        <td style={{ padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: '700', color: '#34C759', background: 'rgba(52,199,89,0.06)' }}>
                                            {stats.present}
                                        </td>
                                        <td style={{ padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: '700', color: '#FF3B30', background: 'rgba(255,59,48,0.06)' }}>
                                            {stats.absent}
                                        </td>
                                        <td style={{
                                            padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: '700',
                                            color: typeof stats.pct === 'number' && stats.pct >= 75 ? '#34C759' : typeof stats.pct === 'number' && stats.pct >= 50 ? '#FF9500' : '#FF3B30'
                                        }}>
                                            {typeof stats.pct === 'number' ? `${stats.pct}%` : '—'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Print styles */}
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    #sheet-print, #sheet-print * { visibility: visible; }
                    #sheet-print { position: absolute; left: 0; top: 0; width: 100%; }
                    body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    @page { size: A4 landscape; margin: 10mm; }
                }
            `}</style>
        </div>
    );
}
