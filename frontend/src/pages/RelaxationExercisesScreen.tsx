import React, { useState } from 'react';
import { Zap } from 'lucide-react';
import { RelaxationLibrary } from '../components/wellness/RelaxationLibrary';
import { MuscleRelaxation } from '../components/wellness/MuscleRelaxation';
import type { NavigationScreen } from '../storage/sessionStorage';

interface RelaxationExercisesScreenProps {
  onNavigate: (screen: NavigationScreen) => void;
}

export const RelaxationExercisesScreen: React.FC<RelaxationExercisesScreenProps> = ({
  onNavigate
}) => {
  const [activeTab, setActiveTab] = useState<'library' | 'pmr'>('library');

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-100 dark:border-gray-800">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Zap className="w-6 h-6 text-brand-600" />
            Relaxation Exercises & Somatic Library
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Somatic down-regulation, progressive muscle release, and restorative student practices.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('library')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'library'
                ? 'bg-white dark:bg-gray-700 text-brand-600 dark:text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            Relaxation Catalogue
          </button>
          <button
            onClick={() => setActiveTab('pmr')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'pmr'
                ? 'bg-white dark:bg-gray-700 text-brand-600 dark:text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            Progressive Muscle (PMR)
          </button>
        </div>
      </div>

      {/* Render selected view */}
      {activeTab === 'library' ? (
        <RelaxationLibrary
          onBack={() => onNavigate('wellness_studio')}
          onComplete={() => onNavigate('wellness_studio')}
        />
      ) : (
        <MuscleRelaxation
          onBack={() => setActiveTab('library')}
          onComplete={() => setActiveTab('library')}
        />
      )}
    </div>
  );
};
