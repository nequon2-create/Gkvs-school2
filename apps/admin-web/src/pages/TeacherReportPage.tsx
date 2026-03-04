import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { BackButton } from '../components/common';
import { supabase } from '../lib/supabase';

interface Teacher {
    id: string;
    registration_number: string;
    full_name: string;
    email?: string;
    phone?: string;
    qualification?: string;
    designation?: string;
    date_of_birth?: string;
    address?: string;
    joining_date?: string;
    subjects?: string[];
}

export function TeacherReportPage() {
    const { id } = useParams<{ id: string }>();
    // const navigate = useNavigate(); // Unused
    const [teacher, setTeacher] = useState<Teacher | null>(null);
    const [attendancePercent, setAttendancePercent] = useState(0);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        classesTaught: 0,
    });

    useEffect(() => {
        if (id) {
            fetchData(id);
        }
    }, [id]);

    const fetchData = async (teacherId: string) => {
        try {
            // Fetch Teacher
            const { data: teacherData, error: teacherError } = await supabase
                .from('teachers')
                .select('*')
                .eq('id', teacherId)
                .single();

            if (teacherError) throw teacherError;
            setTeacher(teacherData);

            // Fetch Attendance
            const { data: attendanceData, error: attendanceError } = await supabase
                .from('teacher_attendance')
                .select('is_present')
                .eq('teacher_id', teacherId);

            if (!attendanceError && attendanceData) {
                const total = attendanceData.length;
                const present = attendanceData.filter(a => a.is_present === true).length;
                setAttendancePercent(total > 0 ? Math.round((present / total) * 100) : 0);
            }

            // Fetch Classes Stats
            const { count: classCount } = await supabase
                .from('classes')
                .select('*', { count: 'exact', head: true })
                .eq('class_teacher_id', teacherId);

            setStats({ classesTaught: classCount || 0 });

        } catch (err) {
            console.error('Error fetching teacher report data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) return <div>Loading Teacher Profile...</div>;
    if (!teacher) return <div>Teacher not found</div>;

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
                <BackButton to={`/teachers/${id}`} />
                <button onClick={handlePrint} style={{ background: '#FF9F43', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>Print Profile</button>
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
                    <p style={{ margin: '8px 0', color: '#666', fontSize: '14px' }}>Teacher Performance Report</p>
                    <h2 style={{ marginTop: '20px', fontSize: '22px', textDecoration: 'underline' }}>TEACHER PROFILE</h2>
                </div>

                {/* Teacher Details */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                    <div>
                        <p><strong>Name:</strong> {teacher.full_name}</p>
                        <p><strong>Designation:</strong> {teacher.designation || 'Teacher'}</p>
                        <p><strong>Qualification:</strong> {teacher.qualification || 'N/A'}</p>
                        <p><strong>Reg. No:</strong> {teacher.registration_number}</p>
                    </div>
                    <div>
                        <p><strong>Phone:</strong> {teacher.phone || 'N/A'}</p>
                        <p><strong>Email:</strong> {teacher.email || 'N/A'}</p>
                        <p><strong>DOB:</strong> {teacher.date_of_birth ? new Date(teacher.date_of_birth).toLocaleDateString() : 'N/A'}</p>
                        <p><strong>Joining Date:</strong> {teacher.joining_date ? new Date(teacher.joining_date).toLocaleDateString() : 'N/A'}</p>
                    </div>
                </div>

                {/* Address */}
                <div style={{ marginBottom: '30px' }}>
                    <p><strong>Address:</strong> {teacher.address || 'N/A'}</p>
                </div>

                {/* Professional Stats */}
                <div style={{ marginBottom: '30px', padding: '15px', border: '1px solid #ddd', background: '#fffcf5' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div><strong>Attendance Record:</strong> {attendancePercent}%</div>
                        <div><strong>Classes Assigned:</strong> {stats.classesTaught}</div>
                    </div>
                </div>

                {/* Subjects */}
                <div style={{ marginBottom: '40px' }}>
                    <h3 style={{ borderBottom: '1px solid #333', paddingBottom: '5px' }}>Subjects Handled</h3>
                    {teacher.subjects && teacher.subjects.length > 0 ? (
                        <ul style={{ marginTop: '10px' }}>
                            {teacher.subjects.map((sub, idx) => (
                                <li key={idx} style={{ marginBottom: '5px' }}>{sub}</li>
                            ))}
                        </ul>
                    ) : (
                        <p>No specific subjects recorded.</p>
                    )}
                </div>

                {/* Remarks/Notes Section */}
                <div style={{ marginBottom: '60px' }}>
                    <h3 style={{ borderBottom: '1px solid #333', paddingBottom: '5px' }}>Administrative Notes</h3>
                    <p style={{ height: '40px', borderBottom: '1px dotted #999', marginTop: '30px' }}></p>
                    <p style={{ height: '40px', borderBottom: '1px dotted #999' }}></p>
                    <p style={{ height: '40px', borderBottom: '1px dotted #999' }}></p>
                </div>

                {/* Signatures */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '100px' }}>
                    <div style={{ textAlign: 'center', width: '200px', borderTop: '1px solid #333', paddingTop: '10px' }}>
                        Principal / Admin Signature
                    </div>
                </div>

                <div style={{ marginTop: '50px', textAlign: 'center', fontSize: '12px', color: '#666' }}>
                    Generated on {new Date().toLocaleDateString()}
                </div>
            </div>
        </div>
    );
}
