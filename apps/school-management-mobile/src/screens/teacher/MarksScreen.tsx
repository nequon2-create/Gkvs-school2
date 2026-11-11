import React, { useEffect, useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../config/supabase';

interface SchoolClass {
    id: string;
    class_name: string;
    section: string | null;
}

interface AcademicYear {
    id: string;
    year_name: string;
    is_current: boolean;
}

interface Subject {
    id: string;
    subject_name: string;
    subject_code: string;
    class_id: string | null;
}

interface StudentItem {
    id: string;
    full_name: string;
    registration_number: string;
    roll_number: string | null;
    photo_url: string | null;
}

interface ExistingExam {
    id: string;
    exam_name: string;
    exam_type: string;
    is_published: boolean;
    exam_date: string;
}

const PRESET_EXAMS = ['FA1', 'FA2', 'FA3', 'FA4', 'Midterm', 'Final'];

export default function TeacherMarksScreen() {
    // Selection state
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
    const [selectedYearId, setSelectedYearId] = useState<string>('');
    
    // Exam states
    const [existingExams, setExistingExams] = useState<ExistingExam[]>([]);
    const [selectedExamType, setSelectedExamType] = useState<string>('FA1');
    const [isCustomExam, setIsCustomExam] = useState<boolean>(false);
    const [customExamName, setCustomExamName] = useState<string>('');
    const [selectedExamId, setSelectedExamId] = useState<string | null>(null);

    // Subject & Max marks states
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
    const [maxMarks, setMaxMarks] = useState<string>('100');

    // Sheet states
    const [students, setStudents] = useState<StudentItem[]>([]);
    const [marksMap, setMarksMap] = useState<Record<string, string>>({}); // student_id -> marks string
    const [remarksMap, setRemarksMap] = useState<Record<string, string>>({}); // student_id -> remarks string
    const [isSheetGenerated, setIsSheetGenerated] = useState<boolean>(false);
    
    // Loading states
    const [loadingInit, setLoadingInit] = useState<boolean>(true);
    const [loadingSheet, setLoadingSheet] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);
    const [refreshing, setRefreshing] = useState<boolean>(false);

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        if (selectedClassId && selectedYearId) {
            fetchExamsForClass(selectedClassId, selectedYearId);
            fetchSubjectsForClass(selectedClassId);
            setIsSheetGenerated(false);
        }
    }, [selectedClassId, selectedYearId]);

    const loadInitialData = async () => {
        try {
            setLoadingInit(true);
            // Fetch classes
            const { data: classData, error: classError } = await supabase
                .from('classes')
                .select('id, class_name, section, numeric_value')
                .order('numeric_value', { ascending: true });
            
            if (classError) throw classError;
            setClasses(classData || []);
            if (classData && classData.length > 0) {
                setSelectedClassId(classData[0].id);
            }

            // Fetch academic years
            const { data: yearData, error: yearError } = await supabase
                .from('academic_years')
                .select('id, year_name, is_current')
                .order('year_name', { ascending: false });

            if (yearError) throw yearError;
            setAcademicYears(yearData || []);
            const currentYear = yearData?.find(y => y.is_current) || yearData?.[0];
            if (currentYear) {
                setSelectedYearId(currentYear.id);
            }
        } catch (err) {
            console.error('Error loading initial data:', err);
            Alert.alert('Error', 'Failed to load classes or academic years.');
        } finally {
            setLoadingInit(false);
            setRefreshing(false);
        }
    };

    const fetchExamsForClass = async (classId: string, yearId: string) => {
        try {
            const { data, error } = await supabase
                .from('exams')
                .select('id, exam_name, exam_type, is_published, exam_date')
                .eq('class_id', classId)
                .eq('academic_year_id', yearId)
                .order('exam_date', { ascending: false });

            if (error) throw error;
            setExistingExams(data || []);
        } catch (err) {
            console.error('Error fetching exams:', err);
        }
    };

    const fetchSubjectsForClass = async (classId: string) => {
        try {
            const { data, error } = await supabase
                .from('subjects')
                .select('id, subject_name, subject_code, class_id')
                .or(`class_id.eq.${classId},class_id.is.null`)
                .order('subject_name');

            if (error) throw error;
            // Deduplicate by name
            const unique: Subject[] = [];
            const seen = new Set<string>();
            (data || []).forEach(sub => {
                const key = sub.subject_name.trim().toLowerCase();
                if (!seen.has(key)) {
                    seen.add(key);
                    unique.push(sub);
                }
            });

            setSubjects(unique);
            if (unique.length > 0) {
                setSelectedSubjectId(unique[0].id);
            }
        } catch (err) {
            console.error('Error fetching subjects:', err);
        }
    };

    const handleGenerateSheet = async () => {
        if (!selectedClassId) {
            Alert.alert('Select Class', 'Please select a class.');
            return;
        }
        if (!selectedYearId) {
            Alert.alert('Select Academic Year', 'Please select an academic year.');
            return;
        }
        if (!selectedSubjectId) {
            Alert.alert('Select Subject', 'Please select a subject.');
            return;
        }
        const numericMax = parseFloat(maxMarks);
        if (isNaN(numericMax) || numericMax <= 0) {
            Alert.alert('Invalid Max Marks', 'Please enter a valid maximum marks number (e.g. 100, 50, 25).');
            return;
        }

        const examTitle = isCustomExam ? customExamName.trim() : selectedExamType;
        if (!examTitle) {
            Alert.alert('Missing Exam Name', 'Please specify an exam name.');
            return;
        }

        setLoadingSheet(true);
        try {
            // 1. Fetch Students of this class
            const { data: studentsData, error: stuError } = await supabase
                .from('students')
                .select('id, full_name, registration_number, roll_number, photo_url')
                .eq('class_id', selectedClassId)
                .eq('academic_year_id', selectedYearId)
                .eq('is_active', true)
                .order('roll_number', { ascending: true })
                .order('full_name', { ascending: true });

            if (stuError) throw stuError;
            if (!studentsData || studentsData.length === 0) {
                Alert.alert('No Students Found', 'There are no active students in this class for the selected year.');
                setLoadingSheet(false);
                return;
            }

            setStudents(studentsData);

            // 2. Check if an exam with this name already exists for this class
            const existing = existingExams.find(
                e => e.exam_name.toLowerCase() === examTitle.toLowerCase() || e.exam_type?.toLowerCase() === examTitle.toLowerCase()
            );

            let currentExamId = existing?.id || null;
            setSelectedExamId(currentExamId);

            // 3. If exam exists, fetch existing marks for this subject
            const newMarksMap: Record<string, string> = {};
            const newRemarksMap: Record<string, string> = {};

            if (currentExamId) {
                const { data: marksData, error: marksError } = await supabase
                    .from('marks')
                    .select('student_id, marks_obtained, max_marks, remarks')
                    .eq('exam_id', currentExamId)
                    .eq('subject_id', selectedSubjectId);

                if (!marksError && marksData) {
                    marksData.forEach(m => {
                        if (m.student_id) {
                            newMarksMap[m.student_id] = m.marks_obtained !== null && m.marks_obtained !== undefined ? String(m.marks_obtained) : '';
                            newRemarksMap[m.student_id] = m.remarks || '';
                            if (m.max_marks && String(m.max_marks) !== maxMarks) {
                                setMaxMarks(String(m.max_marks));
                            }
                        }
                    });
                }
            }

            setMarksMap(newMarksMap);
            setRemarksMap(newRemarksMap);
            setIsSheetGenerated(true);
        } catch (err) {
            console.error('Error generating sheet:', err);
            Alert.alert('Error', 'Failed to generate sheet. Please try again.');
        } finally {
            setLoadingSheet(false);
        }
    };

    const handleSaveMarks = async (publish: boolean) => {
        const numericMax = parseFloat(maxMarks) || 100;
        const examTitle = isCustomExam ? customExamName.trim() : selectedExamType;

        if (!examTitle) {
            Alert.alert('Error', 'Exam name is required.');
            return;
        }

        // Validate marks
        for (const student of students) {
            const val = marksMap[student.id];
            if (val !== undefined && val !== '') {
                const parsed = parseFloat(val);
                if (isNaN(parsed) || parsed < 0) {
                    Alert.alert('Invalid Mark', `Marks for ${student.full_name} must be a positive number.`);
                    return;
                }
                if (parsed > numericMax) {
                    Alert.alert('Mark Exceeds Max', `Marks for ${student.full_name} (${parsed}) cannot exceed maximum marks (${numericMax}).`);
                    return;
                }
            }
        }

        setSaving(true);
        try {
            let examId = selectedExamId;

            // 1. Create or Update Exam
            if (examId) {
                const { error: updateErr } = await supabase
                    .from('exams')
                    .update({
                        is_published: publish,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', examId);

                if (updateErr) throw updateErr;
            } else {
                const { data: newExam, error: examErr } = await supabase
                    .from('exams')
                    .insert({
                        exam_name: examTitle,
                        exam_type: examTitle,
                        class_id: selectedClassId,
                        academic_year_id: selectedYearId,
                        exam_date: new Date().toISOString().split('T')[0],
                        is_published: publish
                    })
                    .select()
                    .single();

                if (examErr) throw examErr;
                examId = newExam.id;
                setSelectedExamId(newExam.id);
            }

            // 2. Prepare marks records
            const recordsToUpsert = [];
            for (const student of students) {
                const val = marksMap[student.id];
                const remarks = remarksMap[student.id] || null;

                if (val !== undefined && val.trim() !== '') {
                    const obtained = parseFloat(val);
                    const pct = numericMax > 0 ? (obtained / numericMax) * 100 : 0;
                    let grade = 'F';
                    if (pct >= 90) grade = 'A+';
                    else if (pct >= 80) grade = 'A';
                    else if (pct >= 70) grade = 'B+';
                    else if (pct >= 60) grade = 'B';
                    else if (pct >= 50) grade = 'C';
                    else if (pct >= 40) grade = 'D';

                    recordsToUpsert.push({
                        student_id: student.id,
                        exam_id: examId,
                        subject_id: selectedSubjectId,
                        marks_obtained: obtained,
                        max_marks: numericMax,
                        percentage: Math.round(pct * 100) / 100,
                        grade: grade,
                        remarks: remarks
                    });
                }
            }

            if (recordsToUpsert.length > 0) {
                const { error: upsertErr } = await supabase
                    .from('marks')
                    .upsert(recordsToUpsert, { onConflict: 'student_id,exam_id,subject_id' });

                if (upsertErr) throw upsertErr;
            }

            Alert.alert(
                publish ? 'Marks Published! 🎉' : 'Draft Saved 💾',
                publish
                    ? 'The marks have been published! They are now live on the Admin Web, Parent App, Student Profiles, and the Leaderboard.'
                    : 'The marks draft has been saved successfully. You can return and publish anytime.'
            );

            // Refresh existing exams list
            await fetchExamsForClass(selectedClassId, selectedYearId);
        } catch (err) {
            console.error('Error saving marks:', err);
            Alert.alert('Error', 'Failed to save marks. Please check your connection and try again.');
        } finally {
            setSaving(false);
        }
    };

    const getGradePill = (obtainedStr: string) => {
        const max = parseFloat(maxMarks) || 100;
        if (!obtainedStr || obtainedStr.trim() === '') return null;
        const val = parseFloat(obtainedStr);
        if (isNaN(val)) return null;

        const pct = max > 0 ? (val / max) * 100 : 0;
        let grade = 'F';
        let bg = '#EF4444';

        if (pct >= 90) { grade = 'A+'; bg = '#10B981'; }
        else if (pct >= 80) { grade = 'A'; bg = '#059669'; }
        else if (pct >= 70) { grade = 'B+'; bg = '#3B82F6'; }
        else if (pct >= 60) { grade = 'B'; bg = '#6366F1'; }
        else if (pct >= 50) { grade = 'C'; bg = '#F59E0B'; }
        else if (pct >= 40) { grade = 'D'; bg = '#F97316'; }

        return (
            <View style={[styles.gradeBadge, { backgroundColor: bg }]}>
                <Text style={styles.gradeBadgeText}>{grade}</Text>
            </View>
        );
    };

    // Calculate stats
    const gradedCount = useMemo(() => {
        return students.filter(s => marksMap[s.id] !== undefined && marksMap[s.id].trim() !== '').length;
    }, [students, marksMap]);

    const activeClassName = useMemo(() => {
        const c = classes.find(item => item.id === selectedClassId);
        return c ? `${c.class_name} ${c.section || ''}` : 'Class';
    }, [classes, selectedClassId]);

    const activeSubjectName = useMemo(() => {
        const s = subjects.find(item => item.id === selectedSubjectId);
        return s ? s.subject_name : 'Subject';
    }, [subjects, selectedSubjectId]);

    if (loadingInit) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#2D7D46" />
                <Text style={styles.loadingText}>Loading Marks Workspace...</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => {
                            setRefreshing(true);
                            loadInitialData();
                        }}
                    />
                }
            >
                {/* Header */}
                <LinearGradient
                    colors={['#2D7D46', '#1E5A32']}
                    style={styles.headerGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <View style={styles.headerRow}>
                        <View style={styles.iconCircle}>
                            <Ionicons name="create-outline" size={26} color="#FFFFFF" />
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.headerTitle}>Marks Workspace</Text>
                            <Text style={styles.headerSub}>Generate sheet & enter marks directly</Text>
                        </View>
                    </View>
                </LinearGradient>

                {/* Configuration Card */}
                <View style={styles.configCard}>
                    <Text style={styles.sectionTitle}>1. Select Class & Academic Year</Text>

                    {/* Class Selector */}
                    <Text style={styles.fieldLabel}>Class</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                        {classes.map(c => {
                            const isSelected = c.id === selectedClassId;
                            return (
                                <TouchableOpacity
                                    key={c.id}
                                    style={[styles.chip, isSelected && styles.chipActive]}
                                    onPress={() => setSelectedClassId(c.id)}
                                >
                                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                                        {c.class_name} {c.section ? `(${c.section})` : ''}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    {/* Academic Year Selector */}
                    <Text style={styles.fieldLabel}>Academic Year</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                        {academicYears.map(y => {
                            const isSelected = y.id === selectedYearId;
                            return (
                                <TouchableOpacity
                                    key={y.id}
                                    style={[styles.chip, isSelected && styles.chipActive]}
                                    onPress={() => setSelectedYearId(y.id)}
                                >
                                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                                        {y.year_name} {y.is_current ? '★' : ''}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    <View style={styles.divider} />

                    {/* Exam Name Selector */}
                    <Text style={styles.sectionTitle}>2. Exam Name</Text>
                    <View style={styles.examModeToggle}>
                        <TouchableOpacity
                            style={[styles.toggleBtn, !isCustomExam && styles.toggleBtnActive]}
                            onPress={() => setIsCustomExam(false)}
                        >
                            <Text style={[styles.toggleBtnText, !isCustomExam && styles.toggleBtnTextActive]}>
                                Preset Exams
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.toggleBtn, isCustomExam && styles.toggleBtnActive]}
                            onPress={() => setIsCustomExam(true)}
                        >
                            <Text style={[styles.toggleBtnText, isCustomExam && styles.toggleBtnTextActive]}>
                                + Custom Exam
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {!isCustomExam ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                            {PRESET_EXAMS.map(examName => {
                                const isSelected = selectedExamType === examName;
                                return (
                                    <TouchableOpacity
                                        key={examName}
                                        style={[styles.chip, isSelected && styles.chipActive]}
                                        onPress={() => setSelectedExamType(examName)}
                                    >
                                        <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                                            {examName}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    ) : (
                        <TextInput
                            style={styles.textInput}
                            placeholder="e.g. Unit Test 1, Revision Exam, Weekly Test"
                            placeholderTextColor="#94A3B8"
                            value={customExamName}
                            onChangeText={setCustomExamName}
                        />
                    )}

                    <View style={styles.divider} />

                    {/* Subject & Max Marks */}
                    <Text style={styles.sectionTitle}>3. Subject & Maximum Marks</Text>
                    
                    <Text style={styles.fieldLabel}>Subject</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                        {subjects.map(s => {
                            const isSelected = s.id === selectedSubjectId;
                            return (
                                <TouchableOpacity
                                    key={s.id}
                                    style={[styles.chip, isSelected && styles.chipActive]}
                                    onPress={() => setSelectedSubjectId(s.id)}
                                >
                                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                                        {s.subject_name}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    <View style={styles.maxMarksRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.fieldLabel}>Max Marks</Text>
                            <TextInput
                                style={styles.maxMarksInput}
                                keyboardType="numeric"
                                value={maxMarks}
                                onChangeText={setMaxMarks}
                                placeholder="100"
                                placeholderTextColor="#94A3B8"
                            />
                        </View>
                        <View style={styles.quickMaxPills}>
                            {['25', '50', '100'].map(val => (
                                <TouchableOpacity
                                    key={val}
                                    style={[styles.quickPill, maxMarks === val && styles.quickPillActive]}
                                    onPress={() => setMaxMarks(val)}
                                >
                                    <Text style={[styles.quickPillText, maxMarks === val && styles.quickPillTextActive]}>
                                        {val}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Generate Sheet Button */}
                    <TouchableOpacity
                        style={styles.generateButton}
                        activeOpacity={0.85}
                        onPress={handleGenerateSheet}
                        disabled={loadingSheet}
                    >
                        <LinearGradient
                            colors={['#10B981', '#059669']}
                            style={styles.generateGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            {loadingSheet ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <>
                                    <Ionicons name="grid-outline" size={20} color="#FFFFFF" />
                                    <Text style={styles.generateButtonText}>
                                        {isSheetGenerated ? 'Regenerate Sheet' : 'Generate Sheet'}
                                    </Text>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* Generated Sheet Section */}
                {isSheetGenerated && (
                    <View style={styles.sheetContainer}>
                        {/* Summary Bar */}
                        <View style={styles.sheetHeaderBanner}>
                            <View>
                                <Text style={styles.bannerTitle}>
                                    {activeClassName} • {isCustomExam ? customExamName : selectedExamType}
                                </Text>
                                <Text style={styles.bannerSubtitle}>
                                    Subject: {activeSubjectName} (Max: {maxMarks})
                                </Text>
                            </View>
                            <View style={styles.gradedBadge}>
                                <Text style={styles.gradedBadgeText}>
                                    {gradedCount} / {students.length} Graded
                                </Text>
                            </View>
                        </View>

                        {/* Student Marks List */}
                        {students.map((student, index) => {
                            const val = marksMap[student.id] || '';
                            const rem = remarksMap[student.id] || '';

                            return (
                                <View key={student.id} style={styles.studentCard}>
                                    <View style={styles.studentCardTop}>
                                        <View style={styles.rollBadge}>
                                            <Text style={styles.rollBadgeText}>
                                                {student.roll_number || `#${index + 1}`}
                                            </Text>
                                        </View>

                                        {student.photo_url ? (
                                            <Image source={{ uri: student.photo_url }} style={styles.avatar} />
                                        ) : (
                                            <View style={styles.avatarPlaceholder}>
                                                <Text style={styles.avatarText}>
                                                    {student.full_name?.charAt(0)?.toUpperCase() || 'S'}
                                                </Text>
                                            </View>
                                        )}

                                        <View style={{ flex: 1, marginLeft: 10 }}>
                                            <Text style={styles.studentName} numberOfLines={1}>
                                                {student.full_name}
                                            </Text>
                                            <Text style={styles.regNumber}>
                                                {student.registration_number || 'No Reg #'}
                                            </Text>
                                        </View>

                                        {getGradePill(val)}
                                    </View>

                                    {/* Inputs Row */}
                                    <View style={styles.inputsRow}>
                                        <View style={styles.markInputWrap}>
                                            <Text style={styles.inputMiniLabel}>Marks Obtained</Text>
                                            <TextInput
                                                style={styles.markInputField}
                                                keyboardType="numeric"
                                                placeholder={`0 - ${maxMarks}`}
                                                placeholderTextColor="#94A3B8"
                                                value={val}
                                                onChangeText={text => {
                                                    setMarksMap(prev => ({ ...prev, [student.id]: text }));
                                                }}
                                            />
                                        </View>

                                        <View style={styles.remarkInputWrap}>
                                            <Text style={styles.inputMiniLabel}>Remarks (Optional)</Text>
                                            <TextInput
                                                style={styles.remarkInputField}
                                                placeholder="e.g. Excellent, Good"
                                                placeholderTextColor="#94A3B8"
                                                value={rem}
                                                onChangeText={text => {
                                                    setRemarksMap(prev => ({ ...prev, [student.id]: text }));
                                                }}
                                            />
                                        </View>
                                    </View>
                                </View>
                            );
                        })}

                        {/* Action Buttons */}
                        <View style={styles.actionButtonsRow}>
                            <TouchableOpacity
                                style={styles.draftButton}
                                activeOpacity={0.8}
                                onPress={() => handleSaveMarks(false)}
                                disabled={saving}
                            >
                                <Ionicons name="save-outline" size={18} color="#475569" />
                                <Text style={styles.draftButtonText}>Save Draft</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.publishButton}
                                activeOpacity={0.85}
                                onPress={() => handleSaveMarks(true)}
                                disabled={saving}
                            >
                                <LinearGradient
                                    colors={['#10B981', '#047857']}
                                    style={styles.publishGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    {saving ? (
                                        <ActivityIndicator color="#FFFFFF" size="small" />
                                    ) : (
                                        <>
                                            <Ionicons name="checkmark-done" size={20} color="#FFFFFF" />
                                            <Text style={styles.publishButtonText}>Publish Marks</Text>
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
    headerGradient: {
        paddingTop: 54,
        paddingBottom: 22,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    headerSub: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.85)',
        marginTop: 2,
    },
    configCard: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        marginTop: -12,
        borderRadius: 18,
        padding: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 8,
    },
    fieldLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
        marginTop: 8,
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    chipRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    chip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 12,
        backgroundColor: '#F1F5F9',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    chipActive: {
        backgroundColor: '#2D7D46',
        borderColor: '#2D7D46',
    },
    chipText: {
        fontSize: 13,
        color: '#475569',
        fontWeight: '500',
    },
    chipTextActive: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 14,
    },
    examModeToggle: {
        flexDirection: 'row',
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        padding: 4,
        marginBottom: 10,
    },
    toggleBtn: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 10,
    },
    toggleBtnActive: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 1,
    },
    toggleBtnText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#64748B',
    },
    toggleBtnTextActive: {
        fontWeight: '700',
        color: '#2D7D46',
    },
    textInput: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 14,
        color: '#1E293B',
        marginBottom: 8,
    },
    maxMarksRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 12,
        marginTop: 4,
        marginBottom: 16,
    },
    maxMarksInput: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
    },
    quickMaxPills: {
        flexDirection: 'row',
        gap: 6,
        marginBottom: 4,
    },
    quickPill: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#CBD5E1',
    },
    quickPillActive: {
        backgroundColor: '#2D7D46',
        borderColor: '#2D7D46',
    },
    quickPillText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#475569',
    },
    quickPillTextActive: {
        color: '#FFFFFF',
    },
    generateButton: {
        borderRadius: 14,
        overflow: 'hidden',
        marginTop: 6,
    },
    generateGradient: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 14,
        gap: 8,
    },
    generateButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
    sheetContainer: {
        marginHorizontal: 16,
        marginTop: 18,
    },
    sheetHeaderBanner: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#1E293B',
        padding: 14,
        borderRadius: 14,
        marginBottom: 12,
    },
    bannerTitle: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
    bannerSubtitle: {
        color: '#94A3B8',
        fontSize: 12,
        marginTop: 2,
    },
    gradedBadge: {
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#10B981',
    },
    gradedBadgeText: {
        color: '#10B981',
        fontSize: 12,
        fontWeight: '700',
    },
    studentCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
    },
    studentCardTop: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    rollBadge: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    rollBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#475569',
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
    },
    avatarPlaceholder: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#475569',
    },
    studentName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1E293B',
    },
    regNumber: {
        fontSize: 11,
        color: '#64748B',
        marginTop: 1,
    },
    gradeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    gradeBadgeText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '800',
    },
    inputsRow: {
        flexDirection: 'row',
        gap: 10,
    },
    markInputWrap: {
        width: 120,
    },
    remarkInputWrap: {
        flex: 1,
    },
    inputMiniLabel: {
        fontSize: 10,
        color: '#64748B',
        fontWeight: '600',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    markInputField: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 14,
        fontWeight: '700',
        color: '#1E293B',
        textAlign: 'center',
    },
    remarkInputField: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 13,
        color: '#1E293B',
    },
    actionButtonsRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 14,
    },
    draftButton: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 14,
        paddingVertical: 14,
        gap: 6,
    },
    draftButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#475569',
    },
    publishButton: {
        flex: 1.4,
        borderRadius: 14,
        overflow: 'hidden',
    },
    publishGradient: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 14,
        gap: 8,
    },
    publishButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});
