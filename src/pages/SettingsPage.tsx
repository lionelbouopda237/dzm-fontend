import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, CheckCircle2, Database, Mail, Send, XCircle } from 'lucide-react';
import { api } from '@/lib/api';

const SettingsPage = () => {
  const [status, setStatus] = useState<{ supabase: boolean; groq: boolean; telegram: boolean; gmail: boolean; backendUrl?: string } | null>(null);
  const [health, setHealth] = useState<{ status: string; service?: string; timestamp?: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [config, healthData] = await Promise.all([api.configStatus(), api.health()]);
        setStatus(config);
        setHealth(healthData);
      } catch {
        setStatus(null);
      }
    })();
  }, []);

  const line = (label: string, ok?: boolean, desc?: string) => (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-white/5">
      <div><p className="font-medium">{label}</p><p className="text-xs opacity-60">{desc}</p></div>
      {ok ? <CheckCircle2 className="text-emerald-400 shrink-0" /> : <XCircle className="text-red-400 shrink-0" />}
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-display">Paramètres</h2>
        <p className="text-sm opacity-60">État réel du backend et des intégrations. Les clés restent gérées côté serveur.</p>
      </div>
      <div className="dzm-card p-6 space-y-4">
        <div className="flex items-center gap-3"><Database className="text-dzm-blue" /><h3 className="font-display text-lg">État de la plateforme</h3></div>
        {status ? (
          <div>
            {line('Backend actif', health?.status === 'ok', health?.service || 'Service principal')}
            {line('Supabase', status.supabase, 'Lecture/écriture des factures, paiements et produits')}
            {line('Groq', status.groq, 'OCR et assistant IA')}
            {line('Telegram', status.telegram, 'Rapport quotidien et commandes bot')}
            {line('Gmail', status.gmail, 'Export email des fichiers Excel')}
          </div>
        ) : <p className="text-red-400">Impossible de lire l’état du backend. Vérifie VITE_API_URL et le service Render.</p>}
        <div className="text-xs opacity-60">Backend public : {status?.backendUrl || api.backendUrl}</div>
        <div className="text-xs opacity-60">Dernier check : {health?.timestamp || 'indisponible'}</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="dzm-card p-5"><div className="flex items-center gap-2 mb-3"><Database size={18} /><span className="font-medium">Supabase</span></div><p className="text-sm opacity-60">La configuration se fait sur Render via les variables d’environnement.</p></div>
        <div className="dzm-card p-5"><div className="flex items-center gap-2 mb-3"><Bot size={18} /><span className="font-medium">Groq</span></div><p className="text-sm opacity-60">Remplace Gemini pour l’OCR et l’assistant. Les prompts restent côté backend.</p></div>
        <div className="dzm-card p-5"><div className="flex items-center gap-2 mb-3"><Send size={18} /><Mail size={18} /><span className="font-medium">Notifications</span></div><p className="text-sm opacity-60">Telegram et Gmail sont testés depuis les pages Export et Dashboard.</p></div>
      </div>
    </motion.div>
  );
};

export default SettingsPage;
