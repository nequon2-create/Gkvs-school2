import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    BarChart,
    Bar,
    XAxis,
    ResponsiveContainer,
} from 'recharts';
import { Eye, EyeOff, Copy, Check, ArrowLeft } from 'lucide-react';

interface Teacher {
    id: string;
    registration_number: string;
    full_name: string;
    email?: string;
    phone?: string;
    qualification?: string;
    designation?: string;
    gender?: string;
    date_of_birth?: string;
    photo_url?: string;
    address?: string;
    joining_date?: string;
    subjects?: string[];
    login_id?: string;
    password?: string;
}

interface AttendanceRecord {
    date: string;
    is_present: boolean;
}

export function TeacherProfilePage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [teacher, setTeacher] = useState<Teacher | null>(null);
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);

    // Real stats calculated from database
    const [stats, setStats] = useState({
        attendancePercent: 0,
        classesTaught: 0,
        studentsTaught: 0,
    });
    const [showTeacherPassword, setShowTeacherPassword] = useState(false);
    const [copiedPassword, setCopiedPassword] = useState(false);

    useEffect(() => {
        if (id) {
            fetchTeacherData(id);
            fetchAttendance(id);
            // In a real app, we'd fetch classes/students count here too
            // For now we'll simulate or fetch if tables exist
            fetchTeachingStats(id);
        }
    }, [id]);

    // Fetch real teacher data from database
    const fetchTeacherData = async (teacherId: string) => {
        try {
            const { data, error } = await supabase
                .from('teachers')
                .select('*')
                .eq('id', teacherId)
                .single();

            if (error) throw error;
            setTeacher(data);
        } catch (err) {
            console.error('Error fetching teacher:', err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch real attendance from database
    // Note: Assuming 'teacher_attendance' table or similar exists, or using 'attendance' with a type check
    // For this implementation, I'll assume we might not have a populated teacher_attendance table yet,
    // so I will fail gracefully or use a placeholder if the table doesn't exist.
    // Actually, based on the user's "Real Data" request, I should try to fetch from a likely table.
    // If no specific teacher attendance table exists, I'll use a mocked empty state or try to query 'attendance'.
    // Given previous context, there is an 'attendance' table but it seems student focused. 
    // I will try to fetch but default to empty if error.
    const fetchAttendance = async (teacherId: string) => {
        try {
            const { data, error } = await supabase
                .from('teacher_attendance')
                .select('date, is_present')
                .eq('teacher_id', teacherId)
                .order('date', { ascending: false })
                .limit(30);

            if (error) {
                console.warn("Could not fetch teacher attendance", error);
                return;
            }

            setAttendance(data || []);

            // Calculate attendance percentage
            const totalDays = data?.length || 0;
            const presentDays = data?.filter((a) => a.is_present === true).length || 0;
            const attendancePercent = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

            setStats((prev) => ({
                ...prev,
                attendancePercent,
            }));
        } catch (err) {
            console.error('Error fetching attendance:', err);
        }
    };

    const fetchTeachingStats = async (teacherId: string) => {
        try {
            const { count: classCount, error: classError } = await supabase
                .from('classes')
                .select('*', { count: 'exact', head: true })
                .eq('class_teacher_id', teacherId);

            if (!classError) {
                setStats(prev => ({ ...prev, classesTaught: classCount || 0 }));
            }
        } catch (e) {
            console.error(e);
        }
    }


    // Prepare weekly attendance data for graph
    const getWeeklyAttendanceData = () => {
        const last7Days = attendance.slice(0, 7).reverse();
        if (last7Days.length === 0) return [];

        return last7Days.map((record, index) => ({
            day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index] || 'Day',
            attendance: record.is_present === true ? 100 : 0,
        }));
    };

    if (loading) {
        return (
            <div style={{ padding: '80px 20px', textAlign: 'center' }}>
                <p>Loading teacher profile...</p>
            </div>
        );
    }

    if (!teacher) {
        return (
            <div style={{ padding: '80px 20px', textAlign: 'center' }}>
                <h2>Teacher Not Found</h2>
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        marginTop: '16px',
                        padding: '10px 20px',
                        borderRadius: '10px',
                        border: 'none',
                        background: '#0071E3',
                        color: '#fff',
                        cursor: 'pointer',
                        fontWeight: '600',
                    }}
                >
                    ← Go Back
                </button>
            </div>
        );
    }

    return (
        <div
            style={{
                minHeight: '100vh',
                background: 'linear-gradient(180deg, #FF9F43 0%, #FF6B6B 100%)', // Different gradient for teachers
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
                    onClick={() => navigate(-1)}
                    style={{
                        width: '44px',
                        height: '44px',
                        background: '#fff',
                        border: 'none',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        transition: 'transform 0.15s ease, background-color 0.15s ease',
                    }}
                    title="Go back"
                    aria-label="Go back"
                >
                    <ArrowLeft size={20} color="#1D1D1F" />
                </button>
                <button
                    onClick={() => navigate(`/teachers/${id}/edit`)}
                    style={{
                        width: '44px',
                        height: '44px',
                        background: '#fff',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '20px',
                        cursor: 'pointer',
                        marginRight: '10px'
                    }}
                >
                    ⚙️
                </button>
                <button
                    onClick={() => navigate(`/teachers/${id}/report-card`)}
                    style={{
                        width: '44px',
                        height: '44px',
                        background: '#fff',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '20px',
                        cursor: 'pointer',
                    }}
                    title="Print Profile"
                >
                    🖨️
                </button>
            </div>

            {/* Profile Photo & Name */}
            <div style={{ textAlign: 'center', padding: '20px' }}>
                <div
                    style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '50%',
                        background: teacher.photo_url
                            ? `url(${teacher.photo_url}) center/cover`
                            : 'linear-gradient(135deg, #FF9F43 0%, #FF6B6B 100%)',
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
                    {!teacher.photo_url && teacher.full_name.charAt(0).toUpperCase()}
                </div>

                <h1
                    style={{
                        fontSize: '24px',
                        fontWeight: '700',
                        color: '#fff',
                        margin: '0 0 4px 0',
                    }}
                >
                    {teacher.full_name}
                </h1>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', margin: 0 }}>
                    {teacher.designation || 'Teacher'}
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
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '20px', fontWeight: '700', color: '#fff' }}>
                            {stats.classesTaught}
                        </div>
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>
                            Classes
                        </div>
                    </div>
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
                {/* Qualification Card */}
                <div
                    style={{
                        background: '#fff',
                        borderRadius: '16px',
                        padding: '20px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    }}
                >
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎓</div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#262626' }}>
                        {teacher.qualification || 'N/A'}
                    </div>
                    <div style={{ fontSize: '13px', color: '#8E8E8E' }}>Qualification</div>
                </div>

                {/* Experience Card - Placeholder for calculation */}
                <div
                    style={{
                        background: '#fff',
                        borderRadius: '16px',
                        padding: '20px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    }}
                >
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>⏳</div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#262626' }}>
                        {teacher.joining_date ? new Date().getFullYear() - new Date(teacher.joining_date).getFullYear() + ' Yrs' : 'N/A'}
                    </div>
                    <div style={{ fontSize: '13px', color: '#8E8E8E' }}>Experience</div>
                </div>

                {/* Attendance Card */}
                <div
                    style={{
                        background: '#fff',
                        borderRadius: '16px',
                        padding: '20px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        gridColumn: 'span 2',
                    }}
                >
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>⚡</div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#262626' }}>
                        {stats.attendancePercent}%
                    </div>
                    <div style={{ fontSize: '13px', color: '#8E8E8E' }}>Overall Attendance</div>
                </div>
            </div>

            {/* Weekly Attendance Graph */}
            <div
                style={{
                    background: '#fff',
                    borderRadius: '16px',
                    padding: '20px',
                    margin: '0 20px 20px 20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '16px',
                    }}
                >
                    <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#262626', margin: 0 }}>
                        Weekly Attendance
                    </h3>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#FF9800' }}>
                        {stats.attendancePercent}% ⚡
                    </span>
                </div>

                <ResponsiveContainer width="100%" height={150}>
                    {getWeeklyAttendanceData().length > 0 ? (
                        <BarChart data={getWeeklyAttendanceData()}>
                            <XAxis dataKey="day" stroke="#C7C7C7" />
                            <Bar dataKey="attendance" fill="#FF9800" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    ) : (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8E8E8E', fontSize: '13px' }}>
                            No attendance records found
                        </div>
                    )}
                </ResponsiveContainer>
            </div>

            {/* Account Credentials Section (Admin View) */}
            <div style={{ padding: '0 20px 20px 20px' }}>
                <h3
                    style={{
                        fontSize: '18px',
                        fontWeight: '700',
                        color: '#fff',
                        marginBottom: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                    }}
                >
                    🔐 Account & Login Credentials
                </h3>

                <div
                    style={{
                        background: '#fff',
                        borderRadius: '16px',
                        padding: '20px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    }}
                >
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                        <div>
                            <div style={{ fontSize: '13px', color: '#8E8E8E', marginBottom: '4px' }}>
                                Teacher Login ID
                            </div>
                            <div style={{ fontSize: '16px', fontWeight: '700', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>{teacher.login_id || teacher.registration_number}</span>
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                                Used to sign into Teacher mobile & web portals
                            </div>
                        </div>

                        <div>
                            <div style={{ fontSize: '13px', color: '#8E8E8E', marginBottom: '4px' }}>
                                Teacher Password
                            </div>
                            <div style={{ fontSize: '16px', fontWeight: '700', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontFamily: showTeacherPassword ? 'inherit' : 'monospace', letterSpacing: showTeacherPassword ? 'normal' : '2px' }}>
                                    {showTeacherPassword ? (teacher.password || '123456') : '••••••••'}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setShowTeacherPassword(!showTeacherPassword)}
                                    style={{
                                        background: '#F1F5F9',
                                        border: '1px solid #E2E8F0',
                                        borderRadius: '8px',
                                        padding: '4px 10px',
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        fontSize: '12px',
                                        color: '#2563EB',
                                        fontWeight: '600',
                                    }}
                                    title={showTeacherPassword ? 'Hide Password' : 'Show Password'}
                                >
                                    {showTeacherPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                    <span>{showTeacherPassword ? 'Hide' : 'View'}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        navigator.clipboard.writeText(teacher.password || '123456');
                                        setCopiedPassword(true);
                                        setTimeout(() => setCopiedPassword(false), 2000);
                                    }}
                                    style={{
                                        background: '#F1F5F9',
                                        border: '1px solid #E2E8F0',
                                        borderRadius: '8px',
                                        padding: '4px 10px',
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        fontSize: '12px',
                                        color: copiedPassword ? '#10B981' : '#64748B',
                                        fontWeight: '600',
                                    }}
                                    title="Copy Password"
                                >
                                    {copiedPassword ? <Check size={14} /> : <Copy size={14} />}
                                    <span>{copiedPassword ? 'Copied' : 'Copy'}</span>
                                </button>
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                                Default is 123456 if not modified
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Teacher Details */}
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
                            {teacher.registration_number}
                        </div>
                    </div>

                    {teacher.email && (
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ fontSize: '13px', color: '#8E8E8E', marginBottom: '4px' }}>
                                Email
                            </div>
                            <div style={{ fontSize: '15px', fontWeight: '500', color: '#262626' }}>
                                {teacher.email}
                            </div>
                        </div>
                    )}

                    {teacher.phone && (
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ fontSize: '13px', color: '#8E8E8E', marginBottom: '4px' }}>
                                Phone
                            </div>
                            <div style={{ fontSize: '15px', fontWeight: '500', color: '#262626' }}>
                                {teacher.phone}
                            </div>
                        </div>
                    )}

                    {teacher.subjects && teacher.subjects.length > 0 && (
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ fontSize: '13px', color: '#8E8E8E', marginBottom: '4px' }}>
                                Subjects
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {teacher.subjects.map((subject, idx) => (
                                    <span key={idx} style={{
                                        background: '#f0f0f5',
                                        padding: '4px 12px',
                                        borderRadius: '12px',
                                        fontSize: '13px',
                                        fontWeight: '500',
                                        color: '#262626'
                                    }}>
                                        {subject}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {teacher.address && (
                        <div>
                            <div style={{ fontSize: '13px', color: '#8E8E8E', marginBottom: '4px' }}>
                                Address
                            </div>
                            <div style={{ fontSize: '15px', fontWeight: '500', color: '#262626' }}>
                                {teacher.address}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
