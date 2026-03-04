/**
 * Format a date string to a readable format
 */
export function formatDate(date: string | Date, format: 'short' | 'long' | 'full' = 'short'): string {
    const d = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(d.getTime())) {
        return 'Invalid Date';
    }

    switch (format) {
        case 'short':
            return d.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
            });
        case 'long':
            return d.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            });
        case 'full':
            return d.toLocaleDateString('en-IN', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            });
        default:
            return d.toLocaleDateString('en-IN');
    }
}

/**
 * Format a date string to ISO date (YYYY-MM-DD)
 */
export function formatISODate(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(d.getTime())) {
        return '';
    }

    return d.toISOString().split('T')[0];
}

/**
 * Get age from date of birth
 */
export function getAge(dob: string | Date): number {
    const birthDate = typeof dob === 'string' ? new Date(dob) : dob;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    return age;
}

/**
 * Check if a date is in the past
 */
export function isPastDate(date: string | Date): boolean {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d < new Date();
}

/**
 * Check if a date is in the future
 */
export function isFutureDate(date: string | Date): boolean {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d > new Date();
}

/**
 * Get relative time (e.g., "2 hours ago", "in 3 days")
 */
export function getRelativeTime(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    const diffSec = Math.abs(Math.floor(diffMs / 1000));
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    const isPast = diffMs < 0;
    const prefix = isPast ? '' : 'in ';
    const suffix = isPast ? ' ago' : '';

    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${prefix}${diffMin} minute${diffMin > 1 ? 's' : ''}${suffix}`;
    if (diffHr < 24) return `${prefix}${diffHr} hour${diffHr > 1 ? 's' : ''}${suffix}`;
    if (diffDay < 7) return `${prefix}${diffDay} day${diffDay > 1 ? 's' : ''}${suffix}`;

    return formatDate(d, 'short');
}
