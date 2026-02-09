/**
 * Prueba: Vista rankings_weekly
 * Requiere: migraciones hasta 00005 aplicadas; usuario con sesión (o crea uno y suma XP).
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
  console.error('Falta SUPABASE_URL o SUPABASE_ANON_KEY en .env o ../.env.local');
  process.exit(1);
}

const supabase = createClient(url, anonKey);

async function main() {
  let userId: string;
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    userId = user.id;
    console.log('Usando usuario:', user.email);
  } else {
    const email = `rank-${Date.now()}@example.com`;
    const { data: d, error: e } = await supabase.auth.signUp({
      email,
      password: 'TestPassword123!',
      options: { emailConfirm: true },
    });
    if (e || !d.user) {
      console.error('SignUp error:', e?.message);
      process.exit(1);
    }
    userId = d.user.id;
  }

  console.log('\n1. Sumar XP (10)...');
  const { error: rpcErr } = await supabase.rpc('update_user_xp', { user_id: userId, xp_amount: 10 });
  if (rpcErr) {
    console.error('RPC error:', rpcErr.message);
    process.exit(1);
  }
  console.log('   OK');

  console.log('2. Leer vista rankings_weekly...');
  const { data: rows, error: viewErr } = await supabase
    .from('rankings_weekly')
    .select('id, username, full_name, weekly_xp, followers_count');
  if (viewErr) {
    console.error('Vista error:', viewErr.message);
    process.exit(1);
  }
  console.log('   Filas:', rows?.length ?? 0);
  if (rows?.length) {
    console.log('   Top 3:', rows.slice(0, 3));
  }
  console.log('\n✅ test-rankings passed');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
