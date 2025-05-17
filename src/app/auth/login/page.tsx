'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  InputAdornment,
  IconButton,
  Grid,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Lock as LockIcon,
  Email as EmailIcon,
  Login as LoginIcon,
  AdminPanelSettings as AdminIcon
} from '@mui/icons-material';
import axios from 'axios';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';

export default function LoginPage() {
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const resp = await axios.post('/api/auth/login', { email, password });
      if (resp.status === 200 && resp.data) {
        // Create a clean object with only the necessary data
        const adminData = {
          email: resp.data.email || '',
          role: resp.data.role || 'ADMIN',
          id: resp.data.id || '',
          firstName: resp.data.firstName || '',
          lastName: resp.data.lastName || ''
        };
        
        // Validate the data before storing
        if (!adminData.email || !adminData.id) {
          throw new Error('Invalid admin data received');
        }
        
        // Store as properly formatted JSON
        try {
          localStorage.setItem('admin', JSON.stringify(adminData));
          router.push('/dashboard');
        } catch (storageError) {
          console.error('Error storing admin data:', storageError);
          setError('Error storing session data');
        }
      } else {
        setError('Email ou mot de passe incorrect');
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Erreur lors de la connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Box
            sx={{
              mb: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            <Typography
              component="h1"
              variant="h4"
              fontWeight="bold"
              color="primary"
              gutterBottom
            >
              CIKATIO
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Gestionnaire de Prêts de Livres et Matériel
            </Typography>
          </Box>
          
          <Divider sx={{ width: '100%', mb: 3 }} />
          
          <AdminIcon color="primary" sx={{ fontSize: 40, mb: 2 }} />
          
          <Typography component="h2" variant="h5" gutterBottom>
            Connexion Administrateur
          </Typography>
          
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Accès réservé aux administrateurs. Les usagers n'ont pas besoin de se connecter.
          </Typography>
          
          {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}
          
          {showForgotPassword ? (
            <ForgotPasswordForm />
          ) : (
            <>
              <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', mt: 1 }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="Adresse email"
                  name="email"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Mot de passe"
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  sx={{ mt: 3, mb: 2, py: 1.2 }}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <LoginIcon />}
                >
                  {loading ? 'Connexion en cours...' : 'Se connecter'}
                </Button>
                
                <Grid container justifyContent="flex-end">
                  <Grid item>
                    <Button variant="text" onClick={() => setShowForgotPassword(true)} sx={{ textTransform: 'none', p: 0 }}>
                      <Typography variant="body2" color="primary">
                        Mot de passe oublié ?
                      </Typography>
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </>
          )}
        </Paper>
      </Container>
      
      {/* Ajout du footer avec la mention de développeur */}
      <Box
        sx={{
          mt: 2,
          width: '100%',
          textAlign: 'center',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Développé avec ❤️ par StevenB
        </Typography>
      </Box>
    </Box>
  );
}