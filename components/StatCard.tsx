
import React from 'react';
import type { StatCardProps } from '../types';

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => {
  return (
    <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/10 transform hover:scale-[1.02] transition-all duration-300 ease-in-out">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <p className="text-3xl font-bold text-white">
            {value === null ? (
              <span className="animate-pulse">...</span>
            ) : (
              value.toLocaleString()
            )}
          </p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
