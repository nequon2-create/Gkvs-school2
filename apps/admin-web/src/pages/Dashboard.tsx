import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users,
    GraduationCap,
    BookOpen,
    CreditCard,
    UserPlus,
    ClipboardList,
    FileText,
    Calendar
} from 'lucide-react';

import { StatCard, QuickActionButton } from '../components/shared';
import { supabase } from '../lib/supabase';
import './Dashboard.css';

interface DashboardStats {
    totalStudents: number;
    totalTeachers: number;
    totalClasses: number;
    pendingFees: number;
}

export function Dashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState<DashboardStats>({
        totalStudents: 0,
        totalTeachers: 0,
        totalClasses: 0,
        pendingFees: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        try {
            setLoading(true);
            const [
                { count: studentsCount },
                { count: teachersCount },
                { count: classesCount },
            ] = await Promise.all([
                supabase.from('students').select('*', { count: 'exact', head: true }),
                supabase.from('teachers').select('*', { count: 'exact', head: true }),
                supabase.from('classes').select('*', { count: 'exact', head: true }),
            ]);

            setStats({
                totalStudents: studentsCount || 0,
                totalTeachers: teachersCount || 0,
                totalClasses: classesCount || 0,
                pendingFees: 0,
            });
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const quickActions = [
        { icon: UserPlus, label: 'Add Student', path: '/create-profile', color: 'blue' as const },
        { icon: ClipboardList, label: 'Mark Attendance', path: '/attendance', color: 'emerald' as const },
        { icon: FileText, label: 'Add Exam', path: '/exams', color: 'amber' as const },
        { icon: Calendar, label: 'Create Event', path: '/events', color: 'purple' as const },
    ];

    return (
        <div className="dashboard-page">
            <header className="dashboard-header animate-fade-in">
                <div>
                    <h1 className="page-title">Welcome back, Admin!</h1>
                    <p className="page-subtitle">Here's what's happening with your school today</p>
                </div>
            </header>

            <div className="stats-grid animate-slide-up">
                <StatCard icon={Users} title="Total Students" value={stats.totalStudents} change={0} trend="neutral" loading={loading} color="blue" />
                <StatCard icon={GraduationCap} title="Total Teachers" value={stats.totalTeachers} change={0} trend="neutral" loading={loading} color="emerald" />
                <StatCard icon={BookOpen} title="Total Classes" value={stats.totalClasses} change={0} trend="neutral" loading={loading} color="purple" />
                <StatCard icon={CreditCard} title="Pending Fees" value={`₹${stats.pendingFees.toLocaleString()}`} loading={loading} color="amber" />
            </div>

            {/* TODAY'S ATTENDANCE WIDGET */}
            <TodayAttendanceWidget totalStudents={stats.totalStudents} />

            <section className="section animate-fade-in">
                <h2 className="section-title">Quick Actions</h2>
                <div className="quick-actions-grid">
                    {quickActions.map((action) => (
                        <QuickActionButton
                            key={action.path}
                            icon={action.icon}
                            label={action.label}
                            onClick={() => navigate(action.path)}
                            color={action.color}
                        />
                    ))}
                </div>
            </section>

            <section className="section animate-fade-in">
                <h2 className="section-title">Recent Activity</h2>
                <div className="activity-card card">
                    <div className="empty-state">
                        <div className="empty-state-icon">📊</div>
                        <h3 className="empty-state-title">No recent activity</h3>
                        <p className="empty-state-text">Activity will appear here as you start managing your school</p>
                    </div>
                </div>
            </section>
        </div>
    );
}

// ─── Today's Attendance Widget ────────────────────────────────────────────────
function TodayAttendanceWidget({ totalStudents }: { totalStudents: number }) {
    const [present, setPresent] = useState(0);
    const [absent, setAbsent] = useState(0);
    const [lastUpdated, setLastUpdated] = useState<string>('');
    const [loading, setLoading] = useState(true);

    const getTodayIST = () => {
        const now = new Date();
        const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
        return ist.toISOString().split('T')[0];
    };

    const fetchTodayAttendance = async () => {
        try {
            const today = getTodayIST();
            const { data, error } = await supabase
                .from('student_attendance')
                .select('is_present, created_at')
                .eq('date', today);

            if (error) throw error;

            const presentCount = data?.filter((r) => r.is_present === true).length || 0;
            const absentCount = data?.filter((r) => r.is_present === false).length || 0;
            setPresent(presentCount);
            setAbsent(absentCount);

            if (data && data.length > 0) {
                const latest = data.reduce((a, b) =>
                    new Date(a.created_at) > new Date(b.created_at) ? a : b
                );
                setLastUpdated(
                    new Date(latest.created_at).toLocaleTimeString('en-IN', {
                        hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata'
                    }) + ' IST'
                );
            } else {
                setLastUpdated('Not marked yet');
            }
        } catch (err) {
            console.error('Error fetching today attendance:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTodayAttendance();
        const interval = setInterval(fetchTodayAttendance, 60000);
        return () => clearInterval(interval);
    }, []);

    // Real-time subscription
    useEffect(() => {
        const today = getTodayIST();
        const channel = supabase
            .channel('dashboard-today-attendance')
            .on('postgres_changes', {
                event: '*', schema: 'public', table: 'student_attendance',
                filter: `date=eq.${today}`
            }, () => fetchTodayAttendance())
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, []);

    const total = present + absent;
    const presentPct = total > 0 ? Math.round((present / total) * 100) : 0;
    const absentPct = total > 0 ? Math.round((absent / total) * 100) : 0;

    const todayLabel = new Date().toLocaleDateString('en-IN', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        timeZone: 'Asia/Kolkata'
    });

    return (
        <section className="section animate-fade-in">
            <h2 className="section-title">Today's Attendance</h2>
            <div style={{
                background: '#fff',
                border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: '18px',
                padding: '28px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                    <div>
                        <div style={{ fontSize: '17px', fontWeight: '600', color: '#1D1D1F', marginBottom: '4px' }}>
                            📅 {todayLabel}
                        </div>
                        <div style={{ fontSize: '13px', color: '#86868B' }}>⏰ Last updated: {lastUpdated}</div>
                    </div>
                    <div style={{
                        padding: '5px 14px', background: 'rgba(52,199,89,0.12)',
                        borderRadius: '20px', fontSize: '12px', fontWeight: '600', color: '#34C759',
                        display: 'flex', alignItems: 'center', gap: '5px'
                    }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34C759', display: 'inline-block' }} />
                        Live
                    </div>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '32px', color: '#86868B' }}>Loading attendance...</div>
                ) : (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                            {/* Total Marked */}
                            <div style={{ background: '#F5F5F7', borderRadius: '16px', padding: '20px', textAlign: 'center' }}>
                                <div style={{ fontSize: '36px', fontWeight: '800', color: '#1D1D1F' }}>{total}</div>
                                <div style={{ fontSize: '13px', color: '#86868B', marginTop: '4px' }}>📊 Marked Today</div>
                                {totalStudents > 0 && total < totalStudents && (
                                    <div style={{ fontSize: '11px', color: '#FF9500', marginTop: '4px', fontWeight: '600' }}>
                                        {totalStudents - total} unmarked
                                    </div>
                                )}
                            </div>
                            {/* Present */}
                            <div style={{
                                background: 'rgba(52,199,89,0.08)', borderRadius: '16px',
                                padding: '20px', textAlign: 'center',
                                border: '1px solid rgba(52,199,89,0.2)'
                            }}>
                                <div style={{ fontSize: '36px', fontWeight: '800', color: '#34C759' }}>{present}</div>
                                <div style={{ fontSize: '13px', color: '#34C759', marginTop: '4px', fontWeight: '600' }}>✅ Present</div>
                                <div style={{ fontSize: '12px', color: '#86868B', marginTop: '2px' }}>{presentPct}%</div>
                            </div>
                            {/* Absent */}
                            <div style={{
                                background: 'rgba(255,59,48,0.08)', borderRadius: '16px',
                                padding: '20px', textAlign: 'center',
                                border: '1px solid rgba(255,59,48,0.2)'
                            }}>
                                <div style={{ fontSize: '36px', fontWeight: '800', color: '#FF3B30' }}>{absent}</div>
                                <div style={{ fontSize: '13px', color: '#FF3B30', marginTop: '4px', fontWeight: '600' }}>❌ Absent</div>
                                <div style={{ fontSize: '12px', color: '#86868B', marginTop: '2px' }}>{absentPct}%</div>
                            </div>
                        </div>

                        {total > 0 ? (
                            <div>
                                <div style={{ display: 'flex', borderRadius: '10px', overflow: 'hidden', height: '12px', marginBottom: '8px' }}>
                                    <div style={{ width: `${presentPct}%`, background: 'linear-gradient(90deg,#34C759,#30D158)', transition: 'width 0.6s ease' }} />
                                    <div style={{ flex: 1, background: 'linear-gradient(90deg,#FF3B30,#FF453A)', transition: 'width 0.6s ease' }} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#86868B', fontWeight: '500' }}>
                                    <span style={{ color: '#34C759' }}>Present {presentPct}%</span>
                                    <span style={{ color: '#FF3B30' }}>Absent {absentPct}%</span>
                                </div>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', color: '#86868B', fontSize: '14px', padding: '8px 0' }}>
                                No attendance marked yet today. Teachers mark attendance via the mobile app.
                            </div>
                        )}
                    </>
                )}
            </div>
        </section>
    );
}
