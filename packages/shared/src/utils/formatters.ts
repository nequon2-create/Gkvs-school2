/**
 * Format currency in Indian Rupees
 */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount);
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
    return `${value.toFixed(decimals)}%`;
}

/**
 * Format phone number with spacing
 */
export function formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
        return `${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    }
    return phone;
}

/**
 * Capitalize first letter of each word
 */
export function capitalizeWords(text: string): string {
    return text
        .toLowerCase()
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength)}...`;
}

/**
 * Generate initials from name
 */
export function getInitials(name: string): string {
    return name
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase())
        .join('')
        .slice(0, 2);
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Generate registration number
 */
export function generateRegistrationNumber(prefix: string, year: number, sequence: number): string {
    return `${prefix}${year}${sequence.toString().padStart(4, '0')}`;
}

/**
 * Format grade based on percentage
 */
export function calculateGrade(percentage: number): string {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    if (percentage >= 40) return 'D';
    return 'F';
}

/**
 * Get grade color
 */
export function getGradeColor(grade: string): string {
    switch (grade) {
        case 'A+':
        case 'A':
            return 'green';
        case 'B+':
        case 'B':
            return 'blue';
        case 'C':
            return 'orange';
        case 'D':
            return 'yellow';
        case 'F':
            return 'red';
        default:
            return 'gray';
    }
}
