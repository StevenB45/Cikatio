// Nouvelle page profil administrateur
'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Paper, Divider, Alert } from '@mui/material';
import { useRouter } from 'next/navigation';
import { getAdminData, logoutAdmin } from '@/lib/auth';
import axios from 'axios';

export default function ProfilePage() {
  const router = useRouter();
  const [admin, setAdmin] = useState<{ id: string; email: string } | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const adminData = getAdminData();
    if (adminData) {
      setAdmin(adminData);
      setEmail(adminData.email);
    } else {
      router.push('/auth/login');
    }
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!email.trim()) {
      setError('L\'email est requis');
      return;
    }
    if (password && password !== passwordConfirm) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    try {
      const resp = await axios.put('/api/auth/profile', {
        id: admin?.id,
        email,
        password: password || undefined
      });
      if (resp.status === 200) {
        const updatedAdmin = {
          ...admin,
          email,
          id: admin?.id
        };
        // Validate data before storing
        if (!updatedAdmin.id || !updatedAdmin.email) {
          throw new Error('Invalid admin data');
        }
        localStorage.setItem('admin', JSON.stringify(updatedAdmin));
        setSuccess('Modifications enregistrées');
        setPassword('');
        setPasswordConfirm('');
      } else {
        setError(resp.data?.error || 'Erreur lors de la modification');
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Erreur lors de la modification');
    }
  };

  const handleLogout = () => {
    logoutAdmin();
    router.push('/auth/login');
  };

  if (!admin) return <Typography>Chargement...</Typography>;

  return (
    <Box maxWidth={500} mx="auto" mt={6}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>Mon profil administrateur</Typography>
        <Divider sx={{ mb: 2 }} />
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <form onSubmit={handleSave}>
          <TextField
            label="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            fullWidth
            margin="normal"
            required
            type="email"
          />
          <TextField
            label="Nouveau mot de passe"
            value={password}
            onChange={e => setPassword(e.target.value)}
            fullWidth
            margin="normal"
            type="password"
            autoComplete="new-password"
          />
          <TextField
            label="Confirmer le mot de passe"
            value={passwordConfirm}
            onChange={e => setPasswordConfirm(e.target.value)}
            fullWidth
            margin="normal"
            type="password"
            autoComplete="new-password"
          />
          <Box mt={2} display="flex" gap={2}>
            <Button type="submit" variant="contained">Enregistrer</Button>
            <Button variant="outlined" color="error" onClick={handleLogout}>Se déconnecter</Button>
          </Box>
        </form>
        <Box mt={3} display="flex" justifyContent="flex-end">
          <Button variant="text" onClick={() => router.push('/')}>Retour à l'accueil</Button>
        </Box>
      </Paper>
    </Box>
  );
}
