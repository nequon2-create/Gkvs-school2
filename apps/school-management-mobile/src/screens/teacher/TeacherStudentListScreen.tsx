import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, RefreshControl, StatusBar, ActivityIndicator, TouchableOpacity, Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../config/supabase';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, Student } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'TeacherStudentList'>;

export default function TeacherStudentListScreen({ route, navigation }: Props) {
    const { classId, className } = route.params;
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [students, setStudents] = useState<Student[]>([]);

    const fetchData = async () => {
        // Fetch current academic year
        const { data: currentYear } = await supabase
            .from('academic_years')
            .select('id')
            .eq('is_current', true)
            .single();

        if (!currentYear) {
            setStudents([]);
            setLoading(false);
            setRefreshing(false);
            return;
        }

        // Fetch students for the given class and current academic year
        const { data } = await supabase
            .from('students')
            .select('*')
            .eq('class_id', classId)
            .eq('academic_year_id', currentYear.id)
            .eq('is_active', true)
            .order('roll_number', { ascending: true })
            .order('full_name', { ascending: true });

        setStudents(data ?? []);
        setLoading(false);
        setRefreshing(false);
    };

    useEffect(() => {
        fetchData();
    }, [classId]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    if (loading) {
        return <View style={styles.loader}><ActivityIndicator size="large" color="#2D7D46" /></View>;
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <LinearGradient colors={['#2D7D46', '#3DA05A']} style={styles.header}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Class {className}</Text>
                    <View style={{ width: 24 }} />
                </View>
                <View style={styles.statsBadge}>
                    <Text style={styles.statsText}>{students.length} Students</Text>
                </View>
            </LinearGradient>

            <ScrollView
                contentContainerStyle={styles.listContainer}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2D7D46" />}
                showsVerticalScrollIndicator={false}
            >
                {students.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <Ionicons name="people-outline" size={40} color="#CBD5E0" />
                        <Text style={styles.emptyText}>No students in this class</Text>
                    </View>
                ) : (
                    students.map((student) => (
                        <TouchableOpacity
                            key={student.id}
                            style={styles.studentCard}
                            onPress={() => navigation.navigate('StudentProfile', { studentId: student.id })}
                        >
                            <View style={styles.avatarCircle}>
                                {student.photo_url ? (
                                    <Image source={{ uri: student.photo_url }} style={styles.avatarImage} />
                                ) : (
                                    <Text style={styles.avatarText}>{student.full_name?.charAt(0).toUpperCase()}</Text>
                                )}
                            </View>
                            <View style={styles.studentInfo}>
                                <Text style={styles.studentName}>{student.full_name}</Text>
                                <View style={styles.subInfoRow}>
                                    {student.roll_number ? (
                                        <Text style={styles.subInfoText}>Roll: {student.roll_number}</Text>
                                    ) : null}
                                    {student.registration_number ? (
                                        <Text style={styles.subInfoText}>Reg: {student.registration_number}</Text>
                                    ) : null}
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#CBD5E0" />
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F7FAFC' },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20 },
    headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF' },
    statsBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 4,
        borderRadius: 12, alignSelf: 'flex-start', marginLeft: 36
    },
    statsText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
    listContainer: { padding: 16 },
    emptyCard: {
        backgroundColor: '#FFFFFF', borderRadius: 16, padding: 32, alignItems: 'center', gap: 8, marginTop: 20
    },
    emptyText: { fontSize: 14, color: '#A0AEC0' },
    studentCard: {
        flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
        marginBottom: 12, alignItems: 'center', elevation: 2,
    },
    avatarCircle: {
        width: 48, height: 48, borderRadius: 24, backgroundColor: '#E6F4EA',
        justifyContent: 'center', alignItems: 'center', marginRight: 14, overflow: 'hidden'
    },
    avatarImage: { width: '100%', height: '100%' },
    avatarText: { fontSize: 20, fontWeight: '700', color: '#2D7D46' },
    studentInfo: { flex: 1 },
    studentName: { fontSize: 16, fontWeight: '700', color: '#2D3748', marginBottom: 4 },
    subInfoRow: { flexDirection: 'row', gap: 12 },
    subInfoText: { fontSize: 12, color: '#718096' },
});
