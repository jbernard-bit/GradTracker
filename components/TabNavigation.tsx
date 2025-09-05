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
    <div className="w-full bg-white border-b border-slate-200" style={{ boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
      {/* Header Section */}
      <div className="max-w-7xl mx-auto px-6 py-6 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">GradTracker</h1>
            <p className="text-sm text-slate-600 mt-1">Job Application Management Platform</p>
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Version 1.0.0
          </div>
        </div>
      </div>

      {/* Horizontal Navigation */}
      <div className="max-w-7xl mx-auto px-6">
        <nav 
          className="flex items-center space-x-1 overflow-x-auto scrollbar-hide" 
          aria-label="Main Navigation"
          style={{ 
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  group relative flex items-center justify-center gap-2 px-6 py-4 text-center font-medium transition-all duration-200 ease-in-out whitespace-nowrap min-w-fit
                  ${isActive
                    ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-b-2 border-transparent hover:border-slate-200'
                  }
                `}
                style={{ 
                  fontSize: '15px',
                  fontWeight: '600',
                  letterSpacing: '0.025em',
                  lineHeight: '1.4'
                }}
                aria-current={isActive ? 'page' : undefined}
              >
                {/* Icon */}
                <span className={`
                  transition-colors duration-200 flex-shrink-0
                  ${isActive ? 'text-blue-600' : 'text-slate-500 group-hover:text-slate-700'}
                `}>
                  {tab.icon}
                </span>
                
                {/* Label */}
                <span className="transition-colors duration-200">
                  {tab.label}
                </span>
                
                {/* Count Badge */}
                {tab.count !== undefined && (
                  <span className={`
                    inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold transition-all duration-200 min-w-[20px] h-5
                    ${isActive
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 text-slate-700 group-hover:bg-slate-300'
                    }
                  `}
                  style={{
                    fontSize: '11px',
                    fontWeight: '600'
                  }}>
                    {tab.count}
                  </span>
                )}

                {/* Active indicator line */}
                {isActive && (
                  <div 
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 transition-all duration-200"
                    style={{ borderRadius: '2px 2px 0 0' }}
                  />
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
    <div className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto px-8 py-8">
        {children}
      </div>
    </div>
  );
}