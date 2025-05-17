import { useState, useCallback, useEffect } from 'react';

/**
 * Hook pour gérer les opérations CRUD sur une API
 * @param apiEndpoint L'endpoint de base de l'API
 * @returns Fonctions et états pour gérer les opérations CRUD
 */
export function useApiCrud<T extends { id: string }>(apiEndpoint: string) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Fonction pour récupérer tous les éléments
  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(apiEndpoint);
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      const data = await response.json();
      setItems(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Une erreur est survenue'));
      return [];
    } finally {
      setLoading(false);
    }
  }, [apiEndpoint]);

  // Fonction pour récupérer un élément spécifique
  const fetchItem = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiEndpoint}/${id}`);
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Une erreur est survenue'));
      return null;
    } finally {
      setLoading(false);
    }
  }, [apiEndpoint]);

  // Fonction pour créer un nouvel élément
  const createItem = useCallback(async (item: Omit<T, 'id'>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item),
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const newItem = await response.json();
      setItems((prevItems) => [...prevItems, newItem]);
      return newItem;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Une erreur est survenue'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiEndpoint]);

  // Fonction pour mettre à jour un élément existant
  const updateItem = useCallback(async (item: T) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiEndpoint}/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item),
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const updatedItem = await response.json();
      setItems((prevItems) =>
        prevItems.map((prevItem) => (prevItem.id === item.id ? updatedItem : prevItem))
      );
      return updatedItem;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Une erreur est survenue'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiEndpoint]);

  // Fonction pour supprimer un élément
  const deleteItem = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiEndpoint}/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      setItems((prevItems) => prevItems.filter((item) => item.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Une erreur est survenue'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiEndpoint]);

  // Fonction pour supprimer plusieurs éléments
  const deleteItems = useCallback(async (ids: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const promises = ids.map((id) =>
        fetch(`${apiEndpoint}/${id}`, {
          method: 'DELETE',
        })
      );
      
      const results = await Promise.allSettled(promises);
      const rejectedResults = results.filter(
        (result): result is PromiseRejectedResult => result.status === 'rejected'
      );
      
      if (rejectedResults.length > 0) {
        throw new Error(`${rejectedResults.length} suppressions ont échoué`);
      }
      
      setItems((prevItems) => prevItems.filter((item) => !ids.includes(item.id)));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Une erreur est survenue'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiEndpoint]);

  return {
    items,
    setItems,
    loading,
    error,
    fetchItems,
    fetchItem,
    createItem,
    updateItem,
    deleteItem,
    deleteItems,
  };
}