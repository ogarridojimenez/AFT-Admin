const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://iumsxhhafjdldtrpggia.supabase.co';
const anonKey = 'sb_publishable_vDW78pe6aqBSY7u5-Ps3GQ_ZPHOhqxZ';

const supabase = createClient(supabaseUrl, anonKey);

async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('areas')
      .select('*')
      .limit(5);
    
    if (error) {
      console.log('Error:', error.message);
    } else {
      console.log('Conexión exitosa!');
      console.log('Areas encontradas:', data.length);
      console.log(data);
    }
  } catch (e) {
    console.log('Error:', e.message);
  }
}

testConnection();