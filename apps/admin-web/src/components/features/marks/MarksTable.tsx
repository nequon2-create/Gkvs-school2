// Marks Table Component - Display and manage marks
import { useState } from 'react';
import type { MarksWithDetails } from '../../../types/marks.types';
import { getGradeColor, formatMarksDisplay, getSubjectEmoji } from '../../../utils/gradeCalculator';
import './MarksTable.css';

interface Props {
    marks: MarksWithDetails[];
    onEdit?: (mark: MarksWithDetails) => void;
    onDelete?: (id: string) => void;
}

export function MarksTable({ marks, onEdit, onDelete }: Props) {
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState<'name' | 'marks' | 'grade'>('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    const filteredMarks = marks.filter(mark =>
        mark.student?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        mark.student?.registration_number?.toLowerCase().includes(search.toLowerCase()) ||
        mark.subject?.toLowerCase().includes(search.toLowerCase())
    );

    const sortedMarks = [...filteredMarks].sort((a, b) => {
        let comparison = 0;

        switch (sortBy) {
            case 'name':
                comparison = (a.student?.full_name || '').localeCompare(b.student?.full_name || '');
                break;
            case 'marks':
                comparison = (a.percentage || 0) - (b.percentage || 0);
                break;
            case 'grade':
                comparison = a.grade.localeCompare(b.grade);
                break;
        }

        return sortOrder === 'asc' ? comparison : -comparison;
    });

    const handleSort = (column: 'name' | 'marks' | 'grade') => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder('asc');
        }
    };

    if (marks.length === 0) {
        return (
            <div className="marks-table-empty">
                <span className="empty-icon">📊</span>
                <h3>No Marks Found</h3>
                <p>Start by entering marks for students or upload from Excel.</p>
            </div>
        );
    }

    // Calculate summary statistics
    const avgPercentage = marks.reduce((sum, m) => sum + (m.percentage || 0), 0) / marks.length;
    const highestMarks = Math.max(...marks.map(m => m.marks_obtained || 0));
    const lowestMarks = Math.min(...marks.map(m => m.marks_obtained || 0));

    return (
        <div className="marks-table-container">
            <div className="marks-table-header">
                <div className="search-box">
                    <input
                        type="text"
                        placeholder="Search by name or reg. number..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="search-input"
                    />
                </div>

                <div className="sort-controls">
                    <span className="sort-label">Sort by:</span>
                    <button
                        className={`sort-btn ${sortBy === 'name' ? 'active' : ''}`}
                        onClick={() => handleSort('name')}
                    >
                        Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </button>
                    <button
                        className={`sort-btn ${sortBy === 'marks' ? 'active' : ''}`}
                        onClick={() => handleSort('marks')}
                    >
                        Marks {sortBy === 'marks' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </button>
                    <button
                        className={`sort-btn ${sortBy === 'grade' ? 'active' : ''}`}
                        onClick={() => handleSort('grade')}
                    >
                        Grade {sortBy === 'grade' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </button>
                </div>
            </div>

            <div className="table-wrapper">
                <table className="marks-table">
                    <thead>
                        <tr>
                            <th>Roll No</th>
                            <th>Student Name</th>
                            <th>Subject</th>
                            <th>Marks</th>
                            <th>%</th>
                            <th>Grade</th>
                            <th>Remarks</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedMarks.map(mark => (
                            <tr key={mark.id}>
                                <td>{mark.student?.roll_number || '--'}</td>
                                <td className="student-name">
                                    {mark.student?.full_name || 'Unknown'}
                                </td>
                                <td className="subject-cell">
                                    <span className="subject-emoji">{getSubjectEmoji(mark.subject || '')}</span>
                                    {mark.subject}
                                </td>
                                <td className="marks-cell">
                                    {formatMarksDisplay(mark.marks_obtained || 0, mark.max_marks || 100)}
                                </td>
                                <td className="percentage-cell">
                                    {(mark.percentage || 0).toFixed(2)}%
                                </td>
                                <td>
                                    <span
                                        className="grade-badge"
                                        style={{ backgroundColor: getGradeColor(mark.grade) }}
                                    >
                                        {mark.grade}
                                    </span>
                                </td>
                                <td className="remarks-cell">
                                    {mark.remarks || '--'}
                                </td>
                                <td className="actions-cell">
                                    {onEdit && (
                                        <button
                                            className="action-btn edit-btn"
                                            onClick={() => onEdit(mark)}
                                            title="Edit"
                                        >
                                            ✏️
                                        </button>
                                    )}
                                    {onDelete && (
                                        <button
                                            className="action-btn delete-btn"
                                            onClick={() => {
                                                if (confirm('Delete this mark entry?')) {
                                                    onDelete(mark.id);
                                                }
                                            }}
                                            title="Delete"
                                        >
                                            🗑️
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="summary-row">
                            <td colSpan={3}><strong>Summary</strong></td>
                            <td><strong>Total: {marks.length}</strong></td>
                            <td><strong>{avgPercentage.toFixed(2)}%</strong></td>
                            <td colSpan={3}>
                                <span className="summary-stats">
                                    Highest: {highestMarks} | Lowest: {lowestMarks}
                                </span>
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {filteredMarks.length === 0 && search && (
                <div className="no-results">
                    No results found for "{search}"
                </div>
            )}
        </div>
    );
}
