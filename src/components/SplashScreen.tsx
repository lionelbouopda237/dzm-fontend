import { motion, AnimatePresence } from 'framer-motion';
import dzmLogo from '@/assets/dzm-logo.png';

export default function SplashScreen({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-[#040812]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(70,164,255,0.18),transparent_24%),radial-gradient(circle_at_top_right,rgba(255,154,61,0.14),transparent_18%)]" />
          <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.7, ease: 'easeOut' }} className="relative z-10 text-center">
            <motion.div initial={{ filter: 'blur(12px)' }} animate={{ filter: 'blur(0px)' }} transition={{ duration: 1.1 }} className="w-56 h-56 mx-auto rounded-[32px] dzm-card flex items-center justify-center p-6 shadow-[0_0_80px_rgba(70,164,255,0.16)]">
              <img src={dzmLogo} alt="DZM" className="max-h-44 object-contain" />
            </motion.div>
            <motion.h1 initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="mt-8 font-display text-3xl">DZM Financial Cockpit</motion.h1>
            <motion.p initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 0.68 }} transition={{ delay: 0.4 }} className="text-sm mt-3 tracking-[0.18em] uppercase">Pilotage intelligent • Contrôle fournisseur • IA métier</motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
