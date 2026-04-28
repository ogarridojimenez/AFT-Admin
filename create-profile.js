const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://iumsxhhafjdldtrpggia.supabase.co';
const anonKey = 'sb_publishable_vDW78pe6aqBSY7u5-Ps3GQ_ZPHOhqxZ';

const supabase = createClient(supabaseUrl, anonKey);

async function createProfile() {
  // First, let's sign in to get the user
  console.log('1. Verificando usuario...');
  
  // Try to get user by email - if user exists, we'll see the error
  const { data: { user }, error } = await supabase.auth.signInWithPassword({
    email: 'admin@ejemplo.com',
    password: 'Admin123!'
  });

  if (user) {
    console.log('Usuario ID:', user.id);
    
    // Now create profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: user.id,
        full_name: 'Administrador',
        role: 'admin',
        is_active: true
      });

    if (profileError) {
      console.log('Error perfil:', profileError.message);
    } else {
      console.log('Perfil creado OK!');
    }
  } else {
    console.log('Error login:', error?.message);
  }
}

createProfile();