# Composants Communs

Ce dossier contient les composants réutilisables de l'application.

## Dialogues

### CommonDialog

Un composant de dialogue flexible et réutilisable pour les formulaires, confirmations et affichages d'informations.

#### Utilisation

```tsx
import { CommonDialog, useDialog } from '@/components/common';

const MonComposant = () => {
  const { open, handleOpen, handleClose, handleConfirm, loading } = useDialog({
    onConfirm: async () => {
      // Logique de confirmation
    },
    onCancel: () => {
      // Logique d'annulation
    }
  });

  return (
    <>
      <button onClick={handleOpen}>Ouvrir le dialogue</button>
      
      <CommonDialog
        open={open}
        onClose={handleClose}
        title="Titre du dialogue"
        onConfirm={handleConfirm}
        loading={loading}
        severity="warning"
        message="Êtes-vous sûr de vouloir continuer ?"
      />
    </>
  );
};
```

#### Props

| Prop | Type | Description | Par défaut |
|------|------|-------------|------------|
| open | boolean | Si le dialogue est ouvert | - |
| onClose | () => void | Fonction appelée à la fermeture | - |
| title | React.ReactNode | Titre du dialogue | - |
| children | React.ReactNode | Contenu du dialogue | - |
| confirmLabel | string | Texte du bouton de confirmation | "Confirmer" |
| cancelLabel | string | Texte du bouton d'annulation | "Annuler" |
| onConfirm | () => void | Fonction appelée à la confirmation | - |
| confirmDisabled | boolean | Désactive le bouton de confirmation | false |
| dividers | boolean | Ajoute des bordures au contenu | true |
| maxWidth | 'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' | Taille maximale du dialogue | "md" |
| actions | React.ReactNode | Actions personnalisées | - |
| ariaLabelledby | string | ID pour l'accessibilité | - |
| dialogProps | Partial<DialogProps> | Props supplémentaires pour Dialog | - |
| loading | boolean | Affiche un indicateur de chargement | false |
| severity | 'error' \| 'warning' \| 'info' \| 'success' | Type de notification | 'info' |
| message | React.ReactNode | Message à afficher | - |

### Hook useDialog

Un hook personnalisé pour gérer l'état et la logique des dialogues.

#### Utilisation

```tsx
const { open, handleOpen, handleClose, handleConfirm, loading } = useDialog({
  onConfirm: async () => {
    // Logique de confirmation
  },
  onCancel: () => {
    // Logique d'annulation
  }
});
```

#### Options

| Option | Type | Description |
|--------|------|-------------|
| onConfirm | () => void \| Promise<void> | Fonction appelée à la confirmation |
| onCancel | () => void | Fonction appelée à l'annulation |

#### Retour

| Propriété | Type | Description |
|-----------|------|-------------|
| open | boolean | État d'ouverture du dialogue |
| handleOpen | () => void | Fonction pour ouvrir le dialogue |
| handleClose | () => void | Fonction pour fermer le dialogue |
| handleConfirm | () => Promise<void> | Fonction pour confirmer l'action |
| loading | boolean | État de chargement |

## Tests

Les composants et hooks sont testés avec Jest et React Testing Library. Les tests sont organisés dans des dossiers `__tests__` à côté des fichiers sources.

### Exécution des Tests

```bash
# Exécuter tous les tests
npm test

# Exécuter les tests en mode watch
npm run test:watch
```

### Structure des Tests

- `__tests__/useDialog.test.ts` : Tests unitaires pour le hook useDialog
- `__tests__/CommonDialog.test.tsx` : Tests d'intégration pour le composant CommonDialog

### Exemple de Test

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import CommonDialog from '../CommonDialog';

describe('CommonDialog', () => {
  it('devrait rendre le dialogue avec les props par défaut', () => {
    render(<CommonDialog open={true} onClose={() => {}} title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

## Bonnes Pratiques

1. Utilisez le hook `useDialog` pour gérer l'état des dialogues
2. Préférez les messages explicites pour les confirmations
3. Utilisez la prop `severity` appropriée selon le contexte
4. Évitez de surcharger le dialogue avec trop de contenu
5. Utilisez les actions personnalisées pour des cas d'utilisation spécifiques
6. Écrivez des tests pour les nouveaux cas d'utilisation
7. Suivez les conventions de nommage des tests
8. Utilisez les matchers de Jest DOM pour les assertions

## Configuration

Le projet utilise les configurations suivantes pour les tests :

- Jest avec Next.js
- React Testing Library
- Jest DOM pour les matchers supplémentaires
- Configuration TypeScript pour les tests

Les fichiers de configuration sont :
- `jest.config.js` : Configuration principale de Jest
- `jest.setup.js` : Configuration des tests et mocks globaux 