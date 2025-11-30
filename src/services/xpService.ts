import { supabase } from './supabase';

/**
 * Updates a user's XP by adding the specified amount to their daily and weekly totals
 * @param userId The user's UUID
 * @param xpAmount The amount of XP to add (default: 10)
 * @returns Promise that resolves when the XP has been updated
 */
export async function updateUserXP(userId: string, xpAmount: number = 10): Promise<void> {
  try {
    // Call the database function to update user XP
    const { error } = await supabase.rpc('update_user_xp', {
      user_id: userId,
      xp_amount: xpAmount
    });
    
    if (error) {
      console.error('Error updating user XP:', error.message);
      throw error;
    }
  } catch (error) {
    console.error('Failed to update user XP:', error);
    throw error;
  }
}