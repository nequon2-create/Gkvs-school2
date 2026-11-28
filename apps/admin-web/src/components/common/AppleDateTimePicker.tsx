import { useState, useRef, useEffect } from 'react';
import { Calendar, Clock, ChevronDown, Check, X } from 'lucide-react';
import './AppleDateTimePicker.css';

interface AppleDateTimePickerProps {
    dateValue: string; // YYYY-MM-DD
    timeValue: string; // HH:mm (24-hour format)
    onDateChange: (dateStr: string) => void;
    onTimeChange: (timeStr: string) => void;
    label?: string;
    required?: boolean;
    disabled?: boolean;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const HOURS_12 = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];
const PERIODS = ['AM', 'PM'];

export function AppleDateTimePicker({
    dateValue,
    timeValue,
    onDateChange,
    onTimeChange,
    label,
    required = false,
    disabled = false,
}: AppleDateTimePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);

    // Initial parsing
    const currentYear = new Date().getFullYear();
    const parseInitialDate = () => {
        if (!dateValue) {
            const today = new Date();
            return {
                day: today.getDate(),
                month: today.getMonth(),
                year: today.getFullYear(),
            };
        }
        const parts = dateValue.split('-');
        if (parts.length === 3) {
            return {
                year: parseInt(parts[0], 10) || currentYear,
                month: Math.max(0, Math.min(11, (parseInt(parts[1], 10) || 1) - 1)),
                day: parseInt(parts[2], 10) || 1,
            };
        }
        return { day: 1, month: 0, year: currentYear };
    };

    const parseInitialTime = () => {
        if (!timeValue) return { hour12: '09', minute: '00', period: 'AM' };
        const parts = timeValue.split(':');
        const h24 = parseInt(parts[0], 10) || 9;
        const m = parseInt(parts[1], 10) || 0;
        const period = h24 >= 12 ? 'PM' : 'AM';
        let h12 = h24 % 12;
        if (h12 === 0) h12 = 12;
        const hStr = h12 < 10 ? `0${h12}` : `${h12}`;
        // Snap minute to nearest 5
        const snapM = Math.round(m / 5) * 5 % 60;
        const mStr = snapM < 10 ? `0${snapM}` : `${snapM}`;
        return { hour12: hStr, minute: mStr, period };
    };

    const initialD = parseInitialDate();
    const initialT = parseInitialTime();

    const [selDay, setSelDay] = useState(initialD.day);
    const [selMonth, setSelMonth] = useState(initialD.month);
    const [selYear, setSelYear] = useState(initialD.year);

    const [selHour, setSelHour] = useState(initialT.hour12);
    const [selMinute, setSelMinute] = useState(initialT.minute);
    const [selPeriod, setSelPeriod] = useState(initialT.period);

    // Sync from props
    useEffect(() => {
        if (dateValue) {
            const d = parseInitialDate();
            setSelDay(d.day);
            setSelMonth(d.month);
            setSelYear(d.year);
        }
    }, [dateValue]);

    useEffect(() => {
        if (timeValue) {
            const t = parseInitialTime();
            setSelHour(t.hour12);
            setSelMinute(t.minute);
            setSelPeriod(t.period);
        }
    }, [timeValue]);

    // Available years: currentYear to currentYear + 3
    const years = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2];

    const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
    const daysInCurMonth = getDaysInMonth(selYear, selMonth);
    const days = Array.from({ length: daysInCurMonth }, (_, i) => i + 1);

    // Close on outside click
    useEffect(() => {
        const handleOutside = (e: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleOutside);
        }
        return () => document.removeEventListener('mousedown', handleOutside);
    }, [isOpen]);

    const handleConfirm = () => {
        // Build YYYY-MM-DD
        const validDay = Math.min(selDay, daysInCurMonth);
        const mm = String(selMonth + 1).padStart(2, '0');
        const dd = String(validDay).padStart(2, '0');
        const formattedDate = `${selYear}-${mm}-${dd}`;
        onDateChange(formattedDate);

        // Build HH:mm (24 hour)
        let h24 = parseInt(selHour, 10);
        if (selPeriod === 'PM' && h24 !== 12) h24 += 12;
        if (selPeriod === 'AM' && h24 === 12) h24 = 0;
        const hh = String(h24).padStart(2, '0');
        const formattedTime = `${hh}:${selMinute}`;
        onTimeChange(formattedTime);

        setIsOpen(false);
    };

    // Formatted display text
    const displayDateStr = dateValue
        ? new Date(dateValue).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        : 'Select Date';

    const formatDisplayTime = (tStr: string) => {
        if (!tStr) return '09:00 AM';
        const parts = tStr.split(':');
        let h = parseInt(parts[0], 10) || 0;
        const m = parts[1] || '00';
        const p = h >= 12 ? 'PM' : 'AM';
        h = h % 12;
        if (h === 0) h = 12;
        return `${String(h).padStart(2, '0')}:${m} ${p}`;
    };

    return (
        <div className="apple-dt-container">
            {label && (
                <label className="apple-dt-label">
                    {label} {required && <span className="apple-dt-req">*</span>}
                </label>
            )}

            {/* Apple Trigger Button */}
            <button
                type="button"
                className={`apple-dt-trigger ${isOpen ? 'active' : ''}`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
            >
                <div className="apple-dt-trigger-content">
                    <span className="apple-dt-pill-date">
                        <Calendar size={14} className="apple-dt-icon" />
                        <span>{displayDateStr}</span>
                    </span>
                    <span className="apple-dt-sep">•</span>
                    <span className="apple-dt-pill-time">
                        <Clock size={14} className="apple-dt-icon" />
                        <span>{timeValue ? formatDisplayTime(timeValue) : '09:00 AM'}</span>
                    </span>
                </div>
                <ChevronDown size={14} className={`apple-dt-chevron ${isOpen ? 'open' : ''}`} />
            </button>

            {/* Apple iOS Scroll Wheel Popover */}
            {isOpen && (
                <div className="apple-dt-popover" ref={modalRef}>
                    <div className="apple-dt-popover-header">
                        <div className="apple-dt-popover-title">
                            <span>Scroll to select date & time</span>
                        </div>
                        <button
                            type="button"
                            className="apple-dt-close-btn"
                            onClick={() => setIsOpen(false)}
                        >
                            <X size={16} />
                        </button>
                    </div>

                    <div className="apple-dt-live-preview">
                        <span className="apple-dt-preview-badge">Selected Schedule</span>
                        <div className="apple-dt-preview-text">
                            {MONTHS[selMonth]} {selDay}, {selYear} at {selHour}:{selMinute} {selPeriod}
                        </div>
                    </div>

                    {/* Wheel Columns Section */}
                    <div className="apple-dt-wheel-stage">
                        {/* Center Highlight Lens */}
                        <div className="apple-dt-wheel-lens" />

                        {/* Top & Bottom Glass Fade */}
                        <div className="apple-dt-fade-top" />
                        <div className="apple-dt-fade-bottom" />

                        <div className="apple-dt-wheels-row">
                            {/* DATE: DAY */}
                            <div className="apple-dt-col">
                                <div className="apple-dt-col-header">Day</div>
                                <div className="apple-dt-wheel-scroll">
                                    <div className="apple-dt-spacer" />
                                    {days.map((d) => (
                                        <div
                                            key={d}
                                            className={`apple-dt-item ${selDay === d ? 'selected' : ''}`}
                                            onClick={() => setSelDay(d)}
                                        >
                                            {String(d).padStart(2, '0')}
                                        </div>
                                    ))}
                                    <div className="apple-dt-spacer" />
                                </div>
                            </div>

                            {/* DATE: MONTH */}
                            <div className="apple-dt-col">
                                <div className="apple-dt-col-header">Month</div>
                                <div className="apple-dt-wheel-scroll">
                                    <div className="apple-dt-spacer" />
                                    {MONTHS.map((m, idx) => (
                                        <div
                                            key={m}
                                            className={`apple-dt-item ${selMonth === idx ? 'selected' : ''}`}
                                            onClick={() => setSelMonth(idx)}
                                        >
                                            {m}
                                        </div>
                                    ))}
                                    <div className="apple-dt-spacer" />
                                </div>
                            </div>

                            {/* DATE: YEAR */}
                            <div className="apple-dt-col">
                                <div className="apple-dt-col-header">Year</div>
                                <div className="apple-dt-wheel-scroll">
                                    <div className="apple-dt-spacer" />
                                    {years.map((y) => (
                                        <div
                                            key={y}
                                            className={`apple-dt-item ${selYear === y ? 'selected' : ''}`}
                                            onClick={() => setSelYear(y)}
                                        >
                                            {y}
                                        </div>
                                    ))}
                                    <div className="apple-dt-spacer" />
                                </div>
                            </div>

                            {/* DIVIDER */}
                            <div className="apple-dt-wheel-divider" />

                            {/* TIME: HOUR */}
                            <div className="apple-dt-col">
                                <div className="apple-dt-col-header">Hour</div>
                                <div className="apple-dt-wheel-scroll">
                                    <div className="apple-dt-spacer" />
                                    {HOURS_12.map((h) => (
                                        <div
                                            key={h}
                                            className={`apple-dt-item ${selHour === h ? 'selected' : ''}`}
                                            onClick={() => setSelHour(h)}
                                        >
                                            {h}
                                        </div>
                                    ))}
                                    <div className="apple-dt-spacer" />
                                </div>
                            </div>

                            {/* TIME: MINUTE */}
                            <div className="apple-dt-col">
                                <div className="apple-dt-col-header">Min</div>
                                <div className="apple-dt-wheel-scroll">
                                    <div className="apple-dt-spacer" />
                                    {MINUTES.map((min) => (
                                        <div
                                            key={min}
                                            className={`apple-dt-item ${selMinute === min ? 'selected' : ''}`}
                                            onClick={() => setSelMinute(min)}
                                        >
                                            {min}
                                        </div>
                                    ))}
                                    <div className="apple-dt-spacer" />
                                </div>
                            </div>

                            {/* TIME: AM/PM */}
                            <div className="apple-dt-col apple-dt-col-period">
                                <div className="apple-dt-col-header">Period</div>
                                <div className="apple-dt-wheel-scroll">
                                    <div className="apple-dt-spacer" />
                                    {PERIODS.map((p) => (
                                        <div
                                            key={p}
                                            className={`apple-dt-item ${selPeriod === p ? 'selected' : ''}`}
                                            onClick={() => setSelPeriod(p)}
                                        >
                                            {p}
                                        </div>
                                    ))}
                                    <div className="apple-dt-spacer" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Popover Footer */}
                    <div className="apple-dt-footer">
                        <button
                            type="button"
                            className="apple-dt-btn-cancel"
                            onClick={() => setIsOpen(false)}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="apple-dt-btn-done"
                            onClick={handleConfirm}
                        >
                            <Check size={16} />
                            Done
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
