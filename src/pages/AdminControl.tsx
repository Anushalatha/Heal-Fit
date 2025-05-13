import React from 'react';
import { useAuth } from '../context/AuthContext';

const AdminControl: React.FC = () => {
  const { user } = useAuth();

  if (user?.role !== 'admin') {
    return (
      <div className="p-4 text-center">
        <h2 className="text-2xl font-bold text-red-600">Access Denied</h2>
        <p className="mt-2 text-gray-600">You do not have permission to access this page.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Control Panel</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* User Management Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">User Management</h2>
          <div className="space-y-4">
            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              View All Users
            </button>
            <button className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
              Create New User
            </button>
            <button className="w-full px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700">
              Manage User Roles
            </button>
          </div>
        </div>

        {/* Content Management Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Content Management</h2>
          <div className="space-y-4">
            <button className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
              Manage Articles
            </button>
            <button className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
              Manage Exercises
            </button>
            <button className="w-full px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700">
              Manage Community Posts
            </button>
          </div>
        </div>

        {/* System Settings Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">System Settings</h2>
          <div className="space-y-4">
            <button className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
              System Configuration
            </button>
            <button className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
              Backup & Restore
            </button>
            <button className="w-full px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700">
              View System Logs
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Analytics Dashboard</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-100 p-4 rounded-lg">
            <h3 className="text-lg font-medium">Total Users</h3>
            <p className="text-3xl font-bold">1,234</p>
          </div>
          <div className="bg-green-100 p-4 rounded-lg">
            <h3 className="text-lg font-medium">Active Users</h3>
            <p className="text-3xl font-bold">789</p>
          </div>
          <div className="bg-yellow-100 p-4 rounded-lg">
            <h3 className="text-lg font-medium">Daily Sessions</h3>
            <p className="text-3xl font-bold">456</p>
          </div>
          <div className="bg-purple-100 p-4 rounded-lg">
            <h3 className="text-lg font-medium">System Health</h3>
            <p className="text-3xl font-bold">100%</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminControl; 