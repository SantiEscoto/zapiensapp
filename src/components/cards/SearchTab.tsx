// Importación de componentes necesarios
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, ActivityIndicator, Searchbar } from 'react-native-paper';
import { useState, useCallback, useEffect } from 'react';
import debounce from 'lodash/debounce';
import { supabase } from '../../services/supabase';
import { FONTS } from '../../services/fonts';

// Interfaz para definir la estructura de una colección
interface Collection {
  id: string;
  name: string;
  language: string;
}

// Componente principal para la búsqueda de colecciones públicas
export default function SearchTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [collections, setCollections] = useState<Collection[]>([]);

  // Función de búsqueda con debounce para evitar múltiples llamadas
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      searchCollections(query);
    }, 500),
    []
  );

  // Función para obtener todas las colecciones públicas
  const fetchAllCollections = async () => {
    setLoading(true);
    try {
      console.log('Fetching all public collections...');
      const { data, error } = await supabase
        .from('collections')
        .select('id, name, language, is_public')
        .eq('is_public', true);

      if (error) throw error;
      console.log('Fetched collections:', data);
      setCollections(data || []);

      // Suscripción a cambios en colecciones públicas
      const subscription = supabase
        .channel('public_collections')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'collections', filter: 'is_public=eq.true' },
          payload => {
            if (payload.eventType === 'INSERT') {
              setCollections(current => [...current, payload.new as Collection]);
            }
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    } catch (error: any) {
      console.error('Error al obtener colecciones:', error?.message);
    } finally {
      setLoading(false);
    }
  };

  // Cargar colecciones al montar el componente
  useEffect(() => {
    fetchAllCollections();
  }, []);

  // Función para buscar colecciones por nombre
  const searchCollections = async (query: string) => {
    if (!query.trim()) {
      fetchAllCollections();
      return;
    }
  
    setLoading(true);
    try {
      console.log('Searching collections with query:', query);
      const { data, error } = await supabase
        .from('collections')
        .select('id, name, language, is_public')
        .eq('is_public', true)
        .ilike('name', `%${query}%`);
  
      if (error) {
        console.error('Supabase search error:', error);
        throw error;
      }
      console.log('Search results:', data);
      setCollections(data || []);
    } catch (error: any) {
      console.error('Error al buscar colecciones:', error?.message);
    } finally {
      setLoading(false);
    }
  };

  // Manejadores de eventos de búsqueda
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    debouncedSearch(query);
  };

  const handleSubmit = () => {
    searchCollections(searchQuery);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Descubre Colecciones</Text>
        <Text style={styles.headerSubtitle}>Encuentra y estudia con colecciones públicas</Text>
      </View>

      <Searchbar
        placeholder="Buscar colecciones públicas"
        onChangeText={handleSearch}
        onSubmitEditing={handleSubmit}
        value={searchQuery}
        style={styles.searchBar}
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1CB0F6" />
        </View>
      ) : collections.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>
            {searchQuery ? 'No se encontraron colecciones' : 'No hay colecciones públicas disponibles'}
          </Text>
          <Text style={styles.emptyText}>
            {searchQuery ? 'Intenta con otras palabras clave' : '¡Sé el primero en compartir una colección!'}
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.results}>
          <View style={styles.grid}>
            {collections.map((collection) => (
              <Card
                key={collection.id}
                style={styles.card}
                onPress={() => console.log('Navegar a colección', collection.id)}
              >
                <Card.Content>
                  <Text style={styles.cardTitle}>{collection.name}</Text>
                  <Text style={styles.cardLanguage}>{collection.language}</Text>
                </Card.Content>
              </Card>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

// Estilos para los componentes
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: FONTS.title,
    color: 'white',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: FONTS.body,
    color: '#8E8E93',
  },
  searchBar: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 0,
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
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: FONTS.title,
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.7,
    fontFamily: FONTS.body,
    color: '#8E8E93',
  },
  results: {
    flex: 1,
    paddingHorizontal: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  card: {
    width: '48%',
    marginHorizontal: '1%',
    marginBottom: 16,
    minHeight: 100,
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    flex: 0,
  },
  cardTitle: {
    fontSize: 16,
    textAlign: 'center',
    color: 'white',
    fontFamily: FONTS.title,
    marginBottom: 4,
  },
  cardLanguage: {
    fontSize: 14,
    textAlign: 'center',
    fontFamily: FONTS.body,
    color: '#1CB0F6',
  },
});