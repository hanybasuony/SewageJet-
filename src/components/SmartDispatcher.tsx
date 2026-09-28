import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Truck, 
  CircleDot, 
  GitCommit, 
  Users, 
  ShieldCheck, 
  AlertTriangle, 
  RotateCcw, 
  Printer, 
  Check, 
  Clock, 
  CheckCircle2, 
  Layers, 
  Activity, 
  Radio, 
  ArrowRight,
  Flame,
  ChevronDown,
  Info,
  Smartphone
} from 'lucide-react';
import { DailyPlan, Equipment, Manhole, Pipeline, Worker, IncidentTicket } from '../types/sewage';
import { aiService } from '../services/aiService';

interface SmartDispatcherProps {
  manholes: Manhole[];
  pipelines: Pipeline[];
  equipment: Equipment[];
  workers: Worker[];
  currentPlan: DailyPlan | null;
  incidentTickets?: IncidentTicket[];
  onPlanUpdated: (newPlan: DailyPlan) => void;
}

export const SmartDispatcher: React.FC<SmartDispatcherProps> = ({
  manholes,
  pipelines,
  equipment,
  workers,
  currentPlan,
  incidentTickets = [],
  onPlanUpdated
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isReplanning, setIsReplanning] = useState(false);
  const [priorityFocus, setPriorityFocus] = useState('توازن شامل وفك الانسدادات الحرجة');
  const [incidentType, setIncidentType] = useState('equipment_breakdown');
  const [incidentDescription, setIncidentDescription] = useState('عطل مفاجئ في بلف ضغط سيارة النافورة JET-01 وتوقفها المؤقت');
  const [replanResult, setReplanResult] = useState<any | null>(null);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    if (!showIncidentModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowIncidentModal(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showIncidentModal]);

  // Available resources count
  const availableEquipment = equipment.filter(e => e.status === 'available' || e.status === 'in_use');
  const presentWorkers = workers.filter(w => w.presentToday);
  const criticalManholes = manholes.filter(m => m.status === 'critical' || m.siltLevelPercent >= 60);
  const criticalLines = pipelines.filter(p => p.status === 'critical' || p.blockagePercent >= 50);

  // Trigger AI Plan Generation
  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    setReplanResult(null);
    try {
      const generated = await aiService.generateDailyPlan({
        manholes,
        lines: pipelines,
        equipment: availableEquipment,
        workforce: presentWorkers,
        priorityFocus,
        shiftDate: new Date().toISOString().slice(0, 10),
      });

      onPlanUpdated(generated);
      setSuccessToast('تم توليد خطة العمل الذكية بنجاح وربط المعدات بالمطابق والخطوط!');
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: any) {
      console.error(err);
      alert('حدث خطأ أثناء إعداد الخطة، تم استخدام الخوارزمية الهندسية الاحتياطية.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Trigger Dynamic Contingency Replanning
  const handleExecuteReplan = async () => {
    if (!currentPlan) return;
    setIsReplanning(true);
    try {
      const result = await aiService.dynamicReplan({
        incidentType,
        incidentDescription,
        currentPlan,
        remainingTasks: {
          manholes: currentPlan.crews.flatMap(c => c.assignedManholeCodes),
          lines: currentPlan.crews.flatMap(c => c.assignedLineCodes),
        },
        availableEquipment: equipment.filter(e => e.status === 'available'),
        availableWorkforce: presentWorkers,
      });

      setReplanResult(result);
      setShowIncidentModal(false);
      setSuccessToast('تمت إعادة الجدولة التلقائية وتحديث توزيع المهام للمتبقي من اليوم!');
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: any) {
      console.error(err);
      alert('حدث خطأ أثناء إعادة الجدولة.');
    } finally {
      setIsReplanning(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {successToast && (
        <div className="bg-emerald-900/90 border border-emerald-500 text-emerald-100 px-4 py-3 rounded-xl shadow-2xl flex items-center justify-between text-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="font-bold">{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-emerald-300 hover:text-white font-bold">×</button>
        </div>
      )}

      {/* Control Panel: Generation Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Sparkles className="w-4 h-4" />
              </span>
              <h2 className="text-xl font-black text-white">
                خوارزمية الربط والجدولة الذكية (AI Dispatch & Fleet Matcher)
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              مطابقة هندسية دقيقة بين أعماق المطابق، أقطار الخطوط، معدلات ضغط سيارات النافورة، كباش التطهير، وتوزيع العمالة اليومية.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            <button
              onClick={() => setShowIncidentModal(true)}
              className="bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/60 font-semibold px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              title="محاكاة عطل مفاجئ أو نقص عمالة لإعادة الجدولة التلقائية"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>إعادة جدولة طارئة (Dynamic Re-plan)</span>
            </button>

            <button
              onClick={handleGeneratePlan}
              disabled={isGenerating}
              className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/25 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : 'fill-slate-950'}`} />
              <span>{isGenerating ? 'جاري التحليل وتوليد الخطة بالذكاء الاصطناعي...' : 'توليد الخطة الذكية لليوم'}</span>
            </button>
          </div>
        </div>

        {/* Priority Focus & Resource Matcher Criteria */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          
          <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400 font-medium block">استراتيجية وأولوية العمل:</span>
            <select
              value={priorityFocus}
              onChange={(e) => setPriorityFocus(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-semibold focus:outline-none focus:border-amber-500"
            >
              <option value="توازن شامل وفك الانسدادات الحرجة">توازن شامل وفك الانسدادات الحرجة</option>
              <option value="التركيز على المطابق العميقة (> 4م) والكباش">التركيز على المطابق العميقة (&gt; 4م) والكباش</option>
              <option value="تسليك وتمليس خطوط الأقطار الكبيرة (نافورة 200 بار)">تسليك وتمليس خطوط الأقطار الكبيرة (نافورة 200 بار)</option>
              <option value="تقليل استهلاك الوقود وتجميع المسارات جغرافياً">تقليل استهلاك الوقود وتجميع المسارات جغرافياً</option>
            </select>
          </div>

          <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400 font-medium block">المعدات المتاحة للتوزيع:</span>
            <div className="flex items-center justify-between pt-1">
              <span className="text-amber-300 font-bold text-sm">{availableEquipment.length} آليات جاهزة</span>
              <span className="text-[11px] text-slate-500">2 نافورة | 1 كباش | 1 كسح</span>
            </div>
          </div>

          <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400 font-medium block">العمالة المتاحة للوردية:</span>
            <div className="flex items-center justify-between pt-1">
              <span className="text-emerald-300 font-bold text-sm">{presentWorkers.length} كادر ميداني</span>
              <span className="text-[11px] text-slate-500">سائقين وفنيين وعمال مدربين</span>
            </div>
          </div>

          <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400 font-medium block">المستهدف الحرج اليوم:</span>
            <div className="flex items-center justify-between pt-1">
              <span className="text-rose-300 font-bold text-sm">{criticalManholes.length} مطابق | {criticalLines.length} خطوط</span>
              <span className="text-[11px] text-rose-400/80 font-semibold">أولوية فائقة</span>
            </div>
          </div>

        </div>

      </div>

      {/* Incoming Mobile Incident Tickets Integration Strip */}
      {incidentTickets.some(t => t.status !== 'resolved') && (
        <div className="bg-gradient-to-r from-rose-950/40 via-slate-900 to-amber-950/30 border border-rose-500/40 rounded-2xl p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/40">
                <Smartphone className="w-4 h-4 animate-pulse" />
              </span>
              <h3 className="text-sm font-bold text-white">
                بلاغات طارئة واردة من الموبايل تتطلب توجيه فوري ضمن خطة العمل
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-rose-300 bg-rose-950 px-2 py-0.5 rounded-full border border-rose-500/30">
              {incidentTickets.filter(t => t.status !== 'resolved').length} بلاغات نشطة
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {incidentTickets.filter(t => t.status !== 'resolved').map((ticket) => (
              <div 
                key={ticket.id} 
                className="bg-slate-950/90 border border-slate-800 hover:border-amber-500/50 p-3 rounded-xl space-y-1.5 text-right transition-all"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-mono font-bold text-amber-400">{ticket.ticketNumber}</span>
                  <span className={`px-1.5 py-0.2 rounded-full font-bold ${
                    ticket.priority === 'critical' ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {ticket.priority === 'critical' ? '🚨 طارئ' : ticket.priority}
                  </span>
                </div>
                <div className="text-xs font-bold text-white truncate">{ticket.issueType}</div>
                <div className="text-[10px] text-slate-400 truncate">{ticket.location} ({ticket.targetManholeCode || 'بدون مطبق'})</div>
                
                <button
                  onClick={() => {
                    setPriorityFocus(`معالجة طوارئ البلاغ ${ticket.ticketNumber}: ${ticket.issueType} عند ${ticket.location}`);
                    handleGeneratePlan();
                  }}
                  className="w-full mt-1 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/30 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>تضمين هذا البلاغ في الخطة الذكية</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dynamic Contingency Modal */}
      {showIncidentModal && (
        <div 
          onClick={() => setShowIncidentModal(false)}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-scale-in cursor-default"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-rose-400 font-bold">
                <AlertTriangle className="w-5 h-5" />
                <span>محاكاة طارئ وإعادة جدولة آلية بالذكاء الاصطناعي</span>
              </div>
              <button onClick={() => setShowIncidentModal(false)} className="text-slate-400 hover:text-white font-bold text-lg cursor-pointer">×</button>
            </div>

            <p className="text-xs text-slate-300">
              في حال تعطلت معدة فجأة، أو حدث طفو مائي في خط تجميع، أو تغيب طاقم عمل؛ يقوم النظام بإعادة حساب المسار الأمثل وإعادة توزيع الفرق المتبقية فوراً.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-medium block mb-1">نوع الطارئ التشغيلي:</label>
                <select
                  value={incidentType}
                  onChange={(e) => setIncidentType(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-rose-500 font-semibold"
                >
                  <option value="equipment_breakdown">عطل مفاجئ في معدة رئيسية (مثل سيارة النافورة أو الكباش)</option>
                  <option value="crew_shortage">نقص مفاجئ في العمالة أو غياب سائق معدة</option>
                  <option value="emergency_blockage">سدد وارتداد مائي طارئ في مجمع رئيسي (طفح صرف)</option>
                  <option value="high_flow">ارتفاع شديد في منسوب المياه يعيق العمل العادي</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-medium block mb-1">تفاصيل البلاغ أو العطل:</label>
                <textarea
                  rows={3}
                  value={incidentDescription}
                  onChange={(e) => setIncidentDescription(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-rose-500 font-sans"
                  placeholder="اكتب وصفاً موجزاً للطارئ..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowIncidentModal(false)}
                className="bg-slate-800 hover:bg-slate-750 text-slate-300 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={handleExecuteReplan}
                disabled={isReplanning}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isReplanning ? 'جاري إعادة الجدولة التلقائية...' : 'تطبيق إعادة الجدولة فوراً'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contingency Replan Result Display (If active) */}
      {replanResult && (
        <div className="bg-rose-950/30 border border-rose-800/60 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-rose-900/50 pb-3">
            <div className="flex items-center gap-2 text-rose-300 font-black">
              <Radio className="w-4 h-4 text-rose-400 animate-ping" />
              <span>خطة الطوارئ التلقائية المحدثة (Contingency Action Plan)</span>
            </div>
            <span className="text-xs bg-rose-900/80 text-rose-200 px-2.5 py-0.5 rounded-full font-bold">
              استجابة فورية
            </span>
          </div>

          <div className="text-xs text-rose-100 space-y-2 leading-relaxed">
            <p className="font-bold text-sm text-white">{replanResult.actionSummary}</p>
            <p className="text-slate-300">{replanResult.contingencyDecision}</p>
          </div>

          {/* Reallocated crews */}
          {replanResult.reallocatedCrews && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {replanResult.reallocatedCrews.map((crew: any, idx: number) => (
                <div key={idx} className="bg-slate-900/90 border border-rose-900/60 rounded-xl p-3.5 text-xs space-y-1.5">
                  <div className="font-bold text-rose-300">{crew.crewName}</div>
                  <div className="text-slate-300">{crew.action}</div>
                  <div className="text-[11px] text-amber-300">
                    المهام المسندة: {crew.assignedTasks?.join(' ، ')}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Deferred and Mitigations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
              <span className="font-bold text-amber-400 block mb-1">المهام المؤجلة للوردية القادمة:</span>
              <ul className="list-disc list-inside text-slate-300 text-[11px] space-y-0.5">
                {replanResult.deferredTasks?.map((task: string, i: number) => (
                  <li key={i}>{task}</li>
                ))}
              </ul>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
              <span className="font-bold text-emerald-400 block mb-1">الإجراءات الفورية للاحتواء:</span>
              <ul className="list-disc list-inside text-slate-300 text-[11px] space-y-0.5">
                {replanResult.immediateMitigations?.map((mit: string, i: number) => (
                  <li key={i}>{mit}</li>
                ))}
              </ul>
            </div>
          </div>

        </div>
      )}

      {/* Main Plan Display */}
      {currentPlan && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          
          {/* Plan Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-950 text-emerald-300 border border-emerald-800/60 text-[11px] px-2.5 py-0.5 rounded-full font-bold">
                  خطة معتمدة هندسياً
                </span>
                <span className="text-xs text-slate-500 font-mono">كود الخطة: {currentPlan.planId}</span>
              </div>
              <h3 className="text-xl font-bold text-white mt-1">{currentPlan.planTitle}</h3>
              <p className="text-xs text-slate-300 mt-1 max-w-4xl leading-relaxed">{currentPlan.executiveSummary}</p>
            </div>

            <div className="flex items-center gap-3 self-start md:self-auto text-xs font-mono">
              <div className="bg-slate-850 border border-slate-800 px-3 py-2 rounded-xl text-center">
                <span className="text-slate-400 block text-[10px]">المطابق المستهدفة</span>
                <span className="font-black text-cyan-400 text-sm">{currentPlan.totalTargetManholes} مطبق</span>
              </div>
              <div className="bg-slate-850 border border-slate-800 px-3 py-2 rounded-xl text-center">
                <span className="text-slate-400 block text-[10px]">أمتار التمليس</span>
                <span className="font-black text-amber-400 text-sm">{currentPlan.totalTargetLinearMeters} م.ط</span>
              </div>
              <div className="bg-slate-850 border border-slate-800 px-3 py-2 rounded-xl text-center">
                <span className="text-slate-400 block text-[10px]">الزمن المقدر</span>
                <span className="font-black text-emerald-400 text-sm">{currentPlan.estimatedTotalHours || 7.5} س</span>
              </div>
            </div>
          </div>

          {/* Crews and Equipment Allocation Grid */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Truck className="w-4 h-4 text-amber-400" />
              <span>توزيع الفرق الميدانية وتخصيص الآليات (Crew & Equipment Dispatch)</span>
            </h4>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {currentPlan.crews.map((crew, idx) => (
                <div key={idx} className="bg-slate-850/90 border border-slate-750 hover:border-cyan-500/40 rounded-xl p-5 shadow-lg space-y-4 transition-all">
                  
                  {/* Crew Header */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center font-bold text-white text-xs">
                        {idx + 1}
                      </div>
                      <div>
                        <h5 className="font-bold text-sm text-white">{crew.crewName}</h5>
                        <span className="text-[11px] text-cyan-300 font-semibold">{crew.targetArea}</span>
                      </div>
                    </div>
                    <span className="text-[11px] bg-slate-900 border border-slate-700 text-slate-300 px-2.5 py-1 rounded-full font-mono">
                      {crew.estimatedDurationHours || 6} ساعات عمل
                    </span>
                  </div>

                  {/* Assigned Machinery */}
                  <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400 block">المعدة والآلية المسندة:</span>
                      <span className="font-bold text-amber-300 text-sm">{crew.assignedEquipment}</span>
                    </div>
                    <Truck className="w-5 h-5 text-amber-400 opacity-80" />
                  </div>

                  {/* Personnel Info */}
                  <div className="grid grid-cols-3 gap-2 text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                    <div>
                      <span className="text-[10px] text-slate-500 block">المشرف المسؤول:</span>
                      <span className="font-semibold text-white truncate block">{crew.supervisor}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">السائق/المشغل:</span>
                      <span className="font-semibold text-white truncate block">{crew.driver || 'طاقم السائقين'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">العمالة المساعدة:</span>
                      <span className="font-semibold text-emerald-400 block">{crew.laborersCount} عمال مدربين</span>
                    </div>
                  </div>

                  {/* Assigned Manholes & Lines Badges */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-slate-400 text-[11px] flex items-center gap-1 font-semibold">
                        <CircleDot className="w-3 h-3 text-cyan-400" />
                        المطابق ({crew.assignedManholeCodes.length}):
                      </span>
                      {crew.assignedManholeCodes.map(code => {
                        const mh = manholes.find(m => m.code === code);
                        return (
                          <span 
                            key={code} 
                            className="bg-slate-900 border border-slate-700 text-slate-200 px-2 py-0.5 rounded font-mono text-[11px]"
                            title={mh ? `عمق: ${mh.depth}م | قطر: ${mh.diameter}مم | ترسيب: ${mh.siltLevelPercent}%` : ''}
                          >
                            {code} {mh && `(${mh.depth}م)`}
                          </span>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-slate-400 text-[11px] flex items-center gap-1 font-semibold">
                        <GitCommit className="w-3 h-3 text-amber-400" />
                        الخطوط ({crew.assignedLineCodes.length}):
                      </span>
                      {crew.assignedLineCodes.map(code => {
                        const line = pipelines.find(l => l.code === code);
                        return (
                          <span 
                            key={code} 
                            className="bg-slate-900 border border-slate-700 text-slate-200 px-2 py-0.5 rounded font-mono text-[11px]"
                            title={line ? `طول: ${line.length}م | قطر: Ø${line.diameter}مم` : ''}
                          >
                            {code} {line && `(Ø${line.diameter})`}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step-by-Step Field Instructions */}
                  <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-xs space-y-1.5">
                    <span className="text-slate-400 font-bold block text-[11px]">تعليمات ومهام التنفيذ الميداني:</span>
                    <ul className="space-y-1 text-slate-300 text-[11px]">
                      {crew.specificTasks.map((task, tIdx) => (
                        <li key={tIdx} className="flex items-start gap-1.5">
                          <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                          <span>{task}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>
              ))}
            </div>
          </div>

          {/* Safety & Occupational Health Instructions */}
          <div className="bg-rose-950/20 border border-rose-900/50 rounded-xl p-5 space-y-2.5">
            <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
              <ShieldCheck className="w-5 h-5 text-rose-400" />
              <span>اشتراطات السلامة والصحة المهنية الإلزامية لدخول الأماكن المغلقة (Confined Space Entry)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-rose-200/90">
              {currentPlan.safetyInstructions.map((instruction, idx) => (
                <div key={idx} className="flex items-start gap-2 bg-slate-900/60 p-2.5 rounded-lg border border-rose-950">
                  <span className="w-4 h-4 rounded-full bg-rose-900/80 text-rose-300 flex items-center justify-center text-[10px] shrink-0 font-bold">
                    {idx + 1}
                  </span>
                  <span>{instruction}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Operational Notes */}
          {currentPlan.operationalNotes && currentPlan.operationalNotes.length > 0 && (
            <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1.5">
              <span className="text-amber-400 font-bold flex items-center gap-1.5">
                <Info className="w-4 h-4" />
                ملاحظات وتوجيهات الحركة الميدانية:
              </span>
              <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                {currentPlan.operationalNotes.map((note, idx) => (
                  <li key={idx}>{note}</li>
                ))}
              </ul>
            </div>
          )}

        </div>
      )}

      {/* Engineering Match Matrix Guide */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>مصفوفة التوافق الهندسي بين نوع العمل والمعدة المناسبة (Dispatch Logic)</span>
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right border-collapse">
            <thead>
              <tr className="bg-slate-850 text-slate-300 border-b border-slate-800">
                <th className="p-3 font-semibold">حالة ومواصفات العمل</th>
                <th className="p-3 font-semibold">الآلية الموصى بها</th>
                <th className="p-3 font-semibold">ضغط / قدرة التشغيل</th>
                <th className="p-3 font-semibold">العمالة المصاحبة</th>
                <th className="p-3 font-semibold">معدل الإنتاجية المعياري</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              <tr className="hover:bg-slate-850/50">
                <td className="p-3 font-medium text-white">مطابق عميقة (&gt; 3.5م) ورواسب أحجار وحمأة صلبة</td>
                <td className="p-3 text-amber-300 font-bold">كباش تطهير هيدروليكي (Grab Crane)</td>
                <td className="p-3 font-mono">حمولة 1.2 طن / عمق 12م</td>
                <td className="p-3">سائق ونش + 2 عمال مدربين</td>
                <td className="p-3 text-emerald-400 font-bold">8 - 12 مطبق / وردية</td>
              </tr>
              <tr className="hover:bg-slate-850/50">
                <td className="p-3 font-medium text-white">خطوط انحدار أقطار 250 - 800 مم مع دهون ورواسب</td>
                <td className="p-3 text-cyan-300 font-bold">سيارة نافورة ضغط عالي (Jetting 220 bar)</td>
                <td className="p-3 font-mono">180 - 220 بار / خزان 10م3</td>
                <td className="p-3">سائق + فني خراطيم + 2 عمال</td>
                <td className="p-3 text-emerald-400 font-bold">400 - 600 م.ط / وردية</td>
              </tr>
              <tr className="hover:bg-slate-850/50">
                <td className="p-3 font-medium text-white">تراكم مياه عكرة وحمأة سائلة في البيارات والمطابق</td>
                <td className="p-3 text-blue-300 font-bold">سيارة كسح وشفط هيدروليكي (Vacuum Tanker)</td>
                <td className="p-3 font-mono">خزان 12م3 / سحب تفريغي</td>
                <td className="p-3">سائق + 2 عمال كسح</td>
                <td className="p-3 text-emerald-400 font-bold">4 - 6 نقلات (48م3)</td>
              </tr>
              <tr className="hover:bg-slate-850/50">
                <td className="p-3 font-medium text-white">انسدادات متكلسة وشحوم صلبة وجذور أشجار</td>
                <td className="p-3 text-purple-300 font-bold">آلة تمليس وتسليك ميكانيكي (Rodding Winch)</td>
                <td className="p-3 font-mono">أسياخ صلب قطر 8-10مم</td>
                <td className="p-3">فني تمليس + 2 عمال</td>
                <td className="p-3 text-emerald-400 font-bold">200 - 300 م.ط / وردية</td>
              </tr>
              <tr className="hover:bg-slate-850/50">
                <td className="p-3 font-medium text-white">خطوط رئيسية بعد التمليس للتحقق وفحص الميول والشروخ</td>
                <td className="p-3 text-emerald-300 font-bold">روبوت فحص تلفزيوني (CCTV Crawler)</td>
                <td className="p-3 font-mono">كاميرا Pan/Tilt عالية الدقة</td>
                <td className="p-3">مهندس/أخصائي CCTV + فني كابل</td>
                <td className="p-3 text-emerald-400 font-bold">300 - 450 م.ط / وردية</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
