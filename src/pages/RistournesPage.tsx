import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Gift, Plus } from "lucide-react";
import { api, RistourneItem } from "@/lib/api";
import { formatFCFA } from "@/lib/data";

export default function RistournesPage() {
  const [items, setItems] = useState<RistourneItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [auth, setAuth] = useState(false);
  const [form, setForm] = useState({ structure:'DZM A', reference_facture:'', montant_theorique:0, montant_recu:0, date_paiement:new Date().toISOString().slice(0,10), mode_paiement:'Mobile money', commentaire:'' });

  const load = async () => { setLoading(true); setError(''); try { setItems(await api.listRistournes()); } catch (e:any) { setError(e.message || 'Impossible de charger les ristournes'); } finally { setLoading(false); } };
  useEffect(()=>{ load(); },[]);
  const stats = useMemo(() => ({ theorique: items.reduce((s,i)=>s+Number(i.montant_theorique||0),0), recu: items.reduce((s,i)=>s+Number(i.montant_recu||0),0) }), [items]);
  return <motion.div initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} className="space-y-6">
    <div className="dzm-card dzm-hero p-6"><div className="flex items-center justify-between gap-4"><div><h2 className="font-display text-3xl">Ristournes</h2><p className="text-sm opacity-70 mt-2">Suivi des ristournes théoriques DT AZIMUTS et des paiements reçus.</p></div><button className="dzm-btn-primary flex items-center gap-2" onClick={()=>{setOpen(true); setAuth(false); setPassword('');}}><Plus size={16}/> Paiement manuel DTA</button></div></div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="dzm-card p-5"><div className="text-xs uppercase opacity-55 mb-2">Ristournes théoriques</div><div className="dzm-kpi-value">{formatFCFA(stats.theorique)}</div></div>
      <div className="dzm-card p-5"><div className="text-xs uppercase opacity-55 mb-2">Ristournes reçues</div><div className="dzm-kpi-value">{formatFCFA(stats.recu)}</div></div>
      <div className="dzm-card p-5"><div className="text-xs uppercase opacity-55 mb-2">Reste à recevoir</div><div className="dzm-kpi-value">{formatFCFA(stats.theorique-stats.recu)}</div></div>
    </div>
    {loading ? <div className="dzm-card p-8">Chargement...</div> : error ? <div className="dzm-card p-6 text-red-400">{error}</div> : <div className="dzm-card overflow-x-auto">
      <table className="w-full text-left border-collapse">
      <thead><tr className="border-b border-dzm-border bg-white/5">{['Structure','Référence facture','Théorique','Reçu','Date','Mode','Statut'].map(h=> <th key={h} className="p-3 text-[10px] uppercase opacity-45">{h}</th>)}</tr></thead>
      <tbody>{items.map((i)=><tr key={i.id} className="border-b border-white/5"><td className="p-3">{i.structure}</td><td className="p-3 font-mono text-xs">{i.reference_facture||'—'}</td><td className="p-3">{formatFCFA(i.montant_theorique||0)}</td><td className="p-3 font-semibold text-emerald-400">{formatFCFA(i.montant_recu||0)}</td><td className="p-3">{i.date_paiement||'—'}</td><td className="p-3">{i.mode_paiement||'—'}</td><td className="p-3">{i.statut}</td></tr>)}</tbody>
      </table>
    </div>}
    {open && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"><div className="bg-dzm-card border border-dzm-border rounded-2xl w-full max-w-md overflow-hidden"><div className="p-6 border-b border-dzm-border flex justify-between items-center"><h3 className="text-xl font-display">Paiement manuel de ristourne</h3><button onClick={()=>setOpen(false)}>✕</button></div><div className="p-6 space-y-4">{!auth ? <><p className="text-sm opacity-60">Entrez le mot de passe de saisie manuelle.</p><input type="password" className="dzm-input" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mot de passe"/><button className="dzm-btn-primary w-full" onClick={()=>{ if(password==='DZM2026') setAuth(true); else alert('Mot de passe incorrect'); }}>Valider</button></> : <><select className="dzm-input" value={form.structure} onChange={e=>setForm({...form, structure:e.target.value})}><option>DZM A</option><option>DZM B</option></select><input className="dzm-input" value={form.reference_facture} placeholder="Référence facture" onChange={e=>setForm({...form, reference_facture:e.target.value})}/><input className="dzm-input" type="number" value={form.montant_theorique || ''} placeholder="Montant théorique" onChange={e=>setForm({...form, montant_theorique:Number(e.target.value||0)})}/><input className="dzm-input" type="number" value={form.montant_recu || ''} placeholder="Montant reçu" onChange={e=>setForm({...form, montant_recu:Number(e.target.value||0)})}/><input className="dzm-input" type="date" value={form.date_paiement} onChange={e=>setForm({...form, date_paiement:e.target.value})}/><input className="dzm-input" value={form.mode_paiement} placeholder="Mode paiement" onChange={e=>setForm({...form, mode_paiement:e.target.value})}/><textarea className="dzm-input" value={form.commentaire} placeholder="Commentaire" onChange={e=>setForm({...form, commentaire:e.target.value})}/><div className="flex gap-3"><button className="flex-1 dzm-btn-secondary" onClick={()=>setOpen(false)}>Annuler</button><button className="flex-1 dzm-btn-primary" onClick={async ()=>{ await api.saveRistournePayment({ ...form, password }); await load(); setOpen(false); }}>Enregistrer</button></div></>}</div></div></div>}
  </motion.div>
}
