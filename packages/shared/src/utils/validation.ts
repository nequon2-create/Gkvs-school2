/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate phone number (Indian format)
 */
export function isValidPhone(phone: string): boolean {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/[\s-]/g, ''));
}

/**
 * Validate required field
 */
export function isRequired(value: any): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return true;
}

/**
 * Validate minimum length
 */
export function minLength(value: string, min: number): boolean {
    return value.trim().length >= min;
}

/**
 * Validate maximum length
 */
export function maxLength(value: string, max: number): boolean {
    return value.trim().length <= max;
}

/**
 * Validate number range
 */
export function inRange(value: number, min: number, max: number): boolean {
    return value >= min && value <= max;
}

/**
 * Validate marks (0-100)
 */
export function isValidMarks(marks: number, maxMarks?: number): boolean {
    const max = maxMarks || 100;
    return marks >= 0 && marks <= max;
}

/**
 * Validate rating (1-5)
 */
export function isValidRating(rating: number): boolean {
    return rating >= 1 && rating <= 5;
}

/**
 * Validate date format (YYYY-MM-DD)
 */
export function isValidDate(date: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) return false;

    const d = new Date(date);
    return !isNaN(d.getTime());
}

/**
 * Validate percentage (0-100)
 */
export function isValidPercentage(value: number): boolean {
    return value >= 0 && value <= 100;
}

/**
 * Generic field validator
 */
export function validateField(
    value: any,
    rules: {
        required?: boolean;
        email?: boolean;
        phone?: boolean;
        minLength?: number;
        maxLength?: number;
        min?: number;
        max?: number;
        pattern?: RegExp;
        custom?: (value: any) => boolean;
    }
): string | undefined {
    if (rules.required && !isRequired(value)) {
        return 'This field is required';
    }

    if (!value) return undefined;

    if (rules.email && !isValidEmail(value)) {
        return 'Invalid email format';
    }

    if (rules.phone && !isValidPhone(value)) {
        return 'Invalid phone number';
    }

    if (rules.minLength && !minLength(value, rules.minLength)) {
        return `Minimum length is ${rules.minLength}`;
    }

    if (rules.maxLength && !maxLength(value, rules.maxLength)) {
        return `Maximum length is ${rules.maxLength}`;
    }

    if (rules.min !== undefined && value < rules.min) {
        return `Minimum value is ${rules.min}`;
    }

    if (rules.max !== undefined && value > rules.max) {
        return `Maximum value is ${rules.max}`;
    }

    if (rules.pattern && !rules.pattern.test(value)) {
        return 'Invalid format';
    }

    if (rules.custom && !rules.custom(value)) {
        return 'Invalid value';
    }

    return undefined;
}
