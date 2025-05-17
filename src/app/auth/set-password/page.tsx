'use client';

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Box, Typography, TextField, Button, Alert, CircularProgress, Paper } from "@mui/material";
import Link from 'next/link';

function SetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!password || password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    try {
      const resp = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password })
      });
      if (resp.ok) {
        setSuccess(true);
      } else {
        const data = await resp.json();
        setError(data.error || "Erreur lors de la mise à jour du mot de passe.");
      }
    } catch (err) {
      setError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#f5f5f5" }}>
      <Paper sx={{ p: 4, minWidth: 350, maxWidth: 400 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Définir votre mot de passe
        </Typography>
        {success ? (
          <>
            <Alert severity="success">Votre mot de passe a été défini. Vous pouvez maintenant vous connecter.</Alert>
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Link href="/auth/login" passHref>
                <Button variant="contained" color="primary">
                  Se connecter
                </Button>
              </Link>
            </Box>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <TextField
              label="Nouveau mot de passe"
              type="password"
              fullWidth
              margin="normal"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoFocus
            />
            <TextField
              label="Confirmer le mot de passe"
              type="password"
              fullWidth
              margin="normal"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
            />
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : "Définir le mot de passe"}
            </Button>
          </form>
        )}
      </Paper>
    </Box>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#f5f5f5" }}>
        <CircularProgress />
      </Box>
    }>
      <SetPasswordForm />
    </Suspense>
  );
}
