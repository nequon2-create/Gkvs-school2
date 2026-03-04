import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, RefreshControl, StatusBar, ActivityIndicator, TouchableOpacity, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../config/supabase';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, Student, SchoolClass } from '../../types';
import MarksCard from '../../components/MarksCard';

type Props = NativeStackScreenProps<RootStackParamList, 'StudentProfile'>;

export default function StudentProfileScreen({ route, navigation }: Props) {
    const { studentId } = route.params;
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [student, setStudent] = useState<Student | null>(null);
    const [schoolClass, setSchoolClass] = useState<SchoolClass | null>(null);
    const [attendanceStats, setAttendanceStats] = useState({ total: 0, present: 0 });
    const [marks, setMarks] = useState<any[]>([]);
    const [selectedExamId, setSelectedExamId] = useState<string | null>(null);

    const fetchData = async () => {
        const { data: studentData } = await supabase
            .from('students').select('*').eq('id', studentId).single();
        setStudent(studentData);

        if (studentData?.class_id) {
            const { data: classData } = await supabase
                .from('classes').select('*').eq('id', studentData.class_id).single();
            setSchoolClass(classData);

            const { data: attData } = await supabase
                .from('student_attendance')
                .select('is_present')
                .eq('student_id', studentId);
            const total = attData?.length ?? 0;
            const present = attData?.filter((a) => a.is_present === true).length ?? 0;
            setAttendanceStats({ total, present });
        }

        // Fetch marks history
        const { data: marksData } = await supabase
            .from('marks')
            .select(`
                id,
                marks_obtained,
                grade,
                exams (id, exam_name, total_marks, exam_date)
            `)
            .eq('student_id', studentId)
            .order('created_at', { ascending: false });

        // Group marks by exam for the UI list
        if (marksData) {
            const uniqueExamsMap = new Map();
            marksData.forEach(m => {
                const examObj = Array.isArray(m.exams) ? m.exams[0] : m.exams;
                if (examObj && !uniqueExamsMap.has(examObj.id)) {
                    uniqueExamsMap.set(examObj.id, examObj);
                }
            });
            setMarks(Array.from(uniqueExamsMap.values()));
        }
        setLoading(false);
        setRefreshing(false);
    };

    useEffect(() => { fetchData(); }, [studentId]);
    const onRefresh = () => { setRefreshing(true); fetchData(); };

    if (loading) {
        return <View style={styles.loader}><ActivityIndicator size="large" color="#2D7D46" /></View>;
    }

    const absent = attendanceStats.total > 0 ? attendanceStats.total - attendanceStats.present : 0;
    const attendancePct = attendanceStats.total > 0
        ? Math.round((attendanceStats.present / attendanceStats.total) * 100)
        : 0;

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2D7D46" />}
            showsVerticalScrollIndicator={false}
        >
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={['#2D7D46', '#3DA05A']} style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>

                <View style={styles.avatarCircle}>
                    {student?.photo_url ? (
                        <Image source={{ uri: student.photo_url }} style={styles.avatarImage} />
                    ) : (
                        <Text style={styles.avatarText}>{student?.full_name?.charAt(0).toUpperCase()}</Text>
                    )}
                </View>
                <Text style={styles.name}>{student?.full_name}</Text>
                <Text style={styles.regNo}>{student?.registration_number ?? 'No Reg. No.'}</Text>
                <View style={styles.classBadge}>
                    <Text style={styles.classBadgeText}>
                        Class {schoolClass?.class_name ?? '—'} {student?.section ?? ''}
                    </Text>
                </View>
            </LinearGradient>

            <View style={styles.body}>
                {/* Attendance Stats */}
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{attendanceStats.total}</Text>
                        <Text style={styles.statLabel}>Total Days</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={[styles.statValue, { color: '#38A169' }]}>{attendanceStats.present}</Text>
                        <Text style={styles.statLabel}>Present</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={[styles.statValue, { color: '#E53E3E' }]}>{absent}</Text>
                        <Text style={styles.statLabel}>Absent</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={[styles.statValue, { color: attendancePct < 75 ? '#E53E3E' : '#2D7D46' }]}>{attendancePct}%</Text>
                        <Text style={styles.statLabel}>Attendance</Text>
                    </View>
                </View>

                {/* Info Section */}
                <View style={styles.infoCard}>
                    <Text style={styles.infoHeader}>Student Information</Text>
                    {[
                        { icon: 'person-outline', label: 'Full Name', value: student?.full_name },
                        { icon: 'calendar-outline', label: 'Date of Birth', value: student?.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString('en-IN') : null },
                        { icon: 'male-female-outline', label: 'Gender', value: student?.gender },
                        { icon: 'ribbon-outline', label: 'Roll Number', value: student?.roll_number },
                        { icon: 'location-outline', label: 'Address', value: student?.address },
                        { icon: 'call-outline', label: "Parent's Phone", value: student?.parent_phone },
                        { icon: 'mail-outline', label: "Parent's Email", value: student?.parent_email },
                    ].map((item, index) =>
                        item.value ? (
                            <View key={item.label} style={[styles.infoRow, index === 7 && { borderBottomWidth: 0 }]}>
                                <Ionicons name={item.icon as any} size={18} color="#718096" style={styles.infoIcon} />
                                <View style={styles.infoText}>
                                    <Text style={styles.infoLabel}>{item.label}</Text>
                                    <Text style={styles.infoValue}>{item.value}</Text>
                                </View>
                            </View>
                        ) : null
                    )}
                </View>

                {/* Exams List (To open marks card) */}
                {marks.length > 0 && (
                    <View style={[styles.infoCard, { marginTop: 16 }]}>
                        <Text style={styles.infoHeader}>Recent Exam Results</Text>
                        {marks.map((exam, index) => (
                            <TouchableOpacity
                                key={exam.id}
                                onPress={() => setSelectedExamId(exam.id)}
                                style={[styles.infoRow, { justifyContent: 'space-between', paddingVertical: 14 }, index === marks.length - 1 && { borderBottomWidth: 0 }]}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#EBF5FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                                        <Ionicons name="document-text" size={20} color="#0071E3" />
                                    </View>
                                    <View>
                                        <Text style={{ fontSize: 15, fontWeight: '600', color: '#1D1D1F' }}>{exam.exam_name}</Text>
                                        <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
                                            {exam.exam_date ? new Date(exam.exam_date).toLocaleDateString() : 'N/A'}
                                        </Text>
                                    </View>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                <View style={{ height: 40 }} />
            </View>

            {/* Marks Card Modal */}
            <MarksCard
                visible={selectedExamId !== null}
                studentId={studentId}
                examId={selectedExamId}
                onClose={() => setSelectedExamId(null)}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F7FAFC' },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7FAFC' },
    header: { paddingTop: 60, paddingBottom: 32, alignItems: 'center', paddingHorizontal: 20 },
    headerTop: { width: '100%', flexDirection: 'row', justifyContent: 'flex-start', marginBottom: 10 },
    backBtn: { padding: 4 },
    avatarCircle: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center', marginBottom: 12,
        overflow: 'hidden',
    },
    avatarImage: { width: '100%', height: '100%' },
    avatarText: { fontSize: 32, fontWeight: '800', color: '#FFFFFF' },
    name: { fontSize: 22, fontWeight: '700', color: '#FFFFFF' },
    regNo: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
    classBadge: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4, marginTop: 10 },
    classBadgeText: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },
    body: { padding: 16, gap: 12 },
    statsRow: { flexDirection: 'row', gap: 10 },
    statCard: {
        flex: 1, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, alignItems: 'center',
        elevation: 2,
    },
    statValue: { fontSize: 22, fontWeight: '800', color: '#2D3748' },
    statLabel: { fontSize: 11, color: '#A0AEC0', marginTop: 2 },
    infoCard: {
        backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, elevation: 2,
    },
    infoHeader: { fontSize: 15, fontWeight: '700', color: '#2D3748', marginBottom: 14 },
    infoRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F4F8' },
    infoIcon: { marginRight: 12, marginTop: 2 },
    infoText: { flex: 1 },
    infoLabel: { fontSize: 11, color: '#A0AEC0', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    infoValue: { fontSize: 14, color: '#2D3748', fontWeight: '500', marginTop: 2 },
});
