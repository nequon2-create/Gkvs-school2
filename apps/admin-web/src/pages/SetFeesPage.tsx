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
        }
    }, [currentYear]);

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
        setFetchingStudents(true);
        try {
            const { data, error } = await supabase
                .from('students')
                .select('id, full_name, roll_number, registration_number')
                .eq('class_id', classId)
                .order('roll_number', { ascending: true });

            if (error) throw error;
            setStudents(data || []);
            setSelectedStudentIds((data || []).map(s => s.id)); // Default to all selected
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

    const fetchExistingFees = async () => {
        if (!currentYear) return;
        try {
            const { data } = await supabase
                .from('class_fees')
                .select('*')
                .eq('class_id', selectedClassId)
                .eq('academic_year_id', currentYear.id)
                .maybeSingle();

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
                            academic_year_id: currentYear.id,
                            total_amount: totalAmount,
                            amount_paid: paidAmount,
                            amount_pending: pendingAmount,
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
                        academic_year_id: currentYear.id,
                        total_amount: totalAmount,
                        amount_paid: paidAmount,
                        amount_pending: pendingAmount,
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
            const { error } = await supabase.from('class_fees').delete().eq('id', feeId);
            if (error) throw error;

            // Refresh logic
            fetchPublishedFees();
            if (publishedFees.find(f => f.id === feeId)?.class_id === selectedClassId) {
                setFees(initialFeeState); // Reset form if we deleted the currently selected class
            }
            alert('Fee deleted successfully!');
        } catch (error: any) {
            console.error('Error deleting fee:', error);
            alert('Error deleting fee: ' + error.message);
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
                            onClick={() => fetchExistingFees()}
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

            {/* Published Class Fees Table */}
            <div className="config-box" style={{ marginTop: '24px' }}>
                <div className="form-header" style={{ marginBottom: '20px' }}>
                    <h2 className="section-title">Published Class Fees</h2>
                    <p style={{ color: '#6B7280', margin: 0 }}>Overview of all fees published for {currentYear?.year_name}</p>
                </div>

                {publishedFees.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280', background: '#F9FAFB', borderRadius: '12px' }}>
                        No class fees have been published for the current academic year yet.
                    </div>
                ) : (
                    <div className="published-fees-table">
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#F3F4F6', borderBottom: '2px solid #E5E7EB' }}>
                                    <th style={{ textAlign: 'left', padding: '16px', fontSize: '14px', fontWeight: '600', color: '#4B5563', textTransform: 'uppercase' }}>Class</th>
                                    <th style={{ textAlign: 'left', padding: '16px', fontSize: '14px', fontWeight: '600', color: '#4B5563', textTransform: 'uppercase' }}>Total Annual Fee</th>
                                    <th style={{ textAlign: 'right', padding: '16px', fontSize: '14px', fontWeight: '600', color: '#4B5563', textTransform: 'uppercase' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {publishedFees.map((fee: any) => {
                                    const className = `${fee.classes?.class_name} ${fee.classes?.section ? `- ${fee.classes.section}` : ''}`;
                                    return (
                                        <tr key={fee.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                                            <td style={{ padding: '16px', fontSize: '15px', fontWeight: '500', color: '#1D1D1F' }}>
                                                {className}
                                            </td>
                                            <td style={{ padding: '16px', fontSize: '15px', fontWeight: '600', color: '#10B981' }}>
                                                ₹{Number(fee.total_fee).toLocaleString()}
                                            </td>
                                            <td style={{ padding: '16px', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                                    <button
                                                        onClick={() => handleEditRow(fee.class_id)}
                                                        style={{ padding: '8px', background: '#EFF6FF', color: '#3B82F6', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                    >
                                                        <Edit2 size={16} /> Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(fee.id, className)}
                                                        style={{ padding: '8px', background: '#FEF2F2', color: '#EF4444', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                    >
                                                        <Trash2 size={16} /> Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
