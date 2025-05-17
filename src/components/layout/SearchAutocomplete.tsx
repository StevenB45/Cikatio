import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { TextField, InputAdornment, Paper, List, ListItem, ListItemButton, ListItemAvatar, Avatar, ListItemText, Chip, Typography, Alert } from '@mui/material';
import { Search as SearchIcon, Book as BookIcon, Inventory as EquipmentIcon, Person as PersonIcon } from '@mui/icons-material';

export interface SearchAutocompleteProps {
  placeholder?: string;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
  sx?: any;
}

export default function SearchAutocomplete({ placeholder = 'Rechercher...', fullWidth = true, size = 'medium', sx }: SearchAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [allItems, setAllItems] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const [itemsResponse, usersResponse] = await Promise.all([
          fetch('/api/items'),
          fetch('/api/users')
        ]);

        if (!itemsResponse.ok) {
          throw new Error('Erreur lors de la récupération des items');
        }
        if (!usersResponse.ok) {
          throw new Error('Erreur lors de la récupération des utilisateurs');
        }

        const [items, users] = await Promise.all([
          itemsResponse.json(),
          usersResponse.json()
        ]);

        if (!Array.isArray(items) || !Array.isArray(users)) {
          throw new Error('Format de données invalide');
        }

        setAllItems(items || []);
        setAllUsers((users || []).map((u: any) => ({ 
          ...u, 
          name: u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : 'Utilisateur inconnu'
        })));
      } catch (error) {
        console.error('Error fetching search data:', error);
        setError(error instanceof Error ? error.message : 'Erreur lors de la récupération des données');
        setAllItems([]);
        setAllUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const suggestions = useMemo(() => {
    if (!query) return [];
    const q = query.toLowerCase();
    
    const itemSuggestions = allItems
      .filter(item => {
        if (!item) return false;
        return (
          (item.name && item.name.toLowerCase().includes(q)) ||
          (item.customId && item.customId.toLowerCase().includes(q)) ||
          (item.category === 'BOOK' && item.author && item.author.toLowerCase().includes(q)) ||
          (item.category === 'EQUIPMENT' && item.brand && item.brand.toLowerCase().includes(q))
        );
      })
      .slice(0, 5)
      .map(item => ({
        type: item.category,
        id: item.id,
        label: item.name || '',
        sub: item.category === 'BOOK' ? item.author : item.brand,
        icon: item.category === 'BOOK' ? <BookIcon fontSize="small" /> : <EquipmentIcon fontSize="small" />
      }));

    const userSuggestions = allUsers
      .filter(user => {
        if (!user || !user.name) return false;
        return (
          user.name.toLowerCase().includes(q) ||
          (user.email && user.email.toLowerCase().includes(q))
        );
      })
      .slice(0, 5)
      .map(user => ({
        type: 'USER',
        id: user.id,
        label: user.name,
        sub: user.email,
        icon: <PersonIcon fontSize="small" />
      }));

    return [...itemSuggestions, ...userSuggestions].slice(0, 8);
  }, [query, allItems, allUsers]);

  const handleSubmit = (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (query.trim().length > 0) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setShowSuggestions(false);
    }
  };

  return (
    <div style={{ position: 'relative', width: fullWidth ? '100%' : undefined, ...sx }}>
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}
      
      <form onSubmit={handleSubmit} autoComplete="off">
        <TextField
          fullWidth={fullWidth}
          size={size}
          variant="outlined"
          placeholder={placeholder}
          value={query}
          onChange={e => { setQuery(e.target.value); setShowSuggestions(true); }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          disabled={loading}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <Typography variant="caption" color="text.secondary">
                  Entrée pour rechercher
                </Typography>
              </InputAdornment>
            )
          }}
          onKeyDown={e => {
            if (e.key === 'Enter') handleSubmit(e);
          }}
        />
        {showSuggestions && suggestions.length > 0 && (
          <Paper sx={{ position: 'absolute', left: 0, right: 0, zIndex: 10, mt: 1, maxHeight: 320, overflowY: 'auto' }}>
            <List dense disablePadding>
              {suggestions.map(s => (
                <ListItem key={`${s.type}-${s.id}`} disablePadding>
                  <ListItemButton
                    onMouseDown={e => {
                      e.preventDefault();
                      setQuery(s.label);
                      setShowSuggestions(false);
                      setTimeout(() => router.push(`/search?q=${encodeURIComponent(s.label)}`), 0);
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ 
                        bgcolor: s.type === 'BOOK' ? 'primary.main' : 
                                s.type === 'EQUIPMENT' ? 'secondary.main' : 
                                'info.main',
                        width: 32,
                        height: 32
                      }}>
                        {s.icon}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={s.label}
                      secondary={s.sub}
                      primaryTypographyProps={{ fontWeight: 500 }}
                    />
                    <Chip 
                      label={
                        s.type === 'BOOK' ? 'Livre' : 
                        s.type === 'EQUIPMENT' ? 'Matériel' : 
                        'Usager'
                      } 
                      size="small" 
                      color={
                        s.type === 'BOOK' ? 'primary' :
                        s.type === 'EQUIPMENT' ? 'secondary' :
                        'info'
                      } 
                      sx={{ ml: 1 }} 
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Paper>
        )}
      </form>
    </div>
  );
}
