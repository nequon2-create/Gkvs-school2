import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Edit2, Save, X, Printer } from 'lucide-react';

interface MarksCardProps {
    studentId: string;
    examId: string;
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

export function MarksCard({ studentId, examId, onClose }: MarksCardProps) {
    const [student, setStudent] = useState<any>(null);
    const [exam, setExam] = useState<any>(null);
    const [marks, setMarks] = useState<SubjectMark[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editedMarks, setEditedMarks] = useState<Record<string, number>>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchMarksCardData();
    }, [studentId, examId]);

    const fetchMarksCardData = async () => {
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

            // Sort subjects alphabetically maybe? Or keep original order
            setMarks(formattedMarks);
        } catch (err) {
            console.error('Error fetching marks card data:', err);
            // alert('Failed to load marks card');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const calculateGrade = (marksObtained: number, maxMarks: number = 100): string => {
        if (maxMarks <= 0) return 'F';
        const percentage = (marksObtained / maxMarks) * 100;
        if (percentage >= 90) return 'A+';
        if (percentage >= 70) return 'A';
        if (percentage >= 50) return 'B+';
        if (percentage >= 30) return 'B';
        return 'C';
    };

    const handleMarkChange = (markId: string, value: string) => {
        const numValue = Math.max(0, Math.min(100, Number(value) || 0));
        setEditedMarks(prev => ({
            ...prev,
            [markId]: numValue
        }));
    };

    const handleSaveMarks = async () => {
        setSaving(true);
        try {
            for (const mark of marks) {
                if (editedMarks[mark.id] !== undefined && editedMarks[mark.id] !== mark.marks_obtained) {
                    const newMarks = editedMarks[mark.id];
                    await supabase
                        .from('marks')
                        .update({
                            marks_obtained: newMarks,
                            percentage: newMarks, // Assuming max is 100
                            grade: calculateGrade(newMarks, mark.max_marks || 100)
                        })
                        .eq('id', mark.id);
                }
            }
            setIsEditing(false);
            setEditedMarks({});
            await fetchMarksCardData(); // Refresh data
        } catch (error) {
            console.error('Failed to save marks:', error);
            alert('Failed to save updated marks');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                }}
            >
                <div style={{ color: '#fff', fontSize: '18px' }}>Loading marks card...</div>
            </div>
        );
    }

    const displayedMarks = marks.map(m => ({
        ...m,
        marks_obtained: isEditing && editedMarks[m.id] !== undefined ? editedMarks[m.id] : m.marks_obtained,
        grade: isEditing && editedMarks[m.id] !== undefined ? calculateGrade(editedMarks[m.id], m.max_marks || 100) : m.grade
    }));

    const totalMarks = displayedMarks.reduce((sum, m) => sum + m.marks_obtained, 0);
    const totalMaxMarks = displayedMarks.reduce((sum, m) => sum + m.max_marks, 0);
    const percentage = totalMaxMarks > 0 ? Math.round((totalMarks / totalMaxMarks) * 100) : 0;
    const finalGrade = calculateGrade(totalMarks, totalMaxMarks);

    return (
        <div
            id="marks-card-overlay"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '20px',
            }}
            onClick={onClose}
        >
            <div
                className="marks-card-container"
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: '#fff',
                    borderRadius: '24px',
                    padding: '40px',
                    maxWidth: '800px',
                    width: '100%',
                    maxHeight: '95vh',
                    overflowY: 'auto',
                    position: 'relative',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                }}
            >
                {/* Admin Actions (No Print) */}
                <div className="no-print" style={{ position: 'absolute', top: '24px', right: '24px', display: 'flex', gap: '8px' }}>
                    {isEditing ? (
                        <>
                            <button
                                onClick={() => { setIsEditing(false); setEditedMarks({}); }}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    background: '#F5F5F7',
                                    border: '1px solid #DBDBDB',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontSize: '14px',
                                    fontWeight: '500'
                                }}
                            >
                                <X size={16} /> Cancel
                            </button>
                            <button
                                onClick={handleSaveMarks}
                                disabled={saving}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    background: '#0071E3',
                                    color: '#fff',
                                    border: 'none',
                                    cursor: saving ? 'wait' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontSize: '14px',
                                    fontWeight: '500'
                                }}
                            >
                                <Save size={16} /> {saving ? 'Saving...' : 'Save'}
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setIsEditing(true)}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '8px',
                                background: '#F5F5F7',
                                color: '#1D1D1F',
                                border: '1px solid #DBDBDB',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '14px',
                                fontWeight: '500'
                            }}
                        >
                            <Edit2 size={16} /> Edit Marks
                        </button>
                    )}
                </div>

                {/* Header with School Logo and Name */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '24px',
                        borderBottom: '2px solid #0071E3',
                        paddingBottom: '24px',
                        marginBottom: '24px',
                    }}
                >
                    <div
                        style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            flexShrink: 0
                        }}
                    >
                        <img
                            src="/logo.jpeg"
                            alt="School Logo"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.parentElement!.innerHTML = '🏫';
                                target.parentElement!.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                                target.parentElement!.style.fontSize = '40px';
                            }}
                        />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <h1 style={{ margin: '0 0 4px 0', fontSize: '24px', color: '#1a202c', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Grameen Krida vasati shale sharan sirasagi
                        </h1>
                        <p style={{ fontSize: '15px', color: '#86868B', margin: 0, fontStyle: 'italic' }}>
                            Excellence in Education
                        </p>
                    </div>
                </div>

                {/* Marks Card Title */}
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <h2
                        style={{
                            fontSize: '22px',
                            fontWeight: '700',
                            color: '#1D1D1F',
                            margin: '0 0 8px 0',
                            textTransform: 'uppercase'
                        }}
                    >
                        MARKS CARD - {exam?.exam_type || exam?.exam_name || 'EXAM'}
                    </h2>
                    <p style={{ fontSize: '15px', color: '#86868B', margin: 0 }}>
                        Date: {exam?.exam_date ? new Date(exam.exam_date).toLocaleDateString() : 'N/A'}
                    </p>
                </div>

                {/* Student Info Grid */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'auto 1fr',
                        gap: '24px',
                        padding: '24px',
                        background: '#F8F9FA',
                        borderRadius: '16px',
                        marginBottom: '32px',
                        border: '1px solid #E5E7EB'
                    }}
                >
                    <div
                        style={{
                            width: '100px',
                            height: '100px',
                            borderRadius: '12px',
                            background: student?.photo_url
                                ? `url(${student.photo_url}) center/cover`
                                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontSize: '40px',
                            fontWeight: '700',
                        }}
                    >
                        {!student?.photo_url && student?.full_name?.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', alignItems: 'center', width: '100%' }}>
                        <div>
                            <p style={{ fontSize: '13px', color: '#86868B', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Student Name</p>
                            <p style={{ fontSize: '18px', fontWeight: '600', color: '#1D1D1F', margin: 0 }}>{student?.full_name}</p>
                        </div>
                        <div>
                            <p style={{ fontSize: '13px', color: '#86868B', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Registration ID</p>
                            <p style={{ fontSize: '18px', fontWeight: '600', color: '#1D1D1F', margin: 0 }}>{student?.registration_number}</p>
                        </div>
                        <div>
                            <p style={{ fontSize: '13px', color: '#86868B', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date of Birth</p>
                            <p style={{ fontSize: '18px', fontWeight: '600', color: '#1D1D1F', margin: 0 }}>
                                {student?.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : 'N/A'}
                            </p>
                        </div>
                        <div>
                            <p style={{ fontSize: '13px', color: '#86868B', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Class</p>
                            <p style={{ fontSize: '18px', fontWeight: '600', color: '#1D1D1F', margin: 0 }}>
                                {student?.classes?.class_name} {student?.classes?.section ? `- ${student.classes.section}` : ''}
                            </p>
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                            <p style={{ fontSize: '13px', color: '#86868B', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Parent/Guardian Name</p>
                            <p style={{ fontSize: '18px', fontWeight: '600', color: '#1D1D1F', margin: 0 }}>{student?.parent_name || 'N/A'}</p>
                        </div>
                    </div>
                </div>

                {/* Marks Table */}
                <div style={{ marginBottom: '32px', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#F8F9FA', borderBottom: '2px solid #E5E7EB' }}>
                                <th style={{ textAlign: 'left', padding: '16px', fontSize: '14px', fontWeight: '600', color: '#4B5563', textTransform: 'uppercase' }}>Subject</th>
                                <th style={{ textAlign: 'center', padding: '16px', fontSize: '14px', fontWeight: '600', color: '#4B5563', textTransform: 'uppercase' }}>Marks</th>
                                <th style={{ textAlign: 'center', padding: '16px', fontSize: '14px', fontWeight: '600', color: '#4B5563', textTransform: 'uppercase' }}>Max</th>
                                <th style={{ textAlign: 'center', padding: '16px', fontSize: '14px', fontWeight: '600', color: '#4B5563', textTransform: 'uppercase' }}>Avg</th>
                                <th style={{ textAlign: 'center', padding: '16px', fontSize: '14px', fontWeight: '600', color: '#4B5563', textTransform: 'uppercase' }}>Grade</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayedMarks.map((mark, index) => (
                                <tr key={mark.id} style={{ borderBottom: '1px solid #E5E7EB', background: index % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                                    <td style={{ padding: '16px', fontSize: '15px', color: '#1D1D1F', fontWeight: '500' }}>
                                        {mark.subject_name}
                                    </td>
                                    <td style={{ textAlign: 'center', padding: '16px', fontSize: '15px', fontWeight: isEditing ? 'normal' : '600', color: '#1D1D1F' }}>
                                        {isEditing ? (
                                            <input
                                                type="number"
                                                min="0"
                                                max={mark.max_marks}
                                                value={mark.marks_obtained}
                                                onChange={(e) => handleMarkChange(mark.id, e.target.value)}
                                                style={{
                                                    width: '60px',
                                                    padding: '8px',
                                                    textAlign: 'center',
                                                    border: '2px solid #0071E3',
                                                    borderRadius: '6px',
                                                    fontSize: '15px',
                                                    fontWeight: '600'
                                                }}
                                            />
                                        ) : (
                                            mark.marks_obtained
                                        )}
                                    </td>
                                    <td style={{ textAlign: 'center', padding: '16px', fontSize: '15px', color: '#6B7280' }}>
                                        {mark.max_marks}
                                    </td>
                                    <td style={{ textAlign: 'center', padding: '16px', fontSize: '15px', color: '#6B7280' }}>
                                        {mark.max_marks > 0 ? Math.round((mark.marks_obtained / mark.max_marks) * 100) : 0}%
                                    </td>
                                    <td style={{ textAlign: 'center', padding: '16px' }}>
                                        <span style={{
                                            display: 'inline-block',
                                            padding: '4px 12px',
                                            background: mark.grade.includes('A') ? '#DEF7EC' : mark.grade.includes('C') ? '#FDE8E8' : '#FEF08A',
                                            color: mark.grade.includes('A') ? '#03543F' : mark.grade.includes('C') ? '#9B1C1C' : '#723B13',
                                            borderRadius: '12px',
                                            fontSize: '14px',
                                            fontWeight: '700'
                                        }}>
                                            {mark.grade}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {/* Total Row */}
                            <tr style={{ background: '#F3F4F6', borderTop: '2px solid #D1D5DB' }}>
                                <td style={{ padding: '20px 16px', fontSize: '16px', fontWeight: '700', color: '#1F2937' }}>
                                    OVERALL PERFORMANCE
                                </td>
                                <td style={{ textAlign: 'center', padding: '20px 16px', fontSize: '20px', fontWeight: '800', color: '#0071E3' }}>
                                    {totalMarks}
                                </td>
                                <td style={{ textAlign: 'center', padding: '20px 16px', fontSize: '16px', fontWeight: '600', color: '#6B7280' }}>
                                    {totalMaxMarks}
                                </td>
                                <td style={{ textAlign: 'center', padding: '20px 16px', fontSize: '20px', fontWeight: '800', color: '#0071E3' }}>
                                    {percentage}%
                                </td>
                                <td style={{ textAlign: 'center', padding: '20px 16px' }}>
                                    <span style={{
                                        display: 'inline-block',
                                        padding: '4px 12px',
                                        background: finalGrade.includes('A') ? '#DEF7EC' : finalGrade.includes('C') ? '#FDE8E8' : '#FEF08A',
                                        color: finalGrade.includes('A') ? '#03543F' : finalGrade.includes('C') ? '#9B1C1C' : '#723B13',
                                        borderRadius: '12px',
                                        fontSize: '16px',
                                        fontWeight: '800'
                                    }}>
                                        {finalGrade}
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Footer Signatures */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '60px', padding: '0 20px' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ borderTop: '2px solid #1D1D1F', width: '200px', paddingTop: '12px' }}>
                            <p style={{ fontSize: '14px', fontWeight: '600', color: '#4B5563', margin: 0 }}>Class Teacher</p>
                        </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ borderTop: '2px solid #1D1D1F', width: '200px', paddingTop: '12px' }}>
                            <p style={{ fontSize: '14px', fontWeight: '600', color: '#4B5563', margin: 0 }}>Principal Signature</p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="no-print" style={{ display: 'flex', gap: '16px', marginTop: '60px' }}>
                    <button
                        onClick={onClose}
                        style={{
                            flex: 1,
                            padding: '16px',
                            background: '#F3F4F6',
                            color: '#374151',
                            border: '1px solid #D1D5DB',
                            borderRadius: '12px',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: 'pointer',
                        }}
                    >
                        Close
                    </button>
                    <button
                        onClick={handlePrint}
                        style={{
                            flex: 1,
                            padding: '16px',
                            background: '#0071E3',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                        }}
                    >
                        <Printer size={20} /> Print Marks Card
                    </button>
                </div>
            </div>

            {/* Print Styles */}
            <style>
                {`
          @media print {
            body * {
              visibility: hidden;
            }
            #marks-card-overlay,
            #marks-card-overlay * {
              visibility: visible;
            }
            .no-print,
            .no-print * {
              display: none !important;
            }
            #marks-card-overlay {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              height: auto !important;
              background: white !important;
              padding: 0 !important;
              display: block !important;
            }
            .marks-card-container {
              position: relative !important;
              margin: 0 !important;
              padding: 0 !important;
              box-shadow: none !important;
              width: 100% !important;
              max-width: none !important;
              border: none !important;
              max-height: none !important;
              height: auto !important;
              overflow: visible !important;
              transform: none !important;
            }
            body {
               -webkit-print-color-adjust: exact !important;
               print-color-adjust: exact !important;
            }
            @page {
               size: A4 portrait;
               margin: 10mm;
            }
          }
        `}
            </style>
        </div>
    );
}
