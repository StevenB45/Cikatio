import React, { ReactNode } from 'react';
import Link from 'next/link';
import {
  Card,
  CardProps,
  CardHeader,
  CardHeaderProps,
  CardContent,
  Avatar,
  Typography,
  Box,
  Button,
  Divider,
  SxProps,
  Theme
} from '@mui/material';

// Types de carte disponibles
export type CardType = 'stat' | 'action' | 'list';

// Props du composant DashboardCard
export interface DashboardCardProps {
  // Propriétés communes
  title: string;
  icon?: ReactNode;
  iconColor?: string;
  link?: string;
  onClick?: () => void;
  sx?: SxProps<Theme>;
  cardProps?: CardProps;
  headerProps?: CardHeaderProps;
  action?: ReactNode;
  
  // Propriétés spécifiques par type
  type?: CardType;
  value?: string | number;
  subtitle?: string;
  children?: ReactNode;
  centerContent?: boolean;
  height?: number | string;
}

/**
 * Composant de carte unifié pour tout le tableau de bord
 * Peut être utilisé dans 3 modes:
 * - 'stat': Affiche une statistique avec un titre, une valeur et une icône (vue horizontale)
 * - 'action': Card cliquable avec icône centrale pour les actions rapides (vue verticale)
 * - 'list': Card avec un entête, un divider, et un contenu quelconque (typiquement une liste)
 */
export const DashboardCard = ({
  title,
  icon,
  iconColor = 'primary.main',
  link,
  onClick,
  sx = {},
  cardProps = {},
  headerProps = {},
  action,
  type = 'list',
  value,
  subtitle,
  children,
  centerContent = false,
  height = '100%'  // Utiliser une hauteur par défaut de 100% pour tous les types
}: DashboardCardProps) => {
  
  // Configuration du contenu selon le type
  const cardContent = () => {
    switch (type) {
      case 'stat':
        return (
          <CardContent sx={{ flexGrow: 1, py: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" component="div" color="text.secondary">
                {title}
              </Typography>
              {icon && (
                <Avatar sx={{ bgcolor: iconColor, width: 48, height: 48, ml: 2 }}>
                  {icon}
                </Avatar>
              )}
            </Box>
            <Typography variant="h3" component="div" fontWeight="bold">
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {subtitle}
              </Typography>
            )}
          </CardContent>
        );
        
      case 'action':
        return (
          <CardContent sx={{ 
            p: 3, 
            py: 4,
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexGrow: 1,
            minHeight: 160
          }}>
            {icon && (
              <Avatar sx={{ bgcolor: iconColor, width: 56, height: 56, mb: 3 }}>
                {icon}
              </Avatar>
            )}
            <Typography variant="h6" fontWeight="bold" align="center" gutterBottom>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                {subtitle}
              </Typography>
            )}
          </CardContent>
        );
        
      case 'list':
      default:
        return (
          <>
            <CardHeader
              title={title}
              action={action || (link ? <Button component={Link} href={link} size="small">Voir tout</Button> : null)}
              {...headerProps}
            />
            <Divider />
            <CardContent sx={{ 
              flexGrow: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: centerContent ? 'center' : 'flex-start',
              justifyContent: centerContent ? 'center' : 'flex-start',
              minHeight: 200
            }}>
              {children}
            </CardContent>
          </>
        );
    }
  };

  // Styles communs à toutes les cartes - coins moins arrondis et ombre uniforme
  const baseCardStyles = {
    height,
    borderRadius: 1,
    boxShadow: 1,
    display: 'flex', 
    flexDirection: 'column',
    ...sx
  };

  // Styles spécifiques par type
  let cardStyles = { ...baseCardStyles };
  
  if (type === 'stat' || type === 'action') {
    cardStyles = {
      ...cardStyles,
      cursor: 'pointer',
      transition: 'transform 0.2s, box-shadow 0.2s',
      textDecoration: 'none',
      '&:hover': { 
        transform: 'translateY(-4px)',
        boxShadow: 2,
      }
    };
  }

  // Construction de la carte
  const card = (
    <Card
      sx={cardStyles}
      onClick={onClick}
      {...cardProps}
    >
      {cardContent()}
    </Card>
  );

  // Ajouter le lien si nécessaire
  if (link && !onClick && type !== 'list') {
    return (
      <Link href={link} style={{ textDecoration: 'none' }}>
        {card}
      </Link>
    );
  }

  // Sinon retourner simplement la carte
  return card;
};

export default DashboardCard;