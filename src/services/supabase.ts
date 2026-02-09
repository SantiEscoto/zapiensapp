import 'react-native-get-random-values'; // Must be imported first for crypto
import 'react-native-url-polyfill/auto'
// Polyfills for Node.js modules required by ws (used by Supabase realtime)
const g = global as Record<string, unknown>;
if (typeof g.stream === 'undefined') g.stream = require('stream-browserify');
if (typeof g.http === 'undefined') g.http = require('stream-http');
if (typeof g.https === 'undefined') g.https = require('https-browserify');
if (typeof g.url === 'undefined') g.url = require('url');
if (typeof g.crypto === 'undefined') g.crypto = require('crypto-browserify');
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})