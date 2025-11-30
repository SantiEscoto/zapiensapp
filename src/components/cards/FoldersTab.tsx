import React, { useState, useEffect } from 'react';
import { View, ScrollView, ActivityIndicator } from 'react-native';
import { Card, Text, IconButton, Button, TextInput, Portal, Modal } from 'react-native-paper';
import { supabase } from '../../services/supabase';
import { StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

interface Folder {
  id: string;
  name: string;
  collection_ids: string[];
}

export default function FoldersTab() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [folderModalVisible, setFolderModalVisible] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  useEffect(() => {
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('folders')
        .select('id, name, collection_ids')
        .eq('user_id', user.id);

      if (error) throw error;
      setFolders(data || []);
    } catch (error: any) {
      console.error('Error fetching folders:', error?.message);
    } finally {
      setLoading(false);
    }
  };

  const createFolder = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('folders')
        .insert({
          name: newFolderName,
          user_id: user.id,
          collection_ids: []
        });

      if (error) throw error;
      setNewFolderName('');
      setFolderModalVisible(false);
      fetchFolders();
    } catch (error: any) {
      console.error('Error creating folder:', error?.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Button
        mode="contained"
        onPress={() => setCreateModalVisible(true)}
        style={styles.createButton}
      >
        Create New
      </Button>

      <ScrollView>
        {folders.map((folder) => (
          <Card key={folder.id} style={styles.card}>
            <Card.Title
              title={folder.name}
              right={(props) => (
                <IconButton
                  {...props}
                  icon="folder"
                  onPress={() => console.log('Open folder', folder.id)}
                />
              )}
            />
            <Card.Content>
              <Text variant="bodyMedium">
                {folder.collection_ids.length} collections
              </Text>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>

      <Portal>
        {/* Create Options Modal */}
        <Modal
          visible={createModalVisible}
          onDismiss={() => setCreateModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>
            What do you want to create?
          </Text>
          <Button
            mode="contained"
            onPress={() => {
              setCreateModalVisible(false);
              router.push('/(subtabs)/edit');
            }}
            style={styles.optionButton}
          >
            New Collection
          </Button>
          <Button
            mode="contained"
            onPress={() => {
              setCreateModalVisible(false);
              setFolderModalVisible(true);
            }}
            style={styles.optionButton}
          >
            New Folder
          </Button>
        </Modal>

        {/* Folder Creation Modal */}
        <Modal
          visible={folderModalVisible}
          onDismiss={() => setFolderModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>
            Create New Folder
          </Text>
          <TextInput
            label="Folder Name"
            value={newFolderName}
            onChangeText={setNewFolderName}
            style={styles.input}
          />
          <Button
            mode="contained"
            onPress={createFolder}
            style={styles.submitButton}
            disabled={!newFolderName.trim()}
          >
            Create
          </Button>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#131f24',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#131f24',
  },
  createButton: {
    marginBottom: 16,
    backgroundColor: '#1CB0F6',
  },
  card: {
    marginBottom: 12,
    backgroundColor: '#202f36',
    borderWidth: 2,
    borderColor: '#37464f',
  },
  modalContainer: {
    backgroundColor: '#202f36',
    padding: 20,
    margin: 20,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#37464f',
  },
  modalTitle: {
    marginBottom: 16,
    textAlign: 'center',
    color: '#FFFFFF',
    fontFamily: 'DINNextRoundedLTPro-Bold',
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#37464f',
  },
  submitButton: {
    marginTop: 8,
    backgroundColor: '#1CB0F6',
  },
  optionButton: {
    marginVertical: 8,
    backgroundColor: '#1CB0F6',
  },
});