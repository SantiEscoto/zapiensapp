const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://ikpjwmjmtuvedgzhtane.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrcGp3bWptdHV2ZWRnemh0YW5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAxNzcxMTMsImV4cCI6MjA1NTc1MzExM30.A7BA2h9OJXNrNocc_7T_O2ZIRfUCvVro5rlVEgQXXLg';

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