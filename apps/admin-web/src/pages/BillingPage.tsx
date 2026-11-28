import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Settings,
    ReceiptText,
    ChevronRight,
    FileText,
    CreditCard,
    TrendingUp,
    ShieldCheck,
    Sparkles
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import './BillingPage.css';

export function BillingPage() {
    const navigate = useNavigate();
    const [stats, setStats] = useState<{
        totalCollected: number;
        totalPending: number;
        receiptCount: number;
        activeYearName: string;
    }>({
        totalCollected: 0,
        totalPending: 0,
        receiptCount: 0,
        activeYearName: ''
    });

    useEffect(() => {
        fetchQuickBillingMetrics();
    }, []);

    const fetchQuickBillingMetrics = async () => {
        try {
            const { data: currentYear } = await supabase
                .from('academic_years')
                .select('id, year_name')
                .eq('is_current', true)
                .maybeSingle();

            const yearId = currentYear?.id;
            const yearName = currentYear?.year_name || 'Current Session';

            if (yearId) {
                // Non-cancelled receipts sum
                const { data: receipts } = await supabase
                    .from('fee_receipts')
                    .select('amount_paid, is_cancelled')
                    .eq('academic_year_id', yearId)
                    .or('is_cancelled.is.null,is_cancelled.eq.false');

                const collected = receipts?.reduce((acc, r) => acc + (Number(r.amount_paid) || 0), 0) || 0;
                const count = receipts?.length || 0;

                // Pending balance sum from student_fees
                const { data: studentFees } = await supabase
                    .from('student_fees')
                    .select('amount_pending')
                    .eq('academic_year_id', yearId);

                const pending = studentFees?.reduce((acc, sf) => acc + (Number(sf.amount_pending) || 0), 0) || 0;

                setStats({
                    totalCollected: collected,
                    totalPending: pending,
                    receiptCount: count,
                    activeYearName: yearName
                });
            }
        } catch (err) {
            console.error('Error fetching billing quick stats:', err);
        }
    };

    return (
        <div className="billing-page">
            {/* Header */}
            <div className="billing-header">
                <div className="billing-header-left">
                    <div className="billing-eyebrow">
                        <Sparkles size={13} />
                        Finance & Accounts
                    </div>
                    <h1 className="billing-title">Billing & Fee Management</h1>
                    <p className="billing-subtitle">
                        Streamlined tuition and ancillary fee governance for {stats.activeYearName || '2026-2027'}. Manage class structures, issue official receipts, and monitor collections.
                    </p>
                </div>
            </div>

            {/* Live Metrics Summary Bar */}
            <div className="billing-metrics-strip">
                <div className="billing-metric-card">
                    <div className="billing-metric-info">
                        <span className="metric-label">Total Fees Collected</span>
                        <span className="metric-value">₹{stats.totalCollected.toLocaleString('en-IN')}</span>
                        <span className="metric-badge green">Verified Bank & Cash</span>
                    </div>
                    <div className="billing-metric-icon green-bg">
                        <TrendingUp size={24} />
                    </div>
                </div>

                <div className="billing-metric-card">
                    <div className="billing-metric-info">
                        <span className="metric-label">Outstanding Balance Due</span>
                        <span className="metric-value">₹{stats.totalPending.toLocaleString('en-IN')}</span>
                        <span className="metric-badge amber">Across All Classes</span>
                    </div>
                    <div className="billing-metric-icon amber-bg">
                        <CreditCard size={24} />
                    </div>
                </div>

                <div className="billing-metric-card">
                    <div className="billing-metric-info">
                        <span className="metric-label">Receipts Generated</span>
                        <span className="metric-value">{stats.receiptCount}</span>
                        <span className="metric-badge blue">Academic & 5 Items</span>
                    </div>
                    <div className="billing-metric-icon blue-bg">
                        <ShieldCheck size={24} />
                    </div>
                </div>
            </div>

            {/* Feature Cards Grid */}
            <div className="billing-grid">
                {/* 1. Set Fees Card */}
                <div
                    className="billing-card set-fees-card"
                    onClick={() => navigate('/billing/set-fees')}
                >
                    <div className="card-top-row">
                        <div className="card-icon-wrapper set-fees-icon">
                            <Settings size={28} />
                        </div>
                        <span className="card-tag">Structure</span>
                    </div>

                    <div className="card-content">
                        <h2 className="card-title">Set Fees Structure</h2>
                        <p className="card-description">
                            Configure standard academic fees (admission, tuition, sports, labs) as well as the 5 ancillary items (uniform, books, van, tie/belt, shoes) for whole classes or individual students.
                        </p>
                        <div className="card-pills-row">
                            <span className="card-pill">Whole Class</span>
                            <span className="card-pill">Individual Custom</span>
                            <span className="card-pill">5 Ancillary Items</span>
                        </div>
                    </div>

                    <div className="card-footer">
                        <span>Configure Fee Structures</span>
                        <div className="footer-action-wrap">
                            <ChevronRight size={18} />
                        </div>
                    </div>
                </div>

                {/* 2. Create Receipt Card */}
                <div
                    className="billing-card receipt-card"
                    onClick={() => navigate('/billing/create-receipt')}
                >
                    <div className="card-top-row">
                        <div className="card-icon-wrapper receipt-icon">
                            <ReceiptText size={28} />
                        </div>
                        <span className="card-tag">Official</span>
                    </div>

                    <div className="card-content">
                        <h2 className="card-title">Create Official Receipt</h2>
                        <p className="card-description">
                            Issue bilingual Kannada/English fee receipts with auto-sequence numbering (#1+ for items), live balance validation, and instant physical printing.
                        </p>
                        <div className="card-pills-row">
                            <span className="card-pill">Academic & Item Toggle</span>
                            <span className="card-pill">Overpayment Guard</span>
                            <span className="card-pill">Bilingual Printout</span>
                        </div>
                    </div>

                    <div className="card-footer">
                        <span>Issue Official Receipt</span>
                        <div className="footer-action-wrap">
                            <ChevronRight size={18} />
                        </div>
                    </div>
                </div>

                {/* 3. Fee Reports Card */}
                <div
                    className="billing-card reports-card"
                    onClick={() => navigate('/billing/reports')}
                >
                    <div className="card-top-row">
                        <div className="card-icon-wrapper reports-icon">
                            <FileText size={28} />
                        </div>
                        <span className="card-tag">Analytics</span>
                    </div>

                    <div className="card-content">
                        <h2 className="card-title">Fee Reports & Dues</h2>
                        <p className="card-description">
                            Comprehensive student payment registers, class-wise filter summaries, instant WhatsApp/call parent reminders, and CSV spreadsheet exports.
                        </p>
                        <div className="card-pills-row">
                            <span className="card-pill">Receipt Auditing</span>
                            <span className="card-pill">WhatsApp Reminders</span>
                            <span className="card-pill">CSV Export</span>
                        </div>
                    </div>

                    <div className="card-footer">
                        <span>Explore Analytics & Dues</span>
                        <div className="footer-action-wrap">
                            <ChevronRight size={18} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
