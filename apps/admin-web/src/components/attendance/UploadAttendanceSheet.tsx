import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface UploadAttendanceSheetProps {
    type: 'student' | 'teacher';
    onClose: () => void;
    onSuccess: () => void;
}

export function UploadAttendanceSheet({ type, onClose, onSuccess }: UploadAttendanceSheetProps) {
    const [selectedYear, setSelectedYear] = useState('2024');
    const [selectedMonth, setSelectedMonth] = useState('1');
    const [selectedClass, setSelectedClass] = useState('');
    const [classes, setClasses] = useState<any[]>([]);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (type === 'student') {
            fetchClasses();
        }
    }, [type]);

    const fetchClasses = async () => {
        const { data } = await supabase
            .from('classes')
            .select('id, class_name, section')
            .order('class_name');
        setClasses(data || []);
    };

    const handleUpload = async () => {
        if (!file) {
            alert('Please select a file');
            return;
        }

        if (type === 'student' && !selectedClass) {
            alert('Please select a class');
            return;
        }

        setUploading(true);

        try {
            // Read CSV file
            const text = await file.text();
            const lines = text.split('\n').filter((line) => line.trim());
            const headers = lines[0].split(',').map((h) => h.trim());

            console.log('📄 CSV Headers:', headers);

            // Validate headers
            const requiredHeaders = type === 'student'
                ? ['student_id', 'date', 'present']
                : ['teacher_id', 'date', 'present'];

            const hasRequiredHeaders = requiredHeaders.every((h) => headers.includes(h));
            if (!hasRequiredHeaders) {
                alert(`Invalid CSV format. Required columns: ${requiredHeaders.join(', ')}`);
                setUploading(false);
                return;
            }

            // Parse rows
            const records = [];
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',').map((v) => v.trim());
                const record: any = {};
                headers.forEach((header, index) => {
                    record[header] = values[index];
                });
                records.push(record);
            }

            console.log('📊 Parsed records:', records.length);

            // Process each record and save to Supabase
            for (const record of records) {
                const idField = type === 'student' ? 'student_id' : 'teacher_id';
                const registrationNumber = record[idField];
                const date = record.date;
                const isPresent = record.present === '1' || record.present.toLowerCase() === 'true';

                if (!registrationNumber || !date) continue;

                // Find student/teacher by registration number
                const table = type === 'student' ? 'students' : 'teachers';
                const { data: entity } = await supabase
                    .from(table)
                    .select('id')
                    .eq('registration_number', registrationNumber)
                    .single();

                if (!entity) {
                    console.warn(`${type} not found: ${registrationNumber}`);
                    continue;
                }

                // Insert or update attendance in Supabase
                const targetTable = type === 'student' ? 'student_attendance' : 'teacher_attendance';
                const attendanceData: any = {
                    [idField]: entity.id,
                    date: date,
                    is_present: isPresent,
                    marked_by: (await supabase.auth.getUser()).data.user?.id,
                };

                if (type === 'student') {
                    attendanceData.class_id = selectedClass;
                }

                const { error } = await supabase
                    .from(targetTable)
                    .upsert(attendanceData, {
                        onConflict: type === 'student' ? 'student_id,date' : 'teacher_id,date',
                    });

                if (error) {
                    console.error('Error saving attendance:', error);
                }
            }

            console.log('✅ Successfully uploaded attendance to Supabase');
            alert(`Successfully uploaded ${records.length} attendance records`);
            onSuccess();
        } catch (err) {
            console.error('Error uploading:', err);
            alert('Failed to upload attendance sheet');
        } finally {
            setUploading(false);
        }
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
                    maxWidth: '500px',
                    width: '90%',
                }}
            >
                <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px' }}>
                    Upload {type === 'student' ? 'Student' : 'Teacher'} Attendance
                </h2>

                {/* Year */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '13px', color: '#86868B', marginBottom: '8px' }}>
                        Year *
                    </label>
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        style={{ width: '100%', height: '44px', padding: '0 16px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.1)' }}
                    >
                        <option value="2024">2024</option>
                        <option value="2025">2025</option>
                        <option value="2026">2026</option>
                    </select>
                </div>

                {/* Month */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '13px', color: '#86868B', marginBottom: '8px' }}>
                        Month *
                    </label>
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        style={{ width: '100%', height: '44px', padding: '0 16px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.1)' }}
                    >
                        {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>
                                {new Date(2024, i, 1).toLocaleString('default', { month: 'long' })}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Class (only for students) */}
                {type === 'student' && (
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontSize: '13px', color: '#86868B', marginBottom: '8px' }}>
                            Class *
                        </label>
                        <select
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            style={{ width: '100%', height: '44px', padding: '0 16px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.1)' }}
                        >
                            <option value="">Select Class</option>
                            {classes.map((cls) => (
                                <option key={cls.id} value={cls.id}>
                                    {cls.class_name} {cls.section && `- ${cls.section}`}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Format Guide */}
                <div style={{ background: '#F5F5F7', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                        CSV Format Required:
                    </div>
                    <div style={{ fontSize: '12px', color: '#86868B', fontFamily: 'monospace' }}>
                        {type === 'student' ? 'student_id,date,present' : 'teacher_id,date,present'}
                        <br />
                        {type === 'student' ? 'ST001,2024-01-15,1' : 'TR001,2024-01-15,1'}
                        <br />
                        {type === 'student' ? 'ST002,2024-01-15,0' : 'TR002,2024-01-15,0'}
                    </div>
                </div>

                {/* File Input */}
                <input
                    type="file"
                    accept=".csv"
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
                        {uploading ? 'Uploading...' : 'Upload & Update All'}
                    </button>
                </div>
            </div>
        </div>
    );
}
