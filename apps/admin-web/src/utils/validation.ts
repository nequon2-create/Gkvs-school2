/**
 * Validation utilities for profile forms
 */

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
    if (!email) return true; // Optional field
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate phone number (Indian format: 10 digits)
 */
export function validatePhone(phone: string): boolean {
    if (!phone) return false;
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/\s|-/g, ''));
}

/**
 * Format phone number for display
 */
export function formatPhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
        return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
    }
    return phone;
}

/**
 * Validate required field
 */
export function validateRequired(value: string | undefined | null, fieldName: string): string | null {
    if (!value || value.trim() === '') {
        return `${fieldName} is required`;
    }
    return null;
}

/**
 * Validate age based on date of birth
 */
export function validateAge(dob: string, minAge: number, maxAge: number): string | null {
    if (!dob) return 'Date of birth is required';

    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    if (age < minAge) {
        return `Age must be at least ${minAge} years`;
    }

    if (age > maxAge) {
        return `Age must be less than ${maxAge} years`;
    }

    return null;
}

/**
 * Validate URL format
 */
export function validateUrl(url: string): boolean {
    if (!url) return true; // Optional field
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

/**
 * Clean phone number (remove spaces and hyphens)
 */
export function cleanPhone(phone: string): string {
    return phone.replace(/\s|-/g, '');
}
