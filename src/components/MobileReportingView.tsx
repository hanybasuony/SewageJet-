import React, { useState, useRef } from 'react';
import { 
  Smartphone, 
  Send, 
  Camera, 
  Mic, 
  MicOff,
  MapPin, 
  AlertTriangle, 
  Phone, 
  User, 
  CheckCircle2, 
  Clock, 
  Share2, 
  QrCode, 
  Image as ImageIcon, 
  Trash2, 
  Wrench, 
  Droplet,
  Flame,
  AlertOctagon,
  Eye,
  Sliders,
  Sparkles,
  ExternalLink,
  ChevronDown,
  Navigation,
  RefreshCw,
  X
} from 'lucide-react';
import { IncidentTicket, TicketPriority, TicketStatus, Manhole, Pipeline, Equipment } from '../types/sewage';
import { QRCodeModal } from './QRCodeModal';

interface MobileReportingViewProps {
  tickets: IncidentTicket[];
  manholes: Manhole[];
  pipelines: Pipeline[];
  equipment: Equipment[];
  onAddTicket: (ticket: IncidentTicket) => void;
  onUpdateTicketStatus: (id: string, newStatus: TicketStatus, assignedEquipment?: string, assignedCrew?: string) => void;
  onDeleteTicket: (id: string) => void;
  onNavigateToMap: (targetManhole?: string) => void;
  onNavigateToDispatcher: () => void;
  onOpenStandaloneMobile?: () => void;
}

export const MobileReportingView: React.FC<MobileReportingViewProps> = ({
  tickets,
  manholes,
  pipelines,
  equipment,
  onAddTicket,
  onUpdateTicketStatus,
  onDeleteTicket,
  onNavigateToMap,
  onNavigateToDispatcher,
  onOpenStandaloneMobile
}) => {
  // Simulator View Mode: 'simulator' (phone mockup) or 'supervisor' (expanded view)
  const [viewMode, setViewMode] = useState<'simulator' | 'supervisor'>('simulator');
  const [activeTab, setActiveTab] = useState<'new_report' | 'tickets_list'>('new_report');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Show QR Code modal
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Form State
  const [reporterName, setReporterName] = useState<string>('م. محمود سامي (مراقب ميداني)');
  const [reporterPhone, setReporterPhone] = useState<string>('01012345678');
  const [reporterRole, setReporterRole] = useState<IncidentTicket['reporterRole']>('مراقب شبكات');
  const [location, setLocation] = useState<string>('شارع الجمهورية - أمام الغرفة التجارية');
  const [zone, setZone] = useState<string>('القطاع الأوسط');
  const [issueType, setIssueType] = useState<IncidentTicket['issueType']>('طفح مياه صرف في الشارع');
  const [priority, setPriority] = useState<TicketPriority>('critical');
  const [targetManholeCode, setTargetManholeCode] = useState<string>('MH-102');
  const [targetLineCode, setTargetLineCode] = useState<string>('LINE-102-103');
  const [description, setDescription] = useState<string>('طفح مياه حاد وارتفاع المنسوب بالمطبق نتيجة ترسبات دهنية وكتل صلبة، مع إعاقة لحركة المارة والمركبات.');
  const [gpsCoordinates, setGpsCoordinates] = useState<{ lat: number; lng: number } | null>({ lat: 30.0450, lng: 31.2365 });
  const [isDetectingGps, setIsDetectingGps] = useState<boolean>(false);
  const [gpsSuccessMsg, setGpsSuccessMsg] = useState<string>('تم تحديد موقع GPS الميداني بدقة (± 4 متر)');

  // Voice note simulation
  const [isRecordingVoice, setIsRecordingVoice] = useState<boolean>(false);
  const [voiceSeconds, setVoiceSeconds] = useState<number>(0);
  const [hasVoiceNote, setHasVoiceNote] = useState<boolean>(false);
  const voiceTimerRef = useRef<any>(null);

  // Photo simulation
  const [attachedPhoto, setAttachedPhoto] = useState<string | null>(
    'https://images.unsplash.com/photo-1541888946425-d0fbb186156f?w=600&auto=format&fit=crop&q=80'
  );
  const [photoPreviewName, setPhotoPreviewName] = useState<string>('معاينة_طفح_ميداني_01.jpg');

  // Submit confirmation state
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState<boolean>(false);
  const [lastSubmittedTicketNumber, setLastSubmittedTicketNumber] = useState<string>('');

  // Handle GPS detection
  const handleDetectGPS = () => {
    setIsDetectingGps(true);
    setGpsSuccessMsg('');
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsCoordinates({
            lat: parseFloat(position.coords.latitude.toFixed(6)),
            lng: parseFloat(position.coords.longitude.toFixed(6))
          });
          setIsDetectingGps(false);
          setGpsSuccessMsg(`تم تثبيت إحداثيات GPS الميدانية بنجاح (${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)})`);
        },
        (error) => {
          // Fallback simulation based on selected manhole
          const mh = manholes.find(m => m.code === targetManholeCode);
          if (mh) {
            setGpsCoordinates({ lat: mh.coordinates.lat, lng: mh.coordinates.lng });
          } else {
            setGpsCoordinates({ lat: 30.0455, lng: 31.2370 });
          }
          setIsDetectingGps(false);
          setGpsSuccessMsg('تم استخدام إحداثيات المطبق الأقرب تلقائياً عبر الشبكة');
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setIsDetectingGps(false);
      setGpsCoordinates({ lat: 30.0455, lng: 31.2370 });
      setGpsSuccessMsg('تم استخدام إحداثيات موقع المشروع الافتراضية');
    }
  };

  // Voice note recorder toggle
  const toggleVoiceRecording = () => {
    if (isRecordingVoice) {
      clearInterval(voiceTimerRef.current);
      setIsRecordingVoice(false);
      setHasVoiceNote(true);
    } else {
      setIsRecordingVoice(true);
      setVoiceSeconds(0);
      setHasVoiceNote(false);
      voiceTimerRef.current = setInterval(() => {
        setVoiceSeconds(prev => prev + 1);
      }, 1000);
    }
  };

  const handlePhotoSelect = (sampleType: 'overflow' | 'broken_cover' | 'pipeline') => {
    if (sampleType === 'overflow') {
      setAttachedPhoto('https://images.unsplash.com/photo-1541888946425-d0fbb186156f?w=600&auto=format&fit=crop&q=80');
      setPhotoPreviewName('صورة_طفح_مياه_شارع.jpg');
    } else if (sampleType === 'broken_cover') {
      setAttachedPhoto('https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=600&auto=format&fit=crop&q=80');
      setPhotoPreviewName('صورة_كسر_غطاء_مطبق.jpg');
    } else {
      setAttachedPhoto('https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=600&auto=format&fit=crop&q=80');
      setPhotoPreviewName('صورة_ترسبات_خط_انحدار.jpg');
    }
  };

  // Copy app mobile link
  const handleCopyLink = () => {
    const mobileUrl = `${window.location.origin}${window.location.pathname}?view=mobile`;
    navigator.clipboard.writeText(mobileUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    });
  };

  // Auto recommend action based on issue
  const getAutoRecommendation = (issue: IncidentTicket['issueType'], mhCode?: string) => {
    switch (issue) {
      case 'طفح مياه صرف في الشارع':
        return 'إرسال سيارة نافورة ضغط عالي JET-01 للتسليك العكسي وسحب المياه السطحية بطلمبة كسح VAC-01';
      case 'انسداد خط انحدار':
        return 'تسليك هيدروليكي بضغط 180 بار مع فحص بكاميرا CCTV-01 لتحديد نقطة الانسداد الدقيقة';
      case 'هبوط أو كسر غطاء مطبق':
        return 'تطويق أمني فوري وتجهيز ونش أو كباش GRAB-01 لتغيير الإطار وتركيب غطاء GRP حمولة D400';
      case 'انبعاث غازات ورائحة كريهة':
        return 'تهوية المطبق بجهاز شفط الغازات وفحص تركيز H2S مع تطهير الرواسب العضوية الراكدة';
      case 'تراكم مياه أمطار / سيول':
        return 'توجيه طلمبات شفط متنقلة وتطهير شنايش الأمطار المرتبطة بالمطبق';
      default:
        return 'معاينة ميدانية فورية وتوجيه الطاقم المختص';
    }
  };

  // Handle Form Submission
  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();

    const ticketNumber = `TKT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date();
    const reportedAt = `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 5)}`;

    const newTicket: IncidentTicket = {
      id: `tkt-${Date.now()}`,
      ticketNumber,
      reporterName: reporterName || 'فني صيانة ميداني',
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
      recommendedAction: getAutoRecommendation(issueType, targetManholeCode),
      reportedAt,
    };

    onAddTicket(newTicket);
    setLastSubmittedTicketNumber(ticketNumber);
    setIsSubmittedSuccess(true);

    // Reset some fields for next report
    setTimeout(() => {
      setDescription('');
      setAttachedPhoto(null);
      setHasVoiceNote(false);
    }, 500);
  };

  // Filtered tickets
  const filteredTickets = tickets.filter(t => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'critical') return t.priority === 'critical';
    return t.status === filterStatus;
  });

  const activeTicketsCount = tickets.filter(t => t.status !== 'resolved').length;
  const criticalTicketsCount = tickets.filter(t => t.priority === 'critical' && t.status !== 'resolved').length;

  return (
    <div className="space-y-6">
      
      {/* Top Banner and Overview */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <Smartphone className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-black text-white">
                بوابة إدخال البلاغات اليومية من الهاتف المحمول (Mobile Field Reports)
              </h2>
              <span className="text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                ربط فوري بالشبكة
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-3xl leading-relaxed">
              تتيح هذه البوابة للمراقبين الميدانيين، سائقي سيارات النافورة والكباش، ومسؤولي الخط الساخن (125) إرسال بلاغات الطوارئ فوراً من هواتفهم الذكية مع التقاط إحداثيات GPS، الصور الحية، والتسجيل الصوتي. يتم ربط البلاغ فوراً بالخريطة الحرارية وتنبيه غرفة العمليات لتوجيه المعدات المناسبة.
            </p>
          </div>

          {/* Quick Controls */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* View Mode Switcher */}
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1">
              <button
                onClick={() => setViewMode('simulator')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'simulator' 
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>محاكي شاشة الهاتف</span>
              </button>

              <button
                onClick={() => setViewMode('supervisor')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'supervisor' 
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>شاشة المشرف الموسعة</span>
              </button>
            </div>

            {onOpenStandaloneMobile && (
              <button
                onClick={onOpenStandaloneMobile}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-emerald-950/40"
                title="فتح واجهة تطبيق الهاتف الميدانية المستقلة"
              >
                <Smartphone className="w-4 h-4 text-emerald-200" />
                <span>شاشة الموبايل المستقلة الكاملة</span>
              </button>
            )}

            {/* QR Code / Direct Phone Link */}
            <button
              onClick={() => setShowQrModal(true)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
              title="مسح رمز QR لفتح النظام على هاتفك الفعلي مباشرة"
            >
              <QrCode className="w-4 h-4 text-amber-400" />
              <span>فتح على هاتفي (QR)</span>
            </button>

            {/* Copy Link */}
            <button
              onClick={handleCopyLink}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-cyan-400" />
              <span>{copiedLink ? 'تم نسخ الرابط!' : 'مشاركة الرابط'}</span>
            </button>
          </div>
        </div>

        {/* Quick Live Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800 text-xs">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px]">إجمالي بلاغات اليوم</span>
            <span className="text-base font-black text-white">{tickets.length} بلاغ</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px]">بلاغات نشطة ومفتوحة</span>
            <span className="text-base font-black text-amber-400">{activeTicketsCount} مفتوح</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px]">حالات طوارئ قصوى (حرجة)</span>
            <span className="text-base font-black text-rose-400 flex items-center gap-1">
              <Flame className="w-4 h-4" />
              {criticalTicketsCount} طارئ
            </span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px]">تم التطهير والمعالجة</span>
            <span className="text-base font-black text-emerald-400">
              {tickets.filter(t => t.status === 'resolved').length} منجز
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Phone Simulator or Form */}
        <div className={`${viewMode === 'simulator' ? 'lg:col-span-6 flex justify-center' : 'lg:col-span-7'}`}>
          
          {viewMode === 'simulator' ? (
            /* ============================================================== */
            /* SMARTPHONE FRAME CONTAINER (IPHONE / ANDROID MOCKUP SIMULATOR) */
            /* ============================================================== */
            <div className="w-full max-w-[390px] bg-slate-950 rounded-[48px] p-3 shadow-2xl border-[5px] border-slate-700/80 ring-1 ring-cyan-500/20 relative">
              
              {/* Speaker / Notch */}
              <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-900 rounded-full z-30 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-slate-950/80 mr-3 border border-slate-800" />
                <div className="w-10 h-1 bg-slate-800 rounded-full" />
              </div>

              {/* Phone Inner Screen */}
              <div className="bg-slate-900 rounded-[38px] overflow-hidden border border-slate-800 text-slate-100 flex flex-col h-[750px] relative">
                
                {/* Mobile Status Bar */}
                <div className="px-6 pt-3 pb-2 flex items-center justify-between text-[11px] text-slate-400 font-mono select-none z-20">
                  <span>9:41</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-cyan-400">5G</span>
                    <div className="w-4 h-2 rounded-sm border border-slate-400 flex items-center p-0.5">
                      <div className="w-2.5 h-full bg-emerald-400 rounded-2xs" />
                    </div>
                  </div>
                </div>

                {/* Mobile App Header */}
                <div className="bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 px-4 py-3 border-b border-cyan-800/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center">
                      <Droplet className="w-4 h-4 text-cyan-400 fill-cyan-400" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-white">SewageJet Mobile</h3>
                      <p className="text-[9px] text-cyan-300 font-medium">بوابة البلاغات الميدانية السريعة</p>
                    </div>
                  </div>

                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full flex items-center gap-1 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    متصل بالشبكة
                  </span>
                </div>

                {/* Mobile Tabs */}
                <div className="grid grid-cols-2 bg-slate-950 p-1 border-b border-slate-800 text-xs">
                  <button
                    onClick={() => { setActiveTab('new_report'); setIsSubmittedSuccess(false); }}
                    className={`py-1.5 rounded-md font-bold text-center cursor-pointer transition-all ${
                      activeTab === 'new_report' 
                        ? 'bg-cyan-600 text-white shadow-sm' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    تسجيل بلاغ جديد
                  </button>
                  <button
                    onClick={() => setActiveTab('tickets_list')}
                    className={`py-1.5 rounded-md font-bold text-center cursor-pointer transition-all flex items-center justify-center gap-1 ${
                      activeTab === 'tickets_list' 
                        ? 'bg-cyan-600 text-white shadow-sm' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>البلاغات اليومية</span>
                    <span className="text-[10px] bg-slate-800 px-1.5 py-0.2 rounded-full font-bold">
                      {tickets.length}
                    </span>
                  </button>
                </div>

                {/* Mobile Screen Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                  
                  {isSubmittedSuccess ? (
                    /* Submission Success Screen inside Mobile */
                    <div className="py-8 text-center space-y-4 animate-in fade-in zoom-in-95">
                      <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 mx-auto flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/20">
                        <CheckCircle2 className="w-9 h-9" />
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-base font-black text-white">تم إرسال البلاغ بنجاح!</h4>
                        <p className="text-xs text-emerald-400 font-mono font-bold">{lastSubmittedTicketNumber}</p>
                        <p className="text-xs text-slate-300 px-3 leading-relaxed">
                          تم ربط البلاغ فوراً بالخريطة التفاعلية والخريطة الحرارية وتنبيه غرفة توجيه المعدات والأسطول.
                        </p>
                      </div>

                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-right space-y-2">
                        <div className="flex justify-between text-slate-400 text-[11px]">
                          <span>نوع البلاغ:</span>
                          <span className="text-slate-200 font-bold">{issueType}</span>
                        </div>
                        <div className="flex justify-between text-slate-400 text-[11px]">
                          <span>الموقع:</span>
                          <span className="text-slate-200 font-bold">{location}</span>
                        </div>
                        <div className="flex justify-between text-slate-400 text-[11px]">
                          <span>الأولوية:</span>
                          <span className="text-rose-400 font-bold">طوارئ قصوى (حرجة)</span>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2">
                        <button
                          onClick={() => { setIsSubmittedSuccess(false); }}
                          className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-900/40"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>إرسال بلاغ ميداني آخر</span>
                        </button>

                        <button
                          onClick={() => { setActiveTab('tickets_list'); setIsSubmittedSuccess(false); }}
                          className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2 rounded-xl text-xs cursor-pointer"
                        >
                          عرض قائمة كافة البلاغات
                        </button>
                      </div>
                    </div>
                  ) : activeTab === 'new_report' ? (
                    
                    /* New Incident Form */
                    <form onSubmit={handleSubmitReport} className="space-y-3.5">
                      
                      {/* GPS Button */}
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-cyan-800/40 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                          <div className="truncate">
                            <span className="text-[10px] text-slate-400 block">إحداثيات GPS الميدانية</span>
                            <span className="text-xs font-mono font-bold text-cyan-300 truncate block">
                              {gpsCoordinates ? `${gpsCoordinates.lat}, ${gpsCoordinates.lng}` : 'غير محدد بعد'}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleDetectGPS}
                          disabled={isDetectingGps}
                          className="bg-cyan-600/30 hover:bg-cyan-600 text-cyan-200 hover:text-white border border-cyan-500/50 text-[10px] font-bold px-2.5 py-1.5 rounded-lg shrink-0 flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Navigation className={`w-3 h-3 ${isDetectingGps ? 'animate-spin' : ''}`} />
                          <span>{isDetectingGps ? 'جاري الرصد...' : 'تحديد GPS'}</span>
                        </button>
                      </div>

                      {gpsSuccessMsg && (
                        <p className="text-[10px] text-emerald-400 font-medium px-1 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{gpsSuccessMsg}</span>
                        </p>
                      )}

                      {/* Issue Type Selector */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-300 block">نوع المشكلة / البلاغ:</label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {[
                            { type: 'طفح مياه صرف في الشارع', icon: Droplet, color: 'border-rose-500/50 text-rose-300 bg-rose-500/10' },
                            { type: 'انسداد خط انحدار', icon: AlertOctagon, color: 'border-amber-500/50 text-amber-300 bg-amber-500/10' },
                            { type: 'هبوط أو كسر غطاء مطبق', icon: AlertTriangle, color: 'border-orange-500/50 text-orange-300 bg-orange-500/10' },
                            { type: 'انبعاث غازات ورائحة كريهة', icon: Flame, color: 'border-purple-500/50 text-purple-300 bg-purple-500/10' },
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
                                className={`p-2 rounded-xl border text-right text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                                  isSelected 
                                    ? `${item.color} ring-2 ring-cyan-400 font-black shadow-md` 
                                    : 'border-slate-800 bg-slate-950/70 text-slate-400 hover:text-white'
                                }`}
                              >
                                <Icon className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">{item.type}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Location and Zone */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-300 block">عنوان وموقع البلاغ:</label>
                        <input
                          type="text"
                          required
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="الشارع، تقاطع، علامة مميزة..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      {/* Linked Manhole and Line Selection */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-300 block">المطبق الأقرب:</label>
                          <select
                            value={targetManholeCode}
                            onChange={(e) => setTargetManholeCode(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
                          >
                            <option value="">بدون تحديد</option>
                            {manholes.map((mh) => (
                              <option key={mh.code} value={mh.code}>
                                {mh.code} ({mh.location} - {mh.depth}م)
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-300 block">درجة الإلحاح:</label>
                          <select
                            value={priority}
                            onChange={(e) => setPriority(e.target.value as TicketPriority)}
                            className={`w-full border rounded-xl px-2 py-1.5 text-xs font-bold focus:outline-none ${
                              priority === 'critical' 
                                ? 'bg-rose-950/40 text-rose-300 border-rose-500/50' 
                                : priority === 'high' 
                                  ? 'bg-amber-950/40 text-amber-300 border-amber-500/50' 
                                  : 'bg-slate-950 text-slate-200 border-slate-800'
                            }`}
                          >
                            <option value="critical">طوارئ قصوى (حرجة)</option>
                            <option value="high">مرتفعة (مستعجل)</option>
                            <option value="medium">متوسطة</option>
                            <option value="low">اعتيادية</option>
                          </select>
                        </div>
                      </div>

                      {/* Reporter Info */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-300 block">اسم المُبلّغ:</label>
                          <input
                            type="text"
                            required
                            value={reporterName}
                            onChange={(e) => setReporterName(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-300 block">رقم هاتف الموبايل:</label>
                          <input
                            type="tel"
                            required
                            value={reporterPhone}
                            onChange={(e) => setReporterPhone(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500 text-left"
                            dir="ltr"
                          />
                        </div>
                      </div>

                      {/* Description */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-300 block">تفاصيل المعاينة والمشاهدة:</label>
                        <textarea
                          rows={2}
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="وصف المشكلة وحجم الطفح..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 resize-none"
                        />
                      </div>

                      {/* Media: Photo & Voice Note */}
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 block">إرفاق وسائط ميدانية (صور / تسجيل صوتي):</span>
                        
                        <div className="flex items-center gap-2">
                          {/* Voice Note Button */}
                          <button
                            type="button"
                            onClick={toggleVoiceRecording}
                            className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                              isRecordingVoice 
                                ? 'bg-rose-600 text-white animate-pulse' 
                                : hasVoiceNote 
                                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50' 
                                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            {isRecordingVoice ? (
                              <>
                                <MicOff className="w-3 h-3" />
                                <span>جاري التسجيل ({voiceSeconds} ث)</span>
                              </>
                            ) : hasVoiceNote ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                <span>تم حفظ الصوت ({voiceSeconds} ث)</span>
                              </>
                            ) : (
                              <>
                                <Mic className="w-3 h-3 text-cyan-400" />
                                <span>تسجيل صوتي ميداني</span>
                              </>
                            )}
                          </button>

                          {/* Photo Samples */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handlePhotoSelect('overflow')}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] flex items-center gap-1 cursor-pointer"
                              title="إرفاق صورة طفح مياه"
                            >
                              <Camera className="w-3.5 h-3.5 text-amber-400" />
                            </button>
                            {attachedPhoto && (
                              <button
                                type="button"
                                onClick={() => setAttachedPhoto(null)}
                                className="p-1.5 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 text-[10px]"
                                title="إلغاء الصورة"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {attachedPhoto && (
                          <div className="relative rounded-lg overflow-hidden border border-slate-700 h-20 bg-slate-900">
                            <img src={attachedPhoto} alt="Field preview" className="w-full h-full object-cover" />
                            <span className="absolute bottom-1 right-1 bg-slate-950/80 text-[9px] text-white px-1.5 py-0.5 rounded font-mono">
                              {photoPreviewName}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-rose-600 via-amber-600 to-rose-600 hover:from-rose-500 hover:to-amber-500 text-white font-black py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-950/50 cursor-pointer transition-all active:scale-[0.98]"
                      >
                        <Send className="w-4 h-4" />
                        <span>إرسال البلاغ وتنبيه الأسطول والعمليات</span>
                      </button>

                    </form>
                  ) : (
                    
                    /* Mini Tickets List inside Mobile */
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pb-1">
                        <span>سجل بلاغات اليوم ({filteredTickets.length})</span>
                        <span className="text-[10px] text-cyan-400">تحديث لحظي</span>
                      </div>

                      {filteredTickets.map((t) => (
                        <div 
                          key={t.id}
                          className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-2 text-right"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono font-bold text-amber-400">{t.ticketNumber}</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                              t.priority === 'critical' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-slate-800 text-slate-300'
                            }`}>
                              {t.priority === 'critical' ? 'طوارئ قصوى' : t.priority}
                            </span>
                          </div>

                          <div className="text-xs font-bold text-white leading-tight">
                            {t.issueType}
                          </div>

                          <div className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                            <span className="truncate">{t.location}</span>
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-slate-900 text-[10px]">
                            <span className="text-slate-500">{t.reportedAt.slice(11)}</span>
                            <span className={`font-semibold ${
                              t.status === 'resolved' ? 'text-emerald-400' : t.status === 'in_progress' ? 'text-cyan-400' : 'text-amber-400'
                            }`}>
                              {t.status === 'resolved' ? 'تم التطهير' : t.status === 'in_progress' ? 'قيد العمل' : 'جديد'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                </div>

                {/* Mobile Bottom Navigation Bar */}
                <div className="bg-slate-950 border-t border-slate-800 px-6 py-2.5 flex items-center justify-between text-slate-400 text-[10px]">
                  <button 
                    onClick={() => { setActiveTab('new_report'); setIsSubmittedSuccess(false); }}
                    className={`flex flex-col items-center gap-0.5 cursor-pointer ${activeTab === 'new_report' ? 'text-cyan-400 font-bold' : ''}`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>إرسال</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('tickets_list')}
                    className={`flex flex-col items-center gap-0.5 cursor-pointer ${activeTab === 'tickets_list' ? 'text-cyan-400 font-bold' : ''}`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>السجل</span>
                  </button>
                  <button 
                    onClick={() => onNavigateToMap(targetManholeCode)}
                    className="flex flex-col items-center gap-0.5 cursor-pointer hover:text-cyan-400"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>الخريطة</span>
                  </button>
                </div>

                {/* Home Indicator */}
                <div className="pb-1 pt-1 bg-slate-950 flex justify-center">
                  <div className="w-24 h-1 bg-slate-700 rounded-full" />
                </div>

              </div>

            </div>
          ) : (
            /* ============================================================== */
            /* EXPANDED SUPERVISOR FORM (FOR DESKTOP / TABLET WORKFLOW) */
            /* ============================================================== */
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    <AlertTriangle className="w-4 h-4" />
                  </span>
                  <h3 className="text-base font-bold text-white">نموذج إدخال بلاغ ميداني طارئ</h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">وضع العمليات الميدانية</span>
              </div>

              <form onSubmit={handleSubmitReport} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Issue Type */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 block">تصنيف البلاغ الفني:</label>
                    <select
                      value={issueType}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setIssueType(val);
                        if (val === 'طفح مياه صرف في الشارع') setPriority('critical');
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold focus:outline-none focus:border-cyan-500"
                    >
                      <option value="طفح مياه صرف في الشارع">طفح مياه صرف في الشارع (Sewage Overflow)</option>
                      <option value="انسداد خط انحدار">انسداد خط انحدار وتراجع الجريان (Pipeline Blockage)</option>
                      <option value="هبوط أو كسر غطاء مطبق">هبوط أو كسر غطاء مطبق (Cover Broken/Displaced)</option>
                      <option value="انبعاث غازات ورائحة كريهة">انبعاث غازات ورائحة كريهة (Gas/Odor Hazard)</option>
                      <option value="تراكم مياه أمطار / سيول">تراكم مياه أمطار وسيول (Stormwater Ponding)</option>
                    </select>
                  </div>

                  {/* Priority */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 block">درجة الإلحاح والأولوية:</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as TicketPriority)}
                      className={`w-full border rounded-xl p-2.5 text-xs font-black focus:outline-none ${
                        priority === 'critical' ? 'bg-rose-950/40 text-rose-300 border-rose-500/50' : 'bg-slate-950 text-slate-200 border-slate-800'
                      }`}
                    >
                      <option value="critical">🚨 طوارئ قصوى (حرجة - تدخل فوري)</option>
                      <option value="high">⚠️ أولوية مرتفعة (مستعجل خلال ساعتين)</option>
                      <option value="medium">⚡ أولوية متوسطة (وردية اليوم)</option>
                      <option value="low">اعتيادية</option>
                    </select>
                  </div>

                  {/* Location Address */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 block">الموقع الميداني الدقيق:</label>
                    <input
                      type="text"
                      required
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="اسم الشارع والحي ونقطة العلام..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  {/* Zone */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 block">القطاع / الحي:</label>
                    <select
                      value={zone}
                      onChange={(e) => setZone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="القطاع الأوسط">القطاع الأوسط</option>
                      <option value="حي الزهور">حي الزهور</option>
                      <option value="المنطقة الصناعية">المنطقة الصناعية</option>
                      <option value="حي السلام">حي السلام</option>
                      <option value="قطاع شرق">قطاع شرق</option>
                    </select>
                  </div>

                  {/* Manhole & Line Link */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 block">المطبق المرتبط (إن وجد):</label>
                    <select
                      value={targetManholeCode}
                      onChange={(e) => setTargetManholeCode(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
                    >
                      <option value="">غير محدد</option>
                      {manholes.map((mh) => (
                        <option key={mh.code} value={mh.code}>
                          {mh.code} - {mh.location} (عمق {mh.depth}م - قطر {mh.diameter}مم)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Reporter Role */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 block">صفة مقدم البلاغ:</label>
                    <select
                      value={reporterRole}
                      onChange={(e) => setReporterRole(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="مراقب شبكات">مراقب شبكات ميداني</option>
                      <option value="فني ميداني">فني تشغيل وصيانة</option>
                      <option value="مواطن / خط ساخن 125">مواطن / خط ساخن 125</option>
                      <option value="غرفة العمليات المركزية">غرفة العمليات المركزية</option>
                    </select>
                  </div>

                  {/* Reporter Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 block">اسم المُبلّغ:</label>
                    <input
                      type="text"
                      required
                      value={reporterName}
                      onChange={(e) => setReporterName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 block">رقم الهاتف:</label>
                    <input
                      type="tel"
                      required
                      value={reporterPhone}
                      onChange={(e) => setReporterPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-cyan-300 font-mono text-left focus:outline-none focus:border-cyan-500"
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* GPS Row */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-cyan-400" />
                    <div>
                      <span className="text-xs text-slate-400 block">إحداثيات GPS المسجلة:</span>
                      <span className="text-xs font-mono font-bold text-cyan-300">
                        {gpsCoordinates ? `${gpsCoordinates.lat}, ${gpsCoordinates.lng}` : 'لم يتم التحديد بعد'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleDetectGPS}
                    disabled={isDetectingGps}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Navigation className={`w-3.5 h-3.5 ${isDetectingGps ? 'animate-spin' : ''}`} />
                    <span>{isDetectingGps ? 'جاري الرصد...' : 'تثبيت إحداثيات GPS'}</span>
                  </button>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">وصف الحالة الميدانية والمشاهدات:</label>
                  <textarea
                    rows={3}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-cyan-600 via-blue-600 to-amber-600 hover:from-cyan-500 hover:to-amber-500 text-white font-black py-3 rounded-xl text-sm flex items-center justify-center gap-2 shadow-xl shadow-cyan-950/50 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>تسجيل البلاغ وربطه الفوري بالخريطة والأسطول</span>
                </button>
              </form>
            </div>
          )}

        </div>

        {/* Right Column: Live Incident Tickets Board (لوحة البلاغات النشطة وتوجيه الأسطول) */}
        <div className="lg:col-span-6 space-y-4">
          
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <span>سجل وتذاكر البلاغات الميدانية</span>
                  <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">
                    {tickets.length} تذكرة
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  إدارة البلاغات الواردة من الموبايل وتوجيه سيارات النافورة والكباش لحلها
                </p>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-all ${
                    filterStatus === 'all' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  الكل
                </button>
                <button
                  onClick={() => setFilterStatus('critical')}
                  className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-all ${
                    filterStatus === 'critical' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  الطارئ
                </button>
                <button
                  onClick={() => setFilterStatus('new')}
                  className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-all ${
                    filterStatus === 'new' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  جديد
                </button>
                <button
                  onClick={() => setFilterStatus('resolved')}
                  className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-all ${
                    filterStatus === 'resolved' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  مُطهَّر
                </button>
              </div>
            </div>

            {/* Incident Tickets Cards */}
            <div className="space-y-3.5 max-h-[660px] overflow-y-auto pr-1 scrollbar-thin">
              {filteredTickets.length === 0 ? (
                <div className="py-12 text-center text-slate-500 space-y-2">
                  <CheckCircle2 className="w-10 h-10 mx-auto text-slate-600" />
                  <p className="text-sm">لا توجد بلاغات تطابق التصفية الحالية.</p>
                </div>
              ) : (
                filteredTickets.map((ticket) => {
                  const isCritical = ticket.priority === 'critical';
                  const isResolved = ticket.status === 'resolved';
                  const isInProgress = ticket.status === 'in_progress';
                  const isAssigned = ticket.status === 'assigned';

                  return (
                    <div
                      key={ticket.id}
                      className={`p-4 rounded-xl border transition-all text-right space-y-3 ${
                        isResolved
                          ? 'bg-slate-950/60 border-slate-800 opacity-75'
                          : isCritical
                            ? 'bg-gradient-to-r from-slate-900 to-rose-950/20 border-rose-500/40 shadow-lg shadow-rose-950/20'
                            : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      {/* Ticket Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-amber-400">
                            {ticket.ticketNumber}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isCritical 
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse' 
                              : ticket.priority === 'high'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-slate-800 text-slate-300'
                          }`}>
                            {isCritical ? '🚨 طوارئ قصوى' : ticket.priority === 'high' ? '⚠️ مستعجل' : 'اعتيادي'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                            isResolved 
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : isInProgress || isAssigned
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            {isResolved ? 'تم الحل والتطهير' : isInProgress ? 'قيد التنفيذ' : isAssigned ? 'تم التوجيه' : 'بلاغ جديد'}
                          </span>

                          <button
                            onClick={() => onDeleteTicket(ticket.id)}
                            className="text-slate-500 hover:text-rose-400 p-1 rounded-lg transition-colors cursor-pointer"
                            title="حذف البلاغ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Issue & Location */}
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                          <Droplet className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{ticket.issueType}</span>
                        </h4>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          {ticket.description}
                        </p>
                      </div>

                      {/* Location & Links */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-400 pt-1">
                        <div className="flex items-center gap-1.5 truncate">
                          <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span className="truncate">{ticket.location} ({ticket.zone})</span>
                        </div>

                        {ticket.targetManholeCode && (
                          <div className="flex items-center gap-1.5">
                            <Wrench className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>المطبق: <strong className="text-cyan-300 font-mono">{ticket.targetManholeCode}</strong></span>
                          </div>
                        )}
                      </div>

                      {/* Recommended Engineering Action */}
                      {ticket.recommendedAction && (
                        <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-[11px] text-amber-200/90 flex items-start gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold block text-slate-300">التوصية الهندسية الآلية للمعدة:</span>
                            <span>{ticket.recommendedAction}</span>
                          </div>
                        </div>
                      )}

                      {/* Assigned Equipment / Crew status */}
                      {(ticket.assignedEquipmentCode || ticket.assignedCrew) && (
                        <div className="bg-cyan-950/40 p-2 rounded-lg border border-cyan-800/40 text-[11px] flex items-center justify-between text-cyan-200">
                          <span>المعدة المكلفة: <strong>{ticket.assignedEquipmentCode}</strong></span>
                          <span>الطاقم: <strong>{ticket.assignedCrew}</strong></span>
                        </div>
                      )}

                      {/* Reporter Information & Contact */}
                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-850">
                        <div className="flex items-center gap-2">
                          <User className="w-3 h-3 text-slate-400" />
                          <span className="text-slate-300">{ticket.reporterName}</span>
                          <span className="text-slate-500 font-mono">({ticket.reporterRole})</span>
                        </div>

                        <a
                          href={`tel:${ticket.reporterPhone}`}
                          className="bg-slate-800 hover:bg-slate-700 text-cyan-300 px-2.5 py-1 rounded-lg font-mono text-[10px] flex items-center gap-1 transition-colors"
                        >
                          <Phone className="w-3 h-3 text-cyan-400" />
                          <span>{ticket.reporterPhone}</span>
                        </a>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center flex-wrap gap-2 pt-1 border-t border-slate-850 text-xs">
                        
                        {!isResolved ? (
                          <>
                            <button
                              onClick={() => {
                                onUpdateTicketStatus(
                                  ticket.id, 
                                  'resolved', 
                                  ticket.assignedEquipmentCode || 'JET-01',
                                  ticket.assignedCrew || 'طاقم النافورة السريعة'
                                );
                              }}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>تأكيد إتمام التطهير والحل</span>
                            </button>

                            <button
                              onClick={() => {
                                onUpdateTicketStatus(
                                  ticket.id,
                                  'assigned',
                                  'JET-01 (نافورة فائقة)',
                                  'طاقم التدخل السريع'
                                );
                                onNavigateToDispatcher();
                              }}
                              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Wrench className="w-3.5 h-3.5" />
                              <span>توجيه نافورة / كباش بالخطة</span>
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => onUpdateTicketStatus(ticket.id, 'new')}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-2.5 py-1 rounded-lg text-xs cursor-pointer"
                          >
                            إعادة فتح البلاغ
                          </button>
                        )}

                        <button
                          onClick={() => onNavigateToMap(ticket.targetManholeCode)}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg flex items-center gap-1 mr-auto cursor-pointer"
                        >
                          <Navigation className="w-3 h-3 text-cyan-400" />
                          <span>معاينة بالخريطة</span>
                        </button>

                      </div>

                    </div>
                  );
                })
              )}
            </div>

          </div>

        </div>

      </div>

      {/* Real Scannable QR Code Modal */}
      <QRCodeModal 
        isOpen={showQrModal} 
        onClose={() => setShowQrModal(false)} 
      />

    </div>
  );
};
