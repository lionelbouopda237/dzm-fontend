import { useState } from 'react';
import { LayoutDashboard, FileText, CreditCard, Package, Bot, Download, Settings, ChevronLeft, ChevronRight, Archive, Radar, Link2, Gift } from 'lucide-react';
import { motion } from 'framer-motion';
import dzmLogo from '@/assets/dzm-logo.png';

interface DzmSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { id: 'invoices', label: 'Factures', icon: FileText },
  { id: 'payments', label: 'Paiements', icon: CreditCard },
  { id: 'emballages', label: 'Gestion emballages vides', icon: Archive },
  { id: 'products', label: 'Produits', icon: Package },
  { id: 'rapprochements', label: 'Rapprochements', icon: Link2 },
  { id: 'ristournes', label: 'Ristournes', icon: Gift },
  { id: 'ai', label: 'Assistant IA', icon: Bot },
  { id: 'export', label: 'Exports', icon: Download },
  { id: 'settings', label: 'Paramètres', icon: Settings },
];

const DzmSidebar = ({ activeTab, onTabChange }: DzmSidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`${collapsed ? 'w-20' : 'w-80'} dzm-glass border-r border-dzm-border flex flex-col transition-all duration-300 relative shrink-0`}>
      <button onClick={() => setCollapsed(!collapsed)} className="absolute -right-3 top-8 z-10 w-7 h-7 rounded-full dzm-glass flex items-center justify-center hover:scale-105 transition-transform">
        {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
      </button>

      <div className={`p-6 ${collapsed ? 'px-3' : 'p-7'}`}>
        <div className="rounded-3xl overflow-hidden dzm-card p-4">
          <img src={dzmLogo} alt="Logo ETS DZM" className={`${collapsed ? 'h-11 mx-auto' : 'h-32 mx-auto'} object-contain transition-all drop-shadow-[0_0_32px_rgba(70,164,255,0.18)]`} />
        </div>
        {!collapsed && (
          <>
            <p className="font-display text-sm mt-4">DZM Financial Cockpit</p>
            <p className="text-[11px] opacity-55 mt-1">Pilotage DZM A / DZM B • Surveillance DT AZIMUTS</p>
            <div className="flex gap-2 mt-4">
              <span className="dzm-badge-blue">DZM A</span>
              <span className="dzm-badge-orange">DZM B</span>
            </div>
          </>
        )}
      </div>

      <nav className="flex-1 px-3 space-y-1.5">
        {menuItems.map((item) => (
          <button key={item.id} onClick={() => onTabChange(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 ${activeTab === item.id ? 'bg-white/8 shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_18px_35px_rgba(70,164,255,0.12)]' : 'hover:bg-white/5 opacity-70 hover:opacity-100'}`}>
            <item.icon size={18} className={activeTab === item.id ? 'text-dzm-blue' : ''} />
            {!collapsed && <span className="font-medium text-sm">{item.label}</span>}
            {activeTab === item.id && !collapsed && <motion.div layoutId="nav-indicator" className="ml-auto w-2 h-2 rounded-full bg-gradient-to-r from-dzm-blue to-dzm-orange" />}
          </button>
        ))}
      </nav>

      <div className={`p-5 border-t border-dzm-border ${collapsed ? 'px-3' : ''}`}>
        {!collapsed && (
          <div className="space-y-3">
            <div className="dzm-card px-3 py-2 flex items-center gap-2 text-xs opacity-85">
              <Radar size={14} className="text-dzm-purple" /> Mode cockpit actif
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-400 uppercase tracking-[0.22em]">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" /> Backend / Supabase actifs
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default DzmSidebar;
