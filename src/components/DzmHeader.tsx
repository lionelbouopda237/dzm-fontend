import { Sparkles } from 'lucide-react';
import dzmLogo from '@/assets/dzm-logo.png';
import { useDayTheme } from '@/hooks/useDayTheme';

interface DzmHeaderProps { title: string }
const PAGE_TITLES: Record<string, string> = {
  dashboard: 'Tableau de bord', invoices: 'Factures', payments: 'Paiements', products: 'Produits', ai: 'Assistant IA', export: 'Exports', settings: 'Paramètres', emballages: 'Emballages'
};

const themeLabels = { aube: 'Aube', jour: 'Jour', apresmidi: 'Après-midi', soir: 'Soir', nuit: 'Nuit' };

const DzmHeader = ({ title }: DzmHeaderProps) => {
  const { theme, now } = useDayTheme();
  return (
    <header className="h-24 border-b border-dzm-border px-8 flex items-center justify-between dzm-glass z-10 shrink-0">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl dzm-card flex items-center justify-center p-1"><img src={dzmLogo} alt="DZM" className="max-h-10 object-contain" /></div>
        <div>
          <h2 className="font-display text-2xl">{PAGE_TITLES[title] || title}</h2>
          <p className="text-xs uppercase tracking-[0.22em] opacity-45">Mode {themeLabels[theme]}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl dzm-card text-xs opacity-80">
          <Sparkles size={14} className="text-dzm-purple" /> DZM A / DZM B • DT AZIMUTS
        </div>
        <div className="text-right">
          <div className="text-3xl md:text-4xl font-display leading-none">{now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
          <div className="text-[11px] opacity-55 uppercase tracking-[0.18em] mt-1">
            {now.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </div>
    </header>
  );
};

export default DzmHeader;
