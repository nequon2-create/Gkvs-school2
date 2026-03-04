// Bulk Upload Modal for Excel import
import React, { useState, useRef } from 'react';
import { parseMarksExcel, generateMarksTemplate, validateExcelFile, formatValidationErrors } from '../../../utils/excelParser';
import { useMarks } from '../../../hooks/useMarks';
import { supabase } from '../../../lib/supabase';
import './BulkUploadModal.css';

interface Props {
    examId: string;
    examName: string;
    classId: string;
    className: string;
    onClose: () => void;
    onSuccess: () => void;
}

export function BulkUploadModal({ examId, examName, classId, className, onClose, onSuccess }: Props) {
    const { bulkCreateMarks } = useMarks();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [step, setStep] = useState<'upload' | 'preview'>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [previewData, setPreviewData] = useState<any>(null);
    const [errors, setErrors] = useState<any[]>([]);

    const handleDownloadTemplate = async () => {
        try {
            // Fetch class students
            const { data: students } = await supabase
                .from('students')
                .select('registration_number, full_name, roll_number')
                .eq('class_id', classId)
                .order('roll_number');

            if (!students || students.length === 0) {
                alert('No students found in this class');
                return;
            }

            // Fetch subjects (hardcoded for now)
            const subjects = ['Mathematics', 'Science', 'English', 'Hindi', 'Social Studies'];

            generateMarksTemplate({
                examName,
                className,
                subjects,
                students,
                maxMarks: 100
            });
        } catch (error) {
            console.error('Error generating template:', error);
            alert('Failed to generate template');
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        const error = validateExcelFile(selectedFile);
        if (error) {
            alert(error);
            return;
        }

        setFile(selectedFile);
        setErrors([]);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files?.[0];
        if (!droppedFile) return;

        const error = validateExcelFile(droppedFile);
        if (error) {
            alert(error);
            return;
        }

        setFile(droppedFile);
        setErrors([]);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleParseFile = async () => {
        if (!file) return;

        try {
            setUploading(true);
            const result = await parseMarksExcel(file, examId, classId);

            if (result.errors.length > 0) {
                setErrors(result.errors);
                alert(`Found ${result.errors.length} error(s). Please fix them before uploading.`);
                setUploading(false);
                return;
            }

            setPreviewData(result.data);
            setStep('preview');
        } catch (error) {
            console.error('Parse error:', error);
            alert('Failed to parse Excel file');
        } finally {
            setUploading(false);
        }
    };

    const handleUpload = async () => {
        if (!previewData) return;

        try {
            setUploading(true);
            await bulkCreateMarks(previewData);

            alert(`Successfully uploaded ${previewData.marks.length} mark entries!`);
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload marks. Some entries may already exist.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content bulk-upload-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>📤 Bulk Upload Marks</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                {step === 'upload' ? (
                    <>
                        <div className="modal-body">
                            <div className="upload-instructions">
                                <h3>How to upload marks:</h3>
                                <ol>
                                    <li>Download the Excel template</li>
                                    <li>Fill in marks for each student and subject</li>
                                    <li>Upload the completed file</li>
                                </ol>
                            </div>

                            <button
                                className="btn-download-template"
                                onClick={handleDownloadTemplate}
                            >
                                📥 Download Template
                            </button>

                            <div
                                className="drop-zone"
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <div className="drop-zone-content">
                                    <span className="drop-icon">📁</span>
                                    {file ? (
                                        <div className="file-selected">
                                            <p className="file-name">{file.name}</p>
                                            <p className="file-size">{(file.size / 1024).toFixed(2)} KB</p>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="drop-text">Drag & drop Excel file here</p>
                                            <p className="drop-subtext">or click to browse</p>
                                        </>
                                    )}
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx,.xls"
                                    onChange={handleFileSelect}
                                    style={{ display: 'none' }}
                                />
                            </div>

                            {errors.length > 0 && (
                                <div className="error-box">
                                    <h4>⚠️ Validation Errors:</h4>
                                    <pre>{formatValidationErrors(errors)}</pre>
                                </div>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={onClose}>
                                Cancel
                            </button>
                            <button
                                className="btn-primary"
                                onClick={handleParseFile}
                                disabled={!file || uploading}
                            >
                                {uploading ? 'Parsing...' : 'Preview & Upload'}
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="modal-body">
                            <div className="preview-summary">
                                <h3>✅ Preview Data</h3>
                                <div className="preview-stats">
                                    <div className="stat">
                                        <span className="stat-label">Total Entries:</span>
                                        <span className="stat-value">{previewData?.marks?.length || 0}</span>
                                    </div>
                                    <div className="stat">
                                        <span className="stat-label">Subjects:</span>
                                        <span className="stat-value">
                                            {[...new Set(previewData?.marks?.map((m: any) => m.subject))].length}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="preview-table-wrapper">
                                <table className="preview-table">
                                    <thead>
                                        <tr>
                                            <th>Reg. No</th>
                                            <th>Subject</th>
                                            <th>Marks</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {previewData?.marks?.slice(0, 10).map((mark: any, idx: number) => (
                                            <tr key={idx}>
                                                <td>{mark.registration_number}</td>
                                                <td>{mark.subject}</td>
                                                <td>{mark.marks_obtained}/{mark.max_marks}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {previewData?.marks?.length > 10 && (
                                    <p className="preview-more">
                                        ... and {previewData.marks.length - 10} more entries
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setStep('upload')}>
                                Back
                            </button>
                            <button
                                className="btn-primary"
                                onClick={handleUpload}
                                disabled={uploading}
                            >
                                {uploading ? 'Uploading...' : 'Confirm Upload'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
