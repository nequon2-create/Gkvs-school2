import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface ExamDetailsModalProps {
    examId: string;
    onClose: () => void;
    onUpdate: () => void;
}

interface ExamSchedule {
    subject_name: string;
    exam_date: string;
    exam_time: string;
}

export function ExamDetailsModal({ examId, onClose, onUpdate }: ExamDetailsModalProps) {
    const [exam, setExam] = useState<any>(null);
    const [schedules, setSchedules] = useState<ExamSchedule[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchExamDetails();
    }, [examId]);

    const fetchExamDetails = async () => {
        try {
            // Fetch exam timetable
            const { data: examData, error: examError } = await supabase
                .from('exam_timetables')
                .select(`
          *,
          classes (class_name, section)
        `)
                .eq('id', examId)
                .single();

            if (examError) throw examError;
            setExam(examData);

            // Fetch schedules
            const { data: schedulesData, error: schedulesError } = await supabase
                .from('exam_schedules')
                .select(`
          exam_date,
          exam_time,
          subjects (subject_name)
        `)
                .eq('exam_timetable_id', examId)
                .order('exam_date', { ascending: true });

            if (schedulesError) throw schedulesError;

            const formattedSchedules: ExamSchedule[] = (schedulesData || []).map((s: any) => ({
                subject_name: s.subjects?.subject_name || 'Unknown',
                exam_date: s.exam_date,
                exam_time: s.exam_time,
            }));

            setSchedules(formattedSchedules);
        } catch (err) {
            console.error('Error fetching exam details:', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this exam timetable?')) return;

        try {
            const { error } = await supabase
                .from('exam_timetables')
                .delete()
                .eq('id', examId);

            if (error) throw error;
            alert('Exam timetable deleted successfully');
            onUpdate();
            onClose();
        } catch (err) {
            console.error('Error deleting exam:', err);
            alert('Failed to delete exam timetable');
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
                <div style={{ color: '#fff', fontSize: '18px' }}>Loading...</div>
            </div>
        );
    }

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
                padding: '20px',
            }}
            onClick={onClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="exam-details-printable"
                style={{
                    background: '#fff',
                    borderRadius: '24px',
                    padding: '48px',
                    maxWidth: '800px',
                    width: '100%',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                }}
            >
                {/* Header with School Info */}
                <div
                    style={{
                        textAlign: 'center',
                        borderBottom: '3px solid #0071E3',
                        paddingBottom: '24px',
                        marginBottom: '32px',
                    }}
                >
                    <div
                        style={{
                            width: '80px',
                            height: '80px',
                            margin: '0 auto 16px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
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
                    <h1 style={{ margin: '0 0 4px 0', fontSize: '20px', color: '#1a202c' }}>
                        Grameen Krida vasati shale sharan sirasagi
                    </h1>
                    <p style={{ fontSize: '17px', color: '#86868B', margin: 0 }}>
                        Excellence in Education
                    </p>
                </div>

                {/* Exam Info */}
                <div
                    style={{
                        background: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)', // Brighter blue
                        borderRadius: '16px',
                        padding: '24px',
                        marginBottom: '32px',
                        color: '#ffffff', // Explicit white
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)',
                    }}
                >
                    <h2 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 8px 0', color: '#ffffff' }}>
                        {exam?.exam_name} - {exam?.exam_type}
                    </h2>
                    <p style={{ fontSize: '17px', margin: '0 0 4px 0', color: '#ffffff', opacity: 1 }}>
                        Class: {exam?.classes?.class_name}
                        {exam?.classes?.section && ` - ${exam.classes.section}`}
                    </p>
                    <p style={{ fontSize: '15px', margin: 0, color: '#ffffff', opacity: 1 }}>
                        Duration: {new Date(exam?.start_date).toLocaleDateString('en-GB')} -{' '}
                        {new Date(exam?.end_date).toLocaleDateString('en-GB')}
                    </p>
                </div>

                {/* Exam Schedule Table */}
                <div style={{ marginBottom: '40px' }}>
                    <h3
                        style={{
                            fontSize: '21px',
                            fontWeight: '600',
                            color: '#1D1D1F',
                            marginBottom: '16px',
                        }}
                    >
                        Exam Schedule
                    </h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#F5F5F7', borderBottom: '2px solid #DBDBDB' }}>
                                <th
                                    style={{
                                        textAlign: 'left',
                                        padding: '16px',
                                        fontSize: '15px',
                                        fontWeight: '600',
                                        color: '#1D1D1F',
                                    }}
                                >
                                    Subject
                                </th>
                                <th
                                    style={{
                                        textAlign: 'center',
                                        padding: '16px',
                                        fontSize: '15px',
                                        fontWeight: '600',
                                        color: '#1D1D1F',
                                    }}
                                >
                                    Date
                                </th>
                                <th
                                    style={{
                                        textAlign: 'center',
                                        padding: '16px',
                                        fontSize: '15px',
                                        fontWeight: '600',
                                        color: '#1D1D1F',
                                    }}
                                >
                                    Time
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {schedules.map((schedule, index) => (
                                <tr key={index} style={{ borderBottom: '1px solid #EFEFEF' }}>
                                    <td
                                        style={{
                                            padding: '16px',
                                            fontSize: '15px',
                                            color: '#1D1D1F',
                                        }}
                                    >
                                        {schedule.subject_name}
                                    </td>
                                    <td
                                        style={{
                                            textAlign: 'center',
                                            padding: '16px',
                                            fontSize: '15px',
                                            color: '#1D1D1F',
                                        }}
                                    >
                                        {new Date(schedule.exam_date).toLocaleDateString('en-GB', {
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric',
                                        })}
                                    </td>
                                    <td
                                        style={{
                                            textAlign: 'center',
                                            padding: '16px',
                                            fontSize: '15px',
                                            fontWeight: '600',
                                            color: '#0071E3',
                                        }}
                                    >
                                        {schedule.exam_time}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Principal Signature */}
                <div
                    style={{
                        borderTop: '2px solid #DBDBDB',
                        paddingTop: '32px',
                        marginBottom: '32px',
                    }}
                >
                    <p
                        style={{
                            fontSize: '13px',
                            color: '#86868B',
                            marginBottom: '12px',
                        }}
                    >
                        Principal Signature
                    </p>
                    <div
                        style={{
                            borderBottom: '2px solid #1D1D1F',
                            width: '250px',
                            height: '50px',
                        }}
                    />
                </div>

                {/* Action Buttons (hide in print) */}
                <div
                    className="no-print"
                    style={{ display: 'flex', gap: '12px' }}
                >
                    <button
                        onClick={onClose}
                        style={{
                            flex: 1,
                            padding: '14px',
                            background: 'rgba(0,0,0,0.03)',
                            border: '1px solid rgba(0,0,0,0.1)',
                            borderRadius: '12px',
                            fontSize: '15px',
                            fontWeight: '500',
                            cursor: 'pointer',
                        }}
                    >
                        Close
                    </button>
                    <button
                        onClick={handleDelete}
                        style={{
                            flex: 1,
                            padding: '14px',
                            background: '#FF453A',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '15px',
                            fontWeight: '500',
                            cursor: 'pointer',
                        }}
                    >
                        Delete
                    </button>
                    <button
                        onClick={handlePrint}
                        style={{
                            flex: 1,
                            padding: '14px',
                            background: '#0071E3',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '15px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                        }}
                    >
                        🖨️ Print
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
            .exam-details-printable,
            .exam-details-printable * {
              visibility: visible;
            }
            .exam-details-printable {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              border-radius: 0;
            }
            .no-print {
              display: none !important;
            }
          }
        `}
            </style>
        </div>
    );
}
