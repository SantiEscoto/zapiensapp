import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { Text, Card, ActivityIndicator } from 'react-native-paper';
import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { FONTS } from '../../services/fonts';

interface Collection {
  id: string;
  name: string;
  language: string;
  cover_url?: string;
  is_public: boolean;
}

export default function CollectionsTab() {
  const [loading, setLoading] = useState(true);
  const [collections, setCollections] = useState<Collection[]>([]);

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('collections')
        .select('id, name, language, cover_url, is_public')
        .eq('user_id', user.id);

      if (error) throw error;
      setCollections(data || []);
    } catch (error: any) {
      console.error('Error fetching collections:', error?.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (collections.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text variant="titleMedium" style={styles.emptyTitle}>No collections yet</Text>
        <Text variant="bodyMedium" style={styles.emptyText}>
          Create your first collection to get started
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {collections.map((collection) => (
        <Card
          key={collection.id}
          style={styles.card}
          onPress={() => console.log('Navigate to collection', collection.id)}
        >
          <View style={styles.coverContainer}>
            <Image
              source={collection.cover_url ? { uri: collection.cover_url } : require('../../../assets/welcome.png')}
              style={styles.coverImage}
              resizeMode="cover"
            />
            <View style={styles.flagContainer}>
              <Image
                source={require(`../../../assets/flags/${collection.language}.png`)}
                style={styles.flag}
              />
            </View>
            <View style={styles.titleOverlay}>
              <Text variant="titleMedium" style={styles.titleInCover}>{collection.name}</Text>
            </View>
          </View>
          <Card.Content style={styles.cardContent}>
            <Text variant="titleMedium" style={styles.title}>{collection.name}</Text>
          </Card.Content>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flagContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 3,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1,
  },
  flag: {
    width: 24,
    height: 24,
    borderRadius: 3,
  },
  title: {
    textAlign: 'center',
    fontSize: 16,
    fontFamily: FONTS.title,
  },
  titleOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 8,
  },
  titleInCover: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontFamily: FONTS.title,
  },
  cardContent: {
    paddingVertical: 12,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontFamily: FONTS.title,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 6,
    opacity: 0.7,
    fontFamily: FONTS.body,
  },
  card: {
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    width: 240,
    marginHorizontal: 8,
  },
  coverContainer: {
    width: '100%',
    height: 180,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  description: {
    marginTop: 6,
    opacity: 0.7,
  },
});