import React from 'react';

interface ViewSwitcherProps {
  currentView: 'board' | 'list' | 'map' | 'analytics';
  onViewChange: (view: 'board' | 'list' | 'map' | 'analytics') => void;
  applicationCount: number;
}

export default function ViewSwitcher({ currentView, onViewChange, applicationCount }: ViewSwitcherProps) {
  const views = [
    {
      id: 'board' as const,
      label: 'Board',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2z" />
        </svg>
      ),
      description: 'Kanban pipeline view'
    },
    {
      id: 'list' as const,
      label: 'List',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      ),
      description: 'Detailed table view'
    },
    {
      id: 'map' as const,
      label: 'Map',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      description: 'Geographic view'
    },
    {
      id: 'analytics' as const,
      label: 'Analytics',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      description: 'Success metrics'
    }
  ];

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-4">
        <h3 className="text-lg font-semibold text-slate-900">
          Applications ({applicationCount})
        </h3>
        
        {/* View Toggle */}
        <div className="flex bg-slate-100 rounded-lg p-1">
          {views.map((view) => (
            <button
              key={view.id}
              onClick={() => onViewChange(view.id)}
              className={`
                flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200
                ${currentView === view.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }
              `}
              title={view.description}
            >
              {view.icon}
              <span>{view.label}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* View Description */}
      <div className="text-sm text-slate-500">
        {views.find(v => v.id === currentView)?.description}
      </div>
    </div>
  );
}