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
    examId: string | null;
    onClose: () => void;
}

interface SubjectMark {
    id: string;
    subject_id: string;
    subject_name: string;
    marks_obtained: number;
    max_marks: number;
    grade: string;
}

export default function MarksCard({ visible, studentId, examId, onClose }: MarksCardProps) {
    const [student, setStudent] = useState<any>(null);
    const [exam, setExam] = useState<any>(null);
    const [marks, setMarks] = useState<SubjectMark[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (visible && studentId) {
            fetchMarksCardData();
        }
    }, [visible, studentId, examId]);

    const fetchMarksCardData = async () => {
        setLoading(true);
        try {
            // Fetch student data
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

            // Fetch exam data
            const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
            let currentExamId = examId && typeof examId === 'string' && isUUID(examId) ? examId : null;
            let currentExam = null;

            if (currentExamId) {
                const { data: examData, error: examError } = await supabase
                    .from('exams')
                    .select('id, exam_name, exam_type, exam_date')
                    .eq('id', currentExamId)
                    .single();

                if (!examError && examData) {
                    currentExam = examData;
                    setExam(currentExam);
                }
            } else {
                // Try to fallback to the latest exam for the student
                const { data: latestMark } = await supabase.from('marks').select('exam_id').eq('student_id', studentId).order('created_at', { ascending: false }).limit(1).maybeSingle();
                if (latestMark) {
                    currentExamId = latestMark.exam_id;
                    const { data: examData } = await supabase
                        .from('exams')
                        .select('id, exam_name, exam_type, exam_date')
                        .eq('id', currentExamId)
                        .single();
                    if (examData) {
                        currentExam = examData;
                        setExam(examData);
                    }
                }
            }

            // Fetch marks with subject names
            let marksQuery = supabase
                .from('marks')
                .select(`
          id,
          subject_id,
          marks_obtained,
          max_marks,
          grade,
          subjects (subject_name)
        `)
                .eq('student_id', studentId);

            if (currentExamId) {
                marksQuery = marksQuery.eq('exam_id', currentExamId);
            }

            const { data: marksData, error: marksError } = await marksQuery;

            if (marksError) throw marksError;

            const formattedMarks: SubjectMark[] = (marksData || []).map((m: any) => ({
                id: m.id,
                subject_id: m.subject_id,
                subject_name: m.subjects?.subject_name || 'Unknown',
                marks_obtained: m.marks_obtained,
                max_marks: m.max_marks || 100,
                grade: m.grade,
            }));

            setMarks(formattedMarks);
        } catch (err) {
            console.error('Error fetching marks card data:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!visible) return null;

    const calculateGrade = (marksObtained: number, maxMarks: number = 100): string => {
        if (maxMarks <= 0) return 'F';
        const percentage = (marksObtained / maxMarks) * 100;
        if (percentage >= 90) return 'A+';
        if (percentage >= 70) return 'A';
        if (percentage >= 50) return 'B+';
        if (percentage >= 30) return 'B';
        return 'C';
    };

    const totalMarks = marks.reduce((sum, m) => sum + m.marks_obtained, 0);
    const totalMaxMarks = marks.reduce((sum, m) => sum + m.max_marks, 0);
    const percentage = totalMaxMarks > 0 ? Math.round((totalMarks / totalMaxMarks) * 100) : 0;
    const finalGrade = calculateGrade(totalMarks, totalMaxMarks);

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
                        </View>
                    ) : (
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* Header with School Details */}
                            <View style={styles.headerArea}>
                                <Image source={require('../../assets/images/logo.jpeg')} style={styles.logoImage} />
                                <View style={styles.schoolNameContainer}>
                                    <Text style={styles.schoolName}>GRAMEEN KRIDA VASATI SHALE SHARAN SIRASAGI</Text>
                                    <Text style={styles.tagline}>Excellence in Education</Text>
                                </View>
                            </View>

                            {/* Marks Card Title */}
                            <View style={styles.titleArea}>
                                <Text style={styles.cardTitle}>MARKS CARD - {formatExamName(exam?.exam_type || exam?.exam_name || 'EXAM')}</Text>
                                <Text style={styles.cardDate}>Date: {exam?.exam_date ? new Date(exam.exam_date).toLocaleDateString() : 'N/A'}</Text>
                            </View>

                            {/* Student Info Box */}
                            <View style={styles.studentInfoBox}>
                                <View style={styles.studentAvatar}>
                                    {student?.photo_url ? (
                                        <Image source={{ uri: student.photo_url }} style={styles.avatarImage} />
                                    ) : (
                                        <Text style={styles.avatarText}>{student?.full_name?.charAt(0).toUpperCase()}</Text>
                                    )}
                                </View>
                                <View style={{ flex: 1, paddingLeft: 16 }}>
                                    <Text style={styles.studentName}>{student?.full_name}</Text>
                                    <Text style={styles.studentSubInfo}>Class: {student?.classes?.class_name} {student?.classes?.section ? `- ${student.classes.section}` : ''}</Text>
                                    <Text style={styles.studentSubInfo}>ID: {student?.registration_number}</Text>
                                    <Text style={styles.studentSubInfo}>DOB: {student?.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : 'N/A'}</Text>
                                    <Text style={styles.studentSubInfo}>Parent: {student?.parent_name || 'N/A'}</Text>
                                </View>
                            </View>

                            {/* Marks Table */}
                            <View style={styles.tableContainer}>
                                <View style={styles.tableHeaderRow}>
                                    <Text style={[styles.tableHeaderCell, { flex: 2, textAlign: 'left' }]}>Subject</Text>
                                    <Text style={styles.tableHeaderCell}>Marks</Text>
                                    <Text style={styles.tableHeaderCell}>Max</Text>
                                    <Text style={styles.tableHeaderCell}>Avg</Text>
                                    <Text style={styles.tableHeaderCell}>Grade</Text>
                                </View>

                                {marks.map((mark, index) => {
                                    const dynamicGrade = calculateGrade(mark.marks_obtained, mark.max_marks || 100);
                                    return (
                                        <View key={mark.id} style={[styles.tableRow, index % 2 === 0 ? { backgroundColor: '#FFFFFF' } : { backgroundColor: '#FAFAFA' }]}>
                                            <Text style={[styles.tableCell, { flex: 2, textAlign: 'left', fontWeight: '500' }]}>{mark.subject_name}</Text>
                                            <Text style={[styles.tableCell, { fontWeight: '700' }]}>{mark.marks_obtained}</Text>
                                            <Text style={[styles.tableCell, { color: '#6B7280' }]}>{mark.max_marks}</Text>
                                            <Text style={[styles.tableCell, { color: '#6B7280' }]}>{mark.max_marks > 0 ? Math.round((mark.marks_obtained / mark.max_marks) * 100) : 0}%</Text>
                                            <View style={[styles.gradeBadge, dynamicGrade.includes('A') ? { backgroundColor: '#DEF7EC' } : dynamicGrade.includes('C') ? { backgroundColor: '#FDE8E8' } : { backgroundColor: '#FEF08A' }]}>
                                                <Text style={[styles.gradeText, dynamicGrade.includes('A') ? { color: '#03543F' } : dynamicGrade.includes('C') ? { color: '#9B1C1C' } : { color: '#723B13' }]}>
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
                                    <View style={[styles.gradeBadge, finalGrade.includes('A') ? { backgroundColor: '#DEF7EC' } : finalGrade.includes('C') ? { backgroundColor: '#FDE8E8' } : { backgroundColor: '#FEF08A' }]}>
                                        <Text style={[styles.gradeText, finalGrade.includes('A') ? { color: '#03543F' } : finalGrade.includes('C') ? { color: '#9B1C1C' } : { color: '#723B13' }]}>
                                            {finalGrade}
                                        </Text>
                                    </View>
                                </View>
                            </View>

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

                            <View style={{ height: 40 }} />
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
        padding: 20,
    },
    cardContainer: {
        width: '100%',
        maxWidth: 500,
        maxHeight: '90%',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 10,
        padding: 8,
        backgroundColor: '#F3F4F6',
        borderRadius: 20,
    },
    loader: {
        padding: 40,
        alignItems: 'center',
    },
    headerArea: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 20,
        borderBottomWidth: 2,
        borderBottomColor: '#0071E3',
        marginBottom: 20,
        marginTop: 20,
        gap: 16,
    },
    logoImage: {
        width: 60,
        height: 60,
        resizeMode: 'contain',
    },
    schoolNameContainer: {
        flex: 1,
    },
    schoolName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1D1D1F',
        textTransform: 'uppercase',
    },
    tagline: {
        fontSize: 13,
        color: '#6B7280',
        fontStyle: 'italic',
        marginTop: 4,
    },
    titleArea: {
        alignItems: 'center',
        marginBottom: 24,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1D1D1F',
        marginBottom: 4,
    },
    cardDate: {
        fontSize: 13,
        color: '#6B7280',
    },
    studentInfoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginBottom: 24,
    },
    studentAvatar: {
        width: 60,
        height: 60,
        borderRadius: 12,
        backgroundColor: '#3DA05A',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    avatarText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    studentName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1D1D1F',
        marginBottom: 4,
    },
    studentSubInfo: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 2,
    },
    tableContainer: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 32,
    },
    tableHeaderRow: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    tableHeaderCell: {
        flex: 1,
        textAlign: 'center',
        fontSize: 12,
        fontWeight: 'bold',
        color: '#4B5563',
        textTransform: 'uppercase',
    },
    tableRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    tableCell: {
        flex: 1,
        textAlign: 'center',
        fontSize: 14,
        color: '#1D1D1F',
    },
    gradeBadge: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 4,
        borderRadius: 12,
        marginHorizontal: 8,
    },
    gradeText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    totalRow: {
        flexDirection: 'row',
        backgroundColor: '#F8F9FA',
        paddingVertical: 16,
        paddingHorizontal: 8,
        borderTopWidth: 2,
        borderTopColor: '#D1D5DB',
    },
    totalCell: {
        flex: 1,
        textAlign: 'center',
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    totalCellBold: {
        flex: 1,
        textAlign: 'center',
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0071E3',
    },
    totalCellMeta: {
        flex: 1,
        textAlign: 'center',
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    signaturesArea: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        marginTop: 20,
    },
    signatureBox: {
        alignItems: 'center',
    },
    signatureLine: {
        width: 100,
        borderTopWidth: 1,
        borderTopColor: '#1D1D1F',
        marginBottom: 8,
    },
    signatureText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4B5563',
    },
});
