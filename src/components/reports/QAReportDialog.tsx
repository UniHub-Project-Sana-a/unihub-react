import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Printer, CheckCircle2, Circle, Users, BrainCircuit, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { useReactToPrint } from "react-to-print";
import uniLogo from "@/assets/logo.png"; 

// ❌ تم حذف الاستيراد اليدوي القديم (collegeLogosGlob)

interface QAReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  collegeId: string | number;
  timetableId: number;
}

export function QAReportDialog({
  isOpen, onClose, collegeId, timetableId
}: QAReportDialogProps) {
  
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<any>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  
  const printRef = useRef<HTMLDivElement>(null);

  // ✅ تعريف رابط الصور الديناميكي
  // نستخدم رابط السيرفر + storage + colleges + id.png
  // أضفنا Date.now() لمنع الكاش (عشان لو غيرت الصورة تتحدث فوراً)
  const collegeLogoUrl = `http://192.168.0.124/unihub-api/storage/colleges/${collegeId}.png?t=${new Date().toDateString()}`;

  const handlePrint = useReactToPrint({
    // @ts-ignore
    contentRef: printRef,
    documentTitle: " ",
  });

  useEffect(() => {
    if (isOpen && timetableId) {
      fetchDetails();
    }
  }, [isOpen, timetableId]);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/v1/colleges/${collegeId}/reports/qa-detailed`, {
        params: { timetable_id: timetableId }
      });
      setReportData(res.data);
    } catch (error) {
      console.error("Failed to fetch QA details", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToSummary = () => setSelectedSessionId(null);

  const selectedSession = selectedSessionId 
    ? reportData?.sessions.find((s: any) => s.session_id === selectedSessionId) 
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[95vh] flex flex-col p-0 gap-0 bg-background">
        
        {/* Header (Screen) */}
        <DialogHeader className="p-6 border-b bg-card shadow-sm z-10">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
                {selectedSessionId && (
                    <Button variant="ghost" size="icon" onClick={handleBackToSummary}>
                        <ArrowRight className="w-5 h-5" />
                    </Button>
                )}
                <div>
                <DialogTitle className="text-xl font-bold flex items-center gap-2 text-primary">
                    <BrainCircuit className="w-6 h-6 text-primary" />
                    {selectedSessionId ? "تفاصيل الجلسة التفاعلية" : "تقرير الأداء الأكاديمي الشامل"}
                </DialogTitle>
                <DialogDescription>
                    {reportData?.meta?.course_name} - {reportData?.meta?.group_name}
                </DialogDescription>
                </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handlePrint()} disabled={loading || !reportData}>
                <Printer className="w-4 h-4 ml-2" /> طباعة
              </Button>
              <Button variant="ghost" onClick={onClose}>إغلاق</Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto p-6 bg-muted/10" dir="rtl">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
          ) : reportData ? (
            
            <div ref={printRef} className="bg-white p-8 rounded shadow-sm border print:border-none print:shadow-none print:p-0">
               <style type="text/css" media="print">
                {`
                  @page { size: A4; margin: 0; }
                  body { margin: 0; background-color: white !important; }
                  .print-container { padding: 10mm; direction: rtl; font-family: 'Tajawal', sans-serif; }
                  table { width: 100%; border-collapse: collapse; }
                  th, td { border: 1px solid #000; padding: 8px; text-align: center; }
                  .print-header { display: flex !important; justify-content: space-between; border-bottom: 2px solid black; padding-bottom: 10px; margin-bottom: 20px; }
                  .qa-bar { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                `}
              </style>

              <div className="print-container">
                
                {/* 1. الترويسة الرسمية مع الشعار الديناميكي */}
                <div className="hidden print-header items-start">
                    <div className="w-1/4"><img src={uniLogo} className="h-24 w-auto object-contain" /></div>
                    <div className="w-2/4 text-center pt-2">
                        <h2 className="text-lg font-bold">الجمهورية اليمنية - جامعة صنعاء</h2>
                        <h3 className="text-md font-bold mb-2">كلية {reportData.meta.department_name}</h3>
                        <h1 className="text-xl font-black bg-gray-100 border border-black px-4 py-1 inline-block rounded">
                            {selectedSessionId ? "تقرير تفصيلي لجلسة دراسية" : "تقرير الأداء الأكاديمي للمقرر"}
                        </h1>
                        <div className="mt-2 text-sm font-bold">العام الجامعي: {reportData.meta.academic_year}</div>
                    </div>
                    
                    {/* ✅ مكان عرض الشعار الديناميكي */}
                    <div className="w-1/4 flex justify-end">
                        <img 
                            src={collegeLogoUrl} 
                            alt="شعار الكلية" 
                            className="h-24 w-auto object-contain"
                            onError={(e) => {
                                // في حال فشل التحميل (الصورة غير موجودة)، نخفي العنصر أو نعرض صورة افتراضية
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    </div>
                </div>

                {/* 2. معلومات المقرر */}
                <div className="mb-6 border border-black rounded p-4 bg-gray-50 print:bg-transparent">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><span className="font-bold">المحاضر:</span> {reportData.meta.lecturer_name}</div>
                        <div><span className="font-bold">المقرر:</span> {reportData.meta.course_name} ({reportData.meta.course_code})</div>
                        <div><span className="font-bold">المجموعة:</span> {reportData.meta.group_name}</div>
                        <div><span className="font-bold">القسم:</span> {reportData.meta.department_name}</div>
                    </div>
                </div>

                {/* 3. المحتوى (نفس الكود السابق تماماً) */}
                {!selectedSessionId ? (
                    <div>
                        <h3 className="font-bold text-lg mb-4 border-r-4 border-primary pr-2">ملخص الجلسات المنفذة</h3>
                        <Table className="border-collapse w-full text-sm">
                            <TableHeader>
                                <TableRow className="bg-gray-100 print:bg-gray-200">
                                    <TableHead className="w-[50px] font-bold text-black border border-black">#</TableHead>
                                    <TableHead className="w-[120px] font-bold text-black border border-black">التاريخ</TableHead>
                                    <TableHead className="text-right font-bold text-black border border-black">الموضوع المشروح</TableHead>
                                    <TableHead className="w-[100px] font-bold text-black border border-black">الحضور</TableHead>
                                    <TableHead className="w-[150px] font-bold text-black border border-black">التفاعل (QA)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reportData.sessions.map((session: any, idx: number) => (
                                    <TableRow 
                                        key={session.session_id} 
                                        className="cursor-pointer hover:bg-gray-50 print:hover:bg-transparent"
                                        onClick={() => setSelectedSessionId(session.session_id)}
                                    >
                                        <TableCell className="font-bold border border-black text-center">{idx + 1}</TableCell>
                                        <TableCell className="border border-black text-center dir-ltr font-mono">{session.date}</TableCell>
                                        <TableCell className="border border-black text-right">{session.topics}</TableCell>
                                        <TableCell className="border border-black text-center font-bold">{session.attendance_count}</TableCell>
                                        <TableCell className="border border-black text-center">
                                            {session.has_qa ? (
                                                <div className="flex flex-col items-center">
                                                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none shadow-none text-[10px]">
                                                        تم التقييم
                                                    </Badge>
                                                    <span className="text-[10px] text-muted-foreground mt-1">انقر للتفاصيل</span>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground text-xs">-</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {reportData.sessions.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">لا توجد جلسات مسجلة.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    selectedSession && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center bg-primary/5 p-4 rounded border border-primary/20 print:border-black print:bg-transparent">
                                <div>
                                    <h3 className="font-bold text-lg text-primary print:text-black">تفاصيل الجلسة بتاريخ {selectedSession.date}</h3>
                                    <p className="text-sm mt-1"><strong>الموضوع:</strong> {selectedSession.topics}</p>
                                </div>
                                <div className="text-center bg-white p-2 rounded border shadow-sm print:shadow-none print:border-black">
                                    <span className="block text-xs text-muted-foreground">الحضور</span>
                                    <span className="block text-2xl font-bold">{selectedSession.attendance_count}</span>
                                </div>
                            </div>

                            {selectedSession.has_qa ? (
                                <div className="space-y-6">
                                    {selectedSession.qa_data.map((q: any, idx: number) => (
                                        <div key={idx} className="border rounded-lg p-4 print:border-black page-break-inside-avoid">
                                            <div className="flex justify-between mb-3 border-b pb-2">
                                                <h4 className="font-bold text-md">س{idx + 1}: {q.question_text}</h4>
                                                <Badge variant="outline">مشاركة: {q.total_responses}</Badge>
                                            </div>
                                            <div className="space-y-2">
                                                {q.options.map((opt: any, oIdx: number) => (
                                                    <div key={oIdx} className="flex items-center gap-3 text-sm">
                                                        <div className="w-1/2 flex items-center gap-2">
                                                            {opt.is_correct ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <div className="w-4 h-4" />}
                                                            <span className={opt.is_correct ? "font-bold text-green-700" : ""}>{opt.text}</span>
                                                        </div>
                                                        <div className="w-1/2 flex items-center gap-2">
                                                            <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                                                                <div 
                                                                    className={`h-full qa-bar ${opt.is_correct ? 'bg-green-500' : 'bg-gray-400'}`} 
                                                                    style={{ width: `${opt.percentage}%` }}
                                                                ></div>
                                                            </div>
                                                            <span className="w-12 text-right font-mono text-xs">{opt.percentage}%</span>
                                                            <span className="w-16 text-right text-xs text-muted-foreground">({opt.count} طالب)</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 border-2 border-dashed rounded text-muted-foreground">
                                    <BrainCircuit className="w-12 h-12 mx-auto opacity-20 mb-2" />
                                    <p>لم يتم طرح أسئلة تفاعلية في هذه الجلسة.</p>
                                </div>
                            )}
                        </div>
                    )
                )}

                {/* Footer Print */}
                <div className="hidden print:flex mt-12 justify-between px-16 text-sm">
                    <div className="text-center">
                        <p className="font-bold mb-8">توقيع المحاضر</p>
                        <div className="border-b-2 border-black w-40"></div>
                    </div>
                    <div className="text-center">
                        <p className="font-bold mb-8">رئيس قسم الجودة</p>
                        <div className="border-b-2 border-black w-40"></div>
                    </div>
                    <div className="text-center">
                        <p className="font-bold mb-8">يعتمد، عميد الكلية</p>
                        <div className="border-b-2 border-black w-40"></div>
                    </div>
                </div>

              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}