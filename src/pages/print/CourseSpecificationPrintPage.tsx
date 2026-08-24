import React, { useEffect, useMemo, useState } from "react";

// ============ TYPES (تُطابق البيانات المُخزّنة من CourseQualityDialog) ============

interface PrintPayload {
  courseInfo: any;
  description: { description: string; goals: string[] };
  courseOutcomes: any[];
  programOutcomes: any[];
  teachingStrategies: any[];
  assessmentMethods: any[];
  outcomeMappings: any[];
  topics: any[];
  assignments: any[];
  assessments: any[];
  references: any[];
  policies: any[];
  generatedAt: string;
}

const STORAGE_KEY = "course_specification_print_data";

const domainLabels: Record<string, string> = {
  Knowledge: "المعرفة والفهم",
  Intellectual: "المهارات الذهنية",
  Professional: "المهارات المهنية والعملية",
  General: "المهارات العامة",
};

const domainAbbreviations: Record<string, string> = {
  Knowledge: "a",
  Intellectual: "b",
  Professional: "c",
  General: "d",
};

const FIXED_POLICIES = [
  { policy_number: 1, title: "الحضور والغياب", content: "حضور المحاضرات إلزامي، ويعتبر الطالب غائباً إذا تجاوزت نسبة غيابه عن ٪25 من الساعات المحددة، ويُعد محروماً من دخول الاختبار النهائي." },
  { policy_number: 2, title: "الحضور المتأخر", content: "يعتبر الطالب متأخراً عن الفصل إذا لم يكن في الفصل بعد 10 دقائق من وقت بدء المحاضرة." },
  { policy_number: 3, title: "ضوابط الاختبار", content: "لا يُسمح لأي طالب دخول قاعة الاختبارات بعد مرور 30 دقيقة من وقت بدء الاختبار، ولا يُسمح له بمغادرة القاعة قبل مرور نصف وقت الاختبار." },
  { policy_number: 4, title: "التكليفات/ المهام والمشاريع", content: "يجب على الطالب تقديم الواجبات والمشاريع في الوقت المحدد، وإذا تأخر الطالب عن تسليم واجباته عن الموعد المحدد فسيفقد الدرجة المخصصة لذلك." },
  { policy_number: 5, title: "الغش", content: "الغش هو فعل احتيالي ينتج عنه إلغاء الاختبار النهائي للطالب وتطبق عليه العقوبات المنصوص عليها في نظام الطلاب الموحد (2008)." },
  { policy_number: 6, title: "التزوير وانتحال الهوية", content: "التزوير/ انتحال الهوية هو عمل احتيالي ينتج عنه إلغاء الاختبار النهائي للطالب، وتطبق عليه العقوبات المنصوص عليها في النظام الموحد لشئون الطلاب (2008)." },
  { policy_number: 7, title: "سياسات أخرى", content: "يتم التقيد الصارم باللوائح الرسمية الأكاديمية السارية ويجب على الطلاب الامتثال لجميع القواعد واللوائح الخاصة بالاختبارات." },
];

const fixedAssessmentRows = [
  { assessment_id: -1, name: "الأنشطة والتكليفات", assessment_type: "activities" },
  { assessment_id: -2, name: "اختبارات قصيرة", assessment_type: "quizzes" },
  { assessment_id: -3, name: "اختبار منتصف الترم", assessment_type: "midterm_exam" },
  { assessment_id: -4, name: "اختبار منتصف الترم العملي", assessment_type: "practical_exam" },
  { assessment_id: -5, name: "الاختبار العملي النهائي بما في ذلك عرض المشروع وتقييمه", assessment_type: "practical_exam" },
  { assessment_id: -6, name: "الاختبار النهائي", assessment_type: "final_exam" },
];

const ALL_PARTS = ["نظري", "عملي", "تمارين", "سريري"];

// ============ HELPERS ============

const getPartWeeks = (part: string) => (part === "نظري" ? 16 : 15);

const getCoursePartRecords = (courseInfo: any): any[] => {
  const value = courseInfo?.course_parts;
  return Array.isArray(value) ? value : [];
};

const hasConfiguredPart = (courseInfo: any, part: string) =>
  getCoursePartRecords(courseInfo).some((p: any) => (p?.name ?? p?.part ?? p?.type) === part);

const getPartActualHours = (courseInfo: any, part: string): number => {
  const record = getCoursePartRecords(courseInfo).find((p: any) => (p?.name ?? p?.part ?? p?.type) === part);
  if (!record) return 0;
  return Number(record.actual_hours ?? record.total_hours ?? 0) || 0;
};

const getPartDisplayHours = (courseInfo: any, part: string): number => {
  const actual = getPartActualHours(courseInfo, part);
  if (part === "عملي" || part === "تمارين") return actual / 2;
  if (part === "سريري") return actual / 3;
  return actual;
};

const getContentRows = (courseInfo: any, topics: any[], part: string) => {
  if (!hasConfiguredPart(courseInfo, part)) return [];
  const weekLimit = getPartWeeks(part);
  const existing = topics.filter((t) => t.part === part);
  const rows: any[] = [];
  for (let week = 1; week <= weekLimit; week += 1) {
    const weekTopics = existing.filter((t) => t.week === week);
    if (weekTopics.length > 0) {
      rows.push(...weekTopics);
      continue;
    }
    const isMidterm = week === 8;
    const isFinal = week === weekLimit;
    rows.push({
      topic_id: -(part.charCodeAt(0) + week),
      part,
      week,
      unit_name: isMidterm ? "اختبار منتصف الفصل" : isFinal ? "الاختبار النهائي" : "",
      subtopics: [],
      outcome_ids: [],
      hours: getPartDisplayHours(courseInfo, part),
      is_exam: isMidterm || isFinal,
      exam_type: isMidterm ? "midterm" : isFinal ? "final" : undefined,
    });
  }
  return rows;
};

const countWords = (text: string) => (text || "").trim().split(/\s+/).filter(Boolean).length;

// ============ COMPONENT ============

export default function CourseSpecificationPrintPage() {
  const [payload, setPayload] = useState<PrintPayload | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setNotFound(true);
        return;
      }
      setPayload(JSON.parse(raw));
    } catch {
      setNotFound(true);
    }
  }, []);

  useEffect(() => {
    if (!payload) return;
    const timer = setTimeout(() => window.print(), 600);
    return () => clearTimeout(timer);
  }, [payload]);

  useEffect(() => {
    if (payload?.courseInfo?.course_name) {
      document.title = `توصيف مقرر ${payload.courseInfo.course_name}`;
    }
  }, [payload]);

  const configuredParts = useMemo(
    () => (payload ? ALL_PARTS.filter((part) => hasConfiguredPart(payload.courseInfo, part)) : []),
    [payload]
  );

  const assessmentRows = useMemo(() => {
    if (!payload) return [];
    return fixedAssessmentRows.map((fixedRow) => {
      const saved = payload.assessments.find((a) => a.name === fixedRow.name);
      return saved ? { ...fixedRow, ...saved } : { ...fixedRow, week: 0, grade: 0, percentage: 0, clo_ids: [] };
    });
  }, [payload]);

  if (notFound) {
    return (
      <div dir="rtl" style={{ padding: 40, textAlign: "center", fontFamily: "sans-serif" }}>
        <h2>لا توجد بيانات للطباعة</h2>
        <p style={{ color: "#64748b" }}>
          يرجى فتح توصيف المقرر من صفحة إدارة المقررات ثم الضغط على زر "طباعة توصيف المقرر" مرة أخرى.
        </p>
      </div>
    );
  }

  if (!payload) {
    return (
      <div dir="rtl" style={{ padding: 40, textAlign: "center", fontFamily: "sans-serif" }}>
        جاري تحميل بيانات الطباعة...
      </div>
    );
  }

  const { courseInfo, description, courseOutcomes, programOutcomes, teachingStrategies, assessmentMethods, outcomeMappings, topics, assignments, references, policies } = payload;

  return (
    <div dir="rtl" className="print-page">
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        .print-page {
          font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
          color: #0f172a;
          background: #f1f5f9;
          padding: 24px;
        }
        .toolbar {
          max-width: 900px;
          margin: 0 auto 16px;
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }
        .toolbar button {
          padding: 8px 16px;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          background: #fff;
          cursor: pointer;
          font-size: 14px;
        }
        .toolbar button.primary {
          background: #4f46e5;
          color: #fff;
          border-color: #4f46e5;
        }
        .sheet {
          max-width: 900px;
          margin: 0 auto;
          background: #fff;
          padding: 24px 32px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.08);
        }
        .cover {
          text-align: center;
          padding: 10vh 0 4vh;
          page-break-after: always;
        }
        .cover h1 { font-size: 26px; margin-bottom: 8px; }
        .cover p { color: #64748b; font-size: 15px; }
        .print-header, .print-footer { display: none; }
        section { margin-bottom: 14px; }
        h2.section-title {
          background: #eef2ff;
          border-right: 4px solid #4f46e5;
          padding: 6px 12px;
          font-size: 15px;
          margin: 0 0 8px;
        }
        h3.sub-title { font-size: 13px; margin: 10px 0 6px; color: #1e293b; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 12.5px; }
        th, td { border: 1px solid #cbd5e1; padding: 5px 8px; text-align: right; vertical-align: top; }
        th { background: #2563eb; color: #fff; }
        tr.total-row { background: #eef2ff; font-weight: bold; }
        .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px 16px; margin-bottom: 8px; }
        .info-item { border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 10px; background: #f8fafc; }
        .info-item .label { font-size: 11px; color: #64748b; display: block; margin-bottom: 2px; }
        .info-item .value { font-weight: 600; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; background: #e0e7ff; color: #3730a3; font-size: 11px; margin: 2px; }
        .goal-list { padding-right: 20px; margin: 0; }
        .goal-list li { margin-bottom: 4px; }
        .policy-box { border: 1px solid #fecaca; background: #fef2f2; border-radius: 6px; padding: 8px 12px; margin-bottom: 6px; page-break-inside: avoid; }
        .policy-box h4 { margin: 0 0 4px; }
        .policy-box p { margin: 0; font-size: 12.5px; }

        @media print {
          .toolbar { display: none !important; }
          .print-page { background: #fff; padding: 0; }
          .sheet { box-shadow: none; padding: 16mm 12mm 14mm; max-width: none; }
          /* margin: 0 يمنع متصفح Chrome من إضافة رأس/ذيل الصفحة الافتراضي (الرابط والتاريخ) */
          @page { size: A4; margin: 0; }
          .print-header, .print-footer {
            display: block;
            position: fixed;
            left: 0;
            right: 0;
            text-align: center;
            color: #475569;
            font-size: 11px;
          }
          .print-header { top: 5mm; font-weight: 600; color: #1e293b; }
          .print-footer { bottom: 5mm; }
        }
      `}</style>

      <div className="toolbar">
        <button onClick={() => window.close()}>إغلاق</button>
        <button className="primary" onClick={() => window.print()}>طباعة</button>
      </div>

      <div className="print-header">توصيف مقرر {courseInfo?.course_name}</div>
      <div className="print-footer">{new Date().toLocaleString("ar-EG")}</div>

      <div className="sheet">
        <div className="cover">
          <h1>توصيف مقرر {courseInfo?.course_name}</h1>
          <p>{courseInfo?.course_code}</p>
        </div>

        {/* I. معلومات عامة */}
        <section>
          <h2 className="section-title">I. معلومات عامة عن المقرر</h2>
          <div className="info-grid">
            <div className="info-item"><span className="label">كود المقرر</span><span className="value">{courseInfo?.course_code || "-"}</span></div>
            <div className="info-item"><span className="label">اسم المقرر</span><span className="value">{courseInfo?.course_name || "-"}</span></div>
            <div className="info-item"><span className="label">الساعات المعتمدة</span><span className="value">{courseInfo?.credit_hours ?? "-"}</span></div>
            <div className="info-item"><span className="label">وزن المقرر من البرنامج</span><span className="value">{courseInfo?.weight ?? 0}%</span></div>
            <div className="info-item"><span className="label">نوع المتطلب</span><span className="value">{courseInfo?.category || "غير محدد"}</span></div>
            <div className="info-item"><span className="label">لغة التدريس</span><span className="value">{courseInfo?.teaching_language || "غير محدد"}</span></div>
            <div className="info-item"><span className="label">الكلية</span><span className="value">{courseInfo?.college?.name || "غير محدد"}</span></div>
            <div className="info-item"><span className="label">القسم</span><span className="value">{courseInfo?.department?.name || "غير محدد"}</span></div>
            <div className="info-item"><span className="label">البرنامج</span><span className="value">{courseInfo?.program?.name || "غير محدد"}</span></div>
            <div className="info-item"><span className="label">المستوى</span><span className="value">{courseInfo?.level ? `المستوى ${courseInfo.level.number}` : "غير محدد"}</span></div>
            <div className="info-item"><span className="label">الفصل الدراسي</span><span className="value">{courseInfo?.semester?.name || "غير محدد"}</span></div>
            <div className="info-item"><span className="label">حالة المقرر</span><span className="value">{courseInfo?.is_active ? "نشط" : "غير نشط"}</span></div>
          </div>

          {Array.isArray(courseInfo?.course_parts) && courseInfo.course_parts.length > 0 && (
            <>
              <h3 className="sub-title">أجزاء المقرر وساعاته</h3>
              <table>
                <thead><tr><th>الجزء</th><th>الساعات الفعلية</th><th>المعدل</th><th>الساعات المعتمدة</th></tr></thead>
                <tbody>
                  {courseInfo.course_parts.map((part: any, idx: number) => (
                    <tr key={idx}>
                      <td>{part.name}</td>
                      <td>{part.actual_hours}</td>
                      <td>{part.name === "نظري" ? "×1" : part.name === "سريري" ? "÷3" : "÷2"}</td>
                      <td>{Math.round((part.actual_hours || 0) * (part.rate || 0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {((courseInfo?.prerequisites?.length ?? 0) > 0 || (courseInfo?.corequisites?.length ?? 0) > 0) && (
            <>
              <h3 className="sub-title">المتطلبات</h3>
              <div className="info-grid">
                {courseInfo.prerequisites?.length > 0 && (
                  <div>
                    <strong>المتطلبات السابقة:</strong>
                    <div>{courseInfo.prerequisites.map((p: any, i: number) => <span key={i} className="badge">{p.course_code} - {p.course_name}</span>)}</div>
                  </div>
                )}
                {courseInfo.corequisites?.length > 0 && (
                  <div>
                    <strong>المتطلبات المصاحبة:</strong>
                    <div>{courseInfo.corequisites.map((c: any, i: number) => <span key={i} className="badge">{c.course_code} - {c.course_name}</span>)}</div>
                  </div>
                )}
              </div>
            </>
          )}
        </section>

        {/* II & III. الوصف والأهداف */}
        <section>
          <h2 className="section-title">II. وصف المقرر</h2>
          <p>{description?.description || "لم يتم إدخال وصف المقرر بعد."}</p>
          <p style={{ color: "#64748b", fontSize: 11 }}>عدد الكلمات: {countWords(description?.description || "")}</p>

          <h2 className="section-title" style={{ marginTop: 20 }}>III. أهداف المقرر</h2>
          {description?.goals?.length > 0 ? (
            <ol className="goal-list">
              {description.goals.map((goal, idx) => <li key={idx}>{goal}</li>)}
            </ol>
          ) : (
            <p style={{ color: "#94a3b8" }}>لا توجد أهداف مضافة.</p>
          )}
        </section>

        {/* IV. مخرجات التعلم */}
        <section>
          <h2 className="section-title">IV. مخرجات التعلم المقصودة للمقرر (CLOs)</h2>
          {(Object.keys(domainLabels) as string[]).map((domain) => {
            const domainOutcomes = courseOutcomes.filter((o) => o.domain === domain);
            if (domainOutcomes.length === 0) return null;
            return (
              <div key={domain}>
                <h3 className="sub-title">({domainAbbreviations[domain]}) {domainLabels[domain]}</h3>
                <table>
                  <thead><tr><th style={{ width: "8%" }}>الرمز</th><th>الوصف</th><th style={{ width: "12%" }}>الوزن</th><th style={{ width: "15%" }}>مرتبط بمخرج البرنامج</th></tr></thead>
                  <tbody>
                    {domainOutcomes.sort((a, b) => a.order - b.order).map((outcome) => {
                      const plo = programOutcomes.find((p) => p.plo_id === outcome.plo_id);
                      return (
                        <tr key={outcome.clo_id}>
                          <td>{outcome.code}</td>
                          <td>{outcome.description}</td>
                          <td>{Number(outcome.weight || 0).toFixed(2)}%</td>
                          <td>{plo ? plo.code : "غير محدد"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })}
          {courseOutcomes.length === 0 && <p style={{ color: "#94a3b8" }}>لا توجد مخرجات تعلم مضافة.</p>}
        </section>

        {/* V. الربط باستراتيجيات التدريس والتقييم */}
        <section>
          <h2 className="section-title">V. ربط مخرجات التعلم باستراتيجيات التدريس والتقييم</h2>
          {(Object.keys(domainLabels) as string[]).map((domain, domainIndex) => {
            const domainOutcomes = courseOutcomes.filter((o) => o.domain === domain);
            if (domainOutcomes.length === 0) return null;
            return (
              <div key={domain}>
                <h3 className="sub-title">({String.fromCharCode(65 + domainIndex)}) {domainLabels[domain]}</h3>
                <table>
                  <thead><tr><th style={{ width: "35%" }}>مخرجات التعلم</th><th style={{ width: "32%" }}>استراتيجيات التدريس</th><th style={{ width: "33%" }}>طرق التقييم</th></tr></thead>
                  <tbody>
                    {domainOutcomes.map((outcome) => {
                      const mapping = outcomeMappings.find((m) => m.clo_id === outcome.code);
                      const strategies = (mapping?.teaching_strategies || []).map((id: number) => teachingStrategies.find((s) => s.id === id)?.name).filter(Boolean);
                      const methods = (mapping?.assessment_methods || []).map((id: number) => assessmentMethods.find((m) => m.id === id)?.name).filter(Boolean);
                      return (
                        <tr key={outcome.clo_id}>
                          <td><strong>{outcome.code}</strong> - {outcome.description}</td>
                          <td>{strategies.join("، ") || "-"}</td>
                          <td>{methods.join("، ") || "-"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })}
        </section>

        {/* VI. محتوى المقرر */}
        <section>
          <h2 className="section-title">VI. محتوى المقرر</h2>
          {configuredParts.length === 0 && <p style={{ color: "#94a3b8" }}>لم يتم تحديد أجزاء للمقرر.</p>}
          {configuredParts.map((part) => {
            const rows = getContentRows(courseInfo, topics, part);
            const hoursPerWeek = getPartDisplayHours(courseInfo, part);
            return (
              <div key={part}>
                <h3 className="sub-title">{part} - الأسابيع: {getPartWeeks(part)} | الساعات الأسبوعية: {hoursPerWeek}</h3>
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: "5%" }}>م</th>
                      <th style={{ width: "8%" }}>الأسبوع</th>
                      <th>الوحدة</th>
                      <th>المواضيع الفرعية</th>
                      <th style={{ width: "10%" }}>الساعات</th>
                      <th style={{ width: "15%" }}>مخرجات التعلم</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((topic, idx) => (
                      <tr key={topic.topic_id}>
                        <td>{idx + 1}</td>
                        <td>{topic.week}</td>
                        <td>{topic.is_exam ? (topic.exam_type === "midterm" ? "اختبار منتصف الفصل" : "الاختبار النهائي") : (topic.unit_name || "-")}</td>
                        <td>{(topic.subtopics || []).join("، ") || "-"}</td>
                        <td>{hoursPerWeek}</td>
                        <td>{(topic.outcome_ids || []).join("، ") || "-"}</td>
                      </tr>
                    ))}
                    <tr className="total-row">
                      <td colSpan={4}>الإجمالي</td>
                      <td colSpan={2}>{hoursPerWeek * getPartWeeks(part)} ساعة</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            );
          })}
        </section>

        {/* VII. الأنشطة والتكليفات */}
        <section>
          <h2 className="section-title">VII. الأنشطة والتكليفات</h2>
          {configuredParts.map((part) => {
            const partAssignments = assignments.filter((a) => a.part === part);
            const total = partAssignments.reduce((sum, a) => sum + (Number(a.grade) || 0), 0);
            return (
              <div key={part}>
                <h3 className="sub-title">{part}</h3>
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: "5%" }}>#</th>
                      <th>التكليف/النشاط</th>
                      <th style={{ width: "8%" }}>الأسبوع</th>
                      <th style={{ width: "8%" }}>الدرجة</th>
                      <th style={{ width: "15%" }}>مخرجات التعلم</th>
                      <th style={{ width: "10%" }}>إلزامي</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partAssignments.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: "center", color: "#94a3b8" }}>لم تتم إضافة تكليفات</td></tr>
                    ) : (
                      partAssignments.map((a, idx) => (
                        <tr key={a.assignment_id}>
                          <td>{idx + 1}</td>
                          <td>{a.title}</td>
                          <td>{a.week}</td>
                          <td>{a.grade}</td>
                          <td>{(a.clo_ids || []).join("، ") || "-"}</td>
                          <td>{a.is_mandatory ? "نعم" : "لا"}</td>
                        </tr>
                      ))
                    )}
                    <tr className="total-row"><td colSpan={3}>الإجمالي</td><td>{total}</td><td colSpan={2}></td></tr>
                  </tbody>
                </table>
              </div>
            );
          })}
        </section>

        {/* VIII. تقييم التعلم */}
        <section>
          <h2 className="section-title">VIII. تقييم التعلم خلال الفصل الدراسي</h2>
          <table>
            <thead>
              <tr>
                <th style={{ width: "5%" }}>#</th>
                <th>نشاط التقييم</th>
                <th style={{ width: "8%" }}>الأسبوع</th>
                <th style={{ width: "8%" }}>الدرجة</th>
                <th style={{ width: "12%" }}>النسبة</th>
                <th style={{ width: "18%" }}>مخرجات التعلم</th>
              </tr>
            </thead>
            <tbody>
              {assessmentRows.map((item: any, idx) => (
                <tr key={item.assessment_id}>
                  <td>{idx + 1}</td>
                  <td>{item.name}</td>
                  <td>{item.week || 0}</td>
                  <td>{item.grade || 0}</td>
                  <td>{item.percentage || 0}%</td>
                  <td>{(item.clo_ids || []).join("، ") || "-"}</td>
                </tr>
              ))}
              <tr className="total-row">
                <td colSpan={3}>الإجمالي</td>
                <td>{assessmentRows.reduce((sum: number, r: any) => sum + (Number(r.grade) || 0), 0)}</td>
                <td>{assessmentRows.reduce((sum: number, r: any) => sum + (Number(r.percentage) || 0), 0)}%</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* IX. مصادر التعلم */}
        <section>
          <h2 className="section-title">IX. مصادر التعلم</h2>
          {(["main", "support", "electronic"] as const).map((type) => {
            const items = references.filter((r) => r.type === type);
            return (
              <div key={type}>
                <h3 className="sub-title">
                  {type === "main" && "1) المراجع الرئيسية"}
                  {type === "support" && "2) المراجع المساعدة"}
                  {type === "electronic" && "3) مواد إلكترونية وإنترنت"}
                </h3>
                {items.length === 0 ? (
                  <p style={{ color: "#94a3b8", fontSize: 12.5 }}>لا توجد مراجع من هذا النوع.</p>
                ) : (
                  <table>
                    <thead><tr><th>العنوان</th><th>التفاصيل</th></tr></thead>
                    <tbody>
                      {items.map((ref) => (
                        <tr key={ref.reference_id}>
                          <td>{ref.title}</td>
                          <td>
                            {type === "electronic"
                              ? (ref.category === "website" ? "موقع إلكتروني" : ref.category === "journal" ? "مجلة علمية" : "مصدر ويب آخر") + (ref.url ? ` - ${ref.url}` : "")
                              : [ref.author, ref.year, ref.edition, ref.publisher, ref.country].filter(Boolean).join(" - ")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            );
          })}
        </section>

        {/* X. الضوابط والسياسات */}
        <section>
          <h2 className="section-title">X. الضوابط والسياسات المتبعة في المقرر</h2>
          {FIXED_POLICIES.map((p) => (
            <div key={p.policy_number} className="policy-box">
              <h4>{p.policy_number}. {p.title}</h4>
              <p>{p.content}</p>
            </div>
          ))}
          {policies.filter((p) => !p.is_fixed).map((p) => (
            <div key={p.policy_id} className="policy-box" style={{ borderColor: "#cbd5e1", background: "#f8fafc" }}>
              <h4>{p.policy_number}. {p.title}</h4>
              <p>{p.content}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
