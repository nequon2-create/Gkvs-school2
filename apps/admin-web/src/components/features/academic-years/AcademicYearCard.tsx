import { Calendar, Edit2, Trash2, Check } from 'lucide-react';
import type { AcademicYear } from '../../../types/academic-years.types';
import { getYearStatus, formatDate } from '../../../utils/academicYearHelpers';
import './AcademicYearCard.css';

export interface AcademicYearCardProps {
    year: AcademicYear;
    onEdit: (year: AcademicYear) => void;
    onDelete: (year: AcademicYear) => void;
    onSetCurrent: (year: AcademicYear) => void;
}

export function AcademicYearCard({ year, onEdit, onDelete, onSetCurrent }: AcademicYearCardProps) {
    const status = getYearStatus(year);

    const getStatusBadge = () => {
        const badges = {
            current: <span className="status-badge current"><Check size={14} /> Current</span>,
            upcoming: <span className="status-badge upcoming">Upcoming</span>,
            past: <span className="status-badge past">Past</span>,
        };
        return badges[status];
    };

    return (
        <div className={`academic-year-card ${status} animate-scale-in hover-lift`}>
            <div className="card-header">
                <div className="year-icon">
                    <Calendar size={24} strokeWidth={2} />
                </div>
                <div className="year-info">
                    <h3 className="year-name">{year.year_name}</h3>
                    {getStatusBadge()}
                </div>
            </div>

            <div className="card-body">
                <div className="date-row">
                    <span className="label">Start:</span>
                    <span className="value">{formatDate(year.start_date)}</span>
                </div>
                <div className="date-row">
                    <span className="label">End:</span>
                    <span className="value">{formatDate(year.end_date)}</span>
                </div>
            </div>

            <div className="card-footer">
                <button
                    className="action-btn edit-btn"
                    onClick={() => onEdit(year)}
                    title="Edit academic year"
                >
                    <Edit2 size={16} />
                    <span>Edit</span>
                </button>

                {!year.is_current && status !== 'current' && (
                    <button
                        className="action-btn set-current-btn"
                        onClick={() => onSetCurrent(year)}
                        title="Set as current year"
                    >
                        <Check size={16} />
                        <span>Set Current</span>
                    </button>
                )}

                <button
                    className="action-btn delete-btn"
                    onClick={() => onDelete(year)}
                    title="Delete academic year"
                    disabled={year.is_current}
                >
                    <Trash2 size={16} />
                    <span>Delete</span>
                </button>
            </div>
        </div>
    );
}
