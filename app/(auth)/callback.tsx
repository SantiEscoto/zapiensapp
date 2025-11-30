import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/services/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        if (session?.user) {
          try {
            // Check if profile exists
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profileError && profileError.code !== 'PGRST116') {
              throw profileError;
            }

            // If profile doesn't exist, create one
            if (!profile) {
              const { error: createError } = await supabase.from('profiles').insert([
                {
                  id: session.user.id,
                  email: session.user.email,
                  updated_at: new Date().toISOString(),
                },
              ]);

              if (createError) throw createError;
            }

            // Redirect to home page
            router.replace('/home');
          } catch (error) {
            console.error('Error in auth callback:', error);
            router.replace('/login');
          }
        }
      }
    });
  }, []);

  return null;
}