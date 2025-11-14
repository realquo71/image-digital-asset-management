import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditApi } from '../../services/api';
import { toast } from 'react-toastify';

const AuditLogsPage = () => {
  const [filters, setFilters] = useState({
    userId: '',
    action: '',
    entityType: '',
    dateFrom: '',
    dateTo: '',
    page: 1,
    limit: 50,
  });

  const { data: auditLogs, isLoading } = useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: async () => {
      const response = await auditApi.getAuditLogs(filters);
      return response.data;
    },
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExport = async () => {
    try {
      toast.info('Preparing export...');
      const response = await auditApi.exportAuditLogs({
        userId: filters.userId || undefined,
        action: filters.action || undefined,
        entityType: filters.entityType || undefined,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Audit logs exported');
    } catch (error) {
      toast.error('Failed to export audit logs');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-600 mt-1">
            System activity and compliance tracking
          </p>
        </div>

        <button
          onClick={handleExport}
          className="btn bg-green-600 text-white hover:bg-green-700"
        >
          <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="card p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              User ID
            </label>
            <input
              type="text"
              value={filters.userId}
              onChange={(e) => handleFilterChange('userId', e.target.value)}
              placeholder="Filter by user..."
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Action
            </label>
            <select
              value={filters.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              className="input"
            >
              <option value="">All Actions</option>
              <option value="CREATE_ASSET">Create Asset</option>
              <option value="UPDATE_ASSET">Update Asset</option>
              <option value="DELETE_ASSET">Delete Asset</option>
              <option value="CREATE_COLLECTION">Create Collection</option>
              <option value="UPDATE_COLLECTION">Update Collection</option>
              <option value="DELETE_COLLECTION">Delete Collection</option>
              <option value="ADD_TAG">Add Tag</option>
              <option value="REMOVE_TAG">Remove Tag</option>
              <option value="BULK_DOWNLOAD">Bulk Download</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Entity Type
            </label>
            <select
              value={filters.entityType}
              onChange={(e) => handleFilterChange('entityType', e.target.value)}
              className="input"
            >
              <option value="">All Types</option>
              <option value="ASSET">Asset</option>
              <option value="COLLECTION">Collection</option>
              <option value="USER">User</option>
              <option value="TAG">Tag</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date From
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date To
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="input"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={() =>
              setFilters({
                userId: '',
                action: '',
                entityType: '',
                dateFrom: '',
                dateTo: '',
                page: 1,
                limit: 50,
              })
            }
            className="btn"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Audit Logs Table */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading audit logs...</p>
        </div>
      ) : !auditLogs || !auditLogs.data || auditLogs.data.length === 0 ? (
        <div className="text-center py-12 card">
          <svg
            className="w-16 h-16 text-gray-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-gray-600">No audit logs found</p>
        </div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {auditLogs.data.map((log: any, index: number) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="text-gray-900">{log.user?.name || 'System'}</div>
                        <div className="text-gray-500 text-xs">{log.user?.email || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="text-gray-900">{log.entityType}</div>
                        {log.entityId && (
                          <div className="text-gray-500 text-xs font-mono">{log.entityId.substring(0, 8)}...</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.ipAddress || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {log.success ? (
                          <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800">
                            Success
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-800">
                            Failed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {auditLogs.meta && auditLogs.meta.pages > 1 && (
            <div className="flex items-center justify-center space-x-2 mt-6">
              <button
                onClick={() => handlePageChange(auditLogs.meta.page - 1)}
                disabled={auditLogs.meta.page === 1}
                className="btn disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-gray-700">
                Page {auditLogs.meta.page} of {auditLogs.meta.pages}
              </span>
              <button
                onClick={() => handlePageChange(auditLogs.meta.page + 1)}
                disabled={auditLogs.meta.page === auditLogs.meta.pages}
                className="btn disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AuditLogsPage;
