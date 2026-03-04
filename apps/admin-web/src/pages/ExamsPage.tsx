import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CreateExamModal } from '../components/exams/CreateExamModal';
import { ExamDetailsModal } from '../components/exams/ExamDetailsModal';
import { DashboardLayout } from '../components/layouts/DashboardLayout';

interface ExamTimetable {
    id: string;
    exam_name: string;
    exam_type: string;
    start_date: string;
    end_date: string;
    classes?: {
        class_name: string;
        section: string | null;
    };
}

const EXAM_GRADIENTS = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
];

export function ExamsPage() {
    const [exams, setExams] = useState<ExamTimetable[]>([]);
    const [showCreate, setShowCreate] = useState(false);
    const [selectedExam, setSelectedExam] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchExams();
    }, []);

    const fetchExams = async () => {
        try {
            const { data, error } = await supabase
                .from('exam_timetables')
                .select(`
          id,
          exam_name,
          exam_type,
          start_date,
          end_date,
          classes (class_name, section)
        `)
                .eq('is_published', true)
                .gte('end_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]) // Last 30 days
                .order('start_date', { ascending: true });

            if (error) throw error;
            setExams(data || []);
        } catch (err) {
            console.error('Error fetching exams:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div style={{ padding: '32px' }}>
                {/* Header */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '40px',
                    }}
                >
                    <h1
                        style={{
                            fontSize: '40px',
                            fontWeight: '700',
                            color: '#1D1D1F',
                            margin: 0,
                        }}
                    >
                        Exam Timetables
                    </h1>
                    <button
                        onClick={() => setShowCreate(true)}
                        style={{
                            padding: '12px 24px',
                            background: '#0071E3',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '980px',
                            fontSize: '15px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(0,113,227,0.3)',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,113,227,0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,113,227,0.3)';
                        }}
                    >
                        + Create Exam
                    </button>
                </div>

                {/* Exam Cards Grid */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '80px 0', color: '#86868B' }}>
                        Loading exams...
                    </div>
                ) : exams.length === 0 ? (
                    <div
                        style={{
                            textAlign: 'center',
                            padding: '80px 0',
                            background: '#F5F5F7',
                            borderRadius: '18px',
                        }}
                    >
                        <div style={{ fontSize: '64px', marginBottom: '16px' }}>📅</div>
                        <h3 style={{ fontSize: '21px', fontWeight: '600', color: '#1D1D1F', marginBottom: '8px' }}>
                            No Exam Timetables Yet
                        </h3>
                        <p style={{ fontSize: '15px', color: '#86868B' }}>
                            Create your first exam timetable to get started
                        </p>
                    </div>
                ) : (
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                            gap: '24px',
                        }}
                    >
                        {exams.map((exam, index) => (
                            <div
                                key={exam.id}
                                onClick={() => setSelectedExam(exam.id)}
                                style={{
                                    background: EXAM_GRADIENTS[index % EXAM_GRADIENTS.length],
                                    borderRadius: '24px',
                                    padding: '32px',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    position: 'relative',
                                    overflow: 'hidden',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                                    e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.2)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                {/* Decorative Background Pattern */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: '-50px',
                                        right: '-50px',
                                        width: '150px',
                                        height: '150px',
                                        background: 'rgba(255,255,255,0.1)',
                                        borderRadius: '50%',
                                    }}
                                />
                                <div
                                    style={{
                                        position: 'absolute',
                                        bottom: '-30px',
                                        left: '-30px',
                                        width: '100px',
                                        height: '100px',
                                        background: 'rgba(255,255,255,0.1)',
                                        borderRadius: '50%',
                                    }}
                                />

                                {/* Content */}
                                <div style={{ position: 'relative', zIndex: 1 }}>
                                    <div
                                        style={{
                                            display: 'inline-block',
                                            padding: '6px 16px',
                                            background: 'rgba(255,255,255,0.25)',
                                            borderRadius: '20px',
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            color: '#fff',
                                            marginBottom: '16px',
                                            backdropFilter: 'blur(10px)',
                                        }}
                                    >
                                        {exam.exam_type}
                                    </div>

                                    <h3
                                        style={{
                                            fontSize: '28px',
                                            fontWeight: '700',
                                            color: '#fff',
                                            marginBottom: '8px',
                                            textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                        }}
                                    >
                                        {exam.exam_name}
                                    </h3>

                                    <p
                                        style={{
                                            fontSize: '17px',
                                            color: 'rgba(255,255,255,0.9)',
                                            marginBottom: '20px',
                                        }}
                                    >
                                        Class: {exam.classes?.class_name}
                                        {exam.classes?.section && ` - ${exam.classes.section}`}
                                    </p>

                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            fontSize: '15px',
                                            color: 'rgba(255,255,255,0.9)',
                                        }}
                                    >
                                        <span>📅</span>
                                        <span>
                                            {new Date(exam.start_date).toLocaleDateString('en-GB', {
                                                day: 'numeric',
                                                month: 'short',
                                            })}{' '}
                                            -{' '}
                                            {new Date(exam.end_date).toLocaleDateString('en-GB', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                            })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Create Exam Modal */}
                {showCreate && (
                    <CreateExamModal
                        onClose={() => setShowCreate(false)}
                        onSuccess={() => {
                            setShowCreate(false);
                            fetchExams();
                        }}
                    />
                )}

                {/* Exam Details Modal */}
                {selectedExam && (
                    <ExamDetailsModal
                        examId={selectedExam}
                        onClose={() => setSelectedExam(null)}
                        onUpdate={fetchExams}
                    />
                )}
            </div>
        </DashboardLayout>
    );
}
