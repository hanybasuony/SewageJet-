import React from 'react';
import { 
  LayoutDashboard, 
  Sparkles, 
  CircleDot, 
  GitCommit, 
  Truck, 
  Users, 
  ClipboardCheck, 
  Map, 
  FileText,
  Smartphone
} from 'lucide-react';

export type TabType = 
  | 'dashboard' 
  | 'dispatcher' 
  | 'mobile'
  | 'manholes' 
  | 'pipelines' 
  | 'equipment' 
  | 'workforce' 
  | 'logging' 
  | 'map' 
  | 'reports';

interface NavigationTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  criticalManholesCount: number;
  criticalLinesCount: number;
  hasActivePlan: boolean;
  activeTicketsCount?: number;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  activeTab,
  onTabChange,
  criticalManholesCount,
  criticalLinesCount,
  hasActivePlan,
  activeTicketsCount = 0
}) => {
  const tabs = [
    {
      id: 'dashboard' as TabType,
      label: 'لوحة القيادة',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'dispatcher' as TabType,
      label: 'التخطيط والجدولة الذكية',
      icon: Sparkles,
      highlight: true,
      badge: hasActivePlan ? 'نشطة' : 'توليد',
      badgeColor: hasActivePlan ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-cyan-500/20 text-cyan-300',
    },
    {
      id: 'mobile' as TabType,
      label: 'بلاغات الموبايل الميدانية',
      icon: Smartphone,
      highlight: activeTicketsCount > 0,
      badge: activeTicketsCount > 0 ? `${activeTicketsCount} بلاغ` : 'جديد',
      badgeColor: activeTicketsCount > 0 ? 'bg-rose-500 text-white font-bold animate-pulse' : 'bg-cyan-500/20 text-cyan-300',
    },
    {
      id: 'manholes' as TabType,
      label: 'إدارة المطابق',
      icon: CircleDot,
      badge: criticalManholesCount > 0 ? `${criticalManholesCount} حرج` : null,
      badgeColor: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
    },
    {
      id: 'pipelines' as TabType,
      label: 'الخطوط والمواسير',
      icon: GitCommit,
      badge: criticalLinesCount > 0 ? `${criticalLinesCount} حرج` : null,
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    },
    {
      id: 'equipment' as TabType,
      label: 'أسطول المعدات',
      icon: Truck,
      badge: null,
    },
    {
      id: 'workforce' as TabType,
      label: 'العمالة والموارد البشرية',
      icon: Users,
      badge: null,
    },
    {
      id: 'logging' as TabType,
      label: 'تسجيل الإنجاز واليومية',
      icon: ClipboardCheck,
      badge: null,
    },
    {
      id: 'map' as TabType,
      label: 'الخريطة التفاعلية للشبكة',
      icon: Map,
      badge: null,
    },
    {
      id: 'reports' as TabType,
      label: 'التقارير الفنية والتحليلات',
      icon: FileText,
      badge: null,
    },
  ];

  return (
    <nav className="bg-slate-950/70 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-reverse space-x-1 sm:space-x-2 overflow-x-auto py-2.5 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all cursor-pointer
                  ${isActive 
                    ? 'bg-gradient-to-r from-cyan-900/80 to-blue-900/80 text-cyan-200 shadow-md shadow-cyan-950/50 border border-cyan-600/40 font-bold' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'}
                  ${tab.highlight && !isActive ? 'hover:border-amber-500/30 text-amber-200/90' : ''}
                `}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : tab.highlight ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>

                {tab.badge && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${tab.badgeColor}`}>
                    {tab.badge}
                  </span>
                )}

                {isActive && (
                  <span className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-8 h-[2px] bg-gradient-to-r from-cyan-400 to-amber-400 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
