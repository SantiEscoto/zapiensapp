import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Animated, TextInput, TouchableOpacity, StyleSheet, ScrollView, Switch, Alert, ActivityIndicator, useWindowDimensions, Dimensions } from 'react-native';
import { Portal, Modal, Chip } from 'react-native-paper';
import { generateFlashCards, generateCollectionInfo } from '../../src/services/ai/integration/openrouter';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFonts } from 'expo-font';
import { supabase } from '../../src/services/supabase';
import { Image } from 'react-native';
import { FONTS } from '../../src/services/fonts';
import { languages } from '../../src/services/languages';
import { Ionicons } from '@expo/vector-icons'; // Make sure to install expo/vector-icons
import { useTheme } from '../../src/context/ThemeContext';
import { useCollections } from '../../src/context/CollectionsContext';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    marginLeft: 16,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: {
    padding: 16,
  },
  formColumns: {
    flexDirection: 'row',
    gap: 24,
    paddingHorizontal: 16,
    marginBottom: 16
  },
  leftColumn: {
    flex: 1,
    maxWidth: '40%'
  },
  rightColumn: {
    flex: 1.5,
    gap: 16
  },
  coverUpload: {
    width: '100%',
    height: 200,
    backgroundColor: '#202f36',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#37464f'
  },
  coverIcon: {
    marginBottom: 12,
  },
  uploadText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: FONTS.regular,
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  loadingText: {
    marginTop: 10,
    color: '#FFFFFF',
    fontFamily: FONTS.regular
  },
  modalContainer: {
    backgroundColor: '#202f36',
    padding: 20,
    margin: 20,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#37464f'
  },
  modalContent: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    maxHeight: '80%',
    backgroundColor: '#131f24',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center'
  },
  modalMessage: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center'
  },
  modalFooter: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    gap: 10
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: '#1CB0F6',
    minWidth: 100,
    alignItems: 'center'
  },
  cancelButton: {
    backgroundColor: '#FF4B4B',
  },
  confirmButton: {
    backgroundColor: '#1CB0F6',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: FONTS.bold
  },
  progressBarContainer: {
    width: '100%',
    height: 10,
    backgroundColor: '#37464f',
    borderRadius: 5,
    marginTop: 10,
    marginBottom: 10,
    overflow: 'hidden'
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#1CB0F6',
    borderRadius: 5,
  },
  modalScroll: {
    maxHeight: 400,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: FONTS.bold,
    marginBottom: 16,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: '#202f36',
  },
  languageSelectorText: {
    marginLeft: 8,
    fontFamily: FONTS.regular,
    color: '#FFFFFF',
  },
  cardContainer: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
  },
  deleteButton: {
    padding: 8,
  },
  deleteButtonText: {
    color: '#FF4B4B',
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  input: {
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    fontFamily: FONTS.regular,
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    marginBottom: 8,
  },
  errorText: {
    color: '#FF4B4B',
    fontSize: 14,
    fontFamily: FONTS.regular,
    marginTop: 4,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#202f36',
    borderRadius: 14,
    padding: 16,
    borderWidth: 2,
    borderColor: '#37464f',
  },
  toggleLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  cardsSection: {
    backgroundColor: '#131f24',
    borderRadius: 16,
    padding: 16
  },
  tabBar: {
    flexDirection: 'row',
    position: 'relative',
    marginBottom: 20,
    backgroundColor: '#202f36',
    borderRadius: 14,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  tabText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: FONTS.bold,
  },
  activeTabText: {
    color: '#1CB0F6',
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 3,
    backgroundColor: '#1CB0F6',
  },
  cardsScrollContainer: {
    maxHeight: 400,
    marginVertical: 12,
    marginTop: 32,
    marginBottom: 16,
  },
  assistantContainer: {
    padding: 20,
    backgroundColor: '#202f36',
    borderRadius: 12,
    marginBottom: 16,
  },
  assistantInput: {
    backgroundColor: '#37464f',
    borderRadius: 8,
    padding: 16,
    color: '#FFFFFF',
    fontFamily: FONTS.regular,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#FF4B4B',
    borderWidth: 1
  },
  generateButton: {
    backgroundColor: '#1CB0F6',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10
  },
  generateButtonDisabled: {
    backgroundColor: '#37464f',
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
    fontSize: 16
  },
  addButton: {
    backgroundColor: '#1CB0F620',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1CB0F640',
    borderStyle: 'dashed',
    marginTop: 8,
  },
  addButtonText: {
    color: '#1CB0F6',
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
  buttonContainer: {
    marginTop: 20,
    gap: 10
  },
  buttonDisabled: {
    opacity: 0.7
  },
  saveButton: {
    backgroundColor: '#1CB0F6',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: FONTS.bold
  },
  inputGroup: {
    marginBottom: 16,
  },
  cardContentRow: {
    flexDirection: 'row',
    padding: 8,
  },
  cardSideColumn: {
    flex: 1,
    padding: 8,
  },
  cardSideLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: FONTS.bold,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  cardInput: {
    backgroundColor: '#37464f',
    borderRadius: 10,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: FONTS.regular,
    textAlignVertical: 'top',
    minHeight: 40,
    maxHeight: 200,
  },
  cardVerticalDivider: {
    width: 1,
    backgroundColor: '#37464f',
    marginHorizontal: 4,
  }
});

interface Card {
  id: string;
  front_content: string;
  back_content: string;
}

interface Collection {
  id?: string;
  name: string;
  topics: string[];
  is_public: boolean;
}

interface GeneratedCard {
  front_content: string;
  back_content: string;
}

interface CardGenerationResponse {
  cards: GeneratedCard[];
  error?: string;
}

const LANGUAGE_FLAGS: Record<string, any> = {
  'English': require('../../assets/flags/en.png'),
  'Spanish': require('../../assets/flags/es.png'),
  'French': require('../../assets/flags/fr.png'),
  'German': require('../../assets/flags/de.png'),
  'Italian': require('../../assets/flags/it.png'),
  'Portuguese': require('../../assets/flags/pt.png'),
  'Japanese': require('../../assets/flags/ja.png'),
  'Chinese': require('../../assets/flags/zh.png'),
  'Korean': require('../../assets/flags/ko.png'),
  'Russian': require('../../assets/flags/ru.png')
};

// Component starts here

export default function EditScreen() {
  const router = useRouter();
  const { id, input, fromSearch, generatedName, generatedDescription } = useLocalSearchParams();
  const { theme } = useTheme();
  const { updateCollection, updateCollectionById } = useCollections();
  const [collection, setCollection] = useState<Collection>({
    name: generatedName ? String(generatedName) : '',
    topics: [],
    is_public: false
  });
  const [cards, setCards] = useState<Card[]>([{
    id: '1',
    front_content: '',
    back_content: ''
  }]);
  const [isLoading, setIsLoading] = useState(!!id);
  const [currentLanguage, setCurrentLanguage] = useState('es');
  const [activeTab, setActiveTab] = useState('assistant');
  const [contentInput, setContentInput] = useState(generatedDescription ? String(generatedDescription) : '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorTitle, setErrorTitle] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  const [currentChunk, setCurrentChunk] = useState(0);
  const [isProgressVisible, setIsProgressVisible] = useState(false);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [showTopicModal, setShowTopicModal] = useState(false);

  const [loaded] = useFonts({
    'DINNextRoundedLTPro-Bold': require('../../assets/fonts/DINNextRoundedLTPro-Bold.otf'),
    'DINNextRoundedLTPro-Regular': require('../../assets/fonts/DINNextRoundedLTPro-Regular.otf'),
  });

  const translations = {
    en: {
      createCollection: 'Create Collection',
      editCollection: 'Edit Collection',
      addCover: 'Add a Cover',
      selectImage: 'Select an image from your device',
      collectionName: 'Collection Name',
      collectionNamePlaceholder: 'Enter your collection name',
      makePublic: 'Make Collection Public',
      shareWithEveryone: 'Share with everyone',
      selectLanguage: 'Select Language',
      flashcards: 'Flashcards',
      frontContent: 'Front content',
      backContent: 'Back content',
      addFlashcard: '+ Add Flashcard',
      create: 'CREATE',
      saveChanges: 'SAVE CHANGES',
      deleteCollection: 'DELETE COLLECTION',
      deleteCard: 'Delete card'
    },
    es: {
      createCollection: 'Crear Colección',
      editCollection: 'Editar Colección',
      addCover: 'Añadir una portada',
      selectImage: 'Selecciona una imagen de tu dispositivo',
      collectionName: 'Nombre de la colección',
      collectionNamePlaceholder: 'Introduce el nombre de tu colección',
      makePublic: 'Hacer la colección pública',
      shareWithEveryone: 'Compartir con todos',
      selectLanguage: 'Selecciona el idioma',
      flashcards: 'Flashcards',
      frontContent: 'Contenido frontal',
      backContent: 'Contenido posterior',
      addFlashcard: '+ Añadir Flashcard',
      create: 'CREAR',
      saveChanges: 'GUARDAR CAMBIOS',
      deleteCollection: 'ELIMINAR COLECCIÓN',
      deleteCard: 'Eliminar tarjeta'
    }
  };

  const t = translations[currentLanguage as keyof typeof translations];

  const availableLanguages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'it', name: 'Italiano' },
    { code: 'pt', name: 'Português' },
    { code: 'ru', name: 'Русский' },
    { code: 'ja', name: '日本語' },
    { code: 'ko', name: '한국어' },
    { code: 'zh', name: '中文' }
  ];

  const availableTopics = [
    { id: 'sports', name: 'Deportes' },
    { id: 'history', name: 'Historia' },
    { id: 'geography', name: 'Geografía' },
    { id: 'science', name: 'Ciencia' },
    { id: 'art', name: 'Arte' },
    { id: 'environment', name: 'Medio Ambiente' },
    { id: 'pop-culture', name: 'Cultura Pop' }
  ];

  const fetchCollection = useCallback(async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const [collectionResponse, cardsResponse] = await Promise.all([
        supabase.from('collections').select('*').eq('id', id).single(),
        supabase.from('cards').select('*').eq('collection_id', id)
      ]);

      if (collectionResponse.error) throw collectionResponse.error;
      if (!collectionResponse.data) throw new Error('Collection not found');
      if (cardsResponse.error) throw cardsResponse.error;

      // Separar temas e idiomas
      const topics = collectionResponse.data.topics || [];
      const languages = topics.filter((topic: string) => availableLanguages.some(lang => lang.code === topic));
      const selectedTopics = topics.filter((topic: string) => availableTopics.some(t => t.id === topic));

      // Actualizar los estados con los temas e idiomas
      setSelectedLanguages(languages);
      setSelectedTopics(selectedTopics);

      // Actualizar la colección con todos los temas
      setCollection({
        id: collectionResponse.data.id,
        name: collectionResponse.data.name,
        topics: topics,
        is_public: collectionResponse.data.is_public
      });

      setCards(cardsResponse.data.length > 0 ? cardsResponse.data.map((card: any) => ({
        id: card.id,
        front_content: card.front_content,
        back_content: card.back_content
      })) : [{
        id: '1',
        front_content: '',
        back_content: ''
      }]);
    } catch (error: any) {
      console.error('Error fetching collection:', error.message);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCollection();
  }, [fetchCollection]);

  useEffect(() => {
    if (fromSearch === 'true' && input && !generatedName) {
      // Solo generar si no tenemos los valores pre-generados
      generateNameAndDescription();
    }
  }, [fromSearch, input, generatedName]);

  const handleCollectionChange = useCallback((field: keyof Collection, value: any) => {
    setCollection(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleAddCard = useCallback(() => {
    setCards(prev => [...prev, {
      id: Date.now().toString(),
      front_content: '',
      back_content: ''
    }]);
  }, []);

  const handleDeleteCard = useCallback((id: string) => {
    if (cards.length <= 1) {
      Alert.alert(
        'Cannot Delete',
        'You need at least one flashcard in your collection',
        [{ text: 'OK' }]
      );
      return;
    }
    setCards(prev => prev.filter(card => card.id !== id));
  }, [cards]);

  const handleCardChange = useCallback((id: string, field: keyof Card, value: string) => {
    setCards(prev => prev.map(card =>
      card.id === id ? { ...card, [field]: value } : card
    ));
  }, []);

  const showError = (title: string, message: string) => {
    setErrorTitle(title);
    setErrorMessage(message);
    setErrorModalVisible(true);
  };

  const showProgress = (current: number, total: number) => {
    setCurrentChunk(current);
    setTotalChunks(total);
    setProgressValue(current / total);
    setIsProgressVisible(true);
  };

  const hideProgress = () => {
    setIsProgressVisible(false);
    setProgressValue(0);
    setCurrentChunk(0);
    setTotalChunks(0);
  };

  const handleSave = useCallback(async () => {
    // Validate inputs
    if (!collection.name.trim()) {
      showError(
        currentLanguage === 'es' ? 'Información faltante' : 'Missing Information',
        currentLanguage === 'es' ? 'Por favor ingresa un nombre para la colección' : 'Please provide a collection name'
      );
      return;
    }

    const hasEmptyCards = cards.some(card => !card.front_content.trim() || !card.back_content.trim());
    if (hasEmptyCards) {
      setConfirmModalVisible(true);
    } else {
      saveCollection();
    }
  }, [collection, cards, currentLanguage]);

  const saveCollection = async () => {
    try {
      setIsSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Asegurarnos de que tenemos los temas más recientes
      const allTopics = [...selectedTopics, ...selectedLanguages];

      if (id) {
        // Update existing collection
        const { data: updatedCollection, error: collectionError } = await supabase
          .from('collections')
          .update({
            name: collection.name,
            topics: allTopics,
            is_public: collection.is_public
          })
          .eq('id', id)
          .select()
          .single();

        if (collectionError) throw collectionError;

        // Delete existing cards and insert new ones
        await supabase.from('cards').delete().eq('collection_id', id);

        await supabase.from('cards').insert(
          cards.map(card => ({
            collection_id: id,
            front_content: card.front_content,
            back_content: card.back_content
          }))
        );

        // Actualizar la colección en el contexto global
        if (updatedCollection) {
          updateCollection(updatedCollection);
        }

        // Volver a la pantalla anterior con un parámetro de refresco
        router.replace({
          pathname: '/(subtabs)/lessons' as any,
          params: {
            id,
            refresh: Date.now().toString()
          }
        });
      } else {
        // Create new collection
        const { data: collectionData, error: collectionError } = await supabase
          .from('collections')
          .insert([{
            name: collection.name,
            topics: allTopics,
            is_public: collection.is_public,
            user_id: user.id
          }])
          .select()
          .single();

        if (collectionError) throw collectionError;

        // Create cards
        await supabase.from('cards').insert(
          cards.map(card => ({
            collection_id: collectionData.id,
            front_content: card.front_content,
            back_content: card.back_content
          }))
        );

        // Redirect to lessons screen with the new collection ID
        router.replace({
          pathname: '/(subtabs)/lessons',
          params: {
            id: collectionData.id
          }
        });
      }
    } catch (error: any) {
      console.error('Error saving collection:', error.message);
      Alert.alert('Error', 'Failed to save collection. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteCollection = async () => {
    if (!id) return;
    
    try {
      setIsDeleting(true);
      // First delete all cards associated with the collection
      const { error: cardsError } = await supabase
        .from('cards')
        .delete()
        .eq('collection_id', id);
      
      if (cardsError) throw cardsError;

      // Then delete the collection itself
      const { error: collectionError } = await supabase
        .from('collections')
        .delete()
        .eq('id', id);
      
      if (collectionError) throw collectionError;

      // Navigate directly to home screen after successful deletion
      router.replace('/(main)/home');

    } catch (error: any) {
      console.error('Error deleting collection:', error.message);
      Alert.alert('Error', 'Failed to delete collection. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  }

  const confirmDelete = () => {
    setDeleteModalVisible(true);
  };

  const getLanguageFlagByName = useCallback((name: string) => {
    return LANGUAGE_FLAGS[name] || require('../../assets/flags/en.png');
  }, []);

  const handleGeneratedCards = async () => {
    try {
      setIsGenerating(true);
      const chunks = splitContentIntoChunks(contentInput);
      setTotalChunks(chunks.length);
      setCurrentChunk(0);
      setIsProgressVisible(true);

      const generatedCards: Card[] = [];
      for (let i = 0; i < chunks.length; i++) {
        setCurrentChunk(i + 1);
        const chunk = chunks[i];
        const { cards: newCards, error } = await generateFlashCards(
          chunk,
          collection.topics.join(', '),
          generatedCards
        );
        if (error) throw new Error(error);
        // Convertir las tarjetas generadas al formato Card
        const convertedCards = newCards.map(card => ({
          id: Date.now().toString(),
          front_content: card.front_content,
          back_content: card.back_content
        }));
        generatedCards.push(...convertedCards);
      }

      setCards(generatedCards);
      setActiveTab('manual');
      hideProgress();
    } catch (error: any) {
      console.error('Error generating cards:', error);
      showError(
        currentLanguage === 'es' ? 'Error de generación' : 'Generation Error',
        error.message || (currentLanguage === 'es' ? 'Error al generar las tarjetas' : 'Error generating cards')
      );
      hideProgress();
    } finally {
      setIsGenerating(false);
    }
  };

  const generateNameAndDescription = async () => {
    try {
      setIsGenerating(true);
      const { name, description, error } = await generateCollectionInfo(
        input as string,
        collection.topics.join(', ')
      );
      if (error) throw new Error(error);
      if (name) handleCollectionChange('name', name);
      if (description) setContentInput(description);
    } catch (error: any) {
      console.error('Error generating name and description:', error);
      showError(
        currentLanguage === 'es' ? 'Error de generación' : 'Generation Error',
        error.message || (currentLanguage === 'es' ? 'Error al generar el nombre y la descripción' : 'Error generating name and description')
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper function to split content into manageable chunks
  const splitContentIntoChunks = (content: string): string[] => {
    const MAX_CHUNK_SIZE = 1000; // Characters per chunk
    const lines = content.split('\n');
    const chunks: string[] = [];
    let currentChunk = '';
    
    for (const line of lines) {
      // If adding this line would exceed the chunk size, start a new chunk
      if (currentChunk.length + line.length > MAX_CHUNK_SIZE && currentChunk.length > 0) {
        chunks.push(currentChunk);
        currentChunk = line;
      } else {
        // Add line to current chunk with a newline if it's not the first line
        currentChunk += (currentChunk.length > 0 ? '\n' : '') + line;
      }
    }
    
    // Add the last chunk if it has content
    if (currentChunk.length > 0) {
      chunks.push(currentChunk);
    }
    
    // If no chunks were created (content was empty), return an array with empty string
    return chunks.length > 0 ? chunks : [content];
  };

  const handleTopicToggle = (topicId: string) => {
    setSelectedTopics(prev => {
      if (prev.includes(topicId)) {
        return prev.filter(topic => topic !== topicId);
      }
      return [...prev, topicId];
    });
  };

  const handleLanguageToggle = (languageCode: string) => {
    setSelectedLanguages(prev => {
      if (prev.includes(languageCode)) {
        return prev.filter(lang => lang !== languageCode);
      }
      return [...prev, languageCode];
    });
  };

  const handleModalClose = () => {
    // Combinar temas e idiomas seleccionados
    const allTopics = [...selectedTopics, ...selectedLanguages];
    handleCollectionChange('topics', allTopics);
    setShowTopicModal(false);
  };

  const TopicSelectorModal = () => (
    <Portal>
      <Modal
        visible={showTopicModal}
        onDismiss={() => setShowTopicModal(false)}
        contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
            Seleccionar Temas e Idiomas
          </Text>
          <TouchableOpacity onPress={() => setShowTopicModal(false)}>
            <Ionicons name="close" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalScroll}>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Temas</Text>
            <View style={styles.chipContainer}>
              {availableTopics.map(topic => (
                <Chip
                  key={topic.id}
                  selected={selectedTopics.includes(topic.id)}
                  onPress={() => handleTopicToggle(topic.id)}
                  style={styles.chip}
                >
                  {topic.name}
                </Chip>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Idiomas</Text>
            <View style={styles.chipContainer}>
              {availableLanguages.map(language => (
                <Chip
                  key={language.code}
                  selected={selectedLanguages.includes(language.code)}
                  onPress={() => handleLanguageToggle(language.code)}
                  style={styles.chip}
                >
                  {language.name}
                </Chip>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleModalClose}
          >
            <Text style={styles.modalButtonText}>Aceptar</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </Portal>
  );

  // Reemplazar el selector de idiomas existente con el nuevo botón
  const renderLanguageSelector = () => (
    <TouchableOpacity
      style={[styles.languageSelector, { backgroundColor: theme.colors.card }]}
      onPress={() => setShowTopicModal(true)}
    >
      <Ionicons name="language" size={20} color={theme.colors.text} />
      <Text style={[styles.languageSelectorText, { color: theme.colors.text }]}>
        {collection.topics.length > 0 
          ? `${collection.topics.length} tema${collection.topics.length > 1 ? 's' : ''} seleccionado${collection.topics.length > 1 ? 's' : ''}`
          : 'Seleccionar temas e idiomas'}
      </Text>
    </TouchableOpacity>
  );

  if (!loaded) return null;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Portal>
        <Modal
          visible={errorModalVisible}
          onDismiss={() => setErrorModalVisible(false)}
          contentContainerStyle={[styles.modalContainer, { 
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border 
          }]}
        >
          <Text style={[styles.modalTitle, { color: theme.colors.text }]}>{errorTitle}</Text>
          <Text style={[styles.modalMessage, { color: theme.colors.textSecondary }]}>{errorMessage}</Text>
          <TouchableOpacity
            style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => setErrorModalVisible(false)}
          >
            <Text style={styles.modalButtonText}>OK</Text>
          </TouchableOpacity>
        </Modal>

        <Modal
          visible={deleteModalVisible}
          onDismiss={() => setDeleteModalVisible(false)}
          contentContainerStyle={[styles.modalContainer, { 
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border 
          }]}
        >
          <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
            {currentLanguage === 'es' ? 'Eliminar colección' : 'Delete Collection'}
          </Text>
          <Text style={[styles.modalMessage, { color: theme.colors.textSecondary }]}>
            {currentLanguage === 'es'
              ? '¿Estás seguro de que quieres eliminar esta colección? Esta acción no se puede deshacer.'
              : 'Are you sure you want to delete this collection? This action cannot be undone.'}
          </Text>
          <View style={styles.modalButtonsContainer}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setDeleteModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>
                {currentLanguage === 'es' ? 'Cancelar' : 'Cancel'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => {
                setDeleteModalVisible(false);
                deleteCollection();
              }}
            >
              <Text style={styles.modalButtonText}>
                {currentLanguage === 'es' ? 'Eliminar' : 'Delete'}
              </Text>
            </TouchableOpacity>
          </View>
        </Modal>

        <Modal
          visible={isProgressVisible}
          dismissable={false}
          contentContainerStyle={[styles.modalContainer, { 
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border 
          }]}
        >
          <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
            {currentLanguage === 'es' ? 'Generando tarjetas' : 'Generating Cards'}
          </Text>
          <Text style={[styles.modalMessage, { color: theme.colors.textSecondary }]}>
            {currentLanguage === 'es' 
              ? `Procesando parte ${currentChunk} de ${totalChunks}...`
              : `Processing part ${currentChunk} of ${totalChunks}...`}
          </Text>
          <View style={[styles.progressBarContainer, { backgroundColor: theme.colors.border }]}>
            <Animated.View 
              style={[styles.progressBar, { 
                width: `${progressValue * 100}%`,
                backgroundColor: theme.colors.primary 
              }]} 
            />
          </View>
        </Modal>

        <Modal
          visible={confirmModalVisible}
          onDismiss={() => setConfirmModalVisible(false)}
          contentContainerStyle={[styles.modalContainer, { 
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border 
          }]}
        >
          <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
            {currentLanguage === 'es' ? 'Tarjetas incompletas' : 'Incomplete Flashcards'}
          </Text>
          <Text style={[styles.modalMessage, { color: theme.colors.textSecondary }]}>
            {currentLanguage === 'es'
              ? 'Algunas tarjetas tienen contenido vacío. ¿Deseas continuar de todos modos?'
              : 'Some flashcards have empty content. Would you like to continue anyway?'}
          </Text>
          <View style={styles.modalButtonsContainer}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setConfirmModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>
                {currentLanguage === 'es' ? 'Cancelar' : 'Cancel'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => {
                setConfirmModalVisible(false);
                saveCollection();
              }}
            >
              <Text style={styles.modalButtonText}>
                {currentLanguage === 'es' ? 'Continuar' : 'Continue'}
              </Text>
            </TouchableOpacity>
          </View>
        </Modal>
      </Portal>
      <View style={[styles.header, { backgroundColor: theme.colors.background }]}>
        <TouchableOpacity onPress={() => {
          if (id) {
            router.replace({ 
              pathname: '/(subtabs)/lessons' as any, 
              params: { 
                id,
                refresh: Date.now().toString()
              } 
            });
          } else {
            router.back();
          }
        }} style={[styles.closeButton, { backgroundColor: theme.colors.border }]}>
          <Ionicons name="close" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          {id ? t.editCollection : t.createCollection}
        </Text>
        {id && (
          <TouchableOpacity 
            onPress={confirmDelete}
            style={styles.deleteButton}
            disabled={isDeleting}
          >
            <Ionicons name="trash-outline" size={24} color="#FF453A" />
          </TouchableOpacity>
        )}
      </View>

      <View style={[styles.form, { backgroundColor: theme.colors.background }]}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.text }]}>Loading collection...</Text>
          </View>
        ) : (
          <>
            <View style={styles.formColumns}>
              {/* Left Column */}
              <View style={styles.leftColumn}>
                <FormSection 
                  label={t.addCover}
                  content={
                    <TouchableOpacity style={[styles.coverUpload, { 
                      backgroundColor: theme.colors.card,
                      borderColor: theme.colors.border 
                    }]}>
                      <Ionicons name="image-outline" size={32} color={theme.colors.text} style={styles.coverIcon} />
                      <Text style={[styles.uploadText, { color: theme.colors.text }]}>{t.selectImage}</Text>
                    </TouchableOpacity>
                  }
                />
              </View>

              {/* Right Column */}
              <View style={styles.rightColumn}>
                <FormSection 
                  label={t.collectionName}
                  content={
                    <TextInput
                      style={[styles.input, { 
                        backgroundColor: theme.colors.card,
                        color: theme.colors.text,
                        borderColor: theme.colors.border 
                      }]}
                      placeholder={t.collectionNamePlaceholder}
                      placeholderTextColor={theme.colors.textSecondary}
                      value={collection.name}
                      onChangeText={(text) => handleCollectionChange('name', text)}
                    />
                  }
                />

                <FormSection 
                  label={t.makePublic}
                  content={
                    <View style={[styles.toggleContainer, { 
                      backgroundColor: theme.colors.card,
                      borderColor: theme.colors.border 
                    }]}>
                      <Text style={[styles.toggleLabel, { color: theme.colors.text }]}>{t.shareWithEveryone}</Text>
                      <Switch
                        value={collection.is_public}
                        onValueChange={(value) => handleCollectionChange('is_public', value)}
                        trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                        thumbColor={collection.is_public ? '#FFFFFF' : theme.colors.textSecondary}
                        ios_backgroundColor={theme.colors.border}
                      />
                    </View>
                  }
                />

                <FormSection 
                  label={t.selectLanguage}
                  content={
                    renderLanguageSelector()
                  }
                />
              </View>
            </View>

            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t.flashcards}</Text>
            <View style={[styles.cardsSection, { backgroundColor: theme.colors.background }]}>
              <View style={[styles.tabBar, { backgroundColor: theme.colors.card }]}>
                <TouchableOpacity 
                  style={styles.tab} 
                  onPress={() => {
                    Animated.spring(slideAnimation, {
                      toValue: 0,
                      useNativeDriver: true,
                      tension: 100,
                      friction: 10
                    }).start();
                    setActiveTab('assistant');
                  }}
                >
                  <Text style={[
                    styles.tabText, 
                    { color: activeTab === 'assistant' ? theme.colors.primary : theme.colors.textSecondary }
                  ]}>
                    Asistente didáctico Zappy
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.tab} 
                  onPress={() => {
                    Animated.spring(slideAnimation, {
                      toValue: 1,
                      useNativeDriver: true,
                      tension: 100,
                      friction: 10
                    }).start();
                    setActiveTab('manual');
                  }}
                >
                  <Text style={[
                    styles.tabText, 
                    { color: activeTab === 'manual' ? theme.colors.primary : theme.colors.textSecondary }
                  ]}>
                    Continuar por mi cuenta
                  </Text>
                </TouchableOpacity>

                <Animated.View style={[styles.indicator, {
                  backgroundColor: theme.colors.primary,
                  transform: [{
                    translateX: slideAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, Dimensions.get('window').width / 2]
                    })
                  }]
                }]} />
              </View>

              <ScrollView style={styles.cardsScrollContainer}>
                {activeTab === 'assistant' ? (
                  <View style={[styles.assistantContainer, { 
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.border 
                  }]}>
                    <TextInput
                      style={[
                        styles.assistantInput, 
                        { 
                          backgroundColor: theme.colors.background,
                          color: theme.colors.text,
                          borderColor: validationErrors.content ? '#FF4B4B' : theme.colors.border 
                        }
                      ]}
                      multiline
                      placeholder="Describe el contenido que deseas para tus flashcards..."
                      placeholderTextColor={theme.colors.textSecondary}
                      value={contentInput}
                      onChangeText={(text) => {
                        setContentInput(text);
                        if (validationErrors.content) {
                          setValidationErrors(prev => ({ ...prev, content: '' }));
                        }
                      }}
                    />
                    {validationErrors.content && (
                      <Text style={styles.errorText}>{validationErrors.content}</Text>
                    )}
                    <TouchableOpacity
                      style={[
                        styles.generateButton, 
                        { backgroundColor: theme.colors.primary },
                        isGenerating && styles.generateButtonDisabled
                      ]}
                      onPress={handleGeneratedCards}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.generateButtonText}>Generate Flashcards</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    {cards.map((card, index) => (
                      <CardItem 
                        key={card.id}
                        card={card}
                        index={index + 1}
                        placeholders={{ front: t.frontContent, back: t.backContent }}
                        onChangeField={(field, value) => handleCardChange(card.id, field as keyof Card, value)}
                        onDelete={() => handleDeleteCard(card.id)}
                        deleteBtnText={t.deleteCard}
                        theme={theme}
                      />
                    ))}
                    <TouchableOpacity 
                      style={[styles.addButton, { 
                        borderColor: theme.colors.primary,
                        backgroundColor: `${theme.colors.primary}20`
                      }]} 
                      onPress={handleAddCard}
                    >
                      <Text style={[styles.addButtonText, { color: theme.colors.primary }]}>
                        {t.addFlashcard}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </ScrollView>
              
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.saveButton, 
                  { backgroundColor: theme.colors.primary },
                  isSubmitting && styles.buttonDisabled
                ]}
                onPress={handleSave}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>{id ? t.saveChanges : t.create}</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
      <TopicSelectorModal />
    </ScrollView>
  );
}

const FormSection = ({ label, content }: { label: string, content: React.ReactNode }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    {content}
  </View>
);

// Modified CardItem component with side-by-side layout
const CardItem = ({ 
  card, 
  index,
  placeholders,
  onChangeField, 
  onDelete,
  deleteBtnText,
  theme
}: { 
  card: Card, 
  index: number,
  placeholders: { front: string, back: string },
  onChangeField: (field: string, value: string) => void, 
  onDelete: () => void,
  deleteBtnText: string,
  theme: any
}) => (
  <View style={[styles.cardContainer, { 
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.border 
  }]}>
    <View style={styles.cardHeader}>
      <Text style={[styles.cardTitle, { color: theme.colors.text }]}>#{index}</Text>
      <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
        <Text style={styles.deleteButtonText}>{deleteBtnText}</Text>
      </TouchableOpacity>
    </View>
    <View style={styles.cardContentRow}>
      <View style={styles.cardSideColumn}>
        <Text style={[styles.cardSideLabel, { color: theme.colors.text }]}>Front</Text>
        <TextInput
          style={[styles.cardInput, { 
            backgroundColor: theme.colors.background,
            color: theme.colors.text,
            borderColor: theme.colors.border 
          }]}
          placeholder={placeholders.front}
          placeholderTextColor={theme.colors.textSecondary}
          value={card.front_content}
          onChangeText={(text) => onChangeField('front_content', text)}
          multiline
        />
      </View>
      
      <View style={[styles.cardVerticalDivider, { backgroundColor: theme.colors.border }]} />
      
      <View style={styles.cardSideColumn}>
        <Text style={[styles.cardSideLabel, { color: theme.colors.text }]}>Back</Text>
        <TextInput
          style={[styles.cardInput, { 
            backgroundColor: theme.colors.background,
            color: theme.colors.text,
            borderColor: theme.colors.border 
          }]}
          placeholder={placeholders.back}
          placeholderTextColor={theme.colors.textSecondary}
          value={card.back_content}
          onChangeText={(text) => onChangeField('back_content', text)}
          multiline
        />
      </View>
    </View>
  </View>
);