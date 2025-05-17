import { Box, Typography } from '@mui/material';
import React from 'react';

interface PageTitleProps {
  title: string;
  subtitle?: string;
}

const PageTitle: React.FC<PageTitleProps> = ({ title, subtitle }) => (
  <Box sx={{ mb: 4, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
    <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
      {title}
    </Typography>
    {subtitle && (
      <Typography variant="body1" color="text.secondary">
        {subtitle}
      </Typography>
    )}
  </Box>
);

export default PageTitle;
