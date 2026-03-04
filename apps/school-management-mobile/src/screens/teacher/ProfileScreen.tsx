import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, RefreshControl, StatusBar, ActivityIndicator, TouchableOpacity, Alert, Image, Dimensions, Platform
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../config/supabase';
import { Teacher } from '../../types';

export default function TeacherProfileScreen() {
    const { user, logout } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [teacher, setTeacher] = useState<Teacher | null>(null);
    const [classCount, setClassCount] = useState(0);
    const [chartData, setChartData] = useState<{ labels: string[], data: number[] } | null>(null);

    const fetchData = async () => {
        if (!user?.id) { setLoading(false); return; }
        const { data } = await supabase
            .from('teachers').select('*').eq('id', user.id).single();
        setTeacher(data);

        const { count } = await supabase
            .from('classes').select('id', { count: 'exact', head: true }).eq('class_teacher_id', user.id);
        setClassCount(count ?? 0);

        // Fetch attendance for performance graph (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);

        const { data: attData } = await supabase
            .from('teacher_attendance')
            .select('date, is_present')
            .eq('teacher_id', user.id)
            .gte('date', sixMonthsAgo.toISOString().split('T')[0]);

        if (attData && attData.length > 0) {
            const monthlyStats: Record<string, { present: number, total: number }> = {};

            // Initialize last 6 months to 0
            for (let i = 5; i >= 0; i--) {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                const monthName = d.toLocaleString('default', { month: 'short' });
                monthlyStats[monthName] = { present: 0, total: 0 };
            }

            attData.forEach(record => {
                const monthName = new Date(record.date).toLocaleString('default', { month: 'short' });
                if (monthlyStats[monthName]) {
                    monthlyStats[monthName].total++;
                    if (record.is_present === true) monthlyStats[monthName].present++;
                }
            });

            const labels: string[] = [];
            const dataPts: number[] = [];
            Object.entries(monthlyStats).forEach(([month, stats]) => {
                labels.push(month);
                dataPts.push(stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0);
            });

            // If all 0s, maybe just don't show the chart, or show it anyway
            setChartData({ labels, data: dataPts });
        } else {
            // Dummy data if no attendance found to show how the chart looks
            const dLabels = [];
            for (let i = 5; i >= 0; i--) {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                dLabels.push(d.toLocaleString('default', { month: 'short' }));
            }
            setChartData({ labels: dLabels, data: [0, 0, 0, 0, 0, 0] });
        }

        setLoading(false); setRefreshing(false);
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
        return <View style={styles.loader}><ActivityIndicator size="large" color="#2D7D46" /></View>;
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            showsVerticalScrollIndicator={false}
        >
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={['#2D7D46', '#3DA05A']} style={styles.header}>
                <View style={styles.avatarCircle}>
                    {teacher?.photo_url || user?.photo_url ? (
                        <Image source={{ uri: teacher?.photo_url ?? user?.photo_url }} style={styles.avatarImage} />
                    ) : (
                        <Text style={styles.avatarText}>{user?.full_name?.charAt(0).toUpperCase()}</Text>
                    )}
                </View>
                <Text style={styles.name}>{teacher?.full_name ?? user?.full_name}</Text>
                <Text style={styles.regNo}>{teacher?.registration_number ?? 'No ID'}</Text>
                {teacher?.qualification ? (
                    <View style={styles.qualBadge}>
                        <Text style={styles.qualText}>{teacher.qualification}</Text>
                    </View>
                ) : null}
            </LinearGradient>

            <View style={styles.body}>
                {/* Stats */}
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{(teacher?.subjects ?? []).length}</Text>
                        <Text style={styles.statLabel}>Subjects</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{classCount}</Text>
                        <Text style={styles.statLabel}>Classes</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>
                            {teacher?.doj ? new Date().getFullYear() - new Date(teacher.doj).getFullYear() : '—'}
                        </Text>
                        <Text style={styles.statLabel}>Yrs Exp.</Text>
                    </View>
                </View>

                {/* Subjects */}
                {(teacher?.subjects ?? []).length > 0 && (
                    <View style={styles.subjectsCard}>
                        <Text style={styles.subjectsTitle}>📚 Subjects</Text>
                        <View style={styles.subjectTags}>
                            {(teacher?.subjects ?? []).map((subj, i) => (
                                <View key={i} style={styles.subjectTag}>
                                    <Text style={styles.subjectTagText}>{subj}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Performance Chart */}
                {chartData && chartData.labels.length > 0 && (
                    <View style={styles.chartCard}>
                        <Text style={styles.chartTitle}>📈 Attendance Performance</Text>
                        <Text style={styles.chartSub}>Monthly percentage of days present</Text>
                        <View style={styles.chartWrapper}>
                            <LineChart
                                data={{
                                    labels: chartData.labels,
                                    datasets: [
                                        {
                                            data: chartData.data,
                                            color: (opacity = 1) => `rgba(45, 125, 70, ${opacity})`,
                                            strokeWidth: 3
                                        }
                                    ],
                                }}
                                width={Dimensions.get('window').width - 64} // padding 16*2 + inner padding 16*2
                                height={180}
                                chartConfig={{
                                    backgroundColor: '#ffffff',
                                    backgroundGradientFrom: '#ffffff',
                                    backgroundGradientTo: '#ffffff',
                                    decimalPlaces: 0,
                                    color: (opacity = 1) => `rgba(160, 174, 192, ${opacity})`,
                                    labelColor: (opacity = 1) => `rgba(113, 128, 150, ${opacity})`,
                                    style: { borderRadius: 16 },
                                    propsForDots: { r: '5', strokeWidth: '2', stroke: '#2D7D46', fill: '#FFF' },
                                    formatYLabel: (yLabel) => `${yLabel}%`
                                }}
                                bezier
                                style={styles.chartStyle}
                                fromZero
                                yAxisInterval={1}
                            />
                        </View>
                    </View>
                )}

                {/* Info Section */}
                <View style={styles.infoCard}>
                    <Text style={styles.infoHeader}>Teacher Information</Text>
                    {[
                        { icon: 'person-outline', label: 'Full Name', value: teacher?.full_name },
                        { icon: 'call-outline', label: 'Phone', value: teacher?.phone },
                        { icon: 'mail-outline', label: 'Email', value: teacher?.email },
                        { icon: 'calendar-outline', label: 'Joining Date', value: teacher?.doj ? new Date(teacher.doj).toLocaleDateString('en-IN') : null },
                        { icon: 'male-female-outline', label: 'Gender', value: teacher?.gender },
                        { icon: 'location-outline', label: 'Address', value: teacher?.address },
                    ].map((item) =>
                        item.value ? (
                            <View key={item.label} style={styles.infoRow}>
                                <Ionicons name={item.icon as any} size={18} color="#718096" style={styles.infoIcon} />
                                <View style={styles.infoText}>
                                    <Text style={styles.infoLabel}>{item.label}</Text>
                                    <Text style={styles.infoValue}>{item.value}</Text>
                                </View>
                            </View>
                        ) : null
                    )}
                </View>

                {/* Logout */}
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={20} color="#E53E3E" />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F7FAFC' },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7FAFC' },
    header: { paddingTop: 60, paddingBottom: 32, alignItems: 'center', paddingHorizontal: 20 },
    avatarCircle: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center', marginBottom: 12,
        overflow: 'hidden',
    },
    avatarImage: { width: '100%', height: '100%' },
    avatarText: { fontSize: 32, fontWeight: '800', color: '#FFFFFF' },
    name: { fontSize: 22, fontWeight: '700', color: '#FFFFFF' },
    regNo: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
    qualBadge: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4, marginTop: 10 },
    qualText: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },
    body: { padding: 16, gap: 12 },
    statsRow: { flexDirection: 'row', gap: 10 },
    statCard: {
        flex: 1, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, alignItems: 'center',
        elevation: 2,
    },
    statValue: { fontSize: 22, fontWeight: '800', color: '#2D3748' },
    statLabel: { fontSize: 11, color: '#A0AEC0', marginTop: 2 },
    subjectsCard: {
        backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
        elevation: 2,
    },
    subjectsTitle: { fontSize: 15, fontWeight: '700', color: '#2D3748', marginBottom: 10 },
    subjectTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    subjectTag: { backgroundColor: '#E6F4EA', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
    subjectTagText: { fontSize: 13, fontWeight: '600', color: '#2D7D46' },
    chartCard: {
        backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, elevation: 2, overflow: 'hidden'
    },
    chartTitle: { fontSize: 15, fontWeight: '700', color: '#2D3748' },
    chartSub: { fontSize: 12, color: '#A0AEC0', marginBottom: 12, marginTop: 2 },
    chartWrapper: {
        alignItems: 'center', marginLeft: -16
    },
    chartStyle: { marginVertical: 8, borderRadius: 16 },
    infoCard: {
        backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
        elevation: 2,
    },
    infoHeader: { fontSize: 15, fontWeight: '700', color: '#2D3748', marginBottom: 14 },
    infoRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F4F8' },
    infoIcon: { marginRight: 12, marginTop: 2 },
    infoText: { flex: 1 },
    infoLabel: { fontSize: 11, color: '#A0AEC0', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    infoValue: { fontSize: 14, color: '#2D3748', fontWeight: '500', marginTop: 2 },
    logoutBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: '#FFF5F5', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#FED7D7',
    },
    logoutText: { fontSize: 16, fontWeight: '700', color: '#E53E3E' },
});
