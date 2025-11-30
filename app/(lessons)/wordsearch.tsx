import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FONTS } from '../../src/services/fonts';
import { supabase } from '../../src/services/supabase';
import { AntDesign } from '@expo/vector-icons';
import { updateUserXP } from '../../src/services/xpService';

interface Flashcard {
  id: string;
  front_content: string;
  back_content: string;
}

const WordSearch: React.FC = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);

  // Add back button at the top of the component
  const BackButton = () => (
    <TouchableOpacity 
      style={styles.backButton} 
      onPress={() => router.push({
        pathname: '/(subtabs)/lessons',
        params: { id }
      })}
    >
      <AntDesign name="arrowleft" size={24} color="#FFFFFF" />
    </TouchableOpacity>
  );

  useEffect(() => {
    if (id) fetchFlashcards();
  }, [id]);

  useEffect(() => {
    if (!loading && flashcards.length > 0) {
      generateGrid();
    }
  }, [loading, flashcards]);

  const fetchFlashcards = async () => {
    try {
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .eq('collection_id', id);

      if (error) throw error;
      if (data) setFlashcards(data);
    } catch (error: any) {
      console.error('Error fetching flashcards:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const questions = flashcards.map(card => ({
    question: card.front_content,
    answer: card.back_content.toUpperCase()
  }));
  const GRID_SIZE = 8;
  const [grid, setGrid] = useState<string[][]>([]);
  const [foundWords, setFoundWords] = useState<Set<string>>(new Set());
  const [selection, setSelection] = useState<{ row: number; col: number }[]>([]);
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [showResults, setShowResults] = useState(false);
  // New state variables for visual feedback
  const [currentSelection, setCurrentSelection] = useState<Set<string>>(new Set());
  const [incorrectSelection, setIncorrectSelection] = useState<boolean>(false);
  const incorrectAnimTimeout = useRef<NodeJS.Timeout | null>(null);

  const directions = [
    [0, 1],   // right
    [1, 0],   // down
    [1, 1],   // diagonal down-right
    [-1, 1],  // diagonal up-right
  ];

  const generateGrid = () => {
    // Initialize empty grid
    const newGrid = Array(GRID_SIZE).fill(null).map(() =>
      Array(GRID_SIZE).fill('')
    );

    // Place each word
    questions.forEach(({ answer }) => {
      let placed = false;
      while (!placed) {
        const direction = directions[Math.floor(Math.random() * directions.length)];
        const word = answer.toUpperCase();
        const startRow = Math.floor(Math.random() * GRID_SIZE);
        const startCol = Math.floor(Math.random() * GRID_SIZE);

        if (canPlaceWord(newGrid, word, startRow, startCol, direction)) {
          placeWord(newGrid, word, startRow, startCol, direction);
          placed = true;
        }
      }
    });

    // Fill remaining spaces with random letters
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        if (newGrid[i][j] === '') {
          newGrid[i][j] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
        }
      }
    }

    setGrid(newGrid);
  };

  const canPlaceWord = (grid: string[][], word: string, row: number, col: number, [dy, dx]: number[]) => {
    if (row + dy * (word.length - 1) >= GRID_SIZE || row + dy * (word.length - 1) < 0) return false;
    if (col + dx * (word.length - 1) >= GRID_SIZE || col + dx * (word.length - 1) < 0) return false;

    for (let i = 0; i < word.length; i++) {
      const currentRow = row + dy * i;
      const currentCol = col + dx * i;
      if (grid[currentRow][currentCol] !== '' && grid[currentRow][currentCol] !== word[i]) {
        return false;
      }
    }
    return true;
  };

  const placeWord = (grid: string[][], word: string, row: number, col: number, [dy, dx]: number[]) => {
    for (let i = 0; i < word.length; i++) {
      grid[row + dy * i][col + dx * i] = word[i];
    }
  };

  const handleCellPress = (row: number, col: number) => {
    const newSelection = [...selection];
    
    if (newSelection.length === 0) {
      // First letter selection - show circle
      newSelection.push({ row, col });
      // Clear any previous current selection
      setCurrentSelection(new Set([`${row}-${col}`]));
    } else if (newSelection.length === 1) {
      // Second letter selection - show line/rectangle
      newSelection.push({ row, col });
      
      // Add all cells in the selection path to currentSelection
      const selectionCells = getSelectionCells(newSelection[0], { row, col });
      setCurrentSelection(new Set(selectionCells));
      
      // Check if selection is correct
      checkSelection(newSelection);
      setSelection([]);
      return;
    }
    
    setSelection(newSelection);
  };

  // Helper function to get all cells in a selection path
  const getSelectionCells = (start: { row: number; col: number }, end: { row: number; col: number }): string[] => {
    const cells: string[] = [];
    const dx = Math.sign(end.col - start.col) || 0;
    const dy = Math.sign(end.row - start.row) || 0;
    let currentRow = start.row;
    let currentCol = start.col;
    
    while (
      currentRow >= 0 && currentRow < GRID_SIZE &&
      currentCol >= 0 && currentCol < GRID_SIZE &&
      (currentRow !== end.row + dy || currentCol !== end.col + dx)
    ) {
      cells.push(`${currentRow}-${currentCol}`);
      currentRow += dy;
      currentCol += dx;
    }
    
    return cells;
  };

  const checkSelection = (selection: { row: number; col: number }[]) => {
    const [start, end] = selection;
    const selectedWord = getSelectedWord(start, end);
    
    let wordFound = false;
    questions.forEach(({ answer }) => {
      if (answer.toUpperCase() === selectedWord && !foundWords.has(answer)) {
        setFoundWords(new Set([...foundWords, answer]));
        wordFound = true;
      }
    });

    if (wordFound) {
      // Correct selection - keep the cells highlighted in green
      const selectionCells = getSelectionCells(start, end);
      selectionCells.forEach(cell => {
        setSelectedCells(prev => new Set([...prev, cell]));
      });
      // Clear current selection
      setCurrentSelection(new Set());
    } else {
      // Incorrect selection - show red border temporarily
      setIncorrectSelection(true);
      
      // Clear the incorrect animation after a delay
      if (incorrectAnimTimeout.current) {
        clearTimeout(incorrectAnimTimeout.current);
      }
      
      incorrectAnimTimeout.current = setTimeout(() => {
        setIncorrectSelection(false);
        setCurrentSelection(new Set());
      }, 1000); // Show red border for 1 second
    }
  };

  const getSelectedWord = (start: { row: number; col: number }, end: { row: number; col: number }) => {
    const word: string[] = [];
    const dx = Math.sign(end.col - start.col) || 0; 
    const dy = Math.sign(end.row - start.row) || 0; 
    let currentRow = start.row;
    let currentCol = start.col;
    
    while (
      currentRow >= 0 && currentRow < GRID_SIZE &&
      currentCol >= 0 && currentCol < GRID_SIZE &&
      (currentRow !== end.row + dy || currentCol !== end.col + dx)
    ) {
      word.push(grid[currentRow][currentCol]);
      currentRow += dy;
      currentCol += dx;
    }
    
    return word.join('');
  };

  useEffect(() => {
    if (foundWords.size === questions.length && questions.length > 0) {
      // Award XP when all words are found
      const awardXP = async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await updateUserXP(user.id, 10);
          }
        } catch (error) {
          console.error('Error awarding XP:', error);
        }
      };
      
      awardXP();
      setShowResults(true);
    }
  }, [foundWords, questions]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (incorrectAnimTimeout.current) {
        clearTimeout(incorrectAnimTimeout.current);
      }
    };
  }, []);

  const restartGame = () => {
    setFoundWords(new Set());
    setSelectedCells(new Set());
    setCurrentSelection(new Set());
    setShowResults(false);
    generateGrid();
  };

  const scorePercentage = Math.round((foundWords.size / (questions.length || 1)) * 100);

  if (showResults) {
    return (
      <ScrollView style={[styles.container, { backgroundColor: '#131f24' }]}>
        <Text style={styles.resultTitle}>¡Estás aprendiendo!</Text>
      

        <TouchableOpacity style={styles.button} onPress={restartGame}>
          <Text style={styles.buttonText}>Jugar de nuevo</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.buttonSecondary]}
          onPress={() => router.push({
            pathname: '/(subtabs)/lessons',
            params: { id }
          })}
        >
          <Text style={[styles.buttonText, styles.buttonTextSecondary]}>Volver a lecciones</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: '#131f24' }]}>
      <BackButton />
      <View style={styles.gridContainer}>
        {grid.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((letter, colIndex) => {
              const cellKey = `${rowIndex}-${colIndex}`;
              const isSelected = selectedCells.has(cellKey);
              const isCurrentlySelected = currentSelection.has(cellKey);
              const isFirstSelected = selection.length === 1 && 
                selection[0].row === rowIndex && selection[0].col === colIndex;
              
              return (
                <TouchableOpacity
                  key={cellKey}
                  style={[
                    styles.cell,
                    // Permanent selection (correct words)
                    isSelected && styles.correctCell,
                    // Current selection path
                    isCurrentlySelected && styles.currentSelectionCell,
                    // Incorrect selection
                    isCurrentlySelected && incorrectSelection && styles.incorrectCell,
                    // First selected letter (circle)
                    isFirstSelected && styles.firstSelectedCell
                  ]}
                  onPress={() => handleCellPress(rowIndex, colIndex)}
                >
                  <Text style={styles.letter}>{letter}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      <View style={styles.questionsContainer}>
        <Text style={styles.questionsTitle}>Preguntas:</Text>
        <View style={styles.questionsGrid}>
          {questions.map((item, index) => (
            <View
              key={index}
              style={styles.questionItem}
            >
              <Text
                style={[
                  styles.question,
                  foundWords.has(item.answer) && styles.foundWord
                ]}
              >
                {index + 1}. {item.question}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  resultTitle: {
    color: '#FFFFFF',
    fontSize: 32,
    fontFamily: FONTS.bold,
    textAlign: 'center',
    marginTop: 60,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#1CB0F6',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    marginHorizontal: 20,
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
  container: {
    flex: 1,
    backgroundColor: '#131f24',
    padding: 20,
  },
  gridContainer: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 20,
    backgroundColor: '#202f36',
    borderRadius: 16,
    borderWidth: 2.5,
    borderColor: '#37464f',
    marginTop: 60, // Add space for back button
  },
  row: {
    flexDirection: 'row',
    marginVertical: 2,
  },
  cell: {
    width: 45,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#202f36',
    margin: 2,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent'
  },
  firstSelectedCell: {
    backgroundColor: '#37464f',
    borderColor: '#1CB0F6',
    transform: [{ scale: 1.05 }]
  },
  currentSelectionCell: {
    backgroundColor: '#37464f',
    borderColor: '#1CB0F6'
  },
  correctCell: {
    backgroundColor: '#37464f',
    borderColor: '#58CC02'
  },
  incorrectCell: {
    backgroundColor: '#37464f',
    borderColor: '#FF4B4B'
  },
  letter: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
  },
  questionsContainer: {
    padding: 20,
    backgroundColor: '#202f36',
    borderRadius: 16,
    marginTop: 20,
    borderWidth: 2.5,
    borderColor: '#37464f',
  },
  questionsTitle: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'left',
    paddingLeft: 10,
  },
  questionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  questionItem: {
    width: '48%',
    marginBottom: 15,
    padding: 12,
    backgroundColor: '#37464f',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#455a64',
  },
  question: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: '#FFFFFF',
    textAlign: 'left',
    lineHeight: 22,
  },
  foundWord: {
    color: '#1CB0F6',
    textDecorationLine: 'line-through',
    opacity: 0.8,
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 1,
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: '#202f36',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#37464f',
  },
});

export default WordSearch;