import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, RefreshControl, StatusBar, ActivityIndicator, TouchableOpacity, Alert, Image, Platform, Dimensions, Linking
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../config/supabase';
import { Student, SchoolClass } from '../../types';
import { LineChart } from 'react-native-chart-kit';

export default function ParentProfileScreen() {
    const { user, logout } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [student, setStudent] = useState<Student | null>(null);
    const [schoolClass, setSchoolClass] = useState<SchoolClass | null>(null);
    const [attendanceStats, setAttendanceStats] = useState({ total: 0, present: 0, absent: 0 });
    const [chartData, setChartData] = useState<any>(null);
    const [weeklyAttendance, setWeeklyAttendance] = useState<any[]>([]);
    const [isUpTrend, setIsUpTrend] = useState(true);

    const fetchData = async () => {
        if (!user?.id) { setLoading(false); return; }
        try {
            const { data: studentData } = await supabase
                .from('students').select('*').eq('id', user.id).maybeSingle();
            setStudent(studentData);

            if (studentData?.class_id) {
                const { data: classData } = await supabase
                    .from('classes').select('*').eq('id', studentData.class_id).maybeSingle();
                setSchoolClass(classData);

                // Fetch attendance metrics
                const { data: attData, error: attErr } = await supabase
                    .from('student_attendance')
                    .select('date, is_present')
                    .eq('student_id', user.id);
                
                if (attErr) {
                    Alert.alert('Attendance Stats Error', JSON.stringify(attErr));
                }
                
                const total = attData?.length ?? 0;
                const present = attData?.filter((a) => a.is_present === true).length ?? 0;
                const absent = attData?.filter((a) => a.is_present === false).length ?? 0;
                setAttendanceStats({ total, present, absent });

                // Fetch current week's attendance (Monday to Saturday)
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

                const weekDates = getDatesForCurrentWeek();
                const { data: weekAttData, error: weekAttErr } = await supabase
                    .from('student_attendance')
                    .select('date, is_present')
                    .eq('student_id', user.id)
                    .gte('date', weekDates[0])
                    .lte('date', weekDates[5]);

                if (weekAttErr) {
                    Alert.alert('Week Attendance Error', JSON.stringify(weekAttErr));
                }

                const weekAttMap: Record<string, string> = {};
                if (weekAttData) {
                    weekAttData.forEach((a: any) => {
                        weekAttMap[a.date] = a.is_present ? 'Present' : 'Absent';
                    });
                }
                setWeeklyAttendance(weekDates.map((dateStr, index) => ({
                    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][index],
                    date: dateStr,
                    status: weekAttMap[dateStr] || 'Unmarked'
                })));

                // Academic Progress line graph (last 6 months)
                const sixMonthsAgo = new Date();
                sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
                sixMonthsAgo.setDate(1);

                const { data: marksHistory } = await supabase
                    .from('marks')
                    .select('marks_obtained, max_marks, created_at')
                    .eq('student_id', user.id)
                    .gte('created_at', sixMonthsAgo.toISOString());

                const monthlyStats: Record<string, { totalMarks: number, maxMarks: number }> = {};

                for (let i = 5; i >= 0; i--) {
                    const d = new Date();
                    d.setMonth(d.getMonth() - i);
                    const monthName = d.toLocaleString('default', { month: 'short' });
                    monthlyStats[monthName] = { totalMarks: 0, maxMarks: 0 };
                }

                if (marksHistory) {
                    marksHistory.forEach(record => {
                        const monthName = new Date(record.created_at).toLocaleString('default', { month: 'short' });
                        if (monthlyStats[monthName]) {
                            monthlyStats[monthName].totalMarks += record.marks_obtained;
                            monthlyStats[monthName].maxMarks += (record.max_marks || 100);
                        }
                    });
                }

                const labels: string[] = [];
                const marksPoints: number[] = [];

                Object.entries(monthlyStats).forEach(([month, stats]) => {
                    labels.push(month);
                    marksPoints.push(stats.maxMarks > 0 ? Math.round((stats.totalMarks / stats.maxMarks) * 100) : 84);
                });

                // Calculate trend
                const isUp = marksPoints.length > 1
                    ? marksPoints[marksPoints.length - 1] >= marksPoints[marksPoints.length - 2]
                    : true;
                setIsUpTrend(isUp);

                setChartData({
                    labels,
                    datasets: [
                        {
                            data: marksPoints,
                        }
                    ]
                });
            }
        } catch (e) {
            console.error('Fetch error:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchData(); }, []);
    const onRefresh = () => { setRefreshing(true); fetchData(); };

    const handleLogout = () => {
        if (Platform.OS === 'web') {
            if (window.confirm('Are you sure you want to logout?')) {
                logout();
            }
        } else {
            Alert.alert('Logout', 'Are you sure you want to logout?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Logout', style: 'destructive', onPress: () => logout() },
            ]);
        }
    };

    if (loading) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator size="large" color="#A855F7" />
            </View>
        );
    }

    const attendancePct = attendanceStats.total > 0
        ? Math.round((attendanceStats.present / attendanceStats.total) * 100)
        : 95;

    return (
        <LinearGradient colors={['#090514', '#150E28', '#07040E']} style={{ flex: 1 }}>
            <StatusBar barStyle="light-content" backgroundColor="#090514" />
            
            <View style={styles.navHeader}>
                <View style={styles.navCircleBtn}>
                    <Ionicons name="person" size={18} color="#FFFFFF" />
                </View>
                <Text style={styles.navTitle}>Student Profile</Text>
                <TouchableOpacity style={styles.navCircleBtn} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#A855F7" />}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.profileHeader}>
                    <LinearGradient colors={['#A855F7', '#EC4899']} style={styles.avatarBorder}>
                        <View style={styles.avatarInner}>
                            {student?.photo_url || user?.photo_url ? (
                                <Image source={{ uri: student?.photo_url ?? user?.photo_url }} style={styles.avatarImage} />
                            ) : (
                                <Text style={styles.avatarText}>{user?.full_name?.charAt(0).toUpperCase()}</Text>
                            )}
                        </View>
                    </LinearGradient>
                    <Text style={styles.name}>{user?.full_name}</Text>
                    <Text style={styles.subtext}>Registration: {student?.registration_number ?? 'N/A'}</Text>
                </View>

                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{attendancePct}%</Text>
                        <Text style={styles.statLabel}>Attendance</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{schoolClass?.class_name ?? '—'}</Text>
                        <Text style={styles.statLabel}>Class</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>#{student?.roll_number ?? '—'}</Text>
                        <Text style={styles.statLabel}>Roll No</Text>
                    </View>
                </View>

                {/* Weekly Attendance Card */}
                <View style={styles.performanceCard}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>📅 Weekly Attendance</Text>
                        <View style={styles.avgBadge}>
                            <Text style={styles.avgBadgeText}>{attendancePct}% Avg</Text>
                        </View>
                    </View>

                    <View style={styles.weeklyContainer}>
                        {weeklyAttendance.map((day) => {
                            let pillBg = 'rgba(255, 255, 255, 0.05)';
                            let pillBorder = 'rgba(255, 255, 255, 0.1)';
                            let iconName: 'checkmark' | 'close' | null = null;
                            let iconColor = '#FFFFFF';

                            if (day.status === 'Present') {
                                pillBg = 'rgba(16, 185, 129, 0.15)';
                                pillBorder = 'rgba(16, 185, 129, 0.3)';
                                iconName = 'checkmark';
                                iconColor = '#10B981';
                            } else if (day.status === 'Absent') {
                                pillBg = 'rgba(239, 68, 68, 0.15)';
                                pillBorder = 'rgba(239, 68, 68, 0.3)';
                                iconName = 'close';
                                iconColor = '#EF4444';
                            }

                            return (
                                <View key={day.date} style={styles.weeklyPillContainer}>
                                    <View style={[styles.weeklyPill, { backgroundColor: pillBg, borderColor: pillBorder }]}>
                                        {iconName && <Ionicons name={iconName} size={16} color={iconColor} />}
                                    </View>
                                    <Text style={styles.weeklyDayText}>{day.day}</Text>
                                </View>
                            );
                        })}
                    </View>

                    <View style={styles.attendanceStatsGrid}>
                        <View style={styles.attendanceStatBoxGreen}>
                            <Text style={styles.attendanceStatValGreen}>{attendanceStats.present}</Text>
                            <Text style={styles.attendanceStatLabelGreen}>Presents</Text>
                        </View>
                        <View style={styles.attendanceStatBoxRed}>
                            <Text style={styles.attendanceStatValRed}>{attendanceStats.absent}</Text>
                            <Text style={styles.attendanceStatLabelRed}>Absents</Text>
                        </View>
                    </View>
                </View>

                {/* Academic Marks Progress Card */}
                {chartData && (
                    <View style={styles.blackChartCard}>
                        <View style={styles.cardHeader}>
                            <View>
                                <Text style={styles.blackChartTitle}>📈 Academic Marks Progress</Text>
                                <Text style={styles.blackChartSub}>Monthly average marks progress (Last 6 Months)</Text>
                            </View>
                            <Ionicons 
                                name={isUpTrend ? "trending-up" : "trending-down"} 
                                size={20} 
                                color={isUpTrend ? "#10B981" : "#EF4444"} 
                            />
                        </View>
                        <View style={styles.chartWrapper}>
                            <LineChart
                                data={chartData}
                                width={Dimensions.get('window').width - 56}
                                height={180}
                                chartConfig={{
                                    backgroundColor: '#000000',
                                    backgroundGradientFrom: '#000000',
                                    backgroundGradientTo: '#000000',
                                    decimalPlaces: 0,
                                    color: (opacity = 1) => isUpTrend ? `rgba(16, 185, 129, ${opacity})` : `rgba(239, 68, 68, ${opacity})`,
                                    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity * 0.5})`,
                                    style: { borderRadius: 16 },
                                    propsForDots: { 
                                        r: '4', 
                                        strokeWidth: '1.5', 
                                        stroke: isUpTrend ? '#10B981' : '#EF4444', 
                                        fill: '#FFF' 
                                    },
                                    formatYLabel: (yLabel) => `${yLabel}%`
                                }}
                                bezier
                                style={styles.chartStyle}
                                fromZero
                            />
                        </View>
                    </View>
                )}

                <View style={styles.detailsListCard}>
                    {[
                        { icon: 'calendar-outline', label: 'Date of Birth', value: student?.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString('en-IN') : 'N/A' },
                        { icon: 'male-female-outline', label: 'Gender', value: student?.gender ?? 'N/A' },
                        { icon: 'location-outline', label: 'Address', value: student?.address ?? 'N/A' },
                        { icon: 'call-outline', label: "Parent's Phone", value: student?.parent_phone ?? 'N/A' },
                        { icon: 'mail-outline', label: "Parent's Email", value: student?.parent_email ?? 'N/A' },
                    ].map((item, index, arr) => (
                        <View key={item.label}>
                            <View style={styles.detailRow}>
                                <View style={styles.rowLeft}>
                                    <Ionicons name={item.icon as any} size={18} color="#C084FC" style={styles.rowIcon} />
                                    <View>
                                        <Text style={styles.rowLabel}>{item.label}</Text>
                                        <Text style={styles.rowValue}>{item.value}</Text>
                                    </View>
                                </View>
                                <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.2)" />
                            </View>
                            {index < arr.length - 1 && <View style={styles.rowSeparator} />}
                        </View>
                    ))}
                </View>

                {/* System & Credits Section */}
                <View style={styles.creditsCard}>
                    <Text style={styles.creditsTitle}>System Information</Text>
                    <View style={styles.versionRow}>
                        <Text style={styles.versionLabel}>App Version</Text>
                        <Text style={styles.versionVal}>v1.0.0 (Production)</Text>
                    </View>
                    
                    <View style={styles.divider} />
                    
                    <View style={styles.nequonCard}>
                        <Image 
                            source={require('../../../assets/images/nequon_logo.jpg')} 
                            style={styles.nequonLogo} 
                        />
                        <View style={styles.nequonTextContainer}>
                            <Text style={styles.nequonName}>NEQUON</Text>
                            <Text style={styles.nequonTagline}>Next-Gen Engineering & Automation</Text>
                            <Text style={styles.nequonDesc}>
                                Architecting premium high-scale software systems.
                            </Text>
                        </View>
                    </View>
                    
                    <TouchableOpacity 
                        style={styles.nequonButton}
                        activeOpacity={0.8}
                        onPress={() => Linking.openURL('https://nequon.com')}
                    >
                        <Text style={styles.nequonButtonText}>Visit Website</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'transparent' },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 110 },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#090514' },
    navHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 12,
    },
    navCircleBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
        justifyContent: 'center', alignItems: 'center'
    },
    navTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
    profileHeader: { alignItems: 'center', marginTop: 16, marginBottom: 28 },
    avatarBorder: { width: 92, height: 92, borderRadius: 46, padding: 2.5, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    avatarInner: { width: '100%', height: '100%', borderRadius: 44, backgroundColor: '#1A152E', overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
    avatarImage: { width: '100%', height: '100%' },
    avatarText: { fontSize: 36, fontWeight: '800', color: '#FFFFFF' },
    name: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
    subtext: { fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 },
    statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    statCard: {
        flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.06)',
        paddingVertical: 18, alignItems: 'center',
    },
    statValue: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
    statLabel: { fontSize: 11, color: 'rgba(255, 255, 255, 0.4)', marginTop: 4 },
    performanceCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.06)',
        padding: 20, marginBottom: 20,
    },
    cardHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 20,
    },
    cardTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
    avgBadge: {
        paddingHorizontal: 12, paddingVertical: 6,
        backgroundColor: 'rgba(16, 185, 129, 0.12)', borderRadius: 20,
    },
    avgBadgeText: { color: '#10B981', fontSize: 13, fontWeight: '700' },
    weeklyContainer: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        gap: 6, marginBottom: 20,
    },
    weeklyPillContainer: {
        flex: 1, alignItems: 'center', gap: 6,
    },
    weeklyPill: {
        width: '100%', height: 48, borderRadius: 24,
        borderWidth: 1, justifyContent: 'center', alignItems: 'center',
    },
    weeklyDayText: { fontSize: 11, fontWeight: '600', color: 'rgba(255, 255, 255, 0.5)' },
    attendanceStatsGrid: {
        flexDirection: 'row', gap: 12,
    },
    attendanceStatBoxGreen: {
        flex: 1, backgroundColor: 'rgba(16, 185, 129, 0.06)', borderRadius: 14,
        padding: 12, alignItems: 'center',
    },
    attendanceStatValGreen: { fontSize: 18, fontWeight: '800', color: '#10B981' },
    attendanceStatLabelGreen: { fontSize: 11, color: '#10B981', marginTop: 2, fontWeight: '600' },
    attendanceStatBoxRed: {
        flex: 1, backgroundColor: 'rgba(239, 68, 68, 0.06)', borderRadius: 14,
        padding: 12, alignItems: 'center',
    },
    attendanceStatValRed: { fontSize: 18, fontWeight: '800', color: '#EF4444' },
    attendanceStatLabelRed: { fontSize: 11, color: '#EF4444', marginTop: 2, fontWeight: '600' },
    blackChartCard: {
        backgroundColor: '#000000',
        borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)',
        padding: 20, marginBottom: 24, overflow: 'hidden'
    },
    blackChartTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
    blackChartSub: { fontSize: 11, color: 'rgba(255, 255, 255, 0.4)', marginTop: 2 },
    chartWrapper: { alignItems: 'center', marginLeft: -8 },
    chartStyle: { borderRadius: 16 },
    detailsListCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.06)',
        paddingHorizontal: 18, paddingVertical: 8,
    },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
    rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
    rowIcon: { width: 20 },
    rowLabel: { fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    rowValue: { fontSize: 14, color: '#FFFFFF', fontWeight: '500', marginTop: 2 },
    rowSeparator: { height: 1, backgroundColor: 'rgba(255, 255, 255, 0.05)' },
    creditsCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
        padding: 20,
        marginTop: 20,
    },
    creditsTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 16,
    },
    versionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    versionLabel: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.4)',
    },
    versionVal: {
        fontSize: 13,
        color: '#FFFFFF',
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        marginVertical: 14,
    },
    nequonCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        backgroundColor: '#090514',
        borderColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
    },
    nequonLogo: {
        width: 54,
        height: 54,
        borderRadius: 12,
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
    },
    nequonTextContainer: {
        flex: 1,
    },
    nequonName: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    nequonTagline: {
        fontSize: 11,
        fontWeight: '600',
        color: '#A855F7',
        marginTop: 2,
    },
    nequonDesc: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.5)',
        marginTop: 4,
        lineHeight: 14,
    },
    nequonButton: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    nequonButtonText: {
        color: '#090514',
        fontSize: 14,
        fontWeight: '700',
    },
});
