const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
// TODO: Update with your new Supabase publishable key
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://iatnvrxdlpwxvsbnheqp.supabase.co';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'TU_PUBLISHABLE_KEY_AQUI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function viewCollections() {
  try {
    const { data, error } = await supabase
      .from('ZapCards_Collections')
      .select('id, name, language');

    if (error) throw error;

    console.log('\nZapCards Collections:\n');
    if (data && data.length > 0) {
      data.forEach(collection => {
        console.log(`ID: ${collection.id}`);
        console.log(`Name: ${collection.name}`);
        console.log(`Language: ${collection.language || 'N/A'}`);
        console.log('-------------------');
      });
    } else {
      console.log('No collections found.');
    }
  } catch (error) {
    console.error('Error fetching collections:', error.message);
  }
}

viewCollections();