const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://qrvkwwxeevtcciuhipbg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFydmt3d3hlZXZ0Y2NpdWhpcGJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExMTExMDksImV4cCI6MjA4NjY4NzEwOX0.J0_S8cCn0xGKDJcdOYhC_VCALKRhqDvn97DNopSns2Q';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkDB() {
    console.log('Querying students table...');
    const { data, error } = await supabase
        .from('students')
        .select('*')
        .limit(3);

    if (error) {
        console.error('Error querying students:', error);
    } else {
        console.log('Students data:', JSON.stringify(data, null, 2));
    }
}

checkDB();
