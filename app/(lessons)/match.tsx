import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Animated } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../src/services/supabase';
import { updateUserXP } from '../../src/services/xpService';
import { FONTS } from '../../src/services/fonts';

interface Flashcard {
  id: string;
  front: string;
  back: string;
}

interface Collection {
  id: string;
  name: string;
  language: string;
}

interface MatchCard {
  id: string;
  content: string;
  isMatched: boolean;
  isSelected: boolean;
  type: 'term' | 'definition';
  matchId: string;
  isIncorrect?: boolean;
  isVisible: boolean;
  position?: number;
  opacity?: Animated.Value;
  scale?: Animated.Value;
}

export default function MatchScreen() {
  const MAX_VISIBLE_PAIRS = 5;
  
  const router = useRouter();
  const params = useLocalSearchParams();
  const { id } = params;
  const [collection, setCollection] = useState<Collection | null>(null);
  const [allCards, setAllCards] = useState<MatchCard[]>([]);
  const [visibleCards, setVisibleCards] = useState<MatchCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<MatchCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);
  const [totalMoves, setTotalMoves] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;
  const totalInitialCards = useRef(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Eliminamos cardsToAddNext para agregar parejas de forma inmediata
  const [animatingCards, setAnimatingCards] = useState(new Set<string>());
  const availablePositions = useRef<{[key in 'term' | 'definition']: number[]}>({ term: [], definition: [] });
  const isProcessingMatch = useRef<boolean>(false);
  const [usedMatchIds, setUsedMatchIds] = useState(new Set<string>());

  const { termCards, definitionCards, matchedCount } = useMemo(() => {
    const termCards = visibleCards
      .filter(card => card.type === 'term' && card.isVisible)
      .sort((a, b) => ((a.position || 0) - (b.position || 0)));
      
    const definitionCards = visibleCards
      .filter(card => card.type === 'definition' && card.isVisible)
      .sort((a, b) => ((a.position || 0) - (b.position || 0)));
      
    const matchedCount = allCards.filter(card => card.isMatched).length;
    
    return { termCards, definitionCards, matchedCount };
  }, [visibleCards, allCards]);

  const allMatched = matchedCount === totalInitialCards.current && totalInitialCards.current > 0;

  useEffect(() => {
    const maxPositions = MAX_VISIBLE_PAIRS;
    availablePositions.current = {
      term: Array.from({ length: maxPositions }, (_, i) => i),
      definition: Array.from({ length: maxPositions }, (_, i) => i)
    };
  }, []);

  useEffect(() => {
    if (id) {
      fetchCollection();
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [id]);

  useEffect(() => {
    if (!loading && !allMatched) {
      timerRef.current = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [loading, allMatched]);

  useEffect(() => {
    if (allMatched && timerRef.current) {
      clearInterval(timerRef.current);
      
      // Award XP when all matches are completed
      const awardXP = async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await updateUserXP(user.id, 10);
            Alert.alert('¡Felicidades!', 'Has completado todos los pares y ganado +10 XP');
          }
        } catch (error) {
          console.error('Error awarding XP:', error);
        }
      };
      
      awardXP();
    }
  }, [allMatched]);

  const assignPosition = useCallback((type: 'term' | 'definition') => {
    const positions = availablePositions.current[type];
    if (positions.length === 0) return 0;
    const randomIndex = Math.floor(Math.random() * positions.length);
    const position = positions.splice(randomIndex, 1)[0];
    return position;
  }, []);

  const releasePosition = useCallback((type: 'term' | 'definition', position: number) => {
    if (position !== undefined) {
      availablePositions.current[type].push(position);
      availablePositions.current[type].sort((a, b) => a - b);
    }
  }, []);

  const fetchCollection = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data: collectionData, error: collectionError } = await supabase
        .from('collections')
        .select('*')
        .eq('id', id)
        .single();

      if (collectionError) throw collectionError;
      if (!collectionData) throw new Error('Collection not found');

      setCollection(collectionData);
      
      const { data: cardsData, error: cardsError } = await supabase
        .from('cards')
        .select('*')
        .eq('collection_id', id);

      if (cardsError) throw cardsError;

      const matchCards: MatchCard[] = [];
      cardsData.forEach((card) => {
        matchCards.push({
          id: `term-${card.id}`,
          content: card.front_content,
          isMatched: false,
          isSelected: false,
          type: 'term',
          matchId: card.id,
          isVisible: false
        },
        {
          id: `def-${card.id}`,
          content: card.back_content,
          isMatched: false,
          isSelected: false,
          type: 'definition',
          matchId: card.id,
          isVisible: false
        });
      });
      
      const shuffledCards = fisherYatesShuffle([...matchCards]);
      setAllCards(shuffledCards);
      totalInitialCards.current = shuffledCards.length;
      
      selectInitialVisibleCards(shuffledCards);
    } catch (error: any) {
      console.error('Error fetching collection:', error?.message);
      Alert.alert('Error', 'Failed to load matching game');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const fisherYatesShuffle = (array: MatchCard[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const selectInitialVisibleCards = (cards: MatchCard[]) => {
    const selectedMatchIds = new Set<string>();
    const initialVisible: MatchCard[] = [];
    const remainingCards = [...cards];
    
    while (selectedMatchIds.size < MAX_VISIBLE_PAIRS && remainingCards.length >= 2) {
      const nextCardIndex = remainingCards.findIndex(card => !selectedMatchIds.has(card.matchId));
      
      if (nextCardIndex === -1) break;
      
      const nextCard = remainingCards[nextCardIndex];
      const matchId = nextCard.matchId;
      
      remainingCards.splice(nextCardIndex, 1);
      
      const pairIndex = remainingCards.findIndex(card => card.matchId === matchId);
      
      if (pairIndex === -1) continue;
      
      const pairCard = remainingCards[pairIndex];
      remainingCards.splice(pairIndex, 1);
      
      nextCard.position = assignPosition(nextCard.type);
      pairCard.position = assignPosition(pairCard.type);
      
      nextCard.isVisible = true;
      pairCard.isVisible = true;
      initialVisible.push(nextCard, pairCard);
      selectedMatchIds.add(matchId);
    }
    
    setVisibleCards(initialVisible);
    
    const updatedAllCards = [
      ...initialVisible.map(card => ({...card})), 
      ...remainingCards.map(card => ({...card}))
    ];
    setAllCards(updatedAllCards);
  };

  // Nueva versión de addNewCardPair: agrega la pareja inmediatamente sin retraso
  const addNewCardPair = useCallback(() => {
    const hiddenCards = allCards.filter(card => !card.isMatched && !card.isVisible);
    if (hiddenCards.length < 2) return;
    
    const selectedMatchIds = new Set<string>();
    const newVisibleCards: MatchCard[] = [];
    const matchIdMap = new Map<string, MatchCard[]>();
    
    hiddenCards.forEach(card => {
      if (!matchIdMap.has(card.matchId)) {
        matchIdMap.set(card.matchId, []);
      }
      matchIdMap.get(card.matchId)?.push(card);
    });
    
    for (const [matchId, cards] of matchIdMap.entries()) {
      if (cards.length >= 2 && selectedMatchIds.size < 1) {
        const termCard = cards.find(c => c.type === 'term');
        const defCard = cards.find(c => c.type === 'definition');
        
        if (termCard && defCard) {
          const termPosition = assignPosition('term');
          const defPosition = assignPosition('definition');
          
          const newTermCard = { 
            ...termCard, 
            isVisible: true, 
            position: termPosition,
            opacity: new Animated.Value(0),
            scale: new Animated.Value(0.8)
          };
          
          const newDefCard = { 
            ...defCard, 
            isVisible: true, 
            position: defPosition,
            opacity: new Animated.Value(0),
            scale: new Animated.Value(0.8)
          };
          
          newVisibleCards.push(newTermCard, newDefCard);
          selectedMatchIds.add(matchId);
          break;
        }
      }
    }
    
    if (newVisibleCards.length > 0) {
      setVisibleCards(prev => {
        const existingCards = prev.filter(card => !card.isMatched);
        return [...existingCards, ...newVisibleCards];
      });
      
      setAllCards(prev => {
        const newCardIds = new Set(newVisibleCards.map(c => c.id));
        return prev.map(card => 
          newCardIds.has(card.id) ? 
            { ...card, isVisible: true, position: newVisibleCards.find(n => n.id === card.id)?.position } 
            : card
        );
      });
      
      newVisibleCards.forEach(card => {
        if (card.opacity && card.scale) {
          Animated.parallel([
            Animated.timing(card.opacity, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(card.scale, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            })
          ]).start();
        }
      });
    }
  }, [allCards, assignPosition]);

  const handleCardPress = useCallback((card: MatchCard) => {
    if (card.isMatched || animatingCards.has(card.id)) return;
    
    if (!selectedCard) {
      setSelectedCard(card);
      setVisibleCards(prev =>
        prev.map(c => c.id === card.id ? { ...c, isSelected: true } : c)
      );
      setAllCards(prev =>
        prev.map(c => c.id === card.id ? { ...c, isSelected: true } : c)
      );
      return;
    }
    
    if (selectedCard.type === card.type) {
      setVisibleCards(prev =>
        prev.map(c =>
          c.id === selectedCard.id ? { ...c, isSelected: false } :
          c.id === card.id ? { ...c, isSelected: true } : c
        )
      );
      setAllCards(prev =>
        prev.map(c =>
          c.id === selectedCard.id ? { ...c, isSelected: false } :
          c.id === card.id ? { ...c, isSelected: true } : c
        )
      );
      setSelectedCard(card);
      return;
    }
    
    setTotalMoves(prev => prev + 1);
    
    const matchedCardIds = [card.id, selectedCard.id];
    const isMatch = selectedCard.matchId === card.matchId;
    
    // Capturamos posiciones de las cartas coincidentes
    const matchedPositions: { term: number; definition: number } = { term: 0, definition: 0 };
    visibleCards.forEach(c => {
      if (matchedCardIds.includes(c.id) && c.position !== undefined) {
        matchedPositions[c.type] = c.position;
      }
    });
    
    if (isMatch) {
      // Incrementar score y actualizar progress bar
      setScore(prev => prev + 1);
      const newMatchedCount = matchedCount + 2;
      const matchedRatio = newMatchedCount / totalInitialCards.current;
      Animated.timing(progress, {
        toValue: matchedRatio,
        duration: 300,
        useNativeDriver: false,
      }).start();
      
      // Iniciar animaciones de desaparición en paralelo
      const matchedCards = visibleCards.filter(c => matchedCardIds.includes(c.id));
      matchedCards.forEach(card => {
        if (!card.opacity) card.opacity = new Animated.Value(1);
        if (!card.scale) card.scale = new Animated.Value(1);
        Animated.parallel([
          Animated.timing(card.opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(card.scale, {
            toValue: 0.5,
            duration: 300,
            useNativeDriver: true,
          })
        ]).start(() => {
          setAnimatingCards(prev => {
            const next = new Set(prev);
            next.delete(card.id);
            return next;
          });
        });
      });
      
      // Actualizar inmediatamente el estado para marcar las cartas como emparejadas
      setVisibleCards(prev => prev.filter(c => !matchedCardIds.includes(c.id)));
      setAllCards(prev =>
        prev.map(c =>
          matchedCardIds.includes(c.id)
          ? { ...c, isMatched: true, isSelected: false, isVisible: false }
          : c
        )
      );
      
      // Liberar posiciones de las cartas emparejadas
      matchedCards.forEach(card => {
        if (card.position !== undefined) {
          releasePosition(card.type, card.position);
        }
      });
      
      // Agregar la nueva pareja inmediatamente
      addNewCardPair();
      
      setSelectedCard(null);
    } else {
      // Manejo de emparejamiento incorrecto
      setVisibleCards(prev =>
        prev.map(c =>
          (c.id === card.id || c.id === selectedCard.id)
          ? { ...c, isSelected: true, isIncorrect: true }
          : c
        )
      );
      
      setAllCards(prev =>
        prev.map(c =>
          (c.id === card.id || c.id === selectedCard.id)
          ? { ...c, isSelected: true, isIncorrect: true }
          : c
        )
      );
      
      setTimeout(() => {
        setVisibleCards(prev =>
          prev.map(c =>
            (c.id === card.id || c.id === selectedCard.id)
            ? { ...c, isSelected: false, isIncorrect: false }
            : c
          )
        );
        
        setAllCards(prev =>
          prev.map(c =>
            (c.id === card.id || c.id === selectedCard.id)
            ? { ...c, isSelected: false, isIncorrect: false }
            : c
          )
        );
      }, 800);
    }
    
    setSelectedCard(null);
  }, [selectedCard, matchedCount, allCards, visibleCards, releasePosition, addNewCardPair, animatingCards, progress]);

  const formatTime = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  const restartGame = useCallback(() => {
    isProcessingMatch.current = false;
    
    availablePositions.current = {
      term: Array.from({ length: MAX_VISIBLE_PAIRS }, (_, i) => i),
      definition: Array.from({ length: MAX_VISIBLE_PAIRS }, (_, i) => i)
    };
    
    progress.setValue(0);
    setScore(0);
    setTotalMoves(0);
    setSelectedCard(null);
    setTimeElapsed(0);
    setUsedMatchIds(new Set());
    
    const resetCards = fisherYatesShuffle(
      allCards.map(card => ({
        ...card,
        isMatched: false,
        isSelected: false,
        isIncorrect: false,
        isVisible: false,
        position: undefined
      }))
    );
    
    setAllCards(resetCards);
    setVisibleCards([]);
    selectInitialVisibleCards(resetCards);
  }, [allCards, progress]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Revolviendo cartas...</Text>
      </View>
    );
  }

  if (allMatched) {
    return (
      <View style={styles.container}>
        <View style={styles.successContainer}>
          <Text style={styles.resultTitle}>¡Excelente trabajo!</Text>
          <Text style={styles.resultScore}>Tu tiempo</Text>
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreText}>{formatTime(timeElapsed)}</Text>
          </View>
          <TouchableOpacity style={styles.button} onPress={restartGame}>
            <Text style={styles.buttonText}>Jugar de nuevo</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, styles.buttonSecondary]}
            onPress={() => router.back()}
          >
            <Text style={[styles.buttonText, styles.buttonTextSecondary]}>Practicar con el modo aprender</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>

        <View style={styles.progressBar}>
          <Animated.View 
            style={[styles.progressFill, 
              { width: progress.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%']
              }) }
            ]}
          />
        </View>
        <Text style={styles.timerText}>{formatTime(timeElapsed)}</Text>
      </View>

      <Text style={styles.instructionText}>Toque los pares que coincidan</Text>

      <View style={styles.gameContainer}>
        <View style={styles.column}>
          {termCards.map((card) => (
            <View key={card.id} style={styles.cardWrapper}>
              <Animated.View
                style={[
                  styles.card,
                  card.isSelected && styles.cardSelected,
                  card.isMatched && styles.cardMatched,
                  card.isIncorrect && styles.cardIncorrect,
                  {
                    opacity: card.opacity || 1,
                    transform: [{ scale: card.scale || 1 }]
                  }
                ]}
              >
                <TouchableOpacity 
                  style={{
                    width: '100%',
                    height: '100%',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                  onPress={() => handleCardPress(card)}
                  disabled={card.isMatched}
                >
                  <Text style={styles.cardText}>{card.content}</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          ))}
        </View>

        <View style={styles.column}>
          {definitionCards.map((card) => (
            <View key={card.id} style={styles.cardWrapper}>
              <Animated.View
                style={[
                  styles.card,
                  card.isSelected && styles.cardSelected,
                  card.isMatched && styles.cardMatched,
                  card.isIncorrect && styles.cardIncorrect,
                  {
                    opacity: card.opacity || 1,
                    transform: [{ scale: card.scale || 1 }]
                  }
                ]}
              >
                <TouchableOpacity 
                  style={{
                    width: '100%',
                    height: '100%',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                  onPress={() => handleCardPress(card)}
                  disabled={card.isMatched}
                >
                  <Text style={styles.cardText}>{card.content}</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131f24',
    padding: 20,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: -40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#131f24',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: FONTS.title,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  closeButton: {
    padding: 10,
    marginRight: 15,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: FONTS.title,
  },
  progressBar: {
    flex: 1,
    height: 12,
    backgroundColor: '#202f36',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#58CC02',
    borderRadius: 6,
  },
  timerText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: FONTS.title,
    marginLeft: 15,
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: FONTS.title,
    textAlign: 'left',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  gameContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  column: {
    flex: 1,
    marginHorizontal: 8,
  },
  cardWrapper: {
    minHeight: 80,
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#202f36',
    borderRadius: 14,
    padding: 16,
    borderWidth: 2,
    borderColor: '#37464f',
    minHeight: 80,
    justifyContent: 'center',
    transform: [{scale: 1}],
  },
  cardSelected: {
    borderColor: '#1CB0F6',
    backgroundColor: '#1a3c4a',
  },
  cardMatched: {
    backgroundColor: '#1a3c4a',
    borderColor: '#58CC02',
    borderWidth: 2,
  },
  cardIncorrect: {
    borderColor: '#FF4B4B',
    borderWidth: 2,
  },
  cardText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: FONTS.body,
    textAlign: 'center',
  },
  resultTitle: {
    color: '#FFFFFF',
    fontSize: 32,
    fontFamily: FONTS.title,
    textAlign: 'center',
    marginBottom: 10,
  },
  resultScore: {
    color: '#8E8E93',
    fontSize: 18,
    fontFamily: FONTS.body,
    textAlign: 'center',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#4A90E2',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginVertical: 10,
    width: '80%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: FONTS.title,
    textAlign: 'center',
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#1CB0F6',
  },
  buttonTextSecondary: {
    color: '#1CB0F6',
  },
  scoreCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#202f36',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 40,
    borderWidth: 2,
    borderColor: '#37464f',
  },
  scoreText: {
    color: '#FFFFFF',
    fontSize: 48,
    fontFamily: FONTS.title,
  }
});