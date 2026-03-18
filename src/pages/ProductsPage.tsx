import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Package2, Search, TrendingDown, TrendingUp, Layers3, Wallet, BarChart3 } from 'lucide-react';
import { api, ApiProductSummary } from '@/lib/api';
import { formatFCFA } from '@/lib/data';

const ProductsPage = () => {
  const [products, setProducts] = useState<ApiProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        setProducts(await api.productSummary());
      } catch (err: any) {
        setError(err.message || 'Impossible de charger les produits.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => products.filter((p) => p.produit.toLowerCase().includes(search.toLowerCase())), [products, search]);
  const totalCA = filtered.reduce((s, p) => s + (p.caTotal || 0), 0);
  const totalQty = filtered.reduce((s, p) => s + (p.quantite || 0), 0);
  const dzmA = filtered.filter((p) => p.structure.includes('DZM A')).reduce((s, p) => s + (p.caTotal || 0), 0);
  const dzmB = filtered.filter((p) => p.structure.includes('DZM B')).reduce((s, p) => s + (p.caTotal || 0), 0);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="dzm-card dzm-hero p-6 md:p-7">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-display">Produits</h2>
            <p className="text-sm opacity-70 mt-2 max-w-2xl">Vue analytique des produits réellement achetés auprès de DT AZIMUTS pour DZM A et DZM B. Les emballages sont exclus ici pour garder une lecture produit claire.</p>
          </div>
          <div className="relative w-full lg:w-80">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-45" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} className="dzm-input pl-10" placeholder="Rechercher un produit..." />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="dzm-card p-5"><div className="text-xs uppercase opacity-55 mb-3 flex items-center gap-2"><Wallet size={14}/> Chiffre d'affaires</div><div className="dzm-kpi-value">{formatFCFA(totalCA)}</div></div>
        <div className="dzm-card p-5"><div className="text-xs uppercase opacity-55 mb-3 flex items-center gap-2"><Layers3 size={14}/> Quantité totale</div><div className="dzm-kpi-value">{totalQty}</div></div>
        <div className="dzm-card p-5"><div className="text-xs uppercase opacity-55 mb-3 flex items-center gap-2"><BarChart3 size={14}/> DZM A</div><div className="dzm-kpi-value">{formatFCFA(dzmA)}</div></div>
        <div className="dzm-card p-5"><div className="text-xs uppercase opacity-55 mb-3 flex items-center gap-2"><BarChart3 size={14}/> DZM B</div><div className="dzm-kpi-value">{formatFCFA(dzmB)}</div></div>
      </div>

      {loading ? <div className="dzm-card p-8 flex items-center gap-3"><Loader2 className="animate-spin" size={18} /> Chargement des produits...</div> : error ? <div className="dzm-card p-6 text-red-400">{error}</div> : filtered.length === 0 ? <div className="dzm-card p-6">Aucun produit trouvé.</div> : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 dzm-card overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead><tr className="border-b border-dzm-border bg-white/5">{['Produit', 'Quantité', 'Prix moyen', 'CA total', 'Factures', 'Structures', 'Tendance'].map((h) => <th key={h} className="p-3 text-[10px] font-bold uppercase opacity-40 whitespace-nowrap">{h}</th>)}</tr></thead>
              <tbody>
                {filtered.map((product) => (
                  <tr key={product.produit} className="border-b border-white/[0.03] hover:bg-white/5 transition-colors">
                    <td className="p-3 font-medium text-sm flex items-center gap-2"><Package2 size={14} className="opacity-50" />{product.produit}</td>
                    <td className="p-3">{product.quantite}</td>
                    <td className="p-3">{formatFCFA(product.prixUnitaire || 0)}</td>
                    <td className="p-3 font-semibold">{formatFCFA(product.caTotal || 0)}</td>
                    <td className="p-3">{product.facturesAssociees}</td>
                    <td className="p-3">{product.structure}</td>
                    <td className="p-3">{product.tendance === 'hausse' ? <span className="text-emerald-400 inline-flex items-center gap-1"><TrendingUp size={14} /> Hausse</span> : product.tendance === 'baisse' ? <span className="text-red-400 inline-flex items-center gap-1"><TrendingDown size={14} /> Baisse</span> : <span className="opacity-60">Stable</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="dzm-card p-5 space-y-4">
            <h3 className="font-display text-lg">Lecture rapide</h3>
            <div className="space-y-3 text-sm">
              <div className="rounded-2xl bg-white/5 border border-white/8 p-4"><p className="opacity-65 text-xs uppercase mb-2">Top produit</p><p className="font-semibold">{filtered[0]?.produit || '—'}</p><p className="opacity-60 mt-1">{filtered[0] ? formatFCFA(filtered[0].caTotal || 0) : '—'}</p></div>
              <div className="rounded-2xl bg-white/5 border border-white/8 p-4"><p className="opacity-65 text-xs uppercase mb-2">Structures couvertes</p><p className="font-semibold">{Array.from(new Set(filtered.flatMap((p) => p.structure.split(' / ')))).join(' • ') || '—'}</p></div>
              <div className="rounded-2xl bg-white/5 border border-white/8 p-4"><p className="opacity-65 text-xs uppercase mb-2">Conseil</p><p className="opacity-80">Utilise cette page pour surveiller les produits réellement achetés. Les emballages et colis doivent être suivis depuis la section dédiée.</p></div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ProductsPage;
