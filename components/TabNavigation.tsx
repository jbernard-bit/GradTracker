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
      <div className="max-w-7xl mx-auto" style={{ paddingLeft: '24px', paddingRight: '24px' }}>
        <nav 
          className="flex items-baseline overflow-x-auto scrollbar-hide" 
          aria-label="Main Navigation"
          style={{ 
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            gap: '6px'
          }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  group relative flex items-center text-center font-medium whitespace-nowrap rounded-t-lg outline-none
                  transition-all duration-300 ease-out
                  focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2 focus:ring-offset-white
                  ${isActive
                    ? 'text-blue-700 bg-gradient-to-b from-blue-50 to-blue-25 border-b-3 border-blue-600 shadow-sm'
                    : 'text-slate-700 bg-transparent border-b-3 border-transparent hover:text-slate-900 hover:bg-slate-50/80 hover:border-slate-300/50'
                  }
                `}
                style={{ 
                  paddingLeft: '20px',
                  paddingRight: '20px',
                  paddingTop: '14px',
                  paddingBottom: '14px',
                  fontSize: '15px',
                  fontWeight: '600',
                  letterSpacing: '0.025em',
                  lineHeight: '1.4'
                }}
                aria-current={isActive ? 'page' : undefined}
                role="tab"
                tabIndex={isActive ? 0 : -1}
              >
                {/* Icon */}
                <span 
                  className={`
                    flex-shrink-0 transition-all duration-250 ease-out
                    ${isActive 
                      ? 'text-blue-600 transform scale-105' 
                      : 'text-slate-500 group-hover:text-slate-700 group-focus:text-slate-700'
                    }
                  `}
                  style={{ marginRight: '10px' }}
                >
                  {tab.icon}
                </span>
                
                {/* Label */}
                <span className="transition-all duration-250 ease-out">
                  {tab.label}
                </span>
                
                {/* Count Badge */}
                {tab.count !== undefined && (
                  <span 
                    className={`
                      inline-flex items-center justify-center rounded-full text-xs font-semibold min-w-[20px] h-5
                      transition-all duration-250 ease-out
                      ${isActive
                        ? 'bg-blue-600 text-white shadow-sm transform scale-105'
                        : 'bg-slate-200/80 text-slate-700 group-hover:bg-slate-300/90 group-hover:text-slate-800 group-focus:bg-slate-300/90'
                      }
                    `}
                    style={{
                      marginLeft: '6px',
                      paddingLeft: '6px',
                      paddingRight: '6px',
                      fontSize: '11px',
                      fontWeight: '600'
                    }}
                  >
                    {tab.count}
                  </span>
                )}

                {/* Active indicator line */}
                <div 
                  className={`
                    absolute bottom-0 left-0 right-0 h-0.5 rounded-t-sm
                    transition-all duration-300 ease-out
                    ${isActive 
                      ? 'bg-blue-600 opacity-100 transform scale-x-100' 
                      : 'bg-slate-400 opacity-0 transform scale-x-0 group-hover:opacity-30 group-hover:scale-x-75'
                    }
                  `}
                />

                {/* Subtle hover indicator */}
                <div 
                  className={`
                    absolute inset-0 rounded-t-lg pointer-events-none
                    transition-all duration-250 ease-out
                    ${isActive 
                      ? 'bg-gradient-to-r from-blue-500/5 to-blue-600/5' 
                      : 'bg-transparent group-hover:bg-slate-100/50 group-focus:bg-slate-100/50'
                    }
                  `}
                />
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