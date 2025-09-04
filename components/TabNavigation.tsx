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
    <div className="bg-white border-b border-slate-200/60" style={{ boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  group relative inline-flex items-center gap-3 px-6 py-4 text-sm font-medium transition-all duration-300 ease-in-out
                  ${isActive
                    ? 'text-blue-700 bg-blue-50/80 border-b-2 border-blue-500'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50/80 border-b-2 border-transparent hover:border-slate-300'
                  }
                  rounded-t-lg relative overflow-hidden
                `}
                aria-current={isActive ? 'page' : undefined}
              >
                {/* Active state background gradient */}
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 to-blue-50/20 opacity-60"></div>
                )}
                
                {/* Hover effect background */}
                <div className="absolute inset-0 bg-gradient-to-r from-slate-50/0 via-slate-50/40 to-slate-50/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <span className={`
                  relative z-10 transition-all duration-300
                  ${isActive ? 'text-blue-600 scale-110' : 'text-slate-500 group-hover:text-slate-700 group-hover:scale-105'}
                `}>
                  {tab.icon}
                </span>
                
                <span className={`
                  relative z-10 font-semibold transition-all duration-300
                  ${isActive ? 'text-blue-800' : 'text-slate-700 group-hover:text-slate-900'}
                `}>
                  {tab.label}
                </span>
                
                {tab.count !== undefined && (
                  <span className={`
                    relative z-10 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold transition-all duration-300
                    ${isActive
                      ? 'bg-blue-200/80 text-blue-900 shadow-sm border border-blue-300/50'
                      : 'bg-slate-200/80 text-slate-700 group-hover:bg-slate-300/80 group-hover:text-slate-800 shadow-sm border border-slate-300/50'
                    }
                  `}>
                    {tab.count}
                  </span>
                )}
                
                {/* Active indicator line */}
                {isActive && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-blue-500 rounded-full shadow-sm"></div>
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