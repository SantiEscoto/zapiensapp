import React, { useReducer, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ImageSourcePropType } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { supabase } from '../../src/services/supabase';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { useTheme } from '../../src/context/ThemeContext';

interface UserRanking {
  user_id: string;
  username: string;
  score: number;
  rank: number;
  avatar_url?: string;
  country_code?: string | null;
}

interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  weekly_xp: number | null;
  following_ids: string[] | null;
  email: string | null;
}

// State interface
interface RankingsState {
  rankings: UserRanking[];
  userRank: UserRanking | null;
  loading: boolean;
  activeTab: 'general' | 'teams';
  currentUserId: string | null;
  lastUpdated: number;
}

// Action types
type RankingsAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER_ID'; payload: string }
  | { type: 'SET_INITIAL_DATA'; payload: { rankings: UserRanking[]; userRank: UserRanking | null } }
  | { type: 'UPDATE_PROFILE'; payload: { profileId: string; score: number } }
  | { type: 'SET_ACTIVE_TAB'; payload: 'general' | 'teams' };

// Reducer function
function rankingsReducer(state: RankingsState, action: RankingsAction): RankingsState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_USER_ID':
      return { ...state, currentUserId: action.payload };
    
    case 'SET_INITIAL_DATA':
      return { 
        ...state, 
        rankings: action.payload.rankings,
        userRank: action.payload.userRank,
        lastUpdated: Date.now() 
      };
    
    case 'UPDATE_PROFILE': {
      // Only update if the profile exists in our rankings
      const profileIndex = state.rankings.findIndex(r => r.user_id === action.payload.profileId);
      if (profileIndex === -1) return state;
      
      // Create a new rankings array with updated score
      const newRankings = [...state.rankings];
      newRankings[profileIndex] = {
        ...newRankings[profileIndex],
        score: action.payload.score
      };
      
      // Sort by score and recalculate ranks
      newRankings.sort((a, b) => b.score - a.score);
      newRankings.forEach((rank, index) => {
        rank.rank = index + 1;
      });
      
      // Find the current user's rank in the updated rankings
      const newUserRank = state.currentUserId 
        ? newRankings.find(r => r.user_id === state.currentUserId) || null 
        : null;
      
      return {
        ...state,
        rankings: newRankings,
        userRank: newUserRank,
        lastUpdated: Date.now()
      };
    }
    
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };
    
    default:
      return state;
  }
}

// Initial state
const initialState: RankingsState = {
  rankings: [],
  userRank: null,
  loading: true,
  activeTab: 'general',
  currentUserId: null,
  lastUpdated: 0
};

export default function RankingsScreen() {
  const [state, dispatch] = useReducer(rankingsReducer, initialState);
  const { rankings, userRank, loading, activeTab, currentUserId } = state;
  const { theme } = useTheme();

  // Handle profile updates from real-time subscription
  const handleProfileUpdate = useCallback((payload: RealtimePostgresChangesPayload<any>) => {
    const typedPayload = payload as unknown as { 
      new: Profile; 
      old: Profile;
    };
    
    // Only update if weekly_xp changed
    if (typedPayload.new?.weekly_xp !== typedPayload.old?.weekly_xp) {
      dispatch({
        type: 'UPDATE_PROFILE',
        payload: {
          profileId: typedPayload.new.id,
          score: Number(typedPayload.new.weekly_xp) || 0
        }
      });
    }
  }, []);

  // Get country code from email domain
  const getCountryCodeFromEmail = useCallback((email: string | null): string | null => {
    if (!email) return null;
    
    const domain = email.split('@')[1];
    if (!domain) return null;
    
    const tld = domain.split('.').pop();
    if (tld === 'es') return 'es';
    if (tld === 'kr') return 'kr';
    if (tld === 'ie' || tld === 'uk' || tld === 'com') return 'ie';
    
    return null;
  }, []);

  // Convert profile data to ranking format
  const profileToRanking = useCallback((profile: Profile, index: number): UserRanking => {
    return {
      user_id: profile.id,
      username: profile.full_name || profile.username,
      score: profile.weekly_xp || 0,
      rank: index + 1,
      avatar_url: profile.avatar_url || undefined,
      country_code: getCountryCodeFromEmail(profile.email)
    };
  }, [getCountryCodeFromEmail]);

  // Initial fetch of rankings
  const fetchInitialRankings = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      if (!user) {
        console.error('User not authenticated');
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }

      // Store user ID for later use
      dispatch({ type: 'SET_USER_ID', payload: user.id });

      // Fetch profiles ordered by weekly_xp
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, weekly_xp, following_ids, email')
        .order('weekly_xp', { ascending: false })
        .limit(100);
        
      if (profilesError) throw profilesError;
      
      if (!profilesData) {
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }
      
      // Transform profiles to rankings
      const rankingsData = profilesData.map(profileToRanking);
      
      // Find current user's rank
      const currentUserRank = rankingsData.find(rank => rank.user_id === user.id) || null;
      
      // Update state with initial data
      dispatch({
        type: 'SET_INITIAL_DATA',
        payload: {
          rankings: rankingsData,
          userRank: currentUserRank
        }
      });
    } catch (error) {
      console.error('Error fetching rankings:', error instanceof Error ? error.message : String(error));
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [profileToRanking]);

  // Optimized fetch for updates - only gets scores
  const fetchRankingUpdates = useCallback(async () => {
    if (!currentUserId) return;
    
    try {
      // We only need to fetch the scores, not all profile data
      const { data: scoresData, error: scoresError } = await supabase
        .from('profiles')
        .select('id, weekly_xp')
        .order('weekly_xp', { ascending: false })
        .limit(100);
      
      if (scoresError) throw scoresError;
      if (!scoresData) return;
      
      // Update each profile in our state
      for (const profile of scoresData) {
        dispatch({
          type: 'UPDATE_PROFILE',
          payload: {
            profileId: profile.id,
            score: profile.weekly_xp || 0
          }
        });
      }
    } catch (error) {
      console.error('Error updating rankings:', error instanceof Error ? error.message : String(error));
    }
  }, [currentUserId]);

  useEffect(() => {
    // Initial fetch
    fetchInitialRankings();

    // Set up real-time subscription for profile changes
    const subscription = supabase
      .channel('profiles_changes')
      .on(
        'postgres_changes', 
        { event: '*', schema: 'public', table: 'profiles' },
        handleProfileUpdate
      )
      .subscribe();

    // Set up lightweight periodic updates that only fetch scores
    const updateInterval = setInterval(fetchRankingUpdates, 30000);

    return () => {
      subscription.unsubscribe();
      clearInterval(updateInterval);
    };
  }, [fetchInitialRankings, fetchRankingUpdates, handleProfileUpdate]);

  // Memoized tab button component
  const TabButton = React.memo(({ title, isActive, onPress, theme }: { 
    title: string; 
    isActive: boolean; 
    onPress: () => void;
    theme: any;
  }) => (
    <TouchableOpacity
      style={[
        styles.tabButton, 
        isActive && { backgroundColor: theme.colors.border }
      ]}
      onPress={onPress}
    >
      <Text style={[
        styles.tabButtonText, 
        { color: isActive ? theme.colors.primary : theme.colors.textSecondary }
      ]}>{title}</Text>
    </TouchableOpacity>
  ));

  // Flag image mapping
  const getFlagImage = useCallback((code?: string | null): ImageSourcePropType => {
    if (!code) return require('../../assets/user.png');
    
    switch (code) {
      case 'es': return require('../../assets/flags/es.png');
      case 'kr': return require('../../assets/flags/ko.png');
      case 'ie': return require('../../assets/flags/en.png');
      default: return require('../../assets/user.png');
    }
  }, []);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Leaderboard</Text>
      
      <View style={[styles.tabContainer, { backgroundColor: theme.colors.card }]}>
        <TabButton
          title="General"
          isActive={activeTab === 'general'}
          onPress={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'general' })}
          theme={theme}
        />
        <TabButton
          title="Teams"
          isActive={activeTab === 'teams'}
          onPress={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'teams' })}
          theme={theme}
        />
      </View>

      {activeTab === 'general' ? (
        <>
          {userRank && (
            <View style={[styles.userRankContainer, { 
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border 
            }]}>
              <Text style={[styles.userRankTitle, { color: theme.colors.text }]}>Your Ranking</Text>
              <Text style={[styles.userRankText, { color: theme.colors.primary }]}>
                Position #{userRank.rank} - XP: {userRank.score}
              </Text>
            </View>
          )}

          <ScrollView style={styles.rankingsList}>
            {rankings.map((rank) => (
              <View 
                key={rank.user_id} 
                style={[
                  styles.rankItem, 
                  { 
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.border 
                  },
                  rank.user_id === userRank?.user_id && { borderColor: theme.colors.primary }
                ]}
              >
                <View style={[styles.rankPositionContainer, { backgroundColor: theme.colors.border }]}>
                  <Text style={[styles.rankPosition, { color: theme.colors.text }]}>{rank.rank}</Text>
                </View>
                <View style={styles.userInfoContainer}>
                  <View style={styles.avatarContainer}>
                    <Image 
                      source={rank.avatar_url ? { uri: rank.avatar_url } : require('../../assets/user.png')} 
                      style={styles.avatar} 
                    />
                    {rank.country_code && (
                      <View style={[styles.flagContainer, { 
                        backgroundColor: theme.colors.card,
                        borderColor: theme.colors.border 
                      }]}>
                        <Image 
                          source={getFlagImage(rank.country_code)} 
                          style={styles.flagIcon} 
                        />
                      </View>
                    )}
                  </View>
                  <Text style={[styles.rankUsername, { color: theme.colors.text }]}>{rank.username}</Text>
                </View>
                <Text style={[styles.rankScore, { color: theme.colors.primary }]}>{rank.score} XP</Text>
              </View>
            ))}
          </ScrollView>
        </>
      ) : (
        <View style={styles.comingSoonContainer}>
          <Text style={[styles.comingSoonText, { color: theme.colors.textSecondary }]}>Teams rankings coming soon!</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    borderRadius: 14,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  userRankContainer: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
  },
  userRankTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  userRankText: {
    fontSize: 16,
  },
  rankingsList: {
    flex: 1,
  },
  rankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
    borderWidth: 2,
  },
  rankPositionContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankPosition: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  userInfoContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  flagContainer: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    borderRadius: 10,
    padding: 2,
    borderWidth: 2,
  },
  flagIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  rankUsername: {
    flex: 1,
    fontSize: 16,
  },
  rankScore: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  comingSoonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  comingSoonText: {
    fontSize: 18,
    fontWeight: '600',
  },
});