const BACKEND_URL = (import.meta.env.VITE_API_URL || 'https://dzm-backend-api.onrender.com').replace(/\/$/, '');

export type ApiInvoiceLine = {
  id?: string;
  produit: string;
  quantite: number;
  prix_unitaire: number;
  total: number;
};

export type ApiInvoice = {
  id: string;
  image_url?: string | null;
  image_public_id?: string | null;
  numero_facture: string;
  structure: string;
  client: string;
  total_ht: number;
  tva: number;
  ristourne: number;
  total_ttc: number;
  nombre_casiers: number;
  casiers_retournes: number;
  date_facture: string;
  statut: string;
  source?: string | null;
  vendeur?: string | null;
  produits?: ApiInvoiceLine[];
};

export type ApiPayment = {
  id: string;
  image_url?: string | null;
  image_public_id?: string | null;
  transaction_id: string;
  montant: number;
  structure: string;
  reference_facture: string | null;
  beneficiaire: string | null;
  date_paiement: string;
  operateur?: string | null;
  statut: string;
};

export type ApiProductSummary = {
  produit: string;
  quantite: number;
  prixUnitaire: number;
  caTotal: number;
  facturesAssociees: number;
  structure: string;
  tendance: 'hausse' | 'baisse' | 'stable';
};

export type DashboardPayload = {
  totalFactures: number;
  totalPaiements: number;
  montantFacture: number;
  montantRecu: number;
  resteAPayer: number;
  totalCasiers: number;
  totalRetours: number;
  facturesEnAttente: number;
  facturesAnomalie: number;
  chartData: Array<{ name: string; dzmA: number; dzmB: number }>;
  pieData: Array<{ name: string; value: number }>;
  topProducts: ApiProductSummary[];
  recentInvoices: ApiInvoice[];
  recentPayments: ApiPayment[];
  recentActivity: Array<{ time: string; text: string; type: string }>;
};

export type OcrInvoicePayload = {
  numero_facture?: string;
  client?: string;
  date_facture?: string;
  structure?: string;
  produits?: Array<{ produit: string; quantite: number; prix_unitaire?: number; prixUnitaire?: number; total: number }>;
  total_ht?: number;
  tva?: number;
  ristourne?: number;
  total_ttc?: number;
  nombre_casiers?: number;
  casiers_retournes?: number;
  confiance?: number;
  [key: string]: unknown;
};



export type EmballageSummaryRow = {
  structure: string;
  emballagesRecus: number;
  emballagesRenvoyes: number;
  solde: number;
  colis: number;
};

export type EmballageMovement = {
  id: string;
  structure: string;
  reference_facture?: string | null;
  emballages_vides?: number;
  date_mouvement: string;
  note?: string | null;
};

export type EmballagePayload = {
  summary: EmballageSummaryRow[];
  mouvements: EmballageMovement[];
  synthese: { emballagesRecus: number; emballagesRenvoyes: number; solde: number; colis: number };
};



export type RapprochementItem = {
  paiement_id: string;
  transaction_id: string;
  structure: string;
  montant_paiement: number;
  date_paiement: string;
  facture_id?: string | null;
  numero_facture?: string | null;
  montant_facture?: number | null;
  score: number;
  statut: string;
  suggestion: string;
};

export type RistourneItem = {
  id: string;
  structure: string;
  reference_facture?: string | null;
  montant_theorique: number;
  montant_recu: number;
  date_paiement?: string | null;
  mode_paiement?: string | null;
  commentaire?: string | null;
  statut: string;
};

export type OcrPaymentPayload = {
  transaction_id?: string;
  montant?: number;
  structure?: string;
  reference_facture?: string;
  beneficiaire?: string;
  date_paiement?: string;
  operateur?: string;
  statut?: string;
  confiance?: number;
  [key: string]: unknown;
};

async function parseJson<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (data as { error?: string })?.error || `Erreur API : ${res.status}`;
    throw new Error(message);
  }
  return data as T;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BACKEND_URL}${path}`, init);
  return parseJson<T>(res);
}

export const api = {
  backendUrl: BACKEND_URL,

  health() {
    return request<{ status: string; service?: string; timestamp?: string }>('/health');
  },

  configStatus() {
    return request<{ supabase: boolean; groq: boolean; telegram: boolean; gmail: boolean; backendUrl?: string }>('/api/config/status');
  },

  dashboard() {
    return request<DashboardPayload>('/api/dashboard');
  },

  listFactures() {
    return request<ApiInvoice[]>('/api/factures');
  },

  createFacture(payload: Partial<ApiInvoice> & { produits?: ApiInvoiceLine[] }) {
    return request<ApiInvoice>('/api/factures', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },

  createFactureFromOcr(payload: OcrInvoicePayload) {
    return request<ApiInvoice>('/api/factures/from-ocr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },

  deleteFacture(id: string) {
    return request<{ success: boolean }>(`/api/factures/${id}`, { method: 'DELETE' });
  },

  listPaiements() {
    return request<ApiPayment[]>('/api/paiements');
  },

  createPaiement(payload: Partial<ApiPayment>) {
    return request<ApiPayment>('/api/paiements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },

  productSummary() {
    return request<ApiProductSummary[]>('/api/produits/summary');
  },

  listRapprochements() {
    return request<RapprochementItem[]>('/api/rapprochements');
  },

  createRapprochement(payload: { paiement_id: string; facture_id: string; montant_impute?: number; source?: string }) {
    return request('/api/rapprochements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },

  listRistournes() {
    return request<RistourneItem[]>('/api/ristournes');
  },

  saveRistournePayment(payload: Partial<RistourneItem> & { password?: string }) {
    return request<RistourneItem>('/api/ristournes/manual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },

  async ocrFacture(file: File): Promise<OcrInvoicePayload> {
    const formData = new FormData();
    formData.append('image', file);
    const data = await request<{ success?: boolean; data?: OcrInvoicePayload }>('/api/ocr/facture', {
      method: 'POST',
      body: formData,
    });
    return data.data || (data as unknown as OcrInvoicePayload);
  },

  async ocrPaiement(file: File): Promise<OcrPaymentPayload> {
    const formData = new FormData();
    formData.append('image', file);
    const data = await request<{ success?: boolean; data?: OcrPaymentPayload }>('/api/ocr/paiement', {
      method: 'POST',
      body: formData,
    });
    return data.data || (data as unknown as OcrPaymentPayload);
  },

  async assistant(message: string, historique: Array<{ role: 'user' | 'ai'; content: string }> = []) {
    const data = await request<{ response?: string; reponse?: string }>('/api/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        question: message,
        historique: historique.map((item) => ({ role: item.role === 'ai' ? 'assistant' : 'user', content: item.content })),
      }),
    });
    return { response: data.response || data.reponse || '' };
  },



  uploadImage(file: File, type: 'facture' | 'paiement' = 'facture') {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', type);
    return request<{ url: string; public_id: string }>('/api/files/upload', { method: 'POST', body: formData });
  },

  emballages() {
    return request<EmballagePayload>('/api/emballages');
  },

  saveEmballageRetour(payload: { structure: string; reference_facture?: string | null; emballages_vides: number; date_mouvement: string; note?: string | null; password?: string }) {
    return request<EmballageMovement>('/api/emballages/manual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },

  telegramRapport() {
    return request<{ success?: boolean; message?: string }>('/api/telegram/rapport', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
  },

  exportEmail(email: string) {
    return request<{ success?: boolean; message?: string }>('/api/export/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
  },
};
