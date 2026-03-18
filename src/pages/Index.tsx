import { useEffect, useState } from 'react';
import DzmSidebar from '@/components/DzmSidebar';
import DzmHeader from '@/components/DzmHeader';
import SplashScreen from '@/components/SplashScreen';
import Dashboard from '@/pages/DashboardPage';
import InvoicesPage from '@/pages/InvoicesPage';
import PaymentsPage from '@/pages/PaymentsPage';
import ProductsPage from '@/pages/ProductsPage';
import AIAssistantPage from '@/pages/AIAssistantPage';
import ExportPage from '@/pages/ExportPage';
import SettingsPage from '@/pages/SettingsPage';
import EmballagesPage from '@/pages/EmballagesPage';
import RapprochementsPage from '@/pages/RapprochementsPage';
import RistournesPage from '@/pages/RistournesPage';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showSplash, setShowSplash] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1800);
    return () => clearTimeout(timer);
  }, []);

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'invoices': return <InvoicesPage />;
      case 'payments': return <PaymentsPage />;
      case 'products': return <ProductsPage />;
      case 'rapprochements': return <RapprochementsPage />;
      case 'ristournes': return <RistournesPage />;
      case 'ai': return <AIAssistantPage />;
      case 'export': return <ExportPage />;
      case 'settings': return <SettingsPage />;
      case 'emballages': return <EmballagesPage />;
      default: return <Dashboard />;
    }
  };

  return (
    <>
      <SplashScreen visible={showSplash} />
      <div className="min-h-screen flex overflow-hidden">
        <DzmSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="flex-1 flex flex-col overflow-hidden">
          <DzmHeader title={activeTab} />
          <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
            {renderPage()}
          </div>
        </main>
      </div>
    </>
  );
};

export default Index;
