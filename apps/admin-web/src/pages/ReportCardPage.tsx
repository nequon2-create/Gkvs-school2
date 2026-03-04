import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { BackButton } from '../components/common';
import { supabase } from '../lib/supabase';

interface Student {
    id: string;
    registration_number: string;
    full_name: string;
    date_of_birth?: string;
    parent_name?: string;
    roll_number?: string;
    classes?: {
        class_name: string;
        section: string | null;
    };
}

interface Mark {
    id: string;
    marks_obtained: number;
    grade: string;
    exams: {
        exam_name: string;
        total_marks: number;
        subject_id?: string;
    };
}

export function ReportCardPage() {
    const { id } = useParams<{ id: string }>();
    // const navigate = useNavigate(); // Unused
    // const navigate = useNavigate(); // Unused
    const [student, setStudent] = useState<Student | null>(null);
    const [marks, setMarks] = useState<Mark[]>([]);
    const [attendancePercent, setAttendancePercent] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchData(id);
        }
    }, [id]);

    const fetchData = async (studentId: string) => {
        try {
            // Fetch Student
            const { data: studentData, error: studentError } = await supabase
                .from('students')
                .select(`*, classes (class_name, section)`)
                .eq('id', studentId)
                .single();

            if (studentError) throw studentError;
            setStudent(studentData);

            // Fetch Marks
            const { data: marksData, error: marksError } = await supabase
                .from('marks')
                .select(`*, exams (exam_name, total_marks, subject_id)`)
                .eq('student_id', studentId);

            if (marksError) throw marksError;
            setMarks(marksData || []);

            // Fetch Attendance
            const { data: attendanceData, error: attendanceError } = await supabase
                .from('student_attendance')
                .select('is_present')
                .eq('student_id', studentId);

            if (attendanceError) throw attendanceError;

            const total = attendanceData?.length || 0;
            const present = attendanceData?.filter(a => a.is_present === true).length || 0;
            setAttendancePercent(total > 0 ? Math.round((present / total) * 100) : 0);

        } catch (err) {
            console.error('Error fetching report card data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) return <div>Loading Report Card...</div>;
    if (!student) return <div>Student not found</div>;

    return (
        <div className="report-card-container" style={{ padding: '20px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
            <style>
                {`
          @media print {
            body * {
              visibility: hidden;
            }
            .report-card, .report-card * {
              visibility: visible;
            }
            .report-card {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              margin: 0;
              padding: 20px;
              box-shadow: none;
              border: none;
            }
            .no-print {
              display: none !important;
            }
          }
        `}
            </style>

            {/* Action Bar */}
            <div className="no-print" style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                <BackButton to={`/students/${id}`} />
                <button onClick={handlePrint} style={{ background: '#007bff', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>Print Report Card</button>
            </div>

            {/* Report Card A4 Layout */}
            <div className="report-card" style={{
                background: 'white',
                width: '210mm',
                minHeight: '297mm',
                margin: '0 auto',
                padding: '40px',
                boxShadow: '0 0 10px rgba(0,0,0,0.1)',
                fontFamily: 'Times New Roman, serif'
            }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <h1 style={{ margin: '0', fontSize: '28px', textTransform: 'uppercase' }}>Grameen Krida vasati shale sharan sirasagi</h1>
                    <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '14px' }}>
                        Academic Performance Report</p>
                    <p style={{ margin: '5px 0', fontSize: '14px' }}>123 School Lane, City, State - 123456</p>
                    <h2 style={{ marginTop: '20px', fontSize: '22px', textDecoration: 'underline' }}>STUDENT PROGRESS REPORT</h2>
                </div>

                {/* Student Details */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                    <div>
                        <p><strong>Name:</strong> {student.full_name}</p>
                        <p><strong>Class:</strong> {student.classes?.class_name} {student.classes?.section}</p>
                        <p><strong>Roll No:</strong> {student.roll_number || 'N/A'}</p>
                    </div>
                    <div>
                        <p><strong>Reg. No:</strong> {student.registration_number}</p>
                        <p><strong>DOB:</strong> {student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : 'N/A'}</p>
                        <p><strong>Parent:</strong> {student.parent_name}</p>
                    </div>
                </div>

                {/* Attendance */}
                <div style={{ marginBottom: '30px', padding: '10px', border: '1px solid #ddd', background: '#f9f9f9' }}>
                    <strong>Overall Attendance:</strong> {attendancePercent}%
                </div>

                {/* Academic Performance */}
                <div style={{ marginBottom: '40px' }}>
                    <h3 style={{ borderBottom: '1px solid #333', paddingBottom: '5px' }}>Academic Performance</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                        <thead>
                            <tr style={{ background: '#eee' }}>
                                <th style={{ border: '1px solid #333', padding: '8px', textAlign: 'left' }}>Exam / Subject</th>
                                <th style={{ border: '1px solid #333', padding: '8px', textAlign: 'center' }}>Total Marks</th>
                                <th style={{ border: '1px solid #333', padding: '8px', textAlign: 'center' }}>Obtained</th>
                                <th style={{ border: '1px solid #333', padding: '8px', textAlign: 'center' }}>Grade</th>
                            </tr>
                        </thead>
                        <tbody>
                            {marks.map((mark) => (
                                <tr key={mark.id}>
                                    <td style={{ border: '1px solid #333', padding: '8px' }}>{mark.exams?.exam_name}</td>
                                    <td style={{ border: '1px solid #333', padding: '8px', textAlign: 'center' }}>{mark.exams?.total_marks}</td>
                                    <td style={{ border: '1px solid #333', padding: '8px', textAlign: 'center' }}>{mark.marks_obtained}</td>
                                    <td style={{ border: '1px solid #333', padding: '8px', textAlign: 'center' }}>{mark.grade}</td>
                                </tr>
                            ))}
                            {marks.length === 0 && (
                                <tr>
                                    <td colSpan={4} style={{ border: '1px solid #333', padding: '20px', textAlign: 'center' }}>No marks recorded yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Remarks */}
                <div style={{ marginBottom: '60px' }}>
                    <h3 style={{ borderBottom: '1px solid #333', paddingBottom: '5px' }}>Remarks</h3>
                    <p style={{ height: '40px', borderBottom: '1px dotted #999', marginTop: '30px' }}></p>
                    <p style={{ height: '40px', borderBottom: '1px dotted #999' }}></p>
                </div>

                {/* Signatures */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '100px' }}>
                    <div style={{ textAlign: 'center', width: '200px', borderTop: '1px solid #333', paddingTop: '10px' }}>
                        Class Teacher
                    </div>
                    <div style={{ textAlign: 'center', width: '200px', borderTop: '1px solid #333', paddingTop: '10px' }}>
                        Principal
                    </div>
                    <div style={{ textAlign: 'center', width: '200px', borderTop: '1px solid #333', paddingTop: '10px' }}>
                        Parent
                    </div>
                </div>

                <div style={{ marginTop: '50px', textAlign: 'center', fontSize: '12px', color: '#666' }}>
                    Generated on {new Date().toLocaleDateString()}
                </div>
            </div>
        </div>
    );
}
