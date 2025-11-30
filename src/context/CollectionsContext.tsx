import React, { createContext, useContext, useState, useCallback } from 'react';
import { supabase } from '../services/supabase';

interface Collection {
  id: string;
  name: string;
  topics: string[];
  cover_url?: string;
  created_at: string;
  terms_count?: number;
}

interface CollectionsContextType {
  collections: Collection[];
  loading: boolean;
  error: string | null;
  fetchCollections: () => Promise<void>;
  updateCollection: (updatedCollection: Collection) => void;
  updateCollectionById: (id: string, updates: Partial<Collection>) => Promise<void>;
}

const CollectionsContext = createContext<CollectionsContextType | undefined>(undefined);

export function CollectionsProvider({ children }: { children: React.ReactNode }) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCollections = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setCollections(data || []);
    } catch (error: any) {
      console.error('Error fetching collections:', error?.message);
      setError(`Error: ${error?.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCollection = useCallback((updatedCollection: Collection) => {
    setCollections(prevCollections => 
      prevCollections.map(collection => 
        collection.id === updatedCollection.id ? updatedCollection : collection
      )
    );
  }, []);

  const updateCollectionById = useCallback(async (id: string, updates: Partial<Collection>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('collections')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        updateCollection(data);
      }
    } catch (error: any) {
      console.error('Error updating collection:', error?.message);
      throw error;
    }
  }, [updateCollection]);

  return (
    <CollectionsContext.Provider value={{
      collections,
      loading,
      error,
      fetchCollections,
      updateCollection,
      updateCollectionById
    }}>
      {children}
    </CollectionsContext.Provider>
  );
}

export function useCollections() {
  const context = useContext(CollectionsContext);
  if (context === undefined) {
    throw new Error('useCollections must be used within a CollectionsProvider');
  }
  return context;
} 