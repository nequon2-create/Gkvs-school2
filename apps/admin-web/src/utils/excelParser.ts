// Excel parsing utilities for bulk marks upload
import * as XLSX from 'xlsx';
import type { BulkMarksInput, MarksValidationError } from '../types/marks.types';

/**
 * Parse Excel file to extract marks data
 */
export async function parseMarksExcel(
    file: File,
    examId: string,
    classId: string
): Promise<{
    data: BulkMarksInput;
    errors: MarksValidationError[];
}> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });

                // Get first sheet
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];

                // Convert to JSON
                const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);

                if (jsonData.length === 0) {
                    resolve({
                        data: { exam_id: examId, class_id: classId, marks: [] },
                        errors: [{ field: 'file', message: 'Excel file is empty' }]
                    });
                    return;
                }

                // Extract headers (subject names)
                const headers = Object.keys(jsonData[0]);
                const subjectColumns = headers.filter(h =>
                    h !== 'Registration Number' &&
                    h !== 'Student Name' &&
                    h !== 'Reg No' &&
                    h !== 'Name'
                );

                // First row should contain max marks (handle different formats)
                const maxMarksRow = jsonData[0];
                const hasMaxMarksRow =
                    maxMarksRow['Registration Number']?.toString().toUpperCase() === 'MAX' ||
                    maxMarksRow['Reg No']?.toString().toUpperCase() === 'MAX';

                const maxMarksData: Record<string, number> = {};
                let studentStartIndex = 0;

                if (hasMaxMarksRow) {
                    // Extract max marks from first row
                    subjectColumns.forEach(subject => {
                        const maxValue = maxMarksRow[subject];
                        maxMarksData[subject] = typeof maxValue === 'number' ? maxValue : 100;
                    });
                    studentStartIndex = 1;
                } else {
                    // Default max marks
                    subjectColumns.forEach(subject => {
                        maxMarksData[subject] = 100;
                    });
                }

                const errors: MarksValidationError[] = [];
                const marks: BulkMarksInput['marks'] = [];

                // Process student rows
                for (let i = studentStartIndex; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    const rowNumber = i + 1;

                    const regNo = row['Registration Number'] || row['Reg No'];

                    if (!regNo || regNo.toString().trim() === '') {
                        errors.push({
                            row: rowNumber,
                            field: 'Registration Number',
                            message: 'Registration number is required',
                            value: regNo
                        });
                        continue;
                    }

                    // Process each subject for this student
                    subjectColumns.forEach(subject => {
                        const marksValue = row[subject];

                        // Skip if empty
                        if (marksValue === undefined || marksValue === null || marksValue === '') {
                            return;
                        }

                        const marksObtained = typeof marksValue === 'number'
                            ? marksValue
                            : parseFloat(marksValue.toString());

                        // Validate marks
                        if (isNaN(marksObtained)) {
                            errors.push({
                                row: rowNumber,
                                field: subject,
                                message: 'Marks must be a number',
                                value: marksValue
                            });
                            return;
                        }

                        if (marksObtained < 0) {
                            errors.push({
                                row: rowNumber,
                                field: subject,
                                message: 'Marks cannot be negative',
                                value: marksObtained
                            });
                            return;
                        }

                        const maxMarks = maxMarksData[subject];
                        if (marksObtained > maxMarks) {
                            errors.push({
                                row: rowNumber,
                                field: subject,
                                message: `Marks (${marksObtained}) exceed maximum (${maxMarks})`,
                                value: marksObtained
                            });
                            return;
                        }

                        marks.push({
                            registration_number: regNo.toString().trim(),
                            subject,
                            marks_obtained: marksObtained,
                            max_marks: maxMarks
                        });
                    });
                }

                resolve({
                    data: {
                        exam_id: examId,
                        class_id: classId,
                        marks
                    },
                    errors
                });
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };

        reader.readAsBinaryString(file);
    });
}

/**
 * Generate Excel template for marks entry
 */
export function generateMarksTemplate(config: {
    examName: string;
    className: string;
    subjects: string[];
    students: { registration_number: string; full_name: string; roll_number: string }[];
    maxMarks?: number;
}): void {
    const { examName, className, subjects, students, maxMarks = 100 } = config;

    // Create headers
    const headers = ['Registration Number', 'Student Name', ...subjects];

    // Create max marks row
    const maxMarksRow = ['MAX', '', ...subjects.map(() => maxMarks)];

    // Create student rows
    const studentRows = students.map(student => [
        student.registration_number,
        student.full_name,
        ...subjects.map(() => '') // Empty cells for marks entry
    ]);

    // Combine all rows
    const data = [headers, maxMarksRow, ...studentRows];

    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(data);

    // Set column widths
    worksheet['!cols'] = [
        { wch: 18 }, // Registration Number
        { wch: 25 }, // Student Name
        ...subjects.map(() => ({ wch: 12 })) // Subject columns
    ];

    // Style headers (bold)
    const headerRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (!worksheet[cellAddress]) continue;
        worksheet[cellAddress].s = { font: { bold: true } };
    }

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Marks');

    // Add metadata sheet
    const metadataSheet = XLSX.utils.aoa_to_sheet([
        ['Exam', examName],
        ['Class', className],
        ['Total Students', students.length],
        ['Subjects', subjects.join(', ')],
        ['', ''],
        ['Instructions:', ''],
        ['1. First row contains maximum marks for each subject'],
        ['2. Enter marks in respective subject columns'],
        ['3. Leave cell empty if student was absent'],
        ['4. Do NOT modify Registration Number or Student Name columns'],
        ['5. Save file and upload to system']
    ]);
    XLSX.utils.book_append_sheet(workbook, metadataSheet, 'Instructions');

    // Generate filename
    const filename = `Marks_${className.replace(/\s+/g, '_')}_${examName.replace(/\s+/g, '_')}.xlsx`;

    // Download file
    XLSX.writeFile(workbook, filename);
}

/**
 * Validate Excel file before parsing
 */
export function validateExcelFile(file: File): string | null {
    // Check file type
    const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'application/xlsx',
        'application/xls'
    ];

    if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        return 'Invalid file type. Please upload an Excel file (.xlsx or .xls)';
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
        return 'File size exceeds 5MB limit';
    }

    return null;
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(errors: MarksValidationError[]): string {
    if (errors.length === 0) return '';

    if (errors.length === 1) {
        const error = errors[0];
        return error.row
            ? `Row ${error.row}: ${error.message}`
            : error.message;
    }

    return `Found ${errors.length} errors:\n` +
        errors.slice(0, 5).map(e =>
            e.row ? `• Row ${e.row} - ${e.field}: ${e.message}` : `• ${e.message}`
        ).join('\n') +
        (errors.length > 5 ? `\n... and ${errors.length - 5} more` : '');
}
