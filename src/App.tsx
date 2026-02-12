import { Layout } from './components/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { ExportImportPage } from './pages/ExportImportPage';
import { HistoryPage } from './pages/HistoryPage';
import { MasterDataPage } from './pages/MasterDataPage';
import { useAppStore } from './store/store';

function App() {
  const nav = useAppStore((s) => s.nav);

  return (
    <Layout>
      {nav === 'dashboard' ? <DashboardPage /> : null}
      {nav === 'masterdata' ? <MasterDataPage /> : null}
      {nav === 'history' ? <HistoryPage /> : null}
      {nav === 'export-import' ? <ExportImportPage /> : null}
    </Layout>
  );
}

export default App;
