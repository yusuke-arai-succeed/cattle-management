import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import CattleLedger from './pages/CattleLedger';
import Intake from './pages/Intake';
import Shipment from './pages/Shipment';
import BarnMaster from './pages/BarnMaster';
import Movement from './pages/Movement';
import Feed from './pages/Feed';
import Treatment from './pages/Treatment';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/cattle" element={<CattleLedger />} />
            <Route path="/intake" element={<Intake />} />
            <Route path="/shipment" element={<Shipment />} />
            <Route path="/barns" element={<BarnMaster />} />
            <Route path="/movement" element={<Movement />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/treatment" element={<Treatment />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AppProvider>
  );
}
