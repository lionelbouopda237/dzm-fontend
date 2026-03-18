import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Archive, Plus, RefreshCcw } from 'lucide-react';
import { api, EmballagePayload } from '@/lib/api';

const empty: EmballagePayload = { summary: [], mouvements: [], synthese: { emballagesRecus: 0, emballagesRenvoyes: 0, solde: 0, colis: 0 } };

export default function EmballagesPage() {
  const [data, setData] = useState<EmballagePayload>(empty);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [manualOpen, setManualOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [isAuthed, setIsAuthed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [manual, setManual] = useState({ structure: 'DZM A', reference_facture: '', emballages_vides: 0, date_mouvement: new Date().toISOString().slice(0, 10), note: '' });

  const load = async () => {
    setLoading(true); setError('');
    try { setData(await api.emballages()); } catch (e: any) { setError(e.message || 'Impossible de charger les emballages'); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const summaryByStructure = useMemo(() => {
    const pick = (name: string) => data.summary.find((s) => s.structure === name) || { structure: name, emballagesRecus: 0, emballagesRenvoyes: 0, solde: 0, colis: 0 };
    return [pick('DZM A'), pick('DZM B')];
  }, [data]);

  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="dzm-card dzm-hero p-6 md:p-7">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl md:text-3xl">Gestion emballages vides</h2>
            <p className="text-sm opacity-70 mt-2">Solde des emballages par structure. Reçus = factures • Renvoyés = saisie manuelle uniquement • Colis = total relevé dans les factures.</p>
          </div>
          <div className="flex gap-3">
            <button className="dzm-btn-secondary flex items-center gap-2" onClick={load}><RefreshCcw size={16} /> Actualiser</button>
            <button className="dzm-btn-primary flex items-center gap-2" onClick={() => { setManualOpen(true); setPassword(''); setIsAuthed(false); }}><Plus size={16} /> Saisie renvoi</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        {[
          { label: 'Solde DZM A', value: summaryByStructure[0].solde },
          { label: 'Colis DZM A', value: summaryByStructure[0].colis },
          { label: 'Solde DZM B', value: summaryByStructure[1].solde },
          { label: 'Colis DZM B', value: summaryByStructure[1].colis },
          { label: 'Solde global', value: data.synthese.solde },
        ].map((item) => <div key={item.label} className="dzm-card p-5"><div className="text-xs uppercase opacity-60 mb-3">{item.label}</div><div className="dzm-kpi-value">{item.value}</div></div>)}
      </div>

      {loading ? <div className="dzm-card p-8">Chargement des emballages...</div> : error ? <div className="dzm-card p-6 text-red-400">{error}</div> : (
        <>
          <div className="dzm-card p-5 overflow-x-auto">
            <div className="flex items-center gap-2 mb-4"><Archive size={18} className="text-dzm-orange" /><h3 className="font-display text-lg">Synthèse par structure</h3></div>
            <table className="w-full text-left border-collapse">
              <thead><tr className="border-b border-dzm-border bg-white/5"><th className="p-3 text-[10px] uppercase opacity-45">Structure</th><th className="p-3 text-[10px] uppercase opacity-45">Emballages reçus</th><th className="p-3 text-[10px] uppercase opacity-45">Emballages renvoyés</th><th className="p-3 text-[10px] uppercase opacity-45">Solde emballages</th><th className="p-3 text-[10px] uppercase opacity-45">Colis</th></tr></thead>
              <tbody>
                {summaryByStructure.map((row) => <tr key={row.structure} className="border-b border-white/5"><td className="p-3 font-medium">{row.structure}</td><td className="p-3">{row.emballagesRecus}</td><td className="p-3">{row.emballagesRenvoyes}</td><td className="p-3 font-semibold">{row.solde}</td><td className="p-3">{row.colis}</td></tr>)}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="dzm-card p-5">
              <h3 className="font-display text-lg mb-4">Mouvements manuels de renvoi</h3>
              <div className="space-y-3">
                {data.mouvements.length === 0 ? <p className="opacity-60 text-sm">Aucun renvoi manuel enregistré pour le moment.</p> : data.mouvements.slice(0, 10).map((m) => (
                  <div key={m.id} className="flex items-center justify-between border-b border-white/5 pb-3">
                    <div><p className="font-medium">{m.structure}</p><p className="text-xs opacity-50">{m.reference_facture || 'Sans référence'} • {m.date_mouvement}</p></div>
                    <div className="text-right"><p className="font-semibold">{m.emballages_vides || 0} renvoyé(s)</p><p className="text-xs opacity-50">{m.note || 'Saisie manuelle'}</p></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="dzm-card p-5">
              <h3 className="font-display text-lg mb-4">Synthèse globale</h3>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between"><span className="opacity-65">Emballages reçus</span><strong>{data.synthese.emballagesRecus}</strong></div>
                <div className="flex justify-between"><span className="opacity-65">Emballages renvoyés</span><strong>{data.synthese.emballagesRenvoyes}</strong></div>
                <div className="flex justify-between"><span className="opacity-65">Solde global</span><strong>{data.synthese.solde}</strong></div>
                <div className="flex justify-between"><span className="opacity-65">Total colis</span><strong>{data.synthese.colis}</strong></div>
              </div>
            </div>
          </div>
        </>
      )}

      {manualOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-dzm-card border border-dzm-border rounded-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-dzm-border flex justify-between items-center"><h3 className="text-xl font-display">Renvoi manuel d'emballages</h3><button onClick={() => setManualOpen(false)}>✕</button></div>
            <div className="p-6 space-y-4">
              {!isAuthed ? (
                <>
                  <p className="text-sm opacity-60">Entrez le mot de passe local de saisie manuelle.</p>
                  <input type="password" className="dzm-input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mot de passe" />
                  <button className="dzm-btn-primary w-full" onClick={() => { if (password === 'DZM2026') setIsAuthed(true); else alert('Mot de passe incorrect'); }}>Valider</button>
                </>
              ) : (
                <>
                  <select className="dzm-input" value={manual.structure} onChange={(e) => setManual({ ...manual, structure: e.target.value })}><option>DZM A</option><option>DZM B</option></select>
                  <input className="dzm-input" value={manual.reference_facture} placeholder="Référence facture (optionnel)" onChange={(e) => setManual({ ...manual, reference_facture: e.target.value })} />
                  <input className="dzm-input" type="number" value={manual.emballages_vides || ''} placeholder="Emballages renvoyés" onChange={(e) => setManual({ ...manual, emballages_vides: Number(e.target.value || 0) })} />
                  <input className="dzm-input" type="date" value={manual.date_mouvement} onChange={(e) => setManual({ ...manual, date_mouvement: e.target.value })} />
                  <textarea className="dzm-input" value={manual.note} placeholder="Note (optionnel)" onChange={(e) => setManual({ ...manual, note: e.target.value })} />
                  <div className="flex gap-3"><button className="flex-1 dzm-btn-secondary" onClick={() => setManualOpen(false)}>Annuler</button><button className="flex-1 dzm-btn-primary" disabled={saving} onClick={async () => { setSaving(true); try { await api.saveEmballageRetour({ ...manual, password }); await load(); setManualOpen(false); } finally { setSaving(false); } }}>{saving ? 'Enregistrement...' : 'Enregistrer'}</button></div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
