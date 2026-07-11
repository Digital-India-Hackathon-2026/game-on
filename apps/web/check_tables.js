const supabaseUrl = 'https://hyfjpwkuvzcfuyvsyfke.supabase.co';
const supabaseAnonKey = 'sb_publishable_QHKCwV-rvZ5REOufgRA5AA_YVm5mBJ3';

async function getTables() {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });
    const data = await res.json();
    console.log('PostgREST Root Definition Tables/Definitions:');
    if (data && data.paths) {
      console.log(Object.keys(data.paths));
    } else {
      console.log(data);
    }
  } catch (err) {
    console.error(err);
  }
}

getTables();
