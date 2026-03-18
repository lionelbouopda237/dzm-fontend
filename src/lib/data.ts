export interface Invoice {
  id: string;
  client: string;
  structure: 'DZM A' | 'DZM B';
  ht: number;
  tva: number;
  ristourne: number;
  ttc: number;
  casiers: number;
  retours: number;
  date: string;
  statut: 'payé' | 'en attente' | 'anomalie';
  produits?: ProductLine[];
}

export interface ProductLine {
  produit: string;
  quantite: number;
  prixUnitaire: number;
  total: number;
}

export interface Payment {
  id: string;
  invoice: string;
  structure: 'DZM A' | 'DZM B';
  amount: number;
  method: string;
  client: string;
  date: string;
  status: 'payé' | 'en attente' | 'anomalie';
}

export interface Product {
  nom: string;
  quantite: number;
  prixUnitaire: number;
  caTotal: number;
  facturesAssociees: number;
  structure: string;
  tendance: 'hausse' | 'baisse' | 'stable';
}

export const MOCK_INVOICES: Invoice[] = [
  { id: 'FA-2026-001', client: 'Bar Central Yaoundé', structure: 'DZM A', ht: 185000, tva: 27750, ristourne: 5000, ttc: 207750, casiers: 15, retours: 3, date: '01/03/2026', statut: 'payé' },
  { id: 'FA-2026-002', client: 'Hôtel Palace', structure: 'DZM A', ht: 320000, tva: 48000, ristourne: 10000, ttc: 358000, casiers: 25, retours: 5, date: '05/03/2026', statut: 'payé' },
  { id: 'FA-2026-003', client: 'Snack Chez Marie', structure: 'DZM A', ht: 95000, tva: 14250, ristourne: 2000, ttc: 107250, casiers: 8, retours: 2, date: '08/03/2026', statut: 'en attente' },
  { id: 'FA-2026-004', client: 'Restaurant Le Grenier', structure: 'DZM A', ht: 210000, tva: 31500, ristourne: 7000, ttc: 234500, casiers: 18, retours: 4, date: '12/03/2026', statut: 'payé' },
  { id: 'FA-2026-005', client: 'Cave Modern', structure: 'DZM A', ht: 145000, tva: 21750, ristourne: 3000, ttc: 163750, casiers: 12, retours: 0, date: '15/03/2026', statut: 'anomalie' },
  { id: 'FA-2026-006', client: 'Bar Ambiance Plus', structure: 'DZM B', ht: 175000, tva: 26250, ristourne: 4000, ttc: 197250, casiers: 14, retours: 3, date: '02/03/2026', statut: 'payé' },
  { id: 'FA-2026-007', client: 'Snack du Marché', structure: 'DZM B', ht: 88000, tva: 13200, ristourne: 1500, ttc: 99700, casiers: 7, retours: 1, date: '06/03/2026', statut: 'payé' },
  { id: 'FA-2026-008', client: 'Hôtel des Voyageurs', structure: 'DZM B', ht: 265000, tva: 39750, ristourne: 8000, ttc: 296750, casiers: 22, retours: 6, date: '10/03/2026', statut: 'en attente' },
  { id: 'FA-2026-009', client: 'Restaurant Saveur', structure: 'DZM B', ht: 120000, tva: 18000, ristourne: 2500, ttc: 135500, casiers: 10, retours: 2, date: '14/03/2026', statut: 'payé' },
  { id: 'FA-2026-010', client: 'Cave du Centre', structure: 'DZM B', ht: 195000, tva: 29250, ristourne: 5500, ttc: 218750, casiers: 16, retours: 4, date: '16/03/2026', statut: 'anomalie' },
];

export const MOCK_PAYMENTS: Payment[] = [
  { id: 'TXN-15765062067', invoice: 'FA-2026-001', structure: 'DZM A', amount: 207750, method: 'Orange Money', client: 'Bar Central Yaoundé', date: '02/03/2026', status: 'payé' },
  { id: 'TXN-15765062068', invoice: 'FA-2026-002', structure: 'DZM A', amount: 358000, method: 'Wave', client: 'Hôtel Palace', date: '06/03/2026', status: 'payé' },
  { id: 'TXN-15765062069', invoice: 'FA-2026-006', structure: 'DZM B', amount: 197250, method: 'MTN MoMo', client: 'Bar Ambiance Plus', date: '03/03/2026', status: 'payé' },
  { id: 'TXN-15765062070', invoice: 'FA-2026-007', structure: 'DZM B', amount: 99700, method: 'Orange Money', client: 'Snack du Marché', date: '07/03/2026', status: 'payé' },
  { id: 'TXN-15765062071', invoice: 'FA-2026-003', structure: 'DZM A', amount: 107250, method: 'Wave', client: 'Snack Chez Marie', date: '09/03/2026', status: 'en attente' },
  { id: 'TXN-15765062072', invoice: 'FA-2026-008', structure: 'DZM B', amount: 296750, method: 'MTN MoMo', client: 'Hôtel des Voyageurs', date: '11/03/2026', status: 'en attente' },
];

export const MOCK_PRODUCTS: Product[] = [
  { nom: 'Casier Beaufort 65cl', quantite: 450, prixUnitaire: 4500, caTotal: 2025000, facturesAssociees: 8, structure: 'DZM A / DZM B', tendance: 'hausse' },
  { nom: 'Casier Mutzig 65cl', quantite: 280, prixUnitaire: 5200, caTotal: 1456000, facturesAssociees: 6, structure: 'DZM A / DZM B', tendance: 'hausse' },
  { nom: 'Casier Top Ananas 35cl', quantite: 130, prixUnitaire: 3800, caTotal: 494000, facturesAssociees: 4, structure: 'DZM A', tendance: 'stable' },
  { nom: 'Casier Coca-Cola 35cl', quantite: 95, prixUnitaire: 4000, caTotal: 380000, facturesAssociees: 3, structure: 'DZM B', tendance: 'baisse' },
  { nom: 'Casier Malta 35cl', quantite: 72, prixUnitaire: 3500, caTotal: 252000, facturesAssociees: 2, structure: 'DZM A', tendance: 'stable' },
];

export const formatFCFA = (val: number): string =>
  new Intl.NumberFormat('fr-FR').format(val) + ' FCFA';

export const CHART_DATA = [
  { name: 'Jan', dzmA: 1200000, dzmB: 680000 },
  { name: 'Fév', dzmA: 1450000, dzmB: 720000 },
  { name: 'Mar', dzmA: 1800000, dzmB: 850000 },
  { name: 'Avr', dzmA: 1650000, dzmB: 910000 },
  { name: 'Mai', dzmA: 1920000, dzmB: 780000 },
  { name: 'Juin', dzmA: 2100000, dzmB: 950000 },
];

export const PIE_DATA = [
  { name: 'DZM A', value: 71, color: '#1a3fcc' },
  { name: 'DZM B', value: 29, color: '#d4600a' },
];

export const ACTIVITY_TIMELINE = [
  { time: '08:15', text: 'Facture FA-2026-004 créée pour Restaurant Le Grenier', type: 'facture' },
  { time: '09:30', text: 'Paiement TXN-15765062067 reçu via Orange Money', type: 'paiement' },
  { time: '10:45', text: 'Anomalie détectée sur FA-2026-005 — total incohérent', type: 'alerte' },
  { time: '11:20', text: 'Export Excel des factures de mars effectué', type: 'export' },
  { time: '14:00', text: 'Nouveau client ajouté : Cave Modern', type: 'client' },
  { time: '15:30', text: 'Rapprochement automatique FA-2026-006 ↔ TXN-15765062069', type: 'paiement' },
];
