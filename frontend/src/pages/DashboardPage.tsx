import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Link } from 'react-router-dom';
import api from '../services/api';

interface DashboardStats {
  totalAssets: number;
  publishedAssets: number;
  draftAssets: number;
  totalCollections: number;
  recentAssets: any[];
}

const DashboardPage = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [stats, setStats] = useState<DashboardStats>({
    totalAssets: 0,
    publishedAssets: 0,
    draftAssets: 0,
    totalCollections: 0,
    recentAssets: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch stats from backend
        const response = await api.get('/stats');
        setStats(response.data.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const statCards = [
    {
      label: 'Total Assets',
      value: stats.totalAssets,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
      color: 'bg-blue-500',
      link: '/assets',
    },
    {
      label: 'Published',
      value: stats.publishedAssets,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      color: 'bg-green-500',
      link: '/assets?status=PUBLISHED',
    },
    {
      label: 'Drafts',
      value: stats.draftAssets,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
      ),
      color: 'bg-yellow-500',
      link: '/assets?status=DRAFT',
    },
    {
      label: 'Collections',
      value: stats.totalCollections,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      ),
      color: 'bg-purple-500',
      link: '/collections',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-600">
          Here's an overview of your digital asset management system
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => (
          <Link
            key={stat.label}
            to={stat.link}
            className="card p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900">
                  {loading ? '...' : stat.value.toLocaleString()}
                </p>
              </div>
              <div className={`${stat.color} text-white p-3 rounded-lg`}>
                {stat.icon}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      {(user?.role === 'ADMIN' || user?.role === 'CURATOR') && (
        <div className="card p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <Link to="/assets/upload" className="btn-primary">
              <svg
                className="w-5 h-5 mr-2 inline"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              Upload Assets
            </Link>
            <Link to="/collections" className="btn bg-purple-600 text-white hover:bg-purple-700">
              <svg
                className="w-5 h-5 mr-2 inline"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Create Collection
            </Link>
            <Link to="/search" className="btn bg-gray-600 text-white hover:bg-gray-700">
              <svg
                className="w-5 h-5 mr-2 inline"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              Advanced Search
            </Link>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Assets</h2>
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : stats.recentAssets.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No assets yet. Start by{' '}
            <Link to="/assets/upload" className="text-primary-600 hover:underline">
              uploading some assets
            </Link>
            .
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {stats.recentAssets.slice(0, 6).map((asset) => (
              <Link
                key={asset.id}
                to={`/assets/${asset.id}`}
                className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100 hover:shadow-md transition-shadow"
              >
                <img
                  src={asset.thumbnailUrl || '/placeholder-image.png'}
                  alt={asset.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    <p className="text-white text-sm font-medium truncate">
                      {asset.title}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
