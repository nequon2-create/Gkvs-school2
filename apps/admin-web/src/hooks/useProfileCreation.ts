import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { AcademicYear } from '../types/academic-years.types';
import type { StudentFormData, TeacherFormData, CreateProfileResult } from '../types/profile.types';
import { cleanPhone } from '../utils/validation';

interface Class {
    id: string;
    class_name: string;
    academic_year_id: string;
    section?: string | null;
}

interface UseProfileCreationReturn {
    academicYears: AcademicYear[];
    classes: Class[];
    loadingYears: boolean;
    loadingClasses: boolean;
    createStudent: (data: StudentFormData) => Promise<CreateProfileResult>;
    createTeacher: (data: TeacherFormData) => Promise<CreateProfileResult>;
    refetchYears: () => Promise<void>;
    refetchClasses: () => Promise<void>;
}

export function useProfileCreation(): UseProfileCreationReturn {
    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
    const [classes, setClasses] = useState<Class[]>([]);
    const [loadingYears, setLoadingYears] = useState(true);
    const [loadingClasses, setLoadingClasses] = useState(true);

    const fetchAcademicYears = useCallback(async () => {
        try {
            setLoadingYears(true);
            const { data, error } = await supabase
                .from('academic_years')
                .select('*')
                .order('start_date', { ascending: false });

            if (error) throw error;
            setAcademicYears(data || []);
        } catch (err) {
            console.error('Error fetching academic years:', err);
            setAcademicYears([]);
        } finally {
            setLoadingYears(false);
        }
    }, []);

    const fetchClasses = useCallback(async () => {
        try {
            setLoadingClasses(true);
            console.log('🔄 Fetching classes from database...');

            const { data, error } = await supabase
                .from('classes')
                .select('*')
                .order('numeric_value', { ascending: true });

            if (error) {
                console.error('❌ Error fetching classes:', error);
                throw error;
            }

            console.log('✅ Classes fetched successfully:', data);
            console.log('📊 Total classes:', data?.length || 0);

            setClasses(data || []);
        } catch (err) {
            console.error('Error fetching classes:', err);
            setClasses([]);
        } finally {
            setLoadingClasses(false);
        }
    }, []);

    useEffect(() => {
        fetchAcademicYears();
        fetchClasses();
    }, [fetchAcademicYears, fetchClasses]);

    const createStudent = async (data: StudentFormData): Promise<CreateProfileResult> => {
        try {
            console.log('🔄 Creating student with data:', data);

            // Use login_id as the registration number
            const registrationNumber = data.login_id;
            console.log('🔢 Using login_id as student registration number:', registrationNumber);

            const studentData = {
                registration_number: registrationNumber,
                full_name: data.full_name,
                gender: data.gender,
                date_of_birth: data.date_of_birth,
                parent_name: data.parent_name,
                parent_phone: cleanPhone(data.parent_phone),
                parent_email: data.parent_email || null,
                academic_year_id: data.academic_year_id,
                class_id: data.class_id,
                photo_url: data.photo_url || null,
                address: data.address || null,
                login_id: data.login_id,
                password: data.password,
                aadhar_number: data.aadhar_number,
                is_first_admission: data.is_first_admission,
                past_school_name: data.past_school_name || null,
                past_class: data.past_class || null,
            };

            const { data: result, error } = await supabase
                .from('students')
                .insert([studentData])
                .select()
                .single();

            if (error) {
                console.error('❌ Supabase error:', error);
                throw error;
            }

            console.log('✅ Student created successfully:', result);
            return {
                success: true,
                id: result.id,
            };
        } catch (err: any) {
            console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.error('❌ ERROR CREATING STUDENT:');
            console.error('Code:', err?.code);
            console.error('Message:', err?.message);
            console.error('Details:', err?.details);
            console.error('Hint:', err?.hint);
            console.error('Full Error:', err);
            console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

            return {
                success: false,
                error: err?.message || 'Failed to create student',
            };
        }
    };

    const createTeacher = async (data: TeacherFormData): Promise<CreateProfileResult> => {
        try {
            console.log('🔄 Creating teacher with data:', data);

            // Use login_id as the registration number for teachers too
            const registrationNumber = data.login_id;
            console.log('🔢 Using login_id as teacher registration number:', registrationNumber);

            // Map form data to database schema
            const { subject, ...restData } = data;
            const teacherData = {
                registration_number: registrationNumber,
                full_name: restData.full_name,
                gender: restData.gender,
                date_of_birth: restData.date_of_birth,
                qualification: restData.qualification,
                phone: cleanPhone(restData.phone),
                email: restData.email,
                photo_url: restData.photo_url || null,
                address: restData.address || null,
                subjects: subject ? [subject] : [], // Convert subject string to array
                login_id: restData.login_id,
                password: restData.password,
            };

            const { data: result, error } = await supabase
                .from('teachers')
                .insert([teacherData])
                .select()
                .single();

            if (error) {
                console.error('❌ Supabase error:', error);
                throw error;
            }

            console.log('✅ Teacher created successfully:', result);
            return {
                success: true,
                id: result.id,
            };
        } catch (err: any) {
            console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.error('❌ ERROR CREATING TEACHER:');
            console.error('Code:', err?.code);
            console.error('Message:', err?.message);
            console.error('Details:', err?.details);
            console.error('Hint:', err?.hint);
            console.error('Full Error:', err);
            console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

            return {
                success: false,
                error: err?.message || 'Failed to create teacher',
            };
        }
    };

    return {
        academicYears,
        classes,
        loadingYears,
        loadingClasses,
        createStudent,
        createTeacher,
        refetchYears: fetchAcademicYears,
        refetchClasses: fetchClasses,
    };
}
