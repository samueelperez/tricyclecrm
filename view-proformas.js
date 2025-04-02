const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function main() {
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    console.log('Consultando todas las proformas:');
    const { data, error } = await supabase.from('proformas').select('*');
    if (error) {
      console.error('Error:', error);
      return;
    }
    console.log();
    if (data.length === 0) {
      console.log('No hay proformas en la base de datos');
    } else {
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error('Error general:', err);
  }
}

main();