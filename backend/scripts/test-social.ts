/**
 * Prueba: Social (following_ids / follower_ids)
 * Requiere: migraciones 00001-00004 aplicadas; usa .env o ../.env.local
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
  console.log('Creando dos usuarios de prueba...');
  const email1 = `social-a-${Date.now()}@example.com`;
  const email2 = `social-b-${Date.now()}@example.com`;

  const { data: d1, error: e1 } = await supabase.auth.signUp({
    email: email1,
    password: 'TestPassword123!',
    options: { emailConfirm: true },
  });
  if (e1 || !d1.user) {
    console.error('SignUp user A:', e1?.message);
    process.exit(1);
  }
  const userA = d1.user.id;

  await supabase.auth.signOut();
  const { data: d2, error: e2 } = await supabase.auth.signUp({
    email: email2,
    password: 'TestPassword123!',
    options: { emailConfirm: true },
  });
  if (e2 || !d2.user) {
    console.error('SignUp user B:', e2?.message);
    process.exit(1);
  }
  const userB = d2.user.id;

  console.log('   User A:', userA);
  console.log('   User B:', userB);

  console.log('\n1. User A sigue a B (RPC follow_user)...');
  await supabase.auth.signInWithPassword({ email: email1, password: 'TestPassword123!' });
  const { error: rpc1 } = await supabase.rpc('follow_user', { target_id: userB });
  if (rpc1) {
    console.error('   Error:', rpc1.message);
    process.exit(1);
  }
  console.log('   OK');

  console.log('2. Verificar: B tiene a A en follower_ids...');
  const { data: profileB, error: selB } = await supabase
    .from('profiles')
    .select('follower_ids')
    .eq('id', userB)
    .single();
  if (selB || !profileB) {
    console.error('   Error:', selB?.message);
    process.exit(1);
  }
  const hasA = Array.isArray(profileB.follower_ids) && profileB.follower_ids.includes(userA);
  if (!hasA) {
    console.error('   Esperado follower_ids con', userA, 'got', profileB.follower_ids);
    process.exit(1);
  }
  console.log('   follower_ids de B:', profileB.follower_ids);

  console.log('3. User A deja de seguir a B (RPC unfollow_user)...');
  const { error: rpc2 } = await supabase.rpc('unfollow_user', { target_id: userB });
  if (rpc2) {
    console.error('   Error:', rpc2.message);
    process.exit(1);
  }
  console.log('   OK');

  console.log('4. Verificar: B ya no tiene a A en follower_ids...');
  const { data: profileB2, error: selB2 } = await supabase
    .from('profiles')
    .select('follower_ids')
    .eq('id', userB)
    .single();
  if (selB2 || !profileB2) {
    console.error('   Error:', selB2?.message);
    process.exit(1);
  }
  const stillHasA = Array.isArray(profileB2.follower_ids) && profileB2.follower_ids.includes(userA);
  if (stillHasA) {
    console.error('   follower_ids debería no contener A, got', profileB2.follower_ids);
    process.exit(1);
  }
  console.log('   follower_ids de B:', profileB2.follower_ids ?? []);

  console.log('\n✅ test-social passed');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
