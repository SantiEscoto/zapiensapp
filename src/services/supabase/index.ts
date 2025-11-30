import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ikpjwmjmtuvedgzhtane.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrcGp3bWptdHV2ZWRnemh0YW5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAxNzcxMTMsImV4cCI6MjA1NTc1MzExM30.A7BA2h9OJXNrNocc_7T_O2ZIRfUCvVro5rlVEgQXXLg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});