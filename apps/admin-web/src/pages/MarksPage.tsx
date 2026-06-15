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

    // Spreadsheet Workspace States
    const [workspaceYear, setWorkspaceYear] = useState('');
    const [workspaceExam, setWorkspaceExam] = useState('');
    const [customExamName, setCustomExamName] = useState('');
    const [isCustomExam, setIsCustomExam] = useState(false);
    const [workspaceStudents, setWorkspaceStudents] = useState<any[]>([]);
    const [gridMarks, setGridMarks] = useState<Record<string, Record<string, { id?: string; obtained: string }>>>({});
    const [gridRemarks, setGridRemarks] = useState<Record<string, string>>({});
    const [workspaceMaxMarksMap, setWorkspaceMaxMarksMap] = useState<Record<string, number>>({});
    const [workspaceSubjects, setWorkspaceSubjects] = useState<any[]>([]);
    const [selectedWorkspaceSubjectIds, setSelectedWorkspaceSubjectIds] = useState<string[]>([]);
    const [globalMaxMarks, setGlobalMaxMarks] = useState<string>('100');
    const [isSheetGenerated, setIsSheetGenerated] = useState(false);
    const [workspaceExams, setWorkspaceExams] = useState<any[]>([]);
    const [loadingWorkspace, setLoadingWorkspace] = useState(false);
    const [savingWorkspace, setSavingWorkspace] = useState(false);

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
            .select('id, year_name, is_current')
            .order('year_name', { ascending: false });
        setAcademicYears(data || []);
        
        // Default to current year in workspace
        const current = data?.find(y => y.is_current);
        if (current) {
            setWorkspaceYear(current.id);
            setSelectedYear(current.id);
        } else if (data && data.length > 0) {
            setWorkspaceYear(data[0].id);
            setSelectedYear(data[0].id);
        }
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
        setIsSheetGenerated(false);
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

    // Workspace Helper Functions
    const fetchWorkspaceSubjects = async (classId: string) => {
        const { data } = await supabase
            .from('subjects')
            .select('id, subject_name, subject_code, class_id')
            .or(`class_id.eq.${classId},class_id.is.null`)
            .order('subject_name');
        
        if (data) {
            // Sort to prioritize class-specific subjects over global fallbacks
            const sorted = [...data].sort((a: any, b: any) => {
                if (a.class_id && !b.class_id) return -1;
                if (!a.class_id && b.class_id) return 1;
                return 0;
            });

            // Deduplicate by name
            const unique: any[] = [];
            const seen = new Set();
            for (const item of sorted) {
                const nameKey = item.subject_name.trim().toLowerCase();
                if (!seen.has(nameKey)) {
                    seen.add(nameKey);
                    unique.push(item);
                }
            }

            setWorkspaceSubjects(unique);
        } else {
            setWorkspaceSubjects([]);
        }
    };

    const fetchWorkspaceExams = async (classId: string, yearId: string) => {
        const { data } = await supabase
            .from('exams')
            .select('id, exam_name, exam_type, is_published')
            .eq('class_id', classId)
            .eq('academic_year_id', yearId);
        setWorkspaceExams(data || []);
    };

    const fetchWorkspaceStudents = async (classId: string, yearId: string) => {
        const { data: studentsData } = await supabase
            .from('students')
            .select('id, full_name, registration_number, roll_number')
            .eq('class_id', classId)
            .eq('academic_year_id', yearId)
            .eq('is_active', true)
            .order('roll_number', { ascending: true })
            .order('full_name', { ascending: true });
        setWorkspaceStudents(studentsData || []);
    };

    const fetchExistingMarks = async (examId: string) => {
        const { data, error } = await supabase
            .from('marks')
            .select('id, student_id, subject_id, marks_obtained, max_marks, remarks')
            .eq('exam_id', examId);
        
        if (error) {
            console.error('Error fetching existing marks:', error);
            return;
        }

        const marksMap: Record<string, Record<string, { id?: string; obtained: string }>> = {};
        const maxMarksMap: Record<string, number> = {};
        const remarksMap: Record<string, string> = {};

        // Default max marks for all class subjects
        workspaceSubjects.forEach(sub => {
            maxMarksMap[sub.id] = 100;
        });

        if (data && data.length > 0) {
            data.forEach(m => {
                if (!marksMap[m.student_id]) {
                    marksMap[m.student_id] = {};
                }
                marksMap[m.student_id][m.subject_id] = {
                    id: m.id,
                    obtained: String(m.marks_obtained)
                };
                maxMarksMap[m.subject_id] = m.max_marks || 100;
                if (m.remarks) {
                    remarksMap[m.student_id] = m.remarks;
                }
            });
        }
        setGridMarks(marksMap);
        setWorkspaceMaxMarksMap(maxMarksMap);
        setGridRemarks(remarksMap);
    };

    // Workspace Data loading Effect
    useEffect(() => {
        if (!selectedClass || !workspaceYear) return;

        const loadWorkspaceData = async () => {
            setLoadingWorkspace(true);
            try {
                await Promise.all([
                    fetchWorkspaceSubjects(selectedClass),
                    fetchWorkspaceStudents(selectedClass, workspaceYear),
                    fetchWorkspaceExams(selectedClass, workspaceYear)
                ]);
            } catch (err) {
                console.error('Error loading workspace data:', err);
            } finally {
                setLoadingWorkspace(false);
            }
        };

        loadWorkspaceData();
    }, [selectedClass, workspaceYear]);

    // Auto-select all subjects by default when they are loaded
    useEffect(() => {
        if (workspaceSubjects.length > 0) {
            setSelectedWorkspaceSubjectIds(workspaceSubjects.map(s => s.id));
        } else {
            setSelectedWorkspaceSubjectIds([]);
        }
    }, [workspaceSubjects]);

    // Workspace Marks fetching Effect
    useEffect(() => {
        if (!selectedClass || !workspaceYear || !isSheetGenerated || workspaceSubjects.length === 0) {
            setGridMarks({});
            setGridRemarks({});
            return;
        }

        const examName = isCustomExam ? customExamName.trim() : workspaceExam;
        if (!examName) {
            setGridMarks({});
            setGridRemarks({});
            return;
        }

        let resolvedExamId = '';
        const existing = workspaceExams.find(e => e.id === examName || e.exam_name === examName);
        if (existing) {
            resolvedExamId = existing.id;
        }

        if (resolvedExamId) {
            fetchExistingMarks(resolvedExamId);
        } else {
            setGridMarks({});
            setGridRemarks({});
            const defaults: Record<string, number> = {};
            workspaceSubjects.forEach(s => {
                defaults[s.id] = 100;
            });
            setWorkspaceMaxMarksMap(defaults);
        }
    }, [isSheetGenerated, workspaceExam, workspaceExams, workspaceSubjects, isCustomExam, customExamName, workspaceYear, selectedClass]);

    // Validation & Helpers for grid
    const isMarkInvalid = (obtainedStr: string, maxMarks: number): boolean => {
        if (obtainedStr === '') return false;
        const obtained = parseFloat(obtainedStr);
        return isNaN(obtained) || obtained < 0 || obtained > maxMarks;
    };

    const getRowGrade = (obtainedStr: string, maxMarks: number): string => {
        const obtained = parseFloat(obtainedStr);
        if (isNaN(obtained) || maxMarks <= 0) return '-';
        const percentage = (obtained / maxMarks) * 100;
        if (percentage >= 90) return 'A+';
        if (percentage >= 70) return 'A';
        if (percentage >= 50) return 'B+';
        if (percentage >= 30) return 'B';
        return 'C';
    };

    const handleMarkChange = (studentId: string, subjectId: string, value: string) => {
        const cleaned = value.replace(/[^0-9.]/g, '');
        setGridMarks(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                [subjectId]: {
                    ...prev[studentId]?.[subjectId],
                    obtained: cleaned
                }
            }
        }));
    };

    const handleRemarksChange = (studentId: string, value: string) => {
        setGridRemarks(prev => ({
            ...prev,
            [studentId]: value
        }));
    };

    const handleMaxMarksChange = (subjectId: string, value: number) => {
        setWorkspaceMaxMarksMap(prev => ({
            ...prev,
            [subjectId]: value
        }));
    };

    const handleApplyGlobalMaxMarks = () => {
        const parsed = parseInt(globalMaxMarks);
        if (isNaN(parsed) || parsed <= 0) {
            alert('Please enter a valid positive number for Max Marks.');
            return;
        }

        const updatedMaxMap = { ...workspaceMaxMarksMap };
        selectedWorkspaceSubjectIds.forEach(subId => {
            updatedMaxMap[subId] = parsed;
        });
        setWorkspaceMaxMarksMap(updatedMaxMap);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, sIdx: number, subIdx: number) => {
        if (e.key === 'ArrowDown' || e.key === 'Enter') {
            e.preventDefault();
            const nextInput = document.getElementById(`mark-input-${sIdx + 1}-${subIdx}`) as HTMLInputElement;
            if (nextInput) {
                nextInput.focus();
                nextInput.select();
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prevInput = document.getElementById(`mark-input-${sIdx - 1}-${subIdx}`) as HTMLInputElement;
            if (prevInput) {
                prevInput.focus();
                prevInput.select();
            }
        }
    };

    // Save/Publish marks handler
    const handleSaveWorkspace = async (publish: boolean) => {
        if (!selectedClass || !workspaceYear) {
            alert('Please select class and academic year.');
            return;
        }

        let finalExamName = '';
        if (isCustomExam) {
            if (!customExamName.trim()) {
                alert('Please enter a custom exam name.');
                return;
            }
            finalExamName = customExamName.trim();
        } else {
            if (!workspaceExam) {
                alert('Please select or enter an exam.');
                return;
            }
            finalExamName = workspaceExam;
        }

        const visibleSubjects = workspaceSubjects.filter(sub => selectedWorkspaceSubjectIds.includes(sub.id));

        const invalidMaxMarks = [];
        for (const subject of visibleSubjects) {
            const maxVal = workspaceMaxMarksMap[subject.id];
            if (maxVal === undefined || isNaN(maxVal) || maxVal <= 0) {
                invalidMaxMarks.push(subject.subject_name);
            }
        }
        if (invalidMaxMarks.length > 0) {
            alert(`Max marks must be greater than 0 for: ${invalidMaxMarks.join(', ')}`);
            return;
        }

        const invalidMarks = [];
        for (const student of workspaceStudents) {
            for (const subject of visibleSubjects) {
                const markObj = gridMarks[student.id]?.[subject.id];
                const maxMarks = workspaceMaxMarksMap[subject.id] || 100;
                if (markObj && markObj.obtained !== '') {
                    const num = parseFloat(markObj.obtained);
                    if (isNaN(num) || num < 0 || num > maxMarks) {
                        invalidMarks.push(`${student.full_name} (${subject.subject_name})`);
                    }
                }
            }
        }

        if (invalidMarks.length > 0) {
            alert(`Invalid marks entered (must be between 0 and Max Marks):\n${invalidMarks.slice(0, 10).join('\n')}${invalidMarks.length > 10 ? '\n...and others' : ''}`);
            return;
        }

        setSavingWorkspace(true);

        try {
            let examId = '';
            const existingExam = workspaceExams.find(e => e.id === workspaceExam || e.exam_name === finalExamName);

            if (existingExam) {
                examId = existingExam.id;
                if (existingExam.is_published !== publish) {
                    await supabase
                        .from('exams')
                        .update({ is_published: publish })
                        .eq('id', examId);
                }
            } else {
                const { data: newExam, error: examErr } = await supabase
                    .from('exams')
                    .insert({
                        exam_name: finalExamName,
                        exam_type: finalExamName,
                        class_id: selectedClass,
                        academic_year_id: workspaceYear,
                        exam_date: new Date().toISOString().split('T')[0],
                        is_published: publish
                    })
                    .select()
                    .single();

                if (examErr) throw examErr;
                examId = newExam.id;
            }

            // Delete existing marks for these students, this exam, and visible subjects to allow clearing entries
            const studentIds = workspaceStudents.map(s => s.id);
            const visibleSubjectIds = visibleSubjects.map(s => s.id);
            if (studentIds.length > 0 && visibleSubjectIds.length > 0) {
                const { error: deleteErr } = await supabase
                    .from('marks')
                    .delete()
                    .eq('exam_id', examId)
                    .in('student_id', studentIds)
                    .in('subject_id', visibleSubjectIds);

                if (deleteErr) throw deleteErr;
            }

            // Prepare marks records to upsert
            const recordsToUpsert = [];
            for (const student of workspaceStudents) {
                const studentMarks = gridMarks[student.id] || {};
                const studentRemarks = gridRemarks[student.id] || null;
                for (const subject of visibleSubjects) {
                    const markObj = studentMarks[subject.id];
                    const maxMarks = workspaceMaxMarksMap[subject.id] || 100;
                    if (markObj && markObj.obtained !== '') {
                        const marksObtained = parseFloat(markObj.obtained);
                        recordsToUpsert.push({
                            student_id: student.id,
                            exam_id: examId,
                            subject_id: subject.id,
                            marks_obtained: marksObtained,
                            max_marks: maxMarks,
                            remarks: studentRemarks
                        });
                    }
                }
            }

            if (recordsToUpsert.length > 0) {
                const { error: upsertErr } = await supabase
                    .from('marks')
                    .upsert(recordsToUpsert, { onConflict: 'student_id,exam_id,subject_id' });
                
                if (upsertErr) throw upsertErr;
            }

            alert(publish ? 'Marks successfully published!' : 'Marks draft saved successfully!');

            await fetchWorkspaceExams(selectedClass, workspaceYear);
            if (!existingExam) {
                setWorkspaceExam(examId);
            }

        } catch (err) {
            console.error('Error saving marks:', err);
            alert('Failed to save marks.');
        } finally {
            setSavingWorkspace(false);
        }
    };
    const renderSpreadsheetWorkspace = () => {
        const activeClassObj = classes.find(c => c.id === selectedClass);
        const className = activeClassObj ? `${activeClassObj.class_name} Class` : 'Selected Class';
        const visibleSubjects = workspaceSubjects.filter(sub => selectedWorkspaceSubjectIds.includes(sub.id));

        // Graded count matches students who have at least one subject mark entered
        const gradedCount = workspaceStudents.filter(student => {
            const studentMarks = gridMarks[student.id];
            if (!studentMarks) return false;
            return Object.values(studentMarks).some(m => m.obtained !== '');
        }).length;
        const totalCount = workspaceStudents.length;

        return (
            <div className="workspace-container" style={{ padding: '32px', background: '#F5F5F7', minHeight: '100vh', borderRadius: '24px' }}>
                <div style={{ marginBottom: '24px' }}>
                    <button
                        onClick={() => setSelectedClass(null)}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#0071E3',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: 0
                        }}
                    >
                        <span>←</span> Back to Classes
                    </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1D1D1F', margin: '0 0 4px 0' }}>
                            📝 Gradebook Grid - {className}
                        </h1>
                        <p style={{ fontSize: '15px', color: '#86868B', margin: 0 }}>
                            Enter and publish marks directly for this class.
                        </p>
                    </div>
                </div>

                <div
                    style={{
                        background: '#fff',
                        border: '1px solid rgba(0,0,0,0.08)',
                        borderRadius: '20px',
                        padding: '24px',
                        marginBottom: '32px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
                    }}
                >
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '20px',
                            alignItems: 'end'
                        }}
                    >
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', color: '#86868B', marginBottom: '8px', fontWeight: '500' }}>
                                Academic Year
                            </label>
                            <select
                                value={workspaceYear}
                                onChange={(e) => {
                                    setWorkspaceYear(e.target.value);
                                    setIsSheetGenerated(false);
                                }}
                                style={{
                                    width: '100%',
                                    height: '44px',
                                    padding: '0 12px',
                                    borderRadius: '10px',
                                    border: '1px solid rgba(0,0,0,0.15)',
                                    fontSize: '15px',
                                    background: '#fff'
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
                            <label style={{ display: 'block', fontSize: '13px', color: '#86868B', marginBottom: '8px', fontWeight: '500' }}>
                                Exam Name
                            </label>
                            {!isCustomExam ? (
                                <select
                                    value={workspaceExam}
                                    onChange={(e) => {
                                        setIsSheetGenerated(false);
                                        if (e.target.value === 'CUSTOM') {
                                            setIsCustomExam(true);
                                            setWorkspaceExam('');
                                        } else {
                                            setWorkspaceExam(e.target.value);
                                            setIsCustomExam(false);
                                        }
                                    }}
                                    style={{
                                        width: '100%',
                                        height: '44px',
                                        padding: '0 12px',
                                        borderRadius: '10px',
                                        border: '1px solid rgba(0,0,0,0.15)',
                                        fontSize: '15px',
                                        background: '#fff'
                                    }}
                                >
                                    <option value="">Select Exam</option>
                                    {workspaceExams.filter((ex) => !ex.is_published).map((ex) => (
                                        <option key={ex.id} value={ex.id}>
                                            {ex.exam_name} (Draft)
                                        </option>
                                    ))}
                                    {['F1', 'F2', 'F3', 'F4', 'S1', 'S2', 'FA1', 'FA2', 'FA3', 'FA4', 'SA1', 'SA2'].map((name) => {
                                        const exists = workspaceExams.some(
                                            (e) =>
                                                e.exam_name.trim().toUpperCase() === name ||
                                                (e.exam_type && e.exam_type.trim().toUpperCase() === name)
                                        );
                                        if (exists) return null;
                                        return (
                                            <option key={name} value={name}>
                                                {name}
                                            </option>
                                        );
                                    })}
                                    <option value="CUSTOM">+ Create Custom Exam...</option>
                                </select>
                            ) : (
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%' }}>
                                    <input
                                        type="text"
                                        placeholder="Enter Custom Exam Name..."
                                        value={customExamName}
                                        onChange={(e) => {
                                            setCustomExamName(e.target.value);
                                            setIsSheetGenerated(false);
                                        }}
                                        style={{
                                            flex: 1,
                                            height: '44px',
                                            padding: '0 12px',
                                            borderRadius: '10px',
                                            border: '1px solid rgba(0,0,0,0.15)',
                                            fontSize: '15px'
                                        }}
                                    />
                                    <button
                                        onClick={() => {
                                            setIsCustomExam(false);
                                            setCustomExamName('');
                                            setIsSheetGenerated(false);
                                        }}
                                        style={{
                                            height: '44px',
                                            padding: '0 12px',
                                            background: '#E5E7EB',
                                            border: 'none',
                                            borderRadius: '10px',
                                            cursor: 'pointer',
                                            fontSize: '13px',
                                            color: '#1D1D1F'
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>

                        {!isSheetGenerated ? (
                            <div>
                                <button
                                    onClick={() => {
                                        const examName = isCustomExam ? customExamName.trim() : workspaceExam;
                                        if (!workspaceYear || !examName) {
                                            alert('Please select Academic Year and Exam Name.');
                                            return;
                                        }
                                        setIsSheetGenerated(true);
                                    }}
                                    disabled={isCustomExam ? !customExamName.trim() : !workspaceExam}
                                    style={{
                                        width: '100%',
                                        height: '44px',
                                        background: (isCustomExam ? customExamName.trim() : workspaceExam) ? '#0071E3' : '#E5E7EB',
                                        color: (isCustomExam ? customExamName.trim() : workspaceExam) ? '#fff' : '#86868B',
                                        border: 'none',
                                        borderRadius: '10px',
                                        cursor: (isCustomExam ? customExamName.trim() : workspaceExam) ? 'pointer' : 'not-allowed',
                                        fontSize: '15px',
                                        fontWeight: '600'
                                    }}
                                >
                                    ⚡ Generate Sheet
                                </button>
                            </div>
                        ) : (
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', color: '#86868B', marginBottom: '8px', fontWeight: '500' }}>
                                    One-Time Max Marks (All Subjects)
                                </label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                        type="text"
                                        placeholder="100"
                                        value={globalMaxMarks}
                                        onChange={(e) => setGlobalMaxMarks(e.target.value.replace(/[^0-9]/g, ''))}
                                        style={{
                                            flex: 1,
                                            height: '44px',
                                            padding: '0 12px',
                                            borderRadius: '10px',
                                            border: '1px solid rgba(0,0,0,0.15)',
                                            fontSize: '15px',
                                            textAlign: 'center'
                                        }}
                                    />
                                    <button
                                        onClick={handleApplyGlobalMaxMarks}
                                        style={{
                                            height: '44px',
                                            padding: '0 16px',
                                            background: '#0071E3',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '10px',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            fontWeight: '600'
                                        }}
                                    >
                                        Apply
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {isSheetGenerated && workspaceSubjects.length > 0 && (
                        <>
                            <div style={{ borderTop: '1px solid #E5E7EB', margin: '20px 0' }} />
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <label style={{ fontSize: '13px', color: '#86868B', fontWeight: '500' }}>
                                        📚 Select Subjects to Include in Sheet
                                    </label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={() => setSelectedWorkspaceSubjectIds(workspaceSubjects.map(s => s.id))}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: '#0071E3',
                                                fontSize: '13px',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                padding: 0
                                            }}
                                        >
                                            Select All
                                        </button>
                                        <span style={{ color: '#86868B', fontSize: '13px' }}>|</span>
                                        <button
                                            onClick={() => setSelectedWorkspaceSubjectIds([])}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: '#0071E3',
                                                fontSize: '13px',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                padding: 0
                                            }}
                                        >
                                            Deselect All
                                        </button>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                    {workspaceSubjects.map((subject) => {
                                        const isSelected = selectedWorkspaceSubjectIds.includes(subject.id);
                                        return (
                                            <button
                                                key={subject.id}
                                                onClick={() => {
                                                    setSelectedWorkspaceSubjectIds(prev =>
                                                        isSelected
                                                            ? prev.filter(id => id !== subject.id)
                                                            : [...prev, subject.id]
                                                    );
                                                }}
                                                style={{
                                                    padding: '8px 16px',
                                                    borderRadius: '20px',
                                                    border: isSelected ? '1px solid #0071E3' : '1px solid rgba(0,0,0,0.15)',
                                                    background: isSelected ? '#0071E3' : '#fff',
                                                    color: isSelected ? '#fff' : '#1D1D1F',
                                                    fontSize: '13px',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    boxShadow: isSelected ? '0 2px 8px rgba(0,113,227,0.15)' : 'none'
                                                }}
                                            >
                                                {subject.subject_name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div
                    style={{
                        background: '#fff',
                        border: '1px solid rgba(0,0,0,0.08)',
                        borderRadius: '20px',
                        padding: '32px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                        minHeight: '400px'
                    }}
                >
                    {loadingWorkspace ? (
                        <div style={{ textAlign: 'center', paddingTop: '100px' }}>
                            <div className="spinner" style={{ marginBottom: '16px' }}></div>
                            <p style={{ color: '#86868B' }}>Fetching class roster and marks...</p>
                        </div>
                    ) : !isSheetGenerated ? (
                        <div style={{ textAlign: 'center', paddingTop: '120px', color: '#86868B' }}>
                            <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>📝</span>
                            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1D1D1F', marginBottom: '8px' }}>
                                Awaiting Configuration
                            </h3>
                            <p style={{ fontSize: '14px', margin: 0 }}>
                                Please select Academic Year, Exam Name, and click "Generate Sheet" to open the sheet.
                            </p>
                        </div>
                    ) : workspaceStudents.length === 0 ? (
                        <div style={{ textAlign: 'center', paddingTop: '120px', color: '#86868B' }}>
                            <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>👥</span>
                            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1D1D1F', marginBottom: '8px' }}>
                                No Active Students
                            </h3>
                            <p style={{ fontSize: '14px', margin: 0 }}>
                                No active students were found in this class for the selected academic year.
                            </p>
                        </div>
                    ) : workspaceSubjects.length === 0 ? (
                        <div style={{ textAlign: 'center', paddingTop: '120px', color: '#86868B' }}>
                            <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>📚</span>
                            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1D1D1F', marginBottom: '8px' }}>
                                No Class Subjects
                            </h3>
                            <p style={{ fontSize: '14px', margin: 0 }}>
                                No subjects were found registered for this class. Please setup subjects in school configuration first.
                            </p>
                        </div>
                    ) : selectedWorkspaceSubjectIds.length === 0 ? (
                        <div style={{ textAlign: 'center', paddingTop: '120px', color: '#86868B' }}>
                            <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>👁️</span>
                            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1D1D1F', marginBottom: '8px' }}>
                                No Subjects Selected
                            </h3>
                            <p style={{ fontSize: '14px', margin: 0 }}>
                                Please select at least one subject from the panel above to edit marks.
                            </p>
                        </div>
                    ) : (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <div style={{ fontSize: '15px', color: '#86868B' }}>
                                    💡 <strong>Tip:</strong> Use your <strong>Arrow Keys</strong> or <strong>Enter</strong> to move and edit marks in any direction!
                                </div>
                                <div style={{ fontSize: '14px', fontWeight: '600', color: '#1D1D1F', background: '#F5F5F7', padding: '6px 12px', borderRadius: '20px' }}>
                                    Graded: {gradedCount} / {totalCount} Students
                                </div>
                            </div>

                            <div style={{ overflowX: 'auto', width: '100%', border: '1px solid #E5E7EB', borderRadius: '12px', marginBottom: '32px' }}>
                                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                                    <thead>
                                        <tr style={{ background: '#F8F9FA' }}>
                                            <th style={{ position: 'sticky', left: 0, zIndex: 11, background: '#F8F9FA', textAlign: 'center', padding: '12px', fontSize: '14px', fontWeight: '600', color: '#4B5563', width: '50px', borderBottom: '2px solid #E5E7EB', borderRight: '1px solid #E5E7EB' }}>#</th>
                                            <th style={{ position: 'sticky', left: '50px', zIndex: 11, background: '#F8F9FA', textAlign: 'left', padding: '12px', fontSize: '14px', fontWeight: '600', color: '#4B5563', width: '140px', borderBottom: '2px solid #E5E7EB', borderRight: '1px solid #E5E7EB' }}>Reg ID</th>
                                            <th style={{ position: 'sticky', left: '190px', zIndex: 11, background: '#F8F9FA', textAlign: 'left', padding: '12px', fontSize: '14px', fontWeight: '600', color: '#4B5563', width: '80px', borderBottom: '2px solid #E5E7EB', borderRight: '1px solid #E5E7EB' }}>Roll No</th>
                                            <th style={{ position: 'sticky', left: '270px', zIndex: 11, background: '#F8F9FA', textAlign: 'left', padding: '12px', fontSize: '14px', fontWeight: '600', color: '#4B5563', width: '180px', minWidth: '180px', borderBottom: '2px solid #E5E7EB', borderRight: '2px solid #D1D5DB' }}>Student Name</th>
                                            
                                            {/* Dynamic Subject Headers with editable Max Marks */}
                                            {visibleSubjects.map((sub, subIdx) => (
                                                <th key={sub.id} style={{ textAlign: 'center', padding: '12px', fontSize: '14px', fontWeight: '600', color: '#4B5563', minWidth: '120px', borderBottom: '2px solid #E5E7EB', borderRight: '1px solid #E5E7EB' }}>
                                                    <div style={{ fontSize: '13px', marginBottom: '4px' }}>{sub.subject_name}</div>
                                                    <div style={{ fontSize: '10px', color: '#86868B', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                                        <span>Max:</span>
                                                        <input
                                                            type="text"
                                                            value={workspaceMaxMarksMap[sub.id] ?? 100}
                                                            onChange={(e) => {
                                                                const val = e.target.value.replace(/[^0-9]/g, '');
                                                                handleMaxMarksChange(sub.id, parseInt(val) || 0);
                                                            }}
                                                            style={{
                                                                width: '44px',
                                                                height: '20px',
                                                                textAlign: 'center',
                                                                border: '1px solid rgba(0,0,0,0.15)',
                                                                borderRadius: '4px',
                                                                fontSize: '11px',
                                                                fontWeight: '700'
                                                            }}
                                                        />
                                                    </div>
                                                </th>
                                            ))}
                                            <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px', fontWeight: '600', color: '#4B5563', minWidth: '220px', borderBottom: '2px solid #E5E7EB' }}>Remarks</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {workspaceStudents.map((student, index) => {
                                            const remarksVal = gridRemarks[student.id] ?? '';
                                            const rowBg = index % 2 === 0 ? '#ffffff' : '#f9fafb';

                                            return (
                                                <tr
                                                    key={student.id}
                                                    style={{
                                                        background: rowBg,
                                                        transition: 'background-color 0.1s'
                                                    }}
                                                >
                                                    <td style={{ position: 'sticky', left: 0, zIndex: 9, background: rowBg, textAlign: 'center', padding: '12px', fontSize: '14px', color: '#6B7280', borderBottom: '1px solid #E5E7EB', borderRight: '1px solid #E5E7EB' }}>
                                                        {index + 1}
                                                    </td>
                                                    <td style={{ position: 'sticky', left: '50px', zIndex: 9, background: rowBg, padding: '12px', fontSize: '14px', color: '#4B5563', fontFamily: 'monospace', borderBottom: '1px solid #E5E7EB', borderRight: '1px solid #E5E7EB' }}>
                                                        {student.registration_number || 'N/A'}
                                                    </td>
                                                    <td style={{ position: 'sticky', left: '190px', zIndex: 9, background: rowBg, padding: '12px', fontSize: '14px', color: '#4B5563', borderBottom: '1px solid #E5E7EB', borderRight: '1px solid #E5E7EB' }}>
                                                        {student.roll_number || '-'}
                                                    </td>
                                                    <td style={{ position: 'sticky', left: '270px', zIndex: 9, background: rowBg, padding: '12px', fontSize: '15px', fontWeight: '500', color: '#1D1D1F', width: '180px', minWidth: '180px', borderBottom: '1px solid #E5E7EB', borderRight: '2px solid #D1D5DB' }}>
                                                        {student.full_name}
                                                    </td>

                                                    {/* Subject Mark Inputs */}
                                                    {visibleSubjects.map((sub, subIdx) => {
                                                        const markObj = gridMarks[student.id]?.[sub.id];
                                                        const markVal = markObj?.obtained ?? '';
                                                        const maxMarks = workspaceMaxMarksMap[sub.id] || 100;
                                                        const isInvalid = isMarkInvalid(markVal, maxMarks);
                                                        const calculatedGrade = getRowGrade(markVal, maxMarks);

                                                        let gradeColor = '#86868B';
                                                        if (calculatedGrade === 'A+' || calculatedGrade === 'A') gradeColor = '#2E7D32';
                                                        else if (calculatedGrade === 'B+' || calculatedGrade === 'B') gradeColor = '#1565C0';
                                                        else if (calculatedGrade === 'C') gradeColor = '#EF6C00';

                                                        return (
                                                            <td key={sub.id} style={{ textAlign: 'center', padding: '12px', borderBottom: '1px solid #E5E7EB', borderRight: '1px solid #E5E7EB' }}>
                                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                                                    <input
                                                                        type="text"
                                                                        id={`mark-input-${index}-${subIdx}`}
                                                                        value={markVal}
                                                                        onChange={(e) => handleMarkChange(student.id, sub.id, e.target.value)}
                                                                        onKeyDown={(e) => handleKeyDown(e, index, subIdx)}
                                                                        placeholder="-"
                                                                        style={{
                                                                            width: '60px',
                                                                            height: '32px',
                                                                            textAlign: 'center',
                                                                            border: isInvalid ? '2px solid #FF453A' : '1px solid rgba(0,0,0,0.15)',
                                                                            borderRadius: '6px',
                                                                            fontSize: '14px',
                                                                            fontWeight: '600',
                                                                            color: isInvalid ? '#FF453A' : '#1D1D1F',
                                                                            outline: 'none',
                                                                            background: isInvalid ? '#FFEBEA' : '#fff'
                                                                        }}
                                                                        onFocus={(e) => {
                                                                            e.target.style.borderColor = '#0071E3';
                                                                            e.target.select();
                                                                        }}
                                                                        onBlur={(e) => {
                                                                            e.target.style.borderColor = isInvalid ? '#FF453A' : 'rgba(0,0,0,0.15)';
                                                                        }}
                                                                    />
                                                                    {markVal !== '' && (
                                                                        <span style={{ fontSize: '11px', fontWeight: '700', color: gradeColor }}>
                                                                            {calculatedGrade}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        );
                                                    })}

                                                    {/* Remarks Input */}
                                                    <td style={{ padding: '12px', borderBottom: '1px solid #E5E7EB' }}>
                                                        <input
                                                            type="text"
                                                            value={remarksVal}
                                                            onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                                                            placeholder="Add remarks (optional)..."
                                                            style={{
                                                                width: '100%',
                                                                height: '34px',
                                                                padding: '0 8px',
                                                                border: '1px solid rgba(0,0,0,0.15)',
                                                                borderRadius: '6px',
                                                                fontSize: '14px',
                                                                outline: 'none'
                                                            }}
                                                            onFocus={(e) => e.target.style.borderColor = '#0071E3'}
                                                            onBlur={(e) => e.target.style.borderColor = 'rgba(0,0,0,0.15)'}
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    borderTop: '1px solid #E5E7EB',
                                    paddingTop: '24px'
                                }}
                            >
                                <button
                                    onClick={() => setSelectedClass(null)}
                                    style={{
                                        padding: '12px 24px',
                                        background: '#fff',
                                        border: '1px solid rgba(0,0,0,0.15)',
                                        borderRadius: '10px',
                                        fontSize: '15px',
                                        fontWeight: '500',
                                        cursor: 'pointer',
                                        color: '#4B5563'
                                    }}
                                >
                                    Cancel
                                </button>
                                
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button
                                        onClick={() => handleSaveWorkspace(false)}
                                        disabled={savingWorkspace}
                                        style={{
                                            padding: '12px 24px',
                                            background: '#fff',
                                            border: '1px solid #0071E3',
                                            color: '#0071E3',
                                            borderRadius: '10px',
                                            fontSize: '15px',
                                            fontWeight: '600',
                                            cursor: savingWorkspace ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        💾 Save Draft
                                    </button>
                                    
                                    <button
                                        onClick={() => handleSaveWorkspace(true)}
                                        disabled={savingWorkspace}
                                        style={{
                                            padding: '12px 28px',
                                            background: '#0071E3',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '10px',
                                            fontSize: '15px',
                                            fontWeight: '600',
                                            cursor: savingWorkspace ? 'not-allowed' : 'pointer',
                                            boxShadow: '0 4px 12px rgba(0,113,227,0.2)'
                                        }}
                                    >
                                        {savingWorkspace ? 'Saving...' : '🚀 Publish Marks'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const filteredStudents = students.filter(
        (s) =>
            s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.registration_number.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (selectedClass) {
        return renderSpreadsheetWorkspace();
    }

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
                            <option value="F1">F1</option>
                            <option value="F2">F2</option>
                            <option value="F3">F3</option>
                            <option value="F4">F4</option>
                            <option value="S1">S1</option>
                            <option value="S2">S2</option>
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
