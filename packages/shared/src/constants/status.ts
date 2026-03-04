export const ATTENDANCE_STATUS = {
    PRESENT: 'present',
    ABSENT: 'absent',
    LATE: 'late',
    EXCUSED: 'excused',
} as const;

export const ATTENDANCE_STATUS_LABELS: Record<string, string> = {
    present: 'Present',
    absent: 'Absent',
    late: 'Late',
    excused: 'Excused',
};

export const EXAM_TYPES = {
    UNIT_TEST: 'unit_test',
    MID_TERM: 'mid_term',
    FINAL: 'final',
    PRACTICAL: 'practical',
} as const;

export const EXAM_TYPE_LABELS: Record<string, string> = {
    unit_test: 'Unit Test',
    mid_term: 'Mid Term',
    final: 'Final Exam',
    practical: 'Practical',
};

export const PAYMENT_METHODS = {
    CASH: 'cash',
    CARD: 'card',
    UPI: 'upi',
    BANK_TRANSFER: 'bank_transfer',
    CHEQUE: 'cheque',
} as const;

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
    cash: 'Cash',
    card: 'Card',
    upi: 'UPI',
    bank_transfer: 'Bank Transfer',
    cheque: 'Cheque',
};

export const GENDER_OPTIONS = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
];

export const RELATIONSHIP_OPTIONS = [
    { value: 'father', label: 'Father' },
    { value: 'mother', label: 'Mother' },
    { value: 'guardian', label: 'Guardian' },
];

export const EVENT_TYPES = {
    HOLIDAY: 'holiday',
    EXAM: 'exam',
    SPORTS: 'sports',
    CULTURAL: 'cultural',
    MEETING: 'meeting',
    OTHER: 'other',
} as const;

export const EVENT_TYPE_LABELS: Record<string, string> = {
    holiday: 'Holiday',
    exam: 'Exam',
    sports: 'Sports Day',
    cultural: 'Cultural Event',
    meeting: 'Meeting',
    other: 'Other',
};
