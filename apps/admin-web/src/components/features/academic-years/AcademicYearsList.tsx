import { AcademicYearCard } from './AcademicYearCard';
import type { AcademicYear } from '../../../types/academic-years.types';
import './AcademicYearsList.css';

export interface AcademicYearsListProps {
    years: AcademicYear[];
    loading: boolean;
    onEdit: (year: AcademicYear) => void;
    onDelete: (year: AcademicYear) => void;
    onSetCurrent: (year: AcademicYear) => void;
}

export function AcademicYearsList({ years, loading, onEdit, onDelete, onSetCurrent }: AcademicYearsListProps) {
    if (loading) {
        return (
            <div className="years-grid">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="year-card-skeleton">
                        <div className="skeleton" style={{ width: '100%', height: '200px' }} />
                    </div>
                ))}
            </div>
        );
    }

    if (years.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-icon">📅</div>
                <h3 className="empty-title">No Academic Years</h3>
                <p className="empty-text">
                    Get started by creating your first academic year
                </p>
            </div>
        );
    }

    return (
        <div className="years-grid">
            {years.map((year) => (
                <AcademicYearCard
                    key={year.id}
                    year={year}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onSetCurrent={onSetCurrent}
                />
            ))}
        </div>
    );
}
