import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
    ChevronLeft,
    Save,
    RotateCcw,
    Layers,
    Package
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

export interface ItemFeeBreakdown {
    uniform: number;
    books: number;
    van: number;
    tie_belt: number;
    shoes: number;
}

const initialItemFeeState: ItemFeeBreakdown = {
    uniform: 0,
    books: 0,
    van: 0,
    tie_belt: 0,
    shoes: 0
};

export const ANCILLARY_ITEMS = [
    { key: 'uniform', label_en: 'School Dress / Uniform', label_kn: 'ಶಾಲಾ ಸಮವಸ್ತ್ರ ಶುಲ್ಕ', icon: '👔' },
    { key: 'books', label_en: 'Books Fee', label_kn: 'ಪುಸ್ತಕಗಳ ಶುಲ್ಕ', icon: '📚' },
    { key: 'van', label_en: 'Van / Transport Fee', label_kn: 'ವಾಹನ / ಸಾರಿಗೆ ಶುಲ್ಕ', icon: '🚌' },
    { key: 'tie_belt', label_en: 'Tie & Belt Fee', label_kn: 'ಟೈ ಮತ್ತು ಬೆಲ್ಟ್ ಶುಲ್ಕ', icon: '🎗️' },
    { key: 'shoes', label_en: 'Shoes Fee', label_kn: 'ಶೂಸ್ / ಪಾದರಕ್ಷೆ ಶುಲ್ಕ', icon: '👟' },
] as const;

export function SetFeesPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [classes, setClasses] = useState<Class[]>([]);
    const [currentYear, setCurrentYear] = useState<AcademicYear | null>(null);

    // Category: Academic Year Fee vs 5 Ancillary Items Fee
    const [feeCategory, setFeeCategory] = useState<'academic' | 'items'>('academic');

    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [fees, setFees] = useState<FeeBreakdown>(initialFeeState);
    const [itemFees, setItemFees] = useState<ItemFeeBreakdown>(initialItemFeeState);

    // Whole Class vs Individual Students
    const [applyTo, setApplyTo] = useState<'class' | 'students'>('class');
    const [students, setStudents] = useState<any[]>([]);
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const [studentSearchQuery, setStudentSearchQuery] = useState<string>('');
    const [fetchingStudents, setFetchingStudents] = useState(false);

    // Accordion / Overview states
    const [publishedOverview, setPublishedOverview] = useState<any[]>([]);
    const [itemPublishedOverview, setItemPublishedOverview] = useState<any[]>([]);

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (selectedClassId && currentYear) {
            if (feeCategory === 'academic') {
                fetchExistingFees();
            } else {
                fetchExistingItemFees();
            }
            fetchStudents(selectedClassId);
        }
    }, [selectedClassId, currentYear, feeCategory]);

    useEffect(() => {
        if (currentYear) {
            fetchPublishedOverview();
            fetchItemOverview();
        }
    }, [currentYear]);

    // When exactly one student is selected in individual mode, load custom structure
    useEffect(() => {
        if (applyTo === 'students' && selectedStudentIds.length === 1) {
            if (feeCategory === 'academic') {
                fetchStudentCustomFees(selectedStudentIds[0]);
            } else {
                fetchStudentCustomItemFees(selectedStudentIds[0]);
            }
        } else {
            if (feeCategory === 'academic') {
                fetchExistingFees();
            } else {
                fetchExistingItemFees();
            }
        }
    }, [selectedStudentIds, applyTo, feeCategory]);

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
        } catch (error) {
            console.error('Error fetching initial data:', error);
        } finally {
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
            setSelectedStudentIds([]);
        } catch (error) {
            console.error('Error fetching students:', error);
        } finally {
            setFetchingStudents(false);
        }
    };

    const fetchExistingFees = async () => {
        if (!selectedClassId || !currentYear) return;
        try {
            const { data } = await supabase
                .from('class_fees')
                .select('*')
                .eq('class_id', selectedClassId)
                .eq('academic_year_id', currentYear.id)
                .single();

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

    const fetchExistingItemFees = async () => {
        if (!selectedClassId || !currentYear) return;
        try {
            const { data } = await supabase
                .from('class_item_fees')
                .select('*')
                .eq('class_id', selectedClassId)
                .eq('academic_year_id', currentYear.id);

            const nextItems: ItemFeeBreakdown = { ...initialItemFeeState };
            if (data && data.length > 0) {
                data.forEach((row: any) => {
                    if (row.item_type in nextItems) {
                        (nextItems as any)[row.item_type] = Number(row.amount) || 0;
                    }
                });
            }
            setItemFees(nextItems);
        } catch (error) {
            setItemFees(initialItemFeeState);
        }
    };

    const fetchStudentCustomFees = async (studentId: string) => {
        if (!currentYear) return;
        try {
            const { data } = await supabase
                .from('student_fees')
                .select('*')
                .eq('student_id', studentId)
                .eq('academic_year_id', currentYear.id)
                .single();

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
            }
        } catch (error) {
            fetchExistingFees();
        }
    };

    const fetchStudentCustomItemFees = async (studentId: string) => {
        if (!currentYear) return;
        try {
            const { data } = await supabase
                .from('student_item_fees')
                .select('*')
                .eq('student_id', studentId)
                .eq('academic_year_id', currentYear.id);

            if (data && data.length > 0) {
                const nextItems: ItemFeeBreakdown = { ...initialItemFeeState };
                data.forEach((row: any) => {
                    if (row.item_type in nextItems) {
                        (nextItems as any)[row.item_type] = Number(row.amount_total) || 0;
                    }
                });
                setItemFees(nextItems);
            } else {
                fetchExistingItemFees();
            }
        } catch (error) {
            fetchExistingItemFees();
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

            const classesData = classesRes.data || [];
            const classFeesData = classFeesRes.data || [];
            const studentFeesData = studentFeesRes.data || [];
            const studentsData = studentsRes.data || [];
            const studentMap = new Map(studentsData.map((s: any) => [s.id, s]));

            const overviewList = classesData.map((cls: any) => {
                const classFee = classFeesData.find((cf: any) => cf.class_id === cls.id) || null;
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
                        isCustom = Number(sf.total_amount) !== Number(classFee.total_fee);
                    }

                    if (isCustom) {
                        customStudents.push({
                            studentId: student.id,
                            studentFeeId: sf.id,
                            fullName: student.full_name,
                            rollNumber: student.roll_number,
                            totalAmount: Number(sf.total_amount) || 0
                        });
                    }
                }

                return {
                    classId: cls.id,
                    className: `${cls.class_name}${cls.section ? ' - ' + cls.section : ''}`,
                    classFee,
                    customStudents
                };
            });

            setPublishedOverview(overviewList);
        } catch (error) {
            console.error('Error fetching overview:', error);
        }
    };

    const fetchItemOverview = async () => {
        if (!currentYear) return;
        try {
            const [classesRes, classItemRes, studentItemRes, studentsRes] = await Promise.all([
                supabase.from('classes').select('*').order('numeric_value', { ascending: true }),
                supabase.from('class_item_fees').select('*').eq('academic_year_id', currentYear.id),
                supabase.from('student_item_fees').select('*').eq('academic_year_id', currentYear.id),
                supabase.from('students').select('id, full_name, roll_number, class_id').eq('academic_year_id', currentYear.id).eq('is_active', true)
            ]);

            const classesData = classesRes.data || [];
            const classItemData = classItemRes.data || [];
            const studentItemData = studentItemRes.data || [];
            const studentsData = studentsRes.data || [];
            const studentMap = new Map(studentsData.map((s: any) => [s.id, s]));

            const overviewList = classesData.map((cls: any) => {
                const classItems = classItemData.filter((ci: any) => ci.class_id === cls.id);
                const classStudentItems = studentItemData.filter((si: any) => {
                    const student = studentMap.get(si.student_id);
                    if (!student) return false;
                    return (student.class_id || si.class_id) === cls.id;
                });

                return {
                    classId: cls.id,
                    className: `${cls.class_name}${cls.section ? ' - ' + cls.section : ''}`,
                    classItems,
                    studentItemsCount: classStudentItems.length
                };
            });

            setItemPublishedOverview(overviewList);
        } catch (error) {
            console.error('Error fetching item overview:', error);
        }
    };

    const handleInputChange = (field: keyof FeeBreakdown, value: string) => {
        const numValue = value === '' ? 0 : parseFloat(value);
        setFees(prev => ({
            ...prev,
            [field]: isNaN(numValue) ? 0 : numValue
        }));
    };

    const handleItemInputChange = (itemKey: keyof ItemFeeBreakdown, value: string) => {
        const numValue = value === '' ? 0 : parseFloat(value);
        setItemFees(prev => ({
            ...prev,
            [itemKey]: isNaN(numValue) ? 0 : numValue
        }));
    };

    const calculateTotal = () => {
        return Object.values(fees).reduce((sum, val) => sum + val, 0);
    };

    const calculateItemTotal = () => {
        return Object.values(itemFees).reduce((sum, val) => sum + val, 0);
    };

    const handleReset = () => {
        if (window.confirm('Are you sure you want to reset all fee fields to 0?')) {
            if (feeCategory === 'academic') {
                setFees(initialFeeState);
            } else {
                setItemFees(initialItemFeeState);
            }
        }
    };

    // Save Academic Year Fees
    const handleSaveAcademicFees = async () => {
        if (!selectedClassId || !currentYear) return;
        const totalAmount = calculateTotal();
        if (totalAmount === 0) {
            alert('Please enter at least one fee amount');
            return;
        }

        setSaving(true);
        try {
            if (applyTo === 'class') {
                const { error: classFeeErr } = await supabase
                    .from('class_fees')
                    .upsert({
                        class_id: selectedClassId,
                        academic_year_id: currentYear.id,
                        ...fees,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'class_id,academic_year_id' });

                if (classFeeErr) throw classFeeErr;

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
                        const pendingAmount = Math.max(0, totalAmount - paidAmount);
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
                alert('Academic fees saved and applied to all class students successfully!');
            } else {
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
                    const pendingAmount = Math.max(0, totalAmount - paidAmount);
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

                alert(`Academic fees published for ${selectedStudentIds.length} student(s)!`);
            }
            fetchPublishedOverview();
        } catch (error: any) {
            console.error('Error saving fees:', error);
            alert('Error saving fees: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    // Save 5 Ancillary Items Fees
    const handleSaveItemFees = async () => {
        if (!selectedClassId || !currentYear) return;
        const totalItemsAmount = calculateItemTotal();
        if (totalItemsAmount === 0) {
            alert('Please enter at least one item fee amount');
            return;
        }

        setSaving(true);
        try {
            if (applyTo === 'class') {
                // Upsert into class_item_fees for each non-zero item
                for (const item of ANCILLARY_ITEMS) {
                    const amount = itemFees[item.key as keyof ItemFeeBreakdown];
                    const { error } = await supabase
                        .from('class_item_fees')
                        .upsert({
                            class_id: selectedClassId,
                            academic_year_id: currentYear.id,
                            item_type: item.key,
                            amount: amount,
                            updated_at: new Date().toISOString()
                        }, { onConflict: 'class_id,academic_year_id,item_type' });

                    if (error) throw error;
                }

                // Apply to students in class
                if (students.length > 0) {
                    const studentIds = students.map(s => s.id);
                    for (const item of ANCILLARY_ITEMS) {
                        const amount = itemFees[item.key as keyof ItemFeeBreakdown];
                        // Fetch existing paid amounts
                        const { data: existingRows } = await supabase
                            .from('student_item_fees')
                            .select('student_id, amount_paid')
                            .in('student_id', studentIds)
                            .eq('academic_year_id', currentYear.id)
                            .eq('item_type', item.key);

                        const existingPaidMap = new Map(existingRows?.map(r => [r.student_id, r.amount_paid || 0]) || []);

                        const rowsToUpsert = studentIds.map(studentId => {
                            const paid = existingPaidMap.get(studentId) || 0;
                            return {
                                student_id: studentId,
                                class_id: selectedClassId,
                                academic_year_id: currentYear.id,
                                item_type: item.key,
                                amount_total: amount,
                                amount_paid: paid,
                                amount_pending: Math.max(0, amount - paid),
                                updated_at: new Date().toISOString()
                            };
                        });

                        const { error: upsertErr } = await supabase
                            .from('student_item_fees')
                            .upsert(rowsToUpsert, { onConflict: 'student_id,academic_year_id,item_type' });

                        if (upsertErr) throw upsertErr;
                    }
                }
                alert('Ancillary item fees saved for whole class successfully!');
            } else {
                if (selectedStudentIds.length === 0) {
                    alert('Please select at least one student.');
                    setSaving(false);
                    return;
                }

                for (const item of ANCILLARY_ITEMS) {
                    const amount = itemFees[item.key as keyof ItemFeeBreakdown];
                    const { data: existingRows } = await supabase
                        .from('student_item_fees')
                        .select('student_id, amount_paid')
                        .in('student_id', selectedStudentIds)
                        .eq('academic_year_id', currentYear.id)
                        .eq('item_type', item.key);

                    const existingPaidMap = new Map(existingRows?.map(r => [r.student_id, r.amount_paid || 0]) || []);

                    const rowsToUpsert = selectedStudentIds.map(studentId => {
                        const paid = existingPaidMap.get(studentId) || 0;
                        return {
                            student_id: studentId,
                            class_id: selectedClassId,
                            academic_year_id: currentYear.id,
                            item_type: item.key,
                            amount_total: amount,
                            amount_paid: paid,
                            amount_pending: Math.max(0, amount - paid),
                            updated_at: new Date().toISOString()
                        };
                    });

                    const { error: upsertErr } = await supabase
                        .from('student_item_fees')
                        .upsert(rowsToUpsert, { onConflict: 'student_id,academic_year_id,item_type' });

                    if (upsertErr) throw upsertErr;
                }

                alert(`Ancillary item fees published for ${selectedStudentIds.length} student(s)!`);
            }
            fetchItemOverview();
        } catch (error: any) {
            console.error('Error saving item fees:', error);
            alert('Error saving item fees: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleSave = () => {
        if (feeCategory === 'academic') {
            handleSaveAcademicFees();
        } else {
            handleSaveItemFees();
        }
    };

    return (
        <div className="set-fees-page">
            <div className="page-header">
                <button className="back-btn" onClick={() => navigate('/billing')}>
                    <ChevronLeft size={20} />
                    <span>Back to Billing</span>
                </button>
                <div className="header-titles">
                    <h1>Fee Structure Management</h1>
                    <p>Configure Academic Year Fees and 5 Ancillary Item Fees for classes or individual students</p>
                </div>
            </div>

            {/* Apple-Style Segmented Category Control */}
            <div style={{
                display: 'inline-flex',
                background: '#F1F5F9',
                padding: '4px',
                borderRadius: '12px',
                marginBottom: '24px',
                gap: '4px'
            }}>
                <button
                    type="button"
                    onClick={() => setFeeCategory('academic')}
                    style={{
                        padding: '10px 20px',
                        borderRadius: '9px',
                        border: 'none',
                        background: feeCategory === 'academic' ? '#FFFFFF' : 'transparent',
                        color: feeCategory === 'academic' ? '#0F172A' : '#64748B',
                        fontWeight: 700,
                        fontSize: '14px',
                        boxShadow: feeCategory === 'academic' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s ease'
                    }}
                >
                    <Layers size={16} color={feeCategory === 'academic' ? '#2563EB' : '#64748B'} />
                    Academic Year Fees
                </button>
                <button
                    type="button"
                    onClick={() => setFeeCategory('items')}
                    style={{
                        padding: '10px 20px',
                        borderRadius: '9px',
                        border: 'none',
                        background: feeCategory === 'items' ? '#FFFFFF' : 'transparent',
                        color: feeCategory === 'items' ? '#0F172A' : '#64748B',
                        fontWeight: 700,
                        fontSize: '14px',
                        boxShadow: feeCategory === 'items' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s ease'
                    }}
                >
                    <Package size={16} color={feeCategory === 'items' ? '#2563EB' : '#64748B'} />
                    5 Ancillary Items (Uniform, Books, Van, Tie/Belt, Shoes)
                </button>
            </div>

            <div className="config-box">
                <div className="selection-row">
                    <div className="select-group">
                        <label>Select Target Class</label>
                        <select
                            value={selectedClassId}
                            onChange={(e) => {
                                setSelectedClassId(e.target.value);
                                setSelectedStudentIds([]);
                            }}
                            disabled={loading || saving}
                        >
                            {classes.map((cls) => (
                                <option key={cls.id} value={cls.id}>
                                    {cls.class_name} {cls.section ? `(${cls.section})` : ''}
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
                                    placeholder="Search student..."
                                    value={studentSearchQuery}
                                    onChange={(e) => setStudentSearchQuery(e.target.value)}
                                    style={{
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        border: '1px solid #D1D5DB',
                                        fontSize: '13px'
                                    }}
                                />
                            </div>
                        </div>

                        {fetchingStudents ? (
                            <p style={{ color: '#6B7280', fontSize: '14px' }}>Loading students...</p>
                        ) : students.length === 0 ? (
                            <p style={{ color: '#6B7280', fontSize: '14px' }}>No students enrolled in this class.</p>
                        ) : (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                                gap: '8px',
                                maxHeight: '200px',
                                overflowY: 'auto',
                                padding: '4px'
                            }}>
                                {students
                                    .filter(s => s.full_name.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
                                        (s.roll_number && s.roll_number.toString().includes(studentSearchQuery)))
                                    .map(student => (
                                        <label
                                            key={student.id}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                padding: '8px 12px',
                                                background: selectedStudentIds.includes(student.id) ? '#EFF6FF' : '#FFFFFF',
                                                border: selectedStudentIds.includes(student.id) ? '1px solid #3B82F6' : '1px solid #E5E7EB',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                fontSize: '13px',
                                                userSelect: 'none'
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedStudentIds.includes(student.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedStudentIds(prev => [...prev, student.id]);
                                                    } else {
                                                        setSelectedStudentIds(prev => prev.filter(id => id !== student.id));
                                                    }
                                                }}
                                            />
                                            <span style={{ fontWeight: '500', color: '#1F2937' }}>
                                                {student.roll_number ? `#${student.roll_number} ` : ''}{student.full_name}
                                            </span>
                                        </label>
                                    ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Academic Fee Configuration Grid */}
                {feeCategory === 'academic' ? (
                    <div className="fee-form-grid">
                        <div className="fee-card">
                            <div className="fee-card-header">
                                <h3>1. Admission / Re-Admission Fee</h3>
                                <p className="fee-sub">ಪ್ರವೇಶ / ಪುನಃ ಪ್ರವೇಶ ಶುಲ್ಕ</p>
                            </div>
                            <div className="fee-input-wrapper">
                                <span>₹</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={fees.admission_fee || ''}
                                    onChange={(e) => handleInputChange('admission_fee', e.target.value)}
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <div className="fee-card highlight">
                            <div className="fee-card-header">
                                <h3>2. Tuition Fee</h3>
                                <p className="fee-sub">ಬೋಧನಾ ಶುಲ್ಕ</p>
                            </div>
                            <div className="fee-input-wrapper">
                                <span>₹</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={fees.tuition_fee || ''}
                                    onChange={(e) => handleInputChange('tuition_fee', e.target.value)}
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <div className="fee-card">
                            <div className="fee-card-header">
                                <h3>3. Betterment Fee</h3>
                                <p className="fee-sub">ಅಭಿವೃದ್ಧಿ ಶುಲ್ಕ</p>
                            </div>
                            <div className="fee-input-wrapper">
                                <span>₹</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={fees.betterment_fee || ''}
                                    onChange={(e) => handleInputChange('betterment_fee', e.target.value)}
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <div className="fee-card">
                            <div className="fee-card-header">
                                <h3>4. Sports Fee</h3>
                                <p className="fee-sub">ಕ್ರೀಡಾ ಶುಲ್ಕ</p>
                            </div>
                            <div className="fee-input-wrapper">
                                <span>₹</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={fees.sports_fee || ''}
                                    onChange={(e) => handleInputChange('sports_fee', e.target.value)}
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <div className="fee-card">
                            <div className="fee-card-header">
                                <h3>5. Reading Room Fee</h3>
                                <p className="fee-sub">ವಾಚನಾಲಯ ಶುಲ್ಕ</p>
                            </div>
                            <div className="fee-input-wrapper">
                                <span>₹</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={fees.reading_room_fee || ''}
                                    onChange={(e) => handleInputChange('reading_room_fee', e.target.value)}
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <div className="fee-card">
                            <div className="fee-card-header">
                                <h3>6. Medical Fee</h3>
                                <p className="fee-sub">ವೈದ್ಯಕೀಯ ಶುಲ್ಕ</p>
                            </div>
                            <div className="fee-input-wrapper">
                                <span>₹</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={fees.medical_fee || ''}
                                    onChange={(e) => handleInputChange('medical_fee', e.target.value)}
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <div className="fee-card">
                            <div className="fee-card-header">
                                <h3>7. Laboratory Fee</h3>
                                <p className="fee-sub">ಪ್ರಯೋಗಶಾಲಾ ಶುಲ್ಕ</p>
                            </div>
                            <div className="fee-input-wrapper">
                                <span>₹</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={fees.laboratory_fee || ''}
                                    onChange={(e) => handleInputChange('laboratory_fee', e.target.value)}
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <div className="fee-card">
                            <div className="fee-card-header">
                                <h3>8. AVE Fee</h3>
                                <p className="fee-sub">ಶ್ರವಣ-ದೃಶ್ಯ ಶಿಕ್ಷಣ ಶುಲ್ಕ</p>
                            </div>
                            <div className="fee-input-wrapper">
                                <span>₹</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={fees.ave_fee || ''}
                                    onChange={(e) => handleInputChange('ave_fee', e.target.value)}
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <div className="fee-card">
                            <div className="fee-card-header">
                                <h3>9. SWF</h3>
                                <p className="fee-sub">ವಿದ್ಯಾರ್ಥಿ ಕ್ಷೇಮಾಭಿವೃದ್ಧಿ ನಿಧಿ</p>
                            </div>
                            <div className="fee-input-wrapper">
                                <span>₹</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={fees.swf || ''}
                                    onChange={(e) => handleInputChange('swf', e.target.value)}
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <div className="fee-card">
                            <div className="fee-card-header">
                                <h3>10. TBF</h3>
                                <p className="fee-sub">ಉಪಾಧ್ಯಾಯರ ಕಲ್ಯಾಣ ನಿಧಿ</p>
                            </div>
                            <div className="fee-input-wrapper">
                                <span>₹</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={fees.tbf || ''}
                                    onChange={(e) => handleInputChange('tbf', e.target.value)}
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <div className="fee-card">
                            <div className="fee-card-header">
                                <h3>11. Examination Fee</h3>
                                <p className="fee-sub">ಪರೀಕ್ಷಾ ಶುಲ್ಕ</p>
                            </div>
                            <div className="fee-input-wrapper">
                                <span>₹</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={fees.examination_fee || ''}
                                    onChange={(e) => handleInputChange('examination_fee', e.target.value)}
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <div className="fee-card">
                            <div className="fee-card-header">
                                <h3>12. Fines</h3>
                                <p className="fee-sub">ದಂಡ</p>
                            </div>
                            <div className="fee-input-wrapper">
                                <span>₹</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={fees.fines || ''}
                                    onChange={(e) => handleInputChange('fines', e.target.value)}
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <div className="fee-card">
                            <div className="fee-card-header">
                                <h3>13. Others</h3>
                                <p className="fee-sub">ಇತರೆ ಶುಲ್ಕಗಳು</p>
                            </div>
                            <div className="fee-input-wrapper">
                                <span>₹</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={fees.others || ''}
                                    onChange={(e) => handleInputChange('others', e.target.value)}
                                    placeholder="0"
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    /* 5 Ancillary Items Configuration Grid */
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: '20px',
                        marginTop: '24px'
                    }}>
                        {ANCILLARY_ITEMS.map((item) => (
                            <div
                                key={item.key}
                                style={{
                                    background: '#FFFFFF',
                                    border: '1px solid #E2E8F0',
                                    borderRadius: '16px',
                                    padding: '24px',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    gap: '16px'
                                }}
                            >
                                <div>
                                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>{item.icon}</div>
                                    <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>
                                        {item.label_en}
                                    </h3>
                                    <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>
                                        {item.label_kn}
                                    </p>
                                </div>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    background: '#F8FAFC',
                                    border: '1px solid #CBD5E1',
                                    borderRadius: '10px',
                                    padding: '0 12px'
                                }}>
                                    <span style={{ fontSize: '16px', fontWeight: 600, color: '#64748B', marginRight: '6px' }}>₹</span>
                                    <input
                                        type="number"
                                        min="0"
                                        value={itemFees[item.key as keyof ItemFeeBreakdown] || ''}
                                        onChange={(e) => handleItemInputChange(item.key as keyof ItemFeeBreakdown, e.target.value)}
                                        placeholder="0"
                                        style={{
                                            border: 'none',
                                            background: 'transparent',
                                            width: '100%',
                                            padding: '12px 0',
                                            fontSize: '16px',
                                            fontWeight: 700,
                                            color: '#0F172A',
                                            outline: 'none'
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="total-calculation-bar">
                    <div className="total-label">
                        <span>Total Set Fee</span>
                        <strong>
                            ₹ {feeCategory === 'academic' ? calculateTotal().toLocaleString() : calculateItemTotal().toLocaleString()}
                        </strong>
                    </div>

                    <div className="form-actions">
                        <button
                            type="button"
                            className="btn-reset"
                            onClick={handleReset}
                            disabled={saving}
                        >
                            <RotateCcw size={18} />
                            <span>Reset</span>
                        </button>

                        <button
                            type="button"
                            className="btn-save"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            <Save size={18} />
                            <span>
                                {saving ? 'Saving...' : feeCategory === 'academic' ? 'Publish Academic Fees' : 'Publish Ancillary Item Fees'}
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Overview / Existing Structures */}
            <div style={{ marginTop: '40px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A', marginBottom: '16px' }}>
                    {feeCategory === 'academic' ? 'Current Academic Fee Structures' : 'Current Ancillary Item Structures'}
                </h2>

                {feeCategory === 'academic' ? (
                    <div className="overview-accordion">
                        {publishedOverview.map((item: any) => (
                            <div key={item.classId} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', marginBottom: '12px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>{item.className}</h4>
                                    <span style={{ fontSize: '13px', color: '#64748B' }}>
                                        {item.classFee ? `Class Fee: ₹${Number(item.classFee.total_fee).toLocaleString()}` : 'No class fee configured'}
                                        {item.customStudents.length > 0 ? ` • ${item.customStudents.length} student(s) customized` : ''}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setSelectedClassId(item.classId)}
                                    style={{ padding: '6px 14px', background: '#EFF6FF', color: '#2563EB', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}
                                >
                                    Configure
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="overview-accordion">
                        {itemPublishedOverview.map((item: any) => (
                            <div key={item.classId} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', marginBottom: '12px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>{item.className}</h4>
                                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '6px' }}>
                                        {item.classItems.map((ci: any) => (
                                            <span key={ci.item_type} style={{ fontSize: '12px', background: '#F1F5F9', padding: '2px 8px', borderRadius: '6px', color: '#334155', fontWeight: 600 }}>
                                                {ci.item_type}: ₹{Number(ci.amount).toLocaleString()}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedClassId(item.classId)}
                                    style={{ padding: '6px 14px', background: '#EFF6FF', color: '#2563EB', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}
                                >
                                    Configure
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
