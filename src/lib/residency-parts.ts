/**
 * Residency exam parts. The API stores the canonical values below and also accepts the older
 * labels ("Sciences fondamentales", "E_Sciences_Fondamentales", "Médicale", ...), which it
 * normalizes the same way as `normalizeResidencyPart`. Some papers (Oran) have no part.
 */

export const RESIDENCY_PARTS = [
  { value: 'Sciences_fondamentales', label: 'Sciences fondamentales', short: 'Sciences Fond.' },
  { value: 'Pathologie_medico_chirurgical', label: 'Pathologie médico-chirurgicale', short: 'Patho. M/C' },
  { value: 'Dossier_clinique', label: 'Dossier clinique', short: 'Dossier Clin.' },
  { value: 'Biologie', label: 'Biologie', short: 'Biologie' },
  { value: 'Medicale', label: 'Médicale', short: 'Médicale' },
  { value: 'Chirurgie', label: 'Chirurgie', short: 'Chirurgie' },
] as const;

export type ResidencyPart = (typeof RESIDENCY_PARTS)[number]['value'];

const ALIASES: Record<string, ResidencyPart> = {
  sciences_fondamentales: 'Sciences_fondamentales',
  e_sciences_fondamentales: 'Sciences_fondamentales',
  pathologie_medico_chirurgical: 'Pathologie_medico_chirurgical',
  pathologie_medico_chirurgicale: 'Pathologie_medico_chirurgical',
  pathologies_medico_chirurgicales: 'Pathologie_medico_chirurgical',
  e_pathologies_m_c: 'Pathologie_medico_chirurgical',
  dossier_clinique: 'Dossier_clinique',
  dossiers_cliniques: 'Dossier_clinique',
  e_dossiers_cliniques: 'Dossier_clinique',
  biologie: 'Biologie',
  medicale: 'Medicale',
  chirurgie: 'Chirurgie',
};

/** Canonical part for any known spelling, or null (no part / unknown). */
export function normalizeResidencyPart(value: unknown): ResidencyPart | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const key = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return ALIASES[key] ?? null;
}

/** Display label of a part; "No part" when the question has none. */
export function residencyPartLabel(value: unknown, variant: 'label' | 'short' = 'label'): string {
  const part = normalizeResidencyPart(value);
  if (!part) return typeof value === 'string' && value.trim() ? value : 'No part';
  const entry = RESIDENCY_PARTS.find((p) => p.value === part)!;
  return variant === 'short' ? entry.short : entry.label;
}
