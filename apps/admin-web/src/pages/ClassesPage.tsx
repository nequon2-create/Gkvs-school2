import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const CLASS_GRADIENTS = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ff9a56 0%, #ff6a88 100%)',
    'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',
    'linear-gradient(135deg, #f77062 0%, #fe5196 100%)',
];

interface Student {
    id: string;
    full_name: string;
    registration_number: string;
    roll_number?: string;
    photo_url?: string;
}

export function ClassesPage() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedClass, setSelectedClass] = useState<string | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [className, setClassName] = useState('');
    const [loading, setLoading] = useState(false);
    const [dbClasses, setDbClasses] = useState<any[]>([]);
    const [classCounts, setClassCounts] = useState<{ [key: string]: number }>({});

    useEffect(() => {
        fetchClassesAndCounts();
    }, []);

    const fetchClassesAndCounts = async () => {
        setLoading(true);
        try {
            // First get the current academic year
            const { data: currentYear } = await supabase
                .from('academic_years')
                .select('id')
                .eq('is_current', true)
                .single();

            if (!currentYear) return;

            // Fetch all active classes
            const { data: classesData } = await supabase
                .from('classes')
                .select('id, class_name, section, numeric_value')
                .eq('is_active', true)
                .order('numeric_value', { ascending: true });

            if (classesData) {
                setDbClasses(classesData);

                const counts: { [key: string]: number } = {};
                for (const cls of classesData) {
                    const { count } = await supabase
                        .from('students')
                        .select('*', { count: 'exact', head: true })
                        .eq('class_id', cls.id)
                        .eq('academic_year_id', currentYear.id)
                        .eq('is_active', true);
                    counts[cls.id] = count || 0;
                }
                setClassCounts(counts);
            }
        } catch (err) {
            console.error('Error fetching classes:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setLoading(true);
        try {
            const { data } = await supabase
                .from('students')
                .select('id')
                .eq('registration_number', searchQuery.trim())
                .single();

            if (data) {
                navigate(`/students/${data.id}`);
            } else {
                alert('Student not found');
            }
        } catch (err) {
            alert('Student not found');
        } finally {
            setLoading(false);
        }
    };

    const handleClassClick = async (classId: string, classNameStr: string, section?: string | null) => {
        setLoading(true);
        try {
            setSelectedClass(classId);
            setClassName(
                `Class ${classNameStr}${section ? ` - ${section}` : ''}`
            );

            const { data: currentYear } = await supabase
                .from('academic_years')
                .select('id')
                .eq('is_current', true)
                .single();

            if (!currentYear) return;

            const { data: studentsData } = await supabase
                .from('students')
                .select('id, full_name, registration_number, roll_number, photo_url')
                .eq('class_id', classId)
                .eq('academic_year_id', currentYear.id)
                .eq('is_active', true)
                .order('full_name');

            setStudents(studentsData || []);
        } catch (err) {
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatClassLabel = (name: string) => {
        const num = parseInt(name);
        if (isNaN(num)) return name; // LKG, UKG, etc.
        if (num === 1) return '1st';
        if (num === 2) return '2nd';
        if (num === 3) return '3rd';
        return `${num}th`;
    };

    // Class List View
    if (selectedClass) {
        return (
            <div style={{ padding: '32px' }}>
                <button
                    onClick={() => setSelectedClass(null)}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#0071E3',
                        fontSize: '17px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        marginBottom: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                    }}
                >
                    ← Back to All Classes
                </button>

                <h1 style={{ fontSize: '40px', fontWeight: '700', color: '#1D1D1F', marginBottom: '8px' }}>
                    {className}
                </h1>
                <p style={{ fontSize: '17px', color: '#86868B', marginBottom: '32px' }}>
                    {students.length} students
                </p>

                <div style={{ display: 'grid', gap: '16px' }}>
                    {students.map((student) => (
                        <div
                            key={student.id}
                            onClick={() => navigate(`/students/${student.id}`)}
                            style={{
                                background: '#fff',
                                border: '1px solid rgba(0,0,0,0.1)',
                                borderRadius: '16px',
                                padding: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '20px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <div
                                style={{
                                    width: '56px',
                                    height: '56px',
                                    borderRadius: '50%',
                                    background: student.photo_url
                                        ? `url(${student.photo_url}) center/cover`
                                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#fff',
                                    fontSize: '24px',
                                    fontWeight: '700',
                                    border: '3px solid rgba(0,0,0,0.05)',
                                }}
                            >
                                {!student.photo_url && student.full_name.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '17px', fontWeight: '600', color: '#1D1D1F', marginBottom: '4px' }}>
                                    {student.full_name}
                                </div>
                                <div style={{ fontSize: '15px', color: '#86868B', display: 'flex', gap: '12px' }}>
                                    {student.roll_number && <span>Roll: {student.roll_number}</span>}
                                    {student.registration_number && <span>Reg: {student.registration_number}</span>}
                                </div>
                            </div>
                            <div style={{ fontSize: '20px', color: '#0071E3' }}>→</div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Main Classes Grid View
    return (
        <div style={{ padding: '32px' }}>
            <h1 style={{ fontSize: '40px', fontWeight: '700', color: '#1D1D1F', marginBottom: '32px' }}>
                All Classes
            </h1>

            {/* BIG SEARCH BAR */}
            <div style={{ marginBottom: '48px' }}>
                <div
                    style={{
                        maxWidth: '800px',
                        margin: '0 auto',
                        position: 'relative',
                    }}
                >
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="🔍 Search student by Registration Number..."
                        style={{
                            width: '100%',
                            height: '64px',
                            padding: '0 72px 0 24px',
                            fontSize: '18px',
                            border: '2px solid rgba(0,0,0,0.1)',
                            borderRadius: '16px',
                            background: '#fff',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                            transition: 'all 0.2s',
                        }}
                        onFocus={(e) => {
                            e.currentTarget.style.borderColor = '#0071E3';
                            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,113,227,0.2)';
                        }}
                        onBlur={(e) => {
                            e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)';
                            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
                        }}
                    />
                    <button
                        onClick={handleSearch}
                        disabled={loading}
                        style={{
                            position: 'absolute',
                            right: '8px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: '48px',
                            height: '48px',
                            background: loading ? '#86868B' : '#0071E3',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '20px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        {loading ? '...' : '→'}
                    </button>
                </div>
            </div>

            {/* CLASS CARDS GRID */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, 1fr)',
                    gap: '24px',
                    maxWidth: '1400px',
                    margin: '0 auto',
                }}
            >
                {dbClasses.map((cls, index) => (
                    <div
                        key={cls.id}
                        onClick={() => handleClassClick(cls.id, cls.class_name, cls.section)}
                        style={{
                            background: CLASS_GRADIENTS[index % CLASS_GRADIENTS.length],
                            borderRadius: '24px',
                            padding: '40px 24px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            position: 'relative',
                            overflow: 'hidden',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-8px) scale(1.05)';
                            e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.2)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0) scale(1)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        <div
                            style={{
                                position: 'absolute',
                                top: '-30px',
                                right: '-30px',
                                width: '100px',
                                height: '100px',
                                background: 'rgba(255,255,255,0.1)',
                                borderRadius: '50%',
                            }}
                        />
                        <div
                            style={{
                                fontSize: '64px',
                                fontWeight: '800',
                                color: '#fff',
                                marginBottom: '16px',
                                textShadow: '0 4px 8px rgba(0,0,0,0.2)',
                            }}
                        >
                            {cls.class_name}
                        </div>
                        <div
                            style={{
                                fontSize: '13px',
                                fontWeight: '600',
                                color: 'rgba(255,255,255,0.9)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                marginBottom: '12px',
                            }}
                        >
                            {formatClassLabel(cls.class_name)} Class
                        </div>
                        <div
                            style={{
                                display: 'inline-block',
                                padding: '8px 16px',
                                background: 'rgba(255,255,255,0.25)',
                                borderRadius: '20px',
                                fontSize: '15px',
                                fontWeight: '600',
                                color: '#fff',
                                backdropFilter: 'blur(10px)',
                            }}
                        >
                            👥 {classCounts[cls.id] || 0} Students
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
