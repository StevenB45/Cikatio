"use client";

import React, { useState } from 'react';
import { Box, TextField, Button, Alert, CircularProgress } from '@mui/material';
import axios from 'axios';

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const resp = await axios.post('/api/auth/forgot-password', { email });
      if (resp.status === 200) {
        setSuccess('Un email de réinitialisation a été envoyé si l’adresse existe.');
      } else {
        setError(resp.data?.error || 'Erreur lors de la demande.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Erreur lors de la demande.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', maxWidth: 400, mx: 'auto', mt: 4 }}>
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <TextField
        label="Adresse email"
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        fullWidth
        required
        margin="normal"
      />
      <Button
        type="submit"
        variant="contained"
        color="primary"
        fullWidth
        disabled={loading || !email}
        sx={{ mt: 2 }}
      >
        {loading ? <CircularProgress size={22} /> : 'Envoyer le lien de réinitialisation'}
      </Button>
    </Box>
  );
}
