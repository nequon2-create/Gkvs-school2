import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
    ChevronLeft,
    Save,
    RotateCcw,
    Edit2,
    Trash2
} from 'lucide-react';
import './SetFeesPage.css';

interface Class {
    id: string;
    class_name: string;
    section: string | null;
}

interface AcademicYear {
    id: string;
    year_name: string;
    is_current: boolean;
}

interface FeeBreakdown {
    admission_fee: number;
    tuition_fee: number;
    betterment_fee: number;
    sports_fee: number;
    reading_room_fee: number;
    medical_fee: number;
    laboratory_fee: number;
    ave_fee: number;
    swf: number;
    tbf: number;
    examination_fee: number;
    fines: number;
    others: number;
}

const initialFeeState: FeeBreakdown = {
    admission_fee: 0,
    tuition_fee: 0,
    betterment_fee: 0,
    sports_fee: 0,
    reading_room_fee: 0,
    medical_fee: 0,
    laboratory_fee: 0,
    ave_fee: 0,
    swf: 0,
    tbf: 0,
    examination_fee: 0,
    fines: 0,
    others: 0
};

export function SetFeesPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [classes, setClasses] = useState<Class[]>([]);
    const [currentYear, setCurrentYear] = useState<AcademicYear | null>(null);
    const [publishedFees, setPublishedFees] = useState<any[]>([]);

    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [fees, setFees] = useState<FeeBreakdown>(initialFeeState);

    // Whole Class vs Individual Students
    const [applyTo, setApplyTo] = useState<'class' | 'students'>('class');
    const [students, setStudents] = useState<any[]>([]);
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const [studentSearchQuery, setStudentSearchQuery] = useState<string>('');
    const [fetchingStudents, setFetchingStudents] = useState(false);

    // Accordion / Overview states
    const [publishedOverview, setPublishedOverview] = useState<any[]>([]);
    const [expandedClassIds, setExpandedClassIds] = useState<string[]>([]);
    const [editingStudentId, setEditingStudentId] = useState<string | null>(null);

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (selectedClassId && currentYear) {
            fetchExistingFees();
            fetchStudents(selectedClassId);
        }
    }, [selectedClassId, currentYear]);

    useEffect(() => {
        if (currentYear) {
            fetchPublishedFees();
            fetchPublishedOverview();
        }
    }, [currentYear]);

    // Hook: when exactly one student is selected in individual mode, load their custom structure
    useEffect(() => {
        if (applyTo === 'students' && selectedStudentIds.length === 1) {
            fetchStudentCustomFees(selectedStudentIds[0]);
        } else {
            fetchExistingFees();
        }
    }, [selectedStudentIds, applyTo]);

    const fetchInitialData = async () => {
        try {
            const [classesRes, yearsRes] = await Promise.all([
                supabase.from('classes').select('*').order('numeric_value', { ascending: true }),
                supabase.from('academic_years').select('*').eq('is_current', true).single()
            ]);

            if (classesRes.data) setClasses(classesRes.data);
            if (yearsRes.data) {
                setCurrentYear(yearsRes.data);
            }

            if (classesRes.data?.length) setSelectedClassId(classesRes.data[0].id);

            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setLoading(false);
        }
    };

    const fetchStudents = async (classId: string) => {
        if (!currentYear) return;
        setFetchingStudents(true);
        try {
            const { data, error } = await supabase
                .from('students')
                .select('id, full_name, roll_number, registration_number')
                .eq('class_id', classId)
                .eq('academic_year_id', currentYear.id)
                .eq('is_active', true)
                .order('roll_number', { ascending: true });

            if (error) throw error;
            setStudents(data || []);
            
            if (editingStudentId) {
                setSelectedStudentIds([editingStudentId]);
                setEditingStudentId(null);
            } else {
                setSelectedStudentIds((data || []).map(s => s.id)); // Default to all selected
            }
        } catch (error) {
            console.error('Error fetching students:', error);
        } finally {
            setFetchingStudents(false);
        }
    };

    const fetchPublishedFees = async () => {
        if (!currentYear) return;
        try {
            const { data } = await supabase
                .from('class_fees')
                .select(`
                    id,
                    class_id,
                    total_fee,
                    classes (
                        class_name,
                        section,
                        numeric_value
                    )
                `)
                .eq('academic_year_id', currentYear.id);

            if (data) {
                // Sort by numeric_value of class
                data.sort((a: any, b: any) => {
                    const valA = a.classes?.numeric_value || 0;
                    const valB = b.classes?.numeric_value || 0;
                    return valA - valB;
                });
                setPublishedFees(data);
            }
        } catch (error) {
            console.error('Error fetching published fees:', error);
        }
    };

    const fetchPublishedOverview = async () => {
        if (!currentYear) return;
        try {
            const [classesRes, classFeesRes, studentFeesRes, studentsRes] = await Promise.all([
                supabase.from('classes').select('*').order('numeric_value', { ascending: true }),
                supabase.from('class_fees').select('*').eq('academic_year_id', currentYear.id),
                supabase.from('student_fees').select('*').eq('academic_year_id', currentYear.id),
                supabase.from('students').select('id, full_name, roll_number, class_id').eq('academic_year_id', currentYear.id).eq('is_active', true)
            ]);

            if (classesRes.error) throw classesRes.error;
            if (classFeesRes.error) throw classFeesRes.error;
            if (studentFeesRes.error) throw studentFeesRes.error;
            if (studentsRes.error) throw studentsRes.error;

            const classesData = classesRes.data || [];
            const classFeesData = classFeesRes.data || [];
            const studentFeesData = studentFeesRes.data || [];
            const studentsData = studentsRes.data || [];

            const studentMap = new Map(studentsData.map((s: any) => [s.id, s]));

            const overviewList = classesData.map((cls: any) => {
                const classFee = classFeesData.find((cf: any) => cf.class_id === cls.id) || null;
                
                // Find student fees for students in this class
                const classStudentFees = studentFeesData.filter((sf: any) => {
                    const student = studentMap.get(sf.student_id);
                    if (!student) return false;
                    const studentClassId = student.class_id || sf.class_id;
                    return studentClassId === cls.id;
                });

                const customStudents: any[] = [];
                for (const sf of classStudentFees) {
                    const student = studentMap.get(sf.student_id);
                    if (!student) continue;

                    let isCustom = false;
                    if (!classFee) {
                        isCustom = Number(sf.total_amount) > 0;
                    } else {
                        isCustom = 
                            Number(sf.total_amount) !== Number(classFee.total_fee) ||
                            Number(sf.admission_fee) !== Number(classFee.admission_fee) ||
                            Number(sf.tuition_fee) !== Number(classFee.tuition_fee) ||
                            Number(sf.betterment_fee) !== Number(classFee.betterment_fee) ||
                            Number(sf.sports_fee) !== Number(classFee.sports_fee) ||
                            Number(sf.reading_room_fee) !== Number(classFee.reading_room_fee) ||
                            Number(sf.medical_fee) !== Number(classFee.medical_fee) ||
                            Number(sf.laboratory_fee) !== Number(classFee.laboratory_fee) ||
                            Number(sf.ave_fee) !== Number(classFee.ave_fee) ||
                            Number(sf.swf) !== Number(classFee.swf) ||
                            Number(sf.tbf) !== Number(classFee.tbf) ||
                            Number(sf.examination_fee) !== Number(classFee.examination_fee) ||
                            Number(sf.fines) !== Number(classFee.fines) ||
                            Number(sf.others) !== Number(classFee.others);
                    }

                    if (isCustom) {
                        customStudents.push({
                            studentId: student.id,
                            studentFeeId: sf.id,
                            fullName: student.full_name,
                            rollNumber: student.roll_number,
                            totalAmount: sf.total_amount,
                            fees: {
                                admission_fee: Number(sf.admission_fee) || 0,
                                tuition_fee: Number(sf.tuition_fee) || 0,
                                betterment_fee: Number(sf.betterment_fee) || 0,
                                sports_fee: Number(sf.sports_fee) || 0,
                                reading_room_fee: Number(sf.reading_room_fee) || 0,
                                medical_fee: Number(sf.medical_fee) || 0,
                                laboratory_fee: Number(sf.laboratory_fee) || 0,
                                ave_fee: Number(sf.ave_fee) || 0,
                                swf: Number(sf.swf) || 0,
                                tbf: Number(sf.tbf) || 0,
                                examination_fee: Number(sf.examination_fee) || 0,
                                fines: Number(sf.fines) || 0,
                                others: Number(sf.others) || 0
                            }
                        });
                    }
                }

                // Sort custom students by roll number or name
                customStudents.sort((a, b) => {
                    if (a.rollNumber && b.rollNumber) return a.rollNumber - b.rollNumber;
                    return a.fullName.localeCompare(b.fullName);
                });

                return {
                    classId: cls.id,
                    className: cls.class_name,
                    section: cls.section,
                    classFee,
                    customStudents
                };
            });

            setPublishedOverview(overviewList);
        } catch (error) {
            console.error('Error fetching published overview:', error);
        }
    };

    const fetchStudentCustomFees = async (studentId: string) => {
        if (!currentYear) return;
        try {
            const { data, error } = await supabase
                .from('student_fees')
                .select('*')
                .eq('student_id', studentId)
                .eq('academic_year_id', currentYear.id)
                .maybeSingle();

            if (error) throw error;

            if (data && data.total_amount > 0) {
                setFees({
                    admission_fee: Number(data.admission_fee) || 0,
                    tuition_fee: Number(data.tuition_fee) || 0,
                    betterment_fee: Number(data.betterment_fee) || 0,
                    sports_fee: Number(data.sports_fee) || 0,
                    reading_room_fee: Number(data.reading_room_fee) || 0,
                    medical_fee: Number(data.medical_fee) || 0,
                    laboratory_fee: Number(data.laboratory_fee) || 0,
                    ave_fee: Number(data.ave_fee) || 0,
                    swf: Number(data.swf) || 0,
                    tbf: Number(data.tbf) || 0,
                    examination_fee: Number(data.examination_fee) || 0,
                    fines: Number(data.fines) || 0,
                    others: Number(data.others) || 0
                });
            } else {
                fetchExistingFees();
            }
        } catch (error) {
            console.error('Error fetching student custom fees:', error);
            fetchExistingFees();
        }
    };

    const fetchExistingFees = async () => {
        if (!currentYear) return;
        if (editingStudentId) return;
        try {
            const { data } = await supabase
                .from('class_fees')
                .select('*')
                .eq('class_id', selectedClassId)
                .eq('academic_year_id', currentYear.id)
                .maybeSingle();

            if (editingStudentId) return;
            if (applyTo === 'students' && selectedStudentIds.length === 1) return;

            if (data) {
                setFees({
                    admission_fee: Number(data.admission_fee) || 0,
                    tuition_fee: Number(data.tuition_fee) || 0,
                    betterment_fee: Number(data.betterment_fee) || 0,
                    sports_fee: Number(data.sports_fee) || 0,
                    reading_room_fee: Number(data.reading_room_fee) || 0,
                    medical_fee: Number(data.medical_fee) || 0,
                    laboratory_fee: Number(data.laboratory_fee) || 0,
                    ave_fee: Number(data.ave_fee) || 0,
                    swf: Number(data.swf) || 0,
                    tbf: Number(data.tbf) || 0,
                    examination_fee: Number(data.examination_fee) || 0,
                    fines: Number(data.fines) || 0,
                    others: Number(data.others) || 0
                });
            } else {
                setFees(initialFeeState);
            }
        } catch (error) {
            setFees(initialFeeState);
        }
    };

    const handleFeeChange = (key: keyof FeeBreakdown, value: string) => {
        const numValue = value === '' ? 0 : parseFloat(value);
        setFees(prev => ({ ...prev, [key]: numValue }));
    };

    const calculateTotal = () => {
        return Object.values(fees).reduce((sum, val) => sum + val, 0);
    };

    const handleSave = async () => {
        if (!selectedClassId || !currentYear) return;

        const totalAmount = calculateTotal();
        if (totalAmount === 0) {
            alert('Please enter at least one fee amount');
            return;
        }

        setSaving(true);
        try {
            if (applyTo === 'class') {
                // Save class fees default structure
                const { error: classFeeErr } = await supabase
                    .from('class_fees')
                    .upsert({
                        class_id: selectedClassId,
                        academic_year_id: currentYear.id,
                        ...fees,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'class_id,academic_year_id' });

                if (classFeeErr) throw classFeeErr;

                // Update student_fees for all students in class
                if (students.length > 0) {
                    const studentIds = students.map(s => s.id);
                    
                    const { data: existingStudentFees } = await supabase
                        .from('student_fees')
                        .select('student_id, amount_paid')
                        .in('student_id', studentIds)
                        .eq('academic_year_id', currentYear.id);

                    const existingFeeMap = new Map(existingStudentFees?.map(sf => [sf.student_id, sf.amount_paid || 0]) || []);

                    const studentFeesToUpsert = studentIds.map(studentId => {
                        const paidAmount = existingFeeMap.get(studentId) || 0;
                        const pendingAmount = totalAmount - paidAmount;
                        return {
                            student_id: studentId,
                            class_id: selectedClassId,
                            academic_year_id: currentYear.id,
                            total_amount: totalAmount,
                            amount_paid: paidAmount,
                            amount_pending: pendingAmount,
                            ...fees,
                            updated_at: new Date().toISOString()
                        };
                    });

                    const { error: studentFeeErr } = await supabase
                        .from('student_fees')
                        .upsert(studentFeesToUpsert, { onConflict: 'student_id,academic_year_id' });

                    if (studentFeeErr) throw studentFeeErr;
                }

                alert('Class fees saved and applied to all class students successfully!');
            } else {
                // Apply to selected individual students only
                if (selectedStudentIds.length === 0) {
                    alert('Please select at least one student.');
                    setSaving(false);
                    return;
                }

                const { data: existingStudentFees } = await supabase
                    .from('student_fees')
                    .select('student_id, amount_paid')
                    .in('student_id', selectedStudentIds)
                    .eq('academic_year_id', currentYear.id);

                const existingFeeMap = new Map(existingStudentFees?.map(sf => [sf.student_id, sf.amount_paid || 0]) || []);

                const studentFeesToUpsert = selectedStudentIds.map(studentId => {
                    const paidAmount = existingFeeMap.get(studentId) || 0;
                    const pendingAmount = totalAmount - paidAmount;
                    return {
                        student_id: studentId,
                        class_id: selectedClassId,
                        academic_year_id: currentYear.id,
                        total_amount: totalAmount,
                        amount_paid: paidAmount,
                        amount_pending: pendingAmount,
                        ...fees,
                        updated_at: new Date().toISOString()
                    };
                });

                const { error: studentFeeErr } = await supabase
                    .from('student_fees')
                    .upsert(studentFeesToUpsert, { onConflict: 'student_id,academic_year_id' });

                if (studentFeeErr) throw studentFeeErr;

                alert(`Fees successfully configured and published for ${selectedStudentIds.length} student(s)!`);
            }
            fetchPublishedFees(); // Refresh table
            fetchPublishedOverview(); // Refresh overview
        } catch (error: any) {
            console.error('Error saving fees:', error);
            alert('Error saving fees: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (feeId: string, className: string) => {
        if (!confirm(`Are you sure you want to delete the published fees for ${className}?`)) return;

        try {
            const feeToDelete = publishedFees.find(f => f.id === feeId);
            if (!feeToDelete) throw new Error('Fee record not found locally');

            const { class_id } = feeToDelete;

            // Delete from class_fees
            const { error: deleteClassFeeErr } = await supabase
                .from('class_fees')
                .delete()
                .eq('id', feeId);
            if (deleteClassFeeErr) throw deleteClassFeeErr;

            // Delete corresponding student_fees records for students of this class in the current academic year
            if (currentYear) {
                const { data: classStudents } = await supabase
                    .from('students')
                    .select('id')
                    .eq('class_id', class_id);

                if (classStudents && classStudents.length > 0) {
                    const studentIds = classStudents.map(s => s.id);
                    const { error: deleteStudentFeesErr } = await supabase
                        .from('student_fees')
                        .delete()
                        .in('student_id', studentIds)
                        .eq('academic_year_id', currentYear.id);

                    if (deleteStudentFeesErr) throw deleteStudentFeesErr;
                }
            }

            // Refresh logic
            fetchPublishedFees();
            fetchPublishedOverview();
            if (class_id === selectedClassId) {
                setFees(initialFeeState); // Reset form if we deleted the currently selected class
            }
            alert('Fee deleted successfully!');
        } catch (error: any) {
            console.error('Error deleting fee:', error);
            alert('Error deleting fee: ' + error.message);
        }
    };

    const handleReset = () => {
        if (applyTo === 'students' && selectedStudentIds.length === 1) {
            fetchStudentCustomFees(selectedStudentIds[0]);
        } else {
            fetchExistingFees();
        }
    };

    const handleEditStudentFee = (classId: string, studentId: string) => {
        setApplyTo('students');
        if (selectedClassId === classId) {
            setSelectedStudentIds([studentId]);
        } else {
            setEditingStudentId(studentId);
            setSelectedClassId(classId);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteStudentFee = async (
        studentFeeId: string,
        studentId: string,
        classId: string,
        studentName: string,
        classFee: any
    ) => {
        if (!confirm(`Are you sure you want to revert/delete the custom fee for ${studentName}?`)) return;

        try {
            if (classFee) {
                // Fetch current paid amount
                const { data: sfRow } = await supabase
                    .from('student_fees')
                    .select('amount_paid')
                    .eq('id', studentFeeId)
                    .single();

                const paidAmount = sfRow?.amount_paid || 0;
                const totalAmount = classFee.total_fee;
                const pendingAmount = totalAmount - paidAmount;

                // Revert to class default structure
                const { error } = await supabase
                    .from('student_fees')
                    .upsert({
                        id: studentFeeId,
                        student_id: studentId,
                        class_id: classId,
                        academic_year_id: currentYear?.id,
                        total_amount: totalAmount,
                        amount_paid: paidAmount,
                        amount_pending: pendingAmount,
                        admission_fee: classFee.admission_fee,
                        tuition_fee: classFee.tuition_fee,
                        betterment_fee: classFee.betterment_fee,
                        sports_fee: classFee.sports_fee,
                        reading_room_fee: classFee.reading_room_fee,
                        medical_fee: classFee.medical_fee,
                        laboratory_fee: classFee.laboratory_fee,
                        ave_fee: classFee.ave_fee,
                        swf: classFee.swf,
                        tbf: classFee.tbf,
                        examination_fee: classFee.examination_fee,
                        fines: classFee.fines,
                        others: classFee.others,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'student_id,academic_year_id' });

                if (error) throw error;
                alert(`Reverted ${studentName}'s fee structure to class default successfully.`);
            } else {
                // No class fee exists, delete custom fee row completely
                const { error } = await supabase
                    .from('student_fees')
                    .delete()
                    .eq('id', studentFeeId);

                if (error) throw error;
                alert(`Deleted custom fee structure for ${studentName}.`);
            }

            // Refresh UI
            fetchPublishedOverview();
            // Also reset current inputs if it was this student
            if (applyTo === 'students' && selectedStudentIds.includes(studentId)) {
                handleReset();
            }
        } catch (error: any) {
            console.error('Error deleting custom student fee:', error);
            alert('Error deleting custom student fee: ' + error.message);
        }
    };

    const handleEditRow = (classId: string) => {
        setSelectedClassId(classId);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (loading) return <div className="loading">Loading...</div>;

    const feeItems: { key: keyof FeeBreakdown; label: string }[] = [
        { key: 'admission_fee', label: 'Admission/Re-Admission Fee' },
        { key: 'tuition_fee', label: 'Tuition Fee' },
        { key: 'betterment_fee', label: 'Betterment Fee' },
        { key: 'sports_fee', label: 'Sports Fee' },
        { key: 'reading_room_fee', label: 'Reading Room Fee' },
        { key: 'medical_fee', label: 'Medical Fee' },
        { key: 'laboratory_fee', label: 'Laboratory Fee' },
        { key: 'ave_fee', label: 'AVE Fee' },
        { key: 'swf', label: 'SWF' },
        { key: 'tbf', label: 'TBF' },
        { key: 'examination_fee', label: 'Examination Fee' },
        { key: 'fines', label: 'Fines' },
        { key: 'others', label: 'Others' }
    ];

    return (
        <div className="set-fees-page">
            <div className="page-header">
                <button className="back-btn" onClick={() => navigate('/billing')}>
                    <ChevronLeft size={20} />
                    Back to Billing
                </button>
                <div className="header-titles">
                    <h1>Set School Fees</h1>
                    <p>Configure class-wise fee structures for the Current Academic Year</p>
                </div>
            </div>

            <div className="config-box">
                <div className="selection-row">
                    <div className="select-group">
                        <label>Select Class to Configure</label>
                        <select
                            value={selectedClassId}
                            onChange={(e) => setSelectedClassId(e.target.value)}
                        >
                            {classes.map(cls => (
                                <option key={cls.id} value={cls.id}>
                                    {cls.class_name} {cls.section ? `- ${cls.section}` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="select-group">
                        <label>Apply Fees To</label>
                        <div className="toggle-container" style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                            <button
                                type="button"
                                className={`toggle-btn ${applyTo === 'class' ? 'active' : ''}`}
                                onClick={() => setApplyTo('class')}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    border: '1px solid #E5E7EB',
                                    background: applyTo === 'class' ? '#0071E3' : '#FFFFFF',
                                    color: applyTo === 'class' ? '#FFFFFF' : '#1D1D1F',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Whole Class
                            </button>
                            <button
                                type="button"
                                className={`toggle-btn ${applyTo === 'students' ? 'active' : ''}`}
                                onClick={() => setApplyTo('students')}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    border: '1px solid #E5E7EB',
                                    background: applyTo === 'students' ? '#0071E3' : '#FFFFFF',
                                    color: applyTo === 'students' ? '#FFFFFF' : '#1D1D1F',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Individual Students
                            </button>
                        </div>
                    </div>

                    <div className="select-group">
                        <label>Academic Year</label>
                        <div className="current-year-display">
                            {currentYear ? currentYear.year_name : 'No Active Year'} (Current)
                        </div>
                    </div>
                </div>

                {applyTo === 'students' && (
                    <div className="student-checklist-section" style={{
                        marginTop: '20px',
                        padding: '20px',
                        background: '#F9FAFB',
                        borderRadius: '12px',
                        border: '1px solid #E5E7EB'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1D1D1F' }}>
                                Select Students ({selectedStudentIds.length} selected)
                            </h3>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', cursor: 'pointer', fontWeight: '500', color: '#4B5563' }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedStudentIds.length === students.length && students.length > 0}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedStudentIds(students.map(s => s.id));
                                            } else {
                                                setSelectedStudentIds([]);
                                            }
                                        }}
                                    />
                                    Select All
                                </label>
                                <input
                                    type="text"
                                    placeholder="Filter by name..."
                                    value={studentSearchQuery}
                                    onChange={(e) => setStudentSearchQuery(e.target.value)}
                                    style={{
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        border: '1px solid #D1D5DB',
                                        fontSize: '14px',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                        </div>

                        {fetchingStudents ? (
                            <div style={{ color: '#6B7280', fontSize: '14px' }}>Loading students...</div>
                        ) : students.length === 0 ? (
                            <div style={{ color: '#6B7280', fontSize: '14px' }}>No students found in this class.</div>
                        ) : (
                            <div className="student-grid" style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                                gap: '12px',
                                maxHeight: '200px',
                                overflowY: 'auto',
                                padding: '8px',
                                background: '#FFFFFF',
                                border: '1px solid #E5E7EB',
                                borderRadius: '8px'
                            }}>
                                {students
                                    .filter(s => s.full_name.toLowerCase().includes(studentSearchQuery.toLowerCase()))
                                    .map(student => {
                                        const isSelected = selectedStudentIds.includes(student.id);
                                        return (
                                            <label
                                                key={student.id}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    padding: '8px 12px',
                                                    background: isSelected ? '#EFF6FF' : '#FFFFFF',
                                                    border: `1px solid ${isSelected ? '#3B82F6' : '#E5E7EB'}`,
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    fontSize: '14px',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedStudentIds([...selectedStudentIds, student.id]);
                                                        } else {
                                                            setSelectedStudentIds(selectedStudentIds.filter(id => id !== student.id));
                                                        }
                                                    }}
                                                />
                                                <span style={{ fontWeight: '500', color: '#1D1D1F' }}>
                                                    {student.roll_number ? `#${student.roll_number} ` : ''}
                                                    {student.full_name}
                                                </span>
                                            </label>
                                        );
                                    })}
                            </div>
                        )}
                    </div>
                )}

                <div className="fee-form">
                    <div className="form-header">
                        <h2 className="section-title">Fee Breakdown</h2>
                        <div className="total-badge">
                            Total Annual Fee: ₹{calculateTotal().toLocaleString()}
                        </div>
                    </div>

                    <div className="fee-grid">
                        {feeItems.map((item, index) => (
                            <div className="fee-field" key={item.key}>
                                <div className="field-label-group">
                                    <span className="field-index">{index + 1}.</span>
                                    <label>{item.label}</label>
                                </div>
                                <div className="input-with-symbol">
                                    <span className="currency-symbol">₹</span>
                                    <input
                                        type="number"
                                        value={fees[item.key] === 0 ? '' : fees[item.key]}
                                        onChange={(e) => handleFeeChange(item.key, e.target.value)}
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="form-actions">
                        <button
                            className="reset-btn"
                            onClick={handleReset}
                        >
                            <RotateCcw size={18} />
                            Reset Changes
                        </button>
                        <button
                            className="save-btn"
                            disabled={saving || !currentYear}
                            onClick={handleSave}
                        >
                            <Save size={18} />
                            {saving ? 'Saving...' : 'Publish Fee Structure'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Published Fees Overview */}
            <div className="config-box" style={{ marginTop: '24px' }}>
                <div className="form-header" style={{ marginBottom: '20px' }}>
                    <h2 className="section-title">Published Fees Overview</h2>
                    <p style={{ color: '#6B7280', margin: 0 }}>View class-wide structures and individual student custom configurations for {currentYear?.year_name}</p>
                </div>

                {publishedOverview.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280', background: '#F9FAFB', borderRadius: '12px' }}>
                        No fees have been published for the current academic year yet.
                    </div>
                ) : (
                    <div className="published-overview-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {publishedOverview.map((item) => {
                            const isExpanded = expandedClassIds.includes(item.classId);
                            const className = `${item.className}${item.section ? ` - ${item.section}` : ''}`;
                            const hasFees = item.classFee || item.customStudents.length > 0;
                            
                            return (
                                <div 
                                    key={item.classId} 
                                    style={{
                                        border: '1px solid #E5E7EB',
                                        borderRadius: '12px',
                                        overflow: 'hidden',
                                        background: '#FFFFFF',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                        opacity: hasFees ? 1 : 0.8,
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    {/* Class Accordion Header */}
                                    <div 
                                        onClick={() => {
                                            if (isExpanded) {
                                                setExpandedClassIds(expandedClassIds.filter(id => id !== item.classId));
                                            } else {
                                                setExpandedClassIds([...expandedClassIds, item.classId]);
                                            }
                                        }}
                                        style={{
                                            padding: '16px 20px',
                                            background: isExpanded ? '#F9FAFB' : '#FFFFFF',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            cursor: 'pointer',
                                            userSelect: 'none',
                                            borderBottom: isExpanded ? '1px solid #E5E7EB' : 'none',
                                            transition: 'background-color 0.2s ease'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <span style={{ 
                                                fontSize: '16px', 
                                                fontWeight: '600', 
                                                color: '#1D1D1F' 
                                            }}>
                                                {className}
                                            </span>
                                            {item.classFee && (
                                                <span style={{
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    background: '#E0F2FE',
                                                    color: '#0369A1',
                                                    padding: '2px 8px',
                                                    borderRadius: '12px'
                                                }}>
                                                    Class Default: ₹{Number(item.classFee.total_fee).toLocaleString()}
                                                </span>
                                            )}
                                            {item.customStudents.length > 0 && (
                                                <span style={{
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    background: '#FEF3C7',
                                                    color: '#D97706',
                                                    padding: '2px 8px',
                                                    borderRadius: '12px'
                                                }}>
                                                    {item.customStudents.length} Customized Student{item.customStudents.length > 1 ? 's' : ''}
                                                </span>
                                            )}
                                            {!hasFees && (
                                                <span style={{
                                                    fontSize: '12px',
                                                    color: '#9CA3AF',
                                                    fontStyle: 'italic'
                                                }}>
                                                    No fees configured
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ 
                                                transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', 
                                                transition: 'transform 0.2s ease',
                                                display: 'inline-block',
                                                color: '#6B7280'
                                            }}>
                                                ▶
                                            </span>
                                        </div>
                                    </div>

                                    {/* Class Accordion Body */}
                                    {isExpanded && (
                                        <div style={{ padding: '20px', background: '#FFFFFF' }}>
                                            {/* Section 1: Class Default Structure */}
                                            <div style={{ marginBottom: '20px' }}>
                                                <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '600', color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                    Class-Wide Default Fee
                                                </h4>
                                                {item.classFee ? (
                                                    <div style={{ 
                                                        display: 'flex', 
                                                        justifyContent: 'space-between', 
                                                        alignItems: 'center', 
                                                        background: '#F3F4F6', 
                                                        padding: '12px 16px', 
                                                        borderRadius: '8px' 
                                                    }}>
                                                        <div>
                                                            <span style={{ fontWeight: '600', color: '#1D1D1F' }}>
                                                                Standard Class Fee: ₹{Number(item.classFee.total_fee).toLocaleString()}
                                                            </span>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                            <button
                                                                onClick={() => handleEditRow(item.classId)}
                                                                style={{ padding: '6px 12px', background: '#EFF6FF', color: '#3B82F6', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                            >
                                                                <Edit2 size={14} /> Edit
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(item.classFee.id, className)}
                                                                style={{ padding: '6px 12px', background: '#FEF2F2', color: '#EF4444', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                            >
                                                                <Trash2 size={14} /> Delete
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div style={{ color: '#6B7280', fontSize: '14px', padding: '12px', background: '#F9FAFB', borderRadius: '8px', border: '1px dashed #D1D5DB' }}>
                                                        No class-wide default fee is currently configured.
                                                    </div>
                                                )}
                                            </div>

                                            {/* Section 2: Individual Custom Student Fees */}
                                            <div>
                                                <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '600', color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                    Custom Student Fees
                                                </h4>
                                                {item.customStudents.length === 0 ? (
                                                    <div style={{ color: '#6B7280', fontSize: '14px', padding: '12px', background: '#F9FAFB', borderRadius: '8px', border: '1px dashed #D1D5DB' }}>
                                                        No students in this class have customized fees.
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                        {item.customStudents.map((stud: any) => (
                                                            <div 
                                                                key={stud.studentId}
                                                                style={{
                                                                    display: 'flex',
                                                                    justifyContent: 'space-between',
                                                                    alignItems: 'center',
                                                                    border: '1px solid #E5E7EB',
                                                                    padding: '10px 16px',
                                                                    borderRadius: '8px',
                                                                    background: '#FFFBEB'
                                                                }}
                                                            >
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                    <span style={{ fontWeight: '500', color: '#1D1D1F' }}>
                                                                        {stud.rollNumber ? `#${stud.rollNumber} ` : ''}
                                                                        {stud.fullName}
                                                                    </span>
                                                                    <span style={{ 
                                                                        fontSize: '13px', 
                                                                        fontWeight: '600', 
                                                                        color: '#D97706' 
                                                                    }}>
                                                                        (Custom Total: ₹{stud.totalAmount.toLocaleString()})
                                                                    </span>
                                                                </div>
                                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                                    <button
                                                                        onClick={() => handleEditStudentFee(item.classId, stud.studentId)}
                                                                        style={{ padding: '6px 12px', background: '#EFF6FF', color: '#3B82F6', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                                    >
                                                                        <Edit2 size={14} /> Edit
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteStudentFee(stud.studentFeeId, stud.studentId, item.classId, stud.fullName, item.classFee)}
                                                                        style={{ padding: '6px 12px', background: '#FEF2F2', color: '#EF4444', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                                    >
                                                                        <Trash2 size={14} /> Revert
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
