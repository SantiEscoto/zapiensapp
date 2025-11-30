import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, useWindowDimensions, Alert } from 'react-native';
import { Text, ActivityIndicator, IconButton, Portal, Modal, TextInput, Switch, Button, Checkbox } from 'react-native-paper';
import { supabase } from '../../src/services/supabase';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import Markdown from 'react-native-markdown-display';

interface Collection {
  id: string;
  name: string;
  topics: string[];
}

interface Folder {
  id: string;
  name: string;
  collection_ids: string[];
  is_public: boolean;
  description?: string;
}

export default function LandsScreen() {
  const [loading, setLoading] = useState(true);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [folder, setFolder] = useState<Folder | null>(null);
  const [allCollections, setAllCollections] = useState<Collection[]>([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [notesModalVisible, setNotesModalVisible] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [folderDescription, setFolderDescription] = useState<string | null>(null);
  const { height } = useWindowDimensions();
  const { id } = useLocalSearchParams();
  const { theme } = useTheme();

  useEffect(() => {
    if (id) {
      fetchFolderAndCollections();
      fetchAllCollections();
    }
  }, [id]);

  const fetchAllCollections = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('collections')
        .select('id, name, topics')
        .eq('user_id', user.id);

      if (error) throw error;
      setAllCollections(data || []);
    } catch (error: any) {
      console.error('Error fetching collections:', error?.message);
    }
  };

  const fetchFolderAndCollections = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      let { data: folders, error: foldersError } = await supabase
        .from('folders')
        .select('*')
        .eq('id', id)
        .or(`user_id.eq.${user.id},is_public.eq.true`)
        .single();

      if (foldersError) throw foldersError;
      if (!folders) {
        setLoading(false);
        return;
      }

      setFolder(folders);
      setNewFolderName(folders.name);
      setSelectedCollections(folders.collection_ids);
      setIsPublic(folders.is_public);
      setFolderDescription(folders.description);

      const { data: collectionsData, error: collectionsError } = await supabase
        .from('collections')
        .select('*')
        .in('id', folders.collection_ids)
        .or(`user_id.eq.${user.id},is_public.eq.true`);

      if (collectionsError) throw collectionsError;
      setCollections(collectionsData || []);
    } catch (error: any) {
      console.error('Error fetching data:', error?.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('folders')
        .update({
          name: newFolderName,
          collection_ids: selectedCollections,
          is_public: isPublic
        })
        .eq('id', id);

      if (error) throw error;

      await fetchFolderAndCollections();
      setEditModalVisible(false);
    } catch (error) {
      console.error('Error saving folder:', error);
    }
  };

  const toggleCollectionSelection = (collectionId: string) => {
    setSelectedCollections(prev =>
      prev.includes(collectionId)
        ? prev.filter(id => id !== collectionId)
        : [...prev, collectionId]
    );
  };

  const navigateToLesson = (collectionId: string) => {
    router.push({ pathname: '/(subtabs)/lessons', params: { id: collectionId } });
  };

  const goBack = () => {
    router.back();
  };

  const handleDeleteFolder = async () => {
    try {
      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', id);

      if (error) throw error;

      router.replace('/(main)/home');
    } catch (error) {
      console.error('Error al eliminar la carpeta:', error);
      Alert.alert(
        'Error',
        'No se pudo eliminar la carpeta. Por favor, inténtalo de nuevo.'
      );
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!folder) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.emptyText, { color: theme.colors.text }]}>No folders found. Create a folder first!</Text>
      </View>
    );
  }

  return (
    <>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.header, { backgroundColor: theme.colors.background }]}>
          <IconButton
            icon="arrow-left"
            size={24}
            iconColor={theme.colors.text}
            onPress={goBack}
            style={styles.backButton}
          />
          <Text style={[styles.title, { color: theme.colors.text }]}>{folder.name}</Text>
          <TouchableOpacity 
            style={[styles.headerButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => setEditModalVisible(true)}
          >
            <Text style={styles.headerButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.notesButtonContainer}>
          <TouchableOpacity 
            style={[styles.notesButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => setNotesModalVisible(true)}
          >
            <Text style={styles.notesButtonTitle}>Inicio de los Apuntes</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollContainer}>
          <View style={[styles.pathContainer, { minHeight: height * 0.8 }]}>
            {collections.map((collection) => (
              <View key={collection.id} style={styles.itemContainer}>
                <TouchableOpacity
                  style={[styles.circle, { 
                    backgroundColor: theme.colors.primary,
                    borderColor: theme.colors.primary
                  }]}
                  onPress={() => navigateToLesson(collection.id)}
                />
                <Text style={[styles.collectionName, { color: theme.colors.text }]}>
                  {collection.name}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      <Portal>
        <Modal
          visible={notesModalVisible}
          onDismiss={() => setNotesModalVisible(false)}
          contentContainerStyle={[styles.modalContainer, { 
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border 
          }]}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Apuntes de la Carpeta</Text>
            <TouchableOpacity onPress={() => setNotesModalVisible(false)}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.notesContent}>
            {folderDescription ? (
              <Markdown 
                style={{
                  body: { ...styles.notesText, color: theme.colors.text },
                  heading1: { ...styles.notesHeading1, color: theme.colors.text },
                  heading2: { ...styles.notesHeading2, color: theme.colors.text },
                  heading3: { ...styles.notesHeading3, color: theme.colors.text },
                  strong: { ...styles.notesBold, color: theme.colors.text },
                  em: { ...styles.notesItalic, color: theme.colors.text },
                  bullet_list: { ...styles.notesList, color: theme.colors.text },
                  ordered_list: { ...styles.notesList, color: theme.colors.text },
                  list_item: { ...styles.notesListItem, color: theme.colors.text },
                  code: { 
                    ...styles.notesCode,
                    color: theme.colors.text,
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border
                  },
                  code_inline: { 
                    ...styles.notesCodeInline,
                    color: theme.colors.text,
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border
                  },
                }}
              >
                {folderDescription}
              </Markdown>
            ) : (
              <Text style={[styles.notesText, { color: theme.colors.textSecondary }]}>
                No hay apuntes disponibles para esta carpeta.
              </Text>
            )}
          </ScrollView>
        </Modal>
      </Portal>

      <Portal>
        <Modal
          visible={editModalVisible}
          onDismiss={() => setEditModalVisible(false)}
          contentContainerStyle={[styles.modalContainer, { 
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border 
          }]}
        >
          <ScrollView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Edit Folder</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Folder Name</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.colors.background,
                  color: theme.colors.text,
                  borderColor: theme.colors.border
                }]}
                value={newFolderName}
                onChangeText={setNewFolderName}
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
                borderColor: theme.colors.border,
                borderWidth: 1,
                borderRadius: 8
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

            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[
                  styles.updateButton, 
                  { backgroundColor: theme.colors.primary },
                  (!newFolderName.trim() || selectedCollections.length === 0) && styles.updateButtonDisabled
                ]}
                onPress={handleSaveChanges}
                disabled={!newFolderName.trim() || selectedCollections.length === 0}
              >
                <Text style={[
                  styles.updateButtonText,
                  (!newFolderName.trim() || selectedCollections.length === 0) && styles.updateButtonTextDisabled
                ]}>Save Changes</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.deleteButton, { backgroundColor: theme.colors.error }]}
                onPress={handleDeleteFolder}
              >
                <Text style={styles.deleteButtonText}>Delete Folder</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Modal>
      </Portal>
    </>
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
  },
  backButton: {
    marginRight: 8,
  },
  scrollContainer: {
    flex: 1,
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
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'DINNextRoundedLTPro-Regular',
  },
  title: {
    flex: 1,
    fontSize: 24,
    textAlign: 'center',
    marginVertical: 20,
    fontFamily: 'DINNextRoundedLTPro-Bold',
  },
  pathContainer: {
    paddingHorizontal: 40,
    paddingVertical: 20,
    alignItems: 'center',
  },
  itemContainer: {
    position: 'relative',
    marginVertical: 30,
    height: 80,
    width: '100%',
    alignItems: 'center',
  },
  circle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
  },
  collectionName: {
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
    fontFamily: 'DINNextRoundedLTPro-Regular',
  },
  editButton: { 
    padding: 10, 
    borderRadius: 8 
  },
  editButtonText: { 
    color: '#FFFFFF', 
    fontSize: 16, 
    fontFamily: 'DINNextRoundedLTPro-Bold' 
  },
  modalContainer: {
    margin: 20,
    borderRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalContent: {
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: 'DINNextRoundedLTPro-Bold',
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
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'DINNextRoundedLTPro-Bold',
  },
  notesContent: {
    flex: 1,
    padding: 16,
  },
  notesText: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'DINNextRoundedLTPro-Regular',
  },
  notesHeading1: {
    fontSize: 28,
    lineHeight: 36,
    marginTop: 24,
    marginBottom: 16,
    fontFamily: 'DINNextRoundedLTPro-Bold',
  },
  notesHeading2: {
    fontSize: 24,
    lineHeight: 32,
    marginTop: 20,
    marginBottom: 12,
    fontFamily: 'DINNextRoundedLTPro-Bold',
  },
  notesHeading3: {
    fontSize: 20,
    lineHeight: 28,
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'DINNextRoundedLTPro-Bold',
  },
  notesBold: {
    fontFamily: 'DINNextRoundedLTPro-Bold',
  },
  notesItalic: {
    fontStyle: 'italic',
  },
  notesList: {
    marginLeft: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  notesListItem: {
    marginVertical: 4,
  },
  notesCode: {
    fontFamily: 'Menlo',
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    marginVertical: 8,
  },
  notesCodeInline: {
    fontFamily: 'Menlo',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  buttonContainer: {
    gap: 12,
    marginTop: 20,
  },
  deleteButton: {
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#FF3B30',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'DINNextRoundedLTPro-Bold',
  },
  notesButtonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  notesButton: {
    width: '100%',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notesButtonTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: 'DINNextRoundedLTPro-Bold',
  },
});