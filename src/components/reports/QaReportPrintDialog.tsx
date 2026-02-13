import { useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Printer, BarChart3, Star, Trophy, Medal } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { cn } from "@/lib/utils";

// ✅ استيراد شعار الجامعة (تأكد من المسار)
import uniLogo from "@/assets/logo.png";

// تعريف البيانات المطلوبة للتقرير
interface ReportData {
    summary: {
        total_submissions: number;
        overall_score: number;
        overall_percentage: number;
        target_percentage: number;
    };
    leaderboard: {
        name: string; 
        course: string; 
        eval_count: number; 
        score: number; 
        percentage: number; 
        rating_label: string; 
        is_current: boolean; 
    }[];
}

interface QaReportPrintDialogProps {
  isOpen: boolean;
  onClose: () => void;
  data: ReportData;
  campaignName: string;
  collegeId: number;
  reportType?: 'single' | 'full'; // فردي (لمحاضر واحد) أو كامل (Leaderboard)
  targetTimetableId?: string; // لمعرفة المحاضر المحدد إذا كان التقرير فردياً
}

export function QaReportPrintDialog({
  isOpen,
  onClose,
  data,
  campaignName,
  collegeId,
  reportType = 'full',
  targetTimetableId
}: QaReportPrintDialogProps) {
  
  const printRef = useRef<HTMLDivElement>(null);

  // رابط الشعار الديناميكي للكلية
  const currentCollegeLogo = collegeId 
    ? `http://192.168.0.124/unihub-api/storage/colleges/${collegeId}.png?t=${new Date().toDateString()}` 
    : null;

  const currentDateTime = new Date().toLocaleString('ar-EG', {
     year: 'numeric', month: '2-digit', day: '2-digit', 
     hour: '2-digit', minute: '2-digit', hour12: true 
  });

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `تقرير_${campaignName}`,
  });

  // تصفية البيانات حسب النوع المطلوب
  // إذا كان التقرير فردياً، نأخذ فقط المحاضر المحدد (is_current)
  // وإلا نأخذ القائمة كاملة
  const rowsToPrint = reportType === 'single' 
      ? data.leaderboard.filter(l => l.is_current) 
      : data.leaderboard;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 gap-0 bg-background" dir="rtl">
        
        {/* Header (UI Only - لا يظهر في الطباعة) */}
        <DialogHeader className="p-6 border-b shadow-sm bg-card z-10">
          <div className="flex justify-between items-center">
            <div>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-primary">
                <BarChart3 className="w-6 h-6" />
                معاينة تقرير الجودة ({reportType === 'single' ? 'مخصص' : 'شامل'})
              </DialogTitle>
              <DialogDescription>
                تقرير: {campaignName}
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="default" onClick={() => handlePrint()} className="gap-2">
                <Printer className="w-4 h-4" />
                طباعة التقرير
              </Button>
              <Button variant="ghost" onClick={onClose}>إغلاق</Button>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 bg-muted/10">
          <div ref={printRef} className="bg-white p-8 rounded-xl shadow-sm border print:shadow-none print:border-none print:p-0 relative print:block print:bg-white">
            
            <style type="text/css" media="print">
              {`
                /* ✅ 1. تصفير هوامش الصفحة لإخفاء ترويسة وتذييل المتصفح الافتراضية */
                @page { 
                    size: A4 portrait; 
                    margin: 0 !important; 
                }
            
                body { 
                    margin: 0; 
                    background-color: white !important; 
                    -webkit-print-color-adjust: exact !important; 
                    print-color-adjust: exact !important; 
                }
            
                /* ✅ 2. إضافة الهوامش للمحتوى نفسه بدلاً من الصفحة */
                .print-container { 
                    direction: rtl; 
                    font-family: 'Tajawal', 'Cairo', sans-serif; 
                    width: 100%; 
                    padding: 10mm; /* هذا هو الهامش الأبيض حول الورقة */
                }
            
                .print-content-wrapper { padding: 0; }
                
                thead { display: table-header-group; }
                tfoot { display: table-footer-group; }
                tr { page-break-inside: avoid; }
                
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { text-align: right; padding: 8px; border: 1px solid #ddd; font-size: 12px; }
                th { background-color: #f3f4f6 !important; font-weight: bold; text-align: center; }
                td.text-center { text-align: center; }
                
                /* ألوان خاصة للطباعة */
                .text-green-700 { color: #15803d !important; }
                .text-red-700 { color: #b91c1c !important; }
                .text-gold { color: #ca8a04 !important; }
                .text-silver { color: #4b5563 !important; }
                .text-bronze { color: #ea580c !important; }
                .bg-gray-50 { background-color: #f9fafb !important; }
              `}
            </style>

            <div className="print-container">
                
                {/* 1. الترويسة */}
                <div className="flex justify-between items-start mb-6 border-b-2 border-black pb-4">
                    <div className="w-1/4 flex justify-start"><img src={uniLogo} alt="University" className="h-20 w-auto object-contain" /></div>
                    <div className="w-2/4 text-center">
                        <h2 className="text-lg font-bold">الجمهورية اليمنية</h2>
                        <h2 className="text-lg font-bold mb-2">جامعة صنعاء</h2>
                        <h1 className="text-xl font-black mb-2 inline-block px-4 py-1 bg-gray-100 border border-black/10 rounded">تقرير تقييم الأداء الأكاديمي</h1>
                        <div className="text-xs font-bold mt-1 text-gray-600">الحملة: {campaignName} | تاريخ: {currentDateTime}</div>
                    </div>
                    <div className="w-1/4 flex justify-end">
                        {currentCollegeLogo ? <img src={currentCollegeLogo} alt="College" className="h-20 w-auto object-contain" /> : <div className="h-20 w-20 flex items-center justify-center border border-dashed border-gray-300 rounded text-xs text-gray-400">شعار الكلية</div>}
                    </div>
                </div>

                {/* ✅ 2. شريط الملخص (4 عناصر الآن) */}
                <div className="flex justify-between mb-6 bg-gray-50 border border-gray-200 p-3 rounded-lg print:border print:border-black/20">
                    
                    {/* إجمالي الاستجابات */}
                    <div className="text-center w-1/4 border-l border-gray-300">
                        <div className="text-xs text-gray-500 mb-1">إجمالي الاستجابات</div>
                        <div className="text-lg font-bold">{data.summary.total_submissions}</div>
                    </div>
                    
                    {/* المتوسط العام */}
                    <div className="text-center w-1/4 border-l border-gray-300">
                        <div className="text-xs text-gray-500 mb-1">المتوسط العام</div>
                        <div className="text-lg font-bold">{data.summary.overall_score} <span className="text-xs text-gray-400">/ 3</span></div>
                    </div>
                    
                    {/* نسبة الرضا */}
                    <div className="text-center w-1/4 border-l border-gray-300">
                        <div className="text-xs text-gray-500 mb-1">نسبة الرضا</div>
                        <div className={cn(
                            "text-lg font-bold", 
                            data.summary.overall_percentage >= data.summary.target_percentage ? "text-green-700 text-green-print" : "text-red-700 text-red-print"
                        )}>
                            {data.summary.overall_percentage}%
                        </div>
                    </div>

                    {/* ✅ الهدف (الجديد) */}
                    <div className="text-center w-1/4">
                        <div className="text-xs text-gray-500 mb-1">الهدف (المعيار)</div>
                        <div className="text-lg font-bold text-gray-700">{data.summary.target_percentage}%</div>
                    </div>

                </div>

                {/* 3. الجدول */}
                <table className="w-full border border-black/50">
                    <thead>
                        <tr className="bg-gray-200 text-black">
                            <th className="w-[50px]">#</th>
                            <th className="text-right">اسم المحاضر</th>
                            <th className="text-right">المقرر الدراسي</th>
                            <th className="w-[80px]">الاستجابات</th>
                            <th className="w-[80px]">المتوسط</th>
                            <th className="w-[80px]">النسبة</th>
                            <th className="w-[100px]">التقدير</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rowsToPrint.map((item, idx) => (
                            <tr key={idx} className="border-b border-gray-300">
                                <td className="text-center font-bold">{(reportType === 'single' || idx > 2) ? (idx + 1) : `★ ${idx + 1}`}</td>
                                <td className="font-bold">{item.name}</td>
                                <td>{item.course}</td>
                                <td className="text-center">{item.eval_count}</td>
                                <td className="text-center font-bold">{item.score}</td>
                                <td className="text-center font-mono">{item.percentage}%</td>
                                <td className="text-center">
                                    <span className={cn(
                                        "px-2 py-0.5 rounded text-xs font-bold border print:border-black/20",
                                        item.rating_label === 'ممتاز' ? "bg-green-50 text-green-700" :
                                        item.rating_label === 'جيد جداً' ? "bg-blue-50 text-blue-700" : 
                                        "bg-yellow-50 text-yellow-700"
                                    )}>
                                        {item.rating_label}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* 4. التذييل */}
                <div className="mt-16 flex justify-between px-10 text-sm font-bold page-break-inside-avoid">
                    <div className="text-center w-1/3">
                        <p className="mb-8 font-black text-base">رئيس قسم الجودة</p>
                        <div className="border-b-2 border-black w-40 mx-auto"></div>
                    </div>
                    <div className="text-center w-1/3">
                        <p className="mb-8 font-black text-base">عميد الكلية</p>
                        <div className="border-b-2 border-black w-40 mx-auto"></div>
                    </div>
                </div>

            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}