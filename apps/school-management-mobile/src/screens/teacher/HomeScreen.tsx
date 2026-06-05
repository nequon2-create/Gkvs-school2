import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, RefreshControl, StatusBar, ActivityIndicator, Image, TouchableOpacity, Alert, Dimensions, Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../config/supabase';
import { Homework, Notification, RootStackParamList } from '../../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function TeacherHomeScreen() {
    const { user } = useAuthStore();
    const navigation = useNavigation<NavigationProp>();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [homework, setHomework] = useState<Homework[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [averageRating, setAverageRating] = useState(0);
    const [totalReviews, setTotalReviews] = useState(0);

    const fetchData = async () => {
        if (!user?.id) { setLoading(false); return; }
        const { data: hwData } = await supabase
            .from('homework')
            .select('*, classes(class_name, section)')
            .eq('teacher_id', user.id)
            .gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Remove after 24hr
            .order('created_at', { ascending: false });
        setHomework(hwData ?? []);

        const { data: notifData } = await supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);
        setNotifications(notifData ?? []);

        // Fetch monthly average ratings
        try {
            const currentMonth = new Date().toISOString().substring(0, 7);
            const { data: ratingsData, error: ratingsError } = await supabase
                .from('teacher_ratings')
                .select('rating')
                .eq('teacher_id', user.id)
                .eq('rating_month', currentMonth);
            
            if (!ratingsError && ratingsData && ratingsData.length > 0) {
                const count = ratingsData.length;
                const sum = ratingsData.reduce((acc, curr) => acc + curr.rating, 0);
                const avg = Math.round((sum / count) * 10) / 10;
                setAverageRating(avg);
                setTotalReviews(count);
            } else {
                setAverageRating(0);
                setTotalReviews(0);
            }
        } catch (ratingErr) {
            console.error('Error fetching teacher rating stats:', ratingErr);
        }

        setLoading(false);
        setRefreshing(false);
    };

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchData();
        });
        return unsubscribe;
    }, [navigation, user]);

    const onRefresh = () => { setRefreshing(true); fetchData(); };

    const handleDeleteHomework = (id: string) => {
        Alert.alert('Delete Homework', 'Are you sure you want to delete this assignment?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    const { error } = await supabase.from('homework').delete().eq('id', id);
                    if (!error) {
                        setHomework(prev => prev.filter(hw => hw.id !== id));
                    } else {
                        Alert.alert('Error', 'Failed to delete homework');
                    }
                }
            }
        ]);
    };

    if (loading) {
        return <View style={styles.loader}><ActivityIndicator size="large" color="#A855F7" /></View>;
    }

    return (
        <LinearGradient colors={['#090514', '#150E28', '#07040E']} style={{ flex: 1 }}>
            <StatusBar barStyle="light-content" backgroundColor="#090514" />
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#A855F7" />}
                showsVerticalScrollIndicator={false}
            >
                {/* Header Profile Info Card */}
                <LinearGradient
                    colors={['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.01)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.profileCard}
                >
                    <View style={styles.profileHeader}>
                        <View style={styles.profileTextContainer}>
                            <Text style={styles.greeting}>Welcome back 👋</Text>
                            <Text style={styles.userName}>{user?.full_name}</Text>
                            <Text style={styles.userRole}>
                                {user?.registration_number ? `Reg: ${user.registration_number}` : 'Teacher'}
                            </Text>
                            {user?.subjects && user.subjects.length > 0 && (
                                <Text style={styles.userSubjects} numberOfLines={1}>
                                    Subjects: {user.subjects.join(', ')}
                                </Text>
                            )}
                        </View>
                        <LinearGradient colors={['#A855F7', '#EC4899']} style={styles.avatarBorder}>
                            <View style={styles.avatarInner}>
                                {user?.photo_url ? (
                                    <Image source={{ uri: user.photo_url }} style={styles.avatarImage} />
                                ) : (
                                    <Text style={styles.avatarText}>
                                        {user?.full_name?.charAt(0).toUpperCase() ?? 'T'}
                                    </Text>
                                )}
                            </View>
                        </LinearGradient>
                    </View>
                </LinearGradient>

                {/* Ratings Card (My Ratings Card) */}
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('TeacherRatingsLeaderboard')}
                >
                    <LinearGradient
                        colors={['rgba(251, 191, 36, 0.1)', 'rgba(251, 191, 36, 0.02)']}
                        style={styles.ratingsCard}
                    >
                        <View style={styles.ratingsHeader}>
                            <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                    <Text style={styles.ratingsCardTitle}>My Star Ratings</Text>
                                    <Ionicons name="chevron-forward" size={16} color="rgba(251, 191, 36, 0.6)" />
                                </View>
                                <Text style={styles.ratingsCardSubtitle}>Feedback for this Month</Text>
                            </View>
                            <View style={styles.ratingsScoreContainer}>
                                <Text style={styles.ratingNumber}>{averageRating > 0 ? averageRating : 'N/A'}</Text>
                                <View style={styles.starsContainer}>
                                    {[1, 2, 3, 4, 5].map((index) => (
                                        <Ionicons
                                            key={index}
                                            name={index <= Math.round(averageRating) ? "star" : "star-outline"}
                                            size={14}
                                            color={index <= Math.round(averageRating) ? "#FBBF24" : "rgba(255, 255, 255, 0.2)"}
                                        />
                                    ))}
                                </View>
                            </View>
                        </View>
                        <View style={styles.ratingsFooter}>
                            <Ionicons name="chatbubbles-outline" size={16} color="rgba(255, 255, 255, 0.4)" />
                            <Text style={styles.ratingsFooterText}>
                                {totalReviews > 0 ? `Based on ${totalReviews} parent reviews • Tap to view leaderboard` : 'No reviews received this month • Tap to view leaderboard'}
                            </Text>
                        </View>
                    </LinearGradient>
                </TouchableOpacity>

                <View style={styles.body}>
                    {/* Quick Actions (Classes & Students Card) */}
                    <TouchableOpacity
                        style={styles.actionCard}
                        activeOpacity={0.8}
                        onPress={() => navigation.navigate('TeacherClassList')}
                    >
                        <View style={styles.actionIconBg}>
                            <Ionicons name="people" size={22} color="#C084FC" />
                        </View>
                        <View style={styles.actionText}>
                            <Text style={styles.actionTitle}>My Students & Classes</Text>
                            <Text style={styles.actionSub}>View class lists and student profiles</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.3)" />
                    </TouchableOpacity>

                    {/* Notifications Card */}
                    {notifications.length > 0 && (
                        <View style={styles.cardContainer}>
                            <Text style={styles.sectionTitle}>🔔 Notifications</Text>
                            {notifications.map((notif) => (
                                <View key={notif.id} style={[styles.notifCard, !notif.read && styles.notifUnread]}>
                                    <View style={styles.notifDot} />
                                    <View style={styles.notifText}>
                                        <Text style={styles.notifTitle}>{notif.title}</Text>
                                        {notif.message ? <Text style={styles.notifMsg} numberOfLines={2}>{notif.message}</Text> : null}
                                        {notif.created_at ? (
                                            <Text style={styles.notifTime}>
                                                {new Date(notif.created_at).toLocaleDateString('en-IN')}
                                            </Text>
                                        ) : null}
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Homework Card */}
                    <View style={styles.cardContainer}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>📚 Homework Assignments</Text>
                            <TouchableOpacity
                                style={styles.addBtn}
                                activeOpacity={0.8}
                                onPress={() => navigation.navigate('AddHomework')}
                            >
                                <Ionicons name="add" size={16} color="#A855F7" />
                                <Text style={styles.addBtnText}>Add</Text>
                            </TouchableOpacity>
                        </View>

                        {homework.length === 0 ? (
                            <View style={styles.emptyCard}>
                                <Ionicons name="book-outline" size={32} color="rgba(255, 255, 255, 0.2)" />
                                <Text style={styles.emptyText}>No assignments assigned today</Text>
                            </View>
                        ) : (
                            homework.map((hw) => (
                                <View key={hw.id} style={styles.hwCard}>
                                    <View style={styles.hwHeader}>
                                        <Ionicons name="book" size={16} color="#C084FC" />
                                        <Text style={styles.hwTitle} numberOfLines={1}>{hw.title}</Text>
                                        {(hw as any).classes && (
                                            <View style={styles.classBadge}>
                                                <Text style={styles.classBadgeText}>
                                                    {(hw as any).classes.class_name} {(hw as any).classes.section || ''}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                    {hw.description ? (
                                        <Text style={styles.hwDesc} numberOfLines={2}>{hw.description}</Text>
                                    ) : null}
                                    <View style={styles.hwFooter}>
                                        <View style={styles.hwDueInfo}>
                                            {hw.due_date ? (
                                                <View style={styles.dueBadge}>
                                                    <Ionicons name="time-outline" size={12} color="#FBBF24" />
                                                    <Text style={styles.dueText}>Due: {new Date(hw.due_date).toLocaleDateString('en-IN')}</Text>
                                                </View>
                                            ) : null}
                                            <Text style={styles.hwCreated}>
                                                {hw.created_at ? new Date(hw.created_at).toLocaleDateString('en-IN') : ''}
                                            </Text>
                                        </View>

                                        <View style={styles.hwActions}>
                                            <TouchableOpacity
                                                style={styles.actionBtn}
                                                onPress={() => navigation.navigate('AddHomework', { editId: hw.id })}
                                            >
                                                <Ionicons name="pencil" size={16} color="rgba(255, 255, 255, 0.6)" />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={styles.actionBtn}
                                                onPress={() => handleDeleteHomework(hw.id)}
                                            >
                                                <Ionicons name="trash" size={16} color="#EF4444" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            ))
                        )}
                    </View>
                </View>
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'transparent' },
    scrollContent: { paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 110 },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#090514' },
    
    // Profile Card Styles
    profileCard: {
        borderRadius: 24, padding: 20, marginTop: 16, marginBottom: 16,
        borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)',
        overflow: 'hidden',
    },
    profileHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    profileTextContainer: { flex: 1, marginRight: 12 },
    greeting: { fontSize: 12, color: 'rgba(255, 255, 255, 0.4)' },
    userName: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', marginTop: 2 },
    userRole: { fontSize: 12, color: '#C084FC', fontWeight: '600', marginTop: 4 },
    userSubjects: { fontSize: 11, color: 'rgba(255, 255, 255, 0.4)', marginTop: 2 },
    avatarBorder: { width: 52, height: 52, borderRadius: 26, padding: 1.5, justifyContent: 'center', alignItems: 'center' },
    avatarInner: { width: '100%', height: '100%', borderRadius: 24, backgroundColor: '#1A152E', overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
    avatarImage: { width: '100%', height: '100%' },
    avatarText: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },

    // Ratings Card Styles
    ratingsCard: {
        borderRadius: 24, padding: 18, marginBottom: 20,
        borderWidth: 1, borderColor: 'rgba(251, 191, 36, 0.15)',
        overflow: 'hidden',
    },
    ratingsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    ratingsCardTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
    ratingsCardSubtitle: { fontSize: 11, color: 'rgba(255, 255, 255, 0.4)', marginTop: 2 },
    ratingsScoreContainer: { alignItems: 'flex-end' },
    ratingNumber: { fontSize: 22, fontWeight: '800', color: '#FBBF24' },
    starsContainer: { flexDirection: 'row', gap: 2, marginTop: 2 },
    ratingsFooter: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.05)'
    },
    ratingsFooterText: { fontSize: 11, color: 'rgba(255, 255, 255, 0.4)' },

    body: { padding: 0 },
    cardContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.06)',
        padding: 16, marginBottom: 16,
    },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
    addBtn: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(168, 85, 247, 0.1)',
        borderWidth: 1, borderColor: 'rgba(168, 85, 247, 0.2)',
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, gap: 4
    },
    addBtnText: { fontSize: 12, fontWeight: '700', color: '#C084FC' },
    
    // Quick Action Card Style
    actionCard: {
        flexDirection: 'row', backgroundColor: 'rgba(255, 255, 255, 0.02)', 
        borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.06)',
        padding: 16, marginBottom: 16, alignItems: 'center',
    },
    actionIconBg: {
        width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(168, 85, 247, 0.1)',
        borderWidth: 1, borderColor: 'rgba(168, 85, 247, 0.2)',
        justifyContent: 'center', alignItems: 'center', marginRight: 14,
    },
    actionText: { flex: 1 },
    actionTitle: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
    actionSub: { fontSize: 12, color: 'rgba(255, 255, 255, 0.4)', marginTop: 2 },
    
    // Notification Card Styles
    notifCard: {
        flexDirection: 'row', backgroundColor: 'rgba(255, 255, 255, 0.01)', borderRadius: 16, 
        borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.04)', padding: 12,
        marginBottom: 10, alignItems: 'flex-start', gap: 10,
    },
    notifUnread: { borderLeftWidth: 3, borderLeftColor: '#C084FC' },
    notifDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#C084FC', marginTop: 6 },
    notifText: { flex: 1 },
    notifTitle: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
    notifMsg: { fontSize: 12, color: 'rgba(255, 255, 255, 0.5)', marginTop: 2, lineHeight: 16 },
    notifTime: { fontSize: 10, color: 'rgba(255, 255, 255, 0.3)', marginTop: 4 },
    
    // Homework Card Styles
    emptyCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.01)', borderRadius: 18, borderStyle: 'dashed',
        borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', padding: 24, alignItems: 'center', gap: 8,
    },
    emptyText: { fontSize: 12, color: 'rgba(255, 255, 255, 0.3)' },
    hwCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.01)', borderRadius: 16, 
        borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.04)', padding: 14, marginBottom: 10,
    },
    hwHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
    hwTitle: { fontSize: 14, fontWeight: '700', color: '#FFFFFF', flex: 1 },
    hwDesc: { fontSize: 13, color: 'rgba(255, 255, 255, 0.5)', lineHeight: 18, marginBottom: 8 },
    hwFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.04)', paddingTop: 10 },
    hwDueInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    dueBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(251, 191, 36, 0.1)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
    dueText: { fontSize: 10, color: '#FBBF24', fontWeight: '600' },
    hwCreated: { fontSize: 10, color: 'rgba(255, 255, 255, 0.3)' },
    classBadge: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
    classBadgeText: { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
    hwActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    actionBtn: { padding: 4 },
});
