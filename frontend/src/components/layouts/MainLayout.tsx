import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import Header from './Header';
import Sidebar from './Sidebar';

const MainLayout = () => {
  const { sidebarOpen } = useSelector((state: RootState) => state.ui);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className={`flex flex-col flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        {/* Header */}
        <Header />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
