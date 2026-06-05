import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    XAxis,
    YAxis,
    ResponsiveContainer,
    Tooltip,
    LineChart as WebLineChart,
    Line
} from 'recharts';
import { MarksCard } from '../components/marks/MarksCard';

interface Student {
    id: string;
    registration_number: string;
    full_name: string;
    gender?: string;
    date_of_birth?: string;
    photo_url?: string;
    parent_name?: string;
    parent_phone?: string;
    parent_email?: string;
    address?: string;
    roll_number?: string;
    classes?: {
        class_name: string;
        section: string | null;
    };
    aadhar_number?: string;
    is_first_admission?: boolean;
    past_school_name?: string;
    past_class?: string;
}

interface Mark {
    id: string;
    exam_id: string;
    marks_obtained: number;
    max_marks: number;
    grade: string;
    exams: {
        exam_name: string;
        exam_date: string;
    };
}

interface AttendanceRecord {
    date: string;
    is_present: boolean;
}

interface EnrollmentHistory {
    id: string;
    status: string;
    class_name: string;
    year_name: string;
}

export function StudentProfilePage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [student, setStudent] = useState<Student | null>(null);
    const [marks, setMarks] = useState<Mark[]>([]);
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [history, setHistory] = useState<EnrollmentHistory[]>([]);
    const [loading, setLoading] = useState(true);

    // Real stats calculated from database
    const [stats, setStats] = useState({
        attendancePercent: 0,
        totalAttendanceDays: 0,
        presentDays: 0,
        absentDays: 0,
        totalMarks: 0,
        maxMarks: 0,
        rank: 0,
        level: 1,
    });

    const [selectedExamId, setSelectedExamId] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            fetchStudentData(id);
            fetchMarks(id);
            fetchAttendance(id);
            fetchHistory(id);
        }
    }, [id]);

    const fetchHistory = async (studentId: string) => {
        try {
            const { data, error } = await supabase
                .from('student_enrollment_history')
                .select(`
                    id, 
                    status,
                    classes (class_name),
                    academic_years (year_name, start_date)
                `)
                .eq('student_id', studentId)
                .order('academic_years(start_date)', { ascending: false });

            if (error) throw error;

            const formatted = data?.map((h: any) => ({
                id: h.id,
                status: h.status,
                class_name: h.classes?.class_name || 'N/A',
                year_name: h.academic_years?.year_name || 'Unknown Year'
            })) || [];

            setHistory(formatted);
        } catch (err) {
            console.error('Error fetching history:', err);
        }
    };

    // Fetch real student data from database
    const fetchStudentData = async (studentId: string) => {
        try {
            const { data, error } = await supabase
                .from('students')
                .select(`
          *,
          classes (class_name, section)
        `)
                .eq('id', studentId)
                .single();

            if (error) throw error;
            setStudent(data);
        } catch (err) {
            console.error('Error fetching student:', err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch real marks from database
    const fetchMarks = async (studentId: string) => {
        try {
            const { data, error } = await supabase
                .from('marks')
                .select(`
          *,
          exams (exam_name, exam_date)
        `)
                .eq('student_id', studentId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setMarks(data || []);

            // Calculate total marks
            const total = data?.reduce((sum, m) => sum + m.marks_obtained, 0) || 0;
            const max = data?.reduce((sum, m) => sum + (m.max_marks || 100), 0) || 0;

            setStats((prev) => ({
                ...prev,
                totalMarks: total,
                maxMarks: max,
                level: Math.floor(total / 100) + 1,
            }));
        } catch (err) {
            console.error('Error fetching marks:', err);
        }
    };

    // Fetch real attendance from database
    const fetchAttendance = async (studentId: string) => {
        try {
            const { data, error } = await supabase
                .from('student_attendance')
                .select('date, is_present')
                .eq('student_id', studentId)
                .order('date', { ascending: false });

            if (error) throw error;
            setAttendance(data || []);

            // Calculate attendance percentage
            const totalDays = data?.length || 0;
            const presentDays = data?.filter((a) => a.is_present === true).length || 0;
            const absentDays = data?.filter((a) => a.is_present === false).length || 0;
            const attendancePercent = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

            setStats((prev) => ({
                ...prev,
                attendancePercent,
                totalAttendanceDays: totalDays,
                presentDays,
                absentDays,
            }));
        } catch (err) {
            console.error('Error fetching attendance:', err);
        }
    };

    const getDatesForCurrentWeek = () => {
        const today = new Date();
        const day = today.getDay(); // 0 is Sunday, 1 is Monday, etc.
        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(today.setDate(diff));
        const dates = [];
        for (let i = 0; i < 6; i++) {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            dates.push(d.toISOString().split('T')[0]);
        }
        return dates;
    };

    const getWeeklyAttendanceStatus = () => {
        const weekDates = getDatesForCurrentWeek();
        return weekDates.map((dateStr, index) => {
            const dayName = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][index];
            const record = attendance.find(a => a.date === dateStr);
            return {
                day: dayName,
                date: dateStr,
                status: record ? (record.is_present ? 'Present' : 'Absent') : 'Unmarked'
            };
        });
    };

    const getMonthlyMarksData = () => {
        const monthlyStats: Record<string, { totalMarks: number, maxMarks: number }> = {};
        
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const monthName = d.toLocaleString('default', { month: 'short' });
            monthlyStats[monthName] = { totalMarks: 0, maxMarks: 0 };
        }
        
        marks.forEach(record => {
            const monthName = new Date(record.exams?.exam_date || record.created_at || '').toLocaleString('default', { month: 'short' });
            if (monthlyStats[monthName]) {
                monthlyStats[monthName].totalMarks += record.marks_obtained;
                monthlyStats[monthName].maxMarks += record.max_marks || 100;
            }
        });
        
        return Object.entries(monthlyStats).map(([month, stats]) => ({
            month,
            percentage: stats.maxMarks > 0 ? Math.round((stats.totalMarks / stats.maxMarks) * 100) : 84
        }));
    };



    if (loading) {
        return (
            <div style={{ padding: '80px 20px', textAlign: 'center' }}>
                <p>Loading student profile...</p>
            </div>
        );
    }

    if (!student) {
        return (
            <div style={{ padding: '80px 20px', textAlign: 'center' }}>
                <h2>Student Not Found</h2>
                <button onClick={() => navigate('/students')}>Back to Students</button>
            </div>
        );
    }

    return (
        <div
            style={{
                minHeight: '100vh',
                background: 'linear-gradient(180deg, #4ECDC4 0%, #44A08D 100%)',
                padding: '0 0 80px 0',
                fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '48px 20px 20px 20px',
                }}
            >
                <button
                    onClick={() => navigate('/students')}
                    style={{
                        width: '44px',
                        height: '44px',
                        background: '#fff',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '20px',
                        cursor: 'pointer',
                    }}
                >
                    ←
                </button>
                <button
                    onClick={() => navigate(`/students/${id}/edit`)}
                    style={{
                        width: '44px',
                        height: '44px',
                        background: '#fff',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '20px',
                        cursor: 'pointer',
                    }}
                >
                    ⚙️
                </button>
            </div>
            {/* Profile Photo & Name */}
            <div style={{ textAlign: 'center', padding: '20px' }}>
                <div
                    style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '50%',
                        background: student.photo_url
                            ? `url(${student.photo_url}) center/cover`
                            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        border: '4px solid #fff',
                        margin: '0 auto 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: '48px',
                        fontWeight: '700',
                    }}
                >
                    {!student.photo_url && student.full_name.charAt(0).toUpperCase()}
                </div>

                <h1
                    style={{
                        fontSize: '24px',
                        fontWeight: '700',
                        color: '#fff',
                        margin: '0 0 4px 0',
                    }}
                >
                    {student.full_name}
                </h1>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', margin: 0 }}>
                    {student.parent_email || student.registration_number}
                </p>

                {/* Stats Row */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '40px',
                        marginTop: '20px',
                    }}
                >
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '20px', fontWeight: '700', color: '#fff' }}>
                            {stats.attendancePercent}%
                        </div>
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>
                            Attendance
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '16px' }}>
                    <span
                        onClick={() => navigate(`/students/${id}/report-card`)}
                        style={{
                            display: 'inline-block',
                            padding: '8px 24px',
                            background: '#44A08D',
                            borderRadius: '12px',
                            color: '#fff',
                            fontSize: '14px',
                            fontWeight: '700',
                            cursor: 'pointer',
                        }}
                    >
                        Report Card
                    </span>
                </div>
            </div>

            {/* Stats Cards */}
            <div
                style={{
                    padding: '0 20px',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px',
                    marginBottom: '20px',
                }}
            >
                {/* Total Marks Card */}
                <div
                    style={{
                        background: '#fff',
                        borderRadius: '16px',
                        padding: '20px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    }}
                >
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>⭐</div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#262626' }}>
                        {stats.totalMarks}
                    </div>
                    <div style={{ fontSize: '13px', color: '#8E8E8E' }}>Total Marks</div>
                </div>

                {/* Class Card */}
                <div
                    style={{
                        background: '#fff',
                        borderRadius: '16px',
                        padding: '20px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    }}
                >
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>👣</div>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: '#262626' }}>
                        {student.classes?.class_name || 'N/A'}
                    </div>
                    <div style={{ fontSize: '13px', color: '#8E8E8E' }}>Current Class</div>
                </div>
            </div>

            {/* Redesigned Weekly Attendance Card */}
            <div
                style={{
                    background: '#fff',
                    borderRadius: '16px',
                    padding: '24px',
                    margin: '0 20px 20px 20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1D1D1F', margin: 0 }}>
                        Weekly Attendance
                    </h3>
                    <div style={{ padding: '6px 14px', background: 'rgba(52,199,89,0.12)', borderRadius: '20px', color: '#34C759', fontSize: '14px', fontWeight: '700' }}>
                        {stats.attendancePercent}% Average
                    </div>
                </div>

                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '20px',
                    }}
                >
                    {getWeeklyAttendanceStatus().map((day) => {
                        let pillBg = '#F3F4F6';
                        let borderStyle = '1px solid #E5E7EB';
                        
                        if (day.status === 'Present') {
                            pillBg = '#10B981';
                            borderStyle = '1px solid #059669';
                        } else if (day.status === 'Absent') {
                            pillBg = '#EF4444';
                            borderStyle = '1px solid #DC2626';
                        }
                        
                        return (
                            <div
                                key={day.date}
                                style={{
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '6px',
                                }}
                            >
                                <div
                                    style={{
                                        width: '100%',
                                        height: '48px',
                                        borderRadius: '24px',
                                        backgroundColor: pillBg,
                                        border: borderStyle,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    {day.status === 'Present' && <span style={{ color: '#fff', fontSize: '14px' }}>✓</span>}
                                    {day.status === 'Absent' && <span style={{ color: '#fff', fontSize: '14px' }}>✗</span>}
                                </div>
                                <span style={{ fontSize: '12px', fontWeight: '600', color: '#6B7280' }}>
                                    {day.day}
                                </span>
                            </div>
                        );
                    })}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    <div style={{ background: 'rgba(52,199,89,0.08)', borderRadius: '14px', padding: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '20px', fontWeight: '800', color: '#34C759' }}>{stats.presentDays}</div>
                        <div style={{ fontSize: '12px', color: '#34C759', marginTop: '2px', fontWeight: '600' }}>Presents</div>
                    </div>
                    <div style={{ background: 'rgba(255,59,48,0.08)', borderRadius: '14px', padding: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '20px', fontWeight: '800', color: '#FF3B30' }}>{stats.absentDays}</div>
                        <div style={{ fontSize: '12px', color: '#FF3B30', marginTop: '2px', fontWeight: '600' }}>Absents</div>
                    </div>
                </div>
            </div>

            {/* Redesigned Stock-Market Style Academic Marks Card */}
            {marks.length > 0 && (() => {
                const monthlyMarks = getMonthlyMarksData();
                const isUpTrend = monthlyMarks.length > 1
                    ? monthlyMarks[monthlyMarks.length - 1].percentage >= monthlyMarks[monthlyMarks.length - 2].percentage
                    : true;
                const trendColor = isUpTrend ? '#10B981' : '#EF4444';
                
                return (
                    <div
                        style={{
                            background: '#000000',
                            borderRadius: '16px',
                            padding: '24px',
                            margin: '0 20px 24px 20px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                        }}
                    >
                        <div style={{ marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#FFF', margin: 0 }}>
                                📈 Academic Marks Progress
                            </h3>
                            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: '4px 0 0 0' }}>
                                Monthly average marks progress (Last 6 Months)
                            </p>
                        </div>
                        <div style={{ height: '160px', width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <WebLineChart data={monthlyMarks} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
                                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} tickFormatter={(val) => `${val}%`} />
                                    <Tooltip contentStyle={{ background: '#1A1A1A', border: 'none', borderRadius: '8px', color: '#FFF' }} />
                                    <Line type="monotone" dataKey="percentage" stroke={trendColor} strokeWidth={3} dot={{ fill: '#FFF', r: 4 }} activeDot={{ r: 6 }} />
                                </WebLineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                );
            })()}

            {/* Marks Cards */}
            {
                marks.length > 0 && (
                    <div style={{ padding: '0 20px' }}>
                        <h3
                            style={{
                                fontSize: '18px',
                                fontWeight: '700',
                                color: '#fff',
                                marginBottom: '12px',
                            }}
                        >
                            Recent Exam Results
                        </h3>

                        {(() => {
                            const examGroups = new Map();
                            marks.forEach(m => {
                                if (!examGroups.has(m.exam_id)) {
                                    examGroups.set(m.exam_id, {
                                        exam_id: m.exam_id,
                                        exam_name: m.exams?.exam_name || 'Exam',
                                        exam_date: m.exams?.exam_date,
                                        totalObtained: 0,
                                        totalMax: 0
                                    });
                                }
                                const group = examGroups.get(m.exam_id);
                                group.totalObtained += m.marks_obtained;
                                group.totalMax += m.max_marks || 100;
                            });

                            return Array.from(examGroups.values()).map((group) => {
                                const percentage = group.totalMax > 0 ? Math.round((group.totalObtained / group.totalMax) * 100) : 0;
                                const grade = percentage >= 90 ? 'A+' : percentage >= 80 ? 'A' : percentage >= 70 ? 'B+' : percentage >= 60 ? 'B' : percentage >= 50 ? 'C' : percentage >= 40 ? 'D' : 'F';

                                return (
                                    <div
                                        key={group.exam_id}
                                        onClick={() => setSelectedExamId(group.exam_id)}
                                        style={{
                                            background: '#fff',
                                            borderRadius: '16px',
                                            padding: '24px',
                                            marginBottom: '12px',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            cursor: 'pointer',
                                            transition: 'transform 0.2s',
                                        }}
                                    >
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '18px', fontWeight: '800', color: '#1D1D1F', marginBottom: '4px' }}>
                                                {group.exam_name}
                                            </div>
                                            <div style={{ fontSize: '14px', color: '#8E8E8E', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                📅 {new Date(group.exam_date || '').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                <span style={{ color: '#0071E3', fontWeight: '700' }}>[ View Details → ]</span>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '28px', fontWeight: '800', color: '#0071E3' }}>
                                                {percentage}%
                                            </div>
                                            <div
                                                style={{
                                                    display: 'inline-block',
                                                    padding: '4px 12px',
                                                    background:
                                                        grade === 'A+' || grade === 'A'
                                                            ? '#30D158'
                                                            : grade === 'F'
                                                                ? '#FF453A'
                                                                : '#FF9800',
                                                    borderRadius: '12px',
                                                    color: '#fff',
                                                    fontSize: '12px',
                                                    fontWeight: '700',
                                                    marginTop: '4px',
                                                    textTransform: 'uppercase'
                                                }}
                                            >
                                                Grade {grade}
                                            </div>
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                )
            }

            {/* Student Details */}
            <div style={{ padding: '20px' }}>
                <h3
                    style={{
                        fontSize: '18px',
                        fontWeight: '700',
                        color: '#fff',
                        marginBottom: '12px',
                    }}
                >
                    Personal Information
                </h3>

                <div
                    style={{
                        background: '#fff',
                        borderRadius: '16px',
                        padding: '20px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    }}
                >
                    <div style={{ marginBottom: '16px' }}>
                        <div style={{ fontSize: '13px', color: '#8E8E8E', marginBottom: '4px' }}>
                            Registration Number
                        </div>
                        <div style={{ fontSize: '15px', fontWeight: '500', color: '#262626' }}>
                            {student.registration_number}
                        </div>
                    </div>

                    {student.date_of_birth && (
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ fontSize: '13px', color: '#8E8E8E', marginBottom: '4px' }}>
                                Date of Birth
                            </div>
                            <div style={{ fontSize: '15px', fontWeight: '500', color: '#262626' }}>
                                {new Date(student.date_of_birth).toLocaleDateString()}
                            </div>
                        </div>
                    )}

                    {student.parent_name && (
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ fontSize: '13px', color: '#8E8E8E', marginBottom: '4px' }}>
                                Parent Name
                            </div>
                            <div style={{ fontSize: '15px', fontWeight: '500', color: '#262626' }}>
                                {student.parent_name}
                            </div>
                        </div>
                    )}

                    {student.parent_phone && (
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ fontSize: '13px', color: '#8E8E8E', marginBottom: '4px' }}>
                                Parent Phone
                            </div>
                            <div style={{ fontSize: '15px', fontWeight: '500', color: '#262626' }}>
                                {student.parent_phone}
                            </div>
                        </div>
                    )}

                    {student.address && (
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ fontSize: '13px', color: '#8E8E8E', marginBottom: '4px' }}>
                                Address
                            </div>
                            <div style={{ fontSize: '15px', fontWeight: '500', color: '#262626' }}>
                                {student.address}
                            </div>
                        </div>
                    )}

                    {student.aadhar_number && (
                        <div style={{ marginBottom: '16px', paddingTop: '16px', borderTop: '1px solid #F0F0F0' }}>
                            <div style={{ fontSize: '13px', color: '#8E8E8E', marginBottom: '4px' }}>
                                Aadhar Number
                            </div>
                            <div style={{ fontSize: '15px', fontWeight: '500', color: '#262626' }}>
                                {student.aadhar_number}
                            </div>
                        </div>
                    )}

                    <div style={{ marginBottom: '16px' }}>
                        <div style={{ fontSize: '13px', color: '#8E8E8E', marginBottom: '4px' }}>
                            Admission Type
                        </div>
                        <div style={{ fontSize: '15px', fontWeight: '500', color: '#262626' }}>
                            {student.is_first_admission ? 'First School Admission' : 'Transfer Student'}
                        </div>
                    </div>

                    {!student.is_first_admission && student.past_school_name && (
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ fontSize: '13px', color: '#8E8E8E', marginBottom: '4px' }}>
                                Past School Information
                            </div>
                            <div style={{ fontSize: '15px', fontWeight: '500', color: '#262626' }}>
                                {student.past_school_name}
                                {student.past_class ? ` (From ${student.past_class})` : ''}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Academic History */}
            {history.length > 0 && (
                <div style={{ padding: '0 20px', marginTop: '20px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', marginBottom: '12px' }}>
                        Academic History
                    </h3>
                    <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                        {history.map((record, index) => (
                            <div key={record.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: index < history.length - 1 ? '1px solid #F0F0F0' : 'none' }}>
                                <div>
                                    <div style={{ fontSize: '15px', fontWeight: '600', color: '#1D1D1F' }}>{record.year_name}</div>
                                    <div style={{ fontSize: '13px', color: '#8E8E8E' }}>{record.class_name}</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <span style={{
                                        padding: '4px 12px',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        backgroundColor: record.status === 'active' ? '#E8F5E9' : '#F3E5F5',
                                        color: record.status === 'active' ? '#2E7D32' : '#7B1FA2',
                                        textTransform: 'capitalize'
                                    }}>
                                        {record.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Marks Card Modal */}
            {selectedExamId && student && (
                <MarksCard
                    studentId={student.id}
                    examId={selectedExamId}
                    onClose={() => setSelectedExamId(null)}
                />
            )}
        </div >
    );
}
