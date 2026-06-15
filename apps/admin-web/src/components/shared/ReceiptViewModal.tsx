import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Printer } from 'lucide-react';
import './ReceiptViewModal.css';

interface ReceiptViewModalProps {
    receiptId: string;
    onClose: () => void;
}

interface ReceiptData {
    id: string;
    receipt_number: number;
    receipt_date: string;
    total_amount: number;
    amount_paid: number;
    payment_mode: string;
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
    student_id: string;
}

interface StudentData {
    full_name: string;
    parent_name: string;
    registration_number: string;
    roll_number: string;
    classes?: {
        class_name: string;
        section: string | null;
    } | null;
}

function numberToWords(num: number): string {
    if (num === 0) return 'Zero Only';
    
    const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    function convert(n: number): string {
        if (n < 20) return units[n];
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + units[n % 10] : '');
        if (n < 1000) return units[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + convert(n % 100) : '');
        if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + convert(n % 1000) : '');
        if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + convert(n % 100000) : '');
        return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + convert(n % 10000000) : '');
    }
    
    return convert(num) + ' Only';
}

export function ReceiptViewModal({ receiptId, onClose }: ReceiptViewModalProps) {
    const [loading, setLoading] = useState(true);
    const [receipt, setReceipt] = useState<ReceiptData | null>(null);
    const [student, setStudent] = useState<StudentData | null>(null);

    useEffect(() => {
        if (receiptId) {
            fetchReceiptDetails();
        }
    }, [receiptId]);

    const fetchReceiptDetails = async () => {
        setLoading(true);
        try {
            // 1. Fetch receipt data
            const { data: receiptData, error: receiptErr } = await supabase
                .from('fee_receipts')
                .select('*')
                .eq('id', receiptId)
                .single();

            if (receiptErr) throw receiptErr;

            if (receiptData) {
                setReceipt(receiptData);

                // 2. Fetch student details separately
                if (receiptData.student_id) {
                    const { data: studentData, error: studentErr } = await supabase
                        .from('students')
                        .select(`
                            full_name,
                            parent_name,
                            registration_number,
                            roll_number,
                            classes (
                                class_name,
                                section
                            )
                        `)
                        .eq('id', receiptData.student_id)
                        .single();

                    if (!studentErr && studentData) {
                        setStudent(studentData as any);
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching receipt in modal:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="receipt-modal-overlay no-print">
                <div className="receipt-modal-box loading-box">
                    <p>Loading receipt details...</p>
                    <button className="close-preview-btn-loading" onClick={onClose}>Close</button>
                </div>
            </div>
        );
    }

    if (!receipt) {
        return (
            <div className="receipt-modal-overlay no-print">
                <div className="receipt-modal-box loading-box">
                    <p className="text-red">Error: Receipt not found.</p>
                    <button className="close-preview-btn-loading" onClick={onClose}>Close</button>
                </div>
            </div>
        );
    }

    const feeItems = [
        { id: 1, label_kn: 'ಪ್ರವೇಶ/ಪುನಃ ಪ್ರವೇಶ', label_en: 'Admn. / Re-Admn. Fee', amount: Number(receipt.admission_fee) || 0 },
        { id: 2, label_kn: 'ಬೋಧನಾ ಶುಲ್ಕ', label_en: 'Tuition Fee', amount: Number(receipt.tuition_fee) || 0 },
        { id: 3, label_kn: 'ಅಭಿವೃದ್ಧಿ ಶುಲ್ಕ', label_en: 'Betterment Fee', amount: Number(receipt.betterment_fee) || 0 },
        { id: 4, label_kn: 'ಕ್ರೀಡಾ ಶುಲ್ಕ', label_en: 'Sports Fee', amount: Number(receipt.sports_fee) || 0 },
        { id: 5, label_kn: 'ವಾಚನಾಲಯ ಶುಲ್ಕ', label_en: 'Reading Room Fee', amount: Number(receipt.reading_room_fee) || 0 },
        { id: 6, label_kn: 'ವೈದ್ಯಕೀಯ ಶುಲ್ಕ', label_en: 'Medical Fee', amount: Number(receipt.medical_fee) || 0 },
        { id: 7, label_kn: 'ಪ್ರಯೋಗಶಾಲಾ ಶುಲ್ಕ', label_en: 'Laboratory Fee', amount: Number(receipt.laboratory_fee) || 0 },
        { id: 8, label_kn: 'ಶ್ರವಣ-ದೃಶ್ಯ ಶಿಕ್ಷಣ ಶುಲ್ಕ', label_en: 'AVE Fee', amount: Number(receipt.ave_fee) || 0 },
        { id: 9, label_kn: 'ವಿದ್ಯಾರ್ಥಿ ಕ್ಷೇಮಾಭಿವೃದ್ಧಿ ನಿಧಿ', label_en: 'SWF', amount: Number(receipt.swf) || 0 },
        { id: 10, label_kn: 'ಉಪಾಧ್ಯಾಯರ ಕಲ್ಯಾಣ ನಿಧಿ', label_en: 'TBF', amount: Number(receipt.tbf) || 0 },
        { id: 11, label_kn: 'ಪರೀಕ್ಷಾ ಶುಲ್ಕ', label_en: 'Examination Fee', amount: Number(receipt.examination_fee) || 0 },
        { id: 12, label_kn: 'ದಂಡ', label_en: 'Fines', amount: Number(receipt.fines) || 0 },
        { id: 13, label_kn: 'ಇತರೆ', label_en: 'Others', amount: Number(receipt.others) || 0 }
    ];

    const receiptNumberStr = receipt.receipt_number.toString().padStart(4, '0');
    const rupeesWordsStr = numberToWords(receipt.amount_paid);

    return (
        <>
            {/* SCREEN VIEW MODAL */}
            <div className="receipt-modal-overlay no-print" onClick={onClose}>
                <div className="receipt-modal-box" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-top-actions no-print">
                        <div className="modal-title-group">
                            <h2>Receipt Preview</h2>
                            <p>Receipt #{receiptNumberStr}</p>
                        </div>
                        <div className="modal-btn-group">
                            <button className="modal-print-btn" onClick={handlePrint}>
                                <Printer size={16} />
                                Print Receipt
                            </button>
                            <button className="modal-close-btn" onClick={onClose}>
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="receipt-preview-body">
                        {/* Styled exact copy of the receipt container for screen preview */}
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
                                    <span className="handwritten-val">{receiptNumberStr}</span>
                                </div>
                                <div className="meta-right">
                                    <span>ದಿನಾಂಕ</span>
                                    <span className="field-label-en">Date:</span>
                                    <span className="handwritten-val">{new Date(receipt.receipt_date).toLocaleDateString('en-GB')}</span>
                                </div>
                            </div>

                            <div className="student-detail-row">
                                <span>ವಿದ್ಯಾರ್ಥಿ/ನಿ ಹೆಸರು: </span>
                                <span className="field-label-en">Name of the Student: </span>
                                <span className="handwritten-val-full">
                                    {student?.full_name || 'N/A'} {student?.parent_name ? `S/o ${student.parent_name}` : ''}
                                </span>
                            </div>

                            <div className="class-detail-row">
                                <div className="class-col">
                                    <span>ತರಗತಿ/ </span>
                                    <span className="field-label-en">Class:</span>
                                    <span className="handwritten-val">{student?.classes?.class_name || 'N/A'}</span>
                                </div>
                                <div className="roll-col">
                                    <span>ರೋಲ್ ನಂ./ </span>
                                    <span className="field-label-en">Roll No.:</span>
                                    <span className="handwritten-val">{student?.roll_number || 'N/A'}</span>
                                </div>
                                <div className="sec-col">
                                    <span>ವಿಭಾಗ/ </span>
                                    <span className="field-label-en">Sec.:</span>
                                    <span className="handwritten-val">{student?.classes?.section || 'N/A'}</span>
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
                                        <td className="total-amount-val">{receipt.total_amount}.00</td>
                                    </tr>
                                </tfoot>
                            </table>

                            <div className="words-section">
                                <span className="kn-small">ರೂಪಾಯಿ (ಅಕ್ಷರಗಳಲ್ಲಿ) : </span>
                                <span className="en-small">Rupees in words: </span>
                                <span className="handwritten-words">{rupeesWordsStr}</span>
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
            </div>

            {/* PRINT PORTAL LAYOUT (Visible only when printing) */}
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
                            <span className="handwritten-val">{receiptNumberStr}</span>
                        </div>
                        <div className="meta-right">
                            <span>ದಿನಾಂಕ</span>
                            <span className="field-label-en">Date:</span>
                            <span className="handwritten-val">{new Date(receipt.receipt_date).toLocaleDateString('en-GB')}</span>
                        </div>
                    </div>

                    <div className="student-detail-row">
                        <span>ವಿದ್ಯಾರ್ಥಿ/ನಿ ಹೆಸರು: </span>
                        <span className="field-label-en">Name of the Student: </span>
                        <span className="handwritten-val-full">
                            {student?.full_name || 'N/A'} {student?.parent_name ? `S/o ${student.parent_name}` : ''}
                        </span>
                    </div>

                    <div className="class-detail-row">
                        <div className="class-col">
                            <span>ತರಗತಿ/ </span>
                            <span className="field-label-en">Class:</span>
                            <span className="handwritten-val">{student?.classes?.class_name || 'N/A'}</span>
                        </div>
                        <div className="roll-col">
                            <span>ರೋಲ್ ನಂ./ </span>
                            <span className="field-label-en">Roll No.:</span>
                            <span className="handwritten-val">{student?.roll_number || 'N/A'}</span>
                        </div>
                        <div className="sec-col">
                            <span>ವಿಭಾಗ/ </span>
                            <span className="field-label-en">Sec.:</span>
                            <span className="handwritten-val">{student?.classes?.section || 'N/A'}</span>
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
                                <td className="total-amount-val">{receipt.total_amount}.00</td>
                            </tr>
                        </tfoot>
                    </table>

                    <div className="words-section">
                        <span className="kn-small">ರೂಪಾಯಿ (ಅಕ್ಷರಗಳಲ್ಲಿ) : </span>
                        <span className="en-small">Rupees in words: </span>
                        <span className="handwritten-words">{rupeesWordsStr}</span>
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
        </>
    );
}
