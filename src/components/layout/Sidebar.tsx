'use client';

import React, { useMemo } from 'react';
import { styled } from '@mui/material/styles';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  MenuBook as BookIcon,
  Inventory as InventoryIcon,
  Group as UserIcon,
  SwapHoriz as LoanIcon,
  BarChart as StatsIcon,
  EventNote as ReservationIcon
} from '@mui/icons-material';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

const drawerWidth = 240;

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  width: drawerWidth,
  flexShrink: 0,
  '& .MuiDrawer-paper': {
    width: drawerWidth,
    boxSizing: 'border-box',
    backgroundColor: theme.palette.primary.main,
    color: 'white'
  },
}));

const LogoBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(2),
  backgroundColor: 'rgba(0, 0, 0, 0.15)'
}));

const StyledListItemButton = styled(ListItemButton)(({ theme }) => ({
  borderRadius: theme.spacing(1),
  margin: theme.spacing(0.5, 1),
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)'
  },
  '&.active': {
    backgroundColor: 'rgba(255, 255, 255, 0.2)'
  }
}));

const StyledListItemIcon = styled(ListItemIcon)({
  color: 'white',
  minWidth: '40px'
});

// Menu items défini à l'extérieur pour éviter la recréation à chaque rendu
const menuItems = [
  { text: 'Tableau de bord', path: '/dashboard', icon: <DashboardIcon /> },
  { text: 'Livres', path: '/items?type=book', icon: <BookIcon /> },
  { text: 'Matériel', path: '/items?type=equipment', icon: <InventoryIcon /> },
  { text: 'Usagers', path: '/users', icon: <UserIcon /> },
  { text: 'Prêts', path: '/loans', icon: <LoanIcon /> },
  { text: 'Réservations', path: '/reservations', icon: <ReservationIcon /> },
  { text: 'Statistiques', path: '/dashboard/stats', icon: <StatsIcon /> }
];

// Barre latérale de navigation principale
// Affiche les liens vers les pages principales de l'application
// Gère la mise en surbrillance du lien actif
export default function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Détermination des liens actifs selon l'URL courante
  // Déterminer quels liens sont actifs (mémorisé pour éviter des calculs inutiles)
  const activeItems = useMemo(() => {
    return menuItems.map(item => {
      // Cas des chemins sans paramètres de requête
      if (!item.path.includes('?')) {
        return {
          ...item,
          isActive: pathname === item.path || 
                  (pathname.startsWith(item.path + '/') && item.path !== '/dashboard')
        };
      }
      
      // Cas des chemins avec paramètres de requête
      const [itemBasePath, itemQueryString] = item.path.split('?');
      const itemParams = new URLSearchParams(itemQueryString);
      const typeParam = searchParams.get('type');
      
      // Si le chemin de base correspond
      if (pathname === itemBasePath) {
        // Gestion spécifique pour les items
        if (itemParams.has('type')) {
          const itemType = itemParams.get('type');
          if (itemType === 'book') {
            return { ...item, isActive: !typeParam || typeParam === 'book' };
          }
          if (itemType === 'equipment') {
            return { ...item, isActive: typeParam === 'equipment' };
          }
        }

        // Pour d'autres paramètres, vérification que tous les paramètres correspondent
        const allParamsMatch = Array.from(itemParams.entries()).every(
          ([key, value]) => searchParams.get(key) === value
        );
        return { ...item, isActive: allParamsMatch };
      }
      
      return { ...item, isActive: false };
    });
  }, [pathname, searchParams]);

  // Affichage de la liste des liens de navigation
  return (
    <StyledDrawer variant="permanent" anchor="left">
      <LogoBox>
        <Typography variant="h5" fontWeight="bold">
          CIKATIO
        </Typography>
      </LogoBox>
      <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }} />
      <List>
        {activeItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <Link href={item.path} passHref style={{ width: '100%', textDecoration: 'none', color: 'inherit' }}>
              <StyledListItemButton className={item.isActive ? 'active' : ''}>
                <StyledListItemIcon>{item.icon}</StyledListItemIcon>
                <ListItemText primary={item.text} />
              </StyledListItemButton>
            </Link>
          </ListItem>
        ))}
      </List>
    </StyledDrawer>
  );
}