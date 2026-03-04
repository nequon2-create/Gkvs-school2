import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAttendance } from '../hooks/useAttendance';
import type { StudentListItem } from '../types/list.types';
import type { AttendanceStatus } from '../types/attendance.types';
import { AttendanceRow } from '../components/features/attendance/AttendanceRow';
import { format } from 'date-fns';
import './MarkAttendancePage.css';

interface AttendanceData {
    studentId: string;
    status: AttendanceStatus;
}

export function MarkAttendancePage() {
    const navigate = useNavigate();
    const { bulkMarkAttendance } = useAttendance();

    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedAcademicYear, setSelectedAcademicYear] = useState('');

    const [classes, setClasses] = useState<any[]>([]);
    const [academicYears, setAcademicYears] = useState<any[]>([]);
    const [students, setStudents] = useState<StudentListItem[]>([]);

    const [attendanceData, setAttendanceData] = useState<Map<string, AttendanceData>>(new Map());
    const [saving, setSaving] = useState(false);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Fetch classes and academic years on mount
    useEffect(() => {
        fetchClasses();
        fetchAcademicYears();
    }, []);

    const fetchClasses = async () => {
        const { data } = await supabase
            .from('classes')
            .select('*')
            .order('numeric_value', { ascending: true });

        if (data) setClasses(data);
    };

    const fetchAcademicYears = async () => {
        const { data } = await supabase
            .from('academic_years')
            .select('*')
            .order('start_date', { ascending: false });

        if (data) {
            setAcademicYears(data);
            // Auto-select current year
            const current = data.find((y: any) => y.is_current);
            if (current) setSelectedAcademicYear(current.id);
        }
    };

    // Load students when class is selected
    const handleLoadStudents = async () => {
        if (!selectedClass || !selectedAcademicYear) {
            setError('Please select both class and academic year');
            return;
        }

        try {
            setLoadingStudents(true);
            setError('');

            console.log('📚 Loading students for class:', selectedClass);

            const { data: studentData, error: fetchError } = await supabase
                .from('students')
                .select(`
                    *,
                    classes (
                        id,
                        class_name,
                        section
                    )
                `)
                .eq('class_id', selectedClass)
                .eq('academic_year_id', selectedAcademicYear)
                .eq('is_active', true)
                .order('full_name', { ascending: true });

            if (fetchError) throw fetchError;

            console.log(`✅ Loaded ${studentData?.length || 0} students`);
            setStudents(studentData || []);

            // Load existing attendance for this date
            await loadExistingAttendance(studentData || []);
        } catch (err: any) {
            console.error('❌ Error loading students:', err);
            setError(err.message || 'Failed to load students');
        } finally {
            setLoadingStudents(false);
        }
    };

    // Load existing attendance records for the selected date
    const loadExistingAttendance = async (studentList: StudentListItem[]) => {
        try {
            const { data: existingAttendance } = await supabase
                .from('attendance')
                .select('student_id, status')
                .eq('date', selectedDate)
                .in('student_id', studentList.map(s => s.id));

            const newAttendanceData = new Map<string, AttendanceData>();

            existingAttendance?.forEach((record: any) => {
                newAttendanceData.set(record.student_id, {
                    studentId: record.student_id,
                    status: record.status,
                });
            });

            setAttendanceData(newAttendanceData);
            console.log(`📝 Loaded ${existingAttendance?.length || 0} existing attendance records`);
        } catch (err) {
            console.error('Error loading existing attendance:', err);
        }
    };

    // Update attendance for a single student
    const handleUpdateAttendance = (studentId: string, status: AttendanceStatus) => {
        setAttendanceData(prev => {
            const newMap = new Map(prev);
            newMap.set(studentId, { studentId, status });
            return newMap;
        });
    };

    // Mark all students as present
    const handleMarkAllPresent = () => {
        const newMap = new Map<string, AttendanceData>();
        students.forEach(student => {
            newMap.set(student.id, {
                studentId: student.id,
                status: 'present',
            });
        });
        setAttendanceData(newMap);
    };

    // Mark all students as absent
    const handleMarkAllAbsent = () => {
        const newMap = new Map<string, AttendanceData>();
        students.forEach(student => {
            newMap.set(student.id, {
                studentId: student.id,
                status: 'absent',
            });
        });
        setAttendanceData(newMap);
    };

    // Save all attendance records
    const handleSaveAttendance = async () => {
        if (!selectedClass || !selectedAcademicYear) {
            setError('Missing class or academic year');
            return;
        }

        // Check if all students have status marked
        const unmarkedStudents = students.filter(s => !attendanceData.has(s.id));
        if (unmarkedStudents.length > 0) {
            setError(`Please mark attendance for all students. ${unmarkedStudents.length} students remaining.`);
            return;
        }

        try {
            setSaving(true);
            setError('');
            setSuccess('');

            console.log(`💾 Saving attendance for ${attendanceData.size} students...`);

            const records = Array.from(attendanceData.values());

            const success = await bulkMarkAttendance({
                date: selectedDate,
                classId: selectedClass,
                academicYearId: selectedAcademicYear,
                records,
            });

            if (success) {
                setSuccess(`✅ Attendance saved for ${records.length} students!`);
                setTimeout(() => {
                    navigate('/attendance');
                }, 2000);
            } else {
                setError('Failed to save attendance. Please try again.');
            }
        } catch (err: any) {
            console.error('❌ Error saving attendance:', err);
            setError(err.message || 'Failed to save attendance');
        } finally {
            setSaving(false);
        }
    };

    const isDataLoaded = students.length > 0;
    const markedCount = attendanceData.size;
    const totalCount = students.length;
    const progress = totalCount > 0 ? Math.round((markedCount / totalCount) * 100) : 0;

    return (
        <div className="mark-attendance-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Mark Attendance</h1>
                    <p className="page-subtitle">Record daily attendance for students</p>
                </div>
                <button className="back-btn" onClick={() => navigate('/attendance')}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Back to Attendance
                </button>
            </div>

            {/* Date and Class Selection */}
            <div className="selection-panel">
                <div className="form-group">
                    <label>Date</label>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        max={format(new Date(), 'yyyy-MM-dd')}
                        className="date-input"
                    />
                </div>

                <div className="form-group">
                    <label>Academic Year</label>
                    <select
                        value={selectedAcademicYear}
                        onChange={(e) => setSelectedAcademicYear(e.target.value)}
                        className="select-input"
                    >
                        <option value="">Select Year</option>
                        {academicYears.map(year => (
                            <option key={year.id} value={year.id}>
                                {year.year_name} {year.is_current && '(Current)'}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label>Class</label>
                    <select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="select-input"
                    >
                        <option value="">Select Class</option>
                        {classes.map(cls => (
                            <option key={cls.id} value={cls.id}>
                                {cls.class_name}{cls.section ? ` - ${cls.section}` : ''}
                            </option>
                        ))}
                    </select>
                </div>

                <button
                    className="load-btn"
                    onClick={handleLoadStudents}
                    disabled={!selectedClass || !selectedAcademicYear || loadingStudents}
                >
                    {loadingStudents ? 'Loading...' : 'Load Students'}
                </button>
            </div>

            {error && (
                <div className="alert alert-error">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z" stroke="currentColor" strokeWidth="2" />
                        <path d="M10 6V10M10 14H10.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    {error}
                </div>
            )}

            {success && (
                <div className="alert alert-success">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M7 10L9 12L13 8M18 10C18 14.4183 14.4183 18 10 18C5.58172 18 2 14.4183 2 10C2 5.58172 5.58172 2 10 2C14.4183 2 18 5.58172 18 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {success}
                </div>
            )}

            {isDataLoaded && (
                <>
                    {/* Progress and Quick Actions */}
                    <div className="actions-panel">
                        <div className="progress-info">
                            <span className="progress-text">
                                Progress: {markedCount} / {totalCount} students ({progress}%)
                            </span>
                            <div className="progress-bar">
                                <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                            </div>
                        </div>

                        <div className="quick-actions">
                            <button className="action-btn present-btn" onClick={handleMarkAllPresent}>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M13.3333 4L6 11.3333L2.66667 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                Mark All Present
                            </button>
                            <button className="action-btn absent-btn" onClick={handleMarkAllAbsent}>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                                Mark All Absent
                            </button>
                        </div>
                    </div>

                    {/* Student List */}
                    <div className="students-list">
                        <h3 className="list-title">Student List ({totalCount} students)</h3>
                        {students.map(student => (
                            <AttendanceRow
                                key={student.id}
                                student={student}
                                currentStatus={attendanceData.get(student.id)?.status}
                                onUpdate={(status) => handleUpdateAttendance(student.id, status)}
                            />
                        ))}
                    </div>

                    {/* Save Button */}
                    <div className="save-panel">
                        <button
                            className="save-btn"
                            onClick={handleSaveAttendance}
                            disabled={saving || markedCount < totalCount}
                        >
                            {saving ? 'Saving...' : `Save Attendance (${markedCount}/${totalCount})`}
                        </button>
                    </div>
                </>
            )}

            {!isDataLoaded && !loadingStudents && (
                <div className="empty-state">
                    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                        <path d="M32 56C45.2548 56 56 45.2548 56 32C56 18.7452 45.2548 8 32 8C18.7452 8 8 18.7452 8 32C8 45.2548 18.7452 56 32 56Z" stroke="currentColor" strokeWidth="3" />
                        <path d="M32 22V32M32 42H32.02" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    <h3>No Students Loaded</h3>
                    <p>Select a date, academic year, and class, then click "Load Students"</p>
                </div>
            )}
        </div>
    );
}
