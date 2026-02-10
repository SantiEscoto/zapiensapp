import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/services/supabase';

async function ensureProfileAndRedirect(router: ReturnType<typeof useRouter>) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return;

  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') throw profileError;

    if (!profile) {
      const { error: createError } = await supabase.rpc('create_profile_with_generated_fields', {
        p_id: session.user.id,
        p_email: session.user.email ?? '',
      });
      if (createError) throw createError;
    }

    router.replace('/home');
  } catch (error) {
    console.error('Error in auth callback:', error);
    router.replace('/login');
  }
}

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // Si Supabase redirige con error (ej. 500), ir a login
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const err = params.get('error') || params.get('error_description');
      if (err) {
        console.error('Auth callback error from URL:', err);
        router.replace('/login');
        return;
      }
    }

    ensureProfileAndRedirect(router);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await ensureProfileAndRedirect(router);
      }
    });

    return () => subscription?.unsubscribe();
  }, [router]);

  return null;
}