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

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (selectedClassId && currentYear) {
            fetchExistingFees();
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

        setSaving(true);
        try {
            const { error } = await supabase
                .from('class_fees')
                .upsert({
                    class_id: selectedClassId,
                    academic_year_id: currentYear.id,
                    ...fees,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'class_id,academic_year_id' });

            if (error) throw error;
            alert('Fees saved successfully!');
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
                        <label>Academic Year</label>
                        <div className="current-year-display">
                            {currentYear ? currentYear.year_name : 'No Active Year'} (Current)
                        </div>
                    </div>
                </div>

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
