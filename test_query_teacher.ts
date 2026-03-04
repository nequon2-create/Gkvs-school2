import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: 'e:/Gkvs school/apps/admin-web/.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    const { data: anyTeacher } = await supabase.from('teachers').select('*').limit(1);
    console.log('Any teacher:', anyTeacher);
}

test();
