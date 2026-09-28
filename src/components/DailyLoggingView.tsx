import React, { useState, useEffect } from 'react';
import { 
  ClipboardCheck, 
  Plus, 
  CircleDot, 
  GitCommit, 
  Truck, 
  Clock, 
  Fuel, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  ShieldCheck, 
  Calendar,
  Layers,
  ChevronDown,
  Trash2
} from 'lucide-react';
import { Equipment, FieldLogEntry, Manhole, Pipeline } from '../types/sewage';

interface DailyLoggingViewProps {
  fieldLogs: FieldLogEntry[];
  manholes: Manhole[];
  pipelines: Pipeline[];
  equipment: Equipment[];
  onAddLogEntry: (entry: FieldLogEntry) => void;
  onUpdateManholeStatus: (code: string, depth: number) => void;
  onUpdatePipelineStatus: (code: string, flushedMeters: number) => void;
}

export const DailyLoggingView: React.FC<DailyLoggingViewProps> = ({
  fieldLogs,
  manholes,
  pipelines,
  equipment,
  onAddLogEntry,
  onUpdateManholeStatus,
  onUpdatePipelineStatus
}) => {
  const [showLogModal, setShowLogModal] = useState(false);

  useEffect(() => {
    if (!showLogModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowLogModal(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showLogModal]);
  const [selectedShift, setSelectedShift] = useState<'صباحي' | 'مسائي' | 'ليلي'>('صباحي');
  const [crewName, setCrewName] = useState('فرقة التمليس الهيدروليكي (1)');
  const [equipmentCode, setEquipmentCode] = useState(equipment[0]?.code || 'JET-01');
  const [runningHours, setRunningHours] = useState(6.0);
  const [dieselConsumed, setDieselConsumed] = useState(35);
  const [supervisorName, setSupervisorName] = useState('م. حسام الدين عبد العزيز');
  const [issuesText, setIssuesText] = useState('');

  // Selected work targets
  const [selectedManholeCode, setSelectedManholeCode] = useState(manholes[0]?.code || 'MH-101');
  const [siltRemovedM3, setSiltRemovedM3] = useState(1.2);
  const [gasReading, setGasReading] = useState('H2S: 0 ppm, CO: 0 ppm, O2: 20.9%');

  const [selectedLineCode, setSelectedLineCode] = useState(pipelines[0]?.code || 'LINE-101-102');
  const [flushedMeters, setFlushedMeters] = useState(65);
  const [jettingPressureBar, setJettingPressureBar] = useState(180);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedMh = manholes.find(m => m.code === selectedManholeCode);
    const selectedLine = pipelines.find(p => p.code === selectedLineCode);

    const newLog: FieldLogEntry = {
      id: `log-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      shift: selectedShift,
      crewName,
      equipmentCode,
      cleanedManholes: [
        {
          manholeCode: selectedManholeCode,
          actualDepth: selectedMh?.depth || 2.5,
          siltRemovedM3: Number(siltRemovedM3) || 1.0,
          gasReading,
        },
      ],
      flushedLines: [
        {
          lineCode: selectedLineCode,
          flushedLengthMeters: Number(flushedMeters) || 50,
          jettingPressureBar: Number(jettingPressureBar) || 180,
          resultCondition: 'تم التمليس بنجاح والخط يعمل بكامل كفاءته',
        },
      ],
      equipmentRunningHours: Number(runningHours) || 6,
      dieselConsumedLiters: Number(dieselConsumed) || 30,
      issuesEncountered: issuesText ? [issuesText] : ['لا توجد معوقات، تم الالتزام باشتراطات السلامة المهنية.'],
      supervisorName,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    };

    onAddLogEntry(newLog);

    // Update statuses of the manhole and pipeline
    if (selectedManholeCode) {
      onUpdateManholeStatus(selectedManholeCode, selectedMh?.depth || 2.5);
    }
    if (selectedLineCode) {
      onUpdatePipelineStatus(selectedLineCode, Number(flushedMeters) || 50);
    }

    setShowLogModal(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <ClipboardCheck className="w-4 h-4" />
              </span>
              <h2 className="text-xl font-black text-white">تسجيل الإنجاز الفعلي واليوميات الميدانية (Daily Work Logs)</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              توثيق الأعمال المنجزة فعلياً بنهاية كل وردية: عدد المطابق المطهرة حسب العمق، أمتار الخطوط المُمَلَّسة حسب القطر، وساعات تشغيل المعدات والأعطال.
            </p>
          </div>

          <button
            onClick={() => setShowLogModal(true)}
            className="bg-cyan-600 hover:bg-cyan-700 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-900/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>تسجيل إنجاز وردية جديد</span>
          </button>
        </div>
      </div>

      {/* Field Logs List */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-400" />
          <span>سجل اليوميات الميدانية المعتمدة ({fieldLogs.length} سجلات)</span>
        </h3>

        <div className="space-y-3">
          {fieldLogs.map((log) => (
            <div key={log.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              
              {/* Log Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-amber-400 text-xs bg-slate-800 px-2.5 py-1 rounded border border-slate-700">
                    {log.date} | الوردية: {log.shift}
                  </span>
                  <span className="text-sm font-bold text-white">{log.crewName}</span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                  <span className="flex items-center gap-1 text-cyan-300">
                    <Truck className="w-3.5 h-3.5" />
                    المعدة: {log.equipmentCode}
                  </span>
                  <span className="flex items-center gap-1 text-amber-300">
                    <Clock className="w-3.5 h-3.5" />
                    {log.equipmentRunningHours} س.تشغيل
                  </span>
                  <span className="flex items-center gap-1 text-slate-300">
                    <Fuel className="w-3.5 h-3.5" />
                    {log.dieselConsumedLiters} لتر سولار
                  </span>
                </div>
              </div>

              {/* Cleaned Manholes Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                
                {/* Manholes */}
                <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-cyan-300 font-bold border-b border-slate-800 pb-1.5">
                    <span className="flex items-center gap-1.5">
                      <CircleDot className="w-3.5 h-3.5" />
                      المطابق المطهرة ({log.cleanedManholes.length}):
                    </span>
                    <span className="text-[10px] text-slate-400">حسب العمق والغازات</span>
                  </div>

                  {log.cleanedManholes.map((mh, mIdx) => (
                    <div key={mIdx} className="space-y-1 bg-slate-900/60 p-2 rounded-lg border border-slate-800 font-mono text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{mh.manholeCode}</span>
                        <span className="text-emerald-400">عمق فعلي: {mh.actualDepth}م</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-400 text-[10px]">
                        <span>رواسب مستخرجة: {mh.siltRemovedM3} م³</span>
                        <span className="text-cyan-400">{mh.gasReading}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Flushed Lines */}
                <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-amber-300 font-bold border-b border-slate-800 pb-1.5">
                    <span className="flex items-center gap-1.5">
                      <GitCommit className="w-3.5 h-3.5" />
                      الخطوط المُمَلَّسة ({log.flushedLines.length}):
                    </span>
                    <span className="text-[10px] text-slate-400">حسب الطول والضغط</span>
                  </div>

                  {log.flushedLines.map((line, lIdx) => (
                    <div key={lIdx} className="space-y-1 bg-slate-900/60 p-2 rounded-lg border border-slate-800 font-mono text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{line.lineCode}</span>
                        <span className="text-amber-400 font-bold">{line.flushedLengthMeters} م.ط</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-400 text-[10px]">
                        <span>ضغط النافورة: {line.jettingPressureBar} بار</span>
                        <span className="text-emerald-300 truncate max-w-[160px]">{line.resultCondition}</span>
                      </div>
                    </div>
                  ))}

                  {log.flushedLines.length === 0 && (
                    <div className="text-[11px] text-slate-500 py-2">
                      تم الاقتصار على تطهير المطابق بالكباش في هذه الوردية.
                    </div>
                  )}
                </div>

              </div>

              {/* Notes & Supervisor Signature */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs pt-1 border-t border-slate-800 text-slate-400">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="text-slate-300">المعوقات/الملاحظات: {log.issuesEncountered.join(' ، ')}</span>
                </div>
                <div className="text-slate-400 text-[11px] font-medium font-sans">
                  اعتماد مهندس التشغيل: <span className="text-white font-bold">{log.supervisorName}</span>
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>

      {/* Log Modal */}
      {showLogModal && (
        <div 
          onClick={() => setShowLogModal(false)}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto cursor-default"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-cyan-400" />
                <span>تسجيل محضر إنجاز وردية عمل ميدانية</span>
              </h3>
              <button onClick={() => setShowLogModal(false)} className="text-slate-400 hover:text-white font-bold text-lg cursor-pointer">×</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-medium block mb-1">فترة الوردية</label>
                  <select
                    value={selectedShift}
                    onChange={(e) => setSelectedShift(e.target.value as any)}
                    className="w-full bg-slate-850 border border-slate-700 rounded-lg p-2.5 text-white font-semibold"
                  >
                    <option value="صباحي">صباحي (08:00 - 15:00)</option>
                    <option value="مسائي">مسائي (15:00 - 22:00)</option>
                    <option value="ليلي">ليلي / طوارئ (22:00 - 06:00)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 font-medium block mb-1">المعدة المستخدمة</label>
                  <select
                    value={equipmentCode}
                    onChange={(e) => setEquipmentCode(e.target.value)}
                    className="w-full bg-slate-850 border border-slate-700 rounded-lg p-2.5 text-white font-mono font-bold"
                  >
                    {equipment.map(e => (
                      <option key={e.id} value={e.code}>{e.code} - {e.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Manhole Section */}
              <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-cyan-300 block">إنجاز تطهير المطبق:</span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">المطبق المطهر</label>
                    <select
                      value={selectedManholeCode}
                      onChange={(e) => setSelectedManholeCode(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                    >
                      {manholes.map(m => (
                        <option key={m.id} value={m.code}>{m.code} (عمق {m.depth}م)</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">كمية الرواسب المستخرجة (م³)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={siltRemovedM3}
                      onChange={(e) => setSiltRemovedM3(parseFloat(e.target.value) || 1)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">قراءة أجهزة الغازات</label>
                    <input
                      type="text"
                      value={gasReading}
                      onChange={(e) => setGasReading(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono text-[10px]"
                    />
                  </div>
                </div>
              </div>

              {/* Pipeline Section */}
              <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-amber-300 block">إنجاز تمليس خط الانحدار:</span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">الخط المُمَلَّس</label>
                    <select
                      value={selectedLineCode}
                      onChange={(e) => setSelectedLineCode(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                    >
                      {pipelines.map(p => (
                        <option key={p.id} value={p.code}>{p.code} (طول {p.length}م)</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">طول التمليس الفعلي (م.ط)</label>
                    <input
                      type="number"
                      value={flushedMeters}
                      onChange={(e) => setFlushedMeters(parseInt(e.target.value) || 50)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">ضغط النافورة المستخدم (بار)</label>
                    <input
                      type="number"
                      value={jettingPressureBar}
                      onChange={(e) => setJettingPressureBar(parseInt(e.target.value) || 180)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Machinery Performance */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-medium block mb-1">ساعات تشغيل المعدة الفعلية</label>
                  <input
                    type="number"
                    step="0.5"
                    value={runningHours}
                    onChange={(e) => setRunningHours(parseFloat(e.target.value) || 6)}
                    className="w-full bg-slate-850 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-medium block mb-1">استهلاك السولار (لتر)</label>
                  <input
                    type="number"
                    value={dieselConsumed}
                    onChange={(e) => setDieselConsumed(parseInt(e.target.value) || 30)}
                    className="w-full bg-slate-850 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-medium block mb-1">المعوقات الميدانية أو الأعطال إن وجدت</label>
                <textarea
                  rows={2}
                  value={issuesText}
                  onChange={(e) => setIssuesText(e.target.value)}
                  className="w-full bg-slate-850 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500 font-sans"
                  placeholder="مثال: مطبق مغطى بطبقة أسفلت، كسر في ماسورة، ازدحام مروري..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="bg-slate-800 hover:bg-slate-750 text-slate-300 px-4 py-2 rounded-xl font-semibold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-cyan-600 hover:bg-cyan-700 text-slate-950 font-bold px-5 py-2 rounded-xl cursor-pointer"
                >
                  اعتماد وحفظ اليومية الميدانية
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
