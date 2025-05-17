'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Divider,
  Container,
  Grid,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  ChipProps,
  Button
} from '@mui/material';
import {
  Search as SearchIcon,
  Book as BookIcon,
  Inventory as EquipmentIcon,
  Person as PersonIcon,
  Assignment as LoanIcon,
  CheckCircle as AvailableIcon,
  Cancel as UnavailableIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import Link from 'next/link';
import { lazy } from 'react';

// Remplacer dynamic par lazy
const ProductSheet = lazy(() => import('@/components/items/ProductSheet'));
import type { Item, User, Loan, ItemType, StatusType } from '@/types';
import { formatDate, getInitials } from '@/lib/utils';
import { StatusBadge } from '@/components/items/statusBadges';

// Page de recherche unifiée (livres, matériel, usagers)
// Permet la recherche globale, le tri et l'affichage détaillé des résultats
export default function SearchPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <SearchPageContent />
    </Suspense>
  );
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(searchQuery);
  const [activeTab, setActiveTab] = useState('all');
  
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [openProductSheet, setOpenProductSheet] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const getItemHistory = (itemId: string) => [];
  
  // États de tri pour les résultats de recherche
  const [sortItemBy, setSortItemBy] = useState<'name'|'customId'|'author'|'brand'>('name');
  const [sortItemDirection, setSortItemDirection] = useState<'asc'|'desc'>('asc');
  const [sortUserBy, setSortUserBy] = useState<'name'|'email'>('name');
  const [sortUserDirection, setSortUserDirection] = useState<'asc'|'desc'>('asc');

  // Ajout : états pour les données réelles
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  // Charger les données depuis l'API au montage
  useEffect(() => {
    fetch('/api/items')
      .then(res => res.json())
      .then(data => setAllItems(data));
    fetch('/api/users')
      .then(res => res.json())
      .then(data => setAllUsers(data.map((u: any) => ({
        ...u,
        name: `${u.firstName} ${u.lastName}`
      }))));
  }, []);

  // Fonctions de tri
  const handleSortItem = (col: typeof sortItemBy) => {
    if (sortItemBy === col) setSortItemDirection(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortItemBy(col); setSortItemDirection('asc'); }
  };
  const handleSortUser = (col: typeof sortUserBy) => {
    if (sortUserBy === col) setSortUserDirection(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortUserBy(col); setSortUserDirection('asc'); }
  };
  const sortedItems = React.useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      let aValue = a[sortItemBy] || '';
      let bValue = b[sortItemBy] || '';
      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();
      if (aValue < bValue) return sortItemDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortItemDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredItems, sortItemBy, sortItemDirection]);
  const sortedUsers = React.useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      let aValue = a[sortUserBy] || '';
      let bValue = b[sortUserBy] || '';
      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();
      if (aValue < bValue) return sortUserDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortUserDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredUsers, sortUserBy, sortUserDirection]);

  // Effectuer la recherche
  useEffect(() => {
    if (!searchQuery) {
      setFilteredItems([]);
      setFilteredUsers([]);
      return;
    }
    // Filtrer les items
    const matchingItems = allItems.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.customId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.category === 'BOOK' && item.author && item.author.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.category === 'EQUIPMENT' && item.brand && item.brand.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    setFilteredItems(matchingItems);
    // Filtrer les utilisateurs
    const matchingUsers = allUsers.filter(user =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone?.includes(searchQuery) ||
      user.address?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredUsers(matchingUsers);
  }, [searchQuery, allItems, allUsers]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };
  
  // handleSearchSubmit : filtrer sur allItems/allUsers
  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    window.history.pushState({}, '', `/search?q=${encodeURIComponent(query)}`);
    if (!query) {
      setFilteredItems([]);
      setFilteredUsers([]);
      return;
    }
    const matchingItems = allItems.filter(item =>
      item.name.toLowerCase().includes(query.toLowerCase()) ||
      item.customId.toLowerCase().includes(query.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(query.toLowerCase())) ||
      (item.category === 'BOOK' && item.author && item.author.toLowerCase().includes(query.toLowerCase())) ||
      (item.category === 'EQUIPMENT' && item.brand && item.brand.toLowerCase().includes(query.toLowerCase()))
    );
    setFilteredItems(matchingItems);
    const matchingUsers = allUsers.filter(user =>
      user.name.toLowerCase().includes(query.toLowerCase()) ||
      user.email.toLowerCase().includes(query.toLowerCase()) ||
      user.phone?.includes(query) ||
      user.address?.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredUsers(matchingUsers);
  };
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
  };
  
  // Obtenir les comptages pour chaque catégorie
  const countBooks = filteredItems.filter(item => item.category === 'BOOK').length;
  const countEquipment = filteredItems.filter(item => item.category === 'EQUIPMENT').length;
  const countUsers = filteredUsers.length;
  const totalResults = countBooks + countEquipment + countUsers;
  
  // Fonction pour générer les initiales pour les avatars des utilisateurs

  // Suggestions dynamiques pour l'autocomplétion
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestions = React.useMemo(() => {
    if (!query) return [];
    const q = query.toLowerCase();
    const itemSuggestions = allItems.filter(item =>
      item.name.toLowerCase().includes(q) ||
      item.customId.toLowerCase().includes(q) ||
      (item.category === 'BOOK' && item.author && item.author.toLowerCase().includes(q)) ||
      (item.category === 'EQUIPMENT' && item.brand && item.brand.toLowerCase().includes(q))
    ).slice(0, 5).map(item => ({
      type: item.category,
      id: item.id,
      label: item.name,
      sub: item.category === 'BOOK' ? item.author : item.brand,
      icon: item.category === 'BOOK' ? <BookIcon fontSize="small" /> : <EquipmentIcon fontSize="small" />
    }));
    const userSuggestions = allUsers.filter(user =>
      user.name.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q)
    ).slice(0, 5).map(user => ({
      type: 'USER',
      id: user.id,
      label: user.name,
      sub: user.email,
      icon: <PersonIcon fontSize="small" />
    }));
    return [...itemSuggestions, ...userSuggestions].slice(0, 8);
  }, [query, allItems, allUsers]);

  return (
    <MainLayout>
      <Container maxWidth="lg">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
            Résultats de recherche
          </Typography>
          <Typography variant="body1" color="text.secondary" component="div">
            {totalResults} résultat{totalResults > 1 ? 's' : ''} pour "{searchQuery}"
          </Typography>
        </Box>
        
        {/* Champ de recherche */}
        <Paper elevation={0} sx={{ p: 2, mb: 3, backgroundColor: 'transparent', position: 'relative' }}>
          <form onSubmit={handleSearchSubmit} autoComplete="off">
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Rechercher dans Cikatio..."
              value={query}
              onChange={e => { setQuery(e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <Typography variant="caption" color="text.secondary">
                      Appuyez sur Entrée pour rechercher
                    </Typography>
                  </InputAdornment>
                )
              }}
            />
            {/* Suggestions de recherche */}
            {showSuggestions && suggestions.length > 0 && (
              <Paper sx={{ position: 'absolute', left: 0, right: 0, zIndex: 10, mt: 1, maxHeight: 320, overflowY: 'auto' }}>
                <List dense disablePadding>
                  {suggestions.map(s => (
                    <ListItem key={s.type + '-' + s.id} disablePadding>
                      <ListItemButton
                        onMouseDown={e => {
                          e.preventDefault();
                          setQuery(s.label);
                          setShowSuggestions(false);
                          setTimeout(() => handleSearchSubmit(new Event('submit') as any), 0);
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: s.type === 'BOOK' ? 'primary.main' : s.type === 'EQUIPMENT' ? 'secondary.main' : 'info.main', width: 32, height: 32 }}>
                            {s.icon}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={s.label}
                          secondary={s.sub}
                          primaryTypographyProps={{ fontWeight: 500 }}
                        />
                        <Chip label={s.type === 'BOOK' ? 'Livre' : s.type === 'EQUIPMENT' ? 'Matériel' : 'Usager'} size="small" color={s.type === 'BOOK' ? 'primary' : s.type === 'EQUIPMENT' ? 'secondary' : 'info'} sx={{ ml: 1 }} />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}
          </form>
        </Paper>
        
        {/* Onglets de filtrage */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            aria-label="catégories de résultats"
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab label={`Tous (${totalResults})`} value="all" />
            <Tab label={`Livres (${countBooks})`} value="books" icon={<BookIcon />} iconPosition="start" />
            <Tab label={`Matériel (${countEquipment})`} value="equipment" icon={<EquipmentIcon />} iconPosition="start" />
            <Tab label={`Utilisateurs (${countUsers})`} value="users" icon={<PersonIcon />} iconPosition="start" />
          </Tabs>
        </Box>
        
        {/* Résultats */}
        <Grid container spacing={3}>
          {/* Résultats des livres */}
          {(activeTab === 'all' || activeTab === 'books') && countBooks > 0 && (
            <Grid item component="div" xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <BookIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Livres</Typography>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 2 }}>
                    <Typography variant="subtitle2">Trier par :</Typography>
                    <Button size="small" onClick={() => handleSortItem('name')}>Nom {sortItemBy==='name' && (sortItemDirection==='asc'?'▲':'▼')}</Button>
                    <Button size="small" onClick={() => handleSortItem('customId')}>Code Barre {sortItemBy==='customId' && (sortItemDirection==='asc'?'▲':'▼')}</Button>
                    <Button size="small" onClick={() => handleSortItem('author')}>Auteur {sortItemBy==='author' && (sortItemDirection==='asc'?'▲':'▼')}</Button>
                  </Box>
                  <List disablePadding>
                    {sortedItems
                      .filter(item => item.category === 'BOOK')
                      .map(book => (
                        <ListItem 
                          key={book.id} 
                          disablePadding 
                          sx={{ mb: 1 }}
                        >
                          <ListItemButton 
                            component={Link} 
                            href={`/items?id=${book.id}`}
                            sx={{ borderRadius: 1, '&:hover': { bgcolor: 'action.hover' } }}
                            onClick={e => {
                              e.preventDefault();
                              setSelectedProduct(book);
                              setOpenProductSheet(true);
                            }}
                          >
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: 'primary.main' }}>
                                <BookIcon />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={book.name}
                              secondary={
                                <React.Fragment>
                                  <Typography variant="body2" component="span" display="block">
                                    {book.author} • {book.customId}
                                  </Typography>
                                  {book.description && (
                                    <Typography 
                                      variant="body2" 
                                      color="text.secondary" 
                                      component="span" 
                                      display="block"
                                      sx={{ mt: 0.5 }}
                                    >
                                      {book.description.substring(0, 100)}
                                      {book.description.length > 100 ? '...' : ''}
                                    </Typography>
                                  )}
                                </React.Fragment>
                              }
                            />
                            {(() => {
                              const status = book.available ? 'AVAILABLE' : 'BORROWED';
                              return <StatusBadge status={status} />;
                            })()}
                          </ListItemButton>
                        </ListItem>
                      ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          )}
          
          {/* Résultats du matériel */}
          {(activeTab === 'all' || activeTab === 'equipment') && countEquipment > 0 && (
            <Grid item component="div" xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <EquipmentIcon color="secondary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Matériel</Typography>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 2 }}>
                    <Typography variant="subtitle2">Trier par :</Typography>
                    <Button size="small" onClick={() => handleSortItem('name')}>Nom {sortItemBy==='name' && (sortItemDirection==='asc'?'▲':'▼')}</Button>
                    <Button size="small" onClick={() => handleSortItem('customId')}>Code Barre {sortItemBy==='customId' && (sortItemDirection==='asc'?'▲':'▼')}</Button>
                    <Button size="small" onClick={() => handleSortItem('brand')}>Marque {sortItemBy==='brand' && (sortItemDirection==='asc'?'▲':'▼')}</Button>
                  </Box>
                  <List disablePadding>
                    {sortedItems
                      .filter(item => item.category === 'EQUIPMENT')
                      .map(equipment => (
                        <ListItem 
                          key={equipment.id} 
                          disablePadding 
                          sx={{ mb: 1 }}
                        >
                          <ListItemButton 
                            component={Link} 
                            href={`/items?id=${equipment.id}`}
                            sx={{ borderRadius: 1, '&:hover': { bgcolor: 'action.hover' } }}
                            onClick={e => {
                              e.preventDefault();
                              setSelectedProduct(equipment);
                              setOpenProductSheet(true);
                            }}
                          >
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: 'secondary.main' }}>
                                <EquipmentIcon />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={equipment.name}
                              secondary={
                                <React.Fragment>
                                  <Typography variant="body2" component="span" display="block">
                                    {equipment.brand} {equipment.model} • {equipment.customId}
                                  </Typography>
                                  {equipment.description && (
                                    <Typography 
                                      variant="body2" 
                                      color="text.secondary" 
                                      component="span"
                                      display="block"
                                      sx={{ mt: 0.5 }}
                                    >
                                      {equipment.description.substring(0, 100)}
                                      {equipment.description.length > 100 ? '...' : ''}
                                    </Typography>
                                  )}
                                </React.Fragment>
                              }
                            />
                            {(() => {
                              const status = equipment.available ? 'AVAILABLE' : 'BORROWED';
                              return <StatusBadge status={status} />;
                            })()}
                          </ListItemButton>
                        </ListItem>
                      ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          )}
          
          {/* Résultats des utilisateurs */}
          {(activeTab === 'all' || activeTab === 'users') && countUsers > 0 && (
            <Grid item component="div" xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <PersonIcon color="info" sx={{ mr: 1 }} />
                    <Typography variant="h6">Utilisateurs</Typography>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 2 }}>
                    <Typography variant="subtitle2">Trier par :</Typography>
                    <Button size="small" onClick={() => handleSortUser('name')}>Nom {sortUserBy==='name' && (sortUserDirection==='asc'?'▲':'▼')}</Button>
                    <Button size="small" onClick={() => handleSortUser('email')}>Email {sortUserBy==='email' && (sortUserDirection==='asc'?'▲':'▼')}</Button>
                  </Box>
                  <List disablePadding>
                    {sortedUsers.map(user => (
                      <ListItem 
                        key={user.id} 
                        disablePadding 
                        sx={{ mb: 1 }}
                      >
                        <ListItemButton 
                          component={Link} 
                          href={`/users?id=${user.id}`}
                          sx={{ borderRadius: 1, '&:hover': { bgcolor: 'action.hover' } }}
                        >
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: `hsl(${user.name.length * 10}, 70%, 60%)` }}>
                              {getInitials(user.name)}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={user.name}
                            secondary={
                              <React.Fragment>
                                <Typography variant="body2" component="span" display="block">
                                  {user.email} • {user.phone}
                                </Typography>
                                <Typography 
                                  variant="body2" 
                                  color="text.secondary" 
                                  component="span"
                                  display="block"
                                  sx={{ mt: 0.5 }}
                                >
                                  {user.address}
                                </Typography>
                              </React.Fragment>
                            }
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          )}
          
          {/* Aucun résultat */}
          {totalResults === 0 && (
            <Grid item component="div" xs={12}>
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary" component="div">
                  Aucun résultat trouvé pour "{searchQuery}"
                </Typography>
                <Typography variant="body1" color="text.secondary" component="div" sx={{ mt: 2 }}>
                  Essayez avec des termes différents ou vérifiez l'orthographe.
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
        {/* Fiche détaillée d'un item (ProductSheet) */}
        <ProductSheet
          open={openProductSheet}
          item={selectedProduct}
          onClose={() => setOpenProductSheet(false)}
          getHistory={getItemHistory}
          dialogProps={{ maxWidth: 'md', fullWidth: true, PaperProps: { sx: { borderRadius: 2, boxShadow: 8 } } }}
        />
      </Container>
    </MainLayout>
  );
}