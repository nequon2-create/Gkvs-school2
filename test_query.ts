import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: 'e:/Gkvs school/apps/admin-web/.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    // 1. Fetch classes to get a class_id
    const { data: classes } = await supabase.from('classes').select('*').limit(1);
    console.log('Class:', classes);

    if (classes && classes.length > 0) {
        const classId = classes[0].id;
        console.log('Querying students for class_id:', classId);

        const { data: students, error } = await supabase
            .from('students')
            .select('*')
            .eq('class_id', classId)
            .eq('is_active', true);

        console.log('Students in class:', students?.length, error);

        // Also just fetch any student to see if anon can select
        const { data: anyStudent } = await supabase.from('students').select('*').limit(1);
        console.log('Any student:', anyStudent);
    }
}

test();
