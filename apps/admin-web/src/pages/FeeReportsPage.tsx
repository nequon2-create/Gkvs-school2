import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
    ChevronLeft,
    Search,
    Phone,
    MessageSquare,
    AlertCircle,
    CheckCircle2,
    TrendingUp,
    RefreshCw,
    X,
    FileSpreadsheet,
    Layers,
    Package
} from 'lucide-react';
import './FeeReportsPage.css';
import { ReceiptViewModal } from '../components/shared/ReceiptViewModal';

interface Class {
    id: string;
    class_name: string;
    section: string | null;
}

interface StudentFeeDetail {
    student_id: string;
    full_name: string;
    registration_number: string;
    photo_url: string | null;
    parent_phone: string | null;
    parent_name: string | null;
    className: string;
    class_id?: string;
    total_amount: number;
    paid_amount: number;
    pending_amount: number;
    alert_active: boolean;
    alert_frequency: string;
    alert_last_shown_at: string | null;
    last_payment_date: string | null;
}

interface ItemFeeStudentDetail {
    student_id: string;
    full_name: string;
    registration_number: string;
    photo_url: string | null;
    parent_phone: string | null;
    parent_name: string | null;
    className: string;
    class_id?: string;
    item_type: string;
    item_label: string;
    amount_total: number;
    amount_paid: number;
    amount_pending: number;
    last_payment_date: string | null;
}

interface Receipt {
    id: string;
    receipt_number: number;
    receipt_date: string;
    amount_paid: number;
    payment_mode: string;
    receipt_type?: string;
    item_type?: string;
    is_cancelled?: boolean;
}

const ANCILLARY_META = [
    { key: 'all', label_en: 'All 5 Items', icon: '📦' },
    { key: 'uniform', label_en: 'Uniform / Dress', icon: '👔' },
    { key: 'books', label_en: 'Books Fee', icon: '📚' },
    { key: 'van', label_en: 'Van / Transport', icon: '🚌' },
    { key: 'tie_belt', label_en: 'Tie & Belt', icon: '🎗️' },
    { key: 'shoes', label_en: 'Shoes Fee', icon: '👟' },
];

export function FeeReportsPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [classes, setClasses] = useState<Class[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'unpaid'>('all');
    const [showOnlyRecentPaid, setShowOnlyRecentPaid] = useState(false);

    // Section Toggle: 'academic' vs 'items'
    const [reportCategory, setReportCategory] = useState<'academic' | 'items'>('academic');
    const [selectedItemFilter, setSelectedItemFilter] = useState<string>('all');

    const [students, setStudents] = useState<StudentFeeDetail[]>([]);
    const [itemStudents, setItemStudents] = useState<ItemFeeStudentDetail[]>([]);
    const [currentYearId, setCurrentYearId] = useState<string | null>(null);

    // Modal states
    const [selectedStudentForAlert, setSelectedStudentForAlert] = useState<StudentFeeDetail | null>(null);
    const [alertFrequency, setAlertFrequency] = useState<'once' | 'daily' | 'weekly' | 'always'>('once');
    const [submittingAlert, setSubmittingAlert] = useState(false);

    const [selectedStudentForHistory, setSelectedStudentForHistory] = useState<any | null>(null);
    const [paymentHistory, setPaymentHistory] = useState<Receipt[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [selectedReceiptIdForModal, setSelectedReceiptIdForModal] = useState<string | null>(null);

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (currentYearId) {
            if (reportCategory === 'academic') {
                fetchFeeStatus();
            } else {
                fetchItemFeeStatus();
            }
        }
    }, [currentYearId, selectedClassId, reportCategory]);

    const fetchInitialData = async () => {
        try {
            const [classesRes, yearRes] = await Promise.all([
                supabase.from('classes').select('id, class_name, section').order('numeric_value', { ascending: true }),
                supabase.from('academic_years').select('id').eq('is_current', true).single()
            ]);

            if (classesRes.data) setClasses(classesRes.data);
            if (yearRes.data) setCurrentYearId(yearRes.data.id);
        } catch (e) {
            console.error('Error fetching initial data:', e);
        }
    };

    // Academic Fee Report Query
    const fetchFeeStatus = async () => {
        if (!currentYearId) return;
        setLoading(true);
        try {
            let studentsQuery = supabase
                .from('students')
                .select(`
                    id,
                    full_name,
                    registration_number,
                    photo_url,
                    parent_phone,
                    parent_name,
                    classes (
                        id,
                        class_name,
                        section
                    )
                `)
                .eq('academic_year_id', currentYearId)
                .eq('is_active', true);

            if (selectedClassId !== 'all') {
                studentsQuery = studentsQuery.eq('class_id', selectedClassId);
            }

            const { data: studentsData, error: studentsError } = await studentsQuery;
            if (studentsError) throw studentsError;

            // Fetch student fees
            let feesData: any[] = [];
            const alertQuery = await supabase
                .from('student_fees')
                .select(`
                    student_id,
                    total_amount,
                    amount_paid,
                    amount_pending,
                    alert_active,
                    alert_frequency,
                    alert_last_shown_at
                `)
                .eq('academic_year_id', currentYearId);

            if (!alertQuery.error) {
                feesData = alertQuery.data || [];
            } else {
                const baseQuery = await supabase
                    .from('student_fees')
                    .select('student_id, total_amount, amount_paid, amount_pending')
                    .eq('academic_year_id', currentYearId);
                feesData = baseQuery.data || [];
            }

            const feesMap = new Map<string, any>();
            feesData?.forEach(f => {
                feesMap.set(f.student_id, f);
            });

            // Active non-cancelled receipts date map
            const { data: receiptsData } = await supabase
                .from('fee_receipts')
                .select('student_id, receipt_date, is_cancelled, receipt_type')
                .eq('academic_year_id', currentYearId)
                .or('receipt_type.eq.academic,receipt_type.is.null')
                .or('is_cancelled.is.null,is_cancelled.eq.false')
                .order('receipt_date', { ascending: false });

            const receiptMap = new Map<string, string>();
            receiptsData?.forEach(r => {
                if (r.student_id && !receiptMap.has(r.student_id)) {
                    receiptMap.set(r.student_id, r.receipt_date);
                }
            });

            const mapped: StudentFeeDetail[] = (studentsData || []).map((s: any) => {
                const feeRecord = feesMap.get(s.id) || null;
                const total = feeRecord?.total_amount || 0;
                const paid = feeRecord?.amount_paid || 0;
                const pending = feeRecord?.amount_pending ?? total;

                return {
                    student_id: s.id,
                    full_name: s.full_name,
                    registration_number: s.registration_number || 'N/A',
                    photo_url: s.photo_url,
                    parent_phone: s.parent_phone,
                    parent_name: s.parent_name,
                    className: s.classes ? `${s.classes.class_name}${s.classes.section ? ` - ${s.classes.section}` : ''}` : 'N/A',
                    class_id: s.classes?.id,
                    total_amount: total,
                    paid_amount: paid,
                    pending_amount: pending,
                    alert_active: feeRecord?.alert_active || false,
                    alert_frequency: feeRecord?.alert_frequency || 'once',
                    alert_last_shown_at: feeRecord?.alert_last_shown_at || null,
                    last_payment_date: receiptMap.get(s.id) || null
                };
            });

            setStudents(mapped);
        } catch (e) {
            console.error('Error fetching fee summary status:', e);
        } finally {
            setLoading(false);
        }
    };

    // 5 Ancillary Items Report Query
    const fetchItemFeeStatus = async () => {
        if (!currentYearId) return;
        setLoading(true);
        try {
            let studentsQuery = supabase
                .from('students')
                .select(`
                    id,
                    full_name,
                    registration_number,
                    photo_url,
                    parent_phone,
                    parent_name,
                    classes (
                        id,
                        class_name,
                        section
                    )
                `)
                .eq('academic_year_id', currentYearId)
                .eq('is_active', true);

            if (selectedClassId !== 'all') {
                studentsQuery = studentsQuery.eq('class_id', selectedClassId);
            }

            const { data: studentsData, error: studentsError } = await studentsQuery;
            if (studentsError) throw studentsError;

            // Fetch student_item_fees
            const { data: itemFeesData, error: itemError } = await supabase
                .from('student_item_fees')
                .select('*')
                .eq('academic_year_id', currentYearId);

            if (itemError) throw itemError;

            // Fetch latest item receipts
            const { data: itemReceipts } = await supabase
                .from('fee_receipts')
                .select('student_id, item_type, receipt_date, is_cancelled')
                .eq('academic_year_id', currentYearId)
                .eq('receipt_type', 'item')
                .or('is_cancelled.is.null,is_cancelled.eq.false')
                .order('receipt_date', { ascending: false });

            const receiptDateMap = new Map<string, string>();
            itemReceipts?.forEach(r => {
                const key = `${r.student_id}_${r.item_type}`;
                if (!receiptDateMap.has(key)) {
                    receiptDateMap.set(key, r.receipt_date);
                }
            });

            const studentMap = new Map((studentsData || []).map((s: any) => [s.id, s]));

            const mappedItems: ItemFeeStudentDetail[] = [];
            (itemFeesData || []).forEach((row: any) => {
                const student = studentMap.get(row.student_id);
                if (!student) return;

                const meta = ANCILLARY_META.find(m => m.key === row.item_type);
                const dateKey = `${row.student_id}_${row.item_type}`;

                mappedItems.push({
                    student_id: student.id,
                    full_name: student.full_name,
                    registration_number: student.registration_number || 'N/A',
                    photo_url: student.photo_url,
                    parent_phone: student.parent_phone,
                    parent_name: student.parent_name,
                    className: student.classes ? `${student.classes.class_name}${student.classes.section ? ` - ${student.classes.section}` : ''}` : 'N/A',
                    class_id: student.classes?.id,
                    item_type: row.item_type,
                    item_label: meta?.label_en || row.item_type,
                    amount_total: Number(row.amount_total) || 0,
                    amount_paid: Number(row.amount_paid) || 0,
                    amount_pending: Number(row.amount_pending) || 0,
                    last_payment_date: receiptDateMap.get(dateKey) || null
                });
            });

            setItemStudents(mappedItems);
        } catch (e) {
            console.error('Error fetching item fee status:', e);
        } finally {
            setLoading(false);
        }
    };

    // Calculate metrics for current active report category
    const paidCount = reportCategory === 'academic'
        ? students.filter(s => s.total_amount > 0 && s.pending_amount === 0).length
        : itemStudents.filter(s => s.amount_total > 0 && s.amount_pending === 0).length;

    const pendingCount = reportCategory === 'academic'
        ? students.filter(s => s.paid_amount > 0 && s.pending_amount > 0).length
        : itemStudents.filter(s => s.amount_paid > 0 && s.amount_pending > 0).length;

    const unpaidCount = reportCategory === 'academic'
        ? students.filter(s => s.total_amount > 0 && s.paid_amount === 0).length
        : itemStudents.filter(s => s.amount_total > 0 && s.amount_paid === 0).length;

    const totalCollected = reportCategory === 'academic'
        ? students.reduce((sum, s) => sum + s.paid_amount, 0)
        : itemStudents.reduce((sum, s) => sum + s.amount_paid, 0);

    const totalPending = reportCategory === 'academic'
        ? students.reduce((sum, s) => sum + s.pending_amount, 0)
        : itemStudents.reduce((sum, s) => sum + s.amount_pending, 0);

    const isRecentlyPaid = (dateStr: string | null) => {
        if (!dateStr) return false;
        const pDate = new Date(dateStr);
        const diffTime = Math.abs(new Date().getTime() - pDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 3;
    };

    const getWhatsAppLink = (fullName: string, regNo: string, pendingAmt: number, phone: string | null, itemDesc?: string) => {
        if (!phone) return '#';
        const rawPhone = phone.replace(/\D/g, '');
        const formattedPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
        const target = itemDesc ? `${itemDesc} Fee` : 'Academic School Fees';
        const message = `Dear Parent, reminder from GKVS School regarding the pending ${target} for: ${fullName} (Reg No: ${regNo}). Outstanding balance: ₹${pendingAmt.toLocaleString('en-IN')}.\n\nKindly pay to: 9900282804 (UPI: 9900282804@ybl). Thank you.`;
        return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    };

    const handleOpenHistory = async (student: any, itemType?: string) => {
        setSelectedStudentForHistory(student);
        setLoadingHistory(true);
        try {
            let query = supabase
                .from('fee_receipts')
                .select('id, receipt_number, receipt_date, amount_paid, payment_mode, is_cancelled, receipt_type, item_type')
                .eq('student_id', student.student_id)
                .or('is_cancelled.is.null,is_cancelled.eq.false')
                .order('receipt_date', { ascending: false });

            if (itemType) {
                query = query.eq('receipt_type', 'item').eq('item_type', itemType);
            } else if (reportCategory === 'academic') {
                query = query.or('receipt_type.eq.academic,receipt_type.is.null');
            }

            const { data } = await query;
            setPaymentHistory(data || []);
        } catch (e) {
            console.error('Error fetching receipts history:', e);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleOpenAlertSetup = (student: StudentFeeDetail) => {
        setSelectedStudentForAlert(student);
        setAlertFrequency((student.alert_frequency as any) || 'once');
    };

    const handleSubmitAlertSetup = async () => {
        if (!selectedStudentForAlert || !currentYearId) return;
        setSubmittingAlert(true);
        try {
            const { data: existing } = await supabase
                .from('student_fees')
                .select('id')
                .eq('student_id', selectedStudentForAlert.student_id)
                .eq('academic_year_id', currentYearId)
                .maybeSingle();

            if (existing) {
                const { error } = await supabase
                    .from('student_fees')
                    .update({
                        alert_active: true,
                        alert_frequency: alertFrequency,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existing.id);
                if (error) throw error;
            }
            alert(`In-app fee alert enabled (${alertFrequency}) for ${selectedStudentForAlert.full_name}`);
            setSelectedStudentForAlert(null);
            fetchFeeStatus();
        } catch (e: any) {
            alert('Failed to configure alert: ' + e.message);
        } finally {
            setSubmittingAlert(false);
        }
    };

    const handleDeactivateAlert = async (student: StudentFeeDetail) => {
        if (!confirm(`Stop in-app alerts for ${student.full_name}?`)) return;
        try {
            const { error } = await supabase
                .from('student_fees')
                .update({
                    alert_active: false,
                    updated_at: new Date().toISOString()
                })
                .eq('student_id', student.student_id)
                .eq('academic_year_id', currentYearId);

            if (error) throw error;
            alert('In-app reminder alert disabled successfully.');
            fetchFeeStatus();
        } catch (e: any) {
            alert('Failed to disable alert: ' + e.message);
        }
    };

    const exportToCSV = () => {
        if (reportCategory === 'academic') {
            const headers = ['Student Name', 'Registration Number', 'Class', 'Total Fee', 'Paid Amount', 'Pending Amount', 'Last Payment Date', 'Parent Name', 'Parent Phone'];
            const csvRows = [headers.join(',')];
            filteredStudents.forEach(s => {
                const row = [
                    `"${s.full_name.replace(/"/g, '""')}"`,
                    `"${s.registration_number}"`,
                    `"${s.className}"`,
                    s.total_amount,
                    s.paid_amount,
                    s.pending_amount,
                    s.last_payment_date || 'None',
                    `"${(s.parent_name || 'N/A').replace(/"/g, '""')}"`,
                    `"${s.parent_phone || ''}"`
                ];
                csvRows.push(row.join(','));
            });
            const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
            const link = document.createElement("a");
            link.setAttribute("href", encodeURI(csvContent));
            link.setAttribute("download", `Academic_Fee_Report_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
        } else {
            const headers = ['Student Name', 'Registration Number', 'Class', 'Item Type', 'Item Total', 'Item Paid', 'Item Due', 'Last Payment Date', 'Parent Name', 'Parent Phone'];
            const csvRows = [headers.join(',')];
            filteredItemStudents.forEach(s => {
                const row = [
                    `"${s.full_name.replace(/"/g, '""')}"`,
                    `"${s.registration_number}"`,
                    `"${s.className}"`,
                    `"${s.item_label}"`,
                    s.amount_total,
                    s.amount_paid,
                    s.amount_pending,
                    s.last_payment_date || 'None',
                    `"${(s.parent_name || 'N/A').replace(/"/g, '""')}"`,
                    `"${s.parent_phone || ''}"`
                ];
                csvRows.push(row.join(','));
            });
            const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
            const link = document.createElement("a");
            link.setAttribute("href", encodeURI(csvContent));
            link.setAttribute("download", `Ancillary_Item_Report_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
        }
    };

    // Filtered Academic Students
    const filteredStudents = students.filter(student => {
        const matchQuery = student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.registration_number.toLowerCase().includes(searchQuery.toLowerCase());

        let matchStatus = true;
        if (statusFilter === 'paid') {
            matchStatus = student.total_amount > 0 && student.pending_amount === 0;
        } else if (statusFilter === 'pending') {
            matchStatus = student.paid_amount > 0 && student.pending_amount > 0;
        } else if (statusFilter === 'unpaid') {
            matchStatus = student.total_amount > 0 && student.paid_amount === 0;
        }

        const matchRecent = showOnlyRecentPaid ? isRecentlyPaid(student.last_payment_date) : true;
        return matchQuery && matchStatus && matchRecent;
    });

    // Filtered Item Students
    const filteredItemStudents = itemStudents.filter(item => {
        const matchQuery = item.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.registration_number.toLowerCase().includes(searchQuery.toLowerCase());

        const matchItem = selectedItemFilter === 'all' ? true : item.item_type === selectedItemFilter;

        let matchStatus = true;
        if (statusFilter === 'paid') {
            matchStatus = item.amount_total > 0 && item.amount_pending === 0;
        } else if (statusFilter === 'pending') {
            matchStatus = item.amount_paid > 0 && item.amount_pending > 0;
        } else if (statusFilter === 'unpaid') {
            matchStatus = item.amount_total > 0 && item.amount_paid === 0;
        }

        const matchRecent = showOnlyRecentPaid ? isRecentlyPaid(item.last_payment_date) : true;
        return matchQuery && matchItem && matchStatus && matchRecent;
    });

    return (
        <div className="fee-reports-page">
            <div className="no-print">
                {/* Header */}
                <div className="page-header no-print">
                    <button className="back-btn" onClick={() => navigate('/billing')}>
                        <ChevronLeft size={20} />
                        Back to Billing
                    </button>
                    <div className="header-titles">
                        <h1>Financial & Fee Reports</h1>
                        <p>Track student payments, review receipt balances, and manage parent mobile app reminders</p>
                    </div>
                </div>

                {/* Apple Cupertino Segmented Section Switcher */}
                <div style={{
                    display: 'inline-flex',
                    background: '#E5E5EA',
                    padding: '4px',
                    borderRadius: '14px',
                    marginTop: '20px',
                    gap: '4px'
                }}>
                    <button
                        type="button"
                        onClick={() => setReportCategory('academic')}
                        style={{
                            padding: '10px 22px',
                            borderRadius: '11px',
                            border: 'none',
                            background: reportCategory === 'academic' ? '#FFFFFF' : 'transparent',
                            color: reportCategory === 'academic' ? '#1D1D1F' : '#86868B',
                            fontWeight: 700,
                            fontSize: '14px',
                            boxShadow: reportCategory === 'academic' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                        }}
                    >
                        <Layers size={16} color={reportCategory === 'academic' ? '#0071E3' : '#86868B'} />
                        Academic Fee Report
                    </button>
                    <button
                        type="button"
                        onClick={() => setReportCategory('items')}
                        style={{
                            padding: '10px 22px',
                            borderRadius: '11px',
                            border: 'none',
                            background: reportCategory === 'items' ? '#FFFFFF' : 'transparent',
                            color: reportCategory === 'items' ? '#1D1D1F' : '#86868B',
                            fontWeight: 700,
                            fontSize: '14px',
                            boxShadow: reportCategory === 'items' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                        }}
                    >
                        <Package size={16} color={reportCategory === 'items' ? '#0071E3' : '#86868B'} />
                        5 Ancillary Items Report (Uniform, Books, Van, Tie/Belt, Shoes)
                    </button>
                </div>

                {/* Overall Collection Metrics */}
                <div className="reports-stats-grid">
                    <div className="report-stat-card total-collected">
                        <div className="stat-card-icon">
                            <TrendingUp size={26} />
                        </div>
                        <div className="stat-card-info">
                            <h3>₹{totalCollected.toLocaleString('en-IN')}</h3>
                            <p>{reportCategory === 'academic' ? 'Academic Fees Collected' : 'Ancillary Items Collected'}</p>
                        </div>
                    </div>

                    <div className="report-stat-card total-pending">
                        <div className="stat-card-icon">
                            <AlertCircle size={26} />
                        </div>
                        <div className="stat-card-info">
                            <h3>₹{totalPending.toLocaleString('en-IN')}</h3>
                            <p>{reportCategory === 'academic' ? 'Academic Pending Dues' : 'Ancillary Items Due'}</p>
                        </div>
                    </div>

                    <div className="report-stat-card status-radial">
                        <div className="radial-legend">
                            <div className="legend-item"><span className="dot dot-paid" /> Paid: <strong>{paidCount}</strong></div>
                            <div className="legend-item"><span className="dot dot-pending" /> Pending: <strong>{pendingCount}</strong></div>
                            <div className="legend-item"><span className="dot dot-unpaid" /> Unpaid: <strong>{unpaidCount}</strong></div>
                        </div>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="reports-filter-bar no-print">
                    <div className="search-box">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search student or registration ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="filter-dropdowns">
                        <div className="filter-group">
                            <label>Class</label>
                            <select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)}>
                                <option value="all">All Classes</option>
                                {classes.map(c => (
                                    <option key={c.id} value={c.id}>{c.class_name} {c.section ? `- ${c.section}` : ''}</option>
                                ))}
                            </select>
                        </div>

                        {/* Ancillary Item Filter if on items tab */}
                        {reportCategory === 'items' && (
                            <div className="filter-group">
                                <label>Item</label>
                                <select value={selectedItemFilter} onChange={(e) => setSelectedItemFilter(e.target.value)}>
                                    {ANCILLARY_META.map(item => (
                                        <option key={item.key} value={item.key}>{item.icon} {item.label_en}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="filter-group">
                            <label>Status</label>
                            <select value={statusFilter} onChange={(e: any) => setStatusFilter(e.target.value)}>
                                <option value="all">All Statuses</option>
                                <option value="paid">Fully Paid</option>
                                <option value="pending">Partially Paid</option>
                                <option value="unpaid">Not Paid Anything</option>
                            </select>
                        </div>

                        <div className="filter-checkbox-wrap">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={showOnlyRecentPaid}
                                    onChange={(e) => setShowOnlyRecentPaid(e.target.checked)}
                                />
                                Show Recently Paid Only (≤ 3 Days)
                            </label>
                        </div>
                    </div>

                    <div className="action-buttons">
                        <button className="refresh-btn" onClick={reportCategory === 'academic' ? fetchFeeStatus : fetchItemFeeStatus} title="Refresh lists">
                            <RefreshCw size={18} />
                        </button>
                        <button className="export-btn" onClick={exportToCSV}>
                            <FileSpreadsheet size={18} />
                            Export CSV
                        </button>
                    </div>
                </div>

                {/* Main Data Table */}
                <div className="reports-table-container">
                    {loading ? (
                        <div className="table-loading-state">
                            <RefreshCw size={24} className="spin-icon" />
                            <p>Aggregating fee report structures...</p>
                        </div>
                    ) : (reportCategory === 'academic' ? filteredStudents.length === 0 : filteredItemStudents.length === 0) ? (
                        <div className="table-empty-state">
                            <AlertCircle size={48} />
                            <h3>No matching students found</h3>
                            <p>Try loosening your search query or filters.</p>
                        </div>
                    ) : reportCategory === 'academic' ? (
                        /* Academic Fee Table */
                        <table className="reports-data-table">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Class</th>
                                    <th>Reg Number</th>
                                    <th>Total Fee</th>
                                    <th>Paid Amount</th>
                                    <th>Pending Dues</th>
                                    <th>Last Payment</th>
                                    <th className="no-print">Quick Call / WhatsApp</th>
                                    <th className="no-print">App Reminder</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.map((s) => (
                                    <tr key={s.student_id} className="student-report-row">
                                        <td className="student-profile-cell">
                                            <div
                                                className="student-avatar-wrap"
                                                data-lightbox-photo={s.photo_url || ''}
                                                data-lightbox-title={s.full_name}
                                                data-lightbox-subtitle={`${s.registration_number} • ${s.className}`}
                                                data-lightbox-badge={s.parent_name ? `Parent: ${s.parent_name}` : ''}
                                                style={{ cursor: 'pointer' }}
                                                title="Click to view photo (WhatsApp style)"
                                            >
                                                {s.photo_url ? (
                                                    <img src={s.photo_url} alt={s.full_name} className="student-avatar-img" />
                                                ) : (
                                                    <div className="student-avatar-fallback">
                                                        {s.full_name.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="student-name-wrap">
                                                <span className="student-name">{s.full_name}</span>
                                                <span className="parent-sub-name">{s.parent_name ? `S/o: ${s.parent_name}` : ''}</span>
                                            </div>
                                        </td>
                                        <td><span className="class-label">{s.className}</span></td>
                                        <td><span className="reg-id-label">{s.registration_number}</span></td>
                                        <td className="amount-col">₹{s.total_amount.toLocaleString('en-IN')}</td>
                                        <td className="amount-col paid-amount-col">
                                            {s.paid_amount > 0 ? (
                                                <button className="inline-receipt-modal-btn" onClick={() => handleOpenHistory(s)} title="View Receipt History">
                                                    ₹{s.paid_amount.toLocaleString('en-IN')}
                                                </button>
                                            ) : (
                                                <span>₹0</span>
                                            )}
                                        </td>
                                        <td className="amount-col pending-amount-col">
                                            {s.pending_amount > 0 ? (
                                                <span className="pending-badge">₹{s.pending_amount.toLocaleString('en-IN')}</span>
                                            ) : s.total_amount > 0 ? (
                                                <span className="paid-badge"><CheckCircle2 size={12} /> Paid</span>
                                            ) : (
                                                <span className="no-struct-badge">Not Set</span>
                                            )}
                                        </td>
                                        <td>
                                            {s.last_payment_date ? (
                                                <div className="payment-date-wrap">
                                                    <span>{new Date(s.last_payment_date).toLocaleDateString('en-GB')}</span>
                                                    {isRecentlyPaid(s.last_payment_date) && <span className="recent-badge">Recent</span>}
                                                </div>
                                            ) : (
                                                <span className="no-payment">None</span>
                                            )}
                                        </td>
                                        <td className="no-print">
                                            <div className="quick-actions-cell">
                                                {s.parent_phone ? (
                                                    <>
                                                        <a href={`tel:${s.parent_phone}`} className="icon-btn call-btn" title="Call Parent">
                                                            <Phone size={15} />
                                                        </a>
                                                        {s.pending_amount > 0 && (
                                                            <a href={getWhatsAppLink(s.full_name, s.registration_number, s.pending_amount, s.parent_phone)} target="_blank" rel="noopener noreferrer" className="icon-btn whatsapp-btn" title="Send WhatsApp Due Reminder">
                                                                <MessageSquare size={15} />
                                                            </a>
                                                        )}
                                                    </>
                                                ) : (
                                                    <span className="no-phone">No Phone</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="no-print">
                                            {s.pending_amount > 0 ? (
                                                s.alert_active ? (
                                                    <button className="reminder-active-btn" onClick={() => handleDeactivateAlert(s)} title="Stop App Reminder">
                                                        Active ({s.alert_frequency})
                                                    </button>
                                                ) : (
                                                    <button className="reminder-setup-btn" onClick={() => handleOpenAlertSetup(s)} title="Setup App Reminder">
                                                        Send Alert
                                                    </button>
                                                )
                                            ) : (
                                                <span className="paid-check"><CheckCircle2 size={16} /></span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        /* 5 Ancillary Items Table */
                        <table className="reports-data-table">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Class</th>
                                    <th>Item Type</th>
                                    <th>Item Total</th>
                                    <th>Paid Amount</th>
                                    <th>Pending Dues</th>
                                    <th>Last Payment</th>
                                    <th className="no-print">WhatsApp Reminder</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredItemStudents.map((item, idx) => (
                                    <tr key={`${item.student_id}_${item.item_type}_${idx}`} className="student-report-row">
                                        <td className="student-profile-cell">
                                            <div
                                                className="student-avatar-wrap"
                                                data-lightbox-photo={item.photo_url || ''}
                                                data-lightbox-title={item.full_name}
                                                data-lightbox-subtitle={`${item.registration_number} • ${item.className}`}
                                                data-lightbox-badge={item.parent_name ? `Parent: ${item.parent_name}` : ''}
                                                style={{ cursor: 'pointer' }}
                                                title="Click to view photo (WhatsApp style)"
                                            >
                                                {item.photo_url ? (
                                                    <img src={item.photo_url} alt={item.full_name} className="student-avatar-img" />
                                                ) : (
                                                    <div className="student-avatar-fallback">
                                                        {item.full_name.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="student-name-wrap">
                                                <span className="student-name">{item.full_name}</span>
                                                <span className="parent-sub-name">{item.registration_number}</span>
                                            </div>
                                        </td>
                                        <td><span className="class-label">{item.className}</span></td>
                                        <td>
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '4px 10px',
                                                borderRadius: '8px',
                                                background: '#F1F5F9',
                                                fontSize: '12px',
                                                fontWeight: 700,
                                                color: '#0F172A'
                                            }}>
                                                {ANCILLARY_META.find(m => m.key === item.item_type)?.icon} {item.item_label}
                                            </span>
                                        </td>
                                        <td className="amount-col">₹{item.amount_total.toLocaleString('en-IN')}</td>
                                        <td className="amount-col paid-amount-col">
                                            {item.amount_paid > 0 ? (
                                                <button className="inline-receipt-modal-btn" onClick={() => handleOpenHistory(item, item.item_type)} title="View Item Receipt History">
                                                    ₹{item.amount_paid.toLocaleString('en-IN')}
                                                </button>
                                            ) : (
                                                <span>₹0</span>
                                            )}
                                        </td>
                                        <td className="amount-col pending-amount-col">
                                            {item.amount_pending > 0 ? (
                                                <span className="pending-badge">₹{item.amount_pending.toLocaleString('en-IN')}</span>
                                            ) : item.amount_total > 0 ? (
                                                <span className="paid-badge"><CheckCircle2 size={12} /> Paid</span>
                                            ) : (
                                                <span className="no-struct-badge">Not Set</span>
                                            )}
                                        </td>
                                        <td>
                                            {item.last_payment_date ? (
                                                <span>{new Date(item.last_payment_date).toLocaleDateString('en-GB')}</span>
                                            ) : (
                                                <span className="no-payment">None</span>
                                            )}
                                        </td>
                                        <td className="no-print">
                                            {item.parent_phone && item.amount_pending > 0 ? (
                                                <a href={getWhatsAppLink(item.full_name, item.registration_number, item.amount_pending, item.parent_phone, item.item_label)} target="_blank" rel="noopener noreferrer" className="icon-btn whatsapp-btn" title="Send WhatsApp Reminder">
                                                    <MessageSquare size={15} />
                                                </a>
                                            ) : (
                                                <span className="no-phone">—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* In-App Reminder Setup Modal */}
            {selectedStudentForAlert && (
                <div className="modal-overlay no-print" onClick={() => setSelectedStudentForAlert(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Configure In-App Reminder Alert</h2>
                            <button className="close-btn" onClick={() => setSelectedStudentForAlert(null)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <p>
                                Student: <strong>{selectedStudentForAlert.full_name}</strong> ({selectedStudentForAlert.className})
                            </p>
                            <p>Pending Fee: <strong className="text-red">₹{selectedStudentForAlert.pending_amount.toLocaleString('en-IN')}</strong></p>
                            <div className="frequency-selector">
                                <label>Frequency of Reminder on Parent App Login:</label>
                                <select value={alertFrequency} onChange={(e: any) => setAlertFrequency(e.target.value)}>
                                    <option value="once">Once only (auto-clears upon close)</option>
                                    <option value="daily">Daily once</option>
                                    <option value="weekly">Weekly once</option>
                                    <option value="always">Every single time parent opens app</option>
                                </select>
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={() => setSelectedStudentForAlert(null)}>Cancel</button>
                            <button className="btn-confirm" onClick={handleSubmitAlertSetup} disabled={submittingAlert}>
                                {submittingAlert ? 'Saving...' : 'Activate Reminder'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Receipt Payment History Modal */}
            {selectedStudentForHistory && (
                <div className="modal-overlay no-print" onClick={() => setSelectedStudentForHistory(null)}>
                    <div className="modal-content history-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h2>Receipt History</h2>
                                <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0 0' }}>
                                    {selectedStudentForHistory.full_name} ({selectedStudentForHistory.className})
                                </p>
                            </div>
                            <button className="close-btn" onClick={() => setSelectedStudentForHistory(null)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="modal-body history-modal-body">
                            {loadingHistory ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
                                    <RefreshCw size={24} className="spin-icon" />
                                </div>
                            ) : paymentHistory.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '32px', color: '#64748B' }}>
                                    No non-cancelled receipts found for this student.
                                </div>
                            ) : (
                                <table className="history-receipts-table">
                                    <thead>
                                        <tr>
                                            <th>Receipt No.</th>
                                            <th>Date</th>
                                            <th>Type</th>
                                            <th>Amount</th>
                                            <th>Mode</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paymentHistory.map(rec => (
                                            <tr key={rec.id}>
                                                <td><strong>#{rec.receipt_number}</strong></td>
                                                <td>{new Date(rec.receipt_date).toLocaleDateString('en-GB')}</td>
                                                <td>
                                                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 6px', borderRadius: '6px', background: '#F1F5F9' }}>
                                                        {rec.receipt_type === 'item' ? rec.item_type?.toUpperCase() : 'ACADEMIC'}
                                                    </span>
                                                </td>
                                                <td style={{ color: '#16A34A', fontWeight: 700 }}>₹{rec.amount_paid.toLocaleString('en-IN')}</td>
                                                <td>{rec.payment_mode}</td>
                                                <td>
                                                    <button
                                                        onClick={() => setSelectedReceiptIdForModal(rec.id)}
                                                        style={{
                                                            padding: '4px 10px',
                                                            borderRadius: '6px',
                                                            border: 'none',
                                                            background: '#EFF6FF',
                                                            color: '#2563EB',
                                                            fontWeight: 600,
                                                            fontSize: '12px',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        View & Print
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Receipt View & Print Modal Component */}
            {selectedReceiptIdForModal && (
                <ReceiptViewModal
                    receiptId={selectedReceiptIdForModal}
                    onClose={() => setSelectedReceiptIdForModal(null)}
                />
            )}
        </div>
    );
}
