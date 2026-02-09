/**
 * Prueba: RPC update_user_xp
 * Requiere: migraciones aplicadas; usa .env o ../.env.local (EXPO_PUBLIC_*).
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

async function main() {
  let userId: string;

  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    userId = user.id;
    console.log('Usando usuario existente:', user.email);
  } else {
    console.log('No hay sesión. Creando usuario de prueba...');
    const email = `xp-${Date.now()}@example.com`;
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password: 'TestPassword123!',
      options: {},
    });
    if (signUpError || !authData.user) {
      console.error('SignUp error:', signUpError?.message);
      process.exit(1);
    }
    userId = authData.user.id;
  }

  console.log('\n1. Leer weekly_xp actual...');
  const { data: before, error: beforeErr } = await supabase
    .from('profiles')
    .select('weekly_xp, daily_xp_history')
    .eq('id', userId)
    .single();
  if (beforeErr || before == null) {
    console.error('Select profile error:', beforeErr?.message);
    process.exit(1);
  }
  console.log('   weekly_xp:', before.weekly_xp, 'daily_xp_history:', before.daily_xp_history);

  console.log('2. Llamar update_user_xp(user_id, 10)...');
  const { error: rpcErr } = await supabase.rpc('update_user_xp', {
    user_id: userId,
    xp_amount: 10,
  });
  if (rpcErr) {
    console.error('RPC error:', rpcErr?.message);
    process.exit(1);
  }
  console.log('   OK');

  console.log('3. Verificar weekly_xp incrementado...');
  const { data: after, error: afterErr } = await supabase
    .from('profiles')
    .select('weekly_xp, daily_xp_history')
    .eq('id', userId)
    .single();
  if (afterErr || after == null) {
    console.error('Select after error:', afterErr?.message);
    process.exit(1);
  }
  const expectedWeekly = (before.weekly_xp ?? 0) + 10;
  if (after.weekly_xp !== expectedWeekly) {
    console.error('Expected weekly_xp', expectedWeekly, 'got', after.weekly_xp);
    process.exit(1);
  }
  console.log('   weekly_xp:', after.weekly_xp, '(expected', expectedWeekly, ')');

  console.log('\n✅ test-xp passed');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
