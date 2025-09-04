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
    <div className="border-b border-slate-200 bg-white" style={{ boxShadow: 'var(--shadow-sm)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  group inline-flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200
                  ${isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }
                `}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className={`
                  transition-colors duration-200
                  ${isActive ? 'text-blue-500' : 'text-slate-400 group-hover:text-slate-600'}
                `}>
                  {tab.icon}
                </span>
                
                <span className="font-semibold">
                  {tab.label}
                </span>
                
                {tab.count !== undefined && (
                  <span className={`
                    inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors duration-200
                    ${isActive
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                    }
                  `}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {children}
    </div>
  );
}