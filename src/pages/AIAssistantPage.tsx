import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, Loader2, Mic, MicOff, Send, Volume2 } from 'lucide-react';
import { api } from '@/lib/api';

interface Msg { role: 'user' | 'ai'; content: string }
const quickActions = [
  'Combien de factures sont en anomalie ?',
  'Quels paiements sont en attente pour DZM A ?',
  'Résume la dernière facture enregistrée.',
  'Quel est le solde emballages de DZM B ?',
  'Dernier paiement',
];

type RecognitionCtor = new () => {
  lang: string; interimResults: boolean; continuous: boolean;
  onstart: null | (() => void); onresult: null | ((e: any) => void); onerror: null | ((e: any) => void); onend: null | (() => void);
  start(): void; stop(): void;
};

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Msg[]>([{ role: 'ai', content: 'Bonjour. Je suis branché sur les données réelles DZM. Pose une question métier : factures, paiements, emballages, comparaison DZM A / DZM B, ou contrôle DT AZIMUTS.' }]);
  const [input, setInput] = useState(() => {
    if (typeof window === 'undefined') return '';
    return window.localStorage.getItem('dzm_ai_draft') || '';
  });
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [listenHelp, setListenHelp] = useState('Clique sur le micro, parle clairement, puis clique sur Envoyer.');
  const [lastTranscript, setLastTranscript] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef('');

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);
  useEffect(() => {
    if (typeof window !== 'undefined') window.localStorage.setItem('dzm_ai_draft', input);
  }, [input]);

  const supported = useMemo(() => typeof window !== 'undefined' && (((window as any).webkitSpeechRecognition as RecognitionCtor) || ((window as any).SpeechRecognition as RecognitionCtor)), []);

  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(text.replace(/^Reformulation\s*:\s*/i, ''));
    utterance.lang = 'fr-FR'; utterance.rate = 0.95; utterance.pitch = 1;
    window.speechSynthesis.cancel(); window.speechSynthesis.speak(utterance);
  };

  const ask = async (question?: string) => {
    const content = (question ?? input).trim();
    if (!content || loading) return;
    const nextMessages = [...messages, { role: 'user' as const, content }];
    setMessages(nextMessages);
    setInput('');
    if (typeof window !== 'undefined') window.localStorage.removeItem('dzm_ai_draft');
    setLoading(true);
    try {
      const result = await api.assistant(content, nextMessages.slice(-8));
      setMessages((prev) => [...prev, { role: 'ai', content: result.response || 'Je n’ai pas pu répondre.' }]);
    } catch (err: any) {
      setMessages((prev) => [...prev, { role: 'ai', content: `Reformulation : tu veux utiliser l'assistant DZM.\n\nJe rencontre une erreur technique : ${err.message || 'service indisponible'}.` }]);
    } finally {
      setLoading(false);
      setListening(false);
      setListenHelp('');
    }
  };

  const toggleMic = () => {
    if (!supported) {
      setListenHelp('La dictée vocale n’est pas disponible sur ce navigateur.');
      return;
    }
    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }
    const Ctor = ((window as any).webkitSpeechRecognition || (window as any).SpeechRecognition) as RecognitionCtor;
    const recognition = new Ctor();
    recognition.lang = 'fr-FR';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onstart = () => { setListening(true); setListenHelp('Écoute en cours… Parlez maintenant, puis cliquez à nouveau pour arrêter.'); };
    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) transcript += event.results[i][0].transcript;
      const cleaned = transcript.trim();
      transcriptRef.current = cleaned;
      setLastTranscript(cleaned);
      setInput(cleaned);
      setListenHelp('Transcription détectée. Continue de parler ou clique sur arrêter, puis utilise Envoyer.');
    };
    recognition.onerror = (event) => { setListening(false); setListenHelp(`Micro indisponible : ${event.error || 'permission refusée'}.`); };
    recognition.onend = () => {
      setListening(false);
      const finalText = (transcriptRef.current || input).trim();
      if (finalText) {
        setInput(finalText);
        setListenHelp('Transcription prête. Vérifie si besoin puis clique sur Envoyer.');
      } else {
        setListenHelp('Aucune parole détectée. Réessaie, autorise le micro, ou tape directement ta question.');
      }
    };
    recognitionRef.current = recognition;
    recognition.start();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 h-full flex flex-col">
      <div className="dzm-card dzm-hero p-6">
        <h2 className="text-2xl md:text-3xl font-display">Assistant IA DZM</h2>
        <p className="text-sm opacity-70 mt-2 max-w-3xl">Je reformule d’abord ta demande, puis je réponds à partir des données réelles DZM A / DZM B. Si ta question est ambiguë, je te demande une précision au lieu de deviner. Je peux aussi garder ton brouillon si tu changes de page puis reviens plus tard.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {quickActions.map((action) => <button key={action} className="px-3 py-2 rounded-full border border-dzm-border hover:bg-white/5 text-sm" onClick={() => ask(action)}>{action}</button>)}
      </div>
      <div className="dzm-card flex-1 min-h-[520px] flex flex-col p-4 overflow-hidden">
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[88%] rounded-[22px] px-4 py-3 whitespace-pre-wrap text-sm ${msg.role === 'user' ? 'bg-[linear-gradient(135deg,var(--dzm-blue),#285fcb)] text-white shadow-[0_10px_24px_rgba(70,164,255,0.25)]' : 'bg-white/5 border border-white/10'}`}>
                {msg.role === 'ai' ? <div className="flex items-center justify-between gap-2 text-xs opacity-60 mb-2"><div className="flex items-center gap-2"><Bot size={14} /> Assistant DZM</div><button className="hover:text-white transition-colors" onClick={() => speak(msg.content)} title="Lire à voix haute"><Volume2 size={14} /></button></div> : null}
                {msg.content}
              </div>
            </div>
          ))}
          {loading && <div className="flex items-center gap-2 text-sm opacity-60"><Loader2 size={16} className="animate-spin" /> Analyse en cours des données DZM…</div>}
          <div ref={endRef} />
        </div>
        <div className="pt-4 border-t border-white/5 mt-4 space-y-3">
          {listenHelp && <div className={`text-xs rounded-xl px-3 py-2 ${listening ? 'bg-dzm-purple/15 text-dzm-text' : 'bg-white/5 opacity-80'}`}>{listenHelp}</div>}
          <div className="flex gap-3 items-end">
            <textarea className="dzm-input flex-1 min-h-[84px]" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), ask())} placeholder="Ex. Compare DZM A et DZM B sur les paiements en attente de cette semaine." />
            <button className={`rounded-2xl h-12 w-12 flex items-center justify-center border ${listening ? 'bg-dzm-purple/20 border-dzm-purple' : 'bg-white/5 border-dzm-border'}`} onClick={toggleMic} title={listening ? 'Arrêter l’écoute' : 'Activer le micro'}>{listening ? <MicOff size={18} /> : <Mic size={18} />}</button>
            <button className="dzm-btn-primary flex items-center gap-2 h-12" onClick={() => ask()} disabled={loading}><Send size={16} /> Envoyer</button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
