import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, RefreshControl, StatusBar, ActivityIndicator, TouchableOpacity
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../config/supabase';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, SchoolClass } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'TeacherClassList'>;

export default function TeacherClassListScreen({ navigation }: Props) {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [classes, setClasses] = useState<SchoolClass[]>([]);

    const fetchData = async () => {
        const { data } = await supabase
            .from('classes')
            .select('*')
            .order('numeric_value', { ascending: true });

        setClasses(data ?? []);
        setLoading(false);
        setRefreshing(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

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
                    <Text style={styles.headerTitle}>Select a Class</Text>
                    <View style={{ width: 24 }} />
                </View>
            </LinearGradient>

            <ScrollView
                contentContainerStyle={styles.listContainer}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2D7D46" />}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.subtitle}>Directory of all active classes. Select one to view its students.</Text>

                {classes.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <Ionicons name="school-outline" size={40} color="#CBD5E0" />
                        <Text style={styles.emptyText}>No classes found</Text>
                    </View>
                ) : (
                    <View style={styles.grid}>
                        {classes.map((cls) => (
                            <TouchableOpacity
                                key={cls.id}
                                style={styles.classCard}
                                onPress={() => navigation.navigate('TeacherStudentList', {
                                    classId: cls.id,
                                    className: `${cls.class_name} ${cls.section || ''}`.trim()
                                })}
                            >
                                <View style={styles.classIconBadge}>
                                    <Ionicons name="people" size={20} color="#2D7D46" />
                                </View>
                                <Text style={styles.className}>Class {cls.class_name}</Text>
                                {cls.section ? <Text style={styles.classSection}>Section {cls.section}</Text> : null}
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F7FAFC' },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20 },
    headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF' },
    listContainer: { padding: 16 },
    subtitle: { fontSize: 14, color: '#718096', marginBottom: 20, paddingHorizontal: 4 },
    emptyCard: {
        backgroundColor: '#FFFFFF', borderRadius: 16, padding: 32, alignItems: 'center', gap: 8, marginTop: 20
    },
    emptyText: { fontSize: 14, color: '#A0AEC0' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    classCard: {
        width: '48%', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
        marginBottom: 16, alignItems: 'center', elevation: 2,
    },
    classIconBadge: {
        width: 48, height: 48, borderRadius: 24, backgroundColor: '#E6F4EA',
        justifyContent: 'center', alignItems: 'center', marginBottom: 12
    },
    className: { fontSize: 16, fontWeight: '700', color: '#2D3748' },
    classSection: { fontSize: 13, color: '#718096', marginTop: 2 },
});
