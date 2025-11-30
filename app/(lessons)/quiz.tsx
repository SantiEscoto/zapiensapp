import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Animated, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../src/services/supabase';
import { useFonts } from 'expo-font';
import { FONTS } from '../../src/services/fonts';
import { updateUserXP } from '../../src/services/xpService';

// Interfaces for data structures
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

interface QuizQuestion {
  question: string;
  correctAnswer: string;
  options: string[];
}

interface QuestionResult {
  question: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

export default function QuizScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { id } = params;
  const progress = useRef(new Animated.Value(0)).current;

  // State management
  const [collection, setCollection] = useState<Collection | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(true);
  const [questionResults, setQuestionResults] = useState<QuestionResult[]>([]);

  // Load custom fonts
  const [loaded] = useFonts({
    [FONTS.bold]: require('../../assets/fonts/DINNextRoundedLTPro-Bold.otf'),
    [FONTS.regular]: require('../../assets/fonts/DINNextRoundedLTPro-Regular.otf'),
  });

  // Memoized shuffle function for better performance
  const shuffle = useCallback((array: any[]) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }, []);

  // Prepare questions from flashcards
  const prepareQuestions = useCallback((cards: Flashcard[]) => {
    if (!cards.length) return [];
    
    return cards.map(card => {
      const otherAnswers = cards
        .filter(c => c.id !== card.id)
        .map(c => c.back)
        .slice(0, 3);

      return {
        question: card.front,
        correctAnswer: card.back,
        options: shuffle([...otherAnswers, card.back]),
      };
    });
  }, [shuffle]);

  // Fetch collection and cards data
  const fetchCollection = useCallback(async () => {
    if (!id) return;
    
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

      setCollection(collectionResponse.data);
      
      const cards = cardsResponse.data.map(card => ({
        id: card.id,
        front: card.front_content,
        back: card.back_content,
      }));
      
      setFlashcards(cards);
      setQuestions(prepareQuestions(cards));
    } catch (error: any) {
      console.error('Error fetching collection:', error?.message);
      Alert.alert('Error', 'Failed to load quiz');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id, router, prepareQuestions]);

  useEffect(() => {
    fetchCollection();
  }, [fetchCollection]);

  const handleAnswer = useCallback((selectedAnswer: string) => {
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    
    setQuestionResults(prev => [...prev, {
      question: currentQuestion.question,
      userAnswer: selectedAnswer,
      correctAnswer: currentQuestion.correctAnswer,
      isCorrect
    }]);

    if (isCorrect) {
      setScore(prev => prev + 1);
    }

    Animated.timing(progress, {
      toValue: currentQuestionIndex + 1,
      duration: 300,
      useNativeDriver: false
    }).start(({ finished }) => {
      if (finished) {
        if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
        } else {
          // Quiz completed - award XP
          (async () => {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                await updateUserXP(user.id, 10);
              }
            } catch (error) {
              console.error('Error awarding XP:', error);
            }
          })();
          setShowResults(true);
        }
      }
    });
  }, [currentQuestionIndex, progress, questions]);

  const restartQuiz = useCallback(() => {
    progress.setValue(0);
    setCurrentQuestionIndex(0);
    setScore(0);
    setShowResults(false);
    setQuestionResults([]);
    setQuestions(prepareQuestions(flashcards));
  }, [flashcards, prepareQuestions, progress]);

  const scorePercentage = useMemo(() => 
    Math.round((score / (questions.length || 1)) * 100), 
    [score, questions.length]
  );

  const currentQuestion = questions[currentQuestionIndex];

  // Render results screen
  if (showResults) {
    return (
      <ScrollView style={styles.container}>
        <Text style={styles.resultTitle}>¡Estás aprendiendo!</Text>
        <Text style={styles.scoreSubtext}>{score} de {questions.length} correctas</Text>

        <View style={styles.reviewContainer}>
          <Text style={styles.reviewTitle}>Revisión de respuestas</Text>
          <ScrollView>
          {questionResults.map((result, index) => (
            <View key={index} style={styles.reviewItem}>
              <Text style={styles.reviewQuestion}>{index + 1}. {result.question}</Text>
              <View style={styles.answersRow}>
                <View style={[
                  styles.reviewAnswer, 
                  !result.isCorrect && styles.reviewAnswerIncorrect, 
                  styles.reviewAnswerHalf
                ]}>
                  <Text style={styles.reviewLabel}>Tu respuesta:</Text>
                  <Text style={styles.reviewText}>{result.userAnswer}</Text>
                </View>
                {!result.isCorrect && (
                  <View style={[styles.reviewAnswer, styles.reviewAnswerCorrect, styles.reviewAnswerHalf]}>
                    <Text style={styles.reviewLabel}>Respuesta correcta:</Text>
                    <Text style={styles.reviewText}>{result.correctAnswer}</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
          </ScrollView>
        </View>

        <TouchableOpacity style={styles.button} onPress={restartQuiz}>
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

  // Render loading screen
  if (!loaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading quiz...</Text>
      </View>
    );
  }

  // Render quiz screen
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
            style={[
              styles.progressFill, 
              { 
                width: progress.interpolate({
                  inputRange: [0, questions.length],
                  outputRange: ['0%', '100%']
                }) 
              }
            ]}
          />
        </View>
      </View>

      {currentQuestion && (
        <View>
          <View style={styles.questionContainer}>
            <Text style={styles.questionText}>{currentQuestion.question}</Text>
          </View>

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
    fontFamily: FONTS.bold,
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
  questionContainer: {
    backgroundColor: '#202f36',
    borderRadius: 14,
    padding: 30,
    marginBottom: 30,
    borderWidth: 2,
    borderColor: '#37464f',
    minHeight: 160,
    justifyContent: 'center',
  },
  reviewTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: FONTS.bold,
    marginBottom: 16,
  },
  reviewItem: {
    marginBottom: 20,
  },
  reviewQuestion: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: FONTS.bold,
    marginBottom: 8,
  },
  reviewAnswer: {
    backgroundColor: '#37464f',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  reviewAnswerIncorrect: {
    backgroundColor: '#4b1818',
    borderColor: '#ff4b4b',
    borderWidth: 1,
  },
  reviewAnswerCorrect: {
    backgroundColor: '#1a4625',
    borderColor: '#58CC02',
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
  },
  questionText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: FONTS.bold,
    textAlign: 'center',
  },
  optionsContainer: {
    marginTop: 20,
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
    textAlign: 'center',
  },
  resultTitle: {
    color: '#FFFFFF',
    fontSize: 32,
    fontFamily: FONTS.bold,
    textAlign: 'center',
    marginTop: 60,
    marginBottom: 10,
  },
  resultScore: {
    color: '#8E8E93',
    fontSize: 18,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    marginBottom: 30,
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
    fontFamily: FONTS.bold,
  },
  scoreSubtext: {
    color: '#8E8E93',
    fontSize: 16,
    fontFamily: 'DINNextRoundedLTPro-Regular',
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
  reviewContainer: {
    backgroundColor: '#202f36',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#37464f',
    maxHeight: 300,
  },
  answersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    width: '100%'
  },
  reviewAnswerHalf: {
    flex: 1
  }
});