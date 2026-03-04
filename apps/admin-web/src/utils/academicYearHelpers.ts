import { format, isAfter, isBefore, parseISO } from 'date-fns';
import type { AcademicYear, AcademicYearStatus } from '../types/academic-years.types';

/**
 * Format academic year name from start date
 * Example: "2024-08-01" -> "2024-2025"
 */
export function generateYearName(startDate: string): string {
    const start = parseISO(startDate);
    const startYear = start.getFullYear();
    const endYear = startYear + 1;
    return `${startYear}-${endYear}`;
}

/**
 * Check if a year is currently active based on today's date
 */
export function isYearCurrent(year: AcademicYear): boolean {
    const today = new Date();
    const start = parseISO(year.start_date);
    const end = parseISO(year.end_date);
    return !isBefore(today, start) && !isAfter(today, end);
}

/**
 * Check if a year is upcoming (hasn't started yet)
 */
export function isYearUpcoming(year: AcademicYear): boolean {
    const today = new Date();
    const start = parseISO(year.start_date);
    return isBefore(today, start);
}

/**
 * Check if a year is past (already ended)
 */
export function isYearPast(year: AcademicYear): boolean {
    const today = new Date();
    const end = parseISO(year.end_date);
    return isAfter(today, end);
}

/**
 * Get status of academic year
 */
export function getYearStatus(year: AcademicYear): Exclude<AcademicYearStatus, 'all'> {
    if (year.is_current || isYearCurrent(year)) return 'current';
    if (isYearUpcoming(year)) return 'upcoming';
    return 'past';
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
    return format(parseISO(dateString), 'MMM d, yyyy');
}

/**
 * Validate year name format (YYYY-YYYY)
 */
export function isValidYearName(yearName: string): boolean {
    const pattern = /^\d{4}-\d{4}$/;
    if (!pattern.test(yearName)) return false;

    const [startYear, endYear] = yearName.split('-').map(Number);
    return endYear === startYear + 1;
}

/**
 * Validate date range (end date must be after start date)
 */
export function isValidDateRange(startDate: string, endDate: string): boolean {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    return isAfter(end, start);
}
