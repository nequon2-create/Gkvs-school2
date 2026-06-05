import { useNavigate } from 'react-router-dom';
import { Settings, ReceiptText, ChevronRight, FileText } from 'lucide-react';
import './BillingPage.css';

export function BillingPage() {
    const navigate = useNavigate();

    return (
        <div className="billing-page">
            <div className="billing-header">
                <div>
                    <h1 className="billing-title">Billing & Fee Management</h1>
                    <p className="billing-subtitle">Manage school fees and generate receipts for students</p>
                </div>
            </div>

            <div className="billing-grid">
                {/* Set Fees Card */}
                <div
                    className="billing-card"
                    onClick={() => navigate('/billing/set-fees')}
                >
                    <div className="card-icon-wrapper set-fees-icon">
                        <Settings size={32} />
                    </div>
                    <div className="card-content">
                        <h2 className="card-title">Set Fees</h2>
                        <p className="card-description">
                            Configure fee structure for each class (1st to 10th). Define components like tuition, sports, and laboratory fees.
                        </p>
                    </div>
                    <div className="card-footer">
                        <span className="footer-text">Configure Fees</span>
                        <ChevronRight size={18} />
                    </div>
                </div>

                {/* Create Receipt Card */}
                <div
                    className="billing-card"
                    onClick={() => navigate('/billing/create-receipt')}
                >
                    <div className="card-icon-wrapper receipt-icon">
                        <ReceiptText size={32} />
                    </div>
                    <div className="card-content">
                        <h2 className="card-title">Create Receipt</h2>
                        <p className="card-description">
                            Generate academic fee receipts for students. Track payments, handle partial amounts, and print formal receipts.
                        </p>
                    </div>
                    <div className="card-footer">
                        <span className="footer-text">Generate Receipt</span>
                        <ChevronRight size={18} />
                    </div>
                </div>

                {/* Fee Reports Card */}
                <div
                    className="billing-card"
                    onClick={() => navigate('/billing/reports')}
                >
                    <div className="card-icon-wrapper reports-icon">
                        <FileText size={32} />
                    </div>
                    <div className="card-content">
                        <h2 className="card-title">Fee Reports</h2>
                        <p className="card-description">
                            View overall fee collection statistics, filter by class, search students, send popup alerts, and contact parents via WhatsApp or phone.
                        </p>
                    </div>
                    <div className="card-footer">
                        <span className="footer-text">View Reports</span>
                        <ChevronRight size={18} />
                    </div>
                </div>
            </div>
        </div>
    );
}
