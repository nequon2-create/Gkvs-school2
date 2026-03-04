// Profile Utility Functions
// Helper functions for profile data manipulation and formatting

import type { AttendanceStatus, AcademicRecord } from '../types/profile.types';
import type { Grade } from '../types/marks.types';

/**
 * Calculate age from date of birth
 */
export function calculateAge(dateOfBirth: string): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    return age;
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string | null | undefined): string {
    if (!phone) return 'Not provided';

    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');

    // Format as (XXX) XXX-XXXX for 10-digit numbers
    if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }

    // Format with country code for longer numbers
    if (cleaned.length > 10) {
        const countryCode = cleaned.slice(0, cleaned.length - 10);
        const areaCode = cleaned.slice(-10, -7);
        const firstPart = cleaned.slice(-7, -4);
        const lastPart = cleaned.slice(-4);
        return `+${countryCode} (${areaCode}) ${firstPart}-${lastPart}`;
    }

    // Return as-is if can't format
    return phone;
}

/**
 * Get gender icon emoji
 */
export function getGenderIcon(gender: string): string {
    const normalized = gender?.toLowerCase();

    switch (normalized) {
        case 'male':
        case 'm':
            return '👨';
        case 'female':
        case 'f':
            return '👩';
        default:
            return '👤';
    }
}

/**
 * Format gender display text
 */
export function formatGender(gender: string): string {
    const normalized = gender?.toLowerCase();

    switch (normalized) {
        case 'male':
        case 'm':
            return 'Male';
        case 'female':
        case 'f':
            return 'Female';
        default:
            return gender || 'Not specified';
    }
}

/**
 * Calculate overall percentage from academic records
 */
export function calculateOverallPercentage(records: AcademicRecord[]): number {
    if (!records || records.length === 0) return 0;

    const totalPercentage = records.reduce((sum, record) => sum + record.percentage, 0);
    return Math.round((totalPercentage / records.length) * 100) / 100;
}

/**
 * Determine overall grade from percentage
 */
export function getOverallGrade(percentage: number): Grade {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    if (percentage >= 40) return 'D';
    return 'F';
}

/**
 * Get attendance status based on percentage
 */
export function getAttendanceStatus(percentage: number): AttendanceStatus {
    if (percentage >= 90) return 'excellent';
    if (percentage >= 75) return 'good';
    if (percentage >= 60) return 'fair';
    return 'poor';
}

/**
 * Get color class for attendance status
 */
export function getAttendanceStatusColor(status: AttendanceStatus): string {
    switch (status) {
        case 'excellent':
            return 'text-green-600 bg-green-50';
        case 'good':
            return 'text-blue-600 bg-blue-50';
        case 'fair':
            return 'text-yellow-600 bg-yellow-50';
        case 'poor':
            return 'text-red-600 bg-red-50';
        default:
            return 'text-gray-600 bg-gray-50';
    }
}

/**
 * Format date for display
 */
export function formatDate(date: string | null | undefined, format: 'short' | 'long' = 'short'): string {
    if (!date) return 'Not set';

    const dateObj = new Date(date);

    if (format === 'long') {
        return dateObj.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Calculate months between two dates
 */
export function getMonthsBetween(startDate: string, endDate?: string): number {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();

    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    return Math.max(0, months);
}

/**
 * Get month name from month number
 */
export function getMonthName(month: number, short: boolean = false): string {
    const date = new Date(2000, month - 1, 1);
    return date.toLocaleDateString('en-US', { month: short ? 'short' : 'long' });
}

/**
 * Calculate attendance percentage
 */
export function calculateAttendancePercentage(present: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((present / total) * 100 * 100) / 100;
}

/**
 * Group academic records by subject
 */
export function groupBySubject(records: AcademicRecord[]): Record<string, AcademicRecord[]> {
    return records.reduce((acc, record) => {
        const subject = record.subject;
        if (!acc[subject]) {
            acc[subject] = [];
        }
        acc[subject].push(record);
        return acc;
    }, {} as Record<string, AcademicRecord[]>);
}

/**
 * Get recent academic records (last N records)
 */
export function getRecentRecords(records: AcademicRecord[], count: number = 5): AcademicRecord[] {
    return [...records]
        .sort((a, b) => new Date(b.exam_date).getTime() - new Date(a.exam_date).getTime())
        .slice(0, count);
}

/**
 * Calculate subject average
 */
export function calculateSubjectAverage(records: AcademicRecord[]): number {
    if (!records || records.length === 0) return 0;

    const totalPercentage = records.reduce((sum, record) => sum + record.percentage, 0);
    return Math.round((totalPercentage / records.length) * 100) / 100;
}

/**
 * Format address for display
 */
export function formatAddress(address: string | null | undefined): string {
    if (!address) return 'Not provided';

    // Capitalize first letter of each word
    return address
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

/**
 * Validate email format
 */
export function isValidEmail(email: string | null | undefined): boolean {
    if (!email) return false;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate phone number format
 */
export function isValidPhone(phone: string | null | undefined): boolean {
    if (!phone) return false;

    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10;
}

/**
 * Get initials from name
 */
export function getInitials(name: string): string {
    if (!name) return '??';

    const parts = name.trim().split(' ');
    if (parts.length === 1) {
        return parts[0].substring(0, 2).toUpperCase();
    }

    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Generate a color for profile based on name (for avatar backgrounds)
 */
export function getProfileColor(name: string): string {
    const colors = [
        '#2563EB', // Blue
        '#10B981', // Green
        '#F59E0B', // Amber
        '#EF4444', // Red
        '#8B5CF6', // Purple
        '#EC4899', // Pink
        '#06B6D4', // Cyan
        '#F97316', // Orange
    ];

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
}

/**
 * Format subjects array for display
 */
export function formatSubjects(subjects: string[] | null | undefined): string {
    if (!subjects || subjects.length === 0) return 'No subjects assigned';

    if (subjects.length <= 3) {
        return subjects.join(', ');
    }

    return `${subjects.slice(0, 3).join(', ')} +${subjects.length - 3} more`;
}

/**
 * Calculate days since date
 */
export function getDaysSince(date: string): number {
    const past = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - past.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Check if profile is recently created (within last 7 days)
 */
export function isNewProfile(createdAt: string): boolean {
    return getDaysSince(createdAt) <= 7;
}
