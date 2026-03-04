import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { MobileBottomNav } from '../../../components/mobile/MobileBottomNav';

export function ParentHomePage() {
    const [pendingPayments, setPendingPayments] = useState<any[]>([]);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [notifications, setNotifications] = useState<any[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        // Get student ID from localStorage
        const user = JSON.parse(localStorage.getItem('mobile_user') || '{}');

        // Fetch pending payments
        const { data: payments } = await supabase
            .from('payments')
            .select('*')
            .eq('student_id', user.id)
            .eq('status', 'pending');
        setPendingPayments(payments || []);

        // Fetch class leaderboard
        const { data: students } = await supabase
            .from('students')
            .select('id, full_name, photo_url')
            .limit(10);
        setLeaderboard(students || []);

        // Fetch teachers
        const { data: teacherData } = await supabase
            .from('teachers')
            .select('*');
        setTeachers(teacherData || []);

        // Fetch notifications
        const { data: notifs } = await supabase
            .from('notifications')
            .select('*')
            .in('target_role', ['all', 'parent'])
            .order('created_at', { ascending: false })
            .limit(5);
        setNotifications(notifs || []);
    };

    return (
        <div style={{ paddingBottom: '80px', background: '#F5F5F7', minHeight: '100vh' }}>
            {/* Header */}
            <div
                style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    padding: '48px 20px 32px',
                    color: '#fff',
                }}
            >
                <h1 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 8px 0' }}>
                    Welcome Back!
                </h1>
                <p style={{ fontSize: '15px', opacity: 0.9, margin: 0 }}>
                    Track your child's progress
                </p>
            </div>

            <div style={{ padding: '20px' }}>
                {/* Pending Payments Banner */}
                {pendingPayments.length > 0 && (
                    <div
                        style={{
                            background: '#FF9F0A',
                            borderRadius: '16px',
                            padding: '20px',
                            marginBottom: '24px',
                            color: '#fff',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '32px' }}>⚠️</span>
                            <div>
                                <div style={{ fontSize: '17px', fontWeight: '700' }}>
                                    Pending Payments
                                </div>
                                <div style={{ fontSize: '14px', opacity: 0.9 }}>
                                    {pendingPayments.length} payment(s) due
                                </div>
                            </div>
                            <button
                                style={{
                                    marginLeft: 'auto',
                                    padding: '8px 16px',
                                    background: '#fff',
                                    color: '#FF9F0A',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                }}
                            >
                                Pay Now
                            </button>
                        </div>
                    </div>
                )}

                {/* Class Leaderboard */}
                <div style={{ marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '21px', fontWeight: '700', marginBottom: '16px' }}>
                        📊 Class Leaderboard
                    </h2>
                    <div
                        style={{
                            background: '#fff',
                            borderRadius: '16px',
                            padding: '16px',
                        }}
                    >
                        {leaderboard.slice(0, 5).map((student, index) => (
                            <div
                                key={student.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '12px',
                                    borderBottom:
                                        index < 4 ? '1px solid #EFEFEF' : 'none',
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: '20px',
                                        fontWeight: '700',
                                        color:
                                            index === 0
                                                ? '#FFD700'
                                                : index === 1
                                                    ? '#C0C0C0'
                                                    : index === 2
                                                        ? '#CD7F32'
                                                        : '#86868B',
                                    }}
                                >
                                    {index + 1}
                                </div>
                                <div
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        background: student.photo_url
                                            ? `url(${student.photo_url}) center/cover`
                                            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    }}
                                />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '15px', fontWeight: '600' }}>
                                        {student.full_name}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Teacher Directory */}
                <div style={{ marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '21px', fontWeight: '700', marginBottom: '16px' }}>
                        👨‍🏫 Teacher Directory
                    </h2>
                    <div style={{ display: 'grid', gap: '12px' }}>
                        {teachers.map((teacher) => (
                            <div
                                key={teacher.id}
                                style={{
                                    background: '#fff',
                                    borderRadius: '16px',
                                    padding: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px',
                                }}
                            >
                                <div
                                    style={{
                                        width: '56px',
                                        height: '56px',
                                        borderRadius: '50%',
                                        background: teacher.photo_url
                                            ? `url(${teacher.photo_url}) center/cover`
                                            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    }}
                                />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '17px', fontWeight: '600' }}>
                                        {teacher.full_name}
                                    </div>
                                    <div style={{ fontSize: '13px', color: '#86868B' }}>
                                        {teacher.qualification || 'Teacher'}
                                    </div>
                                    <div style={{ marginTop: '4px' }}>
                                        ⭐⭐⭐⭐⭐
                                    </div>
                                </div>
                                <button
                                    style={{
                                        padding: '8px 16px',
                                        background: '#0071E3',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                    }}
                                >
                                    Rate
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Notifications */}
                <div>
                    <h2 style={{ fontSize: '21px', fontWeight: '700', marginBottom: '16px' }}>
                        🔔 Notifications
                    </h2>
                    <div style={{ display: 'grid', gap: '12px' }}>
                        {notifications.map((notif) => (
                            <div
                                key={notif.id}
                                style={{
                                    background: '#fff',
                                    borderRadius: '16px',
                                    padding: '16px',
                                }}
                            >
                                <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '4px' }}>
                                    {notif.title}
                                </div>
                                <div style={{ fontSize: '14px', color: '#86868B' }}>
                                    {notif.message}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <MobileBottomNav active="home" role="parent" />
        </div>
    );
}
