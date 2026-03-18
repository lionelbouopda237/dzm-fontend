import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, CreditCard, ExternalLink, Loader2, Lock, Search, Upload, AlertTriangle, Download, Image as ImageIcon, Eye, X } from 'lucide-react';
import { api, ApiPayment, OcrPaymentPayload } from '@/lib/api';
import { formatFCFA } from '@/lib/data';
import StatusBadge from '@/components/StatusBadge';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<ApiPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [ocrResult, setOcrResult] = useState<OcrPaymentPayload | null>(null);
  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [savingOcr, setSavingOcr] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualPassword, setManualPassword] = useState('');
  const [isAuthed, setIsAuthed] = useState(false);
  const [detailPayment, setDetailPayment] = useState<ApiPayment | null>(null);
  const [manual, setManual] = useState<Partial<ApiPayment> & { imageFile?: File | null }>({ structure: 'DZM A', statut: 'en attente', date_paiement: new Date().toISOString().slice(0, 10), imageFile: null });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const manualImageRef = useRef<HTMLInputElement>(null);

  const loadPayments = async () => {
    setLoading(true); setError('');
    try { setPayments(await api.listPaiements()); } catch (err: any) { setError(err.message || 'Impossible de charger les paiements.'); } finally { setLoading(false); }
  };
  useEffect(() => { loadPayments(); }, []);

  const filtered = useMemo(() => payments.filter((p) => {
    const search = searchTerm.toLowerCase();
    return !search || p.transaction_id?.toLowerCase().includes(search) || (p.reference_facture || '').toLowerCase().includes(search) || (p.beneficiaire || '').toLowerCase().includes(search);
  }), [payments, searchTerm]);

  const stats = {
    total: payments.reduce((s, p) => s + (p.montant || 0), 0),
    rapproches: payments.filter((p) => p.statut === 'payé').length,
    attente: payments.filter((p) => p.statut === 'en attente').length,
    anomalies: payments.filter((p) => p.statut === 'anomalie').length,
  };

  const handleUploadCapture = async (e?: React.ChangeEvent<HTMLInputElement>) => {
    const file = e?.target.files?.[0];
    if (!file) { fileInputRef.current?.click(); return; }
    setIsUploading(true); setError(''); setOcrFile(file);
    try { setOcrResult(await api.ocrPaiement(file)); } catch (err: any) { setError(err.message || 'Erreur OCR paiement'); } finally { setIsUploading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  const savePayment = async (payload: Partial<ApiPayment> & { imageFile?: File | null }, fromOcr = false) => {
    let uploaded: { url: string; public_id: string } | null = null;
    if (payload.imageFile) uploaded = await api.uploadImage(payload.imageFile, 'paiement');
    try {
      await api.createPaiement({ ...payload, image_url: uploaded?.url, image_public_id: uploaded?.public_id });
      await loadPayments();
    } catch (err: any) {
      const message = err.message || 'Sauvegarde impossible';
      if (String(message).startsWith('DOUBLON_PAIEMENT:')) {
        const ok = window.confirm(`Un doublon a été détecté pour la transaction ${payload.transaction_id}. Veux-tu écraser l'enregistrement existant ?`);
        if (ok) {
          await api.createPaiement({ ...payload, overwrite: true, image_url: uploaded?.url, image_public_id: uploaded?.public_id });
          await loadPayments();
        }
      } else { throw err; }
    }
  };

  const openInNewTab = (url?: string | null) => { if (url) window.open(url, '_blank', 'noopener,noreferrer'); };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="dzm-card dzm-hero p-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div><h2 className="text-3xl font-display">Paiements</h2><p className="text-sm opacity-70 mt-2">OCR Mobile Money, aperçu image, saisie manuelle sécurisée et enregistrement réel en base.</p></div>
          <button onClick={() => { setManualOpen(true); setManualPassword(''); setIsAuthed(false); }} className="dzm-btn-primary flex items-center gap-2"><Lock size={16} /> Paiement manuel</button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total encaissé', val: formatFCFA(stats.total), icon: <CreditCard size={18} />, color: '#46a4ff' },
          { label: 'Rapprochés', val: stats.rapproches, icon: <CheckCircle2 size={18} />, color: '#34d399' },
          { label: 'En attente', val: stats.attente, icon: <Clock size={18} />, color: '#fbbf24' },
          { label: 'Anomalies', val: stats.anomalies, icon: <AlertTriangle size={18} />, color: '#fb7185' },
        ].map((s, i) => <div key={i} className="dzm-card p-4" style={{ borderTop: `3px solid ${s.color}` }}><div className="flex items-center gap-2 mb-1 opacity-60 text-xs uppercase">{s.icon}{s.label}</div><div className="text-xl font-bold font-display">{s.val}</div></div>)}
      </div>

      <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleUploadCapture} />
      <div onClick={() => fileInputRef.current?.click()} className="dzm-card p-6 border-dashed border-2 border-dzm-orange/30 bg-dzm-orange/5 flex flex-col items-center cursor-pointer hover:bg-dzm-orange/10 transition-all">
        {isUploading ? <Loader2 size={32} className="animate-spin text-dzm-orange mb-3" /> : <Upload size={32} className="text-dzm-orange mb-3" />}
        <h4 className="font-bold">Upload capture Mobile Money</h4>
        <p className="text-xs opacity-60 mt-1">Orange Money • Wave • MTN MoMo</p>
      </div>
      {ocrResult && (
        <div className="dzm-card p-4 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap"><h4 className="font-bold text-dzm-orange">Résultat OCR paiement</h4>{ocrFile ? <span className="dzm-badge-orange">{ocrFile.name}</span> : null}</div>
          {ocrFile ? <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/20 p-3 inline-flex items-center gap-3"><ImageIcon size={18} className="text-dzm-orange" /><span className="text-sm">Capture prête à être envoyée sur Cloudinary</span></div> : null}
          <pre className="text-xs opacity-80 whitespace-pre-wrap overflow-auto max-h-40">{JSON.stringify(ocrResult, null, 2)}</pre>
          <button disabled={savingOcr} className="dzm-btn-primary" onClick={async () => { setSavingOcr(true); try { await savePayment({ ...ocrResult, montant: Number(ocrResult.montant || 0), statut: ocrResult.statut || 'en attente', imageFile: ocrFile }, true); setOcrResult(null); setOcrFile(null); } finally { setSavingOcr(false); } }}>{savingOcr ? 'Enregistrement...' : 'Enregistrer ce paiement'}</button>
        </div>
      )}

      <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" /><input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Rechercher un paiement..." className="dzm-input pl-10" /></div>

      {loading ? <div className="dzm-card p-8">Chargement des paiements...</div> : error ? <div className="dzm-card p-6 text-red-400">{error}</div> : (
        <div className="dzm-card overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead><tr className="border-b border-dzm-border bg-white/5">{['Transaction ID', 'Facture liée', 'Structure', 'Montant', 'Opérateur', 'Bénéficiaire', 'Date', 'Image', 'Statut', ''].map((h) => <th key={h} className="p-3 text-[10px] font-bold uppercase opacity-40 whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map((p) => <tr key={p.id} className="border-b border-white/[0.03] hover:bg-white/5 transition-colors"><td className="p-3 font-mono text-xs">{p.transaction_id}</td><td className="p-3 text-dzm-blue text-sm">{p.reference_facture || '—'}</td><td className="p-3">{p.structure}</td><td className="p-3 font-bold text-sm">{formatFCFA(p.montant || 0)}</td><td className="p-3 text-sm">{p.operateur || '—'}</td><td className="p-3 text-sm">{p.beneficiaire || '—'}</td><td className="p-3 text-sm opacity-60">{p.date_paiement}</td><td className="p-3">{p.image_url ? <div className="flex gap-2"><button className="dzm-btn-secondary px-3 py-1.5 text-xs flex items-center gap-1" onClick={() => openInNewTab(p.image_url)}><ExternalLink size={12} /> Ouvrir</button><button className="dzm-btn-secondary px-3 py-1.5 text-xs flex items-center gap-1" onClick={() => openInNewTab(p.image_url)}><Download size={12} /> Télécharger</button></div> : <span className="opacity-40 text-xs">Aucune</span>}</td><td className="p-3"><StatusBadge status={p.statut as any} /></td><td className="p-3 text-right"><button className="p-2 hover:bg-white/10 rounded-lg" onClick={() => setDetailPayment(p)}><Eye size={16} /></button></td></tr>)}
            </tbody>
          </table>
        </div>
      )}

      {detailPayment && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"><div className="bg-dzm-card border border-dzm-border rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"><div className="p-6 border-b border-dzm-border flex justify-between items-center"><h3 className="text-xl font-display">Détail paiement {detailPayment.transaction_id}</h3><button onClick={() => setDetailPayment(null)}><X /></button></div><div className="p-6 overflow-y-auto space-y-4"><div className="grid grid-cols-2 md:grid-cols-4 gap-4"><div><span className="opacity-40 text-xs uppercase">Structure</span><p>{detailPayment.structure}</p></div><div><span className="opacity-40 text-xs uppercase">Facture liée</span><p>{detailPayment.reference_facture || '—'}</p></div><div><span className="opacity-40 text-xs uppercase">Date</span><p>{detailPayment.date_paiement}</p></div><div><span className="opacity-40 text-xs uppercase">Statut</span><p><StatusBadge status={detailPayment.statut as any} /></p></div></div><div className="grid grid-cols-2 md:grid-cols-4 gap-4"><div><span className="opacity-40 text-xs uppercase">Montant</span><p className="font-bold">{formatFCFA(detailPayment.montant || 0)}</p></div><div><span className="opacity-40 text-xs uppercase">Opérateur</span><p>{detailPayment.operateur || '—'}</p></div><div><span className="opacity-40 text-xs uppercase">Bénéficiaire</span><p>{detailPayment.beneficiaire || '—'}</p></div><div><span className="opacity-40 text-xs uppercase">Transaction</span><p className="font-mono text-xs">{detailPayment.transaction_id}</p></div></div><div className="space-y-2"><h4 className="font-bold">Image paiement</h4>{detailPayment.image_url ? <div className="flex gap-3"><button className="dzm-btn-secondary flex items-center gap-2" onClick={() => openInNewTab(detailPayment.image_url)}><ExternalLink size={14}/> Ouvrir dans un nouvel onglet</button><button className="dzm-btn-secondary flex items-center gap-2" onClick={() => openInNewTab(detailPayment.image_url)}><Download size={14}/> Télécharger</button></div> : <p className="text-sm opacity-60">Aucune image liée à ce paiement.</p>}</div></div></div></div>)}

      {manualOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-dzm-card border border-dzm-border rounded-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-dzm-border flex justify-between items-center"><h3 className="text-xl font-display">Nouveau paiement</h3><button onClick={() => setManualOpen(false)}>✕</button></div>
            <div className="p-6 space-y-4">
              {!isAuthed ? (
                <>
                  <p className="text-sm opacity-60">Déverrouille la saisie manuelle pour créer un paiement avec la même logique de contrôle que les factures.</p>
                  <input type="password" className="dzm-input" value={manualPassword} onChange={(e) => setManualPassword(e.target.value)} placeholder="Mot de passe" />
                  <button className="dzm-btn-primary w-full" onClick={() => { if (manualPassword === 'DZM2026') setIsAuthed(true); else alert('Mot de passe incorrect'); }}>Valider</button>
                </>
              ) : (
                <>
                  {[
                    ['transaction_id', 'Transaction ID'],
                    ['reference_facture', 'Référence facture'],
                    ['beneficiaire', 'Bénéficiaire'],
                    ['operateur', 'Opérateur'],
                  ].map(([key, label]) => <input key={key} className="dzm-input" placeholder={label} value={(manual as any)[key] || ''} onChange={(e) => setManual({ ...manual, [key]: e.target.value })} />)}
                  <input className="dzm-input" type="number" placeholder="Montant" value={manual.montant || ''} onChange={(e) => setManual({ ...manual, montant: Number(e.target.value || 0) })} />
                  <input className="dzm-input" type="date" value={manual.date_paiement || ''} onChange={(e) => setManual({ ...manual, date_paiement: e.target.value })} />
                  <select className="dzm-input" value={manual.structure || 'DZM A'} onChange={(e) => setManual({ ...manual, structure: e.target.value })}><option>DZM A</option><option>DZM B</option></select>
                  <select className="dzm-input" value={manual.statut || 'en attente'} onChange={(e) => setManual({ ...manual, statut: e.target.value })}><option value="en attente">En attente</option><option value="payé">Payé</option><option value="anomalie">Anomalie</option></select>
                  <input ref={manualImageRef} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => setManual({ ...manual, imageFile: e.target.files?.[0] || null })} />
                  <button className="dzm-btn-secondary w-full flex items-center justify-center gap-2" onClick={() => manualImageRef.current?.click()}><ImageIcon size={16} /> {manual.imageFile ? manual.imageFile.name : 'Ajouter une image'}</button>{manual.imageFile ? <p className="text-xs opacity-60">Image prête à être envoyée sur Cloudinary.</p> : null}
                  <div className="flex gap-3"><button className="flex-1 dzm-btn-secondary" onClick={() => setManualOpen(false)}>Annuler</button><button className="flex-1 dzm-btn-primary" onClick={async () => { await savePayment(manual); setManualOpen(false); }}>Enregistrer</button></div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
