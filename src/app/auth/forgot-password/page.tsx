import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';
import { Box, Paper, Typography, Divider } from '@mui/material';

export default function ForgotPasswordPage() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5' }}>
      <Paper sx={{ p: 4, minWidth: 350, maxWidth: 400 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Réinitialiser le mot de passe
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <ForgotPasswordForm />
      </Paper>
    </Box>
  );
}
