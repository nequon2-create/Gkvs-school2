import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, Check } from 'lucide-react';
import './AppleDatePicker.css';

interface AppleDatePickerProps {
    value: string; // Format: YYYY-MM-DD
    onChange: (dateStr: string) => void;
    label?: string;
    required?: boolean;
    error?: string;
    disabled?: boolean;
    minYear?: number;
    maxYear?: number;
    defaultYear?: number;
}

const MONTH_NAMES = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export function AppleDatePicker({
    value,
    onChange,
    label,
    required = false,
    error,
    disabled = false,
    minYear = 1950,
    maxYear = new Date().getFullYear(),
    defaultYear = new Date().getFullYear() - 10,
}: AppleDatePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Parse initial date or default
    const parseDate = (val: string) => {
        if (!val) {
            return {
                day: 1,
                month: 0, // 0-indexed
                year: defaultYear,
            };
        }
        const parts = val.split('-');
        if (parts.length === 3) {
            const y = parseInt(parts[0], 10) || defaultYear;
            const m = (parseInt(parts[1], 10) - 1) || 0;
            const d = parseInt(parts[2], 10) || 1;
            return { day: d, month: m, year: y };
        }
        return { day: 1, month: 0, year: defaultYear };
    };

    const initialParsed = parseDate(value);
    const [selectedDay, setSelectedDay] = useState(initialParsed.day);
    const [selectedMonth, setSelectedMonth] = useState(initialParsed.month);
    const [selectedYear, setSelectedYear] = useState(initialParsed.year);

    // Sync with external value changes
    useEffect(() => {
        if (value) {
            const p = parseDate(value);
            setSelectedDay(p.day);
            setSelectedMonth(p.month);
            setSelectedYear(p.year);
        }
    }, [value]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Calculate days in current month/year
    const getDaysInMonth = (y: number, m: number) => {
        return new Date(y, m + 1, 0).getDate();
    };

    const daysCount = getDaysInMonth(selectedYear, selectedMonth);
    const days = Array.from({ length: daysCount }, (_, i) => i + 1);

    // Years array (descending so recent years are at top)
    const years = Array.from(
        { length: maxYear - minYear + 1 },
        (_, i) => maxYear - i
    );

    const handleApply = (d = selectedDay, m = selectedMonth, y = selectedYear) => {
        const validDay = Math.min(d, getDaysInMonth(y, m));
        const monthStr = String(m + 1).padStart(2, '0');
        const dayStr = String(validDay).padStart(2, '0');
        const dateStr = `${y}-${monthStr}-${dayStr}`;
        onChange(dateStr);
        setIsOpen(false);
    };

    const formatDisplay = (val: string) => {
        if (!val) return 'Select Date of Birth';
        try {
            const [y, m, d] = val.split('-');
            const monthName = MONTH_NAMES[parseInt(m, 10) - 1] || m;
            return `${d} ${monthName} ${y}`;
        } catch {
            return val;
        }
    };

    return (
        <div className="apple-date-picker-container" ref={containerRef}>
            {label && (
                <label className="apple-date-label">
                    {label} {required && <span className="apple-required-star">*</span>}
                </label>
            )}

            <button
                type="button"
                className={`apple-date-trigger ${error ? 'has-error' : ''} ${isOpen ? 'active' : ''}`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
            >
                <div className="apple-date-trigger-content">
                    <Calendar className="apple-date-icon" size={18} />
                    <span className={value ? 'apple-date-value' : 'apple-date-placeholder'}>
                        {formatDisplay(value)}
                    </span>
                </div>
                <ChevronDown className={`apple-chevron ${isOpen ? 'open' : ''}`} size={16} />
            </button>

            {error && <span className="apple-error-text">{error}</span>}

            {isOpen && (
                <div className="apple-wheel-popover animate-scale-in">
                    <div className="apple-wheel-header">
                        <span className="apple-wheel-title">Date of Birth</span>
                        <button
                            type="button"
                            className="apple-wheel-done-btn"
                            onClick={() => handleApply()}
                        >
                            <Check size={16} /> Done
                        </button>
                    </div>

                    <div className="apple-wheel-body">
                        {/* Center selection lens bar */}
                        <div className="apple-wheel-lens" />

                        {/* Day Column */}
                        <div className="apple-wheel-column">
                            <span className="apple-wheel-col-label">Day</span>
                            <div className="apple-wheel-scroller">
                                {days.map((d) => (
                                    <div
                                        key={d}
                                        className={`apple-wheel-item ${d === selectedDay ? 'selected' : ''}`}
                                        onClick={() => {
                                            setSelectedDay(d);
                                            const monthStr = String(selectedMonth + 1).padStart(2, '0');
                                            const dayStr = String(d).padStart(2, '0');
                                            onChange(`${selectedYear}-${monthStr}-${dayStr}`);
                                        }}
                                    >
                                        {d}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Month Column */}
                        <div className="apple-wheel-column">
                            <span className="apple-wheel-col-label">Month</span>
                            <div className="apple-wheel-scroller">
                                {MONTH_NAMES.map((name, idx) => (
                                    <div
                                        key={name}
                                        className={`apple-wheel-item ${idx === selectedMonth ? 'selected' : ''}`}
                                        onClick={() => {
                                            setSelectedMonth(idx);
                                            const validDay = Math.min(selectedDay, getDaysInMonth(selectedYear, idx));
                                            const monthStr = String(idx + 1).padStart(2, '0');
                                            const dayStr = String(validDay).padStart(2, '0');
                                            onChange(`${selectedYear}-${monthStr}-${dayStr}`);
                                        }}
                                    >
                                        {name}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Year Column */}
                        <div className="apple-wheel-column year-column">
                            <span className="apple-wheel-col-label">Year</span>
                            <div className="apple-wheel-scroller">
                                {years.map((y) => (
                                    <div
                                        key={y}
                                        className={`apple-wheel-item ${y === selectedYear ? 'selected' : ''}`}
                                        onClick={() => {
                                            setSelectedYear(y);
                                            const validDay = Math.min(selectedDay, getDaysInMonth(y, selectedMonth));
                                            const monthStr = String(selectedMonth + 1).padStart(2, '0');
                                            const dayStr = String(validDay).padStart(2, '0');
                                            onChange(`${y}-${monthStr}-${dayStr}`);
                                        }}
                                    >
                                        {y}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="apple-wheel-footer">
                        <span className="apple-wheel-hint">Click or scroll any column to adjust date</span>
                    </div>
                </div>
            )}
        </div>
    );
}
