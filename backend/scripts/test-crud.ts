/**
 * Prueba: CRUD de collections, cards y folders
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
  console.error('Falta SUPABASE_URL/EXPO_PUBLIC_SUPABASE_URL o SUPABASE_ANON_KEY en .env o ../.env.local');
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
    const email = `crud-${Date.now()}@example.com`;
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

  console.log('\n1. Insert collection...');
  const { data: col, error: colErr } = await supabase
    .from('collections')
    .insert({
      name: 'Test Collection',
      topics: ['General', 'Test'],
      user_id: userId,
      is_public: false,
    })
    .select('id, name')
    .single();
  if (colErr || !col) {
    console.error('Insert collection error:', colErr?.message);
    process.exit(1);
  }
  console.log('   Collection:', col);

  console.log('2. Insert cards...');
  const { data: cards, error: cardsErr } = await supabase
    .from('cards')
    .insert([
      { collection_id: col.id, front_content: 'Q1', back_content: 'A1' },
      { collection_id: col.id, front_content: 'Q2', back_content: 'A2' },
    ])
    .select('id, front_content');
  if (cardsErr || !cards?.length) {
    console.error('Insert cards error:', cardsErr?.message);
    process.exit(1);
  }
  console.log('   Cards:', cards.length);

  console.log('3. Insert folder with collection...');
  const { data: folder, error: folderErr } = await supabase
    .from('folders')
    .insert({
      name: 'Test Folder',
      user_id: userId,
      collection_ids: [col.id],
      is_public: false,
    })
    .select('id, name, collection_ids')
    .single();
  if (folderErr || !folder) {
    console.error('Insert folder error:', folderErr?.message);
    process.exit(1);
  }
  console.log('   Folder:', folder);

  console.log('4. Select own collections...');
  const { data: list, error: listErr } = await supabase
    .from('collections')
    .select('id, name, topics')
    .eq('user_id', userId);
  if (listErr) {
    console.error('Select error:', listErr?.message);
    process.exit(1);
  }
  console.log('   Count:', list?.length ?? 0);

  console.log('5. Update card...');
  const { error: upErr } = await supabase
    .from('cards')
    .update({ back_content: 'A1 updated' })
    .eq('id', cards[0].id);
  if (upErr) {
    console.error('Update card error:', upErr?.message);
    process.exit(1);
  }
  console.log('   OK');

  console.log('6. Delete one card...');
  const { error: delErr } = await supabase.from('cards').delete().eq('id', cards[1].id);
  if (delErr) {
    console.error('Delete card error:', delErr?.message);
    process.exit(1);
  }
  console.log('   OK');

  console.log('\n✅ test-crud passed');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
