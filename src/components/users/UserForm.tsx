import React, { useState, useEffect } from 'react';
import { TextField, Button, Box, InputAdornment, MenuItem, CircularProgress, Autocomplete as MUIAutocomplete, Grid, Chip } from '@mui/material';
import { Person as PersonIcon, Email as EmailIcon, Phone as PhoneIcon, Home as HomeIcon, AdminPanelSettings as AdminIcon } from '@mui/icons-material';
import axios from 'axios';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { fr } from 'date-fns/locale';
import { calculateAge } from '@/lib/utils';
import { RoleBadge } from './RoleBadge';

// Formulaire de création/édition d'usager
// Utilisé dans les pages de gestion des usagers et lors de la réservation d'un item

export interface UserFormProps {
  initialFirstName?: string;
  initialLastName?: string;
  initialEmail?: string;
  initialPhone?: string;
  initialAddress?: string;
  initialIsAdmin?: boolean;
  initialDateOfBirth?: string | Date | null;
  initialDepartmentCode?: string | null;
  onSubmit: (user: { firstName: string; lastName: string; email: string; phone: string; address: string; isAdmin: boolean; dateOfBirth: string | null; departmentCode: string | null; }) => void;
  onCancel?: () => void;
  submitLabel?: string;
}

export default function UserForm({
  initialFirstName = '',
  initialLastName = '',
  initialEmail = '',
  initialPhone = '',
  initialAddress = '',
  initialIsAdmin = false,
  initialDateOfBirth = null,
  initialDepartmentCode = null,
  onSubmit,
  onCancel,
  submitLabel = 'Ajouter',
}: UserFormProps) {
  // Hooks pour gérer les champs du formulaire et la validation
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState(initialPhone);
  const [address, setAddress] = useState(initialAddress);
  const [isAdmin, setIsAdmin] = useState(initialIsAdmin);
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(initialDateOfBirth ? new Date(initialDateOfBirth) : null);
  const [departmentCode, setDepartmentCode] = useState<string | null>(initialDepartmentCode);
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    setFirstName(initialFirstName);
    setLastName(initialLastName);
    setEmail(initialEmail);
    setPhone(initialPhone);
    setAddress(initialAddress);
    setIsAdmin(initialIsAdmin);
    setDateOfBirth(initialDateOfBirth ? new Date(initialDateOfBirth) : null);
    setDepartmentCode(initialDepartmentCode);
  }, [initialFirstName, initialLastName, initialEmail, initialPhone, initialAddress, initialIsAdmin, initialDateOfBirth, initialDepartmentCode]);

  // Suggestion d'adresse via l'API Base Adresse Nationale (autocomplete)
  const fetchAddressSuggestions = async (query: string) => {
    if (!query || query.length < 3) return [];
    setAddressLoading(true);
    try {
      const response = await axios.get('https://api-adresse.data.gouv.fr/search/', {
        params: { q: query, limit: 5 },
      });
      setAddressSuggestions(response.data.features.map((f: any) => f.properties.label));
    } catch {
      setAddressSuggestions([]);
    }
    setAddressLoading(false);
  };

  // Extraction du code département depuis le code postal de l'adresse (API Adresse)
  const extractDepartmentCode = (postcode: string | undefined | null): string | null => {
    if (!postcode || typeof postcode !== 'string') return null;
    const code = postcode.substring(0, 2);
    if (/^\d{2}$/.test(code)) return code;
    if (postcode.startsWith('200') || postcode.startsWith('201')) return '2A';
    if (postcode.startsWith('202') || postcode.startsWith('206')) return '2B';
    return null;
  };

  // Validation des champs principaux (prénom, nom, email, téléphone)
  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!firstName.trim()) newErrors.firstName = 'Le prénom est requis';
    if (!lastName.trim()) newErrors.lastName = 'Le nom est requis';
    if (!email.trim()) newErrors.email = 'L\'email est requis';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Format d\'email invalide';
    if (!phone.trim()) newErrors.phone = 'Le téléphone est requis';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Soumission du formulaire (onSubmit)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({ firstName, lastName, email, phone, address, isAdmin, dateOfBirth: dateOfBirth ? dateOfBirth.toISOString() : null, departmentCode });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Prénom */}
        <Box sx={{ width: '100%' }}>
          <TextField
            label="Prénom"
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            fullWidth
            required
            error={!!errors.firstName}
            helperText={errors.firstName}
            InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon /></InputAdornment> }}
          />
        </Box>
        
        {/* Nom */}
        <Box sx={{ width: '100%' }}>
          <TextField
            label="Nom"
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            fullWidth
            required
            error={!!errors.lastName}
            helperText={errors.lastName}
            InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon /></InputAdornment> }}
          />
        </Box>
        
        {/* Email */}
        <Box sx={{ width: '100%' }}>
          <TextField
            label="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            fullWidth
            required
            error={!!errors.email}
            helperText={errors.email}
            InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon /></InputAdornment> }}
          />
        </Box>
        
        {/* Téléphone */}
        <Box sx={{ width: '100%' }}>
          <TextField
            label="Téléphone"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            fullWidth
            required
            error={!!errors.phone}
            helperText={errors.phone}
            InputProps={{ startAdornment: <InputAdornment position="start"><PhoneIcon /></InputAdornment> }}
          />
        </Box>
        
        {/* Rôle */}
        <Box sx={{ width: '100%' }}>
          <TextField
            select
            label="Rôle"
            value={isAdmin ? 'admin' : 'standard'}
            onChange={e => setIsAdmin(e.target.value === 'admin')}
            fullWidth
            InputProps={{
              startAdornment: <InputAdornment position="start"><RoleBadge isAdmin={isAdmin} /></InputAdornment>
            }}
          >
            <MenuItem value="standard">Utilisateur</MenuItem>
            <MenuItem value="admin">Administrateur</MenuItem>
          </TextField>
        </Box>
        
        {/* Adresse */}
        <Box sx={{ width: '100%' }}>
          <MUIAutocomplete
            freeSolo
            fullWidth
            options={addressSuggestions}
            loading={addressLoading}
            inputValue={address}
            onInputChange={(_, value) => {
              setAddress(value);
              fetchAddressSuggestions(value);
            }}
            onChange={(_, value) => {
              setAddress(value || '');
              if (value) {
                // On va rechercher le code postal dans la suggestion sélectionnée
                fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(value)}&limit=1`).then(res => res.json()).then(data => {
                  const feature = data.features && data.features[0];
                  if (feature && feature.properties && feature.properties.postcode) {
                    setDepartmentCode(extractDepartmentCode(feature.properties.postcode));
                  } else {
                    setDepartmentCode(null);
                  }
                });
              } else {
                setDepartmentCode(null);
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Adresse"
                variant="outlined"
                fullWidth
                InputProps={{
                  ...params.InputProps,
                  startAdornment: <InputAdornment position="start"><HomeIcon /></InputAdornment>,
                  endAdornment: (
                    <>
                      {addressLoading ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        </Box>

        {/* Date de naissance ergonomique */}
        <Box sx={{ width: '100%' }}>
          <TextField
            label="Date de naissance"
            type="date"
            value={dateOfBirth ? dateOfBirth.toISOString().slice(0, 10) : ''}
            onChange={e => {
              const val = e.target.value;
              if (val) {
                const d = new Date(val);
                // Empêche la sélection d'une date future
                if (d > new Date()) return;
                setDateOfBirth(d);
              } else {
                setDateOfBirth(null);
              }
            }}
            fullWidth
            size="small"
            inputProps={{
              max: new Date().toISOString().slice(0, 10),
              inputMode: 'numeric',
              pattern: '[0-9]{4}-[0-9]{2}-[0-9]{2}'
            }}
            InputLabelProps={{ shrink: true }}
            error={!!(dateOfBirth && dateOfBirth > new Date())}
            helperText={
              dateOfBirth && dateOfBirth > new Date()
                ? 'La date ne peut pas être dans le futur'
                : dateOfBirth
                  ? `Âge : ${calculateAge(dateOfBirth)} ans`
                  : 'Format attendu : JJ/MM/AAAA'
            }
          />
        </Box>

        {/* Code département (affiché en lecture seule) */}
        {departmentCode && (
          <Box sx={{ width: '100%' }}>
            <TextField
              label="Code département"
              value={departmentCode}
              fullWidth
              size="small"
              InputProps={{ readOnly: true }}
            />
          </Box>
        )}

        {/* Boutons */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          {onCancel && (
            <Button onClick={onCancel} sx={{ mr: 1 }}>Annuler</Button>
          )}
          <Button type="submit" variant="contained" disabled={!firstName || !lastName || !email || !phone}>{submitLabel}</Button>
        </Box>
      </Box>
    </form>
  );
}
