import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowDownToLine, ArrowUpFromLine, BriefcaseBusiness, FileText, Package2, Radar, Wallet, Waves } from 'lucide-react';
import { BarChart, Bar, CartesianGrid, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';
import { api, DashboardPayload } from '@/lib/api';
import { formatFCFA } from '@/lib/data';

const emptyDashboard: DashboardPayload = {
  totalFactures: 0, totalPaiements: 0, montantFacture: 0, montantRecu: 0, resteAPayer: 0, totalCasiers: 0, totalRetours: 0, facturesEnAttente: 0, facturesAnomalie: 0, chartData: [], pieData: [], topProducts: [], recentInvoices: [], recentPayments: [], recentActivity: [],
};
const PIE_COLORS = ['url(#pieBlue)', 'url(#pieOrange)'];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardPayload>(emptyDashboard);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => { (async () => { setLoading(true); try { setData(await api.dashboard()); } catch (err: any) { setError(err.message || 'Impossible de charger le dashboard.'); } finally { setLoading(false); } })(); }, []);

  const statCards = useMemo(() => [
    { label: 'Achats fournisseur', value: formatFCFA(data.montantFacture), icon: <ArrowUpFromLine size={18} />, sub: `${data.totalFactures} facture(s)` },
    { label: 'Montant encaissé', value: formatFCFA(data.montantRecu), icon: <Wallet size={18} />, sub: `${data.totalPaiements} paiement(s)` },
    { label: 'Solde à régler', value: formatFCFA(data.resteAPayer), icon: <BriefcaseBusiness size={18} />, sub: `${data.facturesEnAttente} en attente` },
    { label: 'Solde emballages', value: `${data.totalCasiers - data.totalRetours}`, icon: <Package2 size={18} />, sub: `${data.totalRetours} renvoyé(s)` },
  ], [data]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="dzm-card dzm-hero p-6 md:p-7">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <div className="dzm-badge-blue mb-4">Command Center IA</div>
            <h2 className="text-3xl md:text-4xl font-display">Contrôle fournisseur DZM A / DZM B</h2>
            <p className="text-sm opacity-70 mt-3 max-w-2xl">Tour de contrôle pour surveiller DT AZIMUTS : factures, paiements, emballages, signaux faibles et actions prioritaires.</p>
          </div>
          <div className="dzm-card px-4 py-3 text-sm max-w-xl">
            <div className="flex gap-3 items-start"><Radar size={18} className="text-dzm-purple shrink-0 mt-0.5" /><div><p className="font-medium">Aujourd’hui</p><p className="opacity-75 mt-1">{data.facturesAnomalie} anomalie(s) fournisseur, {data.facturesEnAttente} facture(s) en attente, et un solde emballages de {data.totalCasiers - data.totalRetours} à surveiller.</p></div></div>
          </div>
        </div>
      </div>

      {loading ? <div className="dzm-card p-8">Chargement du tableau de bord...</div> : error ? <div className="dzm-card p-6 text-red-400">{error}</div> : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {statCards.map((card, idx) => (
              <motion.div key={card.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }} className="dzm-card p-5 dzm-card-glow hover:-translate-y-1 transition-transform duration-300">
                <div className="flex items-center justify-between opacity-70 text-xs uppercase mb-4 tracking-[0.22em]">{card.label}{card.icon}</div>
                <div className="dzm-kpi-value">{card.value}</div>
                <div className="text-xs opacity-50 mt-3">{card.sub}</div>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="dzm-card p-5 xl:col-span-2">
              <div className="flex items-center justify-between mb-4"><h3 className="font-display text-lg">Évolution mensuelle</h3><span className="text-xs opacity-50">DZM A vs DZM B</span></div>
              {data.chartData.length === 0 ? <p className="opacity-60 text-sm">Pas encore assez d'historique.</p> : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" />
                      <YAxis stroke="rgba(255,255,255,0.4)" />
                      <Tooltip contentStyle={{ background: '#091120', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16 }} />
                      <Legend />
                      <Bar dataKey="dzmA" name="DZM A" fill="#46a4ff" radius={[8,8,0,0]} />
                      <Bar dataKey="dzmB" name="DZM B" fill="#ff9a3d" radius={[8,8,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="dzm-card p-5">
              <div className="flex items-center justify-between mb-4"><h3 className="font-display text-lg">Répartition des achats</h3><span className="text-xs opacity-50">Par structure</span></div>
              {data.pieData.length === 0 ? <p className="opacity-60 text-sm">Aucune donnée.</p> : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <defs>
                        <linearGradient id="pieBlue" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#75c4ff" /><stop offset="100%" stopColor="#2b7fff" /></linearGradient>
                        <linearGradient id="pieOrange" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#ffc172" /><stop offset="100%" stopColor="#ff8a2a" /></linearGradient>
                        <filter id="glow"><feGaussianBlur stdDeviation="6" result="coloredBlur" /><feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                      </defs>
                      <Pie data={data.pieData} dataKey="value" nameKey="name" innerRadius={70} outerRadius={108} paddingAngle={5} stroke="rgba(255,255,255,0.08)" filter="url(#glow)" label={(e) => `${e.name} • ${Math.round(e.percent * 100)}%`}>
                        {data.pieData.map((_, index) => <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatFCFA(v)} contentStyle={{ background: '#091120', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="dzm-card p-5 xl:col-span-2">
              <h3 className="font-display text-lg mb-4">Top produits</h3>
              {data.topProducts.length === 0 ? <p className="opacity-60 text-sm">Aucun produit agrégé pour le moment.</p> : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.topProducts.slice(0,6).map((product) => (
                    <div key={product.produit} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                      <div className="flex justify-between gap-3"><div><p className="font-semibold">{product.produit}</p><p className="text-xs opacity-55 mt-1">{product.quantite} unités • {product.facturesAssociees} factures</p></div><span className={product.structure === 'DZM B' ? 'dzm-badge-orange' : 'dzm-badge-blue'}>{product.structure}</span></div>
                      <p className="text-lg font-display mt-4">{formatFCFA(product.caTotal)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="dzm-card p-5">
              <h3 className="font-display text-lg mb-4">Radar fournisseur</h3>
              <div className="space-y-4 text-sm">
                <div className="flex gap-3"><AlertTriangle className="text-rose-400 shrink-0" size={18} /><p>{data.facturesAnomalie} facture(s) en anomalie nécessitent une revue.</p></div>
                <div className="flex gap-3"><ArrowDownToLine className="text-amber-400 shrink-0" size={18} /><p>{data.facturesEnAttente} facture(s) sont encore en attente de règlement.</p></div>
                <div className="flex gap-3"><Package2 className="text-dzm-blue shrink-0" size={18} /><p>{data.totalRetours} emballage(s) renvoyé(s) déjà enregistrés.</p></div>
                <div className="flex gap-3"><Waves className="text-dzm-purple shrink-0" size={18} /><p>Le cockpit IA peut générer un brief matin / soir et guider les actions prioritaires.</p></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="dzm-card p-5">
              <h3 className="font-display text-lg mb-4">Dernières factures</h3>
              <div className="space-y-3">
                {data.recentInvoices.length === 0 ? <p className="opacity-60 text-sm">Aucune facture récente.</p> : data.recentInvoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between border-b border-white/5 pb-3">
                    <div><p className="font-medium">{invoice.numero_facture} — {invoice.client}</p><p className="text-xs opacity-50">{invoice.structure} • {invoice.date_facture}</p></div>
                    <div className="text-right"><p className="font-semibold">{formatFCFA(invoice.total_ttc || 0)}</p><p className="text-xs opacity-50">{invoice.statut}</p></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="dzm-card p-5">
              <h3 className="font-display text-lg mb-4">Derniers paiements</h3>
              <div className="space-y-3">
                {data.recentPayments.length === 0 ? <p className="opacity-60 text-sm">Aucun paiement récent.</p> : data.recentPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between border-b border-white/5 pb-3">
                    <div><p className="font-medium">{payment.transaction_id}</p><p className="text-xs opacity-50">{payment.beneficiaire || 'Bénéficiaire non renseigné'} • {payment.reference_facture || 'Non rapproché'}</p></div>
                    <div className="text-right"><p className="font-semibold">{formatFCFA(payment.montant || 0)}</p><p className="text-xs opacity-50">{payment.statut}</p></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
