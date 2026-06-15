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
            .order('numeric_value', { ascending: true })
            .order('class_name', { ascending: true });
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

            // Create or get exam (reuse existing to avoid duplicate records)
            let examData = null;
            const { data: existingExams, error: fetchExamErr } = await supabase
                .from('exams')
                .select('*')
                .eq('exam_name', selectedExam)
                .eq('class_id', selectedClass)
                .eq('academic_year_id', selectedYear)
                .limit(1);

            if (fetchExamErr) throw fetchExamErr;

            if (existingExams && existingExams.length > 0) {
                examData = existingExams[0];
                console.log('🔄 Reusing existing exam:', examData);
            } else {
                const { data: newExam, error: examError } = await supabase
                    .from('exams')
                    .insert({
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
                examData = newExam;
                console.log('🆕 Created new exam:', examData);
            }

            // Delete old marks for this exam if any exist to ensure a clean overwrite
            const { error: deleteError } = await supabase
                .from('marks')
                .delete()
                .eq('exam_id', examData.id);
            
            if (deleteError) {
                console.error('Error removing old marks before upload:', deleteError);
            }

            // Get subjects for this class to map global codes (KAN-01) to class-specific codes (KAN-06)
            const { data: classSubjects } = await supabase
                .from('subjects')
                .select('id, subject_name, subject_code')
                .eq('class_id', selectedClass);

            // Get global fallback subjects
            const { data: globalSubjects } = await supabase
                .from('subjects')
                .select('id, subject_name, subject_code')
                .is('class_id', null)
                .in('subject_code', selectedSubjects);

            // Map each selected global subject code to the correct class-specific subject ID
            const subjectMap = new Map<string, string>();
            selectedSubjects.forEach(code => {
                const globalSub = globalSubjects?.find(s => s.subject_code === code);
                const subMeta = SUBJECTS.find(s => s.code === code);
                const subName = subMeta ? subMeta.name : '';

                const prefix = code.split('-')[0].toUpperCase();
                const classSub = classSubjects?.find(s => {
                    const sPrefix = s.subject_code.split('-')[0].toUpperCase();
                    const sName = s.subject_name.toLowerCase();
                    const targetName = subName.toLowerCase();
                    
                    return (
                        sPrefix === prefix ||
                        sName === targetName ||
                        sName.includes(targetName) ||
                        targetName.includes(sName)
                    );
                });

                if (classSub) {
                    subjectMap.set(code, classSub.id);
                    console.log(`🎯 Mapped subject "${subName}" (${code}) -> Class-specific subject "${classSub.subject_name}" (${classSub.subject_code})`);
                } else if (globalSub) {
                    subjectMap.set(code, globalSub.id);
                    console.log(`⚠️ Mapped subject "${subName}" (${code}) -> Global fallback subject "${globalSub.subject_name}" (${globalSub.subject_code})`);
                }
            });

            // Fetch active students in the class for fast lookups and name matching
            const { data: classStudents, error: studentsFetchErr } = await supabase
                .from('students')
                .select('id, registration_number, full_name')
                .eq('class_id', selectedClass)
                .eq('is_active', true);

            if (studentsFetchErr) throw studentsFetchErr;

            const regMap = new Map<string, string>();
            const nameMap = new Map<string, string>();

            (classStudents || []).forEach(st => {
                if (st.registration_number) {
                    regMap.set(st.registration_number.trim().toLowerCase(), st.id);
                }
                if (st.full_name) {
                    const normName = st.full_name.trim().toLowerCase().replace(/\s+/g, '');
                    nameMap.set(normName, st.id);
                }
            });

            const skippedRows: string[] = [];
            let successfulMatches = 0;

            // Process each student row
            for (const row of jsonData) {
                const studentIdRaw = row['Student_id'];
                if (!studentIdRaw) {
                    // Silently ignore empty rows (common at the bottom of sheet exports)
                    continue;
                }

                const studentIdStr = String(studentIdRaw).trim();
                const studentIdKey = studentIdStr.toLowerCase().replace(/\s+/g, '');

                // Find student by registration number or name
                let studentId = regMap.get(studentIdStr.toLowerCase()) || nameMap.get(studentIdKey);

                // Fallback substring name matching
                if (!studentId) {
                    const fallbackStudent = (classStudents || []).find(st => {
                        const dbName = st.full_name.trim().toLowerCase().replace(/\s+/g, '');
                        return dbName.includes(studentIdKey) || studentIdKey.includes(dbName);
                    });
                    if (fallbackStudent) {
                        studentId = fallbackStudent.id;
                    }
                }

                if (!studentId) {
                    console.warn(`Student not found for row identifier: ${studentIdStr}`);
                    skippedRows.push(studentIdStr);
                    continue;
                }

                successfulMatches++;

                // Insert marks for each subject
                for (const subjectCode of selectedSubjects) {
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
                                student_id: studentId,
                                exam_id: examData.id,
                                subject_id: subjectId,
                                marks_obtained: marksNum,
                                max_marks: customMax,
                                percentage: percentage,
                                grade: calculateGrade(percentage),
                            }, { onConflict: 'student_id,exam_id,subject_id' });

                            if (upsertError) {
                                console.error(`Error saving mark for student ${studentIdStr} in ${subjectCode}:`, upsertError);
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
            
            if (skippedRows.length > 0) {
                alert(`Uploaded marks for ${successfulMatches} students.\n\n⚠️ Warning: The following ${skippedRows.length} student rows were skipped (not found in this class):\n${skippedRows.join(', ')}`);
            } else {
                alert(`Successfully uploaded marks for ${successfulMatches} students`);
            }
            
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
