import { ReactNode } from 'react';

interface Tab {
  id: string;
  label: string;
  icon: ReactNode;
  count?: number;
}

interface TabNavigationProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export default function TabNavigation({ tabs, activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="w-64 bg-white border-r border-slate-100 h-full flex flex-col">
      {/* Sidebar Header */}
      <div className="p-6 border-b border-slate-100">
        <h1 className="text-xl font-semibold text-slate-800">GradTracker</h1>
        <p className="text-sm text-slate-500 mt-1">Job Application Tracker</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2" aria-label="Sidebar Navigation">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                group w-full flex items-center gap-3 px-4 py-3 text-left font-normal transition-all duration-200 ease-out
                ${isActive
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }
                rounded-lg
              `}
              style={{ 
                lineHeight: '1.5',
                fontSize: '15px',
                fontWeight: '400'
              }}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className={`
                transition-colors duration-200 flex-shrink-0
                ${isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'}
              `}>
                {tab.icon}
              </span>
              
              <span className="transition-colors duration-200 flex-1">
                {tab.label}
              </span>
              
              {tab.count !== undefined && (
                <span className={`
                  inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-all duration-200 flex-shrink-0
                  ${isActive
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                  }
                `}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-slate-100">
        <div className="text-xs text-slate-400 text-center">
          Version 1.0.0
        </div>
      </div>
    </div>
  );
}

// Tab content wrapper component
interface TabContentProps {
  activeTab: string;
  tabId: string;
  children: ReactNode;
}

export function TabContent({ activeTab, tabId, children }: TabContentProps) {
  if (activeTab !== tabId) {
    return null;
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-8">
        {children}
      </div>
    </div>
  );
}