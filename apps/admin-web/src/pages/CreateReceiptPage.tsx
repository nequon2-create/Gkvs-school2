import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
    ChevronLeft,
    Printer,
    Edit3,
    Search
} from 'lucide-react';
import './CreateReceiptPage.css';

interface StudentData {
    id?: string;
    registration_number: string;
    full_name: string;
    parent_name: string;
    class_name: string;
    section: string;
    roll_number: string;
    academic_year_id: string;
}

interface FeeItem {
    id: number;
    label_kn: string;
    label_en: string;
    amount: number;
}

export function CreateReceiptPage() {
    const navigate = useNavigate();
    const [saving, setSaving] = useState(false);

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
        academic_year_id: ''
    });

    // 13 Fee Categories matching the physical receipt
    const [feeItems, setFeeItems] = useState<FeeItem[]>([
        { id: 1, label_kn: 'ಪ್ರವೇಶ/ಪುನಃ ಪ್ರವೇಶ', label_en: 'Admn./Re-Admfn. Fee', amount: 0 },
        { id: 2, label_kn: 'ಬೋಧನಾ ಶುಲ್ಕ', label_en: 'Tuition Fee', amount: 0 },
        { id: 3, label_kn: 'ಅಭಿವೃದ್ಧಿ ಶುಲ್ಕ', label_en: 'Betterment Fee', amount: 0 },
        { id: 4, label_kn: 'ಕ್ರೀಡಾ ಶುಲ್ಕ', label_en: 'Sports Fee', amount: 0 },
        { id: 5, label_kn: 'ವಾಚನಾಲಯ ಶುಲ್ಕ', label_en: 'Reading Room Fee', amount: 0 },
        { id: 6, label_kn: 'ವೈದ್ಯಕೀಯ ಶುಲ್ಕ', label_en: 'Medical Fee', amount: 0 },
        { id: 7, label_kn: 'ಪ್ರಯೋಗಶಾಲಾ ಶುಲ್ಕ', label_en: 'Laboratory Fee', amount: 0 },
        { id: 8, label_kn: 'ಶ್ರವಣ-ದೃಶ್ಯ ಶಿಕ್ಷಣ ಶುಲ್ಕ', label_en: 'AVE Fee', amount: 0 },
        { id: 9, label_kn: 'ವಿದ್ಯಾರ್ಥಿ ಕ್ಷೇಮಾಭಿವೃದ್ಧಿ ನಿಧಿ', label_en: 'SWF', amount: 0 },
        { id: 10, label_kn: 'ಉಾಧಯಾಯರ ಕಲ್ಯಾಣ ನಿಧಿ', label_en: 'TBF', amount: 0 },
        { id: 11, label_kn: 'ಪರೀಕ್ಷಾ ಶುಲ್ಕ', label_en: 'Examination Fee', amount: 0 },
        { id: 12, label_kn: 'ದಂಡ', label_en: 'Fines', amount: 0 },
        { id: 13, label_kn: 'ಇತರೆ', label_en: 'Others', amount: 0 }
    ]);

    const [amountPaid, setAmountPaid] = useState<number>(0);
    const [rupeesInWords, setRupeesInWords] = useState('');
    const [paymentMode, setPaymentMode] = useState('Cash');

    // Search logic
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);

    useEffect(() => {
        fetchLastReceiptNumber();
        fetchCurrentAcademicYear();
    }, []);

    const fetchLastReceiptNumber = async () => {
        const { count } = await supabase.from('fee_receipts').select('*', { count: 'exact', head: true });
        setReceiptNumber(((count || 0) + 1).toString().padStart(4, '0'));
    };

    const fetchCurrentAcademicYear = async () => {
        const { data } = await supabase.from('academic_years').select('id').eq('is_current', true).single();
        if (data) setStudentInfo(prev => ({ ...prev, academic_year_id: data.id }));
    };

    const searchStudents = async (query: string) => {
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }
        const { data } = await supabase
            .from('students')
            .select('*, classes(class_name, section), academic_years(id)')
            .or(`registration_number.ilike.%${query}%,full_name.ilike.%${query}%`)
            .limit(5);
        setSearchResults(data || []);
    };

    const handleSelectStudent = (student: any) => {
        setStudentInfo({
            id: student.id,
            registration_number: student.registration_number || '',
            full_name: student.full_name || '',
            parent_name: student.parent_name || '',
            class_name: student.classes?.class_name || '',
            section: student.classes?.section || '',
            roll_number: student.roll_number || '',
            academic_year_id: student.academic_year_id || studentInfo.academic_year_id
        });
        setSearchQuery('');
        setSearchResults([]);
    };

    const handleFeeAmountChange = (id: number, val: string) => {
        const amount = parseFloat(val) || 0;
        setFeeItems(prev => prev.map(item => item.id === id ? { ...item, amount } : item));
    };

    const totalAmount = feeItems.reduce((sum, item) => sum + item.amount, 0);

    const handleSaveAndPrint = async () => {
        if (!studentInfo.full_name) {
            alert('Please fill student name');
            return;
        }

        if (totalAmount === 0) {
            alert('Please enter at least one fee amount');
            return;
        }

        if (!studentInfo.id) {
            const proceed = window.confirm("Warning: No student was selected from the search list. This receipt will PRINT but will NOT be saved to the student app. Do you want to continue?");
            if (!proceed) return;
        }

        setSaving(true);
        try {
            // Save to database if student exists, or just print if manual
            if (studentInfo.id) {
                const { error } = await supabase.from('fee_receipts').insert([{
                    receipt_number: parseInt(receiptNumber),
                    student_id: studentInfo.id,
                    academic_year_id: studentInfo.academic_year_id,
                    receipt_date: receiptDate,
                    total_amount: totalAmount,
                    amount_paid: amountPaid || totalAmount,
                    amount_pending: totalAmount - (amountPaid || totalAmount),
                    payment_status: (amountPaid || totalAmount) >= totalAmount ? 'Paid' : 'Partial',
                    payment_mode: paymentMode,
                    admission_fee: feeItems[0].amount,
                    tuition_fee: feeItems[1].amount,
                    betterment_fee: feeItems[2].amount,
                    sports_fee: feeItems[3].amount,
                    reading_room_fee: feeItems[4].amount,
                    medical_fee: feeItems[5].amount,
                    laboratory_fee: feeItems[6].amount,
                    ave_fee: feeItems[7].amount,
                    swf: feeItems[8].amount,
                    tbf: feeItems[9].amount,
                    examination_fee: feeItems[10].amount,
                    fines: feeItems[11].amount,
                    others: feeItems[12].amount
                }]);
                if (error) throw error;
            }

            window.print();
            navigate('/billing');
        } catch (error: any) {
            alert('Error saving: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="create-receipt-page">
            <div className="page-header no-print">
                <button className="back-btn" onClick={() => navigate('/billing')}>
                    <ChevronLeft size={20} />
                    Back to Billing
                </button>
                <div className="header-actions">
                    <button className="print-save-btn" onClick={handleSaveAndPrint} disabled={saving}>
                        <Printer size={20} />
                        {saving ? 'Saving...' : 'Print Receipt'}
                    </button>
                </div>
            </div>

            <div className="receipt-builder-grid no-print">
                {/* Left: Input Form */}
                <div className="form-card">
                    <div className="card-header-row">
                        <Edit3 size={18} />
                        <h2>Fill Student Details</h2>
                        {!studentInfo.id && <span className="manual-badge">Manual Entry</span>}
                    </div>

                    <div className="search-mini">
                        <label>Search & Select (Required for App Sync)</label>
                        <div className="search-input-wrap">
                            <Search size={16} />
                            <input
                                type="text"
                                placeholder="Search student..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    searchStudents(e.target.value);
                                }}
                            />
                            {searchResults.length > 0 && (
                                <div className="mini-results">
                                    {searchResults.map(s => (
                                        <div key={s.id} onClick={() => handleSelectStudent(s)}>
                                            {s.full_name} ({s.registration_number})
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="form-grid-2">
                        <div className="input-group">
                            <label>Student Name</label>
                            <input
                                type="text"
                                value={studentInfo.full_name}
                                onChange={(e) => setStudentInfo({ ...studentInfo, full_name: e.target.value })}
                            />
                        </div>
                        <div className="input-group">
                            <label>S/o or D/o Name</label>
                            <input
                                type="text"
                                value={studentInfo.parent_name}
                                onChange={(e) => setStudentInfo({ ...studentInfo, parent_name: e.target.value })}
                            />
                        </div>
                        <div className="input-group">
                            <label>Registration No</label>
                            <input
                                type="text"
                                value={studentInfo.registration_number}
                                onChange={(e) => setStudentInfo({ ...studentInfo, registration_number: e.target.value })}
                            />
                        </div>
                        <div className="input-group">
                            <label>Class</label>
                            <input
                                type="text"
                                value={studentInfo.class_name}
                                onChange={(e) => setStudentInfo({ ...studentInfo, class_name: e.target.value })}
                            />
                        </div>
                        <div className="input-group">
                            <label>Roll No</label>
                            <input
                                type="text"
                                value={studentInfo.roll_number}
                                onChange={(e) => setStudentInfo({ ...studentInfo, roll_number: e.target.value })}
                            />
                        </div>
                        <div className="input-group">
                            <label>Section</label>
                            <input
                                type="text"
                                value={studentInfo.section}
                                onChange={(e) => setStudentInfo({ ...studentInfo, section: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="payment-metadata">
                        <div className="input-group">
                            <label>Receipt Date</label>
                            <input type="date" value={receiptDate} onChange={(e) => setReceiptDate(e.target.value)} />
                        </div>
                        <div className="input-group">
                            <label>Payment Mode</label>
                            <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
                                <option value="Cash">Cash</option>
                                <option value="UPI">UPI</option>
                                <option value="Card">Card</option>
                                <option value="Cheque">Cheque</option>
                                <option value="Bank Transfer">Bank Transfer</option>
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Actual Amount Paid (₹)</label>
                            <input
                                type="number"
                                value={amountPaid || ''}
                                onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                                placeholder={totalAmount.toString()}
                            />
                            <p className="input-hint">Leave blank if full amount paid</p>
                        </div>
                        <div className="input-group">
                            <label>Rupees in Words</label>
                            <input type="text" value={rupeesInWords} onChange={(e) => setRupeesInWords(e.target.value)} placeholder="e.g. Three Thousand Only" />
                        </div>
                    </div>
                </div>

                {/* Right: Fee Inputs */}
                <div className="fee-card">
                    <div className="card-header-row">
                        <span className="rupee-icon">₹</span>
                        <h2>Enter Fee Amounts</h2>
                    </div>
                    <div className="fee-inputs-list">
                        {feeItems.map(item => (
                            <div className="fee-input-row" key={item.id}>
                                <div className="label-col">
                                    <span className="kn-label">{item.label_kn}</span>
                                    <span className="en-label">{item.label_en}</span>
                                </div>
                                <div className="amount-col">
                                    <input
                                        type="number"
                                        value={item.amount || ''}
                                        onChange={(e) => handleFeeAmountChange(item.id, e.target.value)}
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="total-summary">
                        <span>TOTAL:</span>
                        <span className="amount-text">₹{totalAmount.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* FORMAL RECEIPT FOR PRINTING */}
            <div className="physical-receipt-print">
                <div className="receipt-border">
                    <div className="receipt-header-main">
                        <span className="receipt-title-kn">ಫೀ ರಶೀದಿ ಪುಸ್ತಕ</span>
                        <span className="receipt-divider"> / </span>
                        <span className="receipt-title-en">Fee Receipt Book</span>
                    </div>

                    <div className="school-info-section">
                        <div className="school-logo">
                            <img src="/logo.jpeg" alt="Logo" />
                        </div>
                        <div className="school-names">
                            <h1 className="main-school-name">Grameen Krida vasati shale sharan sirasagi</h1>
                            <p className="school-location">SHARAN SIRASAGI, GULBARGA</p>
                        </div>
                    </div>

                    <div className="top-meta-row">
                        <div className="meta-left">
                            <span>ನಂ.</span>
                            <span className="field-label-en">No.</span>
                            <span className="handwritten-val">{receiptNumber}</span>
                        </div>
                        <div className="meta-right">
                            <span>ದಿನಾಂಕ</span>
                            <span className="field-label-en">Date:</span>
                            <span className="handwritten-val">{new Date(receiptDate).toLocaleDateString('en-GB')}</span>
                        </div>
                    </div>

                    <div className="student-detail-row">
                        <span>ವಿದ್ಯಾರ್ಥಿ/ನಿ ಹೆಸರು: </span>
                        <span className="field-label-en">Name of the Student: </span>
                        <span className="handwritten-val-full">{studentInfo.full_name} {(studentInfo.parent_name) ? `S/o ${studentInfo.parent_name}` : ''}</span>
                    </div>

                    <div className="class-detail-row">
                        <div className="class-col">
                            <span>ತರಗತಿ/ </span>
                            <span className="field-label-en">Class:</span>
                            <span className="handwritten-val">{studentInfo.class_name}</span>
                        </div>
                        <div className="roll-col">
                            <span>ರೋಲ್ ನಂ./ </span>
                            <span className="field-label-en">Roll No.:</span>
                            <span className="handwritten-val">{studentInfo.roll_number}</span>
                        </div>
                        <div className="sec-col">
                            <span>ವಿಭಾಗ/ </span>
                            <span className="field-label-en">Sec.:</span>
                            <span className="handwritten-val">{studentInfo.section}</span>
                        </div>
                    </div>

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
                                    <td className="center">{item.id}.</td>
                                    <td>
                                        <span className="table-kn">{item.label_kn} / </span>
                                        <span className="table-en">{item.label_en}</span>
                                    </td>
                                    <td className="amount-cell">
                                        {item.amount > 0 ? `${item.amount}.00` : ''}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan={2} className="total-label">
                                    <span className="kn-bold">ಒಟ್ಟು / </span>
                                    <span className="en-bold">TOTAL</span>
                                </td>
                                <td className="total-amount-val">{totalAmount}.00</td>
                            </tr>
                        </tfoot>
                    </table>

                    <div className="words-section">
                        <span className="kn-small">ರೂಪಾಯಿ (ಅಕ್ಷರಗಳಲ್ಲಿ) : </span>
                        <span className="en-small">Rupees in words: </span>
                        <span className="handwritten-words">{rupeesInWords}</span>
                    </div>

                    <div className="signature-line-area">
                        <div className="sign-box">
                            <div className="sign-dashed"></div>
                            <span className="kn-small">ಸಹಿ / </span>
                            <span className="en-small">Signature</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
