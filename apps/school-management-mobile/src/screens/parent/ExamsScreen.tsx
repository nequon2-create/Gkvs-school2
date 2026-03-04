import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, RefreshControl, StatusBar, ActivityIndicator, TouchableOpacity, Modal
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../config/supabase';
import { ExamTimetable, ExamSchedule } from '../../types';

type TimetableWithSchedules = ExamTimetable & { exam_schedules: ExamSchedule[] };

const EXAM_GRADIENTS: [string, string][] = [
    ['#667EEA', '#764BA2'],
    ['#F093FB', '#F5576C'],
    ['#4FACFE', '#00F2FE'],
    ['#43E97B', '#38F9D7'],
    ['#FA709A', '#FEE140'],
    ['#30CFD0', '#330867'],
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

        const { data } = await supabase
            .from('exam_timetables')
            .select('*, exam_schedules(*, subjects(subject_name, subject_code))')
            .eq('is_published', true)
            .eq('class_id', user.class_id)
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
                <ActivityIndicator size="large" color="#4F63AC" />
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            showsVerticalScrollIndicator={false}
        >
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={['#4F63AC', '#6B7FD7']} style={styles.header}>
                <Ionicons name="document-text" size={28} color="#FFFFFF" />
                <Text style={styles.headerTitle}>Exams</Text>
            </LinearGradient>

            <View style={styles.body}>
                {exams.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <Ionicons name="document-text-outline" size={48} color="#CBD5E0" />
                        <Text style={styles.emptyTitle}>No Exams Published</Text>
                        <Text style={styles.emptySub}>Exam timetables will appear here when published by admin</Text>
                    </View>
                ) : (
                    exams.map((exam, index) => {
                        const gradient = EXAM_GRADIENTS[index % EXAM_GRADIENTS.length];
                        return (
                            <TouchableOpacity activeOpacity={0.9} key={exam.id} onPress={() => setSelectedExam(exam)}>
                                <LinearGradient
                                    colors={gradient}
                                    style={styles.gradientCard}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <View style={styles.cardPattern1} />
                                    <View style={styles.cardPattern2} />

                                    <View style={styles.relativeBlock}>
                                        <View style={styles.gradientTypeBadge}>
                                            <Text style={styles.gradientTypeText}>{exam.exam_type}</Text>
                                        </View>

                                        <Text style={styles.gradientExamName}>{exam.exam_name}</Text>

                                        <View style={styles.gradientDateContainer}>
                                            <Ionicons name="calendar" size={16} color="rgba(255,255,255,0.9)" />
                                            <Text style={styles.gradientDateText}>
                                                {exam.start_date ? new Date(exam.start_date).toLocaleDateString('en-GB') : '—'}
                                                {' - '}
                                                {exam.end_date ? new Date(exam.end_date).toLocaleDateString('en-GB') : '—'}
                                            </Text>
                                        </View>
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>
                        );
                    })
                )}
            </View>

            {/* Exam Details Modal */}
            <Modal
                visible={!!selectedExam}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setSelectedExam(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {selectedExam && (
                            <>
                                <View style={styles.modalHeader}>
                                    <View>
                                        <Text style={styles.modalTitle}>{selectedExam.exam_name}</Text>
                                        <Text style={styles.modalType}>{selectedExam.exam_type} Exam</Text>
                                    </View>
                                    <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedExam(null)}>
                                        <Ionicons name="close" size={24} color="#A0AEC0" />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.modalDateBox}>
                                    <Ionicons name="calendar" size={18} color="#4F63AC" />
                                    <Text style={styles.modalDateBoxText}>
                                        {selectedExam.start_date ? new Date(selectedExam.start_date).toLocaleDateString('en-GB') : '—'}  -  {selectedExam.end_date ? new Date(selectedExam.end_date).toLocaleDateString('en-GB') : '—'}
                                    </Text>
                                </View>

                                <ScrollView style={{ maxHeight: 400 }}>
                                    <View style={styles.tableHeader}>
                                        <Text style={[styles.tableColSubject, styles.tableHeadText]}>Subject</Text>
                                        <Text style={[styles.tableColDate, styles.tableHeadText, { textAlign: 'center' }]}>Date</Text>
                                        <Text style={[styles.tableColTime, styles.tableHeadText, { textAlign: 'center' }]}>Time</Text>
                                    </View>
                                    {selectedExam.exam_schedules.map((schedule, idx) => (
                                        <View key={schedule.id} style={[styles.tableRow, idx === selectedExam.exam_schedules.length - 1 && { borderBottomWidth: 0 }]}>
                                            <Text style={[styles.tableColSubject, styles.tableRowText]}>
                                                {/* In TS types subject_name might not exist directly without join, but we will print what we have. If it's a UUID we need to fetch subjects. Let's assume we map it or they just see subject ID if we didn't join. Wait, we fetched `exam_schedules(*)`. In Supabase we should fetch `subjects(subject_name)`. Let me check if it works. */}
                                                {(schedule as any).subjects?.subject_name || 'Subject'}
                                            </Text>
                                            <Text style={[styles.tableColDate, styles.tableRowText, { textAlign: 'center' }]}>
                                                {new Date(schedule.exam_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                            </Text>
                                            <Text style={[styles.tableColTime, styles.tableRowText, { textAlign: 'center', color: '#4F63AC', fontWeight: '600' }]}>
                                                {schedule.exam_time?.substring(0, 5)}
                                            </Text>
                                        </View>
                                    ))}
                                </ScrollView>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F7FAFC' },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7FAFC' },
    header: {
        paddingTop: 56, paddingBottom: 24, paddingHorizontal: 20,
        flexDirection: 'row', alignItems: 'center', gap: 10,
    },
    headerTitle: { fontSize: 22, fontWeight: '700', color: '#FFFFFF' },
    body: { padding: 16 },

    gradientCard: {
        borderRadius: 24,
        padding: 24,
        marginBottom: 20,
        position: 'relative',
        overflow: 'hidden',
        elevation: 6,
        shadowColor: 'rgba(0,0,0,0.5)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    cardPattern1: { position: 'absolute', top: -40, right: -40, width: 120, height: 120, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 60 },
    cardPattern2: { position: 'absolute', bottom: -20, left: -20, width: 80, height: 80, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 40 },
    relativeBlock: { position: 'relative', zIndex: 1 },
    gradientTypeBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 12 },
    gradientTypeText: { color: '#FFF', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    gradientExamName: { color: '#FFF', fontSize: 24, fontWeight: '800', marginBottom: 16 },
    gradientDateContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    gradientDateText: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '500' },

    emptyCard: {
        backgroundColor: '#FFFFFF', borderRadius: 20, padding: 48,
        alignItems: 'center', gap: 10, marginTop: 40,
    },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: '#4A5568' },
    emptySub: { fontSize: 13, color: '#A0AEC0', textAlign: 'center' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
    modalTitle: { fontSize: 22, fontWeight: '800', color: '#2D3748' },
    modalType: { fontSize: 14, color: '#718096', fontWeight: '500', marginTop: 4 },
    closeBtn: { padding: 4, backgroundColor: '#EDF2F7', borderRadius: 20 },
    modalDateBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#EBF4FF', padding: 14, borderRadius: 12, marginBottom: 20 },
    modalDateBoxText: { fontSize: 14, fontWeight: '600', color: '#4F63AC' },

    tableHeader: { flexDirection: 'row', backgroundColor: '#F7FAFC', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', borderTopLeftRadius: 8, borderTopRightRadius: 8 },
    tableHeadText: { fontSize: 13, fontWeight: '700', color: '#4A5568' },
    tableRow: { flexDirection: 'row', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#EDF2F7' },
    tableRowText: { fontSize: 14, color: '#2D3748' },
    tableColSubject: { flex: 2 },
    tableColDate: { flex: 1 },
    tableColTime: { flex: 1 },
});
