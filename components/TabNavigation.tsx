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
    <div className="bg-white border-b border-slate-100/50">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-6">
        <nav className="flex justify-center gap-4" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  group inline-flex items-center gap-3 px-7 py-4 text-base font-normal transition-all duration-200 ease-out
                  ${isActive
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                  }
                  rounded-full
                `}
                style={{ 
                  lineHeight: '1.5',
                  fontSize: '15px',
                  fontWeight: '400'
                }}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className={`
                  transition-colors duration-200
                  ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'}
                `}>
                  {tab.icon}
                </span>
                
                <span className="transition-colors duration-200">
                  {tab.label}
                </span>
                
                {tab.count !== undefined && (
                  <span className={`
                    inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-all duration-200
                    ${isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-white text-gray-600 group-hover:bg-white group-hover:text-gray-800'
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