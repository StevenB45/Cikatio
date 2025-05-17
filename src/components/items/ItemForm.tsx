import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Grid,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { ItemType, ServiceCategory } from '@/types';
import { fetchBookByISBN } from '@/lib/fetchBookByISBN';
import { useDebounce } from 'use-debounce';
import { canModifyStatus, getItemStatus, ItemStatus, LoanStatus } from '@/lib/status';

// Type pour les données d'un item éditable
export interface EditableItem {
  id?: string;
  name?: string;
  description?: string;
  customId?: string;
  category?: ItemType;
  author?: string;
  isbn?: string;
  publisher?: string;
  yearPublished?: number | '';
  brand?: string;
  model?: string;
  serialNumber?: string;
  serviceCategory?: ServiceCategory;
  coverImageUrl?: string;
  reservationStatus?: ItemStatus;
  loans?: Array<{ status: LoanStatus; returnedAt: Date | null }>;
}

interface ItemFormProps {
  item: EditableItem;
  onChange: (updatedItem: EditableItem) => void;
  errors?: Record<string, string>;
}

/**
 * Formulaire réutilisable pour la création et modification d'items
 */
const ItemForm: React.FC<ItemFormProps> = ({ item, onChange, errors = {} }) => {
  // État pour le champ ISBN et sa recherche
  const [isbn, setIsbn] = useState(item.isbn || '');
  const [debouncedIsbn] = useDebounce(isbn, 1000);
  const [isbnLoading, setIsbnLoading] = useState(false);
  const [isbnError, setIsbnError] = useState<string | null>(null);
  const [isbnBeingFetched, setIsbnBeingFetched] = useState<string>('');

  // Fonction pour gérer le changement d'un champ de texte
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onChange({ ...item, [name]: value });
  };

  // Fonction pour gérer le changement d'un menu déroulant
  const handleSelectChange = (e: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    const name = e.target.name as string;
    const value = e.target.value;

    // Si c'est le statut qui est modifié
    if (name === 'reservationStatus') {
      // Vérifier si le statut peut être modifié
      const itemWithDefaultStatus = {
        ...item,
        reservationStatus: item.reservationStatus || 'AVAILABLE'
      };
      
      if (!canModifyStatus(itemWithDefaultStatus)) {
        return; // Ne pas permettre la modification
      }

      // Vérifier si le nouveau statut est valide
      const newStatus = value as ItemStatus;
      const currentStatus = getItemStatus(itemWithDefaultStatus);
      
      // Si l'item est en prêt, forcer le statut à BORROWED
      if (currentStatus === 'BORROWED') {
        onChange({ ...item, [name]: 'BORROWED' });
        return;
      }

      // Sinon, appliquer le nouveau statut
      onChange({ ...item, [name]: newStatus });
    } else {
      // Pour les autres champs, appliquer normalement
      onChange({ ...item, [name]: value });
    }
  };

  // Recherche automatique des informations du livre par ISBN
  useEffect(() => {
    // Ne rechercher que si c'est un livre et si l'ISBN a une longueur minimale
    if (
      item.category === 'BOOK' &&
      debouncedIsbn &&
      debouncedIsbn.length >= 10 &&
      debouncedIsbn !== item.isbn
    ) {
      setIsbnError(null);
      setIsbnLoading(true);
      setIsbnBeingFetched(debouncedIsbn.replace(/[^0-9Xx]/g, ''));
      
      fetchBookByISBN(debouncedIsbn.replace(/[^0-9Xx]/g, ''))
        .then((book) => {
          // Vérifier que le ISBN n'a pas changé pendant la recherche
          if (
            item.category !== 'BOOK' ||
            debouncedIsbn.replace(/[^0-9Xx]/g, '') !== isbnBeingFetched
          ) {
            return;
          }

          if (book) {
            // Livre trouvé, mettre à jour les champs du formulaire
            onChange({
              ...item,
              name: book.title || item.name,
              author: book.author || item.author,
              publisher: book.publisher || item.publisher,
              yearPublished: book.year ? Number(book.year) : item.yearPublished,
              description: book.description || item.description,
              isbn: debouncedIsbn,
              coverImageUrl: book.coverUrl || item.coverImageUrl,
            });
          } else {
            setIsbnError("Livre non trouvé pour cet ISBN");
          }
        })
        .catch((error) => {
          setIsbnError(`Erreur lors de la recherche: ${error.message}`);
        })
        .finally(() => {
          setIsbnLoading(false);
        });
    } else {
      // Mettre à jour l'ISBN dans l'item même s'il n'y a pas de recherche
      if (debouncedIsbn !== item.isbn) {
        onChange({ ...item, isbn: debouncedIsbn });
      }
    }
  }, [debouncedIsbn, item.category]);

  // Forcer la recherche immédiate de l'ISBN
  const handleFetchISBN = () => {
    if (isbn && isbn.length >= 10 && item.category === 'BOOK') {
      setIsbnLoading(true);
      setIsbnError(null);
      setIsbnBeingFetched(isbn.replace(/[^0-9Xx]/g, ''));
      
      fetchBookByISBN(isbn.replace(/[^0-9Xx]/g, ''))
        .then((book) => {
          if (book) {
            onChange({
              ...item,
              name: book.title || item.name,
              author: book.author || item.author,
              publisher: book.publisher || item.publisher,
              yearPublished: book.year ? Number(book.year) : item.yearPublished,
              description: book.description || item.description,
              isbn: isbn,
              coverImageUrl: book.coverUrl || item.coverImageUrl,
            });
          } else {
            setIsbnError("Livre non trouvé pour cet ISBN");
          }
        })
        .catch((error) => {
          setIsbnError(`Erreur lors de la recherche: ${error.message}`);
        })
        .finally(() => {
          setIsbnLoading(false);
        });
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, my: 2 }}>
      {/* Champs communs à tous les types d'item */}
      <TextField
        required
        fullWidth
        label="Nom"
        name="name"
        value={item.name || ''}
        onChange={handleInputChange}
        error={!!errors.name}
        helperText={errors.name || ""}
      />
      
      <TextField
        fullWidth
        label="Description"
        name="description"
        value={item.description || ''}
        onChange={handleInputChange}
        multiline
        rows={2}
      />
      
      <TextField
        required
        fullWidth
        label="Code Barre"
        name="customId"
        value={item.customId || ''}
        onChange={handleInputChange}
        error={!!errors.customId}
        helperText={errors.customId || ""}
      />

      <Grid container spacing={2}>
        <Grid item xs={6}>
          <FormControl fullWidth required error={!!errors.category}>
            <InputLabel>Catégorie</InputLabel>
            <Select
              name="category"
              value={item.category || ''}
              label="Catégorie"
              onChange={handleSelectChange}
            >
              <MenuItem value="BOOK">Livre</MenuItem>
              <MenuItem value="EQUIPMENT">Matériel</MenuItem>
            </Select>
            {errors.category && <FormHelperText>{errors.category}</FormHelperText>}
          </FormControl>
        </Grid>
        <Grid item xs={6}>
          <FormControl fullWidth required error={!!errors.serviceCategory}>
            <InputLabel>Service</InputLabel>
            <Select
              name="serviceCategory"
              value={item.serviceCategory || ''}
              label="Service"
              onChange={handleSelectChange}
            >
              <MenuItem value="RUNE">RUNE</MenuItem>
              <MenuItem value="SAVS">SAVS</MenuItem>
              <MenuItem value="CICAT">CICAT</MenuItem>
              <MenuItem value="PNT">PNT</MenuItem>
              <MenuItem value="LOGEMENT_INCLUSIF">Logement Inclusif</MenuItem>
            </Select>
            {errors.serviceCategory && <FormHelperText>{errors.serviceCategory}</FormHelperText>}
          </FormControl>
        </Grid>
      </Grid>

      {/* Champs spécifiques aux livres */}
      {item.category === 'BOOK' && (
        <>
          <TextField
            fullWidth
            label="Auteur"
            name="author"
            value={item.author || ''}
            onChange={handleInputChange}
          />
          
          <TextField
            fullWidth
            label="ISBN"
            name="isbn"
            value={isbn}
            onChange={(e) => setIsbn(e.target.value)}
            error={!!isbnError}
            helperText={isbnError || ""}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {isbnLoading ? (
                    <CircularProgress size={24} />
                  ) : (
                    <IconButton 
                      edge="end"
                      onClick={handleFetchISBN}
                      disabled={!isbn || isbn.length < 10}
                      aria-label="rechercher par ISBN"
                    >
                      <SearchIcon />
                    </IconButton>
                  )}
                </InputAdornment>
              ),
            }}
          />
          
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Éditeur"
                name="publisher"
                value={item.publisher || ''}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Année de publication"
                name="yearPublished"
                type="number"
                value={item.yearPublished !== undefined ? item.yearPublished : ''}
                onChange={handleInputChange}
                InputProps={{ inputProps: { min: 1000, max: new Date().getFullYear() } }}
              />
            </Grid>
          </Grid>
        </>
      )}

      {/* Champs spécifiques au matériel */}
      {item.category === 'EQUIPMENT' && (
        <>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Marque"
                name="brand"
                value={item.brand || ''}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Modèle"
                name="model"
                value={item.model || ''}
                onChange={handleInputChange}
              />
            </Grid>
          </Grid>
          
          <TextField
            fullWidth
            label="Numéro de série"
            name="serialNumber"
            value={item.serialNumber || ''}
            onChange={handleInputChange}
          />
        </>
      )}

      {/* URL de l'image de couverture (pour les livres principalement) */}
      <TextField
        fullWidth
        label="URL de l'image de couverture"
        name="coverImageUrl"
        value={item.coverImageUrl || ''}
        onChange={handleInputChange}
      />

      {/* Statut de disponibilité - uniquement affiché lors de la création */}
      {!item.id && (
        <FormControl fullWidth>
          <InputLabel>Disponibilité</InputLabel>
          <Select
            name="reservationStatus"
            value={getItemStatus({ ...item, reservationStatus: item.reservationStatus || 'AVAILABLE' })}
            label="Disponibilité"
            onChange={handleSelectChange}
            disabled={!canModifyStatus({ ...item, reservationStatus: item.reservationStatus || 'AVAILABLE' })}
          >
            <MenuItem value="AVAILABLE">Disponible</MenuItem>
            <MenuItem value="RESERVED">Réservé</MenuItem>
            <MenuItem value="BORROWED">Emprunté</MenuItem>
            <MenuItem value="OUT_OF_ORDER">En panne</MenuItem>
          </Select>
          {!canModifyStatus({ ...item, reservationStatus: item.reservationStatus || 'AVAILABLE' }) && (
            <FormHelperText>
              Le statut ne peut pas être modifié car l'item est actuellement en prêt
            </FormHelperText>
          )}
        </FormControl>
      )}
    </Box>
  );
};

export default ItemForm;