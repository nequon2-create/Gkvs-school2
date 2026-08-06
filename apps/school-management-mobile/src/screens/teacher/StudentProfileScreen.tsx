import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, RefreshControl, StatusBar, ActivityIndicator, TouchableOpacity, Image, Modal, TextInput, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../config/supabase';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, Student, SchoolClass } from '../../types';
import MarksCard from '../../components/MarksCard';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';

type Props = NativeStackScreenProps<RootStackParamList, 'StudentProfile'>;

export default function StudentProfileScreen({ route, navigation }: Props) {
    const { studentId } = route.params;
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [student, setStudent] = useState<Student | null>(null);
    const [schoolClass, setSchoolClass] = useState<SchoolClass | null>(null);
    const [allClasses, setAllClasses] = useState<SchoolClass[]>([]);
    const [attendanceStats, setAttendanceStats] = useState({ total: 0, present: 0 });
    const [marks, setMarks] = useState<any[]>([]);
    const [selectedExamId, setSelectedExamId] = useState<string | null>(null);

    // Full Edit Profile Modal States
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);

    const [editFullName, setEditFullName] = useState('');
    const [editGender, setEditGender] = useState<'male' | 'female' | 'other'>('male');
    const [editDob, setEditDob] = useState('');
    const [editClassId, setEditClassId] = useState('');
    const [editParentName, setEditParentName] = useState('');
    const [editParentPhone, setEditParentPhone] = useState('');
    const [editParentEmail, setEditParentEmail] = useState('');
    const [editAddress, setEditAddress] = useState('');
    const [editPhotoUrl, setEditPhotoUrl] = useState('');
    const [editAadharNumber, setEditAadharNumber] = useState('');

    const fetchData = async () => {
        const { data: studentData } = await supabase
            .from('students').select('*').eq('id', studentId).single();
        setStudent(studentData);

        const { data: classesData } = await supabase
            .from('classes').select('*').order('numeric_value', { ascending: true });
        setAllClasses(classesData || []);

        if (studentData?.class_id) {
            const classObj = classesData?.find((c) => c.id === studentData.class_id);
            setSchoolClass(classObj || null);

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

    const handleOpenEdit = () => {
        if (!student) return;
        setEditFullName(student.full_name || '');
        setEditGender((student.gender as any) || 'male');
        setEditDob(student.date_of_birth || '');
        setEditClassId(student.class_id || '');
        setEditParentName(student.parent_name || '');
        setEditParentPhone(student.parent_phone || '');
        setEditParentEmail(student.parent_email || '');
        setEditAddress(student.address || '');
        setEditPhotoUrl(student.photo_url || '');
        setEditAadharNumber(student.aadhar_number || '');
        setIsEditModalOpen(true);
    };

    const pickImageFromGallery = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Gallery access is required to pick a photo.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
            base64: true,
        });

        if (!result.canceled && result.assets[0].base64) {
            uploadPhotoToStorage(result.assets[0].base64);
        }
    };

    const takePhotoWithCamera = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Camera access is required to take a photo.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
            base64: true,
        });

        if (!result.canceled && result.assets[0].base64) {
            uploadPhotoToStorage(result.assets[0].base64);
        }
    };

    const uploadPhotoToStorage = async (base64Str: string) => {
        setUploadingPhoto(true);
        try {
            const fileName = `student_${studentId}_${Date.now()}.jpg`;
            const bucketsToTry = ['student-photos', 'profiles', 'avatars'];
            let uploadedBucket = '';
            let lastError: any = null;

            for (const bName of bucketsToTry) {
                const { error } = await supabase.storage
                    .from(bName)
                    .upload(fileName, decode(base64Str), {
                        contentType: 'image/jpeg',
                        upsert: true,
                    });

                if (!error) {
                    uploadedBucket = bName;
                    break;
                }
                lastError = error;
            }

            if (!uploadedBucket) {
                console.error('Storage Upload Error:', lastError);
                throw lastError || new Error('Row-level security policy blocked upload');
            }

            const { data: publicUrlData } = supabase.storage
                .from(uploadedBucket)
                .getPublicUrl(fileName);

            if (publicUrlData?.publicUrl) {
                setEditPhotoUrl(publicUrlData.publicUrl);
                Alert.alert('Success', 'Student photo uploaded successfully!');
            }
        } catch (err: any) {
            console.error('Error uploading photo:', err);
            Alert.alert(
                'Upload Blocked by RLS',
                'Supabase Storage policy blocked the photo upload. Please run fix_supabase_storage_and_rls.sql in your Supabase SQL Editor!\n\nError: ' + (err.message || 'Row-level security violation')
            );
        } finally {
            setUploadingPhoto(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!studentId) return;
        setSaving(true);
        try {
            const { data, error } = await supabase
                .from('students')
                .update({
                    full_name: editFullName,
                    gender: editGender,
                    date_of_birth: editDob || null,
                    class_id: editClassId || null,
                    parent_name: editParentName || null,
                    parent_phone: editParentPhone || null,
                    parent_email: editParentEmail || null,
                    address: editAddress || null,
                    photo_url: editPhotoUrl || null,
                    aadhar_number: editAadharNumber || null,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', studentId)
                .select();

            if (error) throw error;

            if (!data || data.length === 0) {
                Alert.alert(
                    'Update Blocked by RLS',
                    'Supabase Table RLS policy blocked the student update. Please run fix_supabase_storage_and_rls.sql in your Supabase SQL Editor!'
                );
                return;
            }

            Alert.alert('Success', 'Student profile updated successfully!');
            setIsEditModalOpen(false);
            fetchData();
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

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
                    <TouchableOpacity onPress={handleOpenEdit} style={styles.editHeaderBtn}>
                        <Ionicons name="pencil" size={16} color="#2D7D46" />
                        <Text style={styles.editHeaderBtnText}>Edit Profile</Text>
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
                        { icon: 'male-female-outline', label: 'Gender', value: student?.gender ? student.gender.toUpperCase() : null },
                        { icon: 'people-outline', label: "Parent's Name", value: student?.parent_name },
                        { icon: 'card-outline', label: 'Aadhaar Number', value: student?.aadhar_number },
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

                {/* Recent Exam Results */}
                {marks.length > 0 && (
                    <View style={[styles.infoCard, { marginTop: 16 }]}>
                        <Text style={styles.infoHeader}>Recent Exam Results</Text>
                        {marks.map((exam) => (
                            <TouchableOpacity
                                key={exam.id}
                                style={styles.infoRow}
                                onPress={() => setSelectedExamId(exam.id)}
                            >
                                <Ionicons name="document-text-outline" size={18} color="#2D7D46" style={styles.infoIcon} />
                                <View style={styles.infoText}>
                                    <Text style={styles.infoLabel}>{exam.exam_name}</Text>
                                    <Text style={styles.infoValue}>Marks: {exam.marks_obtained} / {exam.total_marks}</Text>
                                </View>
                                <Ionicons name="chevron-forward-outline" size={16} color="#A0AEC0" />
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

            {/* Full Teacher Edit Profile Modal */}
            <Modal
                visible={isEditModalOpen}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsEditModalOpen(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit Student Profile</Text>
                            <TouchableOpacity onPress={() => setIsEditModalOpen(false)}>
                                <Ionicons name="close" size={24} color="#A0AEC0" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                            {/* Photo Picker Section */}
                            <Text style={styles.inputLabel}>Student Photo</Text>
                            <View style={styles.photoPickerContainer}>
                                <View style={styles.photoPreviewCircle}>
                                    {editPhotoUrl ? (
                                        <Image source={{ uri: editPhotoUrl }} style={{ width: '100%', height: '100%' }} />
                                    ) : (
                                        <Ionicons name="person" size={40} color="#A0AEC0" />
                                    )}
                                </View>
                                <View style={styles.photoActionsRow}>
                                    <TouchableOpacity style={styles.photoBtn} onPress={takePhotoWithCamera} disabled={uploadingPhoto}>
                                        <Ionicons name="camera" size={16} color="#FFF" />
                                        <Text style={styles.photoBtnText}>Camera</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.photoBtn} onPress={pickImageFromGallery} disabled={uploadingPhoto}>
                                        <Ionicons name="images" size={16} color="#FFF" />
                                        <Text style={styles.photoBtnText}>Gallery</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Full Name */}
                            <Text style={styles.inputLabel}>Full Name *</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={editFullName}
                                onChangeText={setEditFullName}
                                placeholder="Student Full Name"
                            />

                            {/* Gender Selection */}
                            <Text style={styles.inputLabel}>Gender</Text>
                            <View style={styles.genderRow}>
                                {(['male', 'female', 'other'] as const).map((g) => (
                                    <TouchableOpacity
                                        key={g}
                                        style={[
                                            styles.genderBadge,
                                            editGender === g && styles.genderBadgeActive,
                                        ]}
                                        onPress={() => setEditGender(g)}
                                    >
                                        <Text style={[styles.genderBadgeText, editGender === g && styles.genderBadgeTextActive]}>
                                            {g.charAt(0).toUpperCase() + g.slice(1)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Date of Birth */}
                            <Text style={styles.inputLabel}>Date of Birth (YYYY-MM-DD)</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={editDob}
                                onChangeText={setEditDob}
                                placeholder="e.g. 2015-08-15"
                            />

                            {/* Class Selection */}
                            <Text style={styles.inputLabel}>Assigned Class</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 4 }}>
                                {allClasses.map((c) => (
                                    <TouchableOpacity
                                        key={c.id}
                                        style={[styles.classChip, editClassId === c.id && styles.classChipActive]}
                                        onPress={() => setEditClassId(c.id)}
                                    >
                                        <Text style={[styles.classChipText, editClassId === c.id && styles.classChipTextActive]}>
                                            Class {c.class_name} {c.section ?? ''}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            {/* Parent Name */}
                            <Text style={styles.inputLabel}>Parent / Guardian Name</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={editParentName}
                                onChangeText={setEditParentName}
                                placeholder="Parent Full Name"
                            />

                            {/* Parent Phone */}
                            <Text style={styles.inputLabel}>Parent Phone Number</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={editParentPhone}
                                onChangeText={setEditParentPhone}
                                keyboardType="phone-pad"
                                placeholder="10-digit phone number"
                            />

                            {/* Parent Email */}
                            <Text style={styles.inputLabel}>Parent Email</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={editParentEmail}
                                onChangeText={setEditParentEmail}
                                keyboardType="email-address"
                                placeholder="parent@example.com"
                            />

                            {/* Aadhaar Number */}
                            <Text style={styles.inputLabel}>Aadhaar Number</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={editAadharNumber}
                                onChangeText={setEditAadharNumber}
                                placeholder="12-digit Aadhaar number"
                            />

                            {/* Address */}
                            <Text style={styles.inputLabel}>Residential Address</Text>
                            <TextInput
                                style={[styles.modalInput, { height: 70 }]}
                                value={editAddress}
                                onChangeText={setEditAddress}
                                multiline
                                placeholder="Full residential address"
                            />
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.cancelBtn]}
                                onPress={() => setIsEditModalOpen(false)}
                            >
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.saveBtn]}
                                onPress={handleSaveProfile}
                                disabled={saving || uploadingPhoto}
                            >
                                {saving || uploadingPhoto ? (
                                    <ActivityIndicator size="small" color="#FFF" />
                                ) : (
                                    <Text style={styles.saveBtnText}>Save Changes</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F7FAFC' },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7FAFC' },
    header: { paddingTop: 60, paddingBottom: 32, alignItems: 'center', paddingHorizontal: 20 },
    headerTop: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    backBtn: { padding: 4 },
    editHeaderBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
        elevation: 2,
    },
    editHeaderBtnText: { fontSize: 13, fontWeight: '700', color: '#2D7D46' },
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
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContainer: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '85%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    modalTitle: { fontSize: 18, fontWeight: '700', color: '#2D3748' },
    modalBody: { marginBottom: 16 },
    photoPickerContainer: { flexDirection: 'row', alignItems: 'center', gap: 16, marginVertical: 8 },
    photoPreviewCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#EDF2F7', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    photoActionsRow: { flexDirection: 'row', gap: 8 },
    photoBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#2D7D46', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
    photoBtnText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
    inputLabel: { fontSize: 12, fontWeight: '600', color: '#4A5568', marginTop: 10, marginBottom: 4 },
    modalInput: { backgroundColor: '#F7FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#2D3748' },
    genderRow: { flexDirection: 'row', gap: 8, marginVertical: 4 },
    genderBadge: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: '#EDF2F7', alignItems: 'center' },
    genderBadgeActive: { backgroundColor: '#2D7D46' },
    genderBadgeText: { fontSize: 13, fontWeight: '600', color: '#4A5568' },
    genderBadgeTextActive: { color: '#FFFFFF' },
    classChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#EDF2F7', marginRight: 8 },
    classChipActive: { backgroundColor: '#2D7D46' },
    classChipText: { fontSize: 12, fontWeight: '600', color: '#4A5568' },
    classChipTextActive: { color: '#FFFFFF' },
    modalFooter: { flexDirection: 'row', gap: 12, marginTop: 8 },
    modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
    cancelBtn: { backgroundColor: '#EDF2F7' },
    cancelBtnText: { color: '#4A5568', fontWeight: '600' },
    saveBtn: { backgroundColor: '#2D7D46' },
    saveBtnText: { color: '#FFFFFF', fontWeight: '700' },
});
