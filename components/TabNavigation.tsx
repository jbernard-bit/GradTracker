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
    <div className="w-70 bg-white border-r border-slate-200 h-full flex flex-col" style={{ width: '280px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
      {/* Sidebar Header */}
      <div className="px-8 py-8 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">GradTracker</h1>
        <p className="text-sm text-slate-600 mt-2">Job Application Tracker</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-6 py-6 space-y-2" aria-label="Sidebar Navigation">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                group w-full flex items-center gap-4 px-5 py-4 text-left font-medium transition-all duration-200 ease-out
                ${isActive
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }
                rounded-xl
              `}
              style={{ 
                lineHeight: '1.5',
                fontSize: '15px',
                fontWeight: '500'
              }}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className={`
                transition-colors duration-200 flex-shrink-0
                ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-700'}
              `}>
                {tab.icon}
              </span>
              
              <span className="transition-colors duration-200 flex-1">
                {tab.label}
              </span>
              
              {tab.count !== undefined && (
                <span className={`
                  inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-200 flex-shrink-0
                  ${isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 text-slate-700 group-hover:bg-slate-300'
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
      <div className="px-6 py-6 border-t border-slate-200">
        <div className="text-xs text-slate-500 text-center font-medium">
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
      <div className="max-w-7xl mx-auto px-8 py-8">
        {children}
      </div>
    </div>
  );
}