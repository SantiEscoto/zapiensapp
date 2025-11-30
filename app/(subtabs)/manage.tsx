import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Button, TextInput, Portal, Modal, Checkbox, ActivityIndicator, Switch } from 'react-native-paper';
import { supabase } from '../../src/services/supabase';
import { useLocalSearchParams, router } from 'expo-router';
import { generateFolderNotes } from '../../src/services/ai/integration/openrouter';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

interface Collection {
  id: string;
  name: string;
  topics: string[];
}

export default function ManageScreen() {
  const { id } = useLocalSearchParams();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [allCollections, setAllCollections] = useState<Collection[]>([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        console.log('Starting to load data...');
        await fetchAllCollections();
        
        if (id) {
          console.log('Loading folder data for id:', id);
          await fetchFolderData();
          setIsEditing(true);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const fetchAllCollections = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      console.log('Fetching collections for user:', user.id);
      const { data, error } = await supabase
        .from('collections')
        .select('id, name, topics')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('Collections fetched:', data);
      setAllCollections(data || []);
    } catch (error: any) {
      console.error('Error fetching collections:', error?.message);
      setError(error?.message || 'Error al cargar las colecciones');
    }
  };

  const fetchFolderData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setNewFolderName(data.name);
      setSelectedCollections(data.collection_ids);
      setIsPublic(data.is_public);
    } catch (error) {
      console.error('Error fetching folder:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsGeneratingNotes(true);
      setGenerationError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Obtener información completa de las colecciones seleccionadas
      const selectedCollectionsInfo = allCollections
        .filter(c => selectedCollections.includes(c.id))
        .map(({ name, topics }) => ({ 
          id: '', // No necesitamos el ID para la generación
          name, 
          topics,
          description: '' // Añadimos la propiedad description requerida
        }));

      // Generar apuntes
      const { notes, error: notesError } = await generateFolderNotes(selectedCollectionsInfo);
      
      if (notesError) {
        setGenerationError(notesError);
        return;
      }

      if (isEditing) {
        const { error } = await supabase
          .from('folders')
          .update({
            name: newFolderName,
            collection_ids: selectedCollections,
            is_public: isPublic,
            description: notes
          })
          .eq('id', id);

        if (error) throw error;
        router.replace(`/(subtabs)/lands?id=${id}`);
      } else {
        const { data, error } = await supabase
          .from('folders')
          .insert({
            name: newFolderName,
            user_id: user.id,
            collection_ids: selectedCollections,
            is_public: isPublic,
            description: notes
          })
          .select()
          .single();

        if (error) throw error;
        router.replace(`/(subtabs)/lands?id=${data.id}`);
      }
    } catch (error) {
      console.error('Error saving folder:', error);
      setGenerationError('Error al guardar la carpeta');
    } finally {
      setIsGeneratingNotes(false);
    }
  };

  const toggleCollectionSelection = (collectionId: string) => {
    setSelectedCollections(prev =>
      prev.includes(collectionId)
        ? prev.filter(id => id !== collectionId)
        : [...prev, collectionId]
    );
  };

  const goBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.background }]}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          {isEditing ? 'Edit Folder' : 'Create New Folder'}
        </Text>
      </View>

      <View style={[styles.formContainer, { 
        backgroundColor: theme.colors.card,
        borderColor: theme.colors.border 
      }]}>
        <View style={styles.formGroup}>
          <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Folder Name</Text>
          <TextInput
            value={newFolderName}
            onChangeText={setNewFolderName}
            style={[styles.input, { 
              backgroundColor: theme.colors.background,
              color: theme.colors.text,
              borderColor: theme.colors.border
            }]}
            placeholder="Enter folder name"
            placeholderTextColor={theme.colors.textSecondary}
          />
        </View>

        <View style={styles.formGroup}>
          <View style={styles.switchContainer}>
            <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Make Folder Public</Text>
            <Switch
              value={isPublic}
              onValueChange={setIsPublic}
              color={theme.colors.primary}
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Select Collections</Text>
          <View style={[styles.collectionsWrapper, { 
            backgroundColor: theme.colors.background,
            borderColor: theme.colors.border
          }]}>
            <ScrollView style={styles.collectionsContainer}>
              {allCollections.map((collection) => (
                <View key={collection.id} style={styles.checkboxContainer}>
                  <Checkbox
                    status={selectedCollections.includes(collection.id) ? 'checked' : 'unchecked'}
                    onPress={() => toggleCollectionSelection(collection.id)}
                    color={theme.colors.primary}
                  />
                  <Text style={[styles.collectionName, { color: theme.colors.text }]}>{collection.name}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>

        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        {generationError && (
          <Text style={styles.errorText}>{generationError}</Text>
        )}

        <TouchableOpacity 
          style={[
            styles.updateButton, 
            { backgroundColor: theme.colors.primary },
            (!newFolderName.trim() || selectedCollections.length === 0) && styles.updateButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={!newFolderName.trim() || selectedCollections.length === 0 || isGeneratingNotes}
        >
          <Text style={[
            styles.updateButtonText,
            (!newFolderName.trim() || selectedCollections.length === 0) && styles.updateButtonTextDisabled
          ]}>
            {isGeneratingNotes 
              ? 'Generando apuntes...' 
              : isEditing 
                ? 'Save Changes' 
                : 'Create'
            }
          </Text>
        </TouchableOpacity>
      </View>

      <Portal>
        <Modal
          visible={isGeneratingNotes}
          onDismiss={() => {}}
          contentContainerStyle={[styles.modalContainer, { 
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border 
          }]}
        >
          <View style={styles.generationContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.generationTitle, { color: theme.colors.text }]}>
              Generando Apuntes
            </Text>
            <Text style={[styles.generationText, { color: theme.colors.textSecondary }]}>
              Estamos creando tus apuntes personalizados. Esto puede tomar unos minutos...
            </Text>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 24,
    textAlign: 'center',
    fontFamily: 'DINNextRoundedLTPro-Bold',
  },
  formContainer: {
    margin: 16,
    padding: 20,
    borderRadius: 14,
    borderWidth: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formGroup: {
    marginBottom: 16,
  },
  settingLabel: {
    fontSize: 16,
    marginBottom: 8,
    fontFamily: 'DINNextRoundedLTPro-Regular',
  },
  input: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'DINNextRoundedLTPro-Regular',
    width: '100%',
    borderWidth: 1,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  collectionsWrapper: {
    height: 200,
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 8,
  },
  collectionsContainer: {
    flex: 1,
    padding: 12,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  collectionName: {
    marginLeft: 8,
    fontSize: 16,
    fontFamily: 'DINNextRoundedLTPro-Regular',
  },
  updateButton: {
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  updateButtonDisabled: {
    opacity: 0.5,
    backgroundColor: '#37464f',
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'DINNextRoundedLTPro-Bold',
  },
  updateButtonTextDisabled: {
    color: '#A0A0A0',
  },
  errorText: {
    color: '#ff4444',
    marginTop: 8,
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'DINNextRoundedLTPro-Regular',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  generationContainer: {
    alignItems: 'center',
    padding: 20,
  },
  generationTitle: {
    fontSize: 24,
    fontFamily: 'DINNextRoundedLTPro-Bold',
    marginTop: 20,
    marginBottom: 12,
  },
  generationText: {
    fontSize: 16,
    fontFamily: 'DINNextRoundedLTPro-Regular',
    textAlign: 'center',
    lineHeight: 24,
  },
});