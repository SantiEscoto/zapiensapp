import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Animated, Dimensions, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../src/services/supabase';
import { FONTS } from '../../src/services/fonts';
import { useWindowDimensions } from 'react-native';
import { updateUserXP } from '../../src/services/xpService';
import { useTheme } from '../../src/context/ThemeContext';
import { useCollections } from '../../src/context/CollectionsContext';
import { ROUTES } from '../../src/navigation/routes';

type TabType = 'play' | 'cards';

interface Collection {
  id: string;
  name: string;
  topics: string[];
  created_at: string;
  terms_count?: number;
  is_public?: boolean;
  cover_url?: string;
}

interface Flashcard {
  id: string;
  front_content: string;
  back_content: string;
}

interface Game {
  title: string;
  subtitle: string;
  path: string;
  color: string;
}

const GAMES: Game[] = [
  // Paleta alineada a `website/zapiens/src/styles/globals.css`
  { title: 'Flashcards', subtitle: 'Practica con tarjetas interactivas', path: ROUTES.FLASHCARD, color: '#FF4D4D' }, // primary red
  { title: 'Match', subtitle: 'Relaciona los términos con sus definiciones', path: ROUTES.MATCH, color: '#40E0D0' }, // turquoise
  { title: 'Spinning', subtitle: 'Gira la rueda y responde las preguntas', path: ROUTES.SPINNING, color: '#FF6B35' }, // highlight orange
  { title: 'Quiz', subtitle: 'Pon a prueba tu conocimiento', path: ROUTES.QUIZ, color: '#4DA6FF' }, // highlight blue
  { title: 'Word Search', subtitle: 'Encuentra las palabras ocultas', path: ROUTES.WORDSEARCH, color: '#1e40af' }, // secondary blue
  { title: 'Crossword', subtitle: 'Resuelve el crucigrama con las definiciones', path: ROUTES.CROSSWORD, color: '#FF8C00' } // neon orange
];

export default function LessonsScreen() {
  const { width } = useWindowDimensions();
  const TAB_WIDTH = width / 2;
  const router = useRouter();
  const params = useLocalSearchParams();
  const idFromParams = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : undefined;
  // En web: fallback leyendo ?id= de la URL (por si en producción el router no pasa params)
  const idFromUrl = Platform.OS === 'web' && typeof window !== 'undefined'
    ? (new URLSearchParams(window.location.search).get('id') ?? undefined)
    : undefined;
  const id = idFromParams ?? idFromUrl;
  const refresh = params.refresh;
  const { theme } = useTheme();
  const { updateCollection } = useCollections();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('play');
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const [error, setError] = useState<string | null>(null);

  const translateX = useMemo(() => 
    slideAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, TAB_WIDTH]
    }), [slideAnimation, TAB_WIDTH]);

  const fetchCollection = useCallback(async () => {
    if (!id) {
      setError('Falta el ID de la colección.');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const [collectionResponse, cardsResponse] = await Promise.all([
        supabase.from('collections').select('*').eq('id', id).single(),
        supabase.from('cards').select('*').eq('collection_id', id)
      ]);

      if (collectionResponse.error) throw collectionResponse.error;
      if (!collectionResponse.data) throw new Error('Collection not found');
      if (cardsResponse.error) throw cardsResponse.error;

      setCollection(collectionResponse.data);
      setFlashcards(cardsResponse.data || []);
    } catch (error: any) {
      console.error('Error fetching collection:', error.message);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCollection();
  }, [fetchCollection, refresh]);

  const switchTab = (tab: TabType) => {
    Animated.spring(slideAnimation, {
      toValue: tab === 'play' ? 0 : 1,
      useNativeDriver: true,
      tension: 100,
      friction: 10
    }).start();
    setActiveTab(tab);
  };

  // Handle game completion and award XP
  const handleGameCompletion = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Award 10 XP for completing any game
      await updateUserXP(user.id, 10);
      
      // Show XP earned notification
      Alert.alert('¡Felicidades!', 'Has ganado +10 XP');
    } catch (error) {
      console.error('Error awarding XP:', error);
    }
  }, []);

  // Navegar al nivel (juego) manteniendo nested: mundo → nivel; back desde nivel vuelve a lessons
  const navigateTo = (path: string) => {
    router.push({
      pathname: path as any,
      params: { id, onComplete: 'handleGameCompletion' },
    });
  };

  const handleClose = useCallback(async () => {
    if (collection) {
      updateCollection({
        ...collection,
        topics: collection.topics ?? [],
      });
    }
    router.back();
  }, [collection, updateCollection]);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>Loading collection...</Text>
      </View>
    );
  }

  if (error || (!collection && !loading)) {
    return (
      <View style={[styles.loadingContainer, styles.errorContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorTitle, { color: theme.colors.text }]}>No se pudo cargar la colección</Text>
        <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>
          {error || 'Colección no encontrada o sin acceso.'}
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => { setError(null); fetchCollection(); }}
        >
          <Text style={[styles.retryButtonText, { color: theme.colors.text }]}>Reintentar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={[styles.backButtonText, { color: theme.colors.textSecondary }]}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={handleClose}
        >
          <Text style={[styles.closeButtonText, { color: theme.colors.text }]}>✕</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.editButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => router.push({ pathname: ROUTES.EDIT as any, params: { id: id ?? '' } })}
        >
          <Text style={[styles.editButtonText, { color: theme.colors.text }]}>Edit</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.colors.text }]}>{collection?.name}</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{flashcards.length} términos</Text>

        <View style={styles.tabBar}>
          {['play', 'cards'].map((tab) => (
            <TouchableOpacity 
              key={tab}
              style={styles.tab} 
              onPress={() => switchTab(tab as TabType)}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === tab ? theme.colors.primary : theme.colors.textSecondary },
                ]}
              >
                {tab.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
          <Animated.View
            style={[
              styles.indicator,
              {
                width: TAB_WIDTH,
                backgroundColor: theme.colors.primary,
                transform: [{ translateX }],
              },
            ]}
          />
        </View>

        <ScrollView style={styles.screenContainer}>
          {activeTab === 'play' ? (
            <View style={styles.practiceContainer}>
              <View style={styles.gamesGrid}>
                {GAMES.map((game) => (
                  <TouchableOpacity 
                    key={game.title}
                    style={[
                      styles.practiceButton,
                      {
                        backgroundColor: theme.colors.card,
                        borderColor: game.color,
                        borderWidth: 2,
                      },
                    ]}
                    onPress={() => navigateTo(game.path)}
                  >
                    <Text style={[styles.practiceButtonText, { color: theme.colors.text }]}>{game.title}</Text>
                    <Text style={[styles.practiceButtonSubtext, { color: theme.colors.textSecondary }]}>{game.subtitle}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.cardsContainer}>
              {flashcards.map((card) => (
                <View key={card.id} style={[styles.cardContainer, { borderColor: theme.colors.border }]}>
                  <View style={[styles.cardTable, { backgroundColor: theme.colors.card }]}>
                    <View style={styles.cardRow}>
                      <View style={[styles.cardColumn, styles.Column, { borderRightColor: theme.colors.border }]}>
                        <Text style={[styles.cardText, { color: theme.colors.text }]}>{card.front_content}</Text>
                      </View>
                      <View style={styles.cardColumn}>
                        <Text style={[styles.cardText, { color: theme.colors.text }]}>{card.back_content}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#003333' }, // fallback branding
  screenContainer: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#003333' }, // fallback branding
  loadingText: { color: '#FFFFFF', fontSize: 18, fontFamily: FONTS.title },
  errorContainer: { padding: 24 },
  errorTitle: { color: '#FFFFFF', fontSize: 20, fontFamily: FONTS.title, marginBottom: 12, textAlign: 'center' },
  errorText: { color: '#8E8E93', fontSize: 16, textAlign: 'center', marginBottom: 20 },
  retryButton: { backgroundColor: '#FF8C00', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 12, alignSelf: 'center', marginBottom: 12 },
  retryButtonText: { color: '#FFFFFF', fontSize: 16, fontFamily: FONTS.title },
  backButton: { alignSelf: 'center', paddingVertical: 10 },
  backButtonText: { color: '#8E8E93', fontSize: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  editButton: { padding: 10, backgroundColor: '#FF8C00', borderRadius: 8 },
  editButtonText: { color: '#FFFFFF', fontSize: 16, fontFamily: FONTS.title },
  closeButton: { padding: 10 },
  closeButtonText: { color: '#FFFFFF', fontSize: 24, fontFamily: FONTS.title },
  content: { flex: 1, padding: 20 },
  title: { color: '#FFFFFF', fontSize: 32, fontFamily: FONTS.title, marginBottom: 8 },
  subtitle: { color: '#8E8E93', fontSize: 18, fontFamily: FONTS.body, marginBottom: 32 },
  tabBar: { flexDirection: 'row', position: 'relative', marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 15, alignItems: 'center' },
  tabText: { color: '#8E8E93', fontSize: 14, fontFamily: FONTS.title },
  activeTabText: { color: '#FF8C00' },
  indicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 3,
    backgroundColor: '#FF8C00',
  },
  practiceContainer: { flex: 1, marginBottom: 40},
  gamesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  practiceButton: { width: '48.5%', borderRadius: 14, padding: 15, marginBottom: 12 },
  practiceButtonText: { color: '#FFFFFF', fontSize: 20, fontFamily: FONTS.title, marginBottom: 4 },
  practiceButtonSubtext: { color: '#FFFFFF', fontSize: 14, fontFamily: FONTS.body, opacity: 0.8 },
  cardsContainer: { padding: 16 },
  cardContainer: { marginBottom: 12, borderRadius: 12, overflow: 'hidden', borderWidth: 2.5, borderColor: '#0d5c5c' },
  cardTable: { backgroundColor: '#0a4545', flexDirection: 'row' },
  cardRow: { flex: 1, flexDirection: 'row' },
  cardColumn: { flex: 1, padding: 16 },
  Column: { borderRightWidth: 2.5, borderRightColor: '#0d5c5c' },
  cardText: { color: '#FFFFFF', fontSize: 16, fontFamily: FONTS.body }
});