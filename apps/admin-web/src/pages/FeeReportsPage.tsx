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
    FileText,
    ReceiptText
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
    total_amount: number;
    paid_amount: number;
    pending_amount: number;
    alert_active: boolean;
    alert_frequency: string;
    alert_last_shown_at: string | null;
    last_payment_date: string | null;
}

interface Receipt {
    id: string;
    receipt_number: number;
    receipt_date: string;
    amount_paid: number;
    payment_mode: string;
}

export function FeeReportsPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [classes, setClasses] = useState<Class[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'unpaid'>('all');
    const [showOnlyRecentPaid, setShowOnlyRecentPaid] = useState(false);

    const [students, setStudents] = useState<StudentFeeDetail[]>([]);
    const [currentYearId, setCurrentYearId] = useState<string | null>(null);

    // Modal states
    const [selectedStudentForAlert, setSelectedStudentForAlert] = useState<StudentFeeDetail | null>(null);
    const [alertFrequency, setAlertFrequency] = useState<'once' | 'daily' | 'weekly' | 'always'>('once');
    const [submittingAlert, setSubmittingAlert] = useState(false);

    const [selectedStudentForHistory, setSelectedStudentForHistory] = useState<StudentFeeDetail | null>(null);
    const [paymentHistory, setPaymentHistory] = useState<Receipt[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [selectedReceiptIdForModal, setSelectedReceiptIdForModal] = useState<string | null>(null);

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (currentYearId) {
            fetchFeeStatus();
        }
    }, [currentYearId, selectedClassId]);

    const fetchInitialData = async () => {
        try {
            // Fetch classes and active year
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

    const fetchFeeStatus = async () => {
        if (!currentYearId) return;
        setLoading(true);
        try {
            // 1. Fetch active students
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

            // 2. Fetch student fees
            let feesData: any[] = [];
            
            // Try fetching with alert columns first
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
                console.warn('Alert columns not found, falling back to base columns. Error:', alertQuery.error);
                // Fallback to base columns that definitely exist
                const baseQuery = await supabase
                    .from('student_fees')
                    .select(`
                        student_id,
                        total_amount,
                        amount_paid,
                        amount_pending
                    `)
                    .eq('academic_year_id', currentYearId);

                if (baseQuery.error) {
                    throw baseQuery.error;
                }
                feesData = baseQuery.data || [];
            }

            // Create fee lookup map
            const feesMap = new Map<string, any>();
            feesData?.forEach(f => {
                feesMap.set(f.student_id, f);
            });

            // 3. Fetch latest payment receipt date for all students
            const { data: receiptsData } = await supabase
                .from('fee_receipts')
                .select('student_id, receipt_date')
                .eq('academic_year_id', currentYearId)
                .order('receipt_date', { ascending: false });

            // Create lookup map for latest receipt date
            const receiptMap = new Map<string, string>();
            receiptsData?.forEach(r => {
                if (r.student_id && !receiptMap.has(r.student_id)) {
                    receiptMap.set(r.student_id, r.receipt_date);
                }
            });

            // Map database response to summary list
            const mapped: StudentFeeDetail[] = (studentsData || []).map((s: any) => {
                const feeRecord = feesMap.get(s.id) || null;
                const total = feeRecord?.total_amount || 0;
                const paid = feeRecord?.amount_paid || 0;
                const pending = feeRecord?.amount_pending ?? total; // if no row, pending is full total

                return {
                    student_id: s.id,
                    full_name: s.full_name,
                    registration_number: s.registration_number || 'N/A',
                    photo_url: s.photo_url,
                    parent_phone: s.parent_phone,
                    parent_name: s.parent_name,
                    className: s.classes ? `${s.classes.class_name}${s.classes.section ? ` - ${s.classes.section}` : ''}` : 'N/A',
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

    // Calculate metric cards summary values
    const paidCount = students.filter(s => s.total_amount > 0 && s.pending_amount === 0).length;
    const pendingCount = students.filter(s => s.paid_amount > 0 && s.pending_amount > 0).length;
    const unpaidCount = students.filter(s => s.total_amount > 0 && s.paid_amount === 0).length;

    const totalCollected = students.reduce((sum, s) => sum + s.paid_amount, 0);
    const totalPending = students.reduce((sum, s) => sum + s.pending_amount, 0);

    // Recent payment badge calculation (last 3 days)
    const isRecentlyPaid = (dateStr: string | null) => {
        if (!dateStr) return false;
        const pDate = new Date(dateStr);
        const diffTime = Math.abs(new Date().getTime() - pDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 3;
    };

    // Formatted WhatsApp message link
    const getWhatsAppLink = (student: StudentFeeDetail) => {
        if (!student.parent_phone) return '#';
        const rawPhone = student.parent_phone.replace(/\D/g, '');
        // Prefix with India country code 91 if it's a 10 digit number
        const formattedPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
        
        const message = `Dear Parent, this is a reminder from GKVS School regarding the pending school fees for your child: ${student.full_name} (Reg No: ${student.registration_number}). The current pending balance is ₹${student.pending_amount.toLocaleString('en-IN')}.

Kindly pay this balance of ₹${student.pending_amount.toLocaleString('en-IN')} using Google Pay, PhonePe, or Paytm to:
• Phone Number: 9900282804
• UPI ID: 9900282804@ybl

Thank you.`;
        return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    };

    // Open receipt payment history inline
    const handleOpenHistory = async (student: StudentFeeDetail) => {
        setSelectedStudentForHistory(student);
        setLoadingHistory(true);
        try {
            const { data } = await supabase
                .from('fee_receipts')
                .select('id, receipt_number, receipt_date, amount_paid, payment_mode')
                .eq('student_id', student.student_id)
                .order('receipt_date', { ascending: false });
            setPaymentHistory(data || []);
        } catch (e) {
            console.error('Error fetching receipts history:', e);
        } finally {
            setLoadingHistory(false);
        }
    };

    // Open configure alert box modal
    const handleOpenAlertSetup = (student: StudentFeeDetail) => {
        setSelectedStudentForAlert(student);
        setAlertFrequency((student.alert_frequency as any) || 'once');
    };

    // Submit alert toggle update back to database
    const handleSubmitAlertSetup = async () => {
        if (!selectedStudentForAlert || !currentYearId) return;
        setSubmittingAlert(true);
        try {
            // Verify student_fees row exists, if not create one
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
            } else {
                const { error } = await supabase
                    .from('student_fees')
                    .insert({
                        student_id: selectedStudentForAlert.student_id,
                        academic_year_id: currentYearId,
                        total_amount: selectedStudentForAlert.total_amount,
                        amount_paid: 0,
                        amount_pending: selectedStudentForAlert.total_amount,
                        alert_active: true,
                        alert_frequency: alertFrequency,
                        updated_at: new Date().toISOString()
                    });
                if (error) throw error;
            }

            alert(`Fee reminder alert successfully configured and activated for ${selectedStudentForAlert.full_name}!`);
            setSelectedStudentForAlert(null);
            fetchFeeStatus(); // Refresh table view
        } catch (e: any) {
            alert('Failed to configure alert: ' + e.message);
        } finally {
            setSubmittingAlert(false);
        }
    };

    // Deactivate active alert configuration
    const handleDeactivateAlert = async (student: StudentFeeDetail) => {
        if (!confirm(`Are you sure you want to stop in-app alerts for ${student.full_name}?`)) return;
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

    // Export list to CSV
    const exportToCSV = () => {
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
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `GKVS_Fee_Report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Filter table content based on user selections
    const filteredStudents = students.filter(student => {
        // Search filter
        const matchQuery = student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           student.registration_number.toLowerCase().includes(searchQuery.toLowerCase());
        
        // Status filter
        let matchStatus = true;
        if (statusFilter === 'paid') {
            matchStatus = student.total_amount > 0 && student.pending_amount === 0;
        } else if (statusFilter === 'pending') {
            matchStatus = student.paid_amount > 0 && student.pending_amount > 0;
        } else if (statusFilter === 'unpaid') {
            matchStatus = student.total_amount > 0 && student.paid_amount === 0;
        }

        // Recent paid warning filter
        const matchRecent = showOnlyRecentPaid ? isRecentlyPaid(student.last_payment_date) : true;

        return matchQuery && matchStatus && matchRecent;
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
                    <h1>School Fee Reports</h1>
                    <p>Track student payments, review receipt balances, and manage parent mobile app reminders</p>
                </div>
            </div>

            {/* Overall Collection Metrics */}
            <div className="reports-stats-grid">
                <div className="report-stat-card total-collected">
                    <div className="stat-card-icon">
                        <TrendingUp size={24} />
                    </div>
                    <div className="stat-card-info">
                        <h3>₹{totalCollected.toLocaleString('en-IN')}</h3>
                        <p>Total Fees Collected</p>
                    </div>
                </div>

                <div className="report-stat-card total-pending">
                    <div className="stat-card-icon">
                        <AlertCircle size={24} />
                    </div>
                    <div className="stat-card-info">
                        <h3>₹{totalPending.toLocaleString('en-IN')}</h3>
                        <p>Total Balance Dues</p>
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
                    <button className="refresh-btn" onClick={fetchFeeStatus} title="Refresh lists">
                        <RefreshCw size={18} />
                    </button>
                    <button className="export-btn" onClick={exportToCSV}>
                        <FileSpreadsheet size={18} />
                        Export
                    </button>
                </div>
            </div>

            {/* Main Student Data Table */}
            <div className="reports-table-container">
                {loading ? (
                    <div className="table-loading-state">
                        <RefreshCw size={24} className="spin-icon" />
                        <p>Aggregating fee report structures...</p>
                    </div>
                ) : filteredStudents.length === 0 ? (
                    <div className="table-empty-state">
                        <AlertCircle size={48} />
                        <h3>No matching students found</h3>
                        <p>Try loosening your search query or filters.</p>
                    </div>
                ) : (
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
                            {filteredStudents.map((s) => {
                                const isRecent = isRecentlyPaid(s.last_payment_date);

                                return (
                                    <tr key={s.student_id} className="student-report-row">
                                        <td className="student-profile-cell">
                                            <div className="student-avatar-wrap">
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
                                                <span className="parent-sub-name">{s.parent_name ? `S/o or D/o: ${s.parent_name}` : ''}</span>
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
                                                <div className="last-payment-cell">
                                                    <span className="date-text">{new Date(s.last_payment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                                                    {isRecent && (
                                                        <span className="recent-badge-flash" title="Paid very recently! Do not send alerts.">
                                                            ⚡ Recent
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="no-receipt-date">Never</span>
                                            )}
                                        </td>
                                        <td className="no-print actions-col-cell">
                                            {s.parent_phone ? (
                                                <div className="direct-contact-actions">
                                                    <a href={`tel:${s.parent_phone}`} className="call-link-btn" title={`Call parent: ${s.parent_phone}`}>
                                                        <Phone size={14} />
                                                        Call
                                                    </a>
                                                    <a href={getWhatsAppLink(s)} target="_blank" rel="noopener noreferrer" className="wa-link-btn" title="Open pre-filled WhatsApp message">
                                                        <MessageSquare size={14} />
                                                        WhatsApp
                                                    </a>
                                                </div>
                                            ) : (
                                                <span className="no-phone-text">No Phone</span>
                                            )}
                                        </td>
                                        <td className="no-print alert-col-cell">
                                            {s.pending_amount > 0 ? (
                                                s.alert_active ? (
                                                    <div className="alert-active-row">
                                                        <span className="active-alert-indicator" title={`Active reminder alerts (${s.alert_frequency})`}>
                                                            🔔 {s.alert_frequency.toUpperCase()}
                                                        </span>
                                                        <button className="deactivate-alert-btn" onClick={() => handleDeactivateAlert(s)} title="Stop sending alerts">
                                                            <X size={12} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button className="trigger-alert-setup-btn" onClick={() => handleOpenAlertSetup(s)}>
                                                        Send Alert
                                                    </button>
                                                )
                                            ) : (
                                                <span className="alert-disabled-text">-</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Configure Alert Popup Modal */}
            {selectedStudentForAlert && (
                <div className="reports-modal-overlay">
                    <div className="alert-modal-container">
                        <div className="modal-header">
                            <h3>Configure Fee Reminder Alert</h3>
                            <button className="close-modal-btn" onClick={() => setSelectedStudentForAlert(null)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <p className="modal-lead-text">
                                Set up an in-app pop-up reminder for **{selectedStudentForAlert.full_name}**'s parents. 
                                The pop-up will overlay on their screen for 5 seconds when they launch the mobile app.
                            </p>
                            
                            <div className="alert-amount-summary">
                                <div className="summary-field">
                                    <span>Class:</span>
                                    <strong>{selectedStudentForAlert.className}</strong>
                                </div>
                                <div className="summary-field">
                                    <span>Pending Balance:</span>
                                    <strong className="text-red">₹{selectedStudentForAlert.pending_amount.toLocaleString('en-IN')}</strong>
                                </div>
                            </div>

                            <div className="alert-frequency-selector">
                                <label className="input-title">Reminder Frequency</label>
                                <div className="frequency-options-grid">
                                    <label className={`freq-option-card ${alertFrequency === 'once' ? 'selected' : ''}`}>
                                        <input type="radio" name="freq" checked={alertFrequency === 'once'} onChange={() => setAlertFrequency('once')} />
                                        <h4>Show Once</h4>
                                        <p>Shown only next time the app opens, then auto-deactivates.</p>
                                    </label>

                                    <label className={`freq-option-card ${alertFrequency === 'daily' ? 'selected' : ''}`}>
                                        <input type="radio" name="freq" checked={alertFrequency === 'daily'} onChange={() => setAlertFrequency('daily')} />
                                        <h4>Once a Day</h4>
                                        <p>Shown once every 24 hours until the dues are fully paid.</p>
                                    </label>

                                    <label className={`freq-option-card ${alertFrequency === 'weekly' ? 'selected' : ''}`}>
                                        <input type="radio" name="freq" checked={alertFrequency === 'weekly'} onChange={() => setAlertFrequency('weekly')} />
                                        <h4>Once a Week</h4>
                                        <p>Shown once every 7 days until the dues are fully paid.</p>
                                    </label>

                                    <label className={`freq-option-card ${alertFrequency === 'always' ? 'selected' : ''}`}>
                                        <input type="radio" name="freq" checked={alertFrequency === 'always'} onChange={() => setAlertFrequency('always')} />
                                        <h4>Every Launch</h4>
                                        <p>Shown on every launch for 5 seconds until the dues are fully paid.</p>
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="cancel-modal-btn" onClick={() => setSelectedStudentForAlert(null)}>Cancel</button>
                            <button className="confirm-modal-btn" onClick={handleSubmitAlertSetup} disabled={submittingAlert}>
                                {submittingAlert ? 'Activating...' : 'Activate In-App Alert'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Receipts History Slide drawer Modal */}
            {selectedStudentForHistory && (
                <div className="history-drawer-overlay" onClick={() => setSelectedStudentForHistory(null)}>
                    <div className="history-drawer-content" onClick={(e) => e.stopPropagation()}>
                        <div className="drawer-header">
                            <div>
                                <h3>Payment Receipts History</h3>
                                <p>{selectedStudentForHistory.full_name} • Reg No: {selectedStudentForHistory.registration_number}</p>
                            </div>
                            <button className="close-drawer-btn" onClick={() => setSelectedStudentForHistory(null)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="drawer-body">
                            {loadingHistory ? (
                                <div className="drawer-loading">
                                    <RefreshCw size={24} className="spin-icon" />
                                    <p>Retrieving payment timeline...</p>
                                </div>
                            ) : paymentHistory.length === 0 ? (
                                <div className="drawer-empty">
                                    <FileText size={48} />
                                    <p>No receipts registered for this student yet.</p>
                                </div>
                            ) : (
                                <div className="drawer-receipts-list">
                                    {paymentHistory.map((receipt, index) => (
                                        <div className="receipt-timeline-card" key={index}>
                                            <div className="receipt-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span className="receipt-number">Receipt #{receipt.receipt_number.toString().padStart(4, '0')}</span>
                                                <button 
                                                    className="inline-view-receipt-btn"
                                                    onClick={() => setSelectedReceiptIdForModal(receipt.id)}
                                                    style={{
                                                        padding: '4px 8px',
                                                        background: '#EFF6FF',
                                                        color: '#3B82F6',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        fontSize: '11px',
                                                        fontWeight: '600',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px'
                                                    }}
                                                >
                                                    <ReceiptText size={12} /> View Receipt
                                                </button>
                                            </div>
                                            <div className="receipt-card-body">
                                                <div className="receipt-detail">
                                                    <span>Amount Paid:</span>
                                                    <strong className="text-green">₹{receipt.amount_paid.toLocaleString('en-IN')}</strong>
                                                </div>
                                                <div className="receipt-detail">
                                                    <span>Payment Mode:</span>
                                                    <span>{receipt.payment_mode}</span>
                                                </div>
                                                <div className="receipt-detail">
                                                    <span>Date:</span>
                                                    <span>{new Date(receipt.receipt_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            </div>
            {selectedReceiptIdForModal && (
                <ReceiptViewModal
                    receiptId={selectedReceiptIdForModal}
                    onClose={() => setSelectedReceiptIdForModal(null)}
                />
            )}
        </div>
    );
}
