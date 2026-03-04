import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity,
    StatusBar, ActivityIndicator, Image, Modal, TouchableWithoutFeedback, Dimensions, Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../config/supabase';
import { Event, StudentFee, Homework } from '../../types';
import MarksCard from '../../components/MarksCard';
import { useNavigation } from '@react-navigation/native';

type TeacherPreview = { id: string; full_name: string; subjects: string[] | null; photo_url: string | null; qualification: string | null };

export default function ParentHomeScreen() {
    const navigation = useNavigation<any>();
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [feeInfo, setFeeInfo] = useState<StudentFee | null>(null);
    const [events, setEvents] = useState<Event[]>([]);
    const [homework, setHomework] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<TeacherPreview[]>([]);
    // Modal State
    const [selectedHomework, setSelectedHomework] = useState<any | null>(null);
    const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
    const [showMarksCard, setShowMarksCard] = useState(false);

    const fetchData = async () => {
        try {
            // Fetch fee info
            if (user?.id) {
                // Get current academic year ID first
                const { data: yearData } = await supabase
                    .from('academic_years')
                    .select('id')
                    .eq('is_current', true)
                    .single();

                // 1. Try fetching for current year
                let { data: fees } = await supabase
                    .from('student_fees')
                    .select('*')
                    .eq('student_id', user.id)
                    .eq('academic_year_id', yearData?.id)
                    .limit(1);

                // 2. Fallback: If nothing for current year, get most recent record
                if (!fees || fees.length === 0) {
                    const { data: fallbackFees } = await supabase
                        .from('student_fees')
                        .select('*')
                        .eq('student_id', user.id)
                        .order('updated_at', { ascending: false })
                        .limit(1);
                    fees = fallbackFees;
                }

                if (fees && fees.length > 0) {
                    setFeeInfo(fees[0]);
                } else {
                    setFeeInfo(null);
                }
            }

            // Fetch recent homework
            if (user?.class_id) {
                const { data: hwData } = await supabase
                    .from('homework')
                    .select('*, teachers(id, full_name, photo_url, subjects)')
                    .eq('class_id', user.class_id)
                    .gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
                    .order('created_at', { ascending: false })
                    .limit(3);
                setHomework(hwData ?? []);
            }

            // Fetch upcoming events
            const today = new Date().toISOString().split('T')[0];
            const { data: eventsData } = await supabase
                .from('events')
                .select('*')
                .gte('date', today)
                .order('date', { ascending: true })
                .limit(3);
            setEvents(eventsData ?? []);

            // Fetch teachers
            const { data: teachersData } = await supabase
                .from('teachers')
                .select('id, full_name, subjects, photo_url, qualification')
                .order('full_name', { ascending: true });

            setTeachers(teachersData ?? []);
        } catch (e) {
            console.error('Fetch error:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const onRefresh = () => { setRefreshing(true); fetchData(); };

    if (loading) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator size="large" color="#4F63AC" />
            </View>
        );
    }

    const pendingAmount = feeInfo?.amount_pending ?? 0;

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F63AC" />}
            showsVerticalScrollIndicator={false}
        >
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <LinearGradient colors={['#4F63AC', '#6B7FD7']} style={styles.header}>
                <View style={styles.headerContent}>
                    <View>
                        <Text style={styles.greeting}>Hello 👋</Text>
                        <Text style={styles.userName}>{user?.full_name}</Text>
                    </View>
                    <View style={styles.avatarCircle}>
                        {user?.photo_url ? (
                            <Image source={{ uri: user.photo_url }} style={styles.avatarImage} />
                        ) : (
                            <Text style={styles.avatarText}>
                                {user?.full_name?.charAt(0).toUpperCase() ?? 'S'}
                            </Text>
                        )}
                    </View>
                </View>

                {/* Fee Banner */}
                {pendingAmount > 0 && (
                    <View style={styles.feeBanner}>
                        <Ionicons name="warning" size={18} color="#F6AD55" />
                        <Text style={styles.feeBannerText}>
                            Pending Fees: ₹{pendingAmount.toLocaleString('en-IN')}
                        </Text>
                    </View>
                )}
                {pendingAmount === 0 && feeInfo && (
                    <View style={[styles.feeBanner, styles.feePaidBanner]}>
                        <Ionicons name="checkmark-circle" size={18} color="#68D391" />
                        <Text style={styles.feeBannerText}>All fees paid ✅</Text>
                    </View>
                )}
            </LinearGradient>

            <View style={styles.body}>
                {/* Quick Stats */}
                <View style={styles.statsRow}>
                    <View style={[styles.statCard, { borderLeftColor: '#4F63AC' }]}>
                        <Ionicons name="cash-outline" size={22} color="#4F63AC" />
                        <Text style={styles.statValue}>₹{(feeInfo?.amount_paid ?? 0).toLocaleString('en-IN')}</Text>
                        <Text style={styles.statLabel}>Paid</Text>
                    </View>
                    <View style={[styles.statCard, { borderLeftColor: '#E53E3E' }]}>
                        <Ionicons name="alert-circle-outline" size={22} color="#E53E3E" />
                        <Text style={styles.statValue}>₹{(feeInfo?.amount_pending ?? 0).toLocaleString('en-IN')}</Text>
                        <Text style={styles.statLabel}>Pending</Text>
                    </View>
                    <View style={[styles.statCard, { borderLeftColor: '#38A169' }]}>
                        <Ionicons name="cash" size={22} color="#38A169" />
                        <Text style={styles.statValue}>₹{(feeInfo?.total_amount ?? 0).toLocaleString('en-IN')}</Text>
                        <Text style={styles.statLabel}>Total</Text>
                    </View>
                </View>

                {/* Fee Actions */}
                <View style={styles.feeActionsRow}>
                    <TouchableOpacity
                        style={styles.actionBtnSecondary}
                        onPress={() => alert('View Receipts feature coming soon!')}
                    >
                        <Ionicons name="receipt-outline" size={18} color="#4F63AC" />
                        <Text style={styles.actionBtnTextSecondary}>View Receipts</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionBtnPrimary}
                        onPress={() => alert('Online payment integration coming soon!')}
                    >
                        <Ionicons name="card-outline" size={18} color="#FFFFFF" />
                        <Text style={styles.actionBtnTextPrimary}>Pay Fees</Text>
                    </TouchableOpacity>
                </View>

                {/* View Marks Card Button */}
                <TouchableOpacity
                    style={{
                        backgroundColor: '#EBF4FF',
                        borderRadius: 14,
                        paddingVertical: 14,
                        paddingHorizontal: 16,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 16,
                        borderWidth: 1,
                        borderColor: '#BFDBFE',
                    }}
                    onPress={() => setShowMarksCard(true)}
                >
                    <Ionicons name="school" size={20} color="#0071E3" style={{ marginRight: 8 }} />
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#0071E3' }}>
                        View Exam Performance
                    </Text>
                </TouchableOpacity>

                {/* Recent Homework */}
                <Text style={styles.sectionTitle}>📚 Recent Homework</Text>
                {homework.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <Ionicons name="book-outline" size={32} color="#CBD5E0" />
                        <Text style={styles.emptyText}>No recent homework</Text>
                    </View>
                ) : (
                    homework.map((hw) => (
                        <TouchableOpacity
                            key={hw.id}
                            style={styles.hwCard}
                            activeOpacity={0.7}
                            onPress={() => setSelectedHomework(hw)}
                        >
                            <View style={styles.hwHeader}>
                                <Ionicons name="book" size={18} color="#4F63AC" />
                                <Text style={styles.hwTitle}>{hw.title}</Text>
                            </View>
                            {hw.description ? (
                                <Text style={styles.hwDesc} numberOfLines={2}>{hw.description}</Text>
                            ) : null}
                            <View style={styles.hwFooter}>
                                {hw.due_date ? (
                                    <View style={styles.dueBadge}>
                                        <Ionicons name="time-outline" size={12} color="#D69E2E" />
                                        <Text style={styles.dueText}>Due: {new Date(hw.due_date).toLocaleDateString('en-IN')}</Text>
                                    </View>
                                ) : null}
                            </View>
                        </TouchableOpacity>
                    ))
                )}

                {/* Upcoming Events */}
                <Text style={styles.sectionTitle}>📅 Upcoming Events</Text>
                {events.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <Ionicons name="calendar-outline" size={32} color="#CBD5E0" />
                        <Text style={styles.emptyText}>No upcoming events</Text>
                    </View>
                ) : (
                    events.map((event) => (
                        <View key={event.id} style={styles.eventCard}>
                            <View style={styles.eventDateBox}>
                                <Text style={styles.eventDay}>
                                    {new Date(event.date).getDate()}
                                </Text>
                                <Text style={styles.eventMonth}>
                                    {new Date(event.date).toLocaleString('default', { month: 'short' })}
                                </Text>
                            </View>
                            <View style={styles.eventInfo}>
                                <Text style={styles.eventTitle}>{event.title}</Text>
                                {event.description ? (
                                    <Text style={styles.eventDesc} numberOfLines={2}>{event.description}</Text>
                                ) : null}
                                {event.type ? (
                                    <View style={styles.eventTypeBadge}>
                                        <Text style={styles.eventTypeText}>{event.type}</Text>
                                    </View>
                                ) : null}
                            </View>
                        </View>
                    ))
                )}

                {/* Teachers Section */}
                <Text style={styles.sectionTitle}>👩‍🏫 Teachers</Text>
                {teachers.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <Ionicons name="people-outline" size={32} color="#CBD5E0" />
                        <Text style={styles.emptyText}>No teachers found</Text>
                    </View>
                ) : (
                    teachers.map((teacher) => (
                        <View key={teacher.id} style={styles.teacherCard}>
                            <View style={styles.teacherAvatar}>
                                <Text style={styles.teacherAvatarText}>
                                    {teacher.full_name.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                            <View style={styles.teacherInfo}>
                                <Text style={styles.teacherName}>{teacher.full_name}</Text>
                                <Text style={styles.teacherSubjects} numberOfLines={1}>
                                    {(teacher.subjects ?? []).join(', ') || 'No subjects listed'}
                                </Text>
                                {teacher.qualification ? (
                                    <Text style={styles.teacherQual}>{teacher.qualification}</Text>
                                ) : null}
                            </View>
                        </View>
                    ))
                )}
            </View>

            {/* Homework Details Modal */}
            <Modal
                visible={!!selectedHomework}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setSelectedHomework(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Homework Details</Text>
                            <TouchableOpacity onPress={() => setSelectedHomework(null)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color="#4A5568" />
                            </TouchableOpacity>
                        </View>

                        {selectedHomework && (
                            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
                                <Text style={styles.hwDetailTitle}>{selectedHomework.title}</Text>
                                <View style={styles.hwDetailBadgeRow}>
                                    <View style={[styles.dueBadge, { backgroundColor: '#EBF4FF' }]}>
                                        <Ionicons name="calendar-outline" size={14} color="#4F63AC" />
                                        <Text style={[styles.dueText, { color: '#4F63AC' }]}>
                                            Due: {selectedHomework.due_date ? new Date(selectedHomework.due_date).toLocaleDateString('en-IN') : 'N/A'}
                                        </Text>
                                    </View>
                                    <View style={[styles.dueBadge, { backgroundColor: '#EBF4FF' }]}>
                                        <Ionicons name="book-outline" size={14} color="#4F63AC" />
                                        <Text style={[styles.dueText, { color: '#4F63AC' }]}>
                                            {selectedHomework.subject_id || 'Subject'}
                                        </Text>
                                    </View>
                                </View>

                                {/* Teacher Info */}
                                <View style={styles.teacherDetailCard}>
                                    <Text style={styles.teacherDetailLabel}>Assigned By</Text>
                                    <View style={styles.teacherDetailRow}>
                                        <View style={styles.teacherAvatarDetail}>
                                            {selectedHomework.teachers?.photo_url ? (
                                                <Image source={{ uri: selectedHomework.teachers.photo_url }} style={styles.avatarImage} />
                                            ) : (
                                                <Text style={styles.teacherAvatarText}>
                                                    {selectedHomework.teachers?.full_name?.charAt(0).toUpperCase() || 'T'}
                                                </Text>
                                            )}
                                        </View>
                                        <View style={styles.teacherDetailTextCol}>
                                            <Text style={styles.teacherDetailName}>{selectedHomework.teachers?.full_name || 'Admin / Unknown Teacher'}</Text>
                                            <Text style={styles.teacherDetailSubject}>
                                                {selectedHomework.teachers?.subjects ? selectedHomework.teachers.subjects.join(', ') : 'Teacher'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                {(selectedHomework as any).attachments && (selectedHomework as any).attachments.length > 0 && (
                                    <View style={{ marginBottom: 16 }}>
                                        <Text style={styles.hwDetailDescTitle}>Attached Photo:</Text>
                                        <TouchableOpacity
                                            activeOpacity={0.8}
                                            onPress={() => setFullScreenImage((selectedHomework as any).attachments[0])}
                                            style={{ width: '100%', height: 200, borderRadius: 12, overflow: 'hidden', backgroundColor: '#EDF2F7', marginTop: 8 }}>
                                            <Image source={{ uri: (selectedHomework as any).attachments[0] }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
                                        </TouchableOpacity>
                                    </View>
                                )}

                                <Text style={styles.hwDetailDescTitle}>Instructions:</Text>
                                <Text style={styles.hwDetailDesc}>{selectedHomework.description || 'No additional instructions provided.'}</Text>
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Marks Card */}
            {user?.id && (
                <MarksCard
                    visible={showMarksCard}
                    studentId={user.id}
                    examId={null} // Null fetches latest exam by default in MarksCard
                    onClose={() => setShowMarksCard(false)}
                />
            )}
            {/* Full Screen Image Modal */}
            <Modal
                visible={fullScreenImage !== null}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setFullScreenImage(null)}
            >
                <View style={styles.fullScreenImageContainer}>
                    <TouchableOpacity
                        style={styles.fullScreenCloseBtn}
                        onPress={() => setFullScreenImage(null)}
                    >
                        <Ionicons name="close" size={28} color="#FFF" />
                    </TouchableOpacity>
                    {fullScreenImage && (
                        <Image
                            source={{ uri: fullScreenImage }}
                            style={styles.fullScreenImage}
                            resizeMode="contain"
                        />
                    )}
                </View>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F7FAFC' },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7FAFC' },
    header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 24 },
    headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    greeting: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },
    userName: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', marginTop: 2 },
    avatarCircle: {
        width: 48, height: 48, borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center', alignItems: 'center',
        overflow: 'hidden',
    },
    avatarImage: { width: '100%', height: '100%' },
    avatarText: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
    feeBanner: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    },
    feePaidBanner: { backgroundColor: 'rgba(56,161,105,0.3)' },
    feeBannerText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
    body: { padding: 16, gap: 8 },
    statsRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
    statCard: {
        flex: 1, backgroundColor: '#FFFFFF', borderRadius: 14,
        padding: 12, alignItems: 'center', borderLeftWidth: 4,
        elevation: 2,
    },
    statValue: { fontSize: 15, fontWeight: '700', color: '#2D3748', marginTop: 4 },
    statLabel: { fontSize: 11, color: '#A0AEC0', marginTop: 2 },
    feeActionsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    actionBtnPrimary: {
        flex: 1, backgroundColor: '#4F63AC', borderRadius: 12, padding: 12,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        elevation: 2,
    },
    actionBtnSecondary: {
        flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        borderWidth: 1, borderColor: '#E2E8F0', elevation: 1,
    },
    actionBtnTextPrimary: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
    actionBtnTextSecondary: { color: '#4F63AC', fontWeight: '700', fontSize: 14 },
    sectionTitle: { fontSize: 17, fontWeight: '700', color: '#2D3748', marginTop: 12, marginBottom: 8 },
    emptyCard: {
        backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24,
        alignItems: 'center', gap: 8,
    },
    emptyText: { fontSize: 14, color: '#A0AEC0' },
    eventCard: {
        flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 14,
        marginBottom: 10, overflow: 'hidden',
        elevation: 2,
    },
    eventDateBox: {
        backgroundColor: '#4F63AC', width: 60, alignItems: 'center',
        justifyContent: 'center', paddingVertical: 16,
    },
    eventDay: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
    eventMonth: { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
    eventInfo: { flex: 1, padding: 12 },
    eventTitle: { fontSize: 15, fontWeight: '700', color: '#2D3748' },
    eventDesc: { fontSize: 12, color: '#718096', marginTop: 4, lineHeight: 17 },
    eventTypeBadge: {
        alignSelf: 'flex-start', backgroundColor: '#EBF4FF',
        borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginTop: 6,
    },
    eventTypeText: { fontSize: 10, fontWeight: '600', color: '#4F63AC' },
    teacherCard: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
        borderRadius: 14, padding: 12, marginBottom: 10,
        elevation: 2,
    },
    teacherAvatar: {
        width: 48, height: 48, borderRadius: 24,
        backgroundColor: '#EBF4FF', justifyContent: 'center', alignItems: 'center', marginRight: 12,
    },
    teacherAvatarText: { fontSize: 20, fontWeight: '700', color: '#4F63AC' },
    teacherInfo: { flex: 1 },
    teacherName: { fontSize: 15, fontWeight: '700', color: '#2D3748' },
    teacherSubjects: { fontSize: 12, color: '#718096', marginTop: 2 },
    teacherQual: { fontSize: 11, color: '#A0AEC0', marginTop: 2 },
    hwCard: {
        backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 10,
        elevation: 2,
    },
    hwHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
    hwTitle: { fontSize: 15, fontWeight: '700', color: '#2D3748', flex: 1 },
    hwDesc: { fontSize: 13, color: '#718096', lineHeight: 18, marginBottom: 8 },
    hwFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    dueBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFFBEB', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
    dueText: { fontSize: 11, color: '#D69E2E', fontWeight: '600' },
    // Modal Styles
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24,
        maxHeight: '85%', paddingBottom: 30,
    },
    modalHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#EDF2F7',
    },
    modalTitle: { fontSize: 18, fontWeight: '700', color: '#2D3748' },
    closeBtn: { padding: 4, backgroundColor: '#F7FAFC', borderRadius: 20 },
    modalScroll: { padding: 20, gap: 16 },
    hwDetailTitle: { fontSize: 22, fontWeight: '800', color: '#2D3748', marginBottom: 8 },
    hwDetailBadgeRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    teacherDetailCard: {
        backgroundColor: '#F7FAFC', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#EDF2F7', marginBottom: 16,
    },
    teacherDetailLabel: { fontSize: 12, fontWeight: '700', color: '#A0AEC0', textTransform: 'uppercase', marginBottom: 10, letterSpacing: 0.5 },
    teacherDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    teacherAvatarDetail: {
        width: 44, height: 44, borderRadius: 22, backgroundColor: '#4F63AC',
        justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
    },
    teacherDetailTextCol: { flex: 1 },
    teacherDetailName: { fontSize: 16, fontWeight: '700', color: '#2D3748' },
    teacherDetailSubject: { fontSize: 13, color: '#718096', marginTop: 2 },
    hwDetailDescTitle: { fontSize: 16, fontWeight: '700', color: '#2D3748', marginBottom: 6 },
    hwDetailDesc: {
        fontSize: 15,
        color: '#4A5568',
        lineHeight: 24,
    },
    fullScreenImageContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullScreenCloseBtn: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 30,
        right: 20,
        zIndex: 10,
        padding: 8,
    },
    fullScreenImage: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
    }
});
