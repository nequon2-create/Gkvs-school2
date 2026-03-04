// Grade calculation utilities for marks system

import type { Grade, MarksRecord, MarksStats, SubjectStats } from '../types/marks.types';
import { GRADE_CONFIG, GRADE_COLORS } from '../types/marks.types';

/**
 * Calculate grade based on marks obtained and maximum marks
 */
export function calculateGrade(marksObtained: number, maxMarks: number): Grade {
    if (maxMarks <= 0) return 'F';

    const percentage = (marksObtained / maxMarks) * 100;

    // Find grade using GRADE_CONFIG
    const gradeConfig = GRADE_CONFIG.find(
        (config) => percentage >= config.minMarks && percentage <= config.maxMarks
    );

    return gradeConfig?.grade ?? 'F';
}

/**
 * Calculate percentage
 */
export function calculatePercentage(marksObtained: number, maxMarks: number): number {
    if (maxMarks <= 0) return 0;
    return Number(((marksObtained / maxMarks) * 100).toFixed(2));
}

/**
 * Get color for a grade (for UI styling)
 */
export function getGradeColor(grade: Grade): string {
    return GRADE_COLORS[grade] || '#6b7280'; // Gray fallback
}

/**
 * Check if a grade is passing (D or better)
 */
export function isPassingGrade(grade: Grade): boolean {
    return ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D'].includes(grade);
}

/**
 * Get grade description
 */
export function getGradeDescription(grade: Grade): string {
    const descriptions: Record<Grade, string> = {
        'A+': 'Outstanding',
        'A': 'Excellent',
        'B+': 'Very Good',
        'B': 'Good',
        'C+': 'Average Plus',
        'C': 'Average',
        'D': 'Below Average',
        'F': 'Fail'
    };
    return descriptions[grade];
}

/**
 * Calculate class statistics from marks records
 */
export function calculateMarksStats(marks: MarksRecord[]): MarksStats {
    if (marks.length === 0) {
        return {
            total_students: 0,
            average_percentage: 0,
            highest_marks: 0,
            lowest_marks: 0,
            grade_distribution: [],
            pass_percentage: 0
        };
    }

    // Calculate averages
    const totalPercentage = marks.reduce((sum, mark) => sum + (mark.percentage || calculatePercentage(mark.marks_obtained, mark.max_marks || 100)), 0);
    const averagePercentage = Number((totalPercentage / marks.length).toFixed(2));

    // Find highest and lowest
    const highestMarks = Math.max(...marks.map(m => m.marks_obtained));
    const lowestMarks = Math.min(...marks.map(m => m.marks_obtained));

    // Find topper
    const topperMark = marks.find(m => m.marks_obtained === highestMarks);

    // Calculate grade distribution
    const gradeCounts: Record<string, number> = {};
    marks.forEach(mark => {
        const grade = mark.grade || calculateGrade(mark.marks_obtained, mark.max_marks || 100);
        gradeCounts[grade] = (gradeCounts[grade] || 0) + 1;
    });

    const gradeDistribution = Object.entries(gradeCounts).map(([grade, count]) => ({
        grade: grade as Grade,
        count,
        percentage: Number(((count / marks.length) * 100).toFixed(2))
    }));

    // Calculate pass percentage
    const passingStudents = marks.filter(m => isPassingGrade(m.grade || calculateGrade(m.marks_obtained, m.max_marks || 100))).length;
    const passPercentage = Number(((passingStudents / marks.length) * 100).toFixed(2));

    return {
        total_students: marks.length,
        average_percentage: averagePercentage,
        highest_marks: highestMarks,
        lowest_marks: lowestMarks,
        topper: topperMark ? {
            student_name: '', // Will be filled from joined data
            marks: topperMark.marks_obtained,
            percentage: topperMark.percentage || calculatePercentage(topperMark.marks_obtained, topperMark.max_marks || 100)
        } : undefined,
        grade_distribution: gradeDistribution,
        pass_percentage: passPercentage
    };
}

/**
 * Calculate subject-wise statistics
 */
export function calculateSubjectStats(marks: MarksRecord[]): SubjectStats[] {
    const subjectGroups: Record<string, MarksRecord[]> = {};

    marks.forEach(mark => {
        const subject = (mark as any).subject || mark.subject_id || 'Unknown Subject';
        if (!subjectGroups[subject]) {
            subjectGroups[subject] = [];
        }
        subjectGroups[subject].push(mark);
    });

    return Object.entries(subjectGroups).map(([subject, subjectMarks]) => {
        const totalMarks = subjectMarks.reduce((sum, m) => sum + m.marks_obtained, 0);
        const totalPercentage = subjectMarks.reduce((sum, m) => sum + (m.percentage || calculatePercentage(m.marks_obtained, m.max_marks || 100)), 0);

        return {
            subject,
            average_marks: Number((totalMarks / subjectMarks.length).toFixed(2)),
            average_percentage: Number((totalPercentage / subjectMarks.length).toFixed(2)),
            highest_marks: Math.max(...subjectMarks.map(m => m.marks_obtained)),
            lowest_marks: Math.min(...subjectMarks.map(m => m.marks_obtained)),
            total_students: subjectMarks.length
        };
    });
}

/**
 * Calculate overall marks for a student across all subjects
 */
export function calculateOverallMarks(marks: MarksRecord[]): {
    total_obtained: number;
    total_max: number;
    percentage: number;
    grade: Grade;
} {
    const totalObtained = marks.reduce((sum, m) => sum + m.marks_obtained, 0);
    const totalMax = marks.reduce((sum, m) => sum + m.max_marks, 0);
    const percentage = calculatePercentage(totalObtained, totalMax);
    const grade = calculateGrade(totalObtained, totalMax);

    return {
        total_obtained: totalObtained,
        total_max: totalMax,
        percentage,
        grade
    };
}

/**
 * Validate marks input
 */
export function validateMarks(marksObtained: number, maxMarks: number): string | null {
    if (marksObtained < 0) {
        return 'Marks cannot be negative';
    }

    if (maxMarks <= 0) {
        return 'Maximum marks must be greater than 0';
    }

    if (marksObtained > maxMarks) {
        return `Marks obtained (${marksObtained}) cannot exceed maximum marks (${maxMarks})`;
    }

    return null;
}

/**
 * Format marks display (e.g., "85/100")
 */
export function formatMarksDisplay(marksObtained: number, maxMarks: number): string {
    return `${marksObtained}/${maxMarks}`;
}

/**
 * Get subject emoji/icon
 */
export function getSubjectEmoji(subject: string): string {
    const subjectEmojis: Record<string, string> = {
        'Mathematics': '🔢',
        'Math': '🔢',
        'Science': '🔬',
        'English': '📖',
        'Hindi': '📚',
        'Social Studies': '🌍',
        'History': '📜',
        'Geography': '🗺️',
        'Physics': '⚛️',
        'Chemistry': '🧪',
        'Biology': '🧬',
        'Computer Science': '💻',
        'Physical Education': '⚽',
        'Art': '🎨',
        'Music': '🎵'
    };

    return subjectEmojis[subject] || '📝';
}
