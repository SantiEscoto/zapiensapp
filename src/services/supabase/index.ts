import 'react-native-get-random-values'; // Must be imported first for crypto
import 'react-native-url-polyfill/auto';
// Polyfills for Node.js modules required by ws (used by Supabase realtime)
if (typeof global.stream === 'undefined') {
  global.stream = require('stream-browserify');
}
if (typeof global.http === 'undefined') {
  global.http = require('stream-http');
}
if (typeof global.https === 'undefined') {
  global.https = require('https-browserify');
}
if (typeof global.url === 'undefined') {
  global.url = require('url');
}
if (typeof global.crypto === 'undefined') {
  global.crypto = require('crypto-browserify');
}
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Use environment variables instead of hardcoded values
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});