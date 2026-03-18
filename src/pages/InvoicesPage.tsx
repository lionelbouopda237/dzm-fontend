import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Clock, Eye, ExternalLink, Download, FileText, Loader2, Plus, Save, Search, Trash2, Upload, X, Image as ImageIcon } from 'lucide-react';
import { api, ApiInvoice, ApiInvoiceLine, OcrInvoicePayload } from '@/lib/api';
import { formatFCFA } from '@/lib/data';
import StatusBadge from '@/components/StatusBadge';

type EditableOcr = OcrInvoicePayload & { produits: ApiInvoiceLine[] };

const defaultLine = (): ApiInvoiceLine => ({ produit: '', quantite: 0, prix_unitaire: 0, total: 0 });

const InvoicesPage = () => {
  const [invoices, setInvoices] = useState<ApiInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStructure, setFilterStructure] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [detailInvoice, setDetailInvoice] = useState<ApiInvoice | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [savingManual, setSavingManual] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [ocrError, setOcrError] = useState('');
  const [ocrDraft, setOcrDraft] = useState<EditableOcr | null>(null);
  const [savingOcr, setSavingOcr] = useState(false);
  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [manual, setManual] = useState<EditableOcr>({
    numero_facture: '',
    client: '',
    date_facture: new Date().toISOString().slice(0, 10),
    structure: 'DZM A',
    produits: [defaultLine()],
    total_ht: 0,
    tva: 0,
    ristourne: 0,
    total_ttc: 0,
    nombre_casiers: 0,
    casiers_retournes: 0,
  });

  const loadInvoices = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.listFactures();
      setInvoices(data);
    } catch (err: any) {
      setError(err.message || 'Impossible de charger les factures.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const filtered = useMemo(() => invoices.filter((inv) => {
    const search = searchTerm.toLowerCase();
    const matchSearch = !search || inv.client?.toLowerCase().includes(search) || inv.numero_facture?.toLowerCase().includes(search);
    const matchStructure = filterStructure === 'all' || inv.structure === filterStructure;
    const matchStatus = filterStatus === 'all' || inv.statut === filterStatus;
    return matchSearch && matchStructure && matchStatus;
  }), [invoices, searchTerm, filterStructure, filterStatus]);

  const stats = useMemo(() => ({
    total: invoices.length,
    payees: invoices.filter((i) => i.statut === 'payé').length,
    attente: invoices.filter((i) => i.statut === 'en attente').length,
    anomalies: invoices.filter((i) => i.statut === 'anomalie').length,
  }), [invoices]);

  const recalcDraft = (draft: EditableOcr): EditableOcr => {
    const total_ht = (draft.produits || []).reduce((sum, line) => sum + (Number(line.total) || Number(line.quantite) * Number(line.prix_unitaire) || 0), 0);
    const tva = Number(draft.tva ?? Math.round(total_ht * 0.19925));
    const ristourne = Number(draft.ristourne || 0);
    const total_ttc = Number(draft.total_ttc ?? (total_ht + tva - ristourne));
    return { ...draft, total_ht, tva, ristourne, total_ttc };
  };

  const normalizeOcr = (ocr: OcrInvoicePayload): EditableOcr => {
    const produits = (ocr.produits || []).map((p) => ({
      produit: p.produit || '',
      quantite: Number(p.quantite || 0),
      prix_unitaire: Number((p as any).prix_unitaire ?? (p as any).prixUnitaire ?? 0),
      total: Number(p.total || 0),
    }));
    return recalcDraft({
      numero_facture: String(ocr.numero_facture || ''),
      client: String(ocr.client || ''),
      date_facture: String(ocr.date_facture || new Date().toISOString().slice(0, 10)),
      structure: String(ocr.structure || 'DZM A'),
      produits: produits.length ? produits : [defaultLine()],
      total_ht: Number(ocr.total_ht || 0),
      tva: Number(ocr.tva || 0),
      ristourne: Number(ocr.ristourne || 0),
      total_ttc: Number(ocr.total_ttc || 0),
      nombre_casiers: Number(ocr.nombre_casiers || 0),
      casiers_retournes: Number(ocr.casiers_retournes || 0),
      confiance: Number(ocr.confiance || 0),
    });
  };

  const handleUpload = async (e?: React.ChangeEvent<HTMLInputElement>) => {
    const file = e?.target.files?.[0];
    if (!file) {
      fileInputRef.current?.click();
      return;
    }
    setIsUploading(true);
    setOcrError('');
    setOcrDraft(null);
    try {
      const result = await api.ocrFacture(file);
      setOcrFile(file);
      setOcrDraft(normalizeOcr(result));
    } catch (err: any) {
      setOcrError(err.message || 'Erreur lors de l\'extraction OCR');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const saveDraft = async (draft: EditableOcr, fromOcr = false) => {
    const normalized = recalcDraft(draft);
    const uploaded = fromOcr && ocrFile ? await api.uploadImage(ocrFile, 'facture') : null;
    const payload = {
      numero_facture: normalized.numero_facture,
      client: normalized.client,
      structure: normalized.structure,
      date_facture: normalized.date_facture,
      total_ht: normalized.total_ht,
      tva: normalized.tva,
      ristourne: normalized.ristourne,
      total_ttc: normalized.total_ttc,
      nombre_casiers: normalized.nombre_casiers,
      casiers_retournes: normalized.casiers_retournes,
      statut: 'en attente',
      source: fromOcr ? 'ocr' : 'manuel',
      produits: normalized.produits.map((line) => ({ ...line, total: Number(line.total) || Number(line.quantite) * Number(line.prix_unitaire) })),
      image_url: uploaded?.url || null,
      image_public_id: uploaded?.public_id || null,
    };
    if (fromOcr) {
      setSavingOcr(true);
    } else {
      setSavingManual(true);
    }
    try {
      await (fromOcr ? api.createFactureFromOcr(payload) : api.createFacture(payload));
      await loadInvoices();
      if (fromOcr) {
        setOcrDraft(null);
        setOcrFile(null);
      } else {
        setIsNewModalOpen(false);
        setManual({ ...manual, numero_facture: '', client: '', produits: [defaultLine()] });
      }
    } catch (err: any) {
      const message = err.message || 'Sauvegarde impossible';
      if (String(message).startsWith('DOUBLON_FACTURE:')) {
        const ok = window.confirm(`Un doublon a été détecté pour la facture ${normalized.numero_facture}. Veux-tu écraser l'enregistrement existant ?`);
        if (ok) {
          await (fromOcr ? api.createFactureFromOcr({ ...payload, overwrite: true }) : api.createFacture({ ...payload, overwrite: true }));
          await loadInvoices();
          setOcrError('');
        } else {
          setOcrError('Doublon détecté : enregistrement annulé.');
        }
      } else {
        setOcrError(message);
      }
    } finally {
      setSavingOcr(false);
      setSavingManual(false);
    }
  };

  const openInNewTab = (url?: string | null) => { if (url) window.open(url, '_blank', 'noopener,noreferrer'); };

  const removeInvoice = async (id: string) => {
    if (!window.confirm('Supprimer cette facture et ses lignes produit ?')) return;
    try {
      await api.deleteFacture(id);
      await loadInvoices();
      if (detailInvoice?.id === id) setDetailInvoice(null);
    } catch (err: any) {
      alert(err.message || 'Suppression impossible');
    }
  };

  const renderEditor = (draft: EditableOcr, setDraft: (value: EditableOcr) => void) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[
          ['Numero facture', 'numero_facture'],
          ['Client', 'client'],
          ['Date facture', 'date_facture'],
        ].map(([label, key]) => (
          <div key={key} className="space-y-1">
            <label className="text-[10px] uppercase font-bold opacity-40">{label}</label>
            <input
              type={key === 'date_facture' ? 'date' : 'text'}
              className="dzm-input"
              value={String((draft as any)[key] || '')}
              onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
            />
          </div>
        ))}
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold opacity-40">Structure</label>
          <select className="dzm-input" value={draft.structure} onChange={(e) => setDraft({ ...draft, structure: e.target.value })}>
            <option>DZM A</option>
            <option>DZM B</option>
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] uppercase font-bold opacity-40">Lignes produits</label>
          <button className="text-xs text-dzm-blue" onClick={() => setDraft({ ...draft, produits: [...draft.produits, defaultLine()] })}>+ Ajouter une ligne</button>
        </div>
        {draft.produits.map((line, idx) => (
          <div key={idx} className="grid grid-cols-12 gap-2 items-center">
            <input className="dzm-input col-span-5" placeholder="Produit" value={line.produit} onChange={(e) => {
              const produits = [...draft.produits];
              produits[idx] = { ...line, produit: e.target.value };
              setDraft(recalcDraft({ ...draft, produits }));
            }} />
            <input className="dzm-input col-span-2" type="number" placeholder="Qté" value={line.quantite} onChange={(e) => {
              const produits = [...draft.produits];
              produits[idx] = { ...line, quantite: Number(e.target.value || 0), total: Number(e.target.value || 0) * Number(line.prix_unitaire || 0) };
              setDraft(recalcDraft({ ...draft, produits }));
            }} />
            <input className="dzm-input col-span-2" type="number" placeholder="PU" value={line.prix_unitaire} onChange={(e) => {
              const produits = [...draft.produits];
              produits[idx] = { ...line, prix_unitaire: Number(e.target.value || 0), total: Number(e.target.value || 0) * Number(line.quantite || 0) };
              setDraft(recalcDraft({ ...draft, produits }));
            }} />
            <input className="dzm-input col-span-2" type="number" placeholder="Total" value={line.total} onChange={(e) => {
              const produits = [...draft.produits];
              produits[idx] = { ...line, total: Number(e.target.value || 0) };
              setDraft(recalcDraft({ ...draft, produits }));
            }} />
            <button className="col-span-1 text-red-400" onClick={() => {
              const produits = draft.produits.filter((_, i) => i !== idx);
              setDraft(recalcDraft({ ...draft, produits: produits.length ? produits : [defaultLine()] }));
            }}>✕</button>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          ['Total HT', 'total_ht'],
          ['TVA', 'tva'],
          ['Ristourne', 'ristourne'],
          ['Total TTC', 'total_ttc'],
          ['Casiers', 'nombre_casiers'],
          ['Retours', 'casiers_retournes'],
        ].map(([label, key]) => (
          <div key={key} className="space-y-1">
            <label className="text-[10px] uppercase font-bold opacity-40">{label}</label>
            <input className="dzm-input" type="number" value={Number((draft as any)[key] || 0)} onChange={(e) => setDraft({ ...draft, [key]: Number(e.target.value || 0) })} />
          </div>
        ))}
      </div>
      {'confiance' in draft && draft.confiance ? <p className="text-xs opacity-60">Confiance OCR estimée : <strong>{draft.confiance}%</strong>. Vérifie les lignes produits avant validation.</p> : null}
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', val: stats.total, icon: <FileText size={18} />, color: '#1a3fcc' },
          { label: 'Payées', val: stats.payees, icon: <CheckCircle2 size={18} />, color: '#10b981' },
          { label: 'En attente', val: stats.attente, icon: <Clock size={18} />, color: '#f59e0b' },
          { label: 'Anomalies', val: stats.anomalies, icon: <AlertTriangle size={18} />, color: '#ef4444' },
        ].map((s, i) => (
          <div key={i} className="dzm-card p-4" style={{ borderTop: `3px solid ${s.color}` }}>
            <div className="flex items-center gap-2 mb-1 opacity-60 text-xs uppercase">{s.icon}{s.label}</div>
            <div className="text-2xl font-bold font-display">{s.val}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display">Gestion des Factures</h2>
          <p className="text-sm opacity-60">Factures réelles Supabase, OCR Groq et validation avant sauvegarde.</p>
        </div>
        <button onClick={() => setIsNewModalOpen(true)} className="dzm-btn-primary flex items-center gap-2">
          <Plus size={18} /> Nouvelle facture
        </button>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleUpload} />
      <div onClick={() => fileInputRef.current?.click()} className="dzm-card p-8 border-dashed border-2 border-dzm-blue/30 bg-dzm-blue/5 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-dzm-blue/10 transition-all">
        {isUploading ? <Loader2 className="animate-spin text-dzm-blue mb-4" size={36} /> : <div className="w-16 h-16 bg-dzm-blue/20 rounded-full flex items-center justify-center mb-4"><Upload className="text-dzm-blue" /></div>}
        <h4 className="font-bold text-lg">OCR facture Groq Vision</h4>
        <p className="text-sm opacity-60 max-w-xl mx-auto">Upload une facture, contrôle les champs détectés, puis sauvegarde-la dans la base. Les champs peu fiables doivent être corrigés avant validation.</p>
      </div>
      {ocrError && <p className="text-red-400 text-sm">{ocrError}</p>}

      {ocrDraft && (
        <div className="dzm-card p-5 space-y-4 border border-dzm-blue/20">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-lg text-dzm-blue">Révision OCR avant enregistrement</h4>
              <p className="text-xs opacity-60">Corrige si nécessaire puis enregistre. Cette étape évite les erreurs silencieuses dans la base.</p>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 rounded-lg hover:bg-white/10" onClick={() => setOcrDraft(null)}>Annuler</button>
              <button disabled={savingOcr} className="dzm-btn-primary flex items-center gap-2" onClick={() => saveDraft(ocrDraft, true)}>{savingOcr ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Enregistrer</button>
            </div>
          </div>
          {renderEditor(ocrDraft, setOcrDraft)}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
          <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Rechercher par client ou numero..." className="dzm-input pl-10" />
        </div>
        <select value={filterStructure} onChange={(e) => setFilterStructure(e.target.value)} className="dzm-input w-auto">
          <option value="all">Toutes structures</option>
          <option value="DZM A">DZM A</option>
          <option value="DZM B">DZM B</option>
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="dzm-input w-auto">
          <option value="all">Tous statuts</option>
          <option value="payé">Payé</option>
          <option value="en attente">En attente</option>
          <option value="anomalie">Anomalie</option>
        </select>
      </div>

      {loading ? <div className="dzm-card p-8 text-center"><Loader2 className="mx-auto animate-spin mb-3" />Chargement des factures...</div> : error ? <div className="dzm-card p-6 text-red-400">{error}</div> : filtered.length === 0 ? <div className="dzm-card p-6">Aucune facture trouvée.</div> : (
        <div className="dzm-card overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-dzm-border bg-white/5">
                {['N° Facture', 'Client', 'Structure', 'Total TTC', 'Casiers', 'Date', 'Statut', 'Source', ''].map((h) => <th key={h} className="p-3 text-[10px] font-bold uppercase opacity-40 whitespace-nowrap">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => (
                <tr key={inv.id} className="border-b border-white/[0.03] hover:bg-white/5 transition-colors">
                  <td className="p-3 font-mono text-dzm-blue text-sm">{inv.numero_facture}</td>
                  <td className="p-3 font-medium text-sm">{inv.client}</td>
                  <td className="p-3"><span className={inv.structure === 'DZM A' ? 'dzm-badge-blue' : 'dzm-badge-orange'}>{inv.structure}</span></td>
                  <td className="p-3 text-sm font-semibold">{formatFCFA(inv.total_ttc || 0)}</td>
                  <td className="p-3 text-sm">{inv.nombre_casiers || 0} / {inv.casiers_retournes || 0}</td>
                  <td className="p-3 text-sm">{inv.date_facture}</td>
                  <td className="p-3"><StatusBadge status={inv.statut as any} /></td>
                  <td className="p-3 text-xs opacity-70">{inv.source || 'manuel'}</td>
                  <td className="p-3 flex gap-2 justify-end">
                    <button className="p-2 hover:bg-white/10 rounded-lg" onClick={() => setDetailInvoice(inv)}><Eye size={16} /></button>
                    <button className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg" onClick={() => removeInvoice(inv.id)}><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AnimatePresence>
        {isNewModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-dzm-card border border-dzm-border rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b border-dzm-border flex justify-between items-center"><h3 className="text-xl font-display">Nouvelle facture</h3><button onClick={() => setIsNewModalOpen(false)}><X /></button></div>
              <div className="p-6 overflow-y-auto custom-scrollbar space-y-4">{renderEditor(manual, setManual)}</div>
              <div className="p-6 border-t border-dzm-border flex justify-end gap-3">
                <button className="px-4 py-2 rounded-lg hover:bg-white/10" onClick={() => setIsNewModalOpen(false)}>Annuler</button>
                <button disabled={savingManual} className="dzm-btn-primary flex items-center gap-2" onClick={() => saveDraft(manual, false)}>{savingManual ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Enregistrer</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {detailInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} className="bg-dzm-card border border-dzm-border rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b border-dzm-border flex justify-between items-center"><h3 className="text-xl font-display">Détail facture {detailInvoice.numero_facture}</h3><button onClick={() => setDetailInvoice(null)}><X /></button></div>
              <div className="p-6 overflow-y-auto space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div><span className="opacity-40 text-xs uppercase">Client</span><p>{detailInvoice.client}</p></div>
                  <div><span className="opacity-40 text-xs uppercase">Structure</span><p>{detailInvoice.structure}</p></div>
                  <div><span className="opacity-40 text-xs uppercase">Date</span><p>{detailInvoice.date_facture}</p></div>
                  <div><span className="opacity-40 text-xs uppercase">Statut</span><p><StatusBadge status={detailInvoice.statut as any} /></p></div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div><span className="opacity-40 text-xs uppercase">HT</span><p>{formatFCFA(detailInvoice.total_ht || 0)}</p></div>
                  <div><span className="opacity-40 text-xs uppercase">TVA</span><p>{formatFCFA(detailInvoice.tva || 0)}</p></div>
                  <div><span className="opacity-40 text-xs uppercase">Ristourne</span><p>{formatFCFA(detailInvoice.ristourne || 0)}</p></div>
                  <div><span className="opacity-40 text-xs uppercase">TTC</span><p className="font-bold">{formatFCFA(detailInvoice.total_ttc || 0)}</p></div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-bold">Image facture</h4>
                  {detailInvoice.image_url ? <div className="flex gap-3"><button className="dzm-btn-secondary flex items-center gap-2" onClick={() => openInNewTab(detailInvoice.image_url)}><ExternalLink size={14} /> Ouvrir dans un nouvel onglet</button><button className="dzm-btn-secondary flex items-center gap-2" onClick={() => openInNewTab(detailInvoice.image_url)}><Download size={14} /> Télécharger</button></div> : <p className="text-sm opacity-60">Aucune image liée à cette facture.</p>}
                </div>
                <div className="space-y-2">
                  <h4 className="font-bold">Lignes produits</h4>
                  {!detailInvoice.produits?.length ? <p className="text-sm opacity-60">Aucune ligne produit enregistrée.</p> : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="opacity-50"><th className="text-left p-2">Produit</th><th className="text-left p-2">Qté</th><th className="text-left p-2">PU</th><th className="text-left p-2">Total</th></tr></thead>
                        <tbody>{detailInvoice.produits.map((line, idx) => <tr key={idx} className="border-t border-white/5"><td className="p-2">{line.produit}</td><td className="p-2">{line.quantite}</td><td className="p-2">{formatFCFA(line.prix_unitaire || 0)}</td><td className="p-2">{formatFCFA(line.total || 0)}</td></tr>)}</tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default InvoicesPage;
