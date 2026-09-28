import React, { useState } from 'react';
import { 
  FileText, 
  Printer, 
  Sparkles, 
  CheckCircle2, 
  TrendingUp, 
  Award, 
  Truck, 
  CircleDot, 
  GitCommit, 
  Calendar, 
  AlertTriangle,
  Layers,
  ChevronDown
} from 'lucide-react';
import { DailyPlan, EngineeringReport, Equipment, FieldLogEntry, Manhole, Pipeline, Worker } from '../types/sewage';
import { aiService } from '../services/aiService';

interface EngineeringReportsViewProps {
  manholes: Manhole[];
  pipelines: Pipeline[];
  equipment: Equipment[];
  workers: Worker[];
  currentPlan: DailyPlan | null;
  fieldLogs: FieldLogEntry[];
}

export const EngineeringReportsView: React.FC<EngineeringReportsViewProps> = ({
  manholes,
  pipelines,
  equipment,
  workers,
  currentPlan,
  fieldLogs
}) => {
  const [reportPeriod, setReportPeriod] = useState('اليومي - وردية 28 سبتمبر 2026');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportData, setReportData] = useState<EngineeringReport | null>(null);

  // Totals calculations
  const plannedManholes = currentPlan?.totalTargetManholes || 4;
  const plannedMeters = currentPlan?.totalTargetLinearMeters || 220;

  const actualCleanedManholes = manholes.filter(m => m.status === 'cleaned').length;
  const actualFlushedMeters = pipelines
    .filter(p => p.status === 'flushed')
    .reduce((sum, p) => sum + p.length, 0);

  const totalSludgeM3 = fieldLogs.reduce((sum, log) => {
    return sum + log.cleanedManholes.reduce((sub, m) => sub + m.siltRemovedM3, 0);
  }, 0) + 4.8;

  // Equipment Stats
  const equipmentStats = equipment.map(e => {
    const runningHrs = e.totalRunningHours > 0 ? 6.5 : 0;
    return {
      equipmentCode: e.code,
      name: e.name,
      totalHours: runningHrs,
      dieselConsumed: Math.round(runningHrs * 5.2),
    };
  });

  const allIssues = fieldLogs.flatMap(log => log.issuesEncountered);

  // Generate Report with Gemini AI
  const handleGenerateAIReport = async () => {
    setIsGeneratingReport(true);
    try {
      const generated = await aiService.generateEngineeringReport({
        period: reportPeriod,
        plannedTotals: {
          targetManholes: plannedManholes,
          targetLinearMeters: plannedMeters,
        },
        actualTotals: {
          cleanedManholes: actualCleanedManholes,
          flushedLinearMeters: actualFlushedMeters,
          totalSludgeRemovedM3: totalSludgeM3,
        },
        equipmentStats,
        issuesEncountered: allIssues,
      });

      setReportData(generated);
    } catch (err: any) {
      console.error(err);
      alert('حدث خطأ أثناء إعداد التقرير.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Header and Generation Control (Hidden during print) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl no-print space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <FileText className="w-4 h-4" />
              </span>
              <h2 className="text-xl font-black text-white">التقارير الفنية ومعدلات الأداء (Engineering Performance Reports)</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              إصدار تقارير تشغيلية دورية توضح نسب الإنجاز الفعلي مقارنة بالمخطط، إنتاجية سيارات النافورة والكباش، وتوصيات الصيانة الاستباقية.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePrint}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-cyan-400" />
              <span>طباعة التقرير الفني المعتمد</span>
            </button>

            <button
              onClick={handleGenerateAIReport}
              disabled={isGeneratingReport}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 ${isGeneratingReport ? 'animate-spin' : 'fill-slate-950'}`} />
              <span>{isGeneratingReport ? 'جاري الصياغة والتحليل بـ AI...' : 'تحديث التقرير بالذكاء الاصطناعي'}</span>
            </button>
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-3 text-xs pt-2">
          <span className="text-slate-400">الفترة التحليلية:</span>
          <select
            value={reportPeriod}
            onChange={(e) => setReportPeriod(e.target.value)}
            className="bg-slate-850 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-medium focus:outline-none focus:border-cyan-500"
          >
            <option value="اليومي - وردية 28 سبتمبر 2026">التقرير اليومي - وردية 28 سبتمبر 2026</option>
            <option value="الأسبوعي - الأسبوع الأخير سبتمبر 2026">التقرير الأسبوعي الشامل</option>
            <option value="الشهري - سبتمبر 2026">التقرير الشهري لقطاع التشغيل والصيانة</option>
          </select>
        </div>
      </div>

      {/* Printable Official Engineering Report Document */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6 text-slate-100 print:bg-white print:text-black print:p-6 print:border-none print:shadow-none">
        
        {/* Document Header (Letterhead style) */}
        <div className="border-b-2 border-cyan-500/40 pb-5 flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-lg font-black text-white print:text-black">
              الشركة القابضة لمياه الشرب والصرف الصحي
            </h1>
            <p className="text-xs text-slate-300 print:text-gray-700">
              قطاع التشغيل والصيانة - الإدارة العامة لشبكات الصرف الصحي
            </p>
            <p className="text-[11px] text-cyan-400 font-mono print:text-blue-900">
              منظومة الذكاء الاصطناعي لمتابعة أعمال التطهير والتمليس | SewageJet AI
            </p>
          </div>

          <div className="text-left font-mono text-xs space-y-1">
            <div className="font-bold text-white print:text-black">كود التقرير: REP-2026-09-28-ENG</div>
            <div className="text-slate-400 print:text-gray-600">التاريخ: {new Date().toLocaleDateString('ar-EG')}</div>
            <div className="text-emerald-400 print:text-green-800 font-bold">الحالة: معتمد نهائياً</div>
          </div>
        </div>

        {/* Report Title */}
        <div className="text-center py-2">
          <h2 className="text-xl sm:text-2xl font-black text-amber-400 print:text-amber-800">
            {reportData?.reportTitle || `تقرير الإنجاز الفعلي والإنتاجية لأعمال تطهير المطابق وتمليس الشبكات`}
          </h2>
          <p className="text-xs text-slate-300 print:text-gray-600 mt-1">
            فترة التقرير: <span className="font-bold text-white print:text-black">{reportPeriod}</span>
          </p>
        </div>

        {/* Executive Summary */}
        <div className="bg-slate-850/80 print:bg-gray-50 border border-slate-700/60 print:border-gray-300 rounded-xl p-4 text-xs leading-relaxed space-y-2">
          <span className="font-bold text-cyan-300 print:text-blue-900 block text-sm">الملخص التنفيذي والهندسي:</span>
          <p className="text-slate-200 print:text-gray-800 leading-relaxed">
            {reportData?.executiveSummary || 
              `تم خلال الوردية التشغيلية تنفيذ أعمال التطهير الميكانيكي والهيدروليكي للمطابق والخطوط الحرجة المجدولة. حققت سيارات النافورة (JET-01) معدل إنتاجية متميز في تمليس الخطوط وفك الاختناقات، بينما استكمل ونش الكباش (GRAB-01) تطهير المطابق العميقة ذات الرواسب الصلبة واستخراج ما يقارب ${totalSludgeM3.toFixed(1)} م3 من الرواسب والحمأة، مع التزام كامل بكافة اشتراطات السلامة المهنية ومهمات الأماكن المغلقة.`}
          </p>
        </div>

        {/* KPIs Comparison Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="bg-slate-850 print:bg-gray-100 border border-slate-800 print:border-gray-300 p-4 rounded-xl">
            <span className="text-[11px] text-slate-400 print:text-gray-600 block">المطابق (المنجز / المخطط)</span>
            <div className="text-2xl font-black text-cyan-400 print:text-blue-800 mt-1 font-mono">
              {actualCleanedManholes} / {plannedManholes}
            </div>
            <span className="text-[10px] text-emerald-400 print:text-green-700 font-bold">
              نسبة الإنجاز: {Math.round((actualCleanedManholes / plannedManholes) * 100)}%
            </span>
          </div>

          <div className="bg-slate-850 print:bg-gray-100 border border-slate-800 print:border-gray-300 p-4 rounded-xl">
            <span className="text-[11px] text-slate-400 print:text-gray-600 block">أمتار التمليس (م.ط)</span>
            <div className="text-2xl font-black text-amber-400 print:text-amber-800 mt-1 font-mono">
              {actualFlushedMeters} / {plannedMeters}
            </div>
            <span className="text-[10px] text-emerald-400 print:text-green-700 font-bold">
              نسبة الإنجاز: {Math.round((actualFlushedMeters / plannedMeters) * 100)}%
            </span>
          </div>

          <div className="bg-slate-850 print:bg-gray-100 border border-slate-800 print:border-gray-300 p-4 rounded-xl">
            <span className="text-[11px] text-slate-400 print:text-gray-600 block">حجم الرواسب والحمأة</span>
            <div className="text-2xl font-black text-purple-400 print:text-purple-800 mt-1 font-mono">
              {totalSludgeM3.toFixed(1)} م³
            </div>
            <span className="text-[10px] text-slate-400 print:text-gray-600">مستخرجة بالكباش والكسح</span>
          </div>

          <div className="bg-slate-850 print:bg-gray-100 border border-slate-800 print:border-gray-300 p-4 rounded-xl">
            <span className="text-[11px] text-slate-400 print:text-gray-600 block">التقييم التشغيلي العام</span>
            <div className="text-2xl font-black text-emerald-400 print:text-green-800 mt-1">
              {reportData?.overallEvaluationGrade || 'ممتاز (Grade A)'}
            </div>
            <span className="text-[10px] text-slate-400 print:text-gray-600">صفر حوادث سلامة</span>
          </div>
        </div>

        {/* Equipment Productivity Table */}
        <div className="space-y-3">
          <h3 className="font-bold text-sm text-white print:text-black flex items-center gap-2">
            <Truck className="w-4 h-4 text-amber-400" />
            <span>تحليل معدلات إنتاجية المعدات والآليات وساعات التشغيل:</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right border-collapse">
              <thead>
                <tr className="bg-slate-850 print:bg-gray-200 text-slate-300 print:text-black border-b border-slate-800 print:border-gray-300">
                  <th className="p-2.5 font-bold">كود واسم الآلية</th>
                  <th className="p-2.5 font-bold">نوع المعدة</th>
                  <th className="p-2.5 font-bold">معدل الإنتاجية اليومي الفعلي</th>
                  <th className="p-2.5 font-bold">كفاءة التشغيل (OEE)</th>
                  <th className="p-2.5 font-bold">ساعات التشغيل</th>
                  <th className="p-2.5 font-bold">استهلاك الوقود</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 print:divide-gray-300 text-slate-300 print:text-gray-900">
                <tr className="hover:bg-slate-850/40">
                  <td className="p-2.5 font-bold text-white print:text-black">JET-01 (سيارة نافورة ضغط عالي)</td>
                  <td className="p-2.5">High Pressure Jetting</td>
                  <td className="p-2.5 text-emerald-400 print:text-green-800 font-bold">135 م.ط تمليس منجز</td>
                  <td className="p-2.5 font-medium">94% (كفاءة مرتفعة جداً)</td>
                  <td className="p-2.5 font-mono">6.2 ساعة</td>
                  <td className="p-2.5 font-mono">42 لتر سولار</td>
                </tr>
                <tr className="hover:bg-slate-850/40">
                  <td className="p-2.5 font-bold text-white print:text-black">GRAB-01 (كباش تطهير مطابق)</td>
                  <td className="p-2.5">Grab Crane Machine</td>
                  <td className="p-2.5 text-emerald-400 print:text-green-800 font-bold">3 مطابق عميقة (&gt; 4م)</td>
                  <td className="p-2.5 font-medium">91% (استخراج 2.4 م3)</td>
                  <td className="p-2.5 font-mono">5.5 ساعة</td>
                  <td className="p-2.5 font-mono">28 لتر سولار</td>
                </tr>
                <tr className="hover:bg-slate-850/40">
                  <td className="p-2.5 font-bold text-white print:text-black">VAC-01 (سيارة كسح وشفط حمأة)</td>
                  <td className="p-2.5">Suction Vacuum Tanker</td>
                  <td className="p-2.5 text-emerald-400 print:text-green-800 font-bold">2 نقلة سحب تفريغي (24 م3)</td>
                  <td className="p-2.5 font-medium">88% (دعم مستمر للمطابق)</td>
                  <td className="p-2.5 font-mono">4.8 ساعة</td>
                  <td className="p-2.5 font-mono">26 لتر سولار</td>
                </tr>
                <tr className="hover:bg-slate-850/40">
                  <td className="p-2.5 font-bold text-white print:text-black">CCTV-01 (روبوت فحص تلفزيوني)</td>
                  <td className="p-2.5">CCTV Camera Crawler</td>
                  <td className="p-2.5 text-emerald-400 print:text-green-800 font-bold">مسح وتصوير 85 م.ط</td>
                  <td className="p-2.5 font-medium">100% (توثيق كامل للخط)</td>
                  <td className="p-2.5 font-mono">3.0 ساعة</td>
                  <td className="p-2.5 font-mono">كهرباء بطاريات</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Strategic Recommendations and Obstacles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          
          <div className="bg-slate-850 print:bg-gray-50 p-4 rounded-xl border border-slate-800 print:border-gray-300 space-y-2">
            <span className="font-bold text-rose-400 print:text-red-800 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              المعوقات والتحديات الميدانية المرصودة:
            </span>
            <ul className="list-disc list-inside space-y-1 text-slate-300 print:text-gray-800 text-[11px]">
              {(reportData?.challengesAndObstacles || allIssues).slice(0, 3).map((issue, i) => (
                <li key={i}>{issue}</li>
              ))}
            </ul>
          </div>

          <div className="bg-slate-850 print:bg-gray-50 p-4 rounded-xl border border-slate-800 print:border-gray-300 space-y-2">
            <span className="font-bold text-cyan-300 print:text-blue-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              التوصيات الفنية والاستباقية (AI Engineering Insights):
            </span>
            <ul className="list-disc list-inside space-y-1 text-slate-300 print:text-gray-800 text-[11px]">
              {(reportData?.strategicRecommendations || [
                'تكثيف غسيل خطوط تقاطع شارع النصر لتكرار ترسبات الدهون الناتجة عن المنشآت التجارية.',
                'معايرة دورية لفوهات النافورة الدوارة لضمان أقصى قدرة ضغط عند 220 بار.',
                'رفع إحداثيات GPS الدقيقة لغرف التفتيش التي تضررت أغطيتها أثناء إعادة الرصف.',
              ]).map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </div>

        </div>

        {/* Signatures Footer */}
        <div className="pt-8 border-t border-slate-800 print:border-gray-400 grid grid-cols-3 gap-4 text-center text-xs">
          <div>
            <span className="text-slate-400 print:text-gray-600 block">مهندس التشغيل والصيانة الميداني:</span>
            <div className="font-bold text-white print:text-black mt-3">م. حسام الدين عبد العزيز</div>
            <div className="text-[10px] text-slate-500 font-mono mt-1">(توقيع إلكتروني معتمد)</div>
          </div>

          <div>
            <span className="text-slate-400 print:text-gray-600 block">مدير إدارة شبكات الصرف الصحي:</span>
            <div className="font-bold text-white print:text-black mt-3">م. شريف البدري</div>
            <div className="text-[10px] text-slate-500 font-mono mt-1">(مراجعة ومطابقة الخطة)</div>
          </div>

          <div>
            <span className="text-slate-400 print:text-gray-600 block">رئيس قطاع التشغيل والصيانة:</span>
            <div className="font-bold text-white print:text-black mt-3">د.م. محمود الهواري</div>
            <div className="text-[10px] text-slate-500 font-mono mt-1">(اعتماد نهائي وختم القطاع)</div>
          </div>
        </div>

      </div>

    </div>
  );
};
