import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, StatusBar, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../config/supabase';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, SchoolClass } from '../../types';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';

type Props = NativeStackScreenProps<RootStackParamList, 'AddHomework'>;

export default function AddHomeworkScreen({ route, navigation }: Props) {
    const editId = route.params?.editId;
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Data
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [subjects, setSubjects] = useState<string[]>([]);
    const [allSubjects, setAllSubjects] = useState<any[]>([]);

    // Form state
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [selectedSubject, setSelectedSubject] = useState<string>('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [imageBase64, setImageBase64] = useState<string | null>(null);
    const [existingAttachments, setExistingAttachments] = useState<string[]>([]);

    useEffect(() => {
        fetchData();
        // Set subjects from teacher profile
        if (user?.role === 'teacher' && user.subjects) {
            setSubjects(user.subjects);
            if (user.subjects.length > 0) {
                setSelectedSubject(user.subjects[0]);
            }
        }
    }, [user]);

    const fetchData = async () => {
        // Fetch all active classes
        const { data } = await supabase
            .from('classes')
            .select('*')
            .order('numeric_value', { ascending: true });

        setClasses(data ?? []);

        const { data: subjs } = await supabase.from('subjects').select('id, subject_name');
        setAllSubjects(subjs ?? []);

        if (editId) {
            const { data: hwData } = await supabase.from('homework').select('*').eq('id', editId).single();
            if (hwData) {
                setSelectedClassId(hwData.class_id || '');
                setTitle(hwData.title);
                setDescription(hwData.description || '');
                setExistingAttachments(hwData.attachments || []);
                if (hwData.due_date) {
                    setDueDate(new Date(hwData.due_date).toISOString().split('T')[0]);
                }
            }
        } else {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            setDueDate(tomorrow.toISOString().split('T')[0]);
        }

        setLoading(false);
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'We need camera roll permissions to make this work!');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 0.7,
            base64: true,
        });

        if (!result.canceled && result.assets[0].base64) {
            setImageUri(result.assets[0].uri);
            setImageBase64(result.assets[0].base64);
        }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'We need camera permissions to make this work!');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 0.7,
            base64: true,
        });

        if (!result.canceled && result.assets[0].base64) {
            setImageUri(result.assets[0].uri);
            setImageBase64(result.assets[0].base64);
        }
    };

    const handleSubmit = async () => {
        if (!selectedClassId || !title.trim()) {
            Alert.alert('Missing Fields', 'Please select a class and enter a title.');
            return;
        }

        setSubmitting(true);
        try {
            let finalAttachments = [...existingAttachments];

            if (imageBase64 && imageUri) {
                const ext = imageUri.split('.').pop() || 'jpg';
                const fileName = `hw_${Date.now()}.${ext}`;
                const filePath = `${user?.id || 'teacher'}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('teacher-gallery')
                    .upload(filePath, decode(imageBase64), { contentType: `image/${ext}` });

                if (uploadError) throw new Error('Image Upload Failed: ' + uploadError.message);

                const { data: urlData } = supabase.storage
                    .from('teacher-gallery')
                    .getPublicUrl(filePath);

                finalAttachments.push(urlData.publicUrl);
            }

            let finalSubjectId = null;
            if (selectedSubject) {
                const subjObj = allSubjects.find(s => s.subject_name === selectedSubject);
                finalSubjectId = subjObj ? subjObj.id : null;
            }

            if (editId) {
                const { error } = await supabase
                    .from('homework')
                    .update({
                        class_id: selectedClassId,
                        subject_id: finalSubjectId,
                        title: title.trim(),
                        description: description.trim(),
                        due_date: dueDate || null,
                        attachments: finalAttachments,
                    })
                    .eq('id', editId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('homework')
                    .insert({
                        teacher_id: user?.id,
                        class_id: selectedClassId,
                        subject_id: finalSubjectId,
                        title: title.trim(),
                        description: description.trim(),
                        due_date: dueDate || null,
                        attachments: finalAttachments,
                    });
                if (error) throw error;
            }

            Alert.alert('Success', editId ? 'Homework updated!' : 'Homework assigned!', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (err: any) {
            console.error('Submit homework error:', err);
            Alert.alert('Error', err.message || 'Failed to assign homework');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <View style={styles.loader}><ActivityIndicator size="large" color="#2D7D46" /></View>;
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <LinearGradient colors={['#2D7D46', '#3DA05A']} style={styles.header}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{editId ? 'Edit Homework' : 'Assign Homework'}</Text>
                    <View style={{ width: 24 }} />
                </View>
            </LinearGradient>

            <ScrollView
                style={styles.formContainer}
                contentContainerStyle={styles.formContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Class Selection */}
                <Text style={styles.label}>Select Class *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
                    {classes.map(cls => (
                        <TouchableOpacity
                            key={cls.id}
                            style={[
                                styles.chip,
                                selectedClassId === cls.id && styles.chipActive
                            ]}
                            onPress={() => setSelectedClassId(cls.id)}
                        >
                            <Text style={[
                                styles.chipText,
                                selectedClassId === cls.id && styles.chipTextActive
                            ]}>
                                {cls.class_name} {cls.section || ''}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Subject Selection */}
                {subjects.length > 0 && (
                    <>
                        <Text style={styles.label}>Select Subject</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
                            {subjects.map(subj => (
                                <TouchableOpacity
                                    key={subj}
                                    style={[
                                        styles.chip,
                                        selectedSubject === subj && styles.chipActive
                                    ]}
                                    onPress={() => setSelectedSubject(subj)}
                                >
                                    <Text style={[
                                        styles.chipText,
                                        selectedSubject === subj && styles.chipTextActive
                                    ]}>
                                        {subj}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </>
                )}

                {/* Details */}
                <Text style={styles.label}>Homework Title *</Text>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Chapter 4 Exercise 2"
                        placeholderTextColor="#A0AEC0"
                        value={title}
                        onChangeText={setTitle}
                    />
                </View>

                {/* Photo Attachment */}
                <Text style={styles.label}>Attach Photo (Optional)</Text>
                <View style={styles.photoActions}>
                    <TouchableOpacity style={styles.photoBtn} onPress={takePhoto}>
                        <Ionicons name="camera-outline" size={20} color="#2D7D46" />
                        <Text style={styles.photoBtnText}>Take Live Photo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.photoBtn} onPress={pickImage}>
                        <Ionicons name="images-outline" size={20} color="#2D7D46" />
                        <Text style={styles.photoBtnText}>Choose Gallery</Text>
                    </TouchableOpacity>
                </View>

                {(imageUri || existingAttachments.length > 0) && (
                    <View style={styles.previewContainer}>
                        {imageUri ? (
                            <Image source={{ uri: imageUri }} style={styles.previewImage} />
                        ) : existingAttachments[0] ? (
                            <Image source={{ uri: existingAttachments[0] }} style={styles.previewImage} />
                        ) : null}
                        <TouchableOpacity style={styles.removePhotoBtn} onPress={() => { setImageUri(null); setImageBase64(null); setExistingAttachments([]); }}>
                            <Ionicons name="close-circle" size={24} color="#E53E3E" />
                        </TouchableOpacity>
                    </View>
                )}

                <Text style={styles.label}>Description (Optional)</Text>
                <View style={[styles.inputContainer, styles.textAreaContainer]}>
                    <TextInput
                        style={styles.textArea}
                        placeholder="Provide details about the homework..."
                        placeholderTextColor="#A0AEC0"
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        textAlignVertical="top"
                    />
                </View>

                <Text style={styles.label}>Due Date (YYYY-MM-DD)</Text>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#A0AEC0"
                        value={dueDate}
                        onChangeText={setDueDate}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                    onPress={handleSubmit}
                    disabled={submitting}
                >
                    {submitting ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <>
                            <Ionicons name={editId ? "save" : "send"} size={20} color="#FFF" />
                            <Text style={styles.submitBtnText}>{editId ? 'Save Changes' : 'Publish Assignment'}</Text>
                        </>
                    )}
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F7FAFC' },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20 },
    headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF' },
    formContainer: { flex: 1 },
    formContent: { padding: 20 },
    label: { fontSize: 15, fontWeight: '600', color: '#2D3748', marginBottom: 12, marginTop: 16 },
    chipsRow: { flexDirection: 'row', marginBottom: 8 },
    chip: {
        paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
        backgroundColor: '#EDF2F7', marginRight: 10, borderWidth: 1, borderColor: '#EDF2F7'
    },
    chipActive: { backgroundColor: '#E6F4EA', borderColor: '#2D7D46' },
    chipText: { fontSize: 14, fontWeight: '500', color: '#718096' },
    chipTextActive: { color: '#2D7D46', fontWeight: '700' },
    inputContainer: {
        backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0',
        overflow: 'hidden', marginBottom: 8
    },
    input: { height: 50, paddingHorizontal: 16, fontSize: 15, color: '#2D3748' },
    textAreaContainer: { height: 120 },
    textArea: { flex: 1, padding: 16, fontSize: 15, color: '#2D3748' },
    submitBtn: {
        backgroundColor: '#2D7D46', borderRadius: 12, height: 56,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
        marginTop: 32,
    },
    submitBtnDisabled: { backgroundColor: '#9AE6B4' },
    submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
    photoActions: { flexDirection: 'row', gap: 10, marginBottom: 10 },
    photoBtn: {
        flex: 1, backgroundColor: '#E6F4EA', borderRadius: 12, paddingVertical: 12,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        borderWidth: 1, borderColor: '#C6F6D5'
    },
    photoBtnText: { color: '#2D7D46', fontWeight: '600', fontSize: 14 },
    previewContainer: {
        position: 'relative', marginTop: 8, marginBottom: 16,
        borderRadius: 12, overflow: 'hidden', height: 200, backgroundColor: '#EDF2F7'
    },
    previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    removePhotoBtn: {
        position: 'absolute', top: 10, right: 10,
        backgroundColor: '#FFF', borderRadius: 12, padding: 2
    },
});
