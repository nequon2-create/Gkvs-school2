import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import * as XLSX from 'xlsx';

const SUBJECTS = [
    { code: 'KAN-01', name: 'Kannada' },
    { code: 'HIN-01', name: 'Hindi' },
    { code: 'ENG-01', name: 'English' },
    { code: 'MAT-01', name: 'Math' },
    { code: 'EVS-01', name: 'Environment Study' },
    { code: 'SOC-01', name: 'Social Science' },
    { code: 'SCI-01', name: 'Science' },
    { code: 'PED-01', name: 'Physical Education' },
];

interface UploadMarksModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export function UploadMarksModal({ onClose, onSuccess }: UploadMarksModalProps) {
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedExam, setSelectedExam] = useState('');
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
    const [maxMarksMap, setMaxMarksMap] = useState<Record<string, number>>({});
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [classes, setClasses] = useState<any[]>([]);
    const [academicYears, setAcademicYears] = useState<any[]>([]);

    useEffect(() => {
        fetchClasses();
        fetchAcademicYears();
    }, []);

    const fetchClasses = async () => {
        const { data } = await supabase
            .from('classes')
            .select('id, class_name, section')
            .order('class_name');
        setClasses(data || []);
    };

    const fetchAcademicYears = async () => {
        const { data } = await supabase
            .from('academic_years')
            .select('id, year_name')
            .order('year_name', { ascending: false });
        setAcademicYears(data || []);
    };

    const handleSubjectToggle = (code: string) => {
        if (selectedSubjects.includes(code)) {
            setSelectedSubjects((prev) => prev.filter((c) => c !== code));
            setMaxMarksMap((prev) => {
                const newMap = { ...prev };
                delete newMap[code];
                return newMap;
            });
        } else {
            setSelectedSubjects((prev) => [...prev, code]);
            setMaxMarksMap((prev) => ({ ...prev, [code]: 100 }));
        }
    };

    const handleMaxMarksChange = (code: string, value: string) => {
        setMaxMarksMap((prev) => ({
            ...prev,
            [code]: parseInt(value) || 0,
        }));
    };

    const handleUpload = async () => {
        if (!file || !selectedYear || !selectedClass || !selectedExam || selectedSubjects.length === 0) {
            alert('Please fill all fields and select at least one subject');
            return;
        }

        setUploading(true);

        try {
            // Read Excel/CSV file
            const arrayBuffer = await file.arrayBuffer();
            const data = new Uint8Array(arrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const rawData: any[] = XLSX.utils.sheet_to_json(worksheet);

            // Clean data keys and values (e.g., handles "Student_id " with trailing spaces from Google Sheets)
            const jsonData = rawData.map(row => {
                const cleanRow: any = {};
                for (const key in row) {
                    const cleanKey = key.trim();
                    const value = row[key];
                    cleanRow[cleanKey] = typeof value === 'string' ? value.replace(/\s+/g, '').trim() : value;
                }
                return cleanRow;
            });

            console.log('📊 Parsed Excel data:', jsonData);

            // Create or get exam
            const { data: examData, error: examError } = await supabase
                .from('exams')
                .upsert({
                    exam_name: selectedExam,
                    exam_type: selectedExam,
                    class_id: selectedClass,
                    academic_year_id: selectedYear,
                    exam_date: new Date().toISOString().split('T')[0],
                    is_published: false,
                })
                .select()
                .single();

            if (examError) throw examError;

            // Get subject IDs from Supabase
            const { data: subjectsData } = await supabase
                .from('subjects')
                .select('id, subject_code')
                .in('subject_code', selectedSubjects);

            const subjectMap = new Map(subjectsData?.map((s) => [s.subject_code, s.id]));

            // Process each student row
            for (const row of jsonData) {
                const studentId = row['Student_id'];

                // Find student by registration number
                const { data: student } = await supabase
                    .from('students')
                    .select('id')
                    .eq('registration_number', studentId)
                    .single();

                if (!student) {
                    console.warn(`Student not found: ${studentId}`);
                    continue;
                }

                // Insert marks for each subject
                for (const subjectCode of selectedSubjects) {
                    // Check for standard code first (e.g., 'KAN-01'), then fallback to old format
                    let marks = row[subjectCode];

                    if (marks === undefined || marks === null) {
                        const columnName = `${SUBJECTS.find((s) => s.code === subjectCode)?.name}${subjectCode}`;
                        marks = row[columnName];
                    }

                    if (marks !== undefined && marks !== null) {
                        const marksNum = parseFloat(marks);
                        const subjectId = subjectMap.get(subjectCode);
                        const customMax = maxMarksMap[subjectCode] || 100;
                        const percentage = customMax > 0 ? (marksNum / customMax) * 100 : 0;

                        if (subjectId && !isNaN(marksNum)) {
                            const { error: upsertError } = await supabase.from('marks').upsert({
                                student_id: student.id,
                                exam_id: examData.id,
                                subject_id: subjectId,
                                marks_obtained: marksNum,
                                max_marks: customMax,
                                percentage: percentage,
                                grade: calculateGrade(percentage),
                            }, { onConflict: 'student_id,exam_id,subject_id' });

                            if (upsertError) {
                                console.error(`Error saving mark for ${studentId} in ${subjectCode}:`, upsertError);
                            }
                        } else if (!subjectId) {
                            console.warn(`Subject ID not found for code: ${subjectCode}`);
                        }
                    }
                }
            }

            // Publish exam (generates marks cards)
            await supabase
                .from('exams')
                .update({ is_published: true })
                .eq('id', examData.id);

            console.log('✅ Successfully uploaded marks to Supabase');
            alert(`Successfully uploaded marks for ${jsonData.length} students`);
            onSuccess();
        } catch (err) {
            console.error('Error uploading marks:', err);
            alert('Failed to upload marks');
        } finally {
            setUploading(false);
        }
    };

    const calculateGrade = (marks: number): string => {
        if (marks >= 90) return 'A+';
        if (marks >= 80) return 'A';
        if (marks >= 70) return 'B+';
        if (marks >= 60) return 'B';
        if (marks >= 50) return 'C';
        if (marks >= 40) return 'D';
        return 'F';
    };

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
            onClick={onClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: '#fff',
                    borderRadius: '24px',
                    padding: '40px',
                    maxWidth: '600px',
                    width: '90%',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                }}
            >
                <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px' }}>
                    Upload Marks Sheet
                </h2>

                {/* Year */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '13px', color: '#86868B', marginBottom: '8px' }}>
                        Academic Year *
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

                {/* Class */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '13px', color: '#86868B', marginBottom: '8px' }}>
                        Class *
                    </label>
                    <select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        style={{
                            width: '100%',
                            height: '44px',
                            padding: '0 16px',
                            borderRadius: '10px',
                            border: '1px solid rgba(0,0,0,0.1)',
                        }}
                    >
                        <option value="">Select Class</option>
                        {classes.map((cls) => (
                            <option key={cls.id} value={cls.id}>
                                {cls.class_name} {cls.section && `- ${cls.section}`}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Exam */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '13px', color: '#86868B', marginBottom: '8px' }}>
                        Exam Type *
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

                {/* Subjects */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '13px', color: '#86868B', marginBottom: '8px' }}>
                        Select Subjects *
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        {SUBJECTS.map((subject) => (
                            <label
                                key={subject.code}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    background: selectedSubjects.includes(subject.code) ? '#E8F4FF' : '#F5F5F7',
                                    border: selectedSubjects.includes(subject.code) ? '2px solid #0071E3' : '2px solid transparent',
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedSubjects.includes(subject.code)}
                                    onChange={() => handleSubjectToggle(subject.code)}
                                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                />
                                <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => handleSubjectToggle(subject.code)}>
                                    <div style={{ fontSize: '14px', fontWeight: '500' }}>{subject.name}</div>
                                    <div style={{ fontSize: '12px', color: '#86868B' }}>({subject.code})</div>
                                </div>
                                {selectedSubjects.includes(subject.code) && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <span style={{ fontSize: '12px', color: '#86868B' }}>Max:</span>
                                        <input
                                            type="number"
                                            value={maxMarksMap[subject.code] || ''}
                                            onChange={(e) => handleMaxMarksChange(subject.code, e.target.value)}
                                            style={{
                                                width: '50px',
                                                height: '28px',
                                                padding: '4px',
                                                borderRadius: '4px',
                                                border: '1px solid #ccc',
                                                fontSize: '13px',
                                                textAlign: 'center'
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                )}
                            </label>
                        ))}
                    </div>
                </div>

                {/* Format Guide */}
                <div style={{ background: '#F5F5F7', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                        Excel/CSV Format Required:
                    </div>
                    <div style={{ fontSize: '12px', color: '#86868B', fontFamily: 'monospace', whiteSpace: 'pre' }}>
                        {`Student_id | KAN-01 | ENG-01 | ... | Total_Marks
RAM001      | 90     | 78     | ... | 253`}
                    </div>
                </div>

                {/* File Input */}
                <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    style={{ marginBottom: '24px', width: '100%' }}
                />

                {/* Buttons */}
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={onClose}
                        style={{
                            flex: 1,
                            padding: '12px',
                            background: 'rgba(0,0,0,0.03)',
                            border: '1px solid rgba(0,0,0,0.1)',
                            borderRadius: '10px',
                            fontSize: '15px',
                            fontWeight: '500',
                            cursor: 'pointer',
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleUpload}
                        disabled={uploading}
                        style={{
                            flex: 1,
                            padding: '12px',
                            background: uploading ? '#86868B' : '#0071E3',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '15px',
                            fontWeight: '500',
                            cursor: uploading ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {uploading ? 'Publishing...' : 'Publish & Generate Cards'}
                    </button>
                </div>
            </div>
        </div>
    );
}
