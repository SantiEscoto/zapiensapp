import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { View, ScrollView, Text, TouchableOpacity, StyleSheet, Alert, Animated, PanResponder, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../src/services/supabase';
import { useFonts } from 'expo-font';
import { FONTS } from '../../src/services/fonts';
import { updateUserXP } from '../../src/services/xpService';

const { width } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.25;

interface Flashcard {
  id: string;
  front_content: string;
  back_content: string;
  remembered?: boolean;
}

interface Collection {
  id: string;
  name: string;
  language: string;
}

export default function FlashcardScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { id } = params;
  const [collection, setCollection] = useState<Collection | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [remainingCards, setRemainingCards] = useState<number>(0);
  const [rememberedCount, setRememberedCount] = useState<number>(0);

  // Animations
  const progress = useRef(new Animated.Value(0)).current;
  const flipAnimation = useRef(new Animated.Value(0)).current;
  const swipeAnimation = useRef(new Animated.Value(0)).current;
  const nextCardOpacity = useRef(new Animated.Value(0)).current;
  const nextCardScale = useRef(new Animated.Value(0.9)).current;

  const [loaded] = useFonts({
    [FONTS.bold]: require('../../assets/fonts/DINNextRoundedLTPro-Bold.otf'),
    [FONTS.regular]: require('../../assets/fonts/DINNextRoundedLTPro-Regular.otf'),
  });

  const fetchCollection = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const [collectionResponse, cardsResponse] = await Promise.all([
        supabase.from('collections').select('*').eq('id', id).single(),
        supabase.from('cards').select('*').eq('collection_id', id)
      ]);

      if (collectionResponse.error) throw collectionResponse.error;
      if (!collectionResponse.data) throw new Error('Collection not found');
      if (cardsResponse.error) throw cardsResponse.error;

      // Initialize cards with remembered status
      const initializedCards = cardsResponse.data.map(card => ({
        ...card,
        remembered: false
      }));

      setCollection(collectionResponse.data);
      setCards(initializedCards);
      setRemainingCards(initializedCards.length);
    } catch (error: any) {
      console.error('Error fetching collection:', error?.message);
      Alert.alert('Error', 'Failed to load flashcards');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    if (id) fetchCollection();
  }, [id, fetchCollection]);

  // Find next unremembered card
  const findNextUnrememberedCard = useCallback(() => {
    // Start from current position and loop through cards
    let nextIndex = currentIndex;
    let looped = false;
    
    // First try to find a card after the current one
    while (true) {
      nextIndex = (nextIndex + 1) % cards.length;
      
      // If we've gone full circle and back to where we started
      if (nextIndex === 0) {
        if (looped) {
          // We've gone through all cards twice, none are unremembered
          return -1;
        }
        looped = true;
      }
      
      // If we've looped back to current position, all cards are remembered
      if (nextIndex === currentIndex && looped) {
        return -1;
      }
      
      // Found an unremembered card
      if (!cards[nextIndex].remembered) {
        return nextIndex;
      }
    }
  }, [currentIndex, cards]);

  const updateProgressBar = useCallback(() => {
    const totalCards = cards.length;
    const progressValue = (totalCards - remainingCards) / totalCards;
    
    Animated.timing(progress, {
      toValue: progressValue,
      duration: 300,
      useNativeDriver: false
    }).start();
  }, [remainingCards, cards.length, progress]);

  const flipCard = useCallback(() => {
    setIsFlipped(prev => !prev);
    Animated.spring(flipAnimation, {
      toValue: isFlipped ? 0 : 1,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
  }, [isFlipped, flipAnimation]);

  const handleSwipe = useCallback((remembered: boolean) => {
    const direction = remembered ? 1 : -1;
    
    if (remembered) {
      // Mark current card as remembered
      setCards(prevCards => {
        const updatedCards = [...prevCards];
        updatedCards[currentIndex].remembered = true;
        return updatedCards;
      });
      
      // Update remembered count and remaining cards
      setRememberedCount(prevCount => prevCount + 1);
      setRemainingCards(prevCount => prevCount - 1);
      
      // Update progress bar
      const totalCards = cards.length;
      const newRemainingCards = remainingCards - 1;
      const progressValue = (totalCards - newRemainingCards) / totalCards;
      
      Animated.timing(progress, {
        toValue: progressValue,
        duration: 300,
        useNativeDriver: false
      }).start();
    }
    
    Animated.parallel([
      Animated.timing(swipeAnimation, {
        toValue: direction * width,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(nextCardOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(() => {
      // Remove redundant progress bar update
      
      const nextCardIndex = findNextUnrememberedCard();
      
      // Reset animations
      swipeAnimation.setValue(0);
      flipAnimation.setValue(0);
      nextCardOpacity.setValue(0);
      setIsFlipped(false);
      
      if (nextCardIndex === -1) {
        // All cards remembered - award XP
        (async () => {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              await updateUserXP(user.id, 10);
              Alert.alert('¡Felicidades!', 'Has recordado todas las tarjetas y ganado +10 XP', [
                { text: 'Volver', onPress: () => router.back() }
              ]);
            }
          } catch (error) {
            console.error('Error awarding XP:', error);
            Alert.alert('¡Felicidades!', 'Has recordado todas las tarjetas', [
              { text: 'Volver', onPress: () => router.back() }
            ]);
          }
        })();
      } else {
        // Move to next unremembered card
        setCurrentIndex(nextCardIndex);
      }
    });
  }, [
    currentIndex, 
    width, 
    swipeAnimation, 
    flipAnimation, 
    nextCardOpacity, 
    updateProgressBar, 
    findNextUnrememberedCard,
    router
  ]);

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, { dx }) => {
      swipeAnimation.setValue(dx);
    },
    onPanResponderRelease: (_, { dx }) => {
      if (Math.abs(dx) >= SWIPE_THRESHOLD) {
        handleSwipe(dx > 0);
      } else {
        Animated.spring(swipeAnimation, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    },
  }), [swipeAnimation, handleSwipe]);

  // Memoized animated styles
  const frontAnimatedStyle = useMemo(() => ({
    transform: [
      { translateX: swipeAnimation },
      {
        rotateY: flipAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '180deg'],
        }),
      },
    ] as const
  }), [swipeAnimation, flipAnimation]);

  const backAnimatedStyle = useMemo(() => ({
    transform: [
      { translateX: swipeAnimation },
      {
        rotateY: flipAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: ['180deg', '360deg'],
        }),
      },
    ] as const
  }), [swipeAnimation, flipAnimation]);

  const frontOpacity = useMemo(() => ({
    opacity: flipAnimation.interpolate({
      inputRange: [0, 0.5, 0.5, 1],
      outputRange: [1, 1, 0, 0]
    })
  }), [flipAnimation]);

  const backOpacity = useMemo(() => ({
    opacity: flipAnimation.interpolate({
      inputRange: [0, 0.5, 0.5, 1],
      outputRange: [0, 0, 1, 1]
    })
  }), [flipAnimation]);

  const progressWidth = useMemo(() => ({
    width: progress.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%']
    })
  }), [progress]);

  const restartGame = useCallback(() => {
    // Reset all cards to unremembered state
    setCards(prevCards => prevCards.map(card => ({ ...card, remembered: false })));
    setCurrentIndex(0);
    setIsFlipped(false);
    setRemainingCards(cards.length);
    setRememberedCount(0);
    progress.setValue(0);
    swipeAnimation.setValue(0);
    flipAnimation.setValue(0);
    nextCardOpacity.setValue(0);
  }, [cards, progress, swipeAnimation, flipAnimation, nextCardOpacity]);

  if (!loaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading flashcards...</Text>
      </View>
    );
  }

  if (remainingCards === 0) {
    return (
      <ScrollView style={styles.container}>
        <Text style={styles.resultTitle}>¡Estás aprendiendo!</Text>
        <Text style={styles.resultScore}>
          Tus resultados
        </Text>
        <View style={styles.scoreCircle}>
          <Text style={styles.scoreText}>{Math.round((rememberedCount / cards.length) * 100)}%</Text>
          <Text style={styles.scoreSubtext}>{rememberedCount} de {cards.length} recordadas</Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={restartGame}>
          <Text style={styles.buttonText}>Haz una nueva prueba</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.buttonSecondary]}
          onPress={() => router.push({
            pathname: '/(subtabs)/lessons',
            params: { id }
          })}
        >
          <Text style={[styles.buttonText, styles.buttonTextSecondary]}>Practicar con el modo aprender</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // Find next unremembered card for preview (if one exists)
  const currentCard = cards[currentIndex];
  let nextCardIndex = -1;
  let nextUnrememberedIndex = currentIndex;
  
  // Look for the next unremembered card after current
  for (let i = 1; i < cards.length; i++) {
    const idx = (currentIndex + i) % cards.length;
    if (!cards[idx].remembered) {
      nextCardIndex = idx;
      break;
    }
  }

  const hasNextCard = nextCardIndex !== -1;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
        
        <View style={styles.progressBar}>
          <Animated.View style={[styles.progressFill, progressWidth]} />
        </View>
        
        <Text style={styles.progress}>
          {remainingCards} restantes
        </Text>
      </View>

      <View style={styles.cardContainer}>
        {hasNextCard && !isFlipped && (
          <Animated.View 
            style={[styles.card, styles.nextCard, { 
              transform: [{ scale: nextCardScale }],
              opacity: nextCardOpacity
            }]}
          >
            <Text style={styles.cardText}>{cards[nextCardIndex].front_content}</Text>
          </Animated.View>
        )}
        
        <Animated.View
          {...panResponder.panHandlers}
          style={[styles.card, styles.currentCard, frontAnimatedStyle, frontOpacity]}
        >
          <TouchableOpacity onPress={flipCard} style={styles.cardContent}>
            <Text style={styles.cardText}>{currentCard.front_content}</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          style={[styles.card, styles.currentCard, styles.cardBack, backAnimatedStyle, backOpacity]}
        >
          <TouchableOpacity onPress={flipCard} style={styles.cardContent}>
            <Text style={styles.cardText}>{currentCard.back_content}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.buttonNo]} 
          onPress={() => handleSwipe(false)}
        >
          <Text style={styles.buttonText}>No lo recuerdo</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.button, styles.buttonYes]} 
          onPress={() => handleSwipe(true)}
        >
          <Text style={styles.buttonText}>Lo recuerdo</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131f24',
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
    fontFamily: FONTS.bold,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  closeButton: {
    padding: 10,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: FONTS.bold,
  },
  progress: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: FONTS.bold,
  },
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    position: 'absolute',
    width: width - 40,
    height: 400,
    backgroundColor: '#202f36',
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: '#37464f',
  },
  nextCard: {
    backgroundColor: '#202f36',
    transform: [{ scale: 0.9 }],
    zIndex: 1,
    elevation: 1,
  },
  currentCard: {
    zIndex: 2,
    backfaceVisibility: 'hidden',
  },
  cardBack: {
    backgroundColor: '#202f36',
  },
  cardContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: FONTS.bold,
    textAlign: 'center',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 40,
  },
  button: {
    backgroundColor: '#1CB0F6',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#1CB0F6',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
  buttonTextSecondary: {
    color: '#1CB0F6',
  },
  buttonNo: {
    backgroundColor: '#FF4B4B',
    flex: 1,
    marginRight: 6,
  },
  buttonYes: {
    backgroundColor: '#58CC02',
    flex: 1,
    marginLeft: 6,
  },

  progressBar: {
    flex: 1,
    height: 12,
    backgroundColor: '#202f36',
    borderRadius: 6,
    overflow: 'hidden',
    marginHorizontal: 15
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#58CC02',
    borderRadius: 6,
  },
  completionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 60
  },
  resultTitle: {
    color: '#FFFFFF',
    fontSize: 32,
    fontFamily: FONTS.bold,
    textAlign: 'center',
    marginTop: 60,
    marginBottom: 10
  },
  resultScore: {
    color: '#8E8E93',
    fontSize: 18,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    marginBottom: 30
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
    borderColor: '#37464f'
  },
  scoreText: {
    color: '#FFFFFF',
    fontSize: 48,
    fontFamily: FONTS.bold
  },
  scoreSubtext: {
    color: '#8E8E93',
    fontSize: 16,
    fontFamily: FONTS.regular
  },
 
  reviewContainer: {
    backgroundColor: '#202f36',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#37464f',
  },
  reviewTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: FONTS.bold,
    marginBottom: 16,
  },
  reviewItem: {
    marginBottom: 16,
  },
  reviewAnswer: {
    backgroundColor: '#37464f',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  reviewAnswerCorrect: {
    backgroundColor: '#1a4625',
    borderColor: '#58CC02',
    borderWidth: 1,
  },
  reviewAnswerIncorrect: {
    backgroundColor: '#4b1818',
    borderColor: '#ff4b4b',
    borderWidth: 1,
  },
  reviewLabel: {
    color: '#8E8E93',
    fontSize: 14,
    fontFamily: FONTS.regular,
    marginBottom: 4,
  },
  reviewText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: FONTS.regular,
  }
});