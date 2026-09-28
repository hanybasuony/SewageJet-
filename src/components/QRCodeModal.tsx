import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  QrCode, 
  X, 
  Copy, 
  Check, 
  ExternalLink, 
  Smartphone, 
  Share2, 
  ShieldCheck, 
  Download,
  Sparkles,
  Info
} from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  customUrl?: string;
  title?: string;
  subtitle?: string;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  customUrl,
  title = 'امسح رمز QR لفتح شاشة البلاغات على هاتفك',
  subtitle = 'وجّه كاميرا الهاتف نحو الرمز لفتح واجهة البلاغات الميدانية وإرسال الشكاوى مباشرة إلى البرنامج المركزي'
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [mobileUrl, setMobileUrl] = useState<string>('');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let targetUrl = customUrl;
    if (!targetUrl) {
      const url = new URL(window.location.href);
      url.searchParams.set('view', 'mobile');
      targetUrl = url.toString();
    }

    setMobileUrl(targetUrl);

    // Generate real, 100% scannable QR Code Data URL
    QRCode.toDataURL(targetUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: '#020617', // slate-950
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })
      .then((dataUrl) => {
        setQrDataUrl(dataUrl);
      })
      .catch((err) => {
        console.error('Error generating QR code:', err);
      });
  }, [customUrl, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(mobileUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = 'sewage-mobile-qr-code.png';
    a.click();
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 cursor-pointer"
    >
      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-7 max-w-md w-full text-center space-y-5 shadow-2xl relative animate-in zoom-in-95 duration-200 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          title="إغلاق النافذة"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1.5 pt-1">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-amber-500 p-0.5 shadow-lg shadow-cyan-900/40 flex items-center justify-center mx-auto">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <QrCode className="w-6 h-6 text-amber-400" />
            </div>
          </div>
          <h2 className="text-lg font-black text-white">{title}</h2>
          <p className="text-xs text-slate-300 leading-relaxed px-2">
            {subtitle}
          </p>
        </div>

        {/* The Real Scannable QR Code Card */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl inline-block shadow-2xl border-4 border-amber-400/80 relative group mx-auto">
          {qrDataUrl ? (
            <img 
              src={qrDataUrl} 
              alt="QR Code لفتح شاشة البلاغات على الموبايل" 
              className="w-56 h-56 sm:w-60 sm:h-60 mx-auto select-none rounded-lg"
            />
          ) : (
            <div className="w-56 h-56 flex items-center justify-center text-slate-800 text-xs">
              جاري توليد رمز الـ QR الحقيقي...
            </div>
          )}

          {/* Center Brand Badge on QR */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-950 text-cyan-400 p-1.5 rounded-lg border-2 border-white shadow-md pointer-events-none">
            <Smartphone className="w-4 h-4" />
          </div>
        </div>

        {/* Scan instruction pill */}
        <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 py-2 px-3 rounded-xl">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>يعمل مع أي هاتف ذكي (iPhone أو Android) عبر الكاميرا مباشرة</span>
        </div>

        {/* Direct Link & Copy */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-right space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>الرابط المباشر للهاتف:</span>
            <span className="text-[10px] text-cyan-400 font-bold">مزامنة فورية مع البرنامج</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={mobileUrl}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 font-mono focus:outline-none select-all text-left"
              dir="ltr"
            />

            <button
              onClick={handleCopy}
              className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              title="نسخ الرابط"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'تم النسخ!' : 'نسخ'}</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 text-xs pt-1">
          <a
            href={mobileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
            <span>تجربة بتبويب مستقل</span>
          </a>

          <button
            onClick={handleDownloadQR}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>تحميل صورة الـ QR</span>
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
        >
          إغلاق
        </button>

      </div>
    </div>
  );
};
