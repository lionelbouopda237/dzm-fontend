import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Download, Mail, Send } from 'lucide-react';
import { api } from '@/lib/api';

const ExportPage = () => {
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [sendingTelegram, setSendingTelegram] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const openExport = (table: string) => {
    window.open(`${api.backendUrl}/api/export/${table}`, '_blank');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h2 className="text-2xl font-display">Exports</h2>
        <p className="text-sm opacity-60">Téléchargement direct depuis le backend réel, envoi email brandé DZM et déclenchement Telegram.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          ['Factures', 'factures'],
          ['Paiements', 'paiements_mobile'],
          ['Produits', 'produits_facture'],
        ].map(([label, table]) => (
          <div key={table} className="dzm-card p-6 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-dzm-blue/20 flex items-center justify-center mb-4"><Download size={28} /></div>
            <h3 className="font-display font-bold text-lg mb-1">{label}</h3>
            <p className="text-xs opacity-60 mb-4">Export Excel réel</p>
            <button onClick={() => openExport(table)} className="dzm-btn-primary w-full flex items-center justify-center gap-2"><Download size={16} /> Télécharger</button>
          </div>
        ))}
        <div className="dzm-card p-6 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-dzm-orange/20 flex items-center justify-center mb-4"><Mail size={28} /></div>
          <h3 className="font-display font-bold text-lg mb-1">Envoyer par email</h3>
          <p className="text-xs opacity-60 mb-4">3 exports en une fois</p>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="votre@email.com" className="dzm-input mb-3 text-center text-sm" />
          <button onClick={async () => { if (!email) return; setError(''); setMessage(''); setSendingEmail(true); try { await api.exportEmail(email); setEmailSent(true); setMessage(`Export envoyé à ${email}`); setTimeout(() => setEmailSent(false), 3000); } catch (e:any) { setError(e.message || 'Erreur lors de l’envoi email'); } finally { setSendingEmail(false); } }} disabled={sendingEmail} className="dzm-btn-primary w-full flex items-center justify-center gap-2">{sendingEmail ? 'Envoi...' : emailSent ? <><Check size={16} /> Envoyé</> : <><Mail size={16} /> Envoyer</>}</button>
        </div>
      </div>
      {(message || error) && <div className={`dzm-card p-4 text-sm ${error ? 'border border-red-400/30 text-red-300' : 'border border-emerald-400/30 text-emerald-300'}`}>{error || message}</div>}
      <div className="dzm-card p-6 flex items-center justify-between gap-4">
        <div><h3 className="font-display text-lg">Rapport Telegram</h3><p className="text-sm opacity-60">Déclenche le résumé quotidien via le bot configuré.</p></div>
        <button onClick={async () => { setSendingTelegram(true); try { await api.telegramRapport(); alert('Rapport Telegram envoyé'); } catch (err: any) { alert(err.message || 'Erreur Telegram'); } finally { setSendingTelegram(false); } }} className="dzm-btn-primary flex items-center gap-2">{sendingTelegram ? 'Envoi...' : <><Send size={16} /> Envoyer maintenant</>}</button>
      </div>
    </motion.div>
  );
};

export default ExportPage;
