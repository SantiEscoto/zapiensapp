import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, Easing } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../src/services/supabase';
import { useFonts } from 'expo-font';
import { FONTS } from '../../src/services/fonts';
import { updateUserXP } from '../../src/services/xpService';
import { Portal, Modal } from 'react-native-paper';

const { width } = Dimensions.get('window');
const WHEEL_SIZE = width * 0.8;
const CENTER_BUTTON_SIZE = 80;
const SPIN_DURATION = 3000;
const ANSWER_TIME_LIMIT = 20;

// Colors array moved outside component to prevent recreation
const WHEEL_COLORS = [
  '#FF4B4B', '#58CC02', '#1CB0F6', '#A560E8',
  '#FF9600', '#4CBBA5', '#FF7474', '#4B88FF'
];

interface Collection {
  id: string;
  name: string;
  language: string;
}

interface Flashcard {
  id: string;
  front: string;
  back: string;
}

interface WheelSection {
  id: string;
  question: string;
  answer: string;
  options: string[];
  color: string;
  rotation: number;
  arcSize: number;
}

export default function SpinningScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { id } = params;
  const [collection, setCollection] = useState<Collection | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [remainingCards, setRemainingCards] = useState<Flashcard[]>([]);
  const [sections, setSections] = useState<WheelSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<WheelSection | null>(null);
  const [timeLeft, setTimeLeft] = useState(ANSWER_TIME_LIMIT);
  const [showQuestion, setShowQuestion] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const spinValue = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [loaded] = useFonts({
    [FONTS.bold]: require('../../assets/fonts/DINNextRoundedLTPro-Bold.otf'),
    [FONTS.regular]: require('../../assets/fonts/DINNextRoundedLTPro-Regular.otf'),
  });

  // Memoized shuffle function
  const shuffle = useCallback(<T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }, []);

  // Function to create wheel sections from cards
  const createWheelSections = useCallback((cards: Flashcard[], allCards: Flashcard[]) => {
    // Calculate arc size based on number of cards
    const arcSize = 360 / Math.max(cards.length, 1);

    // Create wheel sections with evenly distributed angles
    return cards.map((card, index) => {
      // Get other answers for options
      const otherAnswers = allCards
        .filter(c => c.id !== card.id)
        .map(c => c.back)
        .slice(0, 2);

      return {
        id: card.id,
        question: card.front,
        answer: card.back,
        options: shuffle([...otherAnswers, card.back]),
        color: WHEEL_COLORS[index % WHEEL_COLORS.length],
        rotation: index * arcSize,
        arcSize
      };
    });
  }, [shuffle]);

  const fetchCollection = useCallback(async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Parallel requests for better performance
      const [collectionResponse, cardsResponse] = await Promise.all([
        supabase.from('collections').select('*').eq('id', id).single(),
        supabase.from('cards').select('*').eq('collection_id', id)
      ]);

      if (collectionResponse.error) throw collectionResponse.error;
      if (!collectionResponse.data) throw new Error('Collection not found');
      if (cardsResponse.error) throw cardsResponse.error;

      setCollection(collectionResponse.data);

      const cards = cardsResponse.data.map(card => ({
        id: card.id,
        front: card.front_content,
        back: card.back_content,
      }));

      setFlashcards(cards);
      setRemainingCards(cards);

      // Create initial wheel sections
      const wheelSections = createWheelSections(cards, cards);
      setSections(wheelSections);
    } catch (error: any) {
      console.error('Error fetching collection:', error?.message);
      setNotificationMessage('Error: Failed to load spinning wheel');
      setShowNotification(true);
      setTimeout(() => {
        setShowNotification(false);
        router.back();
      }, 2000);
    } finally {
      setLoading(false);
    }
  }, [id, router, createWheelSections]);

  useEffect(() => {
    fetchCollection();

    // Cleanup function for timer
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [fetchCollection]);

  const spinWheel = useCallback(() => {
    if (isSpinning || sections.length === 0) return;

    setIsSpinning(true);
    const randomRotations = Math.floor(Math.random() * 360) + 1440; // At least 4 full rotations

    Animated.timing(spinValue, {
      toValue: randomRotations,
      duration: SPIN_DURATION,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true
    }).start(() => {
      // Inside spinWheel's .start() callback:
      const finalRotation = randomRotations % 360;
      const selectedSection = sections.find(section => {
        const sectionStart = section.rotation;
        const sectionEnd = section.rotation + section.arcSize;

        // Handle wrap-around case
        if (sectionEnd > 360) {
          return (
            finalRotation >= sectionStart ||
            finalRotation < sectionEnd % 360
          );
        }
        return finalRotation >= sectionStart && finalRotation < sectionEnd;
      });

      if (selectedSection) {
        setCurrentQuestion(selectedSection);
        setShowQuestion(true);
        setTimeLeft(ANSWER_TIME_LIMIT);
        startTimer();
      }
      setIsSpinning(false);
    });
  }, [isSpinning, sections, spinValue]);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleAnswer('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const handleAnswer = useCallback((selectedAnswer: string) => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (!currentQuestion) return;

    const isCorrect = selectedAnswer === currentQuestion.answer;

    if (isCorrect) {
      // Remove answered card from remaining cards
      setRemainingCards(prev => {
        const updatedCards = prev.filter(card => card.id !== currentQuestion.id);

        // Create new wheel sections with updated card distribution
        const newSections = createWheelSections(updatedCards, flashcards);
        setSections(newSections);

        return updatedCards;
      });

      setNotificationMessage('¡Correcto! Sigue así');
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 2000);
    } else {
      setNotificationMessage('Incorrecto. Inténtalo de nuevo');
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 2000);
    }

    setShowQuestion(false);
    setCurrentQuestion(null);
    spinValue.setValue(0);
  }, [currentQuestion, spinValue, createWheelSections, flashcards]);

  // Memoize spin button state
  const spinButtonDisabled = isSpinning || showQuestion;

  // Memoize wheel rotation style to prevent recalculations
  const wheelRotationStyle = useMemo(() => ({
    transform: [{
      rotate: spinValue.interpolate({
        inputRange: [0, 360],
        outputRange: ['0deg', '360deg']
      })
    }]
  }), [spinValue]);

  // Extract UI components for better organization and readability
  const renderWheelSection = useCallback((section: WheelSection) => {
    const startAngle = section.rotation;
    const endAngle = startAngle + section.arcSize;
    const radius = WHEEL_SIZE / 2;
    const centerX = radius;
    const centerY = radius;

    // Convert angles to radians
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    // Calculate points
    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);

    // Create SVG path
    const largeArcFlag = section.arcSize >= 180 ? 1 : 0;
    const path = section.arcSize === 360
      ? `
        M ${centerX} ${centerY}
        m -${radius}, 0
        a ${radius},${radius} 0 1,1 ${radius * 2},0
        a ${radius},${radius} 0 1,1 -${radius * 2},0
      `
      : `
        M ${centerX} ${centerY}
        L ${x1} ${y1}
        A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}
        Z
      `;

    return (
      <View
        key={section.id}
        style={styles.wheelSectionContainer}
      >
        <Svg width={WHEEL_SIZE} height={WHEEL_SIZE}>
          <Path
            d={path}
            fill={section.color}
            stroke="#000"
            strokeWidth={2}
          />
        </Svg>
      </View>
    );
  }, []);

  const navigateToLessons = useCallback(() => {
    router.push({
      pathname: '/(subtabs)/lessons',
      params: { id }
    });
  }, [router, id]);

  // Award XP when all questions are completed
  useEffect(() => {
    const awardXP = async () => {
      if (remainingCards.length === 0) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await updateUserXP(user.id, 10);
          }
        } catch (error) {
          console.error('Error awarding XP:', error);
        }
      }
    };
    awardXP();
  }, [remainingCards.length]);

  // Handle loading state
  if (!loaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading wheel...</Text>
      </View>
    );
  }

  // Handle completion state
  if (remainingCards.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.resultTitle}>¡Felicitaciones!</Text>
        <Text style={styles.resultText}>Has completado todas las preguntas</Text>
        <Text style={styles.xpText}>+10 XP</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={navigateToLessons}
        >
          <Text style={styles.buttonText}>Volver a lecciones</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.closeButton}
        onPress={navigateToLessons}
      >
        <Text style={styles.closeButtonText}>✕</Text>
      </TouchableOpacity>

      <View style={styles.wheelContainer}>
        <View style={styles.pointer} />
        <Animated.View
          style={[styles.wheel, wheelRotationStyle]}
        >
          {sections.map(renderWheelSection)}
        </Animated.View>

        <TouchableOpacity
          style={styles.spinButton}
          onPress={spinWheel}
          disabled={spinButtonDisabled}
        >
          <Text style={styles.spinButtonText}>SPIN</Text>
        </TouchableOpacity>
      </View>

      {showQuestion && currentQuestion && (
        <View style={styles.questionContainer}>
          <Text style={styles.timerText}>{timeLeft}s</Text>
          <Text style={styles.questionText}>{currentQuestion.question}</Text>
          <View style={styles.optionsContainer}>
            {currentQuestion.options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={styles.optionButton}
                onPress={() => handleAnswer(option)}
              >
                <Text style={styles.optionText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <Portal>
        <Modal
          visible={showNotification}
          onDismiss={() => setShowNotification(false)}
          contentContainerStyle={styles.notificationModal}
        >
          <Text style={styles.notificationText}>{notificationMessage}</Text>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131f24',
    padding: 20,
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
  closeButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    padding: 10,
    zIndex: 1,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: FONTS.bold,
  },
  wheelContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  wheel: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    borderRadius: WHEEL_SIZE / 2,
    backgroundColor: '#202f36',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 8,
    borderColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  wheelSectionContainer: {
    position: 'absolute',
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
  },
  spinButton: {
    position: 'absolute',
    width: CENTER_BUTTON_SIZE,
    height: CENTER_BUTTON_SIZE,
    borderRadius: CENTER_BUTTON_SIZE / 2,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    borderWidth: 3,
    borderColor: '#333',
  },
  spinButtonText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontFamily: FONTS.bold,
    letterSpacing: 1,
  },
  pointer: {
    position: 'absolute',
    top: -20,
    left: '50%',
    transform: [{ translateX: -15 }],
    width: 0,
    height: 0,
    borderLeftWidth: 15,
    borderRightWidth: 15,
    borderTopWidth: 30,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FF4B4B',
    zIndex: 2,
  },
  questionContainer: {
    backgroundColor: '#202f36',
    borderRadius: 14,
    padding: 20,
    marginTop: 20,
    borderWidth: 2,
    borderColor: '#37464f',
  },
  timerText: {
    color: '#8E8E93',
    fontSize: 16,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    marginBottom: 10,
  },
  questionText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: FONTS.bold,
    textAlign: 'center',
    marginBottom: 20,
  },
  optionsContainer: {
    gap: 10,
  },
  optionButton: {
    backgroundColor: '#202f36',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#37464f',
  },
  optionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  resultTitle: {
    color: '#FFFFFF',
    fontSize: 32,
    fontFamily: FONTS.bold,
    textAlign: 'center',
    marginTop: 60,
    marginBottom: 10,
  },
  resultText: {
    color: '#8E8E93',
    fontSize: 18,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    marginBottom: 30,
  },
  xpText: {
    color: '#58CC02',
    fontSize: 24,
    fontFamily: FONTS.bold,
    textAlign: 'center',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#1CB0F6',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
  notificationModal: {
    backgroundColor: '#202f36',
    padding: 20,
    margin: 20,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#37464f',
    alignItems: 'center',
  },
  notificationText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: FONTS.bold,
    textAlign: 'center',
  }
});