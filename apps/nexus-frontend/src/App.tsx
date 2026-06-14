import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Settings } from 'lucide-react';
import TaskBoard from './pages/TaskBoard';

function Sidebar() {
  const location = useLocation();
  return (
    <div className="sidebar">
      <div className="sidebar-title">
        <LayoutDashboard size={24} />
        Nexus Hub
      </div>
      <Link to="/" className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}>
        <LayoutDashboard size={18} /> Task Board
      </Link>
      <Link to="/docs" className={`nav-item ${location.pathname === '/docs' ? 'active' : ''}`}>
        <FileText size={18} /> Docs Editor
      </Link>
      <Link to="/settings" className={`nav-item ${location.pathname === '/settings' ? 'active' : ''}`}>
        <Settings size={18} /> Settings
      </Link>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="layout-container">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<TaskBoard />} />
            <Route path="/docs" element={<div className="page-title">Docs Editor (T-1005)</div>} />
            <Route path="/settings" element={<div className="page-title">Settings</div>} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
