import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, RefreshControl, StatusBar, ActivityIndicator, TouchableOpacity, Modal, Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../config/supabase';
import { ExamTimetable, ExamSchedule } from '../../types';
import { AppleTouchable } from '../../components/AppleTouchable';

type TimetableWithSchedules = ExamTimetable & { exam_schedules: ExamSchedule[] };

const EXAM_GRADIENTS: [string, string][] = [
    ['#0071E3', '#4facfe'],
    ['#5856D6', '#AF52DE'],
    ['#FF2D55', '#FF375F'],
    ['#34C759', '#30D158'],
    ['#FF9500', '#FFB340'],
    ['#32ADE6', '#0071E3'],
];

export default function ParentExamsScreen() {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [exams, setExams] = useState<TimetableWithSchedules[]>([]);
    const [selectedExam, setSelectedExam] = useState<TimetableWithSchedules | null>(null);

    const fetchExams = async () => {
        if (!user?.class_id) {
            setLoading(false);
            setRefreshing(false);
            return;
        }

        // 1-Month Auto-Cleanup rule: filter out / delete exam timetables older than 30 days
        const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const { data } = await supabase
            .from('exam_timetables')
            .select('*, exam_schedules(*, subjects(subject_name, subject_code))')
            .eq('is_published', true)
            .eq('class_id', user.class_id)
            .gte('end_date', oneMonthAgo)
            .order('start_date', { ascending: true });

        // Sort schedules by date inside each exam
        const sortedExams = (data ?? []).map(exam => ({
            ...exam,
            exam_schedules: (exam.exam_schedules || []).sort((a: ExamSchedule, b: ExamSchedule) =>
                new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime()
            )
        }));

        setExams(sortedExams as TimetableWithSchedules[]);
        setLoading(false);
        setRefreshing(false);
    };

    useEffect(() => { fetchExams(); }, [user?.class_id]);
    const onRefresh = () => { setRefreshing(true); fetchExams(); };

    if (loading) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator size="large" color="#0071E3" />
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0071E3" />}
            showsVerticalScrollIndicator={false}
        >
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={['#0071E3', '#005bb5']} style={styles.header}>
                <View style={styles.headerIconBox}>
                    <Ionicons name="calendar" size={24} color="#0071E3" />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerSubtitle}>ACADEMIC TIMETABLES</Text>
                    <Text style={styles.headerTitle}>Exam Schedules</Text>
                </View>
            </LinearGradient>

            <View style={styles.body}>
                {exams.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <View style={styles.emptyIconCircle}>
                            <Ionicons name="calendar-outline" size={36} color="#8E8E93" />
                        </View>
                        <Text style={styles.emptyTitle}>No Active Exams</Text>
                        <Text style={styles.emptySub}>
                            Exam timetables are shown here when published. Timetables auto-archive after 1 month.
                        </Text>
                    </View>
                ) : (
                    exams.map((exam, index) => {
                        const gradient = EXAM_GRADIENTS[index % EXAM_GRADIENTS.length];
                        return (
                            <AppleTouchable
                                key={exam.id}
                                onPress={() => setSelectedExam(exam)}
                                style={styles.cardTouchable}
                            >
                                <LinearGradient
                                    colors={gradient}
                                    style={styles.gradientCard}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <View style={styles.cardPattern1} />
                                    <View style={styles.cardPattern2} />

                                    <View style={styles.relativeBlock}>
                                        <View style={styles.cardHeaderRow}>
                                            <View style={styles.gradientTypeBadge}>
                                                <Text style={styles.gradientTypeText}>{exam.exam_type}</Text>
                                            </View>
                                            <View style={styles.cardChevronBox}>
                                                <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.9)" />
                                            </View>
                                        </View>

                                        <Text style={styles.gradientExamName}>{exam.exam_name}</Text>

                                        <View style={styles.gradientDateContainer}>
                                            <Ionicons name="time-outline" size={15} color="rgba(255,255,255,0.9)" />
                                            <Text style={styles.gradientDateText}>
                                                {exam.start_date ? new Date(exam.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}
                                                {'  →  '}
                                                {exam.end_date ? new Date(exam.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                                            </Text>
                                        </View>
                                    </View>
                                </LinearGradient>
                            </AppleTouchable>
                        );
                    })
                )}
            </View>

            {/* Apple iOS Bottom Sheet Modal */}
            <Modal
                visible={!!selectedExam}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setSelectedExam(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {/* iOS Grabber */}
                        <View style={styles.modalGrabber} />

                        {selectedExam && (
                            <>
                                <View style={styles.modalHeader}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.modalTitle}>{selectedExam.exam_name}</Text>
                                        <Text style={styles.modalType}>{selectedExam.exam_type} Exam Timetable</Text>
                                    </View>
                                    <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedExam(null)}>
                                        <Ionicons name="close" size={20} color="#8E8E93" />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.modalDateBox}>
                                    <Ionicons name="calendar" size={16} color="#0071E3" />
                                    <Text style={styles.modalDateBoxText}>
                                        {selectedExam.start_date ? new Date(selectedExam.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}
                                        {' - '}
                                        {selectedExam.end_date ? new Date(selectedExam.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                                        {' • '}
                                        {selectedExam.exam_schedules?.length || 0} Subjects
                                    </Text>
                                </View>

                                <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                                    <View style={styles.scheduleList}>
                                        {selectedExam.exam_schedules.map((schedule, idx) => (
                                            <View key={schedule.id || idx} style={styles.scheduleCard}>
                                                <View style={styles.subjectIconBox}>
                                                    <Ionicons name="book" size={16} color="#0071E3" />
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.scheduleSubjectName}>
                                                        {(schedule as any).subjects?.subject_name || 'Subject'}
                                                    </Text>
                                                    <View style={styles.scheduleMetaRow}>
                                                        <View style={styles.datePill}>
                                                            <Ionicons name="calendar-outline" size={12} color="#8E8E93" />
                                                            <Text style={styles.datePillText}>
                                                                {new Date(schedule.exam_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                                                            </Text>
                                                        </View>
                                                        <View style={styles.timePill}>
                                                            <Ionicons name="time-outline" size={12} color="#0071E3" />
                                                            <Text style={styles.timePillText}>
                                                                {schedule.exam_time?.substring(0, 5)}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                </ScrollView>

                                <AppleTouchable
                                    style={styles.doneButton}
                                    onPress={() => setSelectedExam(null)}
                                >
                                    <Text style={styles.doneButtonText}>Done</Text>
                                </AppleTouchable>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F2F2F7' },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F2F2F7' },
    header: {
        paddingTop: Platform.OS === 'ios' ? 60 : 50,
        paddingBottom: 24,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    headerIconBox: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    headerSubtitle: {
        fontSize: 11,
        fontWeight: '700',
        color: 'rgba(255, 255, 255, 0.75)',
        letterSpacing: 0.6,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: -0.4,
    },
    body: { padding: 16 },

    cardTouchable: {
        marginBottom: 16,
    },
    gradientCard: {
        borderRadius: 22,
        padding: 22,
        position: 'relative',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
    },
    cardPattern1: {
        position: 'absolute',
        top: -40,
        right: -40,
        width: 130,
        height: 130,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 65,
    },
    cardPattern2: {
        position: 'absolute',
        bottom: -30,
        left: -30,
        width: 90,
        height: 90,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 45,
    },
    relativeBlock: { position: 'relative', zIndex: 1 },
    cardHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    gradientTypeBadge: {
        backgroundColor: 'rgba(255,255,255,0.25)',
        borderRadius: 980,
        paddingHorizontal: 12,
        paddingVertical: 5,
    },
    gradientTypeText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    cardChevronBox: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    gradientExamName: {
        color: '#FFF',
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 14,
        letterSpacing: -0.3,
    },
    gradientDateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(0,0,0,0.12)',
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 980,
    },
    gradientDateText: {
        color: 'rgba(255,255,255,0.95)',
        fontSize: 13,
        fontWeight: '600',
    },

    emptyCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 22,
        padding: 48,
        alignItems: 'center',
        gap: 10,
        marginTop: 32,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
    },
    emptyIconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#F2F2F7',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 6,
    },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1D1D1F' },
    emptySub: { fontSize: 13, color: '#8E8E93', textAlign: 'center', lineHeight: 18 },

    /* iOS Bottom Sheet Modal */
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 44 : 28,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
    },
    modalGrabber: {
        width: 36,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: '#D1D1D6',
        alignSelf: 'center',
        marginBottom: 16,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    modalTitle: { fontSize: 22, fontWeight: '800', color: '#1D1D1F', letterSpacing: -0.3 },
    modalType: { fontSize: 13, color: '#8E8E93', fontWeight: '500', marginTop: 3 },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F2F2F7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalDateBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(0, 113, 227, 0.06)',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        marginBottom: 16,
    },
    modalDateBoxText: { fontSize: 13, fontWeight: '600', color: '#0071E3' },

    scheduleList: {
        gap: 10,
        paddingBottom: 8,
    },
    scheduleCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#F2F2F7',
        borderRadius: 14,
        padding: 14,
    },
    subjectIconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 2,
    },
    scheduleSubjectName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1D1D1F',
        marginBottom: 4,
    },
    scheduleMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    datePill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    datePillText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#1D1D1F',
    },
    timePill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(0, 113, 227, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    timePillText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#0071E3',
    },

    doneButton: {
        backgroundColor: '#0071E3',
        height: 50,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 18,
        shadowColor: '#0071E3',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    doneButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
