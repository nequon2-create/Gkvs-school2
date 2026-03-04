import { supabase } from './src/lib/supabase';

async function run() {
    const { data, error } = await supabase.from('classes').select('*');
    if (error) {
        console.error(error);
    } else {
        console.log(JSON.stringify(data, null, 2));
    }
}
run();
