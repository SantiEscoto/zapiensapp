/**
 * Prueba: Auth y creación de perfil
 * Requiere: migraciones aplicadas y SUPABASE_URL + SUPABASE_ANON_KEY (o EXPO_PUBLIC_*) en .env o ../.env.local
 */
import 'dotenv/config';
import { config } from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

config({ path: path.resolve(__dirname, '../.env') });
config({ path: path.resolve(__dirname, '../../.env.local') });

const url = process.env.SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.error('Falta SUPABASE_URL/EXPO_PUBLIC_SUPABASE_URL o SUPABASE_ANON_KEY/EXPO_PUBLIC_SUPABASE_ANON_KEY en .env o ../.env.local');
  process.exit(1);
}

const supabase = createClient(url, anonKey);

const TEST_EMAIL = `test-${Date.now()}@example.com`;
const TEST_PASSWORD = 'TestPassword123!';

async function main() {
  console.log('1. Sign up...');
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    options: { emailConfirm: true },
  });

  if (signUpError) {
    console.error('SignUp error:', signUpError.message);
    process.exit(1);
  }
  const userId = authData.user?.id;
  if (!userId) {
    console.error('No user returned');
    process.exit(1);
  }
  console.log('   User id:', userId);

  console.log('2. Check profile exists...');
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, weekly_xp')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    console.error('Profile not found or error:', profileError?.message);
    process.exit(1);
  }
  console.log('   Profile:', profile);

  console.log('3. Sign out and sign in again...');
  await supabase.auth.signOut();
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });
  if (signInError) {
    console.error('SignIn error:', signInError.message);
    process.exit(1);
  }
  console.log('   Session ok');

  console.log('\n✅ test-auth passed');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
