import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { TextInput, ActivityIndicator, Portal, Modal } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/services/supabase';
import { useFonts } from 'expo-font';
import { FONTS, FONT_ASSETS } from '../../src/services/fonts';

interface User {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
}

export default function FriendsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [portalVisible, setPortalVisible] = useState(false);
  const [portalMessage, setPortalMessage] = useState('');
  const [loaded] = useFonts(FONT_ASSETS);

  const loadFollowingIds = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('profiles').select('following_ids').eq('id', user.id).single();
    setFollowingIds(Array.isArray(data?.following_ids) ? data.following_ids : []);
  };

  useEffect(() => {
    loadFollowingIds();
    fetchSuggestions();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      searchUsers();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Fetch random users as suggestions (excluding current user)
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .neq('id', user.id)
        .limit(10);

      if (error) throw error;
      setSuggestions(data || []);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
        .neq('id', user.id)
        .limit(20);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const showPortalMessage = (message: string) => {
    setPortalMessage(message);
    setPortalVisible(true);
    setTimeout(() => {
      setPortalVisible(false);
    }, 3000);
  };

  const handleToggleFollow = async (targetId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const isFollowing = followingIds.includes(targetId);
      if (isFollowing) {
        const { error } = await supabase.rpc('unfollow_user', { target_id: targetId });
        if (error) throw error;
        setFollowingIds(prev => prev.filter(id => id !== targetId));
        showPortalMessage('Dejaste de seguir');
      } else {
        const { error } = await supabase.rpc('follow_user', { target_id: targetId });
        if (error) throw error;
        setFollowingIds(prev => [...prev, targetId]);
        showPortalMessage('Ahora sigues a este usuario');
      }
    } catch (error) {
      console.error('Error al seguir/dejar de seguir:', error);
      showPortalMessage('No se pudo completar. Intenta de nuevo.');
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  const renderUserItem = (user: User) => {
    const isFollowing = followingIds.includes(user.id);
    return (
      <View key={user.id} style={styles.userItem}>
        <View style={styles.userInfo}>
          <View style={styles.avatarContainer}>
            {user.avatar_url ? (
              <Image 
                source={{ uri: user.avatar_url }} 
                style={styles.avatar}
                defaultSource={require('../../assets/user.png')}
              />
            ) : (
              <Image
                source={require('../../assets/user.png')}
                style={styles.avatar}
              />
            )}
          </View>
          <View style={styles.userTextInfo}>
            <Text style={styles.userName}>{user.full_name || user.username}</Text>
            <Text style={styles.userUsername}>@{user.username}</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={[styles.followButton, isFollowing && styles.followButtonFollowing]}
          onPress={() => handleToggleFollow(user.id)}
          activeOpacity={0.8}
        >
          <Text style={[styles.followButtonText, isFollowing && styles.followButtonTextFollowing]}>
            {isFollowing ? 'Dejar de seguir' : 'Seguir'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (!loaded) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Portal>
        <Modal
          visible={portalVisible}
          onDismiss={() => setPortalVisible(false)}
          contentContainerStyle={styles.portalContainer}
        >
          <Text style={styles.portalText}>{portalMessage}</Text>
        </Modal>
      </Portal>

      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Search for friends</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Name or username"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
          placeholderTextColor="#8F9EA6"
          left={<TextInput.Icon icon="magnify" color="#8F9EA6" />}
          theme={{ colors: { onSurfaceVariant: '#FFFFFF' } }}
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1CB0F6" />
        </View>
      ) : (
        <ScrollView style={styles.scrollView}>
          {searchQuery.trim() ? (
            <>
              <Text style={styles.sectionTitle}>Search Results</Text>
              {searchResults.length > 0 ? (
                searchResults.map(renderUserItem)
              ) : (
                <Text style={styles.emptyText}>No users found</Text>
              )}
            </>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Friend suggestions</Text>
              {suggestions.map(renderUserItem)}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131f24',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  backText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontFamily: 'DINNextRoundedLTPro-Bold',
    color: '#FFFFFF',
    marginLeft: 20,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchInput: {
    backgroundColor: '#202f36',
    borderRadius: 14,
    height: 56,
    fontSize: 16,
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'DINNextRoundedLTPro-Bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#202f36',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFDE59',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  userTextInfo: {
    marginLeft: 16,
  },
  userName: {
    fontSize: 16,
    fontFamily: 'DINNextRoundedLTPro-Bold',
    color: '#FFFFFF',
  },
  userUsername: {
    fontSize: 14,
    fontFamily: 'DINNextRoundedLTPro-Regular',
    color: '#8F9EA6',
  },
  followButton: {
    backgroundColor: '#1CB0F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  followButtonFollowing: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#8F9EA6',
  },
  followButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'DINNextRoundedLTPro-Bold',
  },
  followButtonTextFollowing: {
    color: '#8F9EA6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'DINNextRoundedLTPro-Regular',
    color: '#8F9EA6',
    textAlign: 'center',
    marginTop: 20,
  },
  portalContainer: {
    backgroundColor: '#202f36',
    padding: 20,
    margin: 40,
    borderRadius: 14,
    alignItems: 'center',
  },
  portalText: {
    color: '#FFFFFF',
    fontFamily: 'DINNextRoundedLTPro-Bold',
    fontSize: 16,
    textAlign: 'center',
  },
});