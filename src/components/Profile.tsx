import React from 'react';
import { useAuth } from '../context/AuthContext';
import { X } from 'lucide-react';
import HealthProfile from './HealthProfile';

const Profile: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { user } = useAuth();

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 relative">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <h2 className="text-2xl font-bold text-gray-900">Health Profile</h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <HealthProfile />
    </div>
  );
};

export default Profile;