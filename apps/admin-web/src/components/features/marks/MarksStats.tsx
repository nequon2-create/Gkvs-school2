// Marks Statistics Dashboard
import type { MarksStats, SubjectStats } from '../../../types/marks.types';
import { getGradeColor } from '../../../utils/gradeCalculator';
import './MarksStats.css';

interface Props {
    stats: MarksStats | null;
    subjectStats: SubjectStats[];
}

export function MarksStatsComponent({ stats, subjectStats }: Props) {
    if (!stats) {
        return (
            <div className="stats-empty">
                <p>No statistics available. Enter marks to see analytics.</p>
            </div>
        );
    }

    return (
        <div className="marks-stats-container">
            {/* Summary Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">📊</div>
                    <div className="stat-content">
                        <div className="stat-label">Class Average</div>
                        <div className="stat-value">{stats.average_percentage.toFixed(2)}%</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">🏆</div>
                    <div className="stat-content">
                        <div className="stat-label">Topper</div>
                        <div className="stat-value-small">
                            {stats.topper?.student_name || 'N/A'}<br />
                            <span className="stat-subtext">{stats.topper?.percentage.toFixed(2)}%</span>
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-content">
                        <div className="stat-label">Pass Percentage</div>
                        <div className="stat-value">{stats.pass_percentage.toFixed(2)}%</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">👥</div>
                    <div className="stat-content">
                        <div className="stat-label">Total Students</div>
                        <div className="stat-value">{stats.total_students}</div>
                    </div>
                </div>
            </div>

            {/* Grade Distribution */}
            {stats.grade_distribution && stats.grade_distribution.length > 0 && (
                <div className="grade-distribution-card">
                    <h3>Grade Distribution</h3>
                    <div className="grade-bars">
                        {stats.grade_distribution
                            .sort((a, b) => b.count - a.count)
                            .map(dist => (
                                <div key={dist.grade} className="grade-bar-row">
                                    <div className="grade-label">
                                        <span
                                            className="grade-badge-small"
                                            style={{ backgroundColor: getGradeColor(dist.grade) }}
                                        >
                                            {dist.grade}
                                        </span>
                                    </div>
                                    <div className="bar-container">
                                        <div
                                            className="bar-fill"
                                            style={{
                                                width: `${dist.percentage}%`,
                                                backgroundColor: getGradeColor(dist.grade)
                                            }}
                                        />
                                    </div>
                                    <div className="grade-count">
                                        {dist.count} ({dist.percentage.toFixed(1)}%)
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {/* Subject-wise Statistics */}
            {subjectStats && subjectStats.length > 0 && (
                <div className="subject-stats-card">
                    <h3>Subject-wise Performance</h3>
                    <div className="subject-table-wrapper">
                        <table className="subject-table">
                            <thead>
                                <tr>
                                    <th>Subject</th>
                                    <th>Avg %</th>
                                    <th>Highest</th>
                                    <th>Lowest</th>
                                    <th>Students</th>
                                </tr>
                            </thead>
                            <tbody>
                                {subjectStats.map(subject => (
                                    <tr key={subject.subject}>
                                        <td className="subject-name">{subject.subject}</td>
                                        <td className="avg-percentage">{subject.average_percentage.toFixed(2)}%</td>
                                        <td>{subject.highest_marks}</td>
                                        <td>{subject.lowest_marks}</td>
                                        <td>{subject.total_students}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
