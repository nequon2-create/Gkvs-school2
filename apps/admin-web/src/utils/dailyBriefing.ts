import { supabase } from '../lib/supabase';

export interface DailyBriefingData {
    dateStr: string;
    studentAttendancePct: number;
    presentStudents: number;
    totalStudents: number;
    teacherAttendancePct: number;
    presentTeachers: number;
    totalTeachers: number;
    homeworkUploadedClasses: number;
    totalClasses: number;
    pendingHomeworkClasses: string[];
    todayFeesCollected: number;
    formattedWhatsAppText: string;
}

export async function fetchDailyBriefingData(): Promise<DailyBriefingData> {
    const today = new Date().toISOString().split('T')[0];
    const dateFormatted = new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });

    try {
        // 1. Fetch Students & Today's Attendance
        const { data: studentsData } = await supabase
            .from('students')
            .select('id');
        const totalStudents = studentsData?.length || 0;

        const { data: studentAttData } = await supabase
            .from('student_attendance')
            .select('student_id, is_present')
            .eq('date', today);

        const presentStudents = studentAttData?.filter((a) => a.is_present === true).length || 0;
        const studentAttendancePct = totalStudents > 0 ? Math.round((presentStudents / totalStudents) * 100) : 0;

        // 2. Fetch Teachers & Today's Attendance
        const { data: teachersData } = await supabase
            .from('teachers')
            .select('id');
        const totalTeachers = teachersData?.length || 0;

        const { data: teacherAttData } = await supabase
            .from('teacher_attendance')
            .select('teacher_id, is_present')
            .eq('date', today);

        const presentTeachers = teacherAttData?.filter((a) => a.is_present === true).length || totalTeachers;
        const teacherAttendancePct = totalTeachers > 0 ? Math.round((presentTeachers / totalTeachers) * 100) : 100;

        // 3. Fetch Today's Classes & Homework
        const { data: classesData } = await supabase
            .from('classes')
            .select('id, class_name, section');
        const totalClasses = classesData?.length || 0;

        const { data: hwData } = await supabase
            .from('homework')
            .select('class_id')
            .gte('created_at', `${today}T00:00:00.000Z`);

        const hwClassIds = new Set(hwData?.map((h) => h.class_id));
        const homeworkUploadedClasses = hwClassIds.size;

        const pendingClassesList: string[] = [];
        classesData?.forEach((c) => {
            if (!hwClassIds.has(c.id)) {
                pendingClassesList.push(`Class ${c.class_name} ${c.section || ''}`.trim());
            }
        });

        // 4. Fetch Today's Fee Collections
        const { data: receiptsData } = await supabase
            .from('receipts')
            .select('amount_paid')
            .gte('created_at', `${today}T00:00:00.000Z`);

        const todayFeesCollected = receiptsData?.reduce((sum, r) => sum + (r.amount_paid || 0), 0) || 0;

        // 5. Build WhatsApp Formatted Text
        const pendingStr = pendingClassesList.length > 0
            ? `⚠️ *Pending Homework:* ${pendingClassesList.slice(0, 3).join(', ')}${pendingClassesList.length > 3 ? ` +${pendingClassesList.length - 3} more` : ''}`
            : '✅ *All classes uploaded homework!*';

        const formattedWhatsAppText =
`🏫 *GKVS SCHOOL DAILY BRIEFING (${dateFormatted})*

📊 *Today's School Summary:*
• 🟢 Student Attendance: ${studentAttendancePct}% (${presentStudents}/${totalStudents} Present)
• 👨‍🏫 Teacher Attendance: ${presentTeachers}/${totalTeachers} Present
• 📚 Homework Posted: ${homeworkUploadedClasses}/${totalClasses} Classes
• 💰 Today's Fees Collected: ₹${todayFeesCollected.toLocaleString('en-IN')}

${pendingStr}

Have a great evening!`;

        return {
            dateStr: dateFormatted,
            studentAttendancePct,
            presentStudents,
            totalStudents,
            teacherAttendancePct,
            presentTeachers,
            totalTeachers,
            homeworkUploadedClasses,
            totalClasses,
            pendingHomeworkClasses: pendingClassesList,
            todayFeesCollected,
            formattedWhatsAppText,
        };
    } catch (err) {
        console.error('Error fetching daily briefing:', err);
        return {
            dateStr: dateFormatted,
            studentAttendancePct: 0,
            presentStudents: 0,
            totalStudents: 0,
            teacherAttendancePct: 0,
            presentTeachers: 0,
            totalTeachers: 0,
            homeworkUploadedClasses: 0,
            totalClasses: 0,
            pendingHomeworkClasses: [],
            todayFeesCollected: 0,
            formattedWhatsAppText: `🏫 *GKVS SCHOOL DAILY BRIEFING (${dateFormatted})*\n\nStats calculation in progress...`,
        };
    }
}
