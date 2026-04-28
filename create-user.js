const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://iumsxhhafjdldtrpggia.supabase.co';
const anonKey = 'sb_publishable_vDW78pe6aqBSY7u5-Ps3GQ_ZPHOhqxZ';

const supabase = createClient(supabaseUrl, anonKey);

async function createAdminUser() {
  try {
    // Sign up the user
    const { data, error } = await supabase.auth.signUp({
      email: 'admin@ejemplo.com',
      password: 'Admin123!'
    });

    if (error) {
      console.log('Error:', error.message);
      return;
    }

    if (data.user) {
      console.log('Usuario creado:', data.user.id);
      
      // Create profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: data.user.id,
          full_name: 'Administrador',
          role: 'admin',
          is_active: true
        });

      if (profileError) {
        console.log('Nota - Perfil:', profileError.message);
      } else {
        console.log('Perfil creado!');
      }
    } else {
      console.log('Usuario ya existe');
    }

  } catch (e) {
    console.log('Error:', e.message);
  }
}

createAdminUser();