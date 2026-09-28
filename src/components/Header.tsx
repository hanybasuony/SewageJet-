import React from 'react';
import { 
  Wrench, 
  Activity, 
  Truck, 
  Users, 
  ShieldCheck, 
  Calendar,
  Sparkles,
  Printer,
  RotateCcw,
  Smartphone,
  QrCode
} from 'lucide-react';
import { DailyPlan, Equipment, Manhole, Pipeline, Worker } from '../types/sewage';

interface HeaderProps {
  manholes: Manhole[];
  pipelines: Pipeline[];
  equipment: Equipment[];
  workers: Worker[];
  currentPlan: DailyPlan | null;
  onOpenQuickPlan: () => void;
  onResetData: () => void;
  onPrintReport: () => void;
  onOpenMobileReport?: () => void;
  onOpenStandaloneMobile?: () => void;
  onOpenQrModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  manholes,
  pipelines,
  equipment,
  workers,
  currentPlan,
  onOpenQuickPlan,
  onResetData,
  onPrintReport,
  onOpenMobileReport,
  onOpenStandaloneMobile,
  onOpenQrModal
}) => {
  const availableEquipment = equipment.filter(e => e.status === 'available' || e.status === 'in_use').length;
  const presentWorkers = workers.filter(w => w.presentToday).length;
  const criticalManholes = manholes.filter(m => m.status === 'critical' || m.siltLevelPercent >= 70).length;
  const totalCleaned = manholes.filter(m => m.status === 'cleaned').length;
  const totalFlushedMeters = pipelines
    .filter(p => p.status === 'flushed')
    .reduce((sum, p) => sum + p.length, 0);

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 shadow-xl no-print">
      {/* Top Banner with branding and quick stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo & System Identity */}
          <div className="flex items-center gap-3.5 self-start md:self-auto">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-amber-500 p-0.5 shadow-lg shadow-cyan-900/30 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Wrench className="w-6 h-6 text-cyan-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-sans">
                  منظومة <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-amber-400">SewageJet AI</span>
                </h1>
                <span className="text-[11px] font-semibold bg-cyan-950/80 text-cyan-300 border border-cyan-700/50 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  مُحدّث بالمعدات
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                نظام ذكاء اصطناعي لإدارة وتخطيط أعمال تطهير مطابق الصرف الصحي وتمليس الخطوط
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center flex-wrap gap-2.5 sm:gap-3 text-xs">
            {/* Equipment status */}
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-lg px-3 py-1.5 flex items-center gap-2">
              <Truck className="w-4 h-4 text-amber-400" />
              <div>
                <span className="text-slate-400 block text-[10px]">المعدات الجاهزة</span>
                <span className="font-bold text-amber-300">{availableEquipment} / {equipment.length}</span>
              </div>
            </div>

            {/* Workforce status */}
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-lg px-3 py-1.5 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="text-slate-400 block text-[10px]">العمالة الحاضرة</span>
                <span className="font-bold text-emerald-300">{presentWorkers} / {workers.length}</span>
              </div>
            </div>

            {/* Critical Manholes */}
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-lg px-3 py-1.5 flex items-center gap-2">
              <Activity className="w-4 h-4 text-rose-400" />
              <div>
                <span className="text-slate-400 block text-[10px]">مطابق حرجة</span>
                <span className="font-bold text-rose-300">{criticalManholes}</span>
              </div>
            </div>

            {/* Cleaned & Flushed */}
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-lg px-3 py-1.5 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <div>
                <span className="text-slate-400 block text-[10px]">المُطهَّر / التمليس</span>
                <span className="font-bold text-cyan-300">{totalCleaned} مطبق | {totalFlushedMeters}م</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 mr-auto md:mr-2">
              {onOpenQrModal && (
                <button
                  onClick={onOpenQrModal}
                  className="bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-black px-3.5 py-2 rounded-lg text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/25 transition-all cursor-pointer ring-1 ring-amber-300/80 animate-pulse"
                  title="عرض ومسح رمز الـ QR لفتح شاشة البلاغات على الموبايل مباشرة"
                >
                  <QrCode className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                  <span>رمز QR للموبايل</span>
                </button>
              )}

              {onOpenStandaloneMobile && (
                <button
                  onClick={onOpenStandaloneMobile}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold px-3 py-2 rounded-lg text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950/40 transition-all cursor-pointer"
                  title="فتح واجهة تطبيق الهاتف الميدانية المستقلة"
                >
                  <Smartphone className="w-3.5 h-3.5 text-emerald-200" />
                  <span className="hidden sm:inline">شاشة الموبايل</span>
                  <span className="sm:hidden">موبايل</span>
                </button>
              )}

              {onOpenMobileReport && (
                <button
                  onClick={onOpenMobileReport}
                  className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold px-3 py-2 rounded-lg text-xs flex items-center gap-1.5 shadow-md shadow-cyan-950/50 transition-all cursor-pointer"
                  title="فتح بوابة بلاغات الهاتف المحمول"
                >
                  <Smartphone className="w-3.5 h-3.5 text-cyan-200" />
                  <span>بلاغ سريع</span>
                </button>
              )}

              <button
                onClick={onOpenQuickPlan}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold px-3 py-2 rounded-lg text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                title="توليد وتحديث خطة العمل اليومية الذكية"
              >
                <Sparkles className="w-3.5 h-3.5 text-slate-950 fill-slate-950" />
                <span>الخطة الذكية</span>
              </button>

              <button
                onClick={onPrintReport}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium px-2.5 py-2 rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer"
                title="طباعة التقرير الفني المعتمد"
              >
                <Printer className="w-3.5 h-3.5 text-slate-300" />
                <span className="hidden sm:inline">طباعة</span>
              </button>

              <button
                onClick={onResetData}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-slate-200 p-2 rounded-lg text-xs transition-colors cursor-pointer"
                title="استعادة البيانات النموذجية"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};
