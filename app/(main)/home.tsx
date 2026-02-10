import { View, Text, TouchableOpacity, StyleSheet, Animated, ScrollView, TextInput, ActivityIndicator, Image, useWindowDimensions, Alert, Platform } from 'react-native';
import { Portal, Modal } from 'react-native-paper';
import { useState, useRef, useEffect, useCallback, memo, useMemo } from 'react';
import debounce from 'lodash/debounce';
import { router, useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../src/services/supabase';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../../src/services/fonts';
import { useTheme } from '../../src/context/ThemeContext';
import { generateCollectionInfo } from '../../src/services/ai/integration/openrouter';
import React from 'react';
import { useCollections } from '../../src/context/CollectionsContext';

// Types
interface Collection {
  id: string;
  name: string;
  topics: string[];
  cover_url?: string;
  created_at: string;
  terms_count?: number;
}

interface Folder {
  id: string;
  name: string;
  collection_ids: string[];
}

// Constants
// Language flags mapping
const LANGUAGE_FLAGS = {
  'German': require('../../assets/flags/de.png'),
  'Portuguese': require('../../assets/flags/pt.png'),
  'Spanish': require('../../assets/flags/es.png'),
  'French': require('../../assets/flags/fr.png'),
  'Italian': require('../../assets/flags/it.png'),
  'Japanese': require('../../assets/flags/ja.png'),
  'Chinese': require('../../assets/flags/zh.png'),
  'Korean': require('../../assets/flags/ko.png'),
  'Russian': require('../../assets/flags/ru.png'),
  'English': require('../../assets/flags/en.png'),
};

// Theme images mapping
const THEME_IMAGES = {
  'Sports': require('../../assets/Themes/sports.png'),
  'History': require('../../assets/Themes/history.png'),
  'Art': require('../../assets/Themes/art.png'),
  'Science': require('../../assets/Themes/science.png'),
  'Culture': require('../../assets/Themes/culture.png'),
  'Nature': require('../../assets/Themes/nature.png'),
  'Geography': require('../../assets/Themes/geography.png'),
};

// Helper functions
const getLanguageFlag = (topic: string) => {
  // Si el tema es un idioma, devolver la bandera correspondiente
  const languageFlags: Record<string, any> = {
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

  return languageFlags[topic] || require('../../assets/icons/home.png');
};

// Reusable components
// Add this new helper function near the top of the file, after THEME_IMAGES
const generateBackgroundColor = (id: string) => {
  // Use the collection id to generate a consistent hue
  const hue = parseInt(id.substring(0, 8), 16) % 360;
  return `hsl(${hue}, 70%, 50%)`;
};

// Update the CollectionCard component
const CollectionCard = memo(({ collection, onPress }: { collection: Collection, onPress: () => void }) => {
  // Memoize the background color based on collection id
  const backgroundColor = useMemo(() => {
    return collection.cover_url ? undefined : generateBackgroundColor(collection.id);
  }, [collection.id, collection.cover_url]);

  // Filtrar solo los idiomas de los temas
  const languageTopics = useMemo(() => {
    return collection.topics.filter(topic => 
      Object.keys(LANGUAGE_FLAGS).includes(topic)
    );
  }, [collection.topics]);
  
  return (
    <TouchableOpacity 
      style={styles.collectionCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={{ flex: 1 }}>
        <View style={[styles.coverContainer, { backgroundColor }]}> 
          <View style={styles.flagContainer}>
            {languageTopics.length > 0 ? (
              <View style={styles.flagsRow}>
                {languageTopics.slice(0, 3).map((language, index) => (
                  <Image 
                    key={index}
                    source={LANGUAGE_FLAGS[language as keyof typeof LANGUAGE_FLAGS]} 
                    style={styles.flag} 
                  />
                ))}
                {languageTopics.length > 3 && (
                  <View style={styles.moreFlagsContainer}>
                    <Text style={styles.moreFlagsText}>+{languageTopics.length - 3}</Text>
                  </View>
                )}
              </View>
            ) : (
              <Image source={require('../../assets/icons/home.png')} style={styles.flag} />
            )}
          </View>
          <View style={styles.titleOverlay}>
            <Text style={styles.titleInCover}>{collection.name}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const TopicCard = memo(({ topic, image, onPress }: { topic: string; image: any; onPress: () => void }) => (
  <TouchableOpacity style={styles.topicCard} onPress={onPress}>
    <Image source={image} style={styles.topicImage} resizeMode="cover" />
    <View style={styles.titleOverlay}>
      <Text style={styles.topicText}>{topic}</Text>
    </View>
  </TouchableOpacity>
));

const FolderCard = memo(({ name, onPress, collection_ids }: { name: string, onPress: () => void, collection_ids: string[] }) => (
  <TouchableOpacity style={styles.folderCard} onPress={onPress} activeOpacity={0.7}>
    <Text style={styles.folderName}>{name}</Text>
    <Text style={styles.folderInfo}>{collection_ids.length} collections</Text>
  </TouchableOpacity>
));

const EmptyState = memo(({ onCreatePress }: { onCreatePress: () => void }) => {
  const { theme } = useTheme();
  return (
    <View style={styles.emptyStateContainer}>
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>Bienvenido, aprende a crear con Zapiens</Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
        Diseña tu primera colección de flashcards
      </Text>
      <TouchableOpacity
        style={[
          styles.createButton,
          {
            backgroundColor: theme.colors.primary,
            shadowColor: theme.colors.primary,
            shadowOpacity: 0.55,
            shadowRadius: 14,
            elevation: 14,
          },
        ]}
        onPress={onCreatePress}
        activeOpacity={0.85}
      >
        <Text style={styles.createButtonText}>+</Text>
      </TouchableOpacity>
    </View>
  );
});

const LoadingIndicator = memo(() => {
  const { theme } = useTheme();
  return (
    <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  );
});

const ErrorDisplay = memo(({ message }: { message: string }) => (
  <View style={styles.emptyStateContainer}>
    <Text style={styles.errorText}>{message}</Text>
  </View>
));

const SearchInput = memo(({ value, onChangeText, onSubmit }: { 
  value: string, 
  onChangeText: (text: string) => void,
  onSubmit: (text: string) => void 
}) => {
  const { theme } = useTheme();
  return (
    <View style={styles.searchContainer}>
      <View style={[styles.searchBar, { 
        backgroundColor: theme.colors.card,
        borderColor: theme.colors.border 
      }]}>
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text }]}
          placeholder="Search collections"
          placeholderTextColor={theme.colors.textSecondary}
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={(e) => onSubmit(e.nativeEvent.text)}
          returnKeyType="search"
        />
      </View>
    </View>
  );
});

const TabBar = memo(({ activeTab, onTabChange, slideAnimation }: { 
  activeTab: string;
  onTabChange: (tab: string) => void;
  slideAnimation: Animated.Value;
}) => {
  const { width } = useWindowDimensions();
  const TAB_WIDTH = width / 2;
  const { theme } = useTheme();
  
  return (
    <View style={[styles.tabBar, { 
      backgroundColor: theme.colors.card,
      borderBottomColor: theme.colors.border
    }]}>
      <TouchableOpacity 
        style={[styles.tab, { backgroundColor: theme.colors.card }]} 
        onPress={() => onTabChange('collection')}
      >
        <Text style={[
          styles.tabText,
          { color: theme.colors.textSecondary },
          activeTab === 'collection' && { color: theme.colors.primary }
        ]}>
          COLECCIONES
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.tab, { backgroundColor: theme.colors.card }]} 
        onPress={() => onTabChange('explore')}
      >
        <Text style={[
          styles.tabText,
          { color: theme.colors.textSecondary },
          activeTab === 'explore' && { color: theme.colors.primary }
        ]}>
          EXPLORAR
        </Text>
      </TouchableOpacity>

      <Animated.View style={[
        styles.indicator,
        {
          width: TAB_WIDTH,
          backgroundColor: theme.colors.primary,
          transform: [{
            translateX: slideAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [0, TAB_WIDTH]
            })
          }]
        }
      ]} />
    </View>
  );
});

// Collections Screen Component
const CollectionScreen = memo(({ 
  collections, 
  loading, 
  error, 
  onRefresh,
  activeTab 
}: { 
  collections: Collection[]; 
  loading: boolean; 
  error: string | null; 
  onRefresh: () => Promise<void>;
  activeTab: string;
}) => {
  const router = useRouter();
  const { theme } = useTheme();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [createOptionsVisible, setCreateOptionsVisible] = useState(false);
  const [allCollectionsVisible, setAllCollectionsVisible] = useState(false);
  const [collectionsWithTerms, setCollectionsWithTerms] = useState<Collection[]>([]);
  const [foldersLoaded, setFoldersLoaded] = useState(false);

  const loadFolders = async () => {
    // Solo cargar las carpetas si no se han cargado antes
    if (foldersLoaded) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFolders(data || []);
      setFoldersLoaded(true);
    } catch (error) {
      console.error('Error loading folders:', error);
    }
  };

  // Usar useFocusEffect para recargar las carpetas solo cuando volvemos de otra pantalla
  useFocusEffect(
    useCallback(() => {
      // Resetear el estado de carga cuando volvemos de otra pantalla
      setFoldersLoaded(false);
      loadFolders();
    }, [])
  );

  // Cargar carpetas inicialmente
  useEffect(() => {
    loadFolders();
  }, []);

  // Memoize sorted collections and recent collections
  const { sortedCollections, recentCollections } = useMemo(() => {
    const sorted = [...collections].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return {
      sortedCollections: sorted,
      recentCollections: sorted.slice(0, 4)
    };
  }, [collections]);

  // Rutas en web: sin grupo para URL limpia (/lessons?id=, /lands?id=)
  const ROUTES = { lessons: '/lessons', lands: '/lands', edit: '/(subtabs)/edit', manage: '/(subtabs)/manage' } as const;
  const handleNavigation = useCallback((path: string, params?: Record<string, string>) => {
    if (params?.id != null) {
      const base = path.includes('lessons') ? ROUTES.lessons : path.includes('lands') ? ROUTES.lands : path;
      router.push(`${base}?id=${encodeURIComponent(params.id)}` as any);
    } else {
      // Sin params: navigate para cambiar de (main) a (subtabs) correctamente
      router.navigate(path as any);
    }
  }, [router]);

  // Memoize folder rendering
  const renderFolder = useCallback((folder: Folder) => (
    <FolderCard
      key={folder.id}
      collection_ids={folder.collection_ids}
      name={folder.name}
      onPress={() => handleNavigation(ROUTES.lands, { id: folder.id })}
    />
  ), [handleNavigation]);

  // Memoize collection rendering
  const renderCollection = useCallback((collection: Collection) => (
    <CollectionCard 
      key={collection.id}
      collection={collection}
      onPress={() => handleNavigation(ROUTES.lessons, { id: collection.id })}
    />
  ), [handleNavigation]);

  // Memoize modal handlers
  const handleCreateOptionsClose = useCallback(() => {
    setCreateOptionsVisible(false);
  }, []);

  const handleAllCollectionsClose = useCallback(() => {
    setAllCollectionsVisible(false);
  }, []);

  // Memoize styles
  const styles = useMemo(() => ({
    screenContainer: {
      flex: 1,
      backgroundColor: theme.colors.background
    },
    collectionContainer: {
      flex: 1,
      backgroundColor: theme.colors.background
    },
    recentSection: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      paddingHorizontal: 16,
      marginVertical: 16,
    },
    sectionTitle: {
      fontSize: 20,
      fontFamily: FONTS.title,
      marginVertical: 16,
      paddingHorizontal: 16,
    },
    viewAllButton: {
      padding: 8,
    },
    viewAllText: {
      fontSize: 16,
      fontFamily: FONTS.title,
    },
    collectionGrid: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      justifyContent: 'space-between' as const,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    folderList: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      justifyContent: 'space-between' as const,
      paddingVertical: 8,
      paddingHorizontal: 16,
    },
    emptyFoldersContainer: {
      padding: 16,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 12,
      marginHorizontal: 16,
      marginTop: 8,
    },
    emptyFoldersText: {
      fontFamily: FONTS.body,
      fontSize: 16,
      color: '#8E8E93',
      textAlign: 'center' as const,
      lineHeight: 22,
      padding: 16,
    },
    floatingCreateButton: {
      position: 'absolute' as const,
      bottom: 20,
      right: 20,
      width: 60,
      height: 60,
      borderRadius: 30,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      zIndex: 9999,
    },
    createButtonText: {
      color: 'white',
      fontSize: 40,
      fontFamily: FONTS.title,
    },
    modalContainer: {
      padding: 20,
      margin: 20,
      borderRadius: 14,
      borderWidth: 2,
    },
    modalTitle: {
      fontSize: 20,
      textAlign: 'center' as const,
      fontFamily: FONTS.title,
      marginBottom: 20,
    },
    modalOption: {
      padding: 16,
      borderRadius: 14,
      marginVertical: 8,
      alignItems: 'center' as const,
    },
    modalOptionText: {
      color: 'white',
      fontSize: 16,
      fontFamily: FONTS.title,
    },
    allCollectionsModal: {
      margin: 20,
      borderRadius: 14,
      borderWidth: 2,
      maxHeight: '80%' as const,
    },
    modalHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: '#37464f',
    },
    allCollectionsList: {
      padding: 16,
    },
    collectionListItem: {
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
    },
    collectionListItemContent: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
    },
    collectionListItemInfo: {
      flex: 1,
    },
    collectionListItemTitle: {
      fontSize: 16,
      fontFamily: FONTS.title,
      marginBottom: 4,
    },
    collectionListItemDate: {
      fontSize: 14,
      fontFamily: FONTS.body,
    },
    collectionListItemFlag: {
      width: 24,
      height: 24,
      borderRadius: 3,
    },
    createOptionsOverlayFixed: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 99999,
      elevation: 99999,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      padding: 20,
    },
    createOptionsCard: {
      width: '100%' as const,
      maxWidth: 320,
      padding: 24,
      borderRadius: 14,
      borderWidth: 2,
    },
  }), [theme.colors.background]);

  // Memoize fetchCollections callback
  const memoizedFetchCollections = useCallback(async () => {
    await onRefresh();
  }, [onRefresh]);

  // Load data only when needed
  useEffect(() => {
    const loadCollectionsWithTerms = async () => {
      if (!allCollectionsVisible) return;

      const collectionsWithTermsData = await Promise.all(
        sortedCollections.map(async (collection) => {
          const { count, error } = await supabase
            .from('cards')
            .select('*', { count: 'exact', head: true })
            .eq('collection_id', collection.id);
          
          if (error) {
            console.error('Error counting cards:', error);
            return { ...collection, terms_count: 0 };
          }
          
          return { ...collection, terms_count: count || 0 };
        })
      );
      setCollectionsWithTerms(collectionsWithTermsData);
    };

    loadCollectionsWithTerms();
  }, [allCollectionsVisible, sortedCollections]);

  if (loading) return <LoadingIndicator />;
  if (error) return <ErrorDisplay message={error} />;
  if (collections.length === 0) {
    return (
      <View style={styles.screenContainer}>
        <EmptyState onCreatePress={() => setCreateOptionsVisible(true)} />
        {createOptionsVisible && (
          <View style={styles.createOptionsOverlayFixed} pointerEvents="box-none">
            <TouchableOpacity
              style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
              activeOpacity={1}
              onPress={handleCreateOptionsClose}
            />
            <View
              style={[
                styles.createOptionsCard,
                { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
              ]}
            >
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>¿Qué quieres crear?</Text>
              <TouchableOpacity
                style={[styles.modalOption, { backgroundColor: theme.colors.primary }]}
                onPress={() => {
                  handleCreateOptionsClose();
                  requestAnimationFrame(() => handleNavigation(ROUTES.edit));
                }}
              >
                <Text style={styles.modalOptionText}>Nueva Colección</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalOption, { backgroundColor: theme.colors.primary }]}
                onPress={() => {
                  handleCreateOptionsClose();
                  requestAnimationFrame(() => handleNavigation(ROUTES.manage));
                }}
              >
                <Text style={styles.modalOptionText}>Nueva Carpeta</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.screenContainer}>
      <ScrollView style={styles.collectionContainer}>
        <View style={styles.recentSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Creados Recientemente</Text>
          <TouchableOpacity 
            onPress={() => setAllCollectionsVisible(true)}
            style={styles.viewAllButton}
          >
            <Text style={[styles.viewAllText, { color: theme.colors.primary }]}>Ver todas</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.collectionGrid}>
          {recentCollections.map(renderCollection)}
        </View>

        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Mis colecciones</Text>
        {folders.length > 0 ? (
          <View style={styles.folderList}>
            {folders.map(renderFolder)}
          </View>
        ) : (
          <View style={styles.emptyFoldersContainer}>
            <Text style={styles.emptyFoldersText}>
              Las carpetas que crees para organizar tus lecciones aparecerán aquí
            </Text>
          </View>
        )}
      </ScrollView>
      
      <TouchableOpacity 
        style={[
          styles.floatingCreateButton,
          {
            backgroundColor: theme.colors.primary,
            shadowColor: theme.colors.primary,
            shadowOpacity: 0.55,
            shadowRadius: 14,
            elevation: 14,
          },
        ]}
        onPress={() => setCreateOptionsVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.createButtonText}>+</Text>
      </TouchableOpacity>

      {/* Selector Nueva Colección / Nueva Carpeta: overlay con zIndex alto para web y móvil */}
      {createOptionsVisible && (
        <View style={styles.createOptionsOverlayFixed} pointerEvents="box-none">
          <TouchableOpacity
            style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
            activeOpacity={1}
            onPress={handleCreateOptionsClose}
          />
          <View
            style={[
              styles.createOptionsCard,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>¿Qué quieres crear?</Text>
            <TouchableOpacity
              style={[styles.modalOption, { backgroundColor: theme.colors.primary }]}
              onPress={() => {
                handleCreateOptionsClose();
                requestAnimationFrame(() => handleNavigation(ROUTES.edit));
              }}
            >
              <Text style={styles.modalOptionText}>Nueva Colección</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalOption, { backgroundColor: theme.colors.primary }]}
              onPress={() => {
                handleCreateOptionsClose();
                requestAnimationFrame(() => handleNavigation(ROUTES.manage));
              }}
            >
              <Text style={styles.modalOptionText}>Nueva Carpeta</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Portal>
        <Modal
          visible={allCollectionsVisible}
          onDismiss={handleAllCollectionsClose}
          contentContainerStyle={[styles.allCollectionsModal, { 
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border 
          }]}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Todas las Colecciones</Text>
            <TouchableOpacity onPress={handleAllCollectionsClose}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.allCollectionsList}>
            {collectionsWithTerms.map((collection) => (
              <TouchableOpacity
                key={collection.id}
                style={[styles.collectionListItem, { 
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border 
                }]}
                onPress={() => {
                  handleAllCollectionsClose();
                  handleNavigation(ROUTES.lessons, { id: collection.id });
                }}
              >
                <View style={styles.collectionListItemContent}>
                  <View style={styles.collectionListItemInfo}>
                    <Text style={[styles.collectionListItemTitle, { color: theme.colors.text }]}>
                      {collection.name}
                    </Text>
                    <Text style={[styles.collectionListItemDate, { color: theme.colors.textSecondary }]}>
                      {collection.terms_count} términos
                    </Text>
                  </View>
                  <Image 
                    source={getLanguageFlag(collection.topics[0])} 
                    style={styles.collectionListItemFlag} 
                  />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Modal>
      </Portal>
    </View>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function to prevent unnecessary re-renders
  return (
    prevProps.loading === nextProps.loading &&
    prevProps.error === nextProps.error &&
    prevProps.collections.length === nextProps.collections.length &&
    prevProps.collections.every((col, index) => col.id === nextProps.collections[index].id)
  );
});

// Agregar después de los componentes existentes y antes de SearchScreen
const FilterBar = memo(({ 
  selectedFilters, 
  onFilterChange 
}: { 
  selectedFilters: string[];
  onFilterChange: (filters: string[]) => void;
}) => {
  const { theme } = useTheme();
  const filters = ['Todos', 'Deportes', 'Historia', 'Arte', 'Ciencia', 'Cultura', 'Naturaleza', 'Geografía'];

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false} 
      style={styles.filterScrollView}
    >
      {filters.map((filter) => (
        <TouchableOpacity
          key={filter}
          style={[
            styles.filterChip,
            { 
              backgroundColor: selectedFilters.includes(filter) 
                ? theme.colors.primary 
                : theme.colors.card,
              borderColor: theme.colors.border
            }
          ]}
          onPress={() => {
            if (selectedFilters.includes(filter)) {
              onFilterChange(selectedFilters.filter(f => f !== filter));
            } else {
              onFilterChange([...selectedFilters, filter]);
            }
          }}
        >
          <Text style={[
            styles.filterText,
            { 
              color: selectedFilters.includes(filter) 
                ? '#FFFFFF' 
                : theme.colors.text 
            }
          ]}>
            {filter}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
});

const LoadingScreen = memo(({ searchQuery }: { searchQuery: string }) => {
  const router = useRouter();
  const { theme } = useTheme();

  useEffect(() => {
    const generateContent = async () => {
      try {
        const response = await generateCollectionInfo(searchQuery);
        
        if (response.error) {
          throw new Error(response.error);
        }

        if (response.name && response.description) {
          router.push({
            pathname: '/(subtabs)/edit',
            params: { 
              input: searchQuery,
              fromSearch: 'true',
              generatedName: response.name,
              generatedDescription: response.description
            }
          });
        } else {
          throw new Error('No se pudo generar el contenido');
        }
      } catch (error: any) {
        Alert.alert(
          'Error',
          error.message || 'No se pudo generar el contenido. Por favor, intenta de nuevo.'
        );
      }
    };

    generateContent();
  }, [searchQuery]);

  return (
    <View style={[styles.loadingScreen, { backgroundColor: theme.colors.background }]}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={[styles.loadingText, { color: theme.colors.text }]}>
        Zappy está pensando en tu colección...
      </Text>
      <Text style={[styles.loadingSubtext, { color: theme.colors.textSecondary }]}>
        Esto puede tomar unos segundos
      </Text>
    </View>
  );
});

// Search Screen Component
const SearchScreen = () => {
  const router = useRouter();
  const { theme } = useTheme();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [topics, setTopics] = useState(['Sports', 'History', 'Art', 'Science', 'Culture', 'Nature', 'Geography']);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);

  // Cargar todas las colecciones públicas al inicio
  useEffect(() => {
    searchCollections('');
  }, []);

  const getThemeImage = useCallback((topic: string) => {
    return THEME_IMAGES[topic as keyof typeof THEME_IMAGES];
  }, []);

  // Shuffle topics only once on mount
  useEffect(() => {
    setTopics(prevTopics => [...prevTopics].sort(() => Math.random() - 0.5));
  }, []);

  const searchCollections = useCallback(async (query: string = '') => {
    try {
      setLoading(true);
      setError(null);
      
      // Buscar en colecciones
      let collections_query = supabase
        .from('collections')
        .select('*')
        .eq('is_public', true);

      if (query) {
        collections_query = collections_query.ilike('name', `%${query}%`);
      }

      const { data: collectionsData, error: collectionsError } = await collections_query;

      if (collectionsError) {
        console.error('Supabase Collections Error:', collectionsError);
        setError(`Error: ${collectionsError.message}`);
        return;
      }

      // Buscar en carpetas
      let folders_query = supabase
        .from('folders')
        .select('id, name, collection_ids')
        .eq('is_public', true);

      if (query) {
        folders_query = folders_query.ilike('name', `%${query}%`);
      }

      const { data: foldersData, error: foldersError } = await folders_query;

      if (foldersError) {
        console.error('Supabase Folders Error:', foldersError);
        setError(`Error: ${foldersError.message}`);
        return;
      }

      setCollections(collectionsData || []);
      setFolders(foldersData || []);
    } catch (error: any) {
      console.error('Error searching:', error);
      setError(`Error: ${error?.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setIsSearching(false);
      searchCollections('');
    } else {
      setIsSearching(true);
      searchCollections(query);
    }
  }, [searchCollections]);

  const handleTopicPress = useCallback((topic: string) => {
    setSearchQuery(topic);
    searchCollections(topic);
  }, [searchCollections]);

  // Memoize collection card rendering function (href con ?id= para web)
  const renderCollectionCard = useCallback((collection: Collection) => (
    <CollectionCard 
      key={collection.id}
      collection={collection}
      onPress={() => router.push(`/lessons?id=${encodeURIComponent(collection.id)}` as any)}
    />
  ), [router]);

  // Memoize content based on state
  const renderContent = useMemo(() => {
    if (loading) {
      return <LoadingIndicator />;
    }
    
    if (error) {
      return <ErrorDisplay message={error} />;
    }
    
    if (collections.length === 0) {
      return (
        <View style={[styles.screenContainer, styles.centerContent]}>
          <Text style={styles.emptyText}>
            {searchQuery ? 'No collections found' : 'Start searching for collections'}
          </Text>
        </View>
      );
    }
    
    return (
      <ScrollView style={styles.collectionContainer}>
        <View style={styles.collectionGrid}>
          {folders.map((folder) => (
            <FolderCard
              collection_ids={folder.collection_ids}
              key={folder.id}
              name={folder.name}
              onPress={() => router.push(`/lands?id=${encodeURIComponent(folder.id)}` as any)}
            />
          ))}
        </View>
        <View style={styles.collectionGrid}>
          {collections.map(renderCollectionCard)}
        </View>
      </ScrollView>
    );
  }, [loading, error, collections, folders, searchQuery, renderCollectionCard]);

  return (
    <View style={[styles.screenContainer, { backgroundColor: theme.colors.background }]}>
      {isGeneratingContent ? (
        <LoadingScreen searchQuery={searchQuery} />
      ) : (
        <>
          <SearchInput 
            value={searchQuery} 
            onChangeText={setSearchQuery}
            onSubmit={handleSearch}
          />

          <ScrollView style={[styles.collectionContainer, { backgroundColor: theme.colors.background }]}>
            {!isSearching ? (
              <View style={styles.topicsSection}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Nuestros temas</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.topicsScrollView}>
                  {topics.map((topic, index) => (
                    <TopicCard
                      key={index}
                      topic={topic}
                      image={getThemeImage(topic)}
                      onPress={() => handleTopicPress(topic)}
                    />
                  ))}
                </ScrollView>
              </View>
            ) : (
              <View style={styles.filterSection}>
                <FilterBar 
                  selectedFilters={selectedFilters}
                  onFilterChange={setSelectedFilters}
                />
              </View>
            )}

            {isSearching && collections.length === 0 && folders.length === 0 ? (
              <View style={styles.noResultsContainer}>
                <TouchableOpacity 
                  style={[styles.zappyButton, { backgroundColor: theme.colors.primary }]}
                  onPress={() => setIsGeneratingContent(true)}
                >
                  <Text style={styles.zappyButtonText}>Preguntarle a Zappy</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <React.Fragment>
                {(isSearching && (collections.length > 0 || folders.length > 0)) && (
                  <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                    Resultados de búsqueda
                  </Text>
                )}
                {!isSearching && (
                  <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                    Colecciones compartidas por la comunidad
                  </Text>
                )}
                <View style={styles.collectionGrid}>
                  {collections.map(renderCollectionCard)}
                </View>

                {(isSearching && folders.length > 0) && (
                  <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                    Carpetas encontradas
                  </Text>
                )}
                {!isSearching && (
                  <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                    Cursos de usuarios para usuarios
                  </Text>
                )}
                <View style={styles.folderList}>
                  {folders.map((folder) => (
                    <FolderCard
                      collection_ids={folder.collection_ids}
                      key={folder.id}
                      name={folder.name}
                      onPress={() => router.push(`/lands?id=${encodeURIComponent(folder.id)}` as any)}
                    />
                  ))}
                </View>
              </React.Fragment>
            )}
          </ScrollView>
        </>
      )}
    </View>
  );
}

// Main Home Component
const Home = memo(() => {
  const router = useRouter();
  const { width } = useWindowDimensions();

  // Memoize initial state values
  const [activeTab, setActiveTab] = useState('collection');
  const slideAnimation = useRef(new Animated.Value(0)).current;

  // Collection state management
  const { collections, loading, error, fetchCollections } = useCollections();
  
  // Load collections on mount
  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  // Memoize fetchCollections callback
  const memoizedFetchCollections = useCallback(async () => {
    await fetchCollections();
  }, [fetchCollections]);

  // Memoize switchTab callback
  const switchTab = useCallback((tab: string) => {
    Animated.spring(slideAnimation, {
      toValue: tab === 'collection' ? 0 : 1,
      useNativeDriver: true,
      tension: 100,
      friction: 10
    }).start();
    setActiveTab(tab);
  }, [slideAnimation]);

  // Memoize tab content
  const tabContent = useMemo(() => {
    return activeTab === 'collection' ? (
      <CollectionScreen 
        collections={collections}
        loading={loading}
        error={error}
        onRefresh={memoizedFetchCollections}
        activeTab={activeTab}
      />
    ) : (
      <SearchScreen />
    );
  }, [activeTab, collections, loading, error, memoizedFetchCollections]);

  // Memoize TabBar props
  const tabBarProps = useMemo(() => ({
    activeTab,
    onTabChange: switchTab,
    slideAnimation
  }), [activeTab, switchTab, slideAnimation]);

  // Memoize container style
  const containerStyle = useMemo(() => ({
    flex: 1,
  }), []);

  return (
    <View style={containerStyle}>
      <TabBar {...tabBarProps} />
      {tabContent}
    </View>
  );
}, () => true); // Custom comparison function to prevent re-renders

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
    width: '100%',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    position: 'relative',
    paddingTop: 30,
    paddingBottom: 10,
    borderBottomWidth: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 20,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 18,
    fontFamily: FONTS.title,
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 4,
  },
  collectionContainer: {
    flex: 1,
    padding: 16,
    overflow: 'visible'
  },
  collectionGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  collectionCard: {
    width: '48%',
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    minHeight: 180,
  },
  coverContainer: {
    width: '100%',
    height: 180,
    position: 'relative',
  },
  flagContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 3,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1,
  },
  flagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  flag: {
    width: 24,
    height: 24,
    borderRadius: 3,
  },
  moreFlagsContainer: {
    width: 24,
    height: 24,
    borderRadius: 3,
    backgroundColor: '#37464f',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 2,
  },
  moreFlagsText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: FONTS.title,
  },
  titleOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 8,
  },
  titleInCover: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontFamily: FONTS.title,
  },
  sectionTitle: { 
    fontSize: 20,
    fontFamily: FONTS.title,
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  folderList: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  folderCard: {
    backgroundColor: '#202f36',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    borderWidth: 2,
    borderColor: '#37464f',
    minHeight: 180,
    justifyContent: 'center',
    marginVertical: 8,
  },
  folderName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: FONTS.title,
    marginBottom: 8,
  },
  folderInfo: {
    color: '#8F9EA8',
    fontSize: 14,
    fontFamily: FONTS.body,
  },
  folderIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#37464f',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12
  },
  folderTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: FONTS.body,
    textAlign: 'center'
  },
  folderSubtitle: {
    color: '#8E8E93',
    fontSize: 14,
    fontFamily: FONTS.body,
    textAlign: 'center',
    marginTop: 4
  },
  emptyFoldersContainer: {
    padding: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 8,
  },
  emptyFoldersText: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center' as const,
    lineHeight: 22,
    padding: 16,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyTitle: {
    color: 'white',
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: FONTS.title,
    width: '100%',
  },
  emptySubtitle: {
    color: '#8E8E93',
    fontSize: 19,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: FONTS.body,
    width: '100%',
    lineHeight: 26,
  },
  createButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF8C00', // fallback (se overridea con theme.colors.primary)
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF8C00', // fallback (se overridea con theme.colors.primary)
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  floatingCreateButton: {
    position: 'absolute' as const,
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 9999,
  },
  createButtonText: {
    color: 'white',
    fontSize: 40,
    fontFamily: FONTS.title,
  },
  topicsSection: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  topicsScrollView: {
    flexDirection: 'row',
    marginTop: 12,
    paddingRight: 16,
  },
  topicCard: {
    backgroundColor: '#202f36',
    borderRadius: 12,
    marginRight: 16,
    width: 400,
    aspectRatio: 1.75,
    overflow: 'hidden',
    position: 'relative',
  },
  topicImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  topicText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: FONTS.title,
    textAlign: 'center',
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
    width: '100%',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 16,
    borderWidth: 2,
    width: '100%',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: FONTS.body,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#131f24',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
  emptyText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    fontFamily: FONTS.body,
    padding: 20
  },
  createOptionsOverlayFixed: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99999,
    elevation: 99999,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  createOptionsCard: {
    width: '100%',
    maxWidth: 320,
    padding: 24,
    borderRadius: 14,
    borderWidth: 2,
  },
  modalContainer: {
    padding: 20,
    margin: 20,
    borderRadius: 14,
    borderWidth: 2,
  },
  modalTitle: {
    fontSize: 20,
    textAlign: 'center' as const,
    fontFamily: FONTS.title,
    marginBottom: 20,
  },
  modalOption: {
    padding: 16,
    borderRadius: 14,
    marginVertical: 8,
    alignItems: 'center' as const,
  },
  modalOptionText: {
    color: 'white',
    fontSize: 16,
    fontFamily: FONTS.title,
  },
  title: {
    fontSize: 24,
    fontFamily: FONTS.title,
    color: '#FFFFFF',
    marginLeft: 20,
  },
  collectionTitle: {
    fontSize: 16,
    fontFamily: FONTS.title,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  collectionLanguage: {
    fontSize: 14,
    fontFamily: FONTS.body,
    color: '#8F9EA6',
  },
  topicTitle: {
    fontSize: 16,
    fontFamily: FONTS.title,
    color: '#FFFFFF',
    marginTop: 8,
  },
  recentSection: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    marginVertical: 16,
  },
  viewAllButton: {
    padding: 8,
  },
  viewAllText: {
    fontSize: 16,
    fontFamily: FONTS.title,
  },
  allCollectionsModal: {
    margin: 20,
    borderRadius: 14,
    borderWidth: 2,
    maxHeight: '80%' as const,
  },
  modalHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#37464f',
  },
  allCollectionsList: {
    padding: 16,
  },
  collectionListItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  collectionListItemContent: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  collectionListItemInfo: {
    flex: 1,
  },
  collectionListItemTitle: {
    fontSize: 16,
    fontFamily: FONTS.title,
    marginBottom: 4,
  },
  collectionListItemDate: {
    fontSize: 14,
    fontFamily: FONTS.body,
  },
  collectionListItemFlag: {
    width: 24,
    height: 24,
    borderRadius: 3,
  },
  filterSection: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  filterScrollView: {
    flexDirection: 'row',
    marginTop: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 14,
    fontFamily: FONTS.body,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 40,
  },
  zappyButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  zappyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: FONTS.title,
  },
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    fontFamily: FONTS.title,
    textAlign: 'center',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: FONTS.body,
    textAlign: 'center',
  },
});

export default Home;