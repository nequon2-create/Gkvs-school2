import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type {
    Exam,
    CreateExamInput,
    UpdateExamInput,
    ExamFilters,
    ExamStats,
    ExamListItem,
} from '../types/exam.types';
import { differenceInDays, isPast, isFuture } from 'date-fns';

interface UseExamsReturn {
    exams: ExamListItem[];
    loading: boolean;
    error: string | null;
    fetchExams: (filters?: ExamFilters) => Promise<void>;
    createExam: (input: CreateExamInput, publish?: boolean) => Promise<boolean>;
    updateExam: (input: UpdateExamInput) => Promise<boolean>;
    deleteExam: (id: string) => Promise<boolean>;
    publishExam: (id: string) => Promise<boolean>;
    unpublishExam: (id: string) => Promise<boolean>;
    getExamStats: () => Promise<ExamStats | null>;
}

export function useExams(): UseExamsReturn {
    const [exams, setExams] = useState<ExamListItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch exams with optional filters
    const fetchExams = useCallback(async (filters?: ExamFilters) => {
        try {
            setLoading(true);
            setError(null);

            console.log('📚 Fetching exams...', filters);

            let query = supabase
                .from('exams')
                .select(`
                    *,
                    classes (
                        id,
                        class_name,
                        section
                    ),
                    academic_years (
                        id,
                        year_name,
                        is_current
                    )
                `)
                .order('exam_date', { ascending: false })
                .order('created_at', { ascending: false });

            // Apply filters
            if (filters?.classId) {
                query = query.eq('class_id', filters.classId);
            }
            if (filters?.academicYearId) {
                query = query.eq('academic_year_id', filters.academicYearId);
            }
            if (filters?.examType) {
                query = query.eq('exam_type', filters.examType);
            }
            if (filters?.isPublished !== undefined) {
                query = query.eq('is_published', filters.isPublished);
            }
            if (filters?.startDate) {
                query = query.gte('exam_date', filters.startDate);
            }
            if (filters?.endDate) {
                query = query.lte('exam_date', filters.endDate);
            }

            const { data, error: fetchError } = await query;

            if (fetchError) throw fetchError;

            // Enhance each exam with upcoming/past info
            const enhancedExams: ExamListItem[] = (data || []).map((exam: Exam) => {
                const dateStr = exam.exam_date ?? '';
                const examDate = dateStr ? new Date(dateStr) : null;
                const today = new Date();
                const isUpcoming = examDate ? isFuture(examDate) : false;
                const isPastExam = examDate ? isPast(examDate) : false;
                const daysUntilExam = (isUpcoming && examDate) ? differenceInDays(examDate, today) : undefined;

                return {
                    ...exam,
                    isUpcoming,
                    isPast: isPastExam,
                    daysUntilExam,
                };
            });

            console.log(`✅ Fetched ${enhancedExams.length} exams`);
            setExams(enhancedExams);
        } catch (err: any) {
            console.error('❌ Error fetching exams:', err);
            setError(err.message || 'Failed to fetch exams');
        } finally {
            setLoading(false);
        }
    }, []);

    // Create new exam
    const createExam = useCallback(async (
        input: CreateExamInput,
        publish: boolean = false
    ): Promise<boolean> => {
        try {
            console.log('➕ Creating exam:', input);

            const examData = {
                exam_name: input.exam_name,
                exam_type: input.exam_type,
                class_id: input.class_id,
                academic_year_id: input.academic_year_id,
                exam_date: input.exam_date,
                end_date: input.end_date,
                is_published: publish,
            };

            const { error: createError } = await supabase
                .from('exams')
                .insert([examData]);

            if (createError) throw createError;

            console.log('✅ Exam created successfully');
            return true;
        } catch (err: any) {
            console.error('❌ Error creating exam:', err);
            setError(err.message || 'Failed to create exam');
            return false;
        }
    }, []);

    // Update existing exam
    const updateExam = useCallback(async (input: UpdateExamInput): Promise<boolean> => {
        try {
            console.log('🔄 Updating exam:', input);

            const { id, ...updateData } = input;

            const { error: updateError } = await supabase
                .from('exams')
                .update(updateData)
                .eq('id', id);

            if (updateError) throw updateError;

            console.log('✅ Exam updated successfully');
            return true;
        } catch (err: any) {
            console.error('❌ Error updating exam:', err);
            setError(err.message || 'Failed to update exam');
            return false;
        }
    }, []);

    // Delete exam
    const deleteExam = useCallback(async (id: string): Promise<boolean> => {
        try {
            console.log('🗑️ Deleting exam:', id);

            const { error: deleteError } = await supabase
                .from('exams')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;

            console.log('✅ Exam deleted successfully');
            return true;
        } catch (err: any) {
            console.error('❌ Error deleting exam:', err);
            setError(err.message || 'Failed to delete exam');
            return false;
        }
    }, []);

    // Publish exam
    const publishExam = useCallback(async (id: string): Promise<boolean> => {
        try {
            console.log('📢 Publishing exam:', id);

            const { error: publishError } = await supabase
                .from('exams')
                .update({ is_published: true })
                .eq('id', id);

            if (publishError) throw publishError;

            console.log('✅ Exam published successfully');
            // Future: Trigger notifications here
            return true;
        } catch (err: any) {
            console.error('❌ Error publishing exam:', err);
            setError(err.message || 'Failed to publish exam');
            return false;
        }
    }, []);

    // Unpublish exam (revert to draft)
    const unpublishExam = useCallback(async (id: string): Promise<boolean> => {
        try {
            console.log('📝 Unpublishing exam:', id);

            const { error: unpublishError } = await supabase
                .from('exams')
                .update({ is_published: false })
                .eq('id', id);

            if (unpublishError) throw unpublishError;

            console.log('✅ Exam unpublished successfully');
            return true;
        } catch (err: any) {
            console.error('❌ Error unpublishing exam:', err);
            setError(err.message || 'Failed to unpublish exam');
            return false;
        }
    }, []);

    // Get exam statistics
    const getExamStats = useCallback(async (): Promise<ExamStats | null> => {
        try {
            console.log('📊 Calculating exam stats...');

            const { data, error: fetchError } = await supabase
                .from('exams')
                .select('is_published, exam_date');

            if (fetchError) throw fetchError;

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const totalExams = data?.length || 0;
            const publishedExams = data?.filter(e => e.is_published).length || 0;
            const draftExams = totalExams - publishedExams;

            const upcomingExams = data?.filter(e => {
                const examDate = new Date(e.exam_date);
                return examDate >= today;
            }).length || 0;

            const pastExams = totalExams - upcomingExams;

            return {
                totalExams,
                publishedExams,
                draftExams,
                upcomingExams,
                pastExams,
            };
        } catch (err: any) {
            console.error('❌ Error calculating stats:', err);
            return null;
        }
    }, []);

    return {
        exams,
        loading,
        error,
        fetchExams,
        createExam,
        updateExam,
        deleteExam,
        publishExam,
        unpublishExam,
        getExamStats,
    };
}
