import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { BackButton } from '../components/common';

interface ClassItem {
    id: string;
    class_name: string;
    section: string | null;
    _count?: number;
}

export function StudentAttendancePage() {
    const navigate = useNavigate();
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('classes')
                .select('id, class_name, section')
                .order('class_name');
            if (error) throw error;

            // Fetch current academic year
            const { data: currentYear } = await supabase
                .from('academic_years')
                .select('id')
                .eq('is_current', true)
                .single();

            // Get student counts per class
            const classesWithCounts = await Promise.all(
                (data || []).map(async (cls) => {
                    const { count } = await supabase
                        .from('students')
                        .select('*', { count: 'exact', head: true })
                        .eq('class_id', cls.id)
                        .eq('academic_year_id', currentYear?.id)
                        .eq('is_active', true);
                    return { ...cls, _count: count || 0 };
                })
            );
            setClasses(classesWithCounts);
        } catch (err) {
            console.error('Error fetching classes:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '32px' }}>
            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
                <BackButton to="/attendance" />
                <h1 style={{ fontSize: '40px', fontWeight: '700', color: '#1D1D1F', margin: '8px 0 4px 0' }}>
                    Student Attendance
                </h1>
                <p style={{ fontSize: '15px', color: '#86868B', margin: 0 }}>
                    Select a class to view the monthly attendance sheet
                </p>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '80px', color: '#86868B' }}>Loading classes...</div>
            ) : classes.length === 0 ? (
                <div style={{
                    textAlign: 'center', padding: '80px',
                    background: '#fff', borderRadius: '18px',
                    border: '1px solid rgba(0,0,0,0.08)'
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📚</div>
                    <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#1D1D1F', marginBottom: '8px' }}>No Classes Found</h3>
                    <p style={{ color: '#86868B' }}>Create classes first to manage attendance</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                    {classes.map((cls) => (
                        <div
                            key={cls.id}
                            onClick={() => navigate(`/attendance/students/${cls.id}/sheet`)}
                            style={{
                                background: '#fff',
                                border: '1px solid rgba(0,0,0,0.08)',
                                borderRadius: '18px',
                                padding: '28px',
                                cursor: 'pointer',
                                transition: 'all 0.25s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '20px',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-3px)';
                                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)';
                                e.currentTarget.style.borderColor = '#0071E3';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                                e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)';
                            }}
                        >
                            {/* Class icon */}
                            <div style={{
                                width: '56px', height: '56px', borderRadius: '16px',
                                background: 'linear-gradient(135deg, #0071E3, #0055B3)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0,
                            }}>
                                <span style={{ fontSize: '24px', fontWeight: '800', color: '#fff' }}>
                                    {cls.class_name}
                                </span>
                            </div>

                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '18px', fontWeight: '700', color: '#1D1D1F' }}>
                                    Class {cls.class_name}{cls.section ? ` - ${cls.section}` : ''}
                                </div>
                                <div style={{ fontSize: '13px', color: '#86868B', marginTop: '4px' }}>
                                    {cls._count} students
                                </div>
                            </div>

                            <div style={{ fontSize: '13px', fontWeight: '600', color: '#0071E3', whiteSpace: 'nowrap' }}>
                                View Sheet →
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
