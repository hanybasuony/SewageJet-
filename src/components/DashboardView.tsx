import React from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Truck, 
  CircleDot, 
  GitCommit, 
  Users, 
  Layers, 
  ShieldAlert, 
  Clock, 
  ArrowUpRight, 
  Flame, 
  Droplet,
  ChevronLeft,
  Smartphone,
  PhoneCall,
  QrCode
} from 'lucide-react';
import { DailyPlan, Equipment, FieldLogEntry, Manhole, Pipeline, Worker, IncidentTicket } from '../types/sewage';

interface DashboardViewProps {
  manholes: Manhole[];
  pipelines: Pipeline[];
  equipment: Equipment[];
  workers: Worker[];
  currentPlan: DailyPlan | null;
  fieldLogs: FieldLogEntry[];
  incidentTickets?: IncidentTicket[];
  onNavigateTab: (tab: any) => void;
  onOpenDispatcher: () => void;
  onOpenQrModal?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  manholes,
  pipelines,
  equipment,
  workers,
  currentPlan,
  fieldLogs,
  incidentTickets = [],
  onNavigateTab,
  onOpenDispatcher,
  onOpenQrModal
}) => {
  // KPI Calculations
  const targetManholes = currentPlan?.totalTargetManholes || 4;
  const targetLinearMeters = currentPlan?.totalTargetLinearMeters || 220;

  const cleanedManholesCount = manholes.filter(m => m.status === 'cleaned').length;
  const flushedMetersCount = pipelines
    .filter(p => p.status === 'flushed')
    .reduce((sum, p) => sum + p.length, 0);

  const manholesProgressPercent = Math.min(Math.round((cleanedManholesCount / targetManholes) * 100), 100);
  const metersProgressPercent = Math.min(Math.round((flushedMetersCount / targetLinearMeters) * 100), 100);

  // Sludge volume estimation
  const totalSludgeM3 = fieldLogs.reduce((sum, log) => {
    return sum + log.cleanedManholes.reduce((sub, m) => sub + m.siltRemovedM3, 0);
  }, 0) + 4.8; // include base baseline

  const criticalManholes = manholes.filter(m => m.status === 'critical' || m.siltLevelPercent >= 70);
  const criticalLines = pipelines.filter(p => p.status === 'critical' || p.blockagePercent >= 60);

  const availableTrucks = equipment.filter(e => e.status === 'available');
  const inUseTrucks = equipment.filter(e => e.status === 'in_use');

  return (
    <div className="space-y-6">
      
      {/* Hero Operational Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-blue-950 border border-slate-700/60 p-6 shadow-2xl">
        <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none translate-x-1/2 translate-y-1/2" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                نظام الذكاء الاصطناعي التشغيلي للشبكات
              </span>
              <span className="text-xs text-slate-400 font-mono">
                وردية اليوم: {new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              مركز إدارة وتوجيه أسطول التطهير والتمليس الهيدروليكي
            </h2>

            <p className="text-sm text-slate-300 leading-relaxed">
              تحكم ذكي في توجيه سيارات النافورة فائقة الضغط، كباش التطهير للمطابق العميقة، وطلمبات الكسح مع موازنة دقيقة بين أعماق المطابق وأقطار الخطوط والعمالة المتاحة للوصول لأعلى إنتاجية تشغيلية.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onOpenDispatcher}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-slate-950 font-black px-5 py-3 rounded-xl shadow-lg shadow-cyan-900/40 text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 fill-slate-950" />
              <span>إطلاق المخطط الذكي بـ AI</span>
            </button>
            <button
              onClick={() => onNavigateTab('logging')}
              className="bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-white font-semibold px-4 py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>تسجيل إنجاز اليومية</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Emergency Incident Strip */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950/20 to-slate-900 border border-rose-500/30 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white">مركز بلاغات وطوارئ الميدان عبر الموبايل</h3>
              <span className="text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-full">
                {incidentTickets.filter(t => t.status !== 'resolved').length} بلاغ نشط
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              ربط مباشر بين بلاغات المواطنين والفنيين من هواتفهم الذكية مع التوجيه الفوري لسيارات النافورة والكباش.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 mr-auto md:mr-0 shrink-0">
          {onOpenQrModal && (
            <button
              onClick={onOpenQrModal}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer transition-all ring-1 ring-amber-300"
              title="مسح رمز الـ QR الحقيقي لفتح البوابة على هاتفك المحمول"
            >
              <QrCode className="w-4 h-4 text-slate-950" />
              <span>رمز QR للموبايل</span>
            </button>
          )}

          <button
            onClick={() => onNavigateTab('mobile')}
            className="bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-rose-950/40 cursor-pointer transition-all"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>تسجيل بلاغ موبايل</span>
          </button>

          <button
            onClick={() => onNavigateTab('map')}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer"
          >
            <span>معاينة بالخريطة</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Manholes Cleaned vs Target */}
        <div className="bg-slate-850/80 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden group hover:border-cyan-500/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">تطهير المطابق (المنجز / المخطط)</span>
            <div className="p-2 rounded-lg bg-cyan-950/80 text-cyan-400 border border-cyan-800/40">
              <CircleDot className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{cleanedManholesCount}</span>
            <span className="text-sm font-medium text-slate-400">/ {targetManholes} مطبق</span>
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-400">نسبة الإنجاز</span>
              <span className="font-bold text-cyan-400">{manholesProgressPercent}%</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-700" 
                style={{ width: `${manholesProgressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 2: Pipe Lines Flushed (Linear Meters) */}
        <div className="bg-slate-850/80 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">أمتار التمليس (المنجز / المستهدف)</span>
            <div className="p-2 rounded-lg bg-amber-950/80 text-amber-400 border border-amber-800/40">
              <GitCommit className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{flushedMetersCount}</span>
            <span className="text-sm font-medium text-slate-400">/ {targetLinearMeters} م.ط</span>
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-400">كفاءة التمليس الميداني</span>
              <span className="font-bold text-amber-400">{metersProgressPercent}%</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-amber-500 to-amber-600 h-full rounded-full transition-all duration-700" 
                style={{ width: `${metersProgressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 3: Equipment Fleet Readiness */}
        <div className="bg-slate-850/80 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">أسطول الآليات والمعدات</span>
            <div className="p-2 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-800/40">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{availableTrucks.length + inUseTrucks.length}</span>
            <span className="text-sm font-medium text-slate-400">/ {equipment.length} معدة عاملة</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              جاهزة: {availableTrucks.length}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              في الميدان: {inUseTrucks.length}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              صيانة: {equipment.filter(e => e.status === 'maintenance' || e.status === 'breakdown').length}
            </span>
          </div>
        </div>

        {/* Card 4: Silt & Sludge Volume Removed */}
        <div className="bg-slate-850/80 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden group hover:border-blue-500/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">حجم الرواسب المستخرجة</span>
            <div className="p-2 rounded-lg bg-blue-950/80 text-blue-400 border border-blue-800/40">
              <Droplet className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{totalSludgeM3.toFixed(1)}</span>
            <span className="text-sm font-medium text-slate-400">متر مكعب (m³)</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
            <span>تم استخراجه بواسطة الكباش والكسح</span>
            <span className="text-emerald-400 font-bold">استعادة السريان</span>
          </div>
        </div>

      </div>

      {/* Main Grid: Active Plan + Critical Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Active AI Plan Summary (2 Columns) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-amber-400 animate-pulse" />
              <h3 className="text-lg font-bold text-white">
                خطة العمل التشغيلية المعتمدة لليوم
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('dispatcher')}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
            >
              <span>تفاصيل وتعديل الخطة</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          {currentPlan ? (
            <div className="space-y-4">
              <div className="bg-slate-850 rounded-xl p-4 border border-slate-800">
                <h4 className="font-bold text-amber-300 text-sm mb-1">{currentPlan.planTitle}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{currentPlan.executiveSummary}</p>
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    المدة التقديرية: {currentPlan.estimatedTotalHours || 7.5} ساعة
                  </span>
                  <span className="flex items-center gap-1 font-mono">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    الفرق الميدانية: {currentPlan.crews.length} طاقم
                  </span>
                  <span className="flex items-center gap-1 font-mono">
                    <CircleDot className="w-3.5 h-3.5 text-slate-500" />
                    المطابق: {currentPlan.totalTargetManholes}
                  </span>
                  <span className="flex items-center gap-1 font-mono">
                    <GitCommit className="w-3.5 h-3.5 text-slate-500" />
                    أطوال الخطوط: {currentPlan.totalTargetLinearMeters} م
                  </span>
                </div>
              </div>

              {/* Crews Breakdown */}
              <div className="space-y-2.5">
                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">الفرق وتوزيع المعدات:</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {currentPlan.crews.map((crew, idx) => (
                    <div key={idx} className="bg-slate-850/60 border border-slate-800 hover:border-slate-700 rounded-lg p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-white">{crew.crewName}</span>
                        <span className="text-[11px] bg-slate-800 text-cyan-300 px-2 py-0.5 rounded font-mono border border-slate-700">
                          {crew.assignedEquipment.split('-')[0]}
                        </span>
                      </div>
                      <div className="text-xs text-slate-300 space-y-1">
                        <div className="text-[11px] text-amber-400/90 font-medium">المعدة: {crew.assignedEquipment}</div>
                        <div>المشرف: <span className="text-slate-200">{crew.supervisor}</span> | السائق: <span className="text-slate-200">{crew.driver}</span></div>
                        <div>المنطقة المستهدفة: <span className="text-cyan-300">{crew.targetArea}</span></div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        <span className="text-[10px] text-slate-500">المطابق المحددة:</span>
                        {crew.assignedManholeCodes.map(code => (
                          <span key={code} className="text-[10px] bg-slate-800 text-slate-200 px-1.5 py-0.5 rounded border border-slate-700 font-mono">
                            {code}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Safety Quick Checklist */}
              <div className="bg-rose-950/20 border border-rose-900/40 rounded-xl p-3.5 text-xs">
                <div className="flex items-center gap-2 text-rose-300 font-bold mb-1.5">
                  <ShieldAlert className="w-4 h-4" />
                  <span>اشتراطات أمان الأماكن المغلقة (Confined Spaces) المعتمدة اليوم:</span>
                </div>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-1 text-[11px] text-rose-200/80 list-disc list-inside">
                  {currentPlan.safetyInstructions.slice(0, 4).map((inst, i) => (
                    <li key={i}>{inst}</li>
                  ))}
                </ul>
              </div>

            </div>
          ) : (
            <div className="text-center py-10 space-y-3">
              <Sparkles className="w-10 h-10 text-amber-400 mx-auto opacity-70 animate-bounce" />
              <p className="text-sm text-slate-400">لا توجد خطة عمل مجدولة حالياً لهذا اليوم.</p>
              <button
                onClick={onOpenDispatcher}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs cursor-pointer"
              >
                توليد خطة عمل ذكية فوراً
              </button>
            </div>
          )}

        </div>

        {/* Critical Alerts & Priority Attention (1 Column) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <h3 className="text-base font-bold text-white">
                تنبيهات الانسدادات والترسيب الحرج
              </h3>
            </div>
            <span className="text-xs bg-rose-950 text-rose-400 border border-rose-800/50 px-2 py-0.5 rounded-full font-bold">
              {criticalManholes.length + criticalLines.length} تنبيه
            </span>
          </div>

          <div className="space-y-3">
            <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">مطابق ذات ترسيب مرتفع أو عمق حرج:</h5>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {criticalManholes.map(mh => (
                <div key={mh.id} className="bg-slate-850 p-2.5 rounded-lg border border-slate-800 hover:border-rose-500/40 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white font-mono">{mh.code}</span>
                    <span className="bg-rose-950 text-rose-300 text-[10px] px-2 py-0.5 rounded font-bold">
                      ترسيب: {mh.siltLevelPercent}%
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    العمق: <span className="text-slate-200 font-bold">{mh.depth}م</span> | القطر: {mh.diameter}مم
                  </div>
                  <div className="text-[10px] text-amber-300 truncate">
                    {mh.notes || mh.location}
                  </div>
                </div>
              ))}
            </div>

            <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pt-2">خطوط بحاجة لتمليس فوري:</h5>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {criticalLines.map(line => (
                <div key={line.id} className="bg-slate-850 p-2.5 rounded-lg border border-slate-800 hover:border-amber-500/40 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white font-mono">{line.code}</span>
                    <span className="bg-amber-950 text-amber-300 text-[10px] px-2 py-0.5 rounded font-bold">
                      انسداد: {line.blockagePercent}%
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    الطول: <span className="text-slate-200">{line.length}م</span> | القطر: Ø{line.diameter}مم
                  </div>
                  <div className="text-[10px] text-cyan-300">
                    الموصى به: {line.recommendedMethod}
                  </div>
                </div>
              ))}
            </div>

          </div>

          <div className="pt-2">
            <button
              onClick={() => onNavigateTab('manholes')}
              className="w-full bg-slate-800 hover:bg-slate-750 text-slate-200 font-semibold text-xs py-2 rounded-lg border border-slate-700 flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>معاينة كافة المطابق والخطوط</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>

      {/* Engineering Field Workflow Guide */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>الدورة الهندسية المعيارية لأعمال التطهير والتمليس الميداني (SOP)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
          <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-800 relative">
            <div className="w-8 h-8 rounded-full bg-blue-950 text-blue-400 border border-blue-700/40 flex items-center justify-center font-bold text-xs mx-auto mb-2">1</div>
            <div className="font-bold text-xs text-white mb-1">فحص الغازات والتأمين</div>
            <p className="text-[10px] text-slate-400 leading-tight">قياس تركيز H2S و CO و O2 وتهوية المطبق ووضع الحواجز</p>
          </div>

          <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-800 relative">
            <div className="w-8 h-8 rounded-full bg-amber-950 text-amber-400 border border-amber-700/40 flex items-center justify-center font-bold text-xs mx-auto mb-2">2</div>
            <div className="font-bold text-xs text-white mb-1">تطهير المطبق بالكباش</div>
            <p className="text-[10px] text-slate-400 leading-tight">إنزال الكباش لاستخراج الأحجار والحمأة الصلبة من القاع</p>
          </div>

          <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-800 relative">
            <div className="w-8 h-8 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-700/40 flex items-center justify-center font-bold text-xs mx-auto mb-2">3</div>
            <div className="font-bold text-xs text-white mb-1">تمليس الخط بالنافورة</div>
            <p className="text-[10px] text-slate-400 leading-tight">ضخ مياه بضغط 180-220 بار عكس اتجاه السريان لتفتيت الرواسب</p>
          </div>

          <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-800 relative">
            <div className="w-8 h-8 rounded-full bg-purple-950 text-purple-400 border border-purple-700/40 flex items-center justify-center font-bold text-xs mx-auto mb-2">4</div>
            <div className="font-bold text-xs text-white mb-1">تسليك ميكانيكي (إذا لزم)</div>
            <p className="text-[10px] text-slate-400 leading-tight">قطع جذور الأشجار والشحوم المتكلسة بواسطة أسياخ وواير التمليس</p>
          </div>

          <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-800 relative">
            <div className="w-8 h-8 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-700/40 flex items-center justify-center font-bold text-xs mx-auto mb-2">5</div>
            <div className="font-bold text-xs text-white mb-1">فحص تلفزيوني CCTV</div>
            <p className="text-[10px] text-slate-400 leading-tight">إنزال روبوت الكاميرا للتحقق من سلامة الجدران وخلوها من الانسداد</p>
          </div>

          <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-800 relative">
            <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 border border-slate-700 flex items-center justify-center font-bold text-xs mx-auto mb-2">6</div>
            <div className="font-bold text-xs text-white mb-1">التوثيق والاعتماد الهندسي</div>
            <p className="text-[10px] text-slate-400 leading-tight">تسجيل الأعماق والأمتار المستخلصة وتوقيع محضر الإنجاز اليومي</p>
          </div>
        </div>
      </div>

    </div>
  );
};
