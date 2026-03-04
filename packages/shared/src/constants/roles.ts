import type { UserRole } from '../types/common.types';

export const USER_ROLES: Record<UserRole, string> = {
    admin: 'Admin',
    teacher: 'Teacher',
    parent: 'Parent',
    student: 'Student',
};

export const ROLE_PERMISSIONS = {
    admin: ['all'],
    teacher: ['view_students', 'mark_attendance', 'enter_marks', 'assign_homework'],
    parent: ['view_own_children', 'view_attendance', 'view_marks', 'view_fees'],
    student: ['view_own_data', 'view_attendance', 'view_marks', 'rate_teacher'],
};

export function hasPermission(role: UserRole, permission: string): boolean {
    const permissions = ROLE_PERMISSIONS[role];
    return permissions.includes('all') || permissions.includes(permission as any);
}
