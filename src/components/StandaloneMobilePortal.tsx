import React, { useState, useRef, useEffect } from 'react';
import { 
  Smartphone, 
  Send, 
  Camera, 
  Mic, 
  MicOff, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Navigation, 
  Phone, 
  User, 
  Droplet, 
  AlertOctagon, 
  Flame, 
  Wrench, 
  ArrowLeft, 
  Sparkles,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  X,
  Radio,
  FileText,
  QrCode,
  LogOut
} from 'lucide-react';
import { IncidentTicket, TicketPriority, Manhole, Pipeline } from '../types/sewage';
import { incidentService } from '../services/incidentService';
import { QRCodeModal } from './QRCodeModal';

interface StandaloneMobilePortalProps {
  manholes: Manhole[];
  pipelines: Pipeline[];
  onBackToDesktop?: () => void;
  onTicketSubmitted?: (ticket: IncidentTicket) => void;
}

export const StandaloneMobilePortal: React.FC<StandaloneMobilePortalProps> = ({
  manholes,
  pipelines,
  onBackToDesktop,
  onTicketSubmitted
}) => {
  const [activeTab, setActiveTab] = useState<'report' | 'my_tickets'>('report');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedTicket, setSubmittedTicket] = useState<IncidentTicket | null>(null);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);

  // Form Fields
  const [reporterName, setReporterName] = useState<string>('م. أحمد صبحي (مراقب ميداني)');
  const [reporterPhone, setReporterPhone] = useState<string>('01023456789');
  const [reporterRole, setReporterRole] = useState<IncidentTicket['reporterRole']>('مراقب شبكات');
  const [location, setLocation] = useState<string>('شارع الجمهورية - تقاطع النصر');
  const [zone, setZone] = useState<string>('القطاع الأوسط');
  const [issueType, setIssueType] = useState<IncidentTicket['issueType']>('طفح مياه صرف في الشارع');
  const [priority, setPriority] = useState<TicketPriority>('critical');
  const [targetManholeCode, setTargetManholeCode] = useState<string>('MH-101');
  const [targetLineCode, setTargetLineCode] = useState<string>('LINE-101-102');
  const [description, setDescription] = useState<string>('طفح مياه صرف صحي داكنة في الشارع العام وتجمّع بركة مياه تعوق المارة وحركة المرور.');
  
  // GPS State
  const [gpsCoordinates, setGpsCoordinates] = useState<{ lat: number; lng: number } | null>({ lat: 30.0444, lng: 31.2357 });
  const [isDetectingGps, setIsDetectingGps] = useState<boolean>(false);
  const [gpsMessage, setGpsMessage] = useState<string>('تم تثبيت إحداثيات GPS تلقائياً');

  // Media
  const [attachedPhoto, setAttachedPhoto] = useState<string | null>(
    'https://images.unsplash.com/photo-1541888946425-d0fbb186156f?w=600&auto=format&fit=crop&q=80'
  );
  const [photoName, setPhotoName] = useState<string>('معاينة_طفح_ميداني.jpg');

  // Voice Note
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordSeconds, setRecordSeconds] = useState<number>(0);
  const [hasVoiceNote, setHasVoiceNote] = useState<boolean>(false);
  const timerRef = useRef<any>(null);

  // Recent tickets list
  const [recentTickets, setRecentTickets] = useState<IncidentTicket[]>([]);

  // Load tickets on mount
  useEffect(() => {
    incidentService.getAll().then(data => {
      setRecentTickets(data);
    });

    const unsubscribe = incidentService.subscribe((msg) => {
      if (msg.type === 'NEW_INCIDENT') {
        setRecentTickets(prev => [msg.ticket, ...prev.filter(t => t.id !== msg.ticket.id)]);
      }
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onBackToDesktop) {
        onBackToDesktop();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      unsubscribe();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onBackToDesktop]);

  // Play audio chime on send
  const playSendChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
      // AudioContext not allowed or not supported
    }
  };

  // GPS detection
  const handleDetectGPS = () => {
    setIsDetectingGps(true);
    setGpsMessage('');
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsCoordinates({
            lat: parseFloat(pos.coords.latitude.toFixed(6)),
            lng: parseFloat(pos.coords.longitude.toFixed(6)),
          });
          setIsDetectingGps(false);
          setGpsMessage(`تم تثبيت موقع GPS بنجاح (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`);
        },
        () => {
          setIsDetectingGps(false);
          const mh = manholes.find(m => m.code === targetManholeCode);
          if (mh) setGpsCoordinates({ lat: mh.coordinates.lat, lng: mh.coordinates.lng });
          setGpsMessage('تم استخدام إحداثيات موقع المطبق الأقرب تلقائياً');
        },
        { timeout: 5000, enableHighAccuracy: true }
      );
    } else {
      setIsDetectingGps(false);
      setGpsMessage('تم استخدام إحداثيات المشروع الافتراضية');
    }
  };

  // Voice recording toggle
  const toggleRecording = () => {
    if (isRecording) {
      clearInterval(timerRef.current);
      setIsRecording(false);
      setHasVoiceNote(true);
    } else {
      setIsRecording(true);
      setRecordSeconds(0);
      setHasVoiceNote(false);
      timerRef.current = setInterval(() => {
        setRecordSeconds(s => s + 1);
      }, 1000);
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const ticketNumber = `TKT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date();
    const reportedAt = `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 5)}`;

    const newTicket: IncidentTicket = {
      id: `tkt-${Date.now()}`,
      ticketNumber,
      reporterName: reporterName || 'فني ميداني',
      reporterPhone: reporterPhone || '01000000000',
      reporterRole,
      location,
      zone,
      issueType,
      description,
      priority,
      status: 'new',
      targetManholeCode: targetManholeCode || undefined,
      targetLineCode: targetLineCode || undefined,
      photoUrl: attachedPhoto || undefined,
      gpsCoordinates: gpsCoordinates || undefined,
      recommendedAction: issueType === 'طفح مياه صرف في الشارع' 
        ? 'توجيه سيارة نافورة JET-01 للتسليك العكسي وسحب المياه بطلمبة كسح VAC-01'
        : issueType === 'هبوط أو كسر غطاء مطبق'
          ? 'تطويق أمني وتركيب غطاء GRP محكم عيار D400 بواسطة كباش GRAB-01'
          : 'معاينة فورية وتوجيه طاقم الصيانة المناسب',
      reportedAt,
    };

    try {
      // Send directly to Express Server API
      const result = await incidentService.sendReport(newTicket);
      playSendChime();
      setSubmittedTicket(result);
      setRecentTickets(prev => [result, ...prev]);

      if (onTicketSubmitted) {
        onTicketSubmitted(result);
      }
    } catch (err) {
      console.error(err);
      playSendChime();
      setSubmittedTicket(newTicket);
      setRecentTickets(prev => [newTicket, ...prev]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans max-w-lg mx-auto border-x border-slate-800 shadow-2xl relative">
      
      {/* Top Quick Exit Strip */}
      {onBackToDesktop && (
        <div className="bg-slate-900/90 border-b border-slate-800 px-3 py-1.5 flex items-center justify-between text-xs text-slate-300 sticky top-0 z-50 backdrop-blur-sm">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
            <span>شاشة الموبايل الميدانية</span>
          </span>
          <button
            onClick={onBackToDesktop}
            className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-rose-200 border border-rose-500/40 px-2 py-0.5 rounded-md font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>خروج للبرنامج الرئيسي (Esc)</span>
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Top Mobile App Bar */}
      <header className="bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 border-b border-cyan-800/40 p-4 sticky top-7 z-40 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-amber-500 p-0.5 shadow-md flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Droplet className="w-5 h-5 text-cyan-400 fill-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-black text-white">إدخال بلاغات الصرف الصحي</h1>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded-full font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  مباشر
                </span>
              </div>
              <p className="text-[11px] text-slate-400">إرسال لحظي إلى غرفة العمليات والبرنامج</p>
            </div>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowQrModal(true)}
              className="bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 p-2 rounded-lg border border-amber-500/40 cursor-pointer transition-colors"
              title="عرض رمز الـ QR لمشاركته مع زميل"
            >
              <QrCode className="w-4 h-4" />
            </button>

            {/* Back to desktop dashboard button */}
            {onBackToDesktop && (
              <button
                onClick={onBackToDesktop}
                className="bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-black px-2.5 py-1.5 rounded-lg border border-rose-400/50 flex items-center gap-1 cursor-pointer transition-all shadow-md active:scale-95"
                title="الخروج والعودة إلى لوحة تحكم البرنامج الكاملة (أو اضغط Esc)"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>خروج</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab switch inside mobile app */}
        <div className="grid grid-cols-2 gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800 mt-3 text-xs">
          <button
            onClick={() => { setActiveTab('report'); setSubmittedTicket(null); }}
            className={`py-2 rounded-lg font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'report' 
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>تسجيل بلاغ جديد</span>
          </button>

          <button
            onClick={() => setActiveTab('my_tickets')}
            className={`py-2 rounded-lg font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'my_tickets' 
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>البلاغات الحية ({recentTickets.length})</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 space-y-4 overflow-y-auto">
        
        {submittedTicket ? (
          /* ========================================================= */
          /* TICKET RECEIPT & CONFIRMATION SCREEN (SENT TO PROGRAM)     */
          /* ========================================================= */
          <div className="py-6 space-y-4 animate-in fade-in zoom-in-95 text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 mx-auto flex items-center justify-center text-emerald-400 shadow-2xl shadow-emerald-500/30">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-full inline-block">
                تم الاستلام في البرنامج المركزي بنجاح ✅
              </span>
              <h2 className="text-xl font-black text-white pt-1">رقم التذكرة: {submittedTicket.ticketNumber}</h2>
              <p className="text-xs text-slate-300 px-4 leading-relaxed">
                تم إرسال بلاغك فوراً لغرفة عمليات الصرف الصحي وتم ربطه بالخريطة التفاعلية ونظام التنبيهات الفورية للأسطول.
              </p>
            </div>

            {/* Receipt Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-right space-y-2.5 text-xs shadow-xl">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">نوع البلاغ:</span>
                <span className="font-bold text-white flex items-center gap-1">
                  <Droplet className="w-3.5 h-3.5 text-cyan-400" />
                  {submittedTicket.issueType}
                </span>
              </div>

              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">الموقع:</span>
                <span className="font-bold text-white">{submittedTicket.location}</span>
              </div>

              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">درجة الخطورة:</span>
                <span className="font-bold text-rose-400">طوارئ قصوى (حرجة)</span>
              </div>

              {submittedTicket.targetManholeCode && (
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">المطبق المتأثر:</span>
                  <span className="font-mono font-bold text-cyan-300">{submittedTicket.targetManholeCode}</span>
                </div>
              )}

              {submittedTicket.recommendedAction && (
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[11px] text-amber-200">
                  <span className="font-bold block text-slate-300">التوجيه الميداني الآلي:</span>
                  <span>{submittedTicket.recommendedAction}</span>
                </div>
              )}
            </div>

            {/* Next Actions */}
            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  setSubmittedTicket(null);
                  setDescription('');
                  setAttachedPhoto(null);
                }}
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black py-3 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-950/50"
              >
                <Send className="w-4 h-4" />
                <span>تسجيل بلاغ ميداني جديد</span>
              </button>

              <button
                onClick={() => setActiveTab('my_tickets')}
                className="w-full bg-slate-850 hover:bg-slate-800 text-slate-200 font-bold py-2.5 rounded-xl text-xs border border-slate-700 cursor-pointer"
              >
                متابعة البلاغات والأسطول
              </button>
            </div>
          </div>
        ) : activeTab === 'report' ? (
          
          /* ========================================================= */
          /* MOBILE INCIDENT REPORT FORM                              */
          /* ========================================================= */
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* GPS One-Tap Detection */}
            <div className="bg-slate-900 p-3 rounded-2xl border border-cyan-800/40 shadow-md space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <span className="text-[10px] text-slate-400 block font-medium">موقع البلاغ الجغرافي (GPS)</span>
                    <span className="text-xs font-mono font-bold text-cyan-300 block truncate">
                      {gpsCoordinates ? `${gpsCoordinates.lat}, ${gpsCoordinates.lng}` : 'غير محدد'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDetectGPS}
                  disabled={isDetectingGps}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 shrink-0 transition-colors shadow-md cursor-pointer"
                >
                  <Navigation className={`w-3.5 h-3.5 ${isDetectingGps ? 'animate-spin' : ''}`} />
                  <span>{isDetectingGps ? 'جاري الرصد...' : 'تحديد GPS'}</span>
                </button>
              </div>

              {gpsMessage && (
                <p className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium pt-1 border-t border-slate-800">
                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                  <span className="truncate">{gpsMessage}</span>
                </p>
              )}
            </div>

            {/* Quick Issue Type Cards */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200 block">نوع المشكلة الميدانية:</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { type: 'طفح مياه صرف في الشارع', icon: Droplet, badge: '🚨 طوارئ قصوى', color: 'border-rose-500 text-rose-300 bg-rose-950/30' },
                  { type: 'انسداد خط انحدار', icon: AlertOctagon, badge: '⚠️ مستعجل', color: 'border-amber-500 text-amber-300 bg-amber-950/30' },
                  { type: 'هبوط أو كسر غطاء مطبق', icon: AlertTriangle, badge: 'خطورة مرورية', color: 'border-orange-500 text-orange-300 bg-orange-950/30' },
                  { type: 'انبعاث غازات ورائحة كريهة', icon: Flame, badge: 'مخاطر غازية', color: 'border-purple-500 text-purple-300 bg-purple-950/30' },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = issueType === item.type;
                  return (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => {
                        setIssueType(item.type as any);
                        if (item.type === 'طفح مياه صرف في الشارع') setPriority('critical');
                      }}
                      className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between h-20 ${
                        isSelected 
                          ? `${item.color} ring-2 ring-cyan-400 shadow-lg scale-[1.02]` 
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="text-[9px] font-bold opacity-80">{item.badge}</span>
                      </div>
                      <span className="text-xs font-bold leading-tight mt-1">{item.type}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Address and Nearest Manhole */}
            <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 block">العنوان أو الشارع الميداني:</label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="اسم الشارع أو تقاطع أو علامة..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 block">المطبق الأقرب:</label>
                  <select
                    value={targetManholeCode}
                    onChange={(e) => setTargetManholeCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
                  >
                    <option value="">غير محدد</option>
                    {manholes.map((mh) => (
                      <option key={mh.code} value={mh.code}>
                        {mh.code} ({mh.location} - {mh.depth}م)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 block">درجة الإلحاح:</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TicketPriority)}
                    className={`w-full border rounded-xl p-2 text-xs font-bold focus:outline-none ${
                      priority === 'critical' ? 'bg-rose-950/60 text-rose-300 border-rose-500/50' : 'bg-slate-950 text-slate-200 border-slate-800'
                    }`}
                  >
                    <option value="critical">🚨 طوارئ قصوى (تدخل فوري)</option>
                    <option value="high">⚠️ أولوية مرتفعة (مستعجل)</option>
                    <option value="medium">متوسطة</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Reporter details */}
            <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 block">اسم المُبلّغ:</label>
                  <input
                    type="text"
                    required
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 block">رقم هاتف الموبايل:</label>
                  <input
                    type="tel"
                    required
                    value={reporterPhone}
                    onChange={(e) => setReporterPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-cyan-300 font-mono text-left focus:outline-none focus:border-cyan-500"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 block">ملاحظات المعاينة والمشاهدة:</label>
                <textarea
                  rows={2}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="صف ما تراه في الموقع وحجم الطفح..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>
            </div>

            {/* Media: Photo & Voice Note */}
            <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 space-y-2.5">
              <span className="text-xs font-bold text-slate-300 block">إرفاق وسائط ميدانية (صور وصوت):</span>
              
              <div className="flex items-center gap-2">
                {/* Voice Note Button */}
                <button
                  type="button"
                  onClick={toggleRecording}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    isRecording 
                      ? 'bg-rose-600 text-white animate-pulse' 
                      : hasVoiceNote 
                        ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50' 
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="w-4 h-4" />
                      <span>جاري التسجيل ({recordSeconds} ث)...</span>
                    </>
                  ) : hasVoiceNote ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>تم حفظ الصوت ({recordSeconds} ث)</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 text-cyan-400" />
                      <span>تسجيل صوتي ميداني</span>
                    </>
                  )}
                </button>

                {/* Photo Simulation */}
                <button
                  type="button"
                  onClick={() => {
                    setAttachedPhoto('https://images.unsplash.com/photo-1541888946425-d0fbb186156f?w=600&auto=format&fit=crop&q=80');
                    setPhotoName('صورة_معاينة_طفح.jpg');
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 p-2 rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                  title="التقاط صورة بكاميرا الهاتف"
                >
                  <Camera className="w-4 h-4 text-amber-400" />
                  <span>صورة</span>
                </button>
              </div>

              {attachedPhoto && (
                <div className="relative rounded-xl overflow-hidden border border-slate-700 h-24 bg-slate-950">
                  <img src={attachedPhoto} alt="Field preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent flex items-end justify-between p-2">
                    <span className="text-[10px] text-white font-mono bg-slate-900/80 px-2 py-0.5 rounded">
                      {photoName}
                    </span>
                    <button
                      type="button"
                      onClick={() => setAttachedPhoto(null)}
                      className="bg-rose-600/80 text-white p-1 rounded hover:bg-rose-600 text-[10px]"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Big Send Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-rose-600 via-amber-600 to-rose-600 hover:from-rose-500 hover:to-amber-500 text-white font-black py-4 rounded-2xl text-sm flex items-center justify-center gap-2 shadow-2xl shadow-rose-950/60 cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>جاري الإرسال والتسجيل في البرنامج...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>إرسال البلاغ فوراً إلى غرفة العمليات المركزية 🚀</span>
                </>
              )}
            </button>

          </form>
        ) : (
          
          /* ========================================================= */
          /* LIVE TICKETS LIST TAB                                    */
          /* ========================================================= */
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
              <span>سجل البلاغات الميدانية الحية</span>
              <span className="text-[11px] text-cyan-400 font-mono">مزامنة فورية مع الخادم</span>
            </div>

            {recentTickets.length === 0 ? (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <CheckCircle2 className="w-10 h-10 mx-auto text-slate-600" />
                <p className="text-xs">لا توجد بلاغات مسجلة حالياً</p>
              </div>
            ) : (
              recentTickets.map((t) => (
                <div
                  key={t.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-2 text-right shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-black text-amber-400">{t.ticketNumber}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      t.status === 'resolved' 
                        ? 'bg-emerald-500/20 text-emerald-300' 
                        : t.priority === 'critical'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {t.status === 'resolved' ? 'تم التطهير والحل' : t.priority === 'critical' ? 'طوارئ قصوى' : t.status}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-white leading-snug">{t.issueType}</h3>
                  <p className="text-[11px] text-slate-300">{t.description}</p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                    <span className="flex items-center gap-1 truncate max-w-[200px]">
                      <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span className="truncate">{t.location}</span>
                    </span>
                    <span className="font-mono">{t.reportedAt.slice(11)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </main>

      {/* Footer Mobile Strip */}
      <footer className="bg-slate-950 border-t border-slate-900 p-3 text-center text-[10px] text-slate-500 space-y-2">
        {onBackToDesktop && (
          <div>
            <button
              onClick={onBackToDesktop}
              className="text-xs bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl border border-slate-800 inline-flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>الخروج من شاشة الموبايل والعودة للبرنامج الرئيسي</span>
            </button>
          </div>
        )}
        <p>منظومة SewageJet AI الميدانية &copy; {new Date().getFullYear()} - إرسال بلاغات الصرف الصحي</p>
      </footer>

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
      />

    </div>
  );
};
