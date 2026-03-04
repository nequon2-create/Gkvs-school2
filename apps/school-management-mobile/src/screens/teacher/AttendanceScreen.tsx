import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, RefreshControl, StatusBar, ActivityIndicator,
    TouchableOpacity, Alert, FlatList, Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../config/supabase';
import { Student, SchoolClass } from '../../types';

type StudentWithStatus = Student & { status: 'present' | 'absent' | 'late' | 'none' };

export default function TeacherAttendanceScreen() {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [selectedClass, setSelectedClass] = useState<SchoolClass | null>(null);
    const [students, setStudents] = useState<StudentWithStatus[]>([]);
    const [selectedDate, setSelectedDate] = useState(new Date());

    const getDbDateString = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const fetchClasses = async () => {
        const { data } = await supabase
            .from('classes').select('*').order('class_name');
        setClasses(data ?? []);
        setLoading(false); setRefreshing(false);
    };

    const fetchStudents = async (cls: SchoolClass, dateObj: Date = selectedDate) => {
        setLoading(true);
        const dateStr = getDbDateString(dateObj);

        const { data: currentYear } = await supabase
            .from('academic_years')
            .select('id')
            .eq('is_current', true)
            .single();

        const yearId = currentYear?.id;

        const { data: studs } = await supabase
            .from('students').select('*').eq('class_id', cls.id).eq('academic_year_id', yearId).eq('is_active', true).order('roll_number');
        const { data: existing } = await supabase
            .from('student_attendance').select('*').eq('class_id', cls.id).eq('date', dateStr);

        const studentsWithStatus: StudentWithStatus[] = (studs ?? []).map((s) => {
            const att = existing?.find((a) => a.student_id === s.id);
            let status: 'present' | 'absent' | 'none' = 'none';
            if (att) {
                status = att.is_present ? 'present' : 'absent';
            }
            return { ...s, status };
        });
        setStudents(studentsWithStatus);
        setLoading(false);
    };

    useEffect(() => { fetchClasses(); }, []);
    const onRefresh = () => { setRefreshing(true); fetchClasses(); };

    const toggleStatus = (studentId: string, newStatus: 'present' | 'absent') => {
        setStudents((prev) =>
            prev.map((s) => s.id === studentId ? { ...s, status: s.status === newStatus ? 'none' : newStatus } : s)
        );
    };

    const saveAttendance = async () => {
        if (!selectedClass || !user?.id) return;
        setSaving(true);
        try {
            const dateStr = getDbDateString(selectedDate);
            const records = students
                .filter((s) => s.status !== 'none')
                .map((s) => ({
                    student_id: s.id,
                    class_id: selectedClass.id,
                    date: dateStr,
                    is_present: s.status === 'present',
                    marked_by: user.id,
                }));

            if (records.length > 0) {
                const { error } = await supabase
                    .from('student_attendance')
                    .upsert(records.map(r => ({ ...r, marked_at: new Date().toISOString() })), { onConflict: 'student_id,date' });
                if (error) throw error;
            }
            Alert.alert('✅ Saved', `Attendance saved for ${records.length} students`);
        } catch (error: any) {
            console.error('Save attendance error:', error);
            Alert.alert('Error', `Failed to save attendance: ${error.message || 'Please try again.'}`);
        } finally {
            setSaving(false);
        }
    };

    if (loading && !selectedClass) {
        return <View style={styles.loader}><ActivityIndicator size="large" color="#2D7D46" /></View>;
    }

    // Class selection view
    if (!selectedClass) {
        return (
            <ScrollView
                style={styles.container}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                showsVerticalScrollIndicator={false}
            >
                <LinearGradient colors={['#2D7D46', '#3DA05A']} style={styles.header}>
                    <Ionicons name="checkmark-circle" size={28} color="#FFFFFF" />
                    <Text style={styles.headerTitle}>Attendance</Text>
                </LinearGradient>

                <View style={styles.body}>
                    <Text style={styles.sectionTitle}>📋 Select a Class</Text>
                    <Text style={styles.dateLabel}>Date: {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</Text>

                    {classes.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Ionicons name="people-outline" size={40} color="#CBD5E0" />
                            <Text style={styles.emptyText}>No classes found</Text>
                        </View>
                    ) : (
                        classes.map((cls) => (
                            <TouchableOpacity key={cls.id} style={styles.classCard} onPress={() => { setSelectedClass(cls); fetchStudents(cls); }}>
                                <View style={styles.classIcon}>
                                    <Text style={styles.classIconText}>{cls.class_name.charAt(0)}</Text>
                                </View>
                                <View style={styles.classInfo}>
                                    <Text style={styles.className}>Class {cls.class_name} {cls.section ?? ''}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#A0AEC0" />
                            </TouchableOpacity>
                        ))
                    )}
                </View>
            </ScrollView>
        );
    }

    // Student attendance marking view
    const presentCount = students.filter((s) => s.status === 'present').length;
    const absentCount = students.filter((s) => s.status === 'absent').length;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={['#2D7D46', '#3DA05A']} style={styles.header}>
                <TouchableOpacity onPress={() => setSelectedClass(null)} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Class {selectedClass.class_name} {selectedClass.section ?? ''}</Text>
            </LinearGradient>

            {/* Date Selector */}
            <View style={styles.dateSelector}>
                <TouchableOpacity
                    onPress={() => {
                        const prev = new Date(selectedDate);
                        prev.setDate(prev.getDate() - 1);
                        setSelectedDate(prev);
                        fetchStudents(selectedClass, prev);
                    }}
                    style={styles.dateBtn}
                >
                    <Ionicons name="chevron-back" size={24} color="#2D7D46" />
                </TouchableOpacity>
                <View style={styles.dateDisp}>
                    <Ionicons name="calendar-outline" size={18} color="#4A5568" style={{ marginRight: 6 }} />
                    <Text style={styles.dateDispText}>
                        {selectedDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                    </Text>
                </View>
                <TouchableOpacity
                    onPress={() => {
                        const next = new Date(selectedDate);
                        next.setDate(next.getDate() + 1);
                        setSelectedDate(next);
                        fetchStudents(selectedClass, next);
                    }}
                    style={styles.dateBtn}
                >
                    <Ionicons name="chevron-forward" size={24} color="#2D7D46" />
                </TouchableOpacity>
            </View>

            {/* Stats bar */}
            <View style={styles.statsBar}>
                <View style={styles.statItem}>
                    <Text style={[styles.statNum, { color: '#38A169' }]}>{presentCount}</Text>
                    <Text style={styles.statLbl}>Present</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={[styles.statNum, { color: '#E53E3E' }]}>{absentCount}</Text>
                    <Text style={styles.statLbl}>Absent</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={[styles.statNum, { color: '#A0AEC0' }]}>{students.length - presentCount - absentCount}</Text>
                    <Text style={styles.statLbl}>Unmarked</Text>
                </View>
            </View>

            {loading ? (
                <View style={styles.loader}><ActivityIndicator size="large" color="#2D7D46" /></View>
            ) : (
                <FlatList
                    data={students}
                    keyExtractor={(s) => s.id}
                    contentContainerStyle={{ padding: 16 }}
                    renderItem={({ item }) => (
                        <View style={styles.studentRow}>
                            <View style={styles.studentInfo}>
                                <View style={styles.avatarContainer}>
                                    {item.photo_url ? (
                                        <Image source={{ uri: item.photo_url }} style={styles.avatarImg} />
                                    ) : (
                                        <View style={styles.avatarFallback}>
                                            <Text style={styles.avatarFallbackText}>{item.full_name.charAt(0)}</Text>
                                        </View>
                                    )}
                                    <View style={styles.rollBadgeSmall}>
                                        <Text style={styles.rollBadgeSmallText}>{item.roll_number ?? '-'}</Text>
                                    </View>
                                </View>
                                <View style={styles.nameContainer}>
                                    <Text style={styles.studentName}>{item.full_name}</Text>
                                    <Text style={styles.regNoText}>{item.registration_number}</Text>
                                </View>
                            </View>
                            <View style={styles.statusBtns}>
                                <TouchableOpacity
                                    style={[styles.statusBtn, item.status === 'present' && styles.presentBtn]}
                                    onPress={() => toggleStatus(item.id, 'present')}
                                >
                                    <Ionicons name="checkmark" size={18} color={item.status === 'present' ? '#FFFFFF' : '#38A169'} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.statusBtn, item.status === 'absent' && styles.absentBtn]}
                                    onPress={() => toggleStatus(item.id, 'absent')}
                                >
                                    <Ionicons name="close" size={18} color={item.status === 'absent' ? '#FFFFFF' : '#E53E3E'} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                />
            )}

            {/* Save Button */}
            <TouchableOpacity style={styles.saveBtn} onPress={saveAttendance} disabled={saving}>
                <LinearGradient colors={['#2D7D46', '#3DA05A']} style={styles.saveBtnGradient}>
                    {saving ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                        <>
                            <Ionicons name="save-outline" size={20} color="#FFFFFF" />
                            <Text style={styles.saveBtnText}>Save Attendance</Text>
                        </>
                    )}
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F7FAFC' },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7FAFC' },
    header: { paddingTop: 56, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 10 },
    backBtn: { marginRight: 4 },
    headerTitle: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', flex: 1 },
    body: { padding: 16 },
    sectionTitle: { fontSize: 17, fontWeight: '700', color: '#2D3748', marginBottom: 4 },
    dateLabel: { fontSize: 13, color: '#718096', marginBottom: 16 },
    classCard: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
        borderRadius: 14, padding: 14, marginBottom: 10,
        elevation: 2,
    },
    classIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E6F4EA', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    classIconText: { fontSize: 18, fontWeight: '800', color: '#2D7D46' },
    classInfo: { flex: 1 },
    className: { fontSize: 16, fontWeight: '700', color: '#2D3748' },
    emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 32, alignItems: 'center', gap: 8 },
    emptyText: { fontSize: 14, color: '#A0AEC0' },
    statsBar: { flexDirection: 'row', backgroundColor: '#FFFFFF', paddingVertical: 12, paddingHorizontal: 24, justifyContent: 'space-around', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    statItem: { alignItems: 'center' },
    statNum: { fontSize: 22, fontWeight: '800' },
    statLbl: { fontSize: 11, color: '#A0AEC0', marginTop: 2 },
    studentRow: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
        borderRadius: 12, padding: 12, marginBottom: 8, justifyContent: 'space-between',
        elevation: 1,
    },
    studentInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
    rollBadge: { backgroundColor: '#E6F4EA', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, minWidth: 36, alignItems: 'center' },
    rollText: { fontSize: 12, fontWeight: '700', color: '#2D7D46' },
    studentName: { fontSize: 14, fontWeight: '600', color: '#2D3748', flex: 1 },
    statusBtns: { flexDirection: 'row', gap: 8 },
    statusBtn: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: '#F7FAFC' },
    presentBtn: { backgroundColor: '#38A169', borderColor: '#38A169' },
    absentBtn: { backgroundColor: '#E53E3E', borderColor: '#E53E3E' },
    saveBtn: { margin: 16, borderRadius: 14, overflow: 'hidden' },
    saveBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 8 },
    saveBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },

    // Date Selector Styles
    dateSelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    dateBtn: { padding: 8, backgroundColor: '#E6F4EA', borderRadius: 8 },
    dateDisp: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F7FAFC', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
    dateDispText: { fontSize: 15, fontWeight: '600', color: '#2D3748' },

    // Avatar Styles
    avatarContainer: { position: 'relative', marginRight: 12 },
    avatarImg: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E2E8F0' },
    avatarFallback: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2D7D46', justifyContent: 'center', alignItems: 'center' },
    avatarFallbackText: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
    rollBadgeSmall: { position: 'absolute', bottom: -4, right: -4, backgroundColor: '#FFFFFF', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
    rollBadgeSmallText: { fontSize: 10, fontWeight: '700', color: '#4A5568' },
    nameContainer: { flex: 1, justifyContent: 'center' },
    regNoText: { fontSize: 12, color: '#718096', marginTop: 2 },
});
