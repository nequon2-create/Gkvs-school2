import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UploadMarksModal } from '../components/marks/UploadMarksModal';
import { MarksCard } from '../components/marks/MarksCard';

const CLASS_COLORS = [
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
    photo_url?: string;
    classes?: { class_name: string };
    avgMarks: number;
}

export function MarksPage() {
    const [selectedClass, setSelectedClass] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedExam, setSelectedExam] = useState('');
    const [selectedFilterClass, setSelectedFilterClass] = useState('');
    const [students, setStudents] = useState<Student[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [academicYears, setAcademicYears] = useState<any[]>([]);
    const [showUpload, setShowUpload] = useState(false);
    const [selectedStudentForCard, setSelectedStudentForCard] = useState<string | null>(null);

    useEffect(() => {
        fetchClasses();
        fetchAcademicYears();
        fetchAllStudents();
    }, []);

    const fetchClasses = async () => {
        const { data } = await supabase
            .from('classes')
            .select('id, class_name, section, numeric_value')
            .order('numeric_value', { ascending: true });
        setClasses(data || []);
    };

    const fetchAcademicYears = async () => {
        const { data } = await supabase
            .from('academic_years')
            .select('id, year_name')
            .order('year_name', { ascending: false });
        setAcademicYears(data || []);
    };

    const fetchAllStudents = async () => {
        const { data: currentYear } = await supabase
            .from('academic_years')
            .select('id')
            .eq('is_current', true)
            .single();

        if (!currentYear) return;

        const { data } = await supabase
            .from('students')
            .select(`
        id,
        full_name,
        registration_number,
        photo_url,
        classes (class_name)
      `)
            .eq('academic_year_id', currentYear.id)
            .eq('is_active', true);

        // Calculate average marks for each student based on their latest exam
        const studentsWithAvg = await Promise.all(
            (data || []).map(async (student) => {
                // Get latest exam for this student
                const { data: latestMark } = await supabase
                    .from('marks')
                    .select('exam_id')
                    .eq('student_id', student.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                let avgMarks = 0;

                if (latestMark) {
                    const { data: marks } = await supabase
                        .from('marks')
                        .select('marks_obtained, max_marks')
                        .eq('student_id', student.id)
                        .eq('exam_id', latestMark.exam_id);

                    const total = marks?.reduce((sum, m) => sum + m.marks_obtained, 0) || 0;
                    const totalMax = marks?.reduce((sum, m) => sum + (m.max_marks || 100), 0) || 0;
                    avgMarks = totalMax > 0 ? Math.round((total / totalMax) * 100) : 0;
                }

                return {
                    ...student,
                    classes: Array.isArray(student.classes) ? student.classes[0] : student.classes,
                    avgMarks
                } as Student;
            })
        );

        setStudents(studentsWithAvg);
    };

    const handleClassClick = (classId: string) => {
        setSelectedClass(classId);
        // Filter students by class
    };

    const [resolvedExamId, setResolvedExamId] = useState<string | null>(null);

    const handleApplyFilter = async () => {
        let currentExamId = null;

        // Try to find the exact exam UUID based on selected filters
        if (selectedExam && selectedFilterClass && selectedYear) {
            const { data: examData } = await supabase
                .from('exams')
                .select('id')
                .eq('exam_type', selectedExam)
                .eq('class_id', selectedFilterClass)
                .eq('academic_year_id', selectedYear)
                .maybeSingle();

            if (examData) {
                currentExamId = examData.id;
            }
        }

        setResolvedExamId(currentExamId);

        // Fetch students with marks for selected exam
        let query = supabase.from('students').select(`
      id,
      full_name,
      registration_number,
      photo_url,
      classes (class_name)
    `);

        query = query.eq('is_active', true);

        if (selectedFilterClass) {
            query = query.eq('class_id', selectedFilterClass);
        }

        if (selectedYear) {
            query = query.eq('academic_year_id', selectedYear);
        }

        const { data: studentsData } = await query;

        // Fetch marks for selected exam
        if (currentExamId && studentsData) {
            const studentsWithMarks = await Promise.all(
                studentsData.map(async (student) => {
                    const { data: examMarks } = await supabase
                        .from('marks')
                        .select('marks_obtained, max_marks')
                        .eq('student_id', student.id)
                        .eq('exam_id', currentExamId);

                    const total = examMarks?.reduce((sum, m) => sum + m.marks_obtained, 0) || 0;
                    const totalMax = examMarks?.reduce((sum, m) => sum + (m.max_marks || 100), 0) || 0;
                    const avgMarks = totalMax > 0 ? Math.round((total / totalMax) * 100) : 0;

                    return {
                        ...student,
                        classes: Array.isArray(student.classes) ? student.classes[0] : student.classes,
                        avgMarks
                    } as Student;
                })
            );

            setStudents(studentsWithMarks);
        } else if (studentsData) {
            // If no exam is resolved, just show 0 avg marks mapped
            setStudents(
                studentsData.map(s => ({
                    ...s,
                    classes: Array.isArray(s.classes) ? s.classes[0] : s.classes,
                    avgMarks: 0
                } as Student))
            );
        }
    };

    const filteredStudents = students.filter(
        (s) =>
            s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.registration_number.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div style={{ padding: '32px' }}>
            {/* Top Bar */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '32px',
                }}
            >
                <input
                    type="text"
                    placeholder="🔍 Search by ID or Name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                        width: '400px',
                        height: '44px',
                        padding: '0 16px',
                        borderRadius: '10px',
                        border: '1px solid rgba(0,0,0,0.1)',
                        fontSize: '15px',
                    }}
                />
                <button
                    onClick={() => setShowUpload(true)}
                    style={{
                        padding: '12px 24px',
                        background: '#0071E3',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '980px',
                        fontSize: '15px',
                        fontWeight: '500',
                        cursor: 'pointer',
                    }}
                >
                    📤 Upload Marks
                </button>
            </div>

            {/* Class Cards */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, 1fr)',
                    gap: '16px',
                    marginBottom: '32px',
                }}
            >
                {(classes || []).map((cls, index) => {
                    const formatClassLabel = (name: string) => {
                        const num = parseInt(name);
                        if (isNaN(num)) return name;
                        if (num === 1) return '1st';
                        if (num === 2) return '2nd';
                        if (num === 3) return '3rd';
                        return `${num}th`;
                    };

                    return (
                        <div
                            key={cls.id}
                            onClick={() => handleClassClick(cls.id)}
                            style={{
                                background: CLASS_COLORS[index % CLASS_COLORS.length],
                                borderRadius: '16px',
                                padding: '32px 20px',
                                textAlign: 'center',
                                cursor: 'pointer',
                                transition: 'transform 0.2s',
                                border: selectedClass === cls.id ? '3px solid #0071E3' : 'none',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                        >
                            <div
                                style={{
                                    fontSize: '48px',
                                    fontWeight: '700',
                                    color: '#fff',
                                    marginBottom: '8px',
                                }}
                            >
                                {cls.class_name}
                            </div>
                            <div style={{ fontSize: '15px', fontWeight: '500', color: '#fff' }}>
                                {formatClassLabel(cls.class_name)} Class
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Filter Section */}
            <div
                style={{
                    background: '#fff',
                    border: '1px solid rgba(0,0,0,0.1)',
                    borderRadius: '18px',
                    padding: '24px',
                    marginBottom: '24px',
                }}
            >
                <h3 style={{ fontSize: '17px', fontWeight: '600', marginBottom: '16px' }}>
                    Filter Marks
                </h3>
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr auto',
                        gap: '16px',
                        alignItems: 'end',
                    }}
                >
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', color: '#86868B', marginBottom: '8px' }}>
                            Academic Year
                        </label>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            style={{
                                width: '100%',
                                height: '44px',
                                padding: '0 16px',
                                borderRadius: '10px',
                                border: '1px solid rgba(0,0,0,0.1)',
                            }}
                        >
                            <option value="">Select Year</option>
                            {academicYears.map((year) => (
                                <option key={year.id} value={year.id}>
                                    {year.year_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '13px', color: '#86868B', marginBottom: '8px' }}>
                            Exam Type
                        </label>
                        <select
                            value={selectedExam}
                            onChange={(e) => setSelectedExam(e.target.value)}
                            style={{
                                width: '100%',
                                height: '44px',
                                padding: '0 16px',
                                borderRadius: '10px',
                                border: '1px solid rgba(0,0,0,0.1)',
                            }}
                        >
                            <option value="">Select Exam</option>
                            <option value="FA1">FA1</option>
                            <option value="FA2">FA2</option>
                            <option value="FA3">FA3</option>
                            <option value="FA4">FA4</option>
                            <option value="SA1">SA1</option>
                            <option value="SA2">SA2</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '13px', color: '#86868B', marginBottom: '8px' }}>
                            Class
                        </label>
                        <select
                            value={selectedFilterClass}
                            onChange={(e) => setSelectedFilterClass(e.target.value)}
                            style={{
                                width: '100%',
                                height: '44px',
                                padding: '0 16px',
                                borderRadius: '10px',
                                border: '1px solid rgba(0,0,0,0.1)',
                            }}
                        >
                            <option value="">All Classes</option>
                            {classes.map((cls) => (
                                <option key={cls.id} value={cls.id}>
                                    {cls.class_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={handleApplyFilter}
                        style={{
                            height: '44px',
                            padding: '0 32px',
                            background: '#0071E3',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '15px',
                            fontWeight: '500',
                            cursor: 'pointer',
                        }}
                    >
                        Apply
                    </button>
                </div>
            </div>

            {/* Student List */}
            <div>
                <h3 style={{ fontSize: '21px', fontWeight: '600', marginBottom: '16px' }}>
                    Students ({filteredStudents.length})
                </h3>
                <div style={{ display: 'grid', gap: '12px' }}>
                    {filteredStudents.map((student) => (
                        <div
                            key={student.id}
                            onClick={() => setSelectedStudentForCard(student.id)}
                            style={{
                                background: '#fff',
                                border: '1px solid rgba(0,0,0,0.1)',
                                borderRadius: '12px',
                                padding: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px',
                                cursor: 'pointer',
                                transition: 'transform 0.2s',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                        >
                            <div
                                style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '50%',
                                    background: student.photo_url
                                        ? `url(${student.photo_url}) center/cover`
                                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#fff',
                                    fontSize: '20px',
                                    fontWeight: '700',
                                }}
                            >
                                {!student.photo_url && student.full_name.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '15px', fontWeight: '600', color: '#1D1D1F' }}>
                                    {student.full_name}
                                </div>
                                <div style={{ fontSize: '13px', color: '#86868B' }}>
                                    {student.registration_number} • {student.classes?.class_name}
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '24px', fontWeight: '700', color: '#0071E3' }}>
                                    {student.avgMarks}%
                                </div>
                                <div style={{ fontSize: '13px', color: '#86868B' }}>Avg Marks</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Upload Modal */}
            {showUpload && (
                <UploadMarksModal
                    onClose={() => setShowUpload(false)}
                    onSuccess={() => {
                        setShowUpload(false);
                        fetchAllStudents();
                    }}
                />
            )}

            {/* Marks Card Modal */}
            {selectedStudentForCard && (
                <MarksCard
                    studentId={selectedStudentForCard}
                    examId={resolvedExamId || selectedExam || ''}
                    onClose={() => setSelectedStudentForCard(null)}
                />
            )}
        </div>
    );
}
