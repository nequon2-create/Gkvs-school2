import { useState, useEffect } from 'react';
import { fetchDailyBriefingData, type DailyBriefingData } from '../../../utils/dailyBriefing';
import { Send, CheckCircle, Clock, Smartphone, MessageSquare } from 'lucide-react';

export function DailyBriefingCard() {
    const [data, setData] = useState<DailyBriefingData | null>(null);
    const [loading, setLoading] = useState(true);
    const [principalPhone, setPrincipalPhone] = useState('919876543210'); // Default principal number
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        loadBriefing();
    }, []);

    const loadBriefing = async () => {
        setLoading(true);
        const briefing = await fetchDailyBriefingData();
        setData(briefing);
        setLoading(false);
    };

    const handleSendWhatsApp = () => {
        if (!data) return;
        const encodedText = encodeURIComponent(data.formattedWhatsAppText);
        const cleanPhone = principalPhone.replace(/[^0-9]/g, '');
        const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedText}`;
        window.open(whatsappUrl, '_blank');
    };

    const handleCopyText = () => {
        if (!data) return;
        navigator.clipboard.writeText(data.formattedWhatsAppText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return (
            <div style={{
                background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
                borderRadius: '20px',
                padding: '24px',
                color: '#FFF',
                marginBottom: '24px',
            }}>
                <p>Loading 5:00 PM Daily Briefing...</p>
            </div>
        );
    }

    return (
        <div style={{
            background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
            borderRadius: '20px',
            padding: '24px',
            color: '#FFF',
            marginBottom: '24px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Header Badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '12px',
                        backgroundColor: 'rgba(34, 197, 94, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#4ADE80'
                    }}>
                        <MessageSquare size={22} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#F8FAFC', margin: 0 }}>
                            Daily WhatsApp Briefing Engine
                        </h3>
                        <p style={{ fontSize: '12px', color: '#94A3B8', margin: '2px 0 0 0' }}>
                            Automatic 5:00 PM Summary • Keeps Supabase Active 24/7
                        </p>
                    </div>
                </div>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: 'rgba(52, 211, 153, 0.15)',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    border: '1px solid rgba(52, 211, 153, 0.3)'
                }}>
                    <Clock size={14} color="#34D399" />
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#34D399' }}>
                        Auto-Cron Active (5:00 PM IST)
                    </span>
                </div>
            </div>

            {/* Quick Metrics Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '16px',
                marginBottom: '20px',
            }}>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.06)', padding: '14px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <span style={{ fontSize: '12px', color: '#94A3B8' }}>Student Attendance</span>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#4ADE80', marginTop: '4px' }}>
                        {data?.studentAttendancePct}%
                    </div>
                    <span style={{ fontSize: '11px', color: '#64748B' }}>{data?.presentStudents} / {data?.totalStudents} Present</span>
                </div>

                <div style={{ backgroundColor: 'rgba(255,255,255,0.06)', padding: '14px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <span style={{ fontSize: '12px', color: '#94A3B8' }}>Teacher Staff</span>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#60A5FA', marginTop: '4px' }}>
                        {data?.presentTeachers} / {data?.totalTeachers}
                    </div>
                    <span style={{ fontSize: '11px', color: '#64748B' }}>Teachers Present</span>
                </div>

                <div style={{ backgroundColor: 'rgba(255,255,255,0.06)', padding: '14px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <span style={{ fontSize: '12px', color: '#94A3B8' }}>Homework Posted</span>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#F59E0B', marginTop: '4px' }}>
                        {data?.homeworkUploadedClasses} / {data?.totalClasses}
                    </div>
                    <span style={{ fontSize: '11px', color: '#64748B' }}>Classes Completed</span>
                </div>

                <div style={{ backgroundColor: 'rgba(255,255,255,0.06)', padding: '14px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <span style={{ fontSize: '12px', color: '#94A3B8' }}>Fees Collected</span>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#34D399', marginTop: '4px' }}>
                        ₹{data?.todayFeesCollected.toLocaleString('en-IN')}
                    </div>
                    <span style={{ fontSize: '11px', color: '#64748B' }}>Revenue Today</span>
                </div>
            </div>

            {/* Action Bar & WhatsApp Input */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'rgba(0,0,0,0.25)',
                padding: '14px 18px',
                borderRadius: '14px',
                border: '1px solid rgba(255,255,255,0.06)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Smartphone size={18} color="#94A3B8" />
                    <span style={{ fontSize: '13px', color: '#CBD5E1' }}>Principal Phone:</span>
                    <input
                        type="text"
                        value={principalPhone}
                        onChange={(e) => setPrincipalPhone(e.target.value)}
                        placeholder="e.g. 919876543210"
                        style={{
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            borderRadius: '8px',
                            padding: '6px 12px',
                            color: '#FFF',
                            fontSize: '13px',
                            width: '150px'
                        }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={handleCopyText}
                        style={{
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            border: 'none',
                            borderRadius: '10px',
                            padding: '8px 14px',
                            color: '#FFF',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        {copied ? <CheckCircle size={15} color="#4ADE80" /> : null}
                        <span>{copied ? 'Copied!' : 'Copy Text'}</span>
                    </button>

                    <button
                        onClick={handleSendWhatsApp}
                        style={{
                            backgroundColor: '#25D366',
                            border: 'none',
                            borderRadius: '10px',
                            padding: '8px 18px',
                            color: '#FFF',
                            fontSize: '13px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)'
                        }}
                    >
                        <Send size={15} />
                        <span>Send to Principal via WhatsApp</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
