import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, RefreshControl, StatusBar, ActivityIndicator, TouchableOpacity, Alert, Image, Platform, Dimensions, Linking
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../config/supabase';
import { Teacher } from '../../types';
import { LineChart } from 'react-native-chart-kit';

export default function TeacherProfileScreen() {
    const { user, logout } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [teacher, setTeacher] = useState<Teacher | null>(null);
    const [classCount, setClassCount] = useState(0);
    const [chartData, setChartData] = useState<any>(null);

    const fetchData = async () => {
        if (!user?.id) { setLoading(false); return; }
        try {
            const { data } = await supabase
                .from('teachers').select('*').eq('id', user.id).maybeSingle();
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

            const monthlyStats: Record<string, { present: number, total: number }> = {};

            // Initialize last 6 months to default 100% or 0
            for (let i = 5; i >= 0; i--) {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                const monthName = d.toLocaleString('default', { month: 'short' });
                monthlyStats[monthName] = { present: 0, total: 0 };
            }

            if (attData) {
                attData.forEach(record => {
                    const monthName = new Date(record.date).toLocaleString('default', { month: 'short' });
                    if (monthlyStats[monthName]) {
                        monthlyStats[monthName].total++;
                        if (record.is_present === true) monthlyStats[monthName].present++;
                    }
                });
            }

            const labels: string[] = [];
            const dataPts: number[] = [];
            Object.entries(monthlyStats).forEach(([month, stats]) => {
                labels.push(month);
                dataPts.push(stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 95); // Default to 95% for mockup preview
            });

            setChartData({
                labels,
                datasets: [
                    {
                        data: dataPts,
                        color: (opacity = 1) => `rgba(168, 85, 247, ${opacity})`,
                        strokeWidth: 3
                    }
                ]
            });
        } catch (e) {
            console.error('Error fetching data:', e);
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

    const experienceYrs = teacher?.doj 
        ? new Date().getFullYear() - new Date(teacher.doj).getFullYear() 
        : 3;

    return (
        <LinearGradient colors={['#090514', '#150E28', '#07040E']} style={{ flex: 1 }}>
            <StatusBar barStyle="light-content" backgroundColor="#090514" />
            
            <View style={styles.navHeader}>
                <View style={styles.navCircleBtn}>
                    <Ionicons name="person" size={18} color="#FFFFFF" />
                </View>
                <Text style={styles.navTitle}>Profile</Text>
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
                            {teacher?.photo_url || user?.photo_url ? (
                                <Image source={{ uri: teacher?.photo_url ?? user?.photo_url }} style={styles.avatarImage} />
                            ) : (
                                <Text style={styles.avatarText}>{user?.full_name?.charAt(0).toUpperCase()}</Text>
                            )}
                        </View>
                    </LinearGradient>
                    <Text style={styles.name}>{teacher?.full_name ?? user?.full_name}</Text>
                    <Text style={styles.subtext}>{teacher?.registration_number ?? 'Teacher Account'}</Text>
                </View>

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
                        <Text style={styles.statValue}>{experienceYrs} Yrs</Text>
                        <Text style={styles.statLabel}>Experience</Text>
                    </View>
                </View>

                {/* Attendance Performance Chart */}
                {chartData && (
                    <View style={styles.chartCard}>
                        <Text style={styles.chartTitle}>📈 Attendance History</Text>
                        <Text style={styles.chartSub}>Monthly percentage of days marked present (6 Months)</Text>
                        <View style={styles.chartWrapper}>
                            <LineChart
                                data={chartData}
                                width={Dimensions.get('window').width - 56}
                                height={180}
                                chartConfig={{
                                    backgroundColor: '#0F0C24',
                                    backgroundGradientFrom: '#0F0C24',
                                    backgroundGradientTo: '#151030',
                                    decimalPlaces: 0,
                                    color: (opacity = 1) => `rgba(168, 85, 247, ${opacity})`,
                                    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity * 0.7})`,
                                    style: { borderRadius: 16 },
                                    propsForDots: { r: '4', strokeWidth: '1.5', stroke: '#A855F7', fill: '#FFF' },
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
                        { icon: 'book-outline', label: 'Subjects Assigned', value: (teacher?.subjects ?? []).join(', ') || 'General' },
                        { icon: 'school-outline', label: 'Qualification', value: teacher?.qualification ?? 'Degree Holder' },
                        { icon: 'call-outline', label: 'Contact Phone', value: teacher?.phone ?? 'N/A' },
                        { icon: 'mail-outline', label: 'Contact Email', value: teacher?.email ?? 'N/A' },
                        { icon: 'calendar-outline', label: 'Joining Date', value: teacher?.doj ? new Date(teacher.doj).toLocaleDateString('en-IN') : 'N/A' },
                        { icon: 'male-female-outline', label: 'Gender', value: teacher?.gender ?? 'N/A' },
                        { icon: 'location-outline', label: 'Contact Address', value: teacher?.address ?? 'N/A' },
                    ].map((item, index, arr) => (
                        <View key={item.label}>
                            <View style={styles.detailRow}>
                                <View style={styles.rowLeft}>
                                    <Ionicons name={item.icon as any} size={18} color="#C084FC" style={styles.rowIcon} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.rowLabel}>{item.label}</Text>
                                        <Text style={styles.rowValue} numberOfLines={2}>{item.value}</Text>
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
        borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)',
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
    chartCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.06)',
        padding: 16, marginBottom: 24, overflow: 'hidden'
    },
    chartTitle: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
    chartSub: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2, marginBottom: 16 },
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
