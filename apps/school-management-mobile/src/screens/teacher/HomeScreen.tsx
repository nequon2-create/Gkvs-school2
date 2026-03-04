import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, RefreshControl, StatusBar, ActivityIndicator, Image, TouchableOpacity, Alert
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
        return <View style={styles.loader}><ActivityIndicator size="large" color="#2D7D46" /></View>;
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2D7D46" />}
            showsVerticalScrollIndicator={false}
        >
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={['#2D7D46', '#3DA05A']} style={styles.header}>
                <View style={styles.headerContent}>
                    <View>
                        <Text style={styles.greeting}>Welcome back 👋</Text>
                        <Text style={styles.userName}>{user?.full_name}</Text>
                    </View>
                    <View style={styles.avatarCircle}>
                        {user?.photo_url ? (
                            <Image source={{ uri: user.photo_url }} style={styles.avatarImage} />
                        ) : (
                            <Text style={styles.avatarText}>{user?.full_name?.charAt(0).toUpperCase()}</Text>
                        )}
                    </View>
                </View>
            </LinearGradient>

            <View style={styles.body}>
                {/* Quick Actions */}
                <TouchableOpacity
                    style={styles.actionCard}
                    onPress={() => navigation.navigate('TeacherClassList')}
                >
                    <View style={styles.actionIconBg}>
                        <Ionicons name="people" size={24} color="#2D7D46" />
                    </View>
                    <View style={styles.actionText}>
                        <Text style={styles.actionTitle}>My Students & Classes</Text>
                        <Text style={styles.actionSub}>View class lists and student profiles</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#A0AEC0" />
                </TouchableOpacity>

                {/* Notifications */}
                {notifications.length > 0 && (
                    <>
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
                    </>
                )}

                {/* Homework */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>📚 My Homework Assignments</Text>
                    <TouchableOpacity
                        style={styles.addBtn}
                        onPress={() => navigation.navigate('AddHomework')}
                    >
                        <Ionicons name="add" size={16} color="#2D7D46" />
                        <Text style={styles.addBtnText}>Add</Text>
                    </TouchableOpacity>
                </View>

                {homework.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <Ionicons name="book-outline" size={40} color="#CBD5E0" />
                        <Text style={styles.emptyText}>No assignments yet</Text>
                    </View>
                ) : (
                    homework.map((hw) => (
                        <View key={hw.id} style={styles.hwCard}>
                            <View style={styles.hwHeader}>
                                <Ionicons name="book" size={18} color="#2D7D46" />
                                <Text style={styles.hwTitle}>{hw.title}</Text>
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
                                            <Ionicons name="time-outline" size={12} color="#D69E2E" />
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
                                        <Ionicons name="pencil" size={18} color="#4A5568" />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.actionBtn}
                                        onPress={() => handleDeleteHomework(hw.id)}
                                    >
                                        <Ionicons name="trash" size={18} color="#E53E3E" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    ))
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F7FAFC' },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7FAFC' },
    header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 24 },
    headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    greeting: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },
    userName: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', marginTop: 2 },
    avatarCircle: {
        width: 48, height: 48, borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center',
        overflow: 'hidden',
    },
    avatarImage: { width: '100%', height: '100%' },
    avatarText: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
    body: { padding: 16 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 8 },
    sectionTitle: { fontSize: 17, fontWeight: '700', color: '#2D3748' },
    addBtn: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#E6F4EA',
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, gap: 4
    },
    addBtnText: { fontSize: 13, fontWeight: '700', color: '#2D7D46' },
    actionCard: {
        flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
        marginBottom: 16, alignItems: 'center', elevation: 2,
    },
    actionIconBg: {
        width: 48, height: 48, borderRadius: 24, backgroundColor: '#E6F4EA',
        justifyContent: 'center', alignItems: 'center', marginRight: 14,
    },
    actionText: { flex: 1 },
    actionTitle: { fontSize: 16, fontWeight: '700', color: '#2D3748' },
    actionSub: { fontSize: 13, color: '#718096', marginTop: 2 },
    notifCard: {
        flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14,
        marginBottom: 10, alignItems: 'flex-start', gap: 10,
        elevation: 2,
    },
    notifUnread: { borderLeftWidth: 3, borderLeftColor: '#2D7D46' },
    notifDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2D7D46', marginTop: 5 },
    notifText: { flex: 1 },
    notifTitle: { fontSize: 14, fontWeight: '700', color: '#2D3748' },
    notifMsg: { fontSize: 12, color: '#718096', marginTop: 3, lineHeight: 17 },
    notifTime: { fontSize: 11, color: '#A0AEC0', marginTop: 4 },
    emptyCard: {
        backgroundColor: '#FFFFFF', borderRadius: 16, padding: 32,
        alignItems: 'center', gap: 8,
    },
    emptyText: { fontSize: 14, color: '#A0AEC0' },
    hwCard: {
        backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 10,
        elevation: 2,
    },
    hwHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
    hwTitle: { fontSize: 15, fontWeight: '700', color: '#2D3748', flex: 1 },
    hwDesc: { fontSize: 13, color: '#718096', lineHeight: 18, marginBottom: 8 },
    hwFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#EDF2F7', paddingTop: 10 },
    hwDueInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    dueBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFFBEB', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
    dueText: { fontSize: 11, color: '#D69E2E', fontWeight: '600' },
    hwCreated: { fontSize: 11, color: '#A0AEC0' },
    classBadge: { backgroundColor: '#EDF2F7', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
    classBadgeText: { fontSize: 10, fontWeight: '700', color: '#4A5568' },
    hwActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    actionBtn: { padding: 4 },
});
