import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
    ChevronLeft,
    Printer,
    Search,
    AlertCircle,
    CheckCircle2,
    Layers,
    Package
} from 'lucide-react';
import './CreateReceiptPage.css';

interface StudentData {
    id?: string;
    registration_number: string;
    full_name: string;
    parent_name: string;
    class_name: string;
    class_id?: string;
    section: string;
    roll_number: string;
    academic_year_id: string;
    academic_year_name?: string;
}

interface FeeItem {
    id: number;
    label_kn: string;
    label_en: string;
    amount: number;
}

const ANCILLARY_OPTIONS = [
    { key: 'uniform', label_en: 'School Dress / Uniform', label_kn: 'ಶಾಲಾ ಸಮವಸ್ತ್ರ', icon: '👔' },
    { key: 'books', label_en: 'Books Fee', label_kn: 'ಪುಸ್ತಕಗಳ ಶುಲ್ಕ', icon: '📚' },
    { key: 'van', label_en: 'Van / Transport Fee', label_kn: 'ವಾಹನ / ಸಾರಿಗೆ', icon: '🚌' },
    { key: 'tie_belt', label_en: 'Tie & Belt Fee', label_kn: 'ಟೈ ಮತ್ತು ಬೆಲ್ಟ್', icon: '🎗️' },
    { key: 'shoes', label_en: 'Shoes Fee', label_kn: 'ಶೂಸ್ / ಪಾದರಕ್ಷೆ', icon: '👟' },
];

export function CreateReceiptPage() {
    const navigate = useNavigate();
    const [saving, setSaving] = useState(false);

    // Receipt Type: 'academic' vs 'item'
    const [receiptType, setReceiptType] = useState<'academic' | 'item'>('academic');
    const [selectedItemType, setSelectedItemType] = useState<string>('uniform');

    // Receipt Metadata
    const [receiptNumber, setReceiptNumber] = useState('');
    const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0]);

    // Student Info (Manual or Fetched)
    const [studentInfo, setStudentInfo] = useState<StudentData>({
        registration_number: '',
        full_name: '',
        parent_name: '',
        class_name: '',
        section: '',
        roll_number: '',
        academic_year_id: '',
        academic_year_name: ''
    });

    // Student Outstanding Balances
    const [balanceInfo, setBalanceInfo] = useState<{
        totalAmount: number;
        amountPaid: number;
        amountPending: number;
    }>({ totalAmount: 0, amountPaid: 0, amountPending: 0 });

    // 13 Academic Fee Categories
    const [feeItems, setFeeItems] = useState<FeeItem[]>([
        { id: 1, label_kn: 'ಪ್ರವೇಶ/ಪುನಃ ಪ್ರವೇಶ', label_en: 'Admn. / Re-Admn. Fee', amount: 0 },
        { id: 2, label_kn: 'ಬೋಧನಾ ಶುಲ್ಕ', label_en: 'Tuition Fee', amount: 0 },
        { id: 3, label_kn: 'ಅಭಿವೃದ್ಧಿ ಶುಲ್ಕ', label_en: 'Betterment Fee', amount: 0 },
        { id: 4, label_kn: 'ಕ್ರೀಡಾ ಶುಲ್ಕ', label_en: 'Sports Fee', amount: 0 },
        { id: 5, label_kn: 'ವಾಚನಾಲಯ ಶುಲ್ಕ', label_en: 'Reading Room Fee', amount: 0 },
        { id: 6, label_kn: 'ವೈದ್ಯಕೀಯ ಶುಲ್ಕ', label_en: 'Medical Fee', amount: 0 },
        { id: 7, label_kn: 'ಪ್ರಯೋಗಶಾಲಾ ಶುಲ್ಕ', label_en: 'Laboratory Fee', amount: 0 },
        { id: 8, label_kn: 'ಶ್ರವಣ-ದೃಶ್ಯ ಶಿಕ್ಷಣ ಶುಲ್ಕ', label_en: 'AVE Fee', amount: 0 },
        { id: 9, label_kn: 'ವಿದ್ಯಾರ್ಥಿ ಕ್ಷೇಮಾಭಿವೃದ್ಧಿ ನಿಧಿ', label_en: 'SWF', amount: 0 },
        { id: 10, label_kn: 'ಉಪಾಧ್ಯಾಯರ ಕಲ್ಯಾಣ ನಿಧಿ', label_en: 'TBF', amount: 0 },
        { id: 11, label_kn: 'ಪರೀಕ್ಷಾ ಶುಲ್ಕ', label_en: 'Examination Fee', amount: 0 },
        { id: 12, label_kn: 'ದಂಡ', label_en: 'Fines', amount: 0 },
        { id: 13, label_kn: 'ಇತರೆ', label_en: 'Others', amount: 0 }
    ]);

    // Item Fee amount for 'item' receipt mode
    const [itemAmount, setItemAmount] = useState<number>(0);

    const [amountPaid, setAmountPaid] = useState<number>(0);
    const [rupeesInWords, setRupeesInWords] = useState('');
    const [paymentMode, setPaymentMode] = useState('Cash');

    // Search logic
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);

    // Apple-Style Big Status Alert Modal
    const [alertModal, setAlertModal] = useState<{
        isOpen: boolean;
        type: 'error' | 'success';
        title: string;
        message: string;
        details?: string;
    }>({
        isOpen: false,
        type: 'error',
        title: '',
        message: ''
    });

    useEffect(() => {
        fetchReceiptNumber();
        fetchCurrentAcademicYear();
    }, [receiptType]);

    useEffect(() => {
        if (studentInfo.id) {
            fetchStudentBalances(studentInfo.id, studentInfo.academic_year_id);
        }
    }, [receiptType, selectedItemType]);

    const fetchReceiptNumber = async () => {
        try {
            if (receiptType === 'academic') {
                const { count } = await supabase
                    .from('fee_receipts')
                    .select('*', { count: 'exact', head: true })
                    .or('receipt_type.eq.academic,receipt_type.is.null');
                setReceiptNumber(((count || 0) + 1).toString().padStart(4, '0'));
            } else {
                const { count } = await supabase
                    .from('fee_receipts')
                    .select('*', { count: 'exact', head: true })
                    .eq('receipt_type', 'item');
                setReceiptNumber(((count || 0) + 1).toString());
            }
        } catch {
            setReceiptNumber('1');
        }
    };

    const fetchCurrentAcademicYear = async () => {
        const { data } = await supabase
            .from('academic_years')
            .select('id, year_name')
            .eq('is_current', true)
            .single();

        if (data) {
            setStudentInfo(prev => ({
                ...prev,
                academic_year_id: data.id,
                academic_year_name: data.year_name
            }));
        }
    };

    const searchStudents = async (query: string) => {
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }
        const { data } = await supabase
            .from('students')
            .select('*, classes(id, class_name, section), academic_years(id, year_name)')
            .or(`registration_number.ilike.%${query}%,full_name.ilike.%${query}%`)
            .limit(5);
        setSearchResults(data || []);
    };

    const fetchStudentBalances = async (studentId: string, academicYearId: string) => {
        try {
            if (receiptType === 'academic') {
                const { data } = await supabase
                    .from('student_fees')
                    .select('total_amount, amount_paid, amount_pending')
                    .eq('student_id', studentId)
                    .eq('academic_year_id', academicYearId)
                    .maybeSingle();

                if (data) {
                    setBalanceInfo({
                        totalAmount: Number(data.total_amount) || 0,
                        amountPaid: Number(data.amount_paid) || 0,
                        amountPending: Number(data.amount_pending) || 0
                    });
                } else {
                    setBalanceInfo({ totalAmount: 0, amountPaid: 0, amountPending: 0 });
                }
            } else {
                const { data } = await supabase
                    .from('student_item_fees')
                    .select('amount_total, amount_paid, amount_pending')
                    .eq('student_id', studentId)
                    .eq('academic_year_id', academicYearId)
                    .eq('item_type', selectedItemType)
                    .maybeSingle();

                if (data) {
                    setBalanceInfo({
                        totalAmount: Number(data.amount_total) || 0,
                        amountPaid: Number(data.amount_paid) || 0,
                        amountPending: Number(data.amount_pending) || 0
                    });
                    setItemAmount(Number(data.amount_pending) || Number(data.amount_total) || 0);
                    setAmountPaid(Number(data.amount_pending) || Number(data.amount_total) || 0);
                } else {
                    setBalanceInfo({ totalAmount: 0, amountPaid: 0, amountPending: 0 });
                    setItemAmount(0);
                    setAmountPaid(0);
                }
            }
        } catch (err) {
            console.error('Error fetching student balance:', err);
        }
    };

    const handleSelectStudent = (student: any) => {
        const cls = student.classes;
        const year = student.academic_years;

        setStudentInfo({
            id: student.id,
            registration_number: student.registration_number || '',
            full_name: student.full_name || '',
            parent_name: student.parent_name || '',
            class_name: cls?.class_name || '',
            class_id: cls?.id || student.class_id,
            section: cls?.section || '',
            roll_number: student.roll_number?.toString() || '',
            academic_year_id: year?.id || student.academic_year_id,
            academic_year_name: year?.year_name || studentInfo.academic_year_name
        });

        setSearchResults([]);
        setSearchQuery('');

        fetchStudentBalances(student.id, year?.id || student.academic_year_id);
    };

    const handleFeeAmountChange = (id: number, val: string) => {
        const amount = parseFloat(val) || 0;
        setFeeItems(prev => prev.map(item => item.id === id ? { ...item, amount } : item));
    };

    const totalAmount = receiptType === 'academic'
        ? feeItems.reduce((sum, item) => sum + item.amount, 0)
        : itemAmount;

    // Number to words converter
    const numberToWords = (num: number): string => {
        const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
        const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

        if ((num = num.toString() as any).length > 9) return 'overflow';
        let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
        if (!n) return '';
        let str = '';
        str += (Number(n[1]) != 0) ? (a[Number(n[1])] || b[n[1][0] as any] + ' ' + a[n[1][1] as any]) + 'Crore ' : '';
        str += (Number(n[2]) != 0) ? (a[Number(n[2])] || b[n[2][0] as any] + ' ' + a[n[2][1] as any]) + 'Lakh ' : '';
        str += (Number(n[3]) != 0) ? (a[Number(n[3])] || b[n[3][0] as any] + ' ' + a[n[3][1] as any]) + 'Thousand ' : '';
        str += (Number(n[4]) != 0) ? (a[Number(n[4])] || b[n[4][0] as any] + ' ' + a[n[4][1] as any]) + 'Hundred ' : '';
        str += (Number(n[5]) != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0] as any] + ' ' + a[n[5][1] as any]) + 'Only' : 'Only';
        return str;
    };

    useEffect(() => {
        const amt = amountPaid || totalAmount;
        if (amt > 0) {
            setRupeesInWords(numberToWords(amt));
        } else {
            setRupeesInWords('');
        }
    }, [amountPaid, totalAmount]);

    const handleSaveAndPrint = async () => {
        if (!studentInfo.full_name) {
            setAlertModal({
                isOpen: true,
                type: 'error',
                title: 'Missing Student Information',
                message: 'Please search and select a student or enter their name before issuing a receipt.'
            });
            return;
        }

        if (totalAmount === 0) {
            setAlertModal({
                isOpen: true,
                type: 'error',
                title: 'Zero Amount Receipt',
                message: 'Please enter a valid receipt amount greater than ₹0.'
            });
            return;
        }

        const effectivePayment = amountPaid || totalAmount;

        // Overpayment Guard Check
        if (studentInfo.id && balanceInfo.totalAmount > 0) {
            if (balanceInfo.amountPending <= 0) {
                setAlertModal({
                    isOpen: true,
                    type: 'error',
                    title: 'Fee Already Fully Paid!',
                    message: `This student has already fully paid their ${receiptType === 'academic' ? 'Academic Fee' : 'Item Fee'}. Remaining balance is ₹0.`,
                    details: `Total Fee: ₹${balanceInfo.totalAmount.toLocaleString()} | Total Paid: ₹${balanceInfo.amountPaid.toLocaleString()}`
                });
                return;
            }

            if (effectivePayment > balanceInfo.amountPending) {
                setAlertModal({
                    isOpen: true,
                    type: 'error',
                    title: 'Payment Exceeds Outstanding Due!',
                    message: `You entered ₹${effectivePayment.toLocaleString()}, but the remaining pending fee is only ₹${balanceInfo.amountPending.toLocaleString()}.`,
                    details: `Total Fee: ₹${balanceInfo.totalAmount.toLocaleString()} | Already Paid: ₹${balanceInfo.amountPaid.toLocaleString()} | Due: ₹${balanceInfo.amountPending.toLocaleString()}`
                });
                return;
            }
        }

        setSaving(true);
        try {
            if (studentInfo.id) {
                const insertPayload: any = {
                    student_id: studentInfo.id,
                    academic_year_id: studentInfo.academic_year_id,
                    receipt_date: receiptDate,
                    total_amount: totalAmount,
                    amount_paid: effectivePayment,
                    amount_pending: Math.max(0, totalAmount - effectivePayment),
                    payment_status: effectivePayment >= totalAmount ? 'Paid' : 'Partial',
                    payment_mode: paymentMode,
                    receipt_type: receiptType,
                    is_cancelled: false
                };

                if (receiptType === 'academic') {
                    insertPayload.receipt_number = parseInt(receiptNumber, 10) || 1;
                    insertPayload.admission_fee = feeItems[0].amount;
                    insertPayload.tuition_fee = feeItems[1].amount;
                    insertPayload.betterment_fee = feeItems[2].amount;
                    insertPayload.sports_fee = feeItems[3].amount;
                    insertPayload.reading_room_fee = feeItems[4].amount;
                    insertPayload.medical_fee = feeItems[5].amount;
                    insertPayload.laboratory_fee = feeItems[6].amount;
                    insertPayload.ave_fee = feeItems[7].amount;
                    insertPayload.swf = feeItems[8].amount;
                    insertPayload.tbf = feeItems[9].amount;
                    insertPayload.examination_fee = feeItems[10].amount;
                    insertPayload.fines = feeItems[11].amount;
                    insertPayload.others = feeItems[12].amount;
                } else {
                    insertPayload.item_type = selectedItemType;
                    insertPayload.item_receipt_number = parseInt(receiptNumber, 10) || 1;
                    insertPayload.receipt_number = parseInt(receiptNumber, 10) || 1;
                }

                const { error } = await supabase.from('fee_receipts').insert([insertPayload]);
                if (error) throw error;
            }

            setAlertModal({
                isOpen: true,
                type: 'success',
                title: 'Receipt Created Successfully!',
                message: `Receipt #${receiptNumber} for ₹${effectivePayment.toLocaleString()} has been recorded and synced to the database.`,
                details: studentInfo.full_name ? `Student: ${studentInfo.full_name} (${studentInfo.class_name})` : undefined
            });

            // Trigger physical print dialog
            window.print();
            fetchReceiptNumber();
        } catch (error: any) {
            console.error('Error generating receipt:', error);
            setAlertModal({
                isOpen: true,
                type: 'error',
                title: 'Failed to Save Receipt',
                message: error.message || 'An unexpected error occurred while saving the receipt.'
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="create-receipt-page">
            {/* Apple-Style Color-Coded Big Alert Modal */}
            {alertModal.isOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.45)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999
                }}>
                    <div style={{
                        width: '90%',
                        maxWidth: '480px',
                        backgroundColor: '#FFFFFF',
                        borderRadius: '24px',
                        padding: '32px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        borderTop: `6px solid ${alertModal.type === 'error' ? '#EF4444' : '#10B981'}`,
                        textAlign: 'center',
                        animation: 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            backgroundColor: alertModal.type === 'error' ? '#FEE2E2' : '#D1FAE5',
                            color: alertModal.type === 'error' ? '#EF4444' : '#10B981',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 16px auto'
                        }}>
                            {alertModal.type === 'error' ? <AlertCircle size={36} /> : <CheckCircle2 size={36} />}
                        </div>

                        <h2 style={{
                            fontSize: '22px',
                            fontWeight: 800,
                            color: alertModal.type === 'error' ? '#B91C1C' : '#047857',
                            marginBottom: '12px'
                        }}>
                            {alertModal.title}
                        </h2>

                        <p style={{
                            fontSize: '15px',
                            color: '#334155',
                            lineHeight: 1.5,
                            marginBottom: alertModal.details ? '12px' : '24px'
                        }}>
                            {alertModal.message}
                        </p>

                        {alertModal.details && (
                            <div style={{
                                backgroundColor: '#F8FAFC',
                                border: '1px solid #E2E8F0',
                                borderRadius: '12px',
                                padding: '12px 16px',
                                fontSize: '13px',
                                fontWeight: 600,
                                color: '#475569',
                                marginBottom: '24px'
                            }}>
                                {alertModal.details}
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
                            style={{
                                width: '100%',
                                padding: '14px',
                                borderRadius: '14px',
                                border: 'none',
                                backgroundColor: alertModal.type === 'error' ? '#EF4444' : '#10B981',
                                color: '#FFFFFF',
                                fontSize: '16px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                boxShadow: alertModal.type === 'error'
                                    ? '0 10px 15px -3px rgba(239, 68, 68, 0.3)'
                                    : '0 10px 15px -3px rgba(16, 185, 129, 0.3)'
                            }}
                        >
                            Got It
                        </button>
                    </div>
                </div>
            )}

            {/* Left Sidebar / Controls */}
            <div className="receipt-controls no-print">
                <button className="back-btn" onClick={() => navigate('/billing')}>
                    <ChevronLeft size={20} />
                    <span>Back to Billing</span>
                </button>

                <div className="controls-header">
                    <h2>Issue Official Receipt</h2>
                    <p>Select category, student, and print official receipt</p>
                </div>

                {/* Apple Cupertino Segmented Mode Toggle */}
                <div className="receipt-mode-toggle">
                    <button
                        type="button"
                        className={`mode-toggle-btn ${receiptType === 'academic' ? 'active' : ''}`}
                        onClick={() => setReceiptType('academic')}
                    >
                        <Layers size={15} /> Academic Fee
                    </button>
                    <button
                        type="button"
                        className={`mode-toggle-btn ${receiptType === 'item' ? 'active' : ''}`}
                        onClick={() => setReceiptType('item')}
                    >
                        <Package size={15} /> 5 Items Receipt
                    </button>
                </div>

                {/* If Item Receipt: Apple Interactive Visual Selection Tiles */}
                {receiptType === 'item' && (
                    <div style={{ marginBottom: '18px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '12px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            color: '#86868B',
                            marginBottom: '8px'
                        }}>
                            Select Ancillary Item
                        </label>
                        <div className="item-selection-grid">
                            {ANCILLARY_OPTIONS.map(opt => (
                                <div
                                    key={opt.key}
                                    className={`item-tile ${selectedItemType === opt.key ? 'selected' : ''}`}
                                    onClick={() => setSelectedItemType(opt.key)}
                                >
                                    <span className="item-tile-icon">{opt.icon}</span>
                                    <span className="item-tile-title">{opt.label_en.split('/')[0]}</span>
                                    <span className="item-tile-sub">{opt.label_kn}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Search Student */}
                <div className="control-group search-box-wrapper">
                    <label>Auto-Fill from Database</label>
                    <div className="search-input-box">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Type Student Name or Reg No..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                searchStudents(e.target.value);
                            }}
                        />
                    </div>

                    {searchResults.length > 0 && (
                        <div className="search-results-dropdown">
                            {searchResults.map((stu) => (
                                <div
                                    key={stu.id}
                                    className="search-item"
                                    onClick={() => handleSelectStudent(stu)}
                                >
                                    <strong>{stu.full_name}</strong>
                                    <span>{stu.classes?.class_name || 'No Class'} • Reg: {stu.registration_number}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Display Current Student Outstanding Balance */}
                {studentInfo.id && (
                    <div style={{
                        background: '#FFFFFF',
                        border: '1px solid rgba(0,0,0,0.08)',
                        borderRadius: '16px',
                        padding: '14px 18px',
                        marginBottom: '18px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                    }}>
                        <div style={{ fontSize: '11px', color: '#86868B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {receiptType === 'academic' ? 'Academic Fee Status' : `${selectedItemType.toUpperCase()} Status`}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '13px' }}>
                            <span>Total Set: <strong>₹{balanceInfo.totalAmount.toLocaleString()}</strong></span>
                            <span>Paid: <strong style={{ color: '#16A34A' }}>₹{balanceInfo.amountPaid.toLocaleString()}</strong></span>
                            <span>Due: <strong style={{ color: balanceInfo.amountPending > 0 ? '#DC2626' : '#16A34A' }}>₹{balanceInfo.amountPending.toLocaleString()}</strong></span>
                        </div>
                    </div>
                )}

                <div className="control-group-row">
                    <div className="control-group">
                        <label>Receipt No. {receiptType === 'item' ? '(Item Sequence)' : ''}</label>
                        <input
                            type="text"
                            value={receiptNumber}
                            onChange={(e) => setReceiptNumber(e.target.value)}
                        />
                    </div>
                    <div className="control-group">
                        <label>Date</label>
                        <input
                            type="date"
                            value={receiptDate}
                            onChange={(e) => setReceiptDate(e.target.value)}
                        />
                    </div>
                </div>

                {/* Amount Paid & Mode */}
                <div className="control-group-row">
                    <div className="control-group">
                        <label>Amount Paid (₹)</label>
                        <input
                            type="number"
                            value={amountPaid || totalAmount || ''}
                            onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                        />
                    </div>
                    <div className="control-group">
                        <label>Payment Mode</label>
                        <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
                            <option value="Cash">Cash</option>
                            <option value="Online / UPI">Online / UPI</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="Cheque">Cheque</option>
                        </select>
                    </div>
                </div>

                {/* If item receipt, editable item amount input */}
                {receiptType === 'item' && (
                    <div className="control-group" style={{ marginBottom: '16px' }}>
                        <label>Item Fee Amount (₹)</label>
                        <input
                            type="number"
                            value={itemAmount || ''}
                            onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setItemAmount(val);
                                setAmountPaid(val);
                            }}
                            placeholder="Enter amount..."
                        />
                    </div>
                )}

                <button
                    className="print-btn"
                    onClick={handleSaveAndPrint}
                    disabled={saving}
                >
                    <Printer size={18} />
                    <span>{saving ? 'Saving...' : 'Print & Save Official Receipt'}</span>
                </button>
            </div>

            {/* Right Printable Official Receipt Canvas */}
            <div className="receipt-preview-area">
                <div className="official-receipt-sheet" id="printable-receipt">
                    {/* Top School Header */}
                    <div className="receipt-header">
                        <div className="school-trust-name">ಅಪ್ಪಾಜಿ ಶಿಕ್ಷಣ ಸಂಸ್ಥೆ (ರಿ.) / Appaji Education Trust (R.)</div>
                        <h1 className="school-main-title">ಗ್ರಾಮೀಣ ಕ್ರೀಡಾ ವಸತಿ ಶಾಲೆ</h1>
                        <h2 className="school-sub-title">GRAMEENA KRIDA VASATI SHALE</h2>
                        <div className="school-address">ಶರಣ ಸಿರಸಗಿ, ಕಲಬುರಗಿ / Sharan Sirsagi, Kalaburagi</div>
                        <div className="receipt-badge-title">
                            {receiptType === 'academic' ? 'ಶುಲ್ಕ ರಸೀದಿ / FEE RECEIPT' : `ವಿಶೇಷ ಶುಲ್ಕ ರಸೀದಿ / ITEM FEE RECEIPT (${selectedItemType.toUpperCase()})`}
                        </div>
                    </div>

                    <div className="receipt-meta-row">
                        <div>
                            <span>ರಸೀದಿ ನಂ. / Receipt No.: </span>
                            <span className="handwritten-val bold">{receiptNumber}</span>
                        </div>
                        <div>
                            <span>ಶೈಕ್ಷಣಿಕ ವರ್ಷ / Year: </span>
                            <span className="handwritten-val bold">{studentInfo.academic_year_name || '2026-2027'}</span>
                        </div>
                        <div>
                            <span>ದಿನಾಂಕ / Date: </span>
                            <span className="handwritten-val">{receiptDate}</span>
                        </div>
                    </div>

                    <div className="student-detail-row">
                        <div className="field-group full-width">
                            <span>ವಿದ್ಯಾರ್ಥಿಯ ಹೆಸರು / </span>
                            <span className="field-label-en">Student Name:</span>
                            <span className="handwritten-val name-val">{studentInfo.full_name}</span>
                        </div>
                    </div>

                    <div className="student-detail-row">
                        <div className="field-group full-width">
                            <span>ತಂದೆಯ ಹೆಸರು / </span>
                            <span className="field-label-en">Father Name:</span>
                            <span className="handwritten-val name-val">{studentInfo.parent_name}</span>
                        </div>
                    </div>

                    <div className="class-detail-row">
                        <div>
                            <span>ತರಗತಿ/ </span>
                            <span className="field-label-en">Class:</span>
                            <span className="handwritten-val">{studentInfo.class_name}</span>
                        </div>
                        <div>
                            <span>ರೋಲ್ ನಂ./ </span>
                            <span className="field-label-en">Roll No.:</span>
                            <span className="handwritten-val">{studentInfo.roll_number}</span>
                        </div>
                        <div>
                            <span>ವಿಭಾಗ/ </span>
                            <span className="field-label-en">Sec.:</span>
                            <span className="handwritten-val">{studentInfo.section}</span>
                        </div>
                    </div>

                    {/* Table for Academic Fees vs Item Fees */}
                    {receiptType === 'academic' ? (
                        <table className="physical-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '10%' }}>Sl.No.</th>
                                    <th style={{ width: '60%', textAlign: 'left' }}>ವಿವರಗಳು/Particulars</th>
                                    <th style={{ width: '30%' }}>ರೂ./Rs.</th>
                                </tr>
                            </thead>
                            <tbody>
                                {feeItems.map(item => (
                                    <tr key={item.id}>
                                        <td style={{ textAlign: 'center' }}>{item.id}.</td>
                                        <td>
                                            <span>{item.label_kn} / </span>
                                            <span style={{ fontSize: '12px', color: '#333' }}>{item.label_en}</span>
                                        </td>
                                        <td className="amount-cell">
                                            <input
                                                type="number"
                                                min="0"
                                                value={item.amount || ''}
                                                onChange={(e) => handleFeeAmountChange(item.id, e.target.value)}
                                                placeholder="0.00"
                                                style={{ width: '80px', border: '1px solid #CBD5E1', borderRadius: '4px', textAlign: 'right', padding: '2px 4px' }}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colSpan={2} className="total-label">
                                        <strong>ಒಟ್ಟು / TOTAL</strong>
                                    </td>
                                    <td className="total-amount-val">{totalAmount}.00</td>
                                </tr>
                            </tfoot>
                        </table>
                    ) : (
                        <table className="physical-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '10%' }}>Sl.No.</th>
                                    <th style={{ width: '60%', textAlign: 'left' }}>ವಿವರಗಳು/Particulars</th>
                                    <th style={{ width: '30%' }}>ರೂ./Rs.</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style={{ textAlign: 'center' }}>1.</td>
                                    <td>
                                        <span>
                                            {ANCILLARY_OPTIONS.find(o => o.key === selectedItemType)?.label_kn} /{' '}
                                        </span>
                                        <span style={{ fontSize: '12px', color: '#333' }}>
                                            {ANCILLARY_OPTIONS.find(o => o.key === selectedItemType)?.label_en}
                                        </span>
                                    </td>
                                    <td className="amount-cell">
                                        {itemAmount > 0 ? `${itemAmount}.00` : ''}
                                    </td>
                                </tr>
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colSpan={2} className="total-label">
                                        <strong>ಒಟ್ಟು / TOTAL</strong>
                                    </td>
                                    <td className="total-amount-val">{totalAmount}.00</td>
                                </tr>
                            </tfoot>
                        </table>
                    )}

                    <div className="words-section">
                        <span>ರೂಪಾಯಿ (ಅಕ್ಷರಗಳಲ್ಲಿ) / Rupees in words: </span>
                        <span className="handwritten-words">{rupeesInWords}</span>
                    </div>

                    <div className="signature-line-area">
                        <div className="sign-box">
                            <div className="sign-dashed"></div>
                            <span style={{ fontSize: '11px', fontWeight: 'bold' }}>ಸಹಿ / Signature</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
