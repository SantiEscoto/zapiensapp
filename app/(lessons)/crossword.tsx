import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Animated } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../src/services/supabase';
import { FONTS } from '../../src/services/fonts';
import { AntDesign } from '@expo/vector-icons';
import { updateUserXP } from '../../src/services/xpService';

interface Flashcard {
  id: string;
  front_content: string;
  back_content: string;
}

interface Collection {
  id: string;
  name: string;
  language: string;
}

interface CrosswordCell {
  letter: string;
  row: number;
  col: number;
  wordIndex: number;
  direction: 'across' | 'down';
  number?: number;
  isStart?: boolean;
  isCorrect?: boolean;
  isIncorrect?: boolean;
  value?: string;
  wordIndices?: number[];
}

interface CrosswordWord {
  word: string;
  clue: string;
  startRow: number;
  startCol: number;
  direction: 'across' | 'down';
  number: number;
  isCompleted: boolean;
}

const CrosswordScreen: React.FC = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [grid, setGrid] = useState<CrosswordCell[][]>([]);
  const [words, setWords] = useState<CrosswordWord[]>([]);
  const [selectedCell, setSelectedCell] = useState<{row: number, col: number} | null>(null);
  const [completedWords, setCompletedWords] = useState<Set<number>>(new Set());
  const [showResults, setShowResults] = useState(false);
  const [gridSize, setGridSize] = useState(10);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Fetch data
  const fetchFlashcards = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const [collectionResponse, cardsResponse] = await Promise.all([
        supabase.from('collections').select('*').eq('id', id).single(),
        supabase.from('cards').select('*').eq('collection_id', id)
      ]);

      if (collectionResponse.error) throw collectionResponse.error;
      if (cardsResponse.error) throw cardsResponse.error;

      setCollection(collectionResponse.data);
      setFlashcards(cardsResponse.data);
    } catch (error: any) {
      console.error('Error fetching flashcards:', error?.message);
      Alert.alert('Error', 'Failed to load flashcards');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  // Crossword generation logic
  const generateCrossword = useCallback(() => {
    if (flashcards.length === 0) return;
    
    // Seleccionamos aleatoriamente 8 flashcards
    const selectedFlashcards = [...flashcards]
      .sort(() => Math.random() - 0.5) // Mezclamos el array
      .slice(0, 8); // Tomamos solo 8 elementos
    
    // Ajustamos el tamaño del grid basado en la longitud de las palabras
    const maxWordLength = Math.max(...selectedFlashcards.map(card => card.back_content.length));
    const newGridSize = Math.max(10, Math.ceil(maxWordLength * 2));
    setGridSize(newGridSize);
    
    // Initialize empty grid
    const tempGrid: CrosswordCell[][] = Array(newGridSize).fill(null).map(() =>
      Array(newGridSize).fill(null).map(() => ({
        letter: '',
        row: 0,
        col: 0,
        wordIndex: -1,
        direction: 'across',
        value: ''
      }))
    );
    
    const newWords: CrosswordWord[] = [];
    let wordNumber = 1;
    
    // Ordenamos las flashcards por longitud para mejor colocación
    const sortedFlashcards = [...selectedFlashcards].sort((a, b) => 
      b.back_content.length - a.back_content.length
    );
    
    // Colocamos la primera palabra en el centro
    const firstWord = sortedFlashcards[0].back_content.toUpperCase();
    const firstClue = sortedFlashcards[0].front_content;
    const startRow = Math.floor(newGridSize / 2);
    const startCol = Math.floor((newGridSize - firstWord.length) / 2);
    
    placeWordOnGrid(firstWord, firstClue, startRow, startCol, 'across', wordNumber++, tempGrid, 0, newWords);
    
    // Intentamos colocar las palabras restantes
    let attempts = 0;
    const maxAttempts = 100; // Número máximo de intentos para generar el crucigrama
    
    while (newWords.length < selectedFlashcards.length && attempts < maxAttempts) {
      attempts++;
      
      // Intentamos colocar cada palabra restante
      for (let i = 1; i < sortedFlashcards.length; i++) {
        if (newWords.some(w => w.word === sortedFlashcards[i].back_content.toUpperCase())) {
          continue; // La palabra ya está colocada
        }
        
        const word = sortedFlashcards[i].back_content.toUpperCase();
        const clue = sortedFlashcards[i].front_content;
        
        if (attemptWordPlacement(word, clue, tempGrid, newWords, wordNumber)) {
          wordNumber++;
        }
      }
      
      // Si no pudimos colocar todas las palabras, reiniciamos el grid
      if (newWords.length < selectedFlashcards.length) {
        // Reiniciamos el grid y empezamos de nuevo
        tempGrid.forEach(row => row.forEach(cell => {
          cell.letter = '';
          cell.value = '';
          cell.wordIndex = -1;
          cell.wordIndices = undefined;
          cell.direction = 'across';
          cell.isStart = false;
          cell.number = undefined;
        }));
        newWords.length = 0;
        wordNumber = 1;
        
        // Colocamos la primera palabra nuevamente
        placeWordOnGrid(firstWord, firstClue, startRow, startCol, 'across', wordNumber++, tempGrid, 0, newWords);
      }
    }
    
    setGrid(tempGrid);
    setWords(newWords);
    setSelectedCell(null);
    setCompletedWords(new Set());
  }, [flashcards]);

  // Helper function to check if a word can be placed
  const canPlaceWord = (word: string, row: number, col: number, direction: 'across' | 'down', grid: CrosswordCell[][]) => {
    // Check bounds
    if (direction === 'across' && col + word.length > gridSize) return 0;
    if (direction === 'down' && row + word.length > gridSize) return 0;
    if (row < 0 || col < 0) return 0;
    
    let intersectionCount = 0;
    let validPlacement = true;
    
    for (let i = 0; i < word.length; i++) {
      const currentRow = direction === 'across' ? row : row + i;
      const currentCol = direction === 'across' ? col + i : col;
      
      // Out of bounds check
      if (currentRow < 0 || currentRow >= gridSize || currentCol < 0 || currentCol >= gridSize) {
        validPlacement = false;
        break;
      }
      
      const cell = grid[currentRow][currentCol];
      
      // Check if cell is empty or has the same letter
      if (cell.letter !== '' && cell.letter !== word[i].toUpperCase()) {
        validPlacement = false;
        break;
      }
      
      // Count intersections
      if (cell.letter !== '' && cell.letter === word[i].toUpperCase()) {
        intersectionCount++;
      }
      
      // Check surrounding cells (to prevent adjacent words)
      const checkAdjacent = (r: number, c: number, ignoreIfStart: boolean) => {
        if (r < 0 || r >= gridSize || c < 0 || c >= gridSize) return true;
        if (grid[r][c].letter === '') return true;
        return ignoreIfStart && i === 0;
      };
      
      if (direction === 'across') {
        // Check cells above and below
        if (!checkAdjacent(currentRow - 1, currentCol, grid[currentRow - 1]?.[currentCol]?.direction === 'down')) {
          validPlacement = false;
          break;
        }
        if (!checkAdjacent(currentRow + 1, currentCol, grid[currentRow + 1]?.[currentCol]?.direction === 'down')) {
          validPlacement = false;
          break;
        }
      } else {
        // Check cells to left and right
        if (!checkAdjacent(currentRow, currentCol - 1, grid[currentRow]?.[currentCol - 1]?.direction === 'across')) {
          validPlacement = false;
          break;
        }
        if (!checkAdjacent(currentRow, currentCol + 1, grid[currentRow]?.[currentCol + 1]?.direction === 'across')) {
          validPlacement = false;
          break;
        }
      }
    }
    
    // Check cells before and after the word
    if (validPlacement) {
      if (direction === 'across') {
        if (col > 0 && grid[row][col - 1].letter !== '') validPlacement = false;
        if (col + word.length < gridSize && grid[row][col + word.length].letter !== '') validPlacement = false;
      } else {
        if (row > 0 && grid[row - 1][col].letter !== '') validPlacement = false;
        if (row + word.length < gridSize && grid[row + word.length][col].letter !== '') validPlacement = false;
      }
    }
    
    return validPlacement ? (intersectionCount > 0 ? intersectionCount + 1 : 1) : 0;
  };

  // Helper function to place a word on the grid
  const placeWordOnGrid = (
    word: string, 
    clue: string, 
    row: number, 
    col: number, 
    direction: 'across' | 'down', 
    number: number, 
    grid: CrosswordCell[][], 
    wordIndex: number,
    wordsArray: CrosswordWord[]
  ) => {
    wordsArray.push({
      word: word.toUpperCase(),
      clue,
      startRow: row,
      startCol: col,
      direction,
      number,
      isCompleted: false
    });

    for (let i = 0; i < word.length; i++) {
      const letter = word[i].toUpperCase();
      const currentRow = direction === 'across' ? row : row + i;
      const currentCol = direction === 'across' ? col + i : col;
      
      const existingCell = grid[currentRow][currentCol];
      const isIntersection = existingCell && existingCell.letter !== '';
      
      if (isIntersection) {
        const wordIndices = existingCell.wordIndices || [existingCell.wordIndex];
        if (!wordIndices.includes(wordIndex)) {
          wordIndices.push(wordIndex);
        }
        
        grid[currentRow][currentCol] = {
          ...existingCell,
          number: i === 0 ? number : existingCell.number,
          isStart: existingCell.isStart || i === 0,
          wordIndices
        };
      } else {
        grid[currentRow][currentCol] = {
          letter,
          row: currentRow,
          col: currentCol,
          wordIndex,
          wordIndices: [wordIndex],
          direction,
          isStart: i === 0,
          number: i === 0 ? number : undefined,
          value: ''
        };
      }
    }

    return true;
  };

  // Attempt to place a word by finding the best position
  const attemptWordPlacement = (
    word: string, 
    clue: string, 
    grid: CrosswordCell[][], 
    wordsArray: CrosswordWord[],
    wordNumber: number
  ) => {
    let bestScore = 0;
    let bestRow = -1;
    let bestCol = -1;
    let bestDirection: 'across' | 'down' = 'across';
    
    // Primero intentamos encontrar intersecciones con palabras existentes
    for (const existingWord of wordsArray) {
      const existingWordStr = existingWord.word;
      
      // Buscamos cada letra de la palabra actual en la palabra existente
      for (let i = 0; i < word.length; i++) {
        for (let j = 0; j < existingWordStr.length; j++) {
          if (word[i] === existingWordStr[j]) {
            // Calculamos la posición para la nueva palabra
            const newRow = existingWord.direction === 'across' 
              ? existingWord.startRow - i
              : existingWord.startRow + j;
              
            const newCol = existingWord.direction === 'across'
              ? existingWord.startCol + j
              : existingWord.startCol - i;
              
            const direction = existingWord.direction === 'across' ? 'down' : 'across';
            
            // Verificamos si podemos colocar la palabra en esta posición
            const score = canPlaceWord(word, newRow, newCol, direction, grid);
            if (score > bestScore) {
              bestScore = score;
              bestRow = newRow;
              bestCol = newCol;
              bestDirection = direction;
            }
          }
        }
      }
    }
    
    // Si no encontramos intersecciones, intentamos posiciones aleatorias
    if (bestScore === 0) {
      const attempts = 100; // Aumentamos el número de intentos
      for (let attempt = 0; attempt < attempts; attempt++) {
        const direction = Math.random() < 0.5 ? 'across' : 'down';
        const row = Math.floor(Math.random() * (gridSize - (direction === 'across' ? word.length : 0)));
        const col = Math.floor(Math.random() * (gridSize - (direction === 'down' ? word.length : 0)));
        
        const score = canPlaceWord(word, row, col, direction, grid);
        if (score > bestScore) {
          bestScore = score;
          bestRow = row;
          bestCol = col;
          bestDirection = direction;
        }
      }
    }
    
    // Si encontramos una posición válida, colocamos la palabra
    if (bestScore > 0) {
      return placeWordOnGrid(
        word, 
        clue, 
        bestRow, 
        bestCol, 
        bestDirection, 
        wordNumber, 
        grid, 
        wordsArray.length,
        wordsArray
      );
    }
    
    return false;
  };

  // Handle cell input
  const handleCellInput = useCallback((text: string, row: number, col: number) => {
    if (!grid[row][col] || grid[row][col].letter === '') return;
    
    // Only allow single letter inputs and convert to uppercase
    text = text.length > 1 ? text[text.length - 1] : text;
    text = text.toUpperCase();
    
    // Update grid with input value
    const newGrid = [...grid];
    newGrid[row][col] = {
      ...newGrid[row][col],
      value: text
    };
    setGrid(newGrid);
    
    // Move to next cell
    moveToNextCell(row, col, text, newGrid);
    
    // Check for completed words
    checkForCompletedWords(row, col, newGrid);
  }, [grid, words, completedWords, gridSize]);

  // Move to next cell after input
  const moveToNextCell = (row: number, col: number, text: string, newGrid: CrosswordCell[][]) => {
    if (!text) return;
    
    const currentCell = grid[row][col];
    const wordsToCheck = currentCell.wordIndices || [currentCell.wordIndex];
    
    if (wordsToCheck.length > 0) {
      const wordIndex = wordsToCheck[0];
      const word = words[wordIndex];
      
      if (word.direction === 'across') {
        const nextCol = col + 1;
        if (nextCol < gridSize && newGrid[row][nextCol]?.letter !== '') {
          setSelectedCell({ row, col: nextCol });
        }
      } else {
        const nextRow = row + 1;
        if (nextRow < gridSize && newGrid[nextRow][col]?.letter !== '') {
          setSelectedCell({ row: nextRow, col });
        }
      }
    }
  };

  // Check if words are completed after cell input
  const checkForCompletedWords = (row: number, col: number, newGrid: CrosswordCell[][]) => {
    const currentCell = grid[row][col];
    const wordsToCheck = currentCell.wordIndices || [currentCell.wordIndex];
    const newCompletedWords = new Set(completedWords);
    const newWords = [...words];
    let anyWordCompleted = false;
    
    wordsToCheck.forEach(wordIndex => {
      const word = words[wordIndex];
      let isWordComplete = true;
      let allLettersFilled = true;
      
      // Check all cells in the word
      if (word.direction === 'across') {
        for (let i = 0; i < word.word.length; i++) {
          const cell = newGrid[word.startRow][word.startCol + i];
          if (!cell.value) {
            allLettersFilled = false;
          }
          if (cell.value !== cell.letter) {
            isWordComplete = false;
          }
        }
      } else {
        for (let i = 0; i < word.word.length; i++) {
          const cell = newGrid[word.startRow + i][word.startCol];
          if (!cell.value) {
            allLettersFilled = false;
          }
          if (cell.value !== cell.letter) {
            isWordComplete = false;
          }
        }
      }
      
      // Mark word as completed and validate
      if (allLettersFilled) {
        validateWord(word, newGrid);
        
        if (isWordComplete && !newCompletedWords.has(wordIndex)) {
          newWords[wordIndex] = {
            ...newWords[wordIndex],
            isCompleted: true
          };
          newCompletedWords.add(wordIndex);
          anyWordCompleted = true;
        }
      }
    });
    
    // Update state if words were completed
    if (anyWordCompleted) {
      setWords(newWords);
      setCompletedWords(newCompletedWords);
      
      // Check if all words are completed
      if (newCompletedWords.size === words.length) {
        setTimeout(() => setShowResults(true), 500);
      }
    }
  };

  // Validate a word
  const validateWord = useCallback((word: CrosswordWord, currentGrid: CrosswordCell[][]) => {
    const updatedGrid = [...currentGrid];
    let hasIncorrectLetters = false;
    
    const checkCell = (row: number, col: number) => {
      const cell = updatedGrid[row][col];
      const isCorrect = cell.value === cell.letter;
      
      updatedGrid[row][col] = {
        ...cell,
        isCorrect: isCorrect,
        isIncorrect: !isCorrect && cell.value !== ''
      };
      
      if (!isCorrect && cell.value !== '') {
        hasIncorrectLetters = true;
      }
    };
    
    // Check all cells in the word
    if (word.direction === 'across') {
      for (let i = 0; i < word.word.length; i++) {
        checkCell(word.startRow, word.startCol + i);
      }
    } else {
      for (let i = 0; i < word.word.length; i++) {
        checkCell(word.startRow + i, word.startCol);
      }
    }
    
    setGrid(updatedGrid);
    
    // Animate and reset incorrect entries
    if (hasIncorrectLetters) {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.3,
          duration: 200,
          useNativeDriver: true
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true
        }),
        Animated.delay(800)
      ]).start(() => {
        // Clear incorrect inputs
        const clearedGrid = [...updatedGrid];
        
        // Loop through the word cells and clear incorrect ones
        if (word.direction === 'across') {
          for (let i = 0; i < word.word.length; i++) {
            clearIncorrectCell(clearedGrid, word.startRow, word.startCol + i);
          }
        } else {
          for (let i = 0; i < word.word.length; i++) {
            clearIncorrectCell(clearedGrid, word.startRow + i, word.startCol);
          }
        }
        
        setGrid(clearedGrid);
      });
    }
    
    return hasIncorrectLetters;
  }, [fadeAnim]);

  // Clear incorrect cell helper
  const clearIncorrectCell = (grid: CrosswordCell[][], row: number, col: number) => {
    const cell = grid[row][col];
    if (cell.isIncorrect) {
      grid[row][col] = {
        ...cell,
        value: '',
        isIncorrect: false
      };
    }
  };

  // Handle cell selection
  const handleCellPress = useCallback((row: number, col: number) => {
    if (!grid[row][col] || grid[row][col].letter === '') return;
    setSelectedCell({ row, col });
  }, [grid]);

  // Reset the game
  const handleRestart = useCallback(() => {
    setShowResults(false);
    setCompletedWords(new Set());
    generateCrossword();
  }, [generateCrossword]);

  // Navigation with arrow keys
  const handleKeyPress = useCallback((key: string, row: number, col: number) => {
    if (key === 'ArrowRight' && col + 1 < gridSize && grid[row][col + 1]?.letter !== '') {
      setSelectedCell({ row, col: col + 1 });
    } else if (key === 'ArrowLeft' && col - 1 >= 0 && grid[row][col - 1]?.letter !== '') {
      setSelectedCell({ row, col: col - 1 });
    } else if (key === 'ArrowDown' && row + 1 < gridSize && grid[row + 1][col]?.letter !== '') {
      setSelectedCell({ row: row + 1, col });
    } else if (key === 'ArrowUp' && row - 1 >= 0 && grid[row - 1][col]?.letter !== '') {
      setSelectedCell({ row: row - 1, col });
    }
  }, [grid, gridSize]);

  // Effects
  useEffect(() => {
    if (id) fetchFlashcards();
  }, [id, fetchFlashcards]);

  useEffect(() => {
    if (!loading && flashcards.length > 0) {
      generateCrossword();
    }
  }, [loading, flashcards, generateCrossword]);

  // UI Components
  const renderCell = useCallback((cell: CrosswordCell, row: number, col: number) => {
    if (!cell || cell.letter === '') {
      return <View key={`${row}-${col}`} style={styles.emptyCell} />;
    }
  
    const isSelected = selectedCell?.row === row && selectedCell?.col === col;
    const cellStyle = [
      styles.cell,
      isSelected && styles.selectedCell,
      cell.isCorrect && styles.correctCell,
      cell.isIncorrect && styles.incorrectCell
    ];
  
    return (
      <TouchableOpacity
        key={`${row}-${col}`}
        style={cellStyle}
        onPress={() => handleCellPress(row, col)}
      >
        {cell.isStart && (
          <Text style={styles.cellNumber}>{cell.number}</Text>
        )}
        <TextInput
          style={styles.cellInput}
          value={cell.value}
          onChangeText={(text) => handleCellInput(text, row, col)}
          maxLength={1}
          autoCapitalize="characters"
          keyboardType="default"
          selectTextOnFocus
          ref={(input) => {
            if (isSelected && input) {
              input.focus();
            }
          }}
          onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, row, col)}
        />
      </TouchableOpacity>
    );
  }, [selectedCell, handleCellPress, handleCellInput, handleKeyPress]);

  const cluesList = useMemo(() => {
    const acrossClues = words.filter(word => word.direction === 'across');
    const downClues = words.filter(word => word.direction === 'down');
    
    return (
      <View style={styles.cluesContainer}>
        <View style={styles.clueColumn}>
          {acrossClues.map((word) => (
            <View 
              key={`across-${word.number}`} 
              style={[
                styles.clueItem,
                word.isCompleted && styles.completedClue
              ]}
            >
              <Text style={styles.clueNumber}>{word.number}.</Text>
              <Text style={styles.clueText}>{word.clue}</Text>
            </View>
          ))}
        </View>
        
        <View style={styles.clueColumn}>
          {downClues.map((word) => (
            <View 
              key={`down-${word.number}`} 
              style={[
                styles.clueItem,
                word.isCompleted && styles.completedClue
              ]}
            >
              <Text style={styles.clueNumber}>{word.number}.</Text>
              <Text style={styles.clueText}>{word.clue}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  }, [words]);

  useEffect(() => {
    if (showResults) {
      const awardXP = async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await updateUserXP(user.id, 10);
            Alert.alert('¡Felicidades!', 'Has completado el crucigrama y ganado +10 XP');
          }
        } catch (error) {
          console.error('Error awarding XP:', error);
        }
      };
      awardXP();
    }
  }, [showResults]);

  const resultsScreen = useMemo(() => (
    <View style={styles.resultsContainer}>
      <Text style={styles.resultsTitle}>¡Felicidades!</Text>
      <Text style={styles.resultsSubtitle}>Has completado el crucigrama</Text>
      
      <TouchableOpacity style={styles.button} onPress={handleRestart}>
        <Text style={styles.buttonText}>Reiniciar</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.button, styles.buttonSecondary]}
        onPress={() => router.back()}
      >
        <Text style={[styles.buttonText, styles.buttonTextSecondary]}>Volver a la lista de lecciones</Text>
      </TouchableOpacity>
    </View>
  ), [handleRestart, router, id]);

  // Render loading screen
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando crucigrama...</Text>
      </View>
    );
  }
  
  // Render main game screen
  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => router.back()}
      >
        <AntDesign name="arrow-left" size={24} color="#FFFFFF" />
      </TouchableOpacity>
      
      {showResults ? (
        resultsScreen
      ) : (
        <>
          <Text style={styles.title}>{collection?.name}</Text>
          
          <Animated.View 
            style={[
              styles.gridContainer, 
              {opacity: fadeAnim, transform: [{scale: scaleAnim}]}
            ]}
          >
            {grid.map((row, rowIndex) => (
              <View key={`row-${rowIndex}`} style={styles.gridRow}>
                {row.map((cell, colIndex) => 
                  renderCell(cell, rowIndex, colIndex)
                )}
              </View>
            ))}
          </Animated.View>
          
          <Text style={styles.cluesTitle}>Términos</Text>
          {cluesList}
        </>
      )}
    </ScrollView>
  );
};

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
    fontFamily: FONTS.title,
  },
  backButton: {
    padding: 10,
    marginTop: 40,
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontFamily: FONTS.title,
    marginBottom: 20,
    textAlign: 'center',
  },
  gridContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  gridRow: {
    flexDirection: 'row',
  },
  cell: {
    width: 32,
    height: 32,
    borderWidth: 1,
    borderColor: '#37464f',
    backgroundColor: '#202f36',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  emptyCell: {
    width: 32,
    height: 32,
    backgroundColor: 'transparent',
  },
  selectedCell: {
    backgroundColor: '#1CB0F6',
  },
  correctCell: {
    backgroundColor: '#58CC02',
  },
  incorrectCell: {
    backgroundColor: '#FF4B4B',
  },
  cellNumber: {
    position: 'absolute',
    top: 1,
    left: 2,
    fontSize: 8,
    color: '#FFFFFF',
    fontFamily: FONTS.title,
  },
  cellInput: {
    width: '100%',
    height: '100%',
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: FONTS.title,
  },
  cluesTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontFamily: FONTS.title,
    marginBottom: 15,
  },
  cluesContainer: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  clueColumn: {
    flex: 1,
    marginHorizontal: 5,
  },
  clueItem: {
    flexDirection: 'row',
    backgroundColor: '#202f36',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#37464f',
  },
  completedClue: {
    backgroundColor: '#58CC02',
    borderColor: '#58CC02',
  },
  clueNumber: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: FONTS.title,
    marginRight: 5,
  },
  clueText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: FONTS.body,
    flex: 1,
  },
  resultsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginTop: 40,
  },
  resultsTitle: {
    color: '#FFFFFF',
    fontSize: 32,
    fontFamily: FONTS.title,
    marginBottom: 10,
  },
  resultsSubtitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: FONTS.body,
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#1CB0F6',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 30,
    width: '100%',
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#1CB0F6',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: FONTS.title,
  },
  buttonTextSecondary: {
    color: '#1CB0F6',
  },
});

export default CrosswordScreen;