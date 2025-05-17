import React from 'react';
import Link from 'next/link';
import { Card, CardContent, Box, Typography, Avatar } from '@mui/material';

// Composant pour les cartes de statistiques cliquables
export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  iconColor: string;
  link: string;
}

const StatCard = ({ title, value, subtitle, icon, iconColor, link }: StatCardProps) => (
  <Link href={link} style={{ textDecoration: 'none' }} passHref>
    <Card sx={{ 
      cursor: 'pointer', 
      transition: 'all 0.2s ease-in-out',
      height: 160,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      '&:hover': { 
        transform: 'translateY(-4px)', 
        boxShadow: 4 
      } 
    }}>
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" color="text.secondary">
            {title}
          </Typography>
          <Avatar sx={{ bgcolor: iconColor }}>
            {icon}
          </Avatar>
        </Box>
        <Typography variant="h3" fontWeight="bold">
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="body2" sx={{ mt: 1 }} color={subtitle.includes('+') ? 'success.main' : subtitle.includes('-') ? 'error.main' : 'text.secondary'}>
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  </Link>
);

export default StatCard;