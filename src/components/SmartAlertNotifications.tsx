import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Flame, 
  X, 
  ChevronLeft, 
  Bell, 
  Sparkles, 
  Truck, 
  Volume2, 
  VolumeX,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { Manhole, Pipeline } from '../types/sewage';

export interface CriticalAlert {
  id: string;
  type: 'manhole' | 'pipeline';
  code: string;
  title: string;
  description: string;
  severity: 'critical' | 'emergency';
  metric: string; // e.g., 'ترسيب 85%' or 'انسداد 80%'
  recommendedEquipment: string;
  timestamp: string;
}

interface SmartAlertNotificationsProps {
  manholes: Manhole[];
  pipelines: Pipeline[];
  onNavigateToElement: (type: 'manhole' | 'pipeline', code: string) => void;
  onDispatchQuickAction: (alert: CriticalAlert) => void;
}

export const SmartAlertNotifications: React.FC<SmartAlertNotificationsProps> = ({
  manholes,
  pipelines,
  onNavigateToElement,
  onDispatchQuickAction
}) => {
  const [alerts, setAlerts] = useState<CriticalAlert[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showDrawer, setShowDrawer] = useState<boolean>(false);

  // Scan manholes and pipelines whenever they change and detect new critical statuses
  useEffect(() => {
    const detectedAlerts: CriticalAlert[] = [];

    // Scan critical manholes
    manholes.forEach(mh => {
      if (mh.status === 'critical' || mh.siltLevelPercent >= 75) {
        const isDeep = mh.depth >= 3.5;
        detectedAlerts.push({
          id: `alert-mh-${mh.id}-${mh.siltLevelPercent}`,
          type: 'manhole',
          code: mh.code,
          title: `إنذار حرج: مطبق ${mh.code}`,
          description: `ارتفاع منسوب الرواسب والحمأة إلى ${mh.siltLevelPercent}% في ${mh.location} (العمق: ${mh.depth}م).`,
          severity: mh.siltLevelPercent >= 80 ? 'emergency' : 'critical',
          metric: `ترسيب ${mh.siltLevelPercent}%`,
          recommendedEquipment: isDeep ? 'كباش تطهير (Grab) + سيارة كسح' : 'سيارة نافورة ضغط عالي',
          timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        });
      }
    });

    // Scan critical pipelines
    pipelines.forEach(pipe => {
      if (pipe.status === 'critical' || pipe.blockagePercent >= 70) {
        detectedAlerts.push({
          id: `alert-pipe-${pipe.id}-${pipe.blockagePercent}`,
          type: 'pipeline',
          code: pipe.code,
          title: `إنذار سدد حرج: خط ${pipe.code}`,
          description: `انسداد شديد بنسبة ${pipe.blockagePercent}% بين ${pipe.fromManholeCode} و ${pipe.toManholeCode} (قطر Ø${pipe.diameter}مم).`,
          severity: pipe.blockagePercent >= 80 ? 'emergency' : 'critical',
          metric: `انسداد ${pipe.blockagePercent}%`,
          recommendedEquipment: pipe.diameter >= 400 ? 'سيارة نافورة 220 بار' : 'نافورة دوارة + تسليك ميكانيكي',
          timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        });
      }
    });

    setAlerts(detectedAlerts);
  }, [manholes, pipelines]);

  // Audio tone generation for critical alerts using Web Audio API (no external asset needed)
  const playAlertSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.45);
    } catch {
      // Audio autoplay policy fallback
    }
  };

  const handleDismiss = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDismissedIds(prev => new Set(prev).add(id));
  };

  const activeAlerts = alerts.filter(a => !dismissedIds.has(a.id));

  // The latest active alert pops up as a high-visibility Toast
  const topToastAlert = activeAlerts[0];

  return (
    <>
      {/* 1. Floating Immediate Toast Alert (Top-Left / Center for instant awareness) */}
      {topToastAlert && (
        <div className="fixed top-20 left-4 sm:left-8 z-50 max-w-md w-full animate-bounce-short no-print">
          <div className={`p-4 rounded-2xl shadow-2xl border backdrop-blur-md transition-all ${
            topToastAlert.severity === 'emergency' 
              ? 'bg-rose-950/95 border-rose-500 text-rose-100 shadow-rose-950/80 ring-2 ring-rose-500/50' 
              : 'bg-slate-900/95 border-amber-500/80 text-amber-100 shadow-amber-950/60'
          }`}>
            <div className="flex items-start justify-between gap-3">
              
              <div className="flex items-start gap-2.5">
                <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                  topToastAlert.severity === 'emergency' 
                    ? 'bg-rose-900 text-rose-300 animate-pulse' 
                    : 'bg-amber-900/80 text-amber-300'
                }`}>
                  <AlertTriangle className="w-5 h-5" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-white">{topToastAlert.title}</span>
                    <span className="text-[10px] bg-rose-900/80 border border-rose-700/80 px-2 py-0.2 rounded-full font-bold text-rose-200">
                      {topToastAlert.metric}
                    </span>
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed">
                    {topToastAlert.description}
                  </p>

                  <div className="pt-1 flex items-center gap-1.5 text-[11px] text-amber-300 font-medium">
                    <Truck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>المعدة المطلوبة فوراً: {topToastAlert.recommendedEquipment}</span>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button 
                onClick={(e) => handleDismiss(topToastAlert.id, e)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                title="إغلاق التنبيه"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Actions Row */}
            <div className="mt-3 pt-2.5 border-t border-rose-900/40 flex items-center justify-between gap-2 text-xs">
              <span className="text-[10px] text-slate-400 font-mono">
                وقت الرصد: {topToastAlert.timestamp}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onNavigateToElement(topToastAlert.type, topToastAlert.code);
                    handleDismiss(topToastAlert.id);
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>معاينة في الخريطة</span>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => {
                    onDispatchQuickAction(topToastAlert);
                    handleDismiss(topToastAlert.id);
                  }}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 shadow-md cursor-pointer transition-all"
                >
                  <Sparkles className="w-3 h-3 fill-white" />
                  <span>توجيه معدة فوراً</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 2. Persistent Alert Center Bell Indicator in Bottom Corner */}
      <div className="fixed bottom-6 left-6 z-40 no-print flex items-center gap-2">
        <button
          onClick={() => setShowDrawer(!showDrawer)}
          className={`relative p-3.5 rounded-2xl shadow-2xl border transition-all cursor-pointer flex items-center gap-2 ${
            activeAlerts.length > 0 
              ? 'bg-rose-950 text-rose-300 border-rose-600 shadow-rose-950/60 ring-2 ring-rose-500/40 hover:bg-rose-900' 
              : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
          }`}
          title="مركز البلاغات والتنبيهات الحرجة"
        >
          <Bell className={`w-5 h-5 ${activeAlerts.length > 0 ? 'animate-bounce' : ''}`} />
          {activeAlerts.length > 0 && (
            <span className="font-bold text-xs">
              {activeAlerts.length} بلاغ حرج
            </span>
          )}

          {activeAlerts.length > 0 && (
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-500 animate-ping" />
          )}
        </button>

        {/* Audio Mute/Unmute */}
        <button
          onClick={() => {
            setSoundEnabled(!soundEnabled);
            if (!soundEnabled) playAlertSound();
          }}
          className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title={soundEnabled ? 'كتم صوت الإشعارات' : 'تفعيل نغمة التنبيهات'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>

      {/* 3. Alerts History Drawer Panel */}
      {showDrawer && (
        <div className="fixed inset-y-0 left-0 z-50 max-w-md w-full bg-slate-900/95 backdrop-blur-md border-r border-slate-700 p-6 shadow-2xl flex flex-col justify-between overflow-y-auto no-print">
          <div className="space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                <h3 className="font-black text-base text-white">مركز التنبيهات الحرجة النشطة</h3>
              </div>
              <button 
                onClick={() => setShowDrawer(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              قائمة البلاغات الميدانية التي تتجاوز نسبة الانسداد أو الترسيب فيها 75% وتستوجب تدخلاً عاجلاً بواسطة أسطول النافورة أو الكباش.
            </p>

            <div className="space-y-2.5 max-h-[70vh] overflow-y-auto pr-1">
              {activeAlerts.map(alert => (
                <div 
                  key={alert.id}
                  className="bg-slate-850 p-3.5 rounded-xl border border-slate-700/80 hover:border-rose-500/50 transition-all space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white font-mono">{alert.code}</span>
                    <span className="bg-rose-950 text-rose-300 text-[10px] px-2 py-0.5 rounded font-bold">
                      {alert.metric}
                    </span>
                  </div>

                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {alert.description}
                  </p>

                  <div className="text-[11px] text-amber-300 font-medium">
                    الآلية المقترحة: {alert.recommendedEquipment}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <span className="text-[10px] text-slate-500 font-mono">{alert.timestamp}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          onNavigateToElement(alert.type, alert.code);
                          setShowDrawer(false);
                        }}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded text-[11px] cursor-pointer"
                      >
                        عرض
                      </button>
                      <button
                        onClick={() => {
                          onDispatchQuickAction(alert);
                          setShowDrawer(false);
                        }}
                        className="bg-rose-600 hover:bg-rose-500 text-white px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer"
                      >
                        توجيه
                      </button>
                      <button
                        onClick={() => handleDismiss(alert.id)}
                        className="text-slate-500 hover:text-slate-300 px-1.5 py-1"
                        title="تجاهل"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {activeAlerts.length === 0 && (
                <div className="text-center py-12 text-slate-400 text-xs">
                  لا توجد أي بلاغات حرجة حالياً. كافة الخطوط والمطابق تعمل ضمن الحدود الآمنة.
                </div>
              )}
            </div>

          </div>

          <div className="pt-4 border-t border-slate-800">
            <button
              onClick={() => {
                setDismissedIds(new Set(alerts.map(a => a.id)));
                setShowDrawer(false);
              }}
              className="w-full bg-slate-800 hover:bg-slate-750 text-slate-300 py-2 rounded-xl text-xs font-semibold cursor-pointer"
            >
              تأكيد وقراءة كافة التنبيهات
            </button>
          </div>

        </div>
      )}
    </>
  );
};
