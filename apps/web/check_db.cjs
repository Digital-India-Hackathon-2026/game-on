const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hyfjpwkuvzcfuyvsyfke.supabase.co';
const supabaseAnonKey = 'sb_publishable_QHKCwV-rvZ5REOufgRA5AA_YVm5mBJ3';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .limit(1);
    if (error) {
      console.log(`user_settings error:`, error.message);
    } else {
      console.log(`user_settings SUCCESS:`, data);
    }
  } catch (err) {
    console.log(`user_settings catch error:`, err.message);
  }
}

check();
