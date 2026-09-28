import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));

// Initialize Gemini SDK with User-Agent header as required
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// In-memory incidents storage for real-time mobile reporting sync
let serverIncidents: any[] = [
  {
    id: 'tkt-01',
    ticketNumber: 'TKT-2026-101',
    reporterName: 'الحاج إبراهيم رضوان',
    reporterPhone: '01098765432',
    reporterRole: 'مواطن / خط ساخن 125',
    location: 'شارع الجمهورية - أمام صيدلية الإسعاف',
    zone: 'القطاع الأوسط',
    issueType: 'طفح مياه صرف في الشارع',
    description: 'طفح مياه صرف صحي داكنة في الشارع العام وتجمّع بركة مياه تعوق المارة وحركة السيارات أمام المحال التجارية.',
    priority: 'critical',
    status: 'assigned',
    targetManholeCode: 'MH-101',
    targetLineCode: 'LINE-101-102',
    gpsCoordinates: { lat: 30.0444, lng: 31.2357 },
    recommendedAction: 'توجيه سيارة نافورة JET-01 للتسليك العكسي وسحب المياه السطحية',
    assignedEquipmentCode: 'JET-01',
    assignedCrew: 'طاقم النافورة السريعة (أ)',
    reportedAt: '2026-09-28 06:45',
  },
  {
    id: 'tkt-02',
    ticketNumber: 'TKT-2026-102',
    reporterName: 'م. سامح غنيم',
    reporterPhone: '01123456789',
    reporterRole: 'مراقب شبكات',
    location: 'تقاطع شارع الجمهورية مع الجلاء',
    zone: 'القطاع الأوسط',
    issueType: 'هبوط أو كسر غطاء مطبق',
    description: 'كسر جزئي في إطار الغطاء الزهر لمطبق MH-103 مع هبوط أسفلتي دائري يشكل خطورة بالغة على المركبات.',
    priority: 'high',
    status: 'new',
    targetManholeCode: 'MH-103',
    gpsCoordinates: { lat: 30.0465, lng: 31.2389 },
    recommendedAction: 'تطويق الموقع بالحواجز الفوسفورية وتركيب غطاء GRP محكم عيار D400',
    reportedAt: '2026-09-28 07:15',
  },
  {
    id: 'tkt-03',
    ticketNumber: 'TKT-2026-103',
    reporterName: 'فني تشغيل / خميس السيد',
    reporterPhone: '01234567890',
    reporterRole: 'فني ميداني',
    location: 'ميدان الساعة - مجمع الجلاء الطبي',
    zone: 'القطاع الأوسط',
    issueType: 'انسداد خط انحدار',
    description: 'توقف الجريان بالخط LINE-104-105 وارتفاع منسوب المياه بمطبق MH-104 إلى ما قبل الحافة بـ 25 سم نتيجة ترسب مخلفات ثقيلة.',
    priority: 'critical',
    status: 'in_progress',
    targetManholeCode: 'MH-104',
    targetLineCode: 'LINE-104-105',
    gpsCoordinates: { lat: 30.0485, lng: 31.2422 },
    recommendedAction: 'تطهير عميق باستخدام الكباش GRAB-01 وسحب الرواسب بسيارة الكسح VAC-01',
    assignedEquipmentCode: 'GRAB-01',
    assignedCrew: 'طاقم الكباش والتطهير العميق (ب)',
    reportedAt: '2026-09-28 07:30',
  },
];

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: !!apiKey,
    environment: isProduction ? 'production' : 'development',
    timestamp: new Date().toISOString(),
  });
});

// Incidents Management Endpoints (Mobile to Central Program)
app.get('/api/incidents', (req, res) => {
  res.json({
    success: true,
    count: serverIncidents.length,
    tickets: serverIncidents,
  });
});

app.post('/api/incidents', (req, res) => {
  try {
    const data = req.body;
    const ticketNumber = data.ticketNumber || `TKT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date();
    const reportedAt = data.reportedAt || `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 5)}`;

    const newTicket = {
      id: data.id || `tkt-${Date.now()}`,
      ticketNumber,
      reporterName: data.reporterName || 'مُبلّغ ميداني',
      reporterPhone: data.reporterPhone || '01000000000',
      reporterRole: data.reporterRole || 'فني ميداني',
      location: data.location || 'موقع غير محدد',
      zone: data.zone || 'القطاع الأوسط',
      issueType: data.issueType || 'طفح مياه صرف في الشارع',
      description: data.description || '',
      priority: data.priority || 'critical',
      status: data.status || 'new',
      targetManholeCode: data.targetManholeCode,
      targetLineCode: data.targetLineCode,
      photoUrl: data.photoUrl,
      gpsCoordinates: data.gpsCoordinates,
      recommendedAction: data.recommendedAction,
      reportedAt,
    };

    serverIncidents = [newTicket, ...serverIncidents];

    console.log(`[INCIDENT RECEIVED FROM MOBILE]: ${ticketNumber} - ${newTicket.issueType} at ${newTicket.location}`);

    res.status(201).json({
      success: true,
      message: 'تم استلام البلاغ في المنظومة المركزية بنجاح',
      ticket: newTicket,
    });
  } catch (error: any) {
    console.error('Error creating incident ticket:', error);
    res.status(500).json({
      success: false,
      error: 'فشل تسجيل البلاغ في الخادم',
    });
  }
});

app.patch('/api/incidents/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  let found = false;
  serverIncidents = serverIncidents.map(item => {
    if (item.id === id || item.ticketNumber === id) {
      found = true;
      return { ...item, ...updates };
    }
    return item;
  });

  if (!found) {
    return res.status(404).json({ success: false, error: 'البلاغ غير موجود' });
  }

  res.json({ success: true, message: 'تم تحديث حالة البلاغ' });
});

app.delete('/api/incidents/:id', (req, res) => {
  const { id } = req.params;
  serverIncidents = serverIncidents.filter(item => item.id !== id && item.ticketNumber !== id);
  res.json({ success: true, message: 'تم حذف البلاغ' });
});

// AI Dispatch Plan Generation Endpoint
app.post('/api/ai/generate-plan', async (req, res) => {
  try {
    const { manholes, lines, equipment, workforce, priorityFocus, shiftDate } = req.body;

    const prompt = `
أنت خبير واستشاري أول في هندسة تشغيل وصيانة شبكات الصرف الصحي وإدارة أساطيل التطهير والتمليس الميكانيكي والهيدروليكي.
المطلوب إعداد "خطة عمل تشغيلية ذكية ومتكاملة" ليوم: ${shiftDate || 'اليوم'}.

البيانات الميدانية المتاحة:
1. المطابق المرشحة للتطهير (${manholes?.length || 0} مطبق):
${JSON.stringify(manholes?.slice(0, 15), null, 2)}

2. خطوط الانحدار والمواسير المرشحة للتمليس (${lines?.length || 0} خط):
${JSON.stringify(lines?.slice(0, 15), null, 2)}

3. المعدات والآليات المتاحة وحالتها الفنية:
${JSON.stringify(equipment, null, 2)}

4. العمالة والكوادر المتاحة اليوم:
${JSON.stringify(workforce, null, 2)}

5. تركيز الأولوية: ${priorityFocus || 'تحقيق أقصى كفاءة وتقليل الانسدادات الحرجة'}

القواعد والاعتبارات الهندسية الإلزامية:
- المطابق العميقة (عمق > 3.5 م) أو ذات الترسبات الكثيفة (> 50%) تتطلب كباش تطهير (Grab Machine) وسيارة كسح للتخلص من الحمأة والرواسب الحجرية.
- خطوط الانحدار بأقطار >= 300 مم وأطوال > 40 م تتطلب سيارات نافورة عالية الضغط (High Pressure Jetting 150-250 bar) لتمليس الخط من المطبق السفلي عكس اتجاه السريان.
- الخطوط التي تعاني من سدد متكرر أو دهون متكلسة تتطلب تمليس ميكانيكي (Mechanical Rodding/Winching) يعقبه غسيل بالنافورة ثم فحص بكاميرا CCTV.
- توزيع العمالة والسائقين والفنيين بما يضمن تشغيل كل معدة بطاقم كامل (سائق + فني تشغيل + 2-3 عمال سلامة وصحة مهنية).
- الالتزام التام بإجراءات السلامة في الأماكن المغلقة (Confined Spaces): قياس الغازات H2S / CO / LEL / O2، تهوية قسرية، حزام أمان ثلاثي، جهاز تنفس للطوارئ.
- التجميع الجغرافي للمطابق والخطوط في نفس المنطقة/الحي لتقليل أوقات انتقال المعدات الثقيلة.

أجب بنتيجة JSON مطابقة تماماً للمخطط المحدد:
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            planTitle: { type: Type.STRING },
            executiveSummary: { type: Type.STRING },
            totalTargetManholes: { type: Type.INTEGER },
            totalTargetLinearMeters: { type: Type.INTEGER },
            estimatedTotalHours: { type: Type.NUMBER },
            crews: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  crewName: { type: Type.STRING },
                  assignedEquipment: { type: Type.STRING },
                  equipmentType: { type: Type.STRING },
                  supervisor: { type: Type.STRING },
                  driver: { type: Type.STRING },
                  technician: { type: Type.STRING },
                  laborersCount: { type: Type.INTEGER },
                  targetArea: { type: Type.STRING },
                  workZone: { type: Type.STRING },
                  assignedManholeCodes: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  assignedLineCodes: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  specificTasks: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  estimatedDurationHours: { type: Type.NUMBER },
                },
                required: [
                  'crewName',
                  'assignedEquipment',
                  'supervisor',
                  'assignedManholeCodes',
                  'assignedLineCodes',
                  'specificTasks',
                ],
              },
            },
            safetyInstructions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            operationalNotes: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: [
            'planTitle',
            'executiveSummary',
            'totalTargetManholes',
            'totalTargetLinearMeters',
            'crews',
            'safetyInstructions',
          ],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('لم يتم استلام رد من نموذج الذكاء الاصطناعي');
    }

    const parsedData = JSON.parse(text);
    res.json({ success: true, plan: parsedData });
  } catch (error: any) {
    console.error('Error generating AI plan:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'حدث خطأ أثناء إعداد الخطة الذكية بواسطة AI',
    });
  }
});

// Dynamic Re-planning Endpoint (Handling unexpected equipment failure or crew shortage)
app.post('/api/ai/dynamic-replan', async (req, res) => {
  try {
    const { incidentType, incidentDescription, currentPlan, remainingTasks, availableEquipment, availableWorkforce } = req.body;

    const prompt = `
أنت مهندس إدارة الطوارئ والأزمات في شبكات الصرف الصحي.
حدث طارئ أثناء تنفيذ الخطة اليومية:
- نوع الطارئ: ${incidentType} (مثال: عطل مفاجئ في معدة، نقص عمالة، انسداد حرج مفاجئ، ارتفاع منسوب خط رئيسي).
- تفاصيل الطارئ: ${incidentDescription}
- المعدات المتبقية العاملة: ${JSON.stringify(availableEquipment)}
- العمالة المتاحة بعد الطارئ: ${JSON.stringify(availableWorkforce)}
- المهام المتبقية التي لم تكتمل بعد: ${JSON.stringify(remainingTasks)}

المطلوب:
إعادة جدولة وتوزيع المهام المتبقية فوراً (Dynamic Contingency Re-plan):
1. إعادة توزيع الطاقم البشري التابع للمعدة المتعطلة على باقي المعدات أو لتنفيذ تسليك يدوي/مساعد.
2. تحديد المهام ذات الأولوية القصوى التي يجب إنجازها اليوم حتماً، وتأجيل المهام الثانوية.
3. خطة العمل المحدثة لكل فرقة متبقية.
4. إرشادات التعامل مع الطارئ وصيانة المعدة أو احتواء الانسداد.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            status: { type: Type.STRING },
            actionSummary: { type: Type.STRING },
            contingencyDecision: { type: Type.STRING },
            reallocatedCrews: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  crewName: { type: Type.STRING },
                  action: { type: Type.STRING },
                  assignedTasks: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ['crewName', 'action', 'assignedTasks'],
              },
            },
            deferredTasks: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            immediateMitigations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['actionSummary', 'contingencyDecision', 'reallocatedCrews', 'deferredTasks'],
        },
      },
    });

    const text = response.text;
    res.json({ success: true, replan: JSON.parse(text || '{}') });
  } catch (error: any) {
    console.error('Error dynamic replanning:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'حدث خطأ أثناء إعادة الجدولة التلقائية',
    });
  }
});

// AI Engineering & KPI Performance Report Generator
app.post('/api/ai/engineering-report', async (req, res) => {
  try {
    const { period, plannedTotals, actualTotals, equipmentStats, issuesEncountered } = req.body;

    const prompt = `
أنت المدير العام للتشغيل والصيانة في الهيئة القومية لمياه الشرب والصرف الصحي.
المطلوب إعداد تقرير هندسي فني وإداري رسمي لنتائج أعمال تطهير المطابق وتمليس خطوط الصرف للفترة: ${period}.

بيانات الإنجاز:
- المخطط: ${JSON.stringify(plannedTotals)}
- الفعلي المنجز: ${JSON.stringify(actualTotals)}
- إحصائيات المعدات وساعات التشغيل: ${JSON.stringify(equipmentStats)}
- المعوقات والأعطال الميدانية: ${JSON.stringify(issuesEncountered)}

قم بتحليل:
1. نسبة الإنجاز المئوية (مطابق وخطوط).
2. تقدير كمية الرواسب والحمأة المستخرجة بالأمتار المكعبة (m3).
3. كفاءة استغلال المعدات والآليات (معدلات إنتاجية المتر/ساعة).
4. تقييم كفاءة الفرق والعمالة.
5. توصيات فنية لتطوير خطة الوقاية الدورية للشبكة ومنع تراكم الدهون والرواسب في المناطق المتكررة.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reportTitle: { type: Type.STRING },
            overallEvaluationGrade: { type: Type.STRING }, // ممتاز، جيد جداً، مقبول، يحتاج تحسين
            completionRateManholes: { type: Type.NUMBER },
            completionRateLines: { type: Type.NUMBER },
            estimatedSludgeRemovedM3: { type: Type.NUMBER },
            executiveSummary: { type: Type.STRING },
            equipmentAnalysis: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  equipmentName: { type: Type.STRING },
                  productivityRate: { type: Type.STRING },
                  operatingEfficiency: { type: Type.STRING },
                  remarks: { type: Type.STRING },
                },
                required: ['equipmentName', 'productivityRate', 'operatingEfficiency'],
              },
            },
            keyAchievements: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            challengesAndObstacles: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            strategicRecommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: [
            'reportTitle',
            'overallEvaluationGrade',
            'completionRateManholes',
            'completionRateLines',
            'executiveSummary',
            'strategicRecommendations',
          ],
        },
      },
    });

    const text = response.text;
    res.json({ success: true, report: JSON.parse(text || '{}') });
  } catch (error: any) {
    console.error('Error generating report:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'حدث خطأ أثناء إعداد التقرير الفني',
    });
  }
});

// Vite or Static file serving
async function setupServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`SewageJet AI Server running on http://localhost:${PORT}`);
  });
}

setupServer();
