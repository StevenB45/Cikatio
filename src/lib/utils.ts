// Utilitaires globaux pour l'application

/**
 * Formate une date en chaîne locale française (ex: 22/04/2025)
 * Retourne une chaîne personnalisée pour les dates invalides
 */
export function formatDate(date: Date | string | undefined | null): string {
  if (!date) return 'Non spécifiée';
  try {
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    // Vérifier si la date est valide
    if (isNaN(d.getTime())) {
      console.warn(`formatDate: Date invalide reçue: ${date}`);
      return 'Date invalide';
    }
    return d.toLocaleDateString('fr-FR');
  } catch (error) {
    console.error(`Erreur lors du formatage de la date: ${date}`, error);
    return 'Erreur de date';
  }
}

/**
 * Génère les initiales à partir d'un nom complet (ex: "Jean Dupont" => "JD")
 */
export function getInitials(name: string): string {
  if (!name) return '';
  return name
    .split(' ')
    .map((n) => n[0])
    .filter((_, i, arr) => i === 0 || i === arr.length - 1) // Prend la première et la dernière initiale
    .join('')
    .toUpperCase();
}

// Nouvelle fonction pour calculer l'âge
export function calculateAge(dateOfBirth: Date | string | null | undefined): number | null {
  if (!dateOfBirth) return null;

  try {
    const birthDate = new Date(dateOfBirth);
    // Vérifier si la date est valide
    if (isNaN(birthDate.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    // Retourne null si l'âge est négatif (date de naissance dans le futur)
    return age >= 0 ? age : null;
  } catch (e) {
    console.error("Error calculating age:", e);
    return null; // Gère les erreurs potentielles lors du traitement de la date
  }
}

export function getRelativeDate(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

export function calculateTimeProgress(borrowedAt: Date, dueAt: Date) {
  const now = new Date();
  const start = new Date(borrowedAt);
  const end = new Date(dueAt);
  const totalDuration = end.getTime() - start.getTime();
  const elapsedDuration = now.getTime() - start.getTime();
  const progress = (elapsedDuration / totalDuration) * 100;
  return Math.min(Math.max(progress, 0), 100);
}
