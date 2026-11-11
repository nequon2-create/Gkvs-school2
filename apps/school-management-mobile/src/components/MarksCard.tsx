import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, Modal, ScrollView, ActivityIndicator, TouchableOpacity, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../config/supabase';

const formatExamName = (name: string) => {
    if (!name) return '';
    return name.replace(/FA([1-4])/gi, 'F$1').replace(/SA([1-2])/gi, 'S$1');
};

interface MarksCardProps {
    visible: boolean;
    studentId: string;
    examId?: string | null;
    onClose: () => void;
}

interface SubjectMark {
    id: string;
    subject_id: string;
    subject_name: string;
    marks_obtained: number;
    max_marks: number;
    grade: string;
    remarks?: string | null;
}

interface ExamInfo {
    id: string;
    exam_name: string;
    exam_type: string;
    exam_date: string;
    totalMarksSum?: number;
    totalMaxSum?: number;
}

export default function MarksCard({ visible, studentId, examId, onClose }: MarksCardProps) {
    const [student, setStudent] = useState<any>(null);
    const [availableExams, setAvailableExams] = useState<ExamInfo[]>([]);
    const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
    const [currentExam, setCurrentExam] = useState<ExamInfo | null>(null);
    const [marks, setMarks] = useState<SubjectMark[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMarks, setLoadingMarks] = useState(false);

    useEffect(() => {
        if (visible && studentId) {
            fetchInitialData();
        }
    }, [visible, studentId]);

    useEffect(() => {
        if (selectedExamId && studentId) {
            fetchMarksForExam(selectedExamId);
        }
    }, [selectedExamId]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            // 1. Fetch student data
            const { data: studentData, error: studentError } = await supabase
                .from('students')
                .select(`
                    id,
                    full_name,
                    registration_number,
                    parent_name,
                    date_of_birth,
                    photo_url,
                    classes (class_name, section)
                `)
                .eq('id', studentId)
                .single();

            if (studentError) throw studentError;
            setStudent(studentData);

            // 2. Fetch distinct exam IDs where this student has marks
            const { data: studentMarks, error: marksError } = await supabase
                .from('marks')
                .select('exam_id')
                .eq('student_id', studentId);

            if (marksError) throw marksError;

            const examIds = Array.from(new Set((studentMarks || []).map(m => m.exam_id).filter(Boolean)));

            if (examIds.length > 0) {
                // 3. Fetch exam details for all these exams, ordered by date descending
                const { data: examsData, error: examsError } = await supabase
                    .from('exams')
                    .select('id, exam_name, exam_type, exam_date, is_published')
                    .in('id', examIds)
                    .order('exam_date', { ascending: false });

                if (examsError) throw examsError;

                const publishedExams: ExamInfo[] = (examsData || []).map(e => ({
                    id: e.id,
                    exam_name: e.exam_name,
                    exam_type: e.exam_type,
                    exam_date: e.exam_date,
                }));

                setAvailableExams(publishedExams);

                // Determine which exam to select
                const targetId = examId && publishedExams.some(e => e.id === examId)
                    ? examId
                    : publishedExams.length > 0
                        ? publishedExams[0].id
                        : null;

                setSelectedExamId(targetId);
                const found = publishedExams.find(e => e.id === targetId) || null;
                setCurrentExam(found);
            } else {
                setAvailableExams([]);
                setSelectedExamId(null);
                setCurrentExam(null);
                setMarks([]);
            }
        } catch (err) {
            console.error('Error fetching marks card initial data:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMarksForExam = async (eId: string) => {
        setLoadingMarks(true);
        try {
            const found = availableExams.find(e => e.id === eId) || null;
            setCurrentExam(found);

            const { data: marksData, error: marksError } = await supabase
                .from('marks')
                .select(`
                    id,
                    subject_id,
                    marks_obtained,
                    max_marks,
                    grade,
                    remarks,
                    subjects (subject_name)
                `)
                .eq('student_id', studentId)
                .eq('exam_id', eId);

            if (marksError) throw marksError;

            const formattedMarks: SubjectMark[] = (marksData || []).map((m: any) => ({
                id: m.id,
                subject_id: m.subject_id,
                subject_name: m.subjects?.subject_name || 'Subject',
                marks_obtained: m.marks_obtained,
                max_marks: m.max_marks || 100,
                grade: m.grade,
                remarks: m.remarks,
            }));

            setMarks(formattedMarks);
        } catch (err) {
            console.error('Error fetching marks for exam:', err);
        } finally {
            setLoadingMarks(false);
        }
    };

    if (!visible) return null;

    const calculateGrade = (marksObtained: number, maxMarks: number = 100): string => {
        if (maxMarks <= 0) return 'F';
        const percentage = (marksObtained / maxMarks) * 100;
        if (percentage >= 90) return 'A+';
        if (percentage >= 80) return 'A';
        if (percentage >= 70) return 'B+';
        if (percentage >= 60) return 'B';
        if (percentage >= 50) return 'C';
        if (percentage >= 40) return 'D';
        return 'F';
    };

    const totalMarks = marks.reduce((sum, m) => sum + (m.marks_obtained || 0), 0);
    const totalMaxMarks = marks.reduce((sum, m) => sum + (m.max_marks || 100), 0);
    const percentage = totalMaxMarks > 0 ? Math.round((totalMarks / totalMaxMarks) * 100) : 0;
    const finalGrade = calculateGrade(totalMarks, totalMaxMarks);

    // Extract any student remarks
    const remarksList = marks.filter(m => m.remarks && m.remarks.trim() !== '');

    return (
        <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.cardContainer}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color="#1D1D1F" />
                    </TouchableOpacity>

                    {loading ? (
                        <View style={styles.loader}>
                            <ActivityIndicator size="large" color="#0071E3" />
                            <Text style={styles.loadingText}>Loading Marks Card...</Text>
                        </View>
                    ) : (
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* Header with School Details */}
                            <View style={styles.headerArea}>
                                <Image source={require('../../assets/images/logo.jpeg')} style={styles.logoImage} />
                                <View style={styles.schoolNameContainer}>
                                    <Text style={styles.schoolName}>GRAMEEN KRIDA VASATI SHALE</Text>
                                    <Text style={styles.tagline}>Excellence in Education • Student Report</Text>
                                </View>
                            </View>

                            {/* Date-wise Exam Selector Chips */}
                            <View style={styles.examPickerSection}>
                                <Text style={styles.examPickerLabel}>All Saved Exams (Date-wise):</Text>
                                {availableExams.length === 0 ? (
                                    <View style={styles.noExamsNotice}>
                                        <Text style={styles.noExamsNoticeText}>No published exam marks found yet.</Text>
                                    </View>
                                ) : (
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.examChipsRow}>
                                        {availableExams.map(ex => {
                                            const isSelected = ex.id === selectedExamId;
                                            const dateStr = ex.exam_date
                                                ? new Date(ex.exam_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
                                                : '';
                                            return (
                                                <TouchableOpacity
                                                    key={ex.id}
                                                    style={[styles.examChip, isSelected && styles.examChipActive]}
                                                    onPress={() => setSelectedExamId(ex.id)}
                                                    activeOpacity={0.8}
                                                >
                                                    <Ionicons
                                                        name={isSelected ? 'document-text' : 'document-text-outline'}
                                                        size={14}
                                                        color={isSelected ? '#FFFFFF' : '#475569'}
                                                    />
                                                    <Text style={[styles.examChipTitle, isSelected && styles.examChipTitleActive]}>
                                                        {ex.exam_name}
                                                    </Text>
                                                    {dateStr ? (
                                                        <Text style={[styles.examChipDate, isSelected && styles.examChipDateActive]}>
                                                            • {dateStr}
                                                        </Text>
                                                    ) : null}
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </ScrollView>
                                )}
                            </View>

                            {/* Marks Card Title */}
                            {currentExam && (
                                <View style={styles.titleArea}>
                                    <Text style={styles.cardTitle}>
                                        MARKS CARD - {formatExamName(currentExam.exam_name || 'EXAM').toUpperCase()}
                                    </Text>
                                    <Text style={styles.cardDate}>
                                        Date: {currentExam.exam_date ? new Date(currentExam.exam_date).toLocaleDateString('en-GB') : 'N/A'}
                                    </Text>
                                </View>
                            )}

                            {/* Student Info Box */}
                            <View style={styles.studentInfoBox}>
                                <View style={styles.studentAvatar}>
                                    {student?.photo_url ? (
                                        <Image source={{ uri: student.photo_url }} style={styles.avatarImage} />
                                    ) : (
                                        <Text style={styles.avatarText}>{student?.full_name?.charAt(0).toUpperCase() || 'S'}</Text>
                                    )}
                                </View>
                                <View style={{ flex: 1, paddingLeft: 14 }}>
                                    <Text style={styles.studentName}>{student?.full_name}</Text>
                                    <Text style={styles.studentSubInfo}>
                                        Class: {student?.classes?.class_name} {student?.classes?.section ? `- ${student.classes.section}` : ''}
                                    </Text>
                                    <Text style={styles.studentSubInfo}>Reg No: {student?.registration_number || 'N/A'}</Text>
                                    <Text style={styles.studentSubInfo}>Parent: {student?.parent_name || 'N/A'}</Text>
                                </View>
                            </View>

                            {/* Marks Table */}
                            {loadingMarks ? (
                                <View style={{ padding: 30, alignItems: 'center' }}>
                                    <ActivityIndicator size="small" color="#0071E3" />
                                    <Text style={{ marginTop: 8, color: '#64748B', fontSize: 13 }}>Loading exam marks...</Text>
                                </View>
                            ) : marks.length === 0 ? (
                                <View style={styles.emptyTable}>
                                    <Ionicons name="clipboard-outline" size={36} color="#CBD5E1" />
                                    <Text style={styles.emptyTableText}>No subject marks entered for this exam yet.</Text>
                                </View>
                            ) : (
                                <>
                                    <View style={styles.tableContainer}>
                                        <View style={styles.tableHeaderRow}>
                                            <Text style={[styles.tableHeaderCell, { flex: 2, textAlign: 'left' }]}>Subject</Text>
                                            <Text style={styles.tableHeaderCell}>Marks</Text>
                                            <Text style={styles.tableHeaderCell}>Max</Text>
                                            <Text style={styles.tableHeaderCell}>%</Text>
                                            <Text style={styles.tableHeaderCell}>Grade</Text>
                                        </View>

                                        {marks.map((mark, index) => {
                                            const dynamicGrade = calculateGrade(mark.marks_obtained, mark.max_marks || 100);
                                            const isEven = index % 2 === 0;
                                            return (
                                                <View
                                                    key={mark.id}
                                                    style={[styles.tableRow, isEven ? { backgroundColor: '#FFFFFF' } : { backgroundColor: '#FAFAFA' }]}
                                                >
                                                    <Text style={[styles.tableCell, { flex: 2, textAlign: 'left', fontWeight: '600' }]}>
                                                        {mark.subject_name}
                                                    </Text>
                                                    <Text style={[styles.tableCell, { fontWeight: '700' }]}>
                                                        {mark.marks_obtained}
                                                    </Text>
                                                    <Text style={[styles.tableCell, { color: '#64748B' }]}>
                                                        {mark.max_marks}
                                                    </Text>
                                                    <Text style={[styles.tableCell, { color: '#64748B' }]}>
                                                        {mark.max_marks > 0 ? Math.round((mark.marks_obtained / mark.max_marks) * 100) : 0}%
                                                    </Text>
                                                    <View
                                                        style={[
                                                            styles.gradeBadge,
                                                            dynamicGrade.includes('A')
                                                                ? { backgroundColor: '#DEF7EC' }
                                                                : dynamicGrade.includes('C') || dynamicGrade.includes('F')
                                                                ? { backgroundColor: '#FDE8E8' }
                                                                : { backgroundColor: '#FEF08A' },
                                                        ]}
                                                    >
                                                        <Text
                                                            style={[
                                                                styles.gradeText,
                                                                dynamicGrade.includes('A')
                                                                    ? { color: '#03543F' }
                                                                    : dynamicGrade.includes('C') || dynamicGrade.includes('F')
                                                                    ? { color: '#9B1C1C' }
                                                                    : { color: '#723B13' },
                                                            ]}
                                                        >
                                                            {dynamicGrade}
                                                        </Text>
                                                    </View>
                                                </View>
                                            );
                                        })}

                                        {/* Total Row */}
                                        <View style={styles.totalRow}>
                                            <Text style={[styles.totalCell, { flex: 2, textAlign: 'left' }]}>TOTAL</Text>
                                            <Text style={styles.totalCellBold}>{totalMarks}</Text>
                                            <Text style={styles.totalCellMeta}>{totalMaxMarks}</Text>
                                            <Text style={styles.totalCellBold}>{percentage}%</Text>
                                            <View
                                                style={[
                                                    styles.gradeBadge,
                                                    finalGrade.includes('A')
                                                        ? { backgroundColor: '#DEF7EC' }
                                                        : finalGrade.includes('C') || finalGrade.includes('F')
                                                        ? { backgroundColor: '#FDE8E8' }
                                                        : { backgroundColor: '#FEF08A' },
                                                ]}
                                            >
                                                <Text
                                                    style={[
                                                        styles.gradeText,
                                                        finalGrade.includes('A')
                                                            ? { color: '#03543F' }
                                                            : finalGrade.includes('C') || finalGrade.includes('F')
                                                            ? { color: '#9B1C1C' }
                                                            : { color: '#723B13' },
                                                    ]}
                                                >
                                                    {finalGrade}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>

                                    {/* Remarks section if any */}
                                    {remarksList.length > 0 && (
                                        <View style={styles.remarksBox}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                                                <Ionicons name="chatbubble-ellipses-outline" size={16} color="#0071E3" />
                                                <Text style={styles.remarksBoxTitle}>Teacher Remarks</Text>
                                            </View>
                                            {remarksList.map(m => (
                                                <Text key={m.id} style={styles.remarkItem}>
                                                    • <Text style={{ fontWeight: '600' }}>{m.subject_name}:</Text> {m.remarks}
                                                </Text>
                                            ))}
                                        </View>
                                    )}
                                </>
                            )}

                            {/* Signatures */}
                            <View style={styles.signaturesArea}>
                                <View style={styles.signatureBox}>
                                    <View style={styles.signatureLine} />
                                    <Text style={styles.signatureText}>Class Teacher</Text>
                                </View>
                                <View style={styles.signatureBox}>
                                    <View style={styles.signatureLine} />
                                    <Text style={styles.signatureText}>Principal Signature</Text>
                                </View>
                            </View>

                            <View style={{ height: 30 }} />
                        </ScrollView>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    cardContainer: {
        width: '100%',
        maxWidth: 520,
        maxHeight: '92%',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 18,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
    },
    closeButton: {
        position: 'absolute',
        top: 14,
        right: 14,
        zIndex: 10,
        padding: 6,
        backgroundColor: '#F1F5F9',
        borderRadius: 20,
    },
    loader: {
        padding: 40,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: '#64748B',
        fontSize: 14,
        fontWeight: '500',
    },
    headerArea: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingBottom: 14,
        borderBottomWidth: 2,
        borderBottomColor: '#2D7D46',
        marginBottom: 14,
        gap: 12,
    },
    logoImage: {
        width: 50,
        height: 50,
        resizeMode: 'contain',
    },
    schoolNameContainer: {
        flex: 1,
    },
    schoolName: {
        fontSize: 14,
        fontWeight: '800',
        color: '#1E293B',
        textTransform: 'uppercase',
    },
    tagline: {
        fontSize: 11,
        color: '#64748B',
        marginTop: 2,
    },
    examPickerSection: {
        marginBottom: 14,
        backgroundColor: '#F8FAFC',
        padding: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    examPickerLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#475569',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    examChipsRow: {
        flexDirection: 'row',
    },
    examChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 10,
        backgroundColor: '#FFFFFF',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        gap: 5,
    },
    examChipActive: {
        backgroundColor: '#2D7D46',
        borderColor: '#2D7D46',
    },
    examChipTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#334155',
    },
    examChipTitleActive: {
        color: '#FFFFFF',
    },
    examChipDate: {
        fontSize: 11,
        color: '#64748B',
    },
    examChipDateActive: {
        color: 'rgba(255, 255, 255, 0.85)',
    },
    noExamsNotice: {
        paddingVertical: 8,
    },
    noExamsNoticeText: {
        fontSize: 12,
        color: '#94A3B8',
        fontStyle: 'italic',
    },
    titleArea: {
        alignItems: 'center',
        marginBottom: 14,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1E293B',
        letterSpacing: 0.5,
    },
    cardDate: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2,
    },
    studentInfoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 16,
    },
    studentAvatar: {
        width: 52,
        height: 52,
        borderRadius: 12,
        backgroundColor: '#2D7D46',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    avatarText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    studentName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 2,
    },
    studentSubInfo: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 1,
    },
    emptyTable: {
        padding: 30,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 20,
    },
    emptyTableText: {
        marginTop: 8,
        fontSize: 13,
        color: '#64748B',
    },
    tableContainer: {
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 16,
    },
    tableHeaderRow: {
        flexDirection: 'row',
        backgroundColor: '#F1F5F9',
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    tableHeaderCell: {
        flex: 1,
        textAlign: 'center',
        fontSize: 11,
        fontWeight: '700',
        color: '#475569',
        textTransform: 'uppercase',
    },
    tableRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    tableCell: {
        flex: 1,
        textAlign: 'center',
        fontSize: 13,
        color: '#1E293B',
    },
    gradeBadge: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 3,
        borderRadius: 6,
        marginHorizontal: 4,
    },
    gradeText: {
        fontSize: 11,
        fontWeight: '800',
    },
    totalRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderTopWidth: 2,
        borderTopColor: '#CBD5E1',
    },
    totalCell: {
        flex: 1,
        textAlign: 'center',
        fontSize: 13,
        fontWeight: '800',
        color: '#1E293B',
    },
    totalCellBold: {
        flex: 1,
        textAlign: 'center',
        fontSize: 14,
        fontWeight: '800',
        color: '#2D7D46',
    },
    totalCellMeta: {
        flex: 1,
        textAlign: 'center',
        fontSize: 13,
        fontWeight: '600',
        color: '#64748B',
    },
    remarksBox: {
        backgroundColor: '#F0FDF4',
        borderWidth: 1,
        borderColor: '#BBF7D0',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
    },
    remarksBoxTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#166534',
        marginLeft: 6,
    },
    remarkItem: {
        fontSize: 12,
        color: '#1E293B',
        marginTop: 3,
    },
    signaturesArea: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        marginTop: 16,
    },
    signatureBox: {
        alignItems: 'center',
    },
    signatureLine: {
        width: 90,
        borderTopWidth: 1,
        borderTopColor: '#94A3B8',
        marginBottom: 6,
    },
    signatureText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#64748B',
    },
});
