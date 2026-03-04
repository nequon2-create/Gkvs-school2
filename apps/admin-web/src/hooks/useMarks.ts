// Custom hook for marks management
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type {
    MarksRecord,
    MarksWithDetails,
    CreateMarksInput,
    UpdateMarksInput,
    MarksFilters,
    MarksStats,
    SubjectStats,
    BulkMarksInput
} from '../types/marks.types';
import { calculateMarksStats, calculateSubjectStats } from '../utils/gradeCalculator';

export function useMarks(filters?: MarksFilters) {
    const [marks, setMarks] = useState<MarksWithDetails[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (filters) {
            fetchMarks(filters);
        }
    }, [filters?.exam_id, filters?.class_id, filters?.subject_id, filters?.student_id]);

    const fetchMarks = async (customFilters?: MarksFilters) => {
        try {
            setLoading(true);
            setError(null);

            const activeFilters = customFilters || filters || {};

            let query = supabase
                .from('marks')
                .select(`
                    *,
                    student:students (
                        id,
                        full_name,
                        roll_number,
                        registration_number,
                        class_id
                    ),
                    exam:exams (
                        id,
                        exam_name,
                        exam_type,
                        class_id
                    ),
                    subjects (
                        id,
                        subject_name
                    )
                `);

            // Apply filters
            if (activeFilters.exam_id) {
                query = query.eq('exam_id', activeFilters.exam_id);
            }

            if (activeFilters.subject_id) {
                query = query.eq('subject_id', activeFilters.subject_id);
            }

            if (activeFilters.student_id) {
                query = query.eq('student_id', activeFilters.student_id);
            }

            if (activeFilters.grade) {
                query = query.eq('grade', activeFilters.grade);
            }

            const { data, error: fetchError } = await query.order('created_at', { ascending: false });

            if (fetchError) throw fetchError;

            let filteredData = data || [];

            // Class filter: filter client-side since it's via the student join
            if (activeFilters.class_id) {
                filteredData = filteredData.filter((mark: any) =>
                    mark.student?.class_id === activeFilters.class_id
                );
            }

            // Apply search filter (client-side)
            if (activeFilters.search) {
                const searchLower = activeFilters.search.toLowerCase();
                filteredData = filteredData.filter((mark: any) =>
                    mark.student?.full_name?.toLowerCase().includes(searchLower) ||
                    mark.student?.registration_number?.toLowerCase().includes(searchLower)
                );
            }

            setMarks(filteredData);
        } catch (err) {
            console.error('Error fetching marks:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch marks');
        } finally {
            setLoading(false);
        }
    };

    const createMarks = async (input: CreateMarksInput) => {
        try {
            setLoading(true);
            setError(null);

            // Note: marks table has no created_by column
            const { data, error: createError } = await supabase
                .from('marks')
                .insert([{
                    student_id: input.student_id,
                    exam_id: input.exam_id,
                    subject_id: input.subject_id,
                    marks_obtained: input.marks_obtained,
                    max_marks: input.max_marks,
                    remarks: input.remarks || null,
                }])
                .select()
                .single();

            if (createError) throw createError;

            // Refresh marks list
            if (filters) {
                await fetchMarks(filters);
            }

            return data;
        } catch (err) {
            console.error('Error creating marks:', err);
            setError(err instanceof Error ? err.message : 'Failed to create marks');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updateMarks = async (id: string, input: UpdateMarksInput) => {
        try {
            setLoading(true);
            setError(null);

            const { data, error: updateError } = await supabase
                .from('marks')
                .update(input)
                .eq('id', id)
                .select()
                .single();

            if (updateError) throw updateError;

            // Refresh marks list
            if (filters) {
                await fetchMarks(filters);
            }

            return data;
        } catch (err) {
            console.error('Error updating marks:', err);
            setError(err instanceof Error ? err.message : 'Failed to update marks');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const deleteMarks = async (id: string) => {
        try {
            setLoading(true);
            setError(null);

            const { error: deleteError } = await supabase
                .from('marks')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;

            // Refresh marks list
            if (filters) {
                await fetchMarks(filters);
            }
        } catch (err) {
            console.error('Error deleting marks:', err);
            setError(err instanceof Error ? err.message : 'Failed to delete marks');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const bulkCreateMarks = async (bulkInput: BulkMarksInput) => {
        try {
            setLoading(true);
            setError(null);

            // Get student IDs from registration numbers
            const regNumbers = [...new Set(bulkInput.marks.map(m => m.registration_number))];

            const { data: students, error: studentsError } = await supabase
                .from('students')
                .select('id, registration_number')
                .in('registration_number', regNumbers);

            if (studentsError) throw studentsError;

            // Create a map for quick lookup
            const studentMap = new Map(
                students?.map(s => [s.registration_number, s.id]) || []
            );

            // Validate all registration numbers exist
            const invalidRegNos = regNumbers.filter(rn => !studentMap.has(rn));
            if (invalidRegNos.length > 0) {
                throw new Error(`Invalid registration numbers: ${invalidRegNos.join(', ')}`);
            }

            // Look up subjects by name
            const subjectNames = [...new Set(bulkInput.marks.map(m => m.subject))];
            const { data: subjects, error: subjError } = await supabase
                .from('subjects')
                .select('id, subject_name')
                .in('subject_name', subjectNames);
            if (subjError) throw subjError;

            const subjectIdMap = new Map(
                subjects?.map(s => [s.subject_name.toLowerCase().trim(), s.id]) || []
            );

            // Check if any uploaded subjects are missing from DB
            const invalidSubjects = subjectNames.filter(sn => !subjectIdMap.has(sn.toLowerCase().trim()));
            if (invalidSubjects.length > 0) {
                throw new Error(`These subjects were not found in the database. Please create them first: ${invalidSubjects.join(', ')}`);
            }

            // Convert to marks records — no created_by field in marks table
            const marksRecords = bulkInput.marks.map(mark => ({
                student_id: studentMap.get(mark.registration_number)!,
                exam_id: bulkInput.exam_id,
                subject_id: subjectIdMap.get(mark.subject.toLowerCase().trim())!,
                marks_obtained: mark.marks_obtained,
                max_marks: mark.max_marks,
                remarks: mark.remarks || null,
            }));

            // Insert in bulk
            const { data, error: insertError } = await supabase
                .from('marks')
                .upsert(marksRecords, {
                    onConflict: 'student_id,exam_id,subject_id',
                    ignoreDuplicates: false
                })
                .select();

            if (insertError) throw insertError;

            // Refresh marks list
            if (filters) {
                await fetchMarks(filters);
            }

            return data;
        } catch (err) {
            console.error('Error bulk creating marks:', err);
            setError(err instanceof Error ? err.message : 'Failed to bulk create marks');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const getMarksStats = async (examId: string, classId?: string): Promise<MarksStats | null> => {
        try {
            let query = supabase
                .from('marks')
                .select(`
                    *,
                    student:students(id, full_name, class_id)
                `)
                .eq('exam_id', examId);

            const { data, error: fetchError } = await query;

            if (fetchError) throw fetchError;
            if (!data || data.length === 0) return null;

            // Filter by class client-side (class_id is on the student join)
            const filteredData = classId
                ? data.filter((m: any) => m.student?.class_id === classId)
                : data;

            if (filteredData.length === 0) return null;

            const stats = calculateMarksStats(filteredData);

            // Get topper name
            if (stats.topper && filteredData.length > 0) {
                const topperRecord = filteredData.find((m: any) => m.marks_obtained === stats.highest_marks);
                if (topperRecord && (topperRecord as any).student) {
                    stats.topper.student_name = (topperRecord as any).student.full_name;
                }
            }

            return stats;
        } catch (err) {
            console.error('Error getting marks stats:', err);
            return null;
        }
    };

    const getSubjectStats = async (examId: string, classId?: string): Promise<SubjectStats[]> => {
        try {
            let query = supabase
                .from('marks')
                .select('*, student:students(id, class_id)')
                .eq('exam_id', examId);

            const { data, error: fetchError } = await query;

            if (fetchError) throw fetchError;
            if (!data) return [];

            // Filter by class client-side
            const filteredData = classId
                ? data.filter((m: any) => m.student?.class_id === classId)
                : data;

            return calculateSubjectStats(filteredData);
        } catch (err) {
            console.error('Error getting subject stats:', err);
            return [];
        }
    };

    const getStudentMarks = async (studentId: string, examId: string): Promise<MarksRecord[]> => {
        try {
            const { data, error: fetchError } = await supabase
                .from('marks')
                .select('*')
                .eq('student_id', studentId)
                .eq('exam_id', examId)
                .order('created_at', { ascending: true });

            if (fetchError) throw fetchError;

            return data || [];
        } catch (err) {
            console.error('Error getting student marks:', err);
            return [];
        }
    };

    return {
        marks,
        loading,
        error,
        fetchMarks,
        createMarks,
        updateMarks,
        deleteMarks,
        bulkCreateMarks,
        getMarksStats,
        getSubjectStats,
        getStudentMarks
    };
}
