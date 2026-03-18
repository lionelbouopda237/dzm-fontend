import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link2, RefreshCcw, Wand2 } from "lucide-react";
import { api, RapprochementItem } from "@/lib/api";
import { formatFCFA } from "@/lib/data";

export default function RapprochementsPage() {
  const [items, setItems] = useState<RapprochementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try { setItems(await api.listRapprochements()); } catch (e:any) { setError(e.message || 'Impossible de charger les rapprochements'); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const stats = useMemo(() => ({
    rapproches: items.filter(i => i.statut === 'rapproché').length,
    aTraiter: items.filter(i => i.statut !== 'rapproché').length,
    scoreMoyen: items.length ? Math.round(items.reduce((s,i)=>s+i.score,0)/items.length) : 0,
  }), [items]);

  return <motion.div initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} className="space-y-6">
    <div className="dzm-card dzm-hero p-6"><div className="flex items-center justify-between gap-4"><div><h2 className="font-display text-3xl">Rapprochements</h2><p className="text-sm opacity-70 mt-2">Centre dédié pour relier paiements et factures avec score de confiance.</p></div><button className="dzm-btn-secondary flex items-center gap-2" onClick={load}><RefreshCcw size={16}/> Actualiser</button></div></div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[['Rapprochés',stats.rapproches],['À traiter',stats.aTraiter],['Score moyen',`${stats.scoreMoyen}%`]].map(([l,v]) => <div key={l} className="dzm-card p-5"><div className="text-xs uppercase opacity-55 mb-2">{l}</div><div className="dzm-kpi-value">{v}</div></div>)}
    </div>
    {loading ? <div className="dzm-card p-8">Chargement...</div> : error ? <div className="dzm-card p-6 text-red-400">{error}</div> : <div className="dzm-card overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead><tr className="border-b border-dzm-border bg-white/5">{['Paiement','Facture proposée','Structure','Montant','Score','Statut','Action'].map(h => <th key={h} className="p-3 text-[10px] uppercase opacity-45">{h}</th>)}</tr></thead>
        <tbody>
          {items.map((i) => <tr key={i.paiement_id} className="border-b border-white/5 hover:bg-white/5">
            <td className="p-3"><div className="font-mono text-xs">{i.transaction_id}</div><div className="text-xs opacity-55">{i.date_paiement}</div></td>
            <td className="p-3"><div className="font-medium">{i.numero_facture || 'Aucune proposition'}</div><div className="text-xs opacity-55">{i.montant_facture ? formatFCFA(i.montant_facture) : '—'}</div></td>
            <td className="p-3">{i.structure}</td>
            <td className="p-3 font-semibold">{formatFCFA(i.montant_paiement || 0)}</td>
            <td className="p-3"><span className="dzm-badge-blue">{i.score}%</span></td>
            <td className="p-3">{i.statut}</td>
            <td className="p-3">{i.facture_id ? <button className="dzm-btn-primary text-xs px-3 py-2 inline-flex items-center gap-2" onClick={async ()=>{ await api.createRapprochement({ paiement_id:i.paiement_id, facture_id:i.facture_id!, montant_impute:i.montant_paiement, source:'manuel' }); await load(); }}><Link2 size={13}/> Rapprocher</button> : <span className="inline-flex items-center gap-1 opacity-55 text-xs"><Wand2 size={12}/> Pas de match sûr</span>}</td>
          </tr>)}
        </tbody>
      </table>
    </div>}
  </motion.div>
}
