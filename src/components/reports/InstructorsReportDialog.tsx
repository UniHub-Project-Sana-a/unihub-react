import { useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Printer, DollarSign, FileText } from "lucide-react";
import { useReactToPrint } from "react-to-print";

// ✅ 1. استيراد شعار الجامعة الثابت
import uniLogo from "@/assets/logo.png"; 

interface InstructorData {
  id: number;
  name: string;
  academic_rank: string;
  department: string;
  total_hours: number;
  hourly_price: number;
  total_amount: number;
  delivered: number;
  approved: number;
  compliance_rate?: number;
  base_amount?: number;
  total_bonuses?: number;
  total_deductions?: number;
  tax_amount?: number; 
}

interface InstructorsReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  instructors: InstructorData[];
  academicYear: string;
  selectedMonth: string;
  departmentName: string;
  mode?: 'financial' | 'performance';
  // ✅ collegeId ضروري لجلب الشعار
  collegeId?: string | number;
}

export function InstructorsReportDialog({
  isOpen,
  onClose,
  instructors,
  academicYear,
  departmentName,
  selectedMonth,
  mode = 'financial',
  collegeId
}: InstructorsReportDialogProps) {
  
  const printRef = useRef<HTMLDivElement>(null);

  // ✅ 2. رابط الشعار الديناميكي (مع منع الكاش)
  const currentCollegeLogo = collegeId 
    ? `http://192.168.0.124/unihub-api/storage/colleges/${collegeId}.png?t=${new Date().toDateString()}` 
    : null;

  // مراقبة للكونسول للتأكد (اختياري)
  useEffect(() => {
    if (isOpen) {
        console.log("Current College ID received:", collegeId); 
    }
  }, [isOpen, collegeId]);

  // التاريخ والوقت الحالي
  const currentDateTime = new Date().toLocaleString('ar-EG', {
     year: 'numeric', month: '2-digit', day: '2-digit', 
     hour: '2-digit', minute: '2-digit', hour12: true 
  });

  const handlePrint = useReactToPrint({
    // @ts-ignore
    contentRef: printRef,
    documentTitle: " ", 
  });

  const totalAmountSum = instructors.reduce((sum, i) => sum + (Number(i.total_amount) || 0), 0);
  const totalHoursSum = instructors.reduce((sum, i) => sum + (i.total_hours || 0), 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 gap-0 bg-background">
        
        {/* Header (UI Only) */}
        <DialogHeader className="p-6 border-b shadow-sm bg-card z-10">
          <div className="flex justify-between items-center">
            <div>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-primary">
                {mode === 'financial' ? <DollarSign className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                {mode === 'financial' ? 'تقرير المستحقات المالية' : 'تقرير الأداء الأكاديمي'}
              </DialogTitle>
              
              <DialogDescription>
                معاينة التقرير قبل الطباعة.
              </DialogDescription>

              <p className="text-muted-foreground mt-1 text-sm">
                عدد المحاضرين: {instructors.length} | القسم: {departmentName}
              </p>
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
          
          {/* Print Container */}
          <div 
            ref={printRef} 
            className="bg-white p-8 rounded-xl shadow-sm border print:shadow-none print:border-none print:p-0 relative print:block print:bg-white"
          >
            <style type="text/css" media="print">
              {`
                @page { 
                  size: A4 portrait; 
                  margin: 0; 
                }
                body { 
                  margin: 0;
                  background-color: white !important;
                  -webkit-print-color-adjust: exact !important; 
                  print-color-adjust: exact !important; 
                }

                .print-container {
                  direction: rtl;
                  font-family: 'Tajawal', 'Cairo', sans-serif;
                  width: 100%;
                }

                /* هامش علوي بسيط */
                .print-content-wrapper {
                  padding: 5mm 10mm 0 10mm;   
                }

                .footer-space { height: 100px; } 

                thead { display: table-header-group; }
                tfoot { display: table-footer-group; }
                tr { page-break-inside: avoid; }
                
                table { background-color: transparent !important; width: 100%; border-collapse: collapse; }
                th, td { text-align: right; font-size: 12px; padding: 6px; }
                th.text-center, td.text-center { text-align: center; }
                
                .no-print { display: none; }
              `}
            </style>

            <div className="print-container">
              <div className="print-content-wrapper">
                
                {/* الجدول الرئيسي الكبير */}
                <table style={{ width: '100%', border: 'none' }}>
                  
                  {/* مساحة الترويسة المخفية للصفحات التالية */}
                  <thead className="hidden print:table-header-group">
                    <tr><td style={{ height: '15px' }} colSpan={10}>&nbsp;</td></tr>
                  </thead>

                  {/* مساحة التذييل */}
                  <tfoot className="hidden print:table-footer-group">
                    <tr><td className="footer-space" colSpan={10}>&nbsp;</td></tr>
                  </tfoot>

                  {/* جسم الصفحة */}
                  <tbody>
                    <tr>
                      <td colSpan={10}>
                        
                        {/* ======================= HEADER ======================= */}
                        <div className="hidden print:flex justify-between items-start mb-2 border-b-2 border-black pb-2 pt-0 mt-0">
                            
                            {/* اليمين: شعار الجامعة */}
                            <div className="w-1/4 flex justify-start items-start">
                                <img src={uniLogo} alt="University Logo" className="h-24 w-auto object-contain" />
                            </div>

                            {/* المنتصف */}
                            <div className="w-2/4 text-center pt-1">
                                <h2 className="text-lg font-bold leading-tight">الجمهورية اليمنية</h2>
                                <h2 className="text-lg font-bold leading-tight mb-2"> جامعة صنعاء </h2>
                                
                                <h1 className="text-xl font-black mb-2 inline-block px-6 py-1 bg-gray-100 border border-black/10 rounded-md">
                                    {mode === 'financial' ? 'كشف استحقاق الساعات التدريسية' : 'تقرير الأداء الأكاديمي'}
                                </h1>
                                
                                <div className="text-xs font-bold mt-1 flex flex-row gap-4 items-center justify-center bg-white border border-dashed border-gray-300 py-1 px-2 rounded">
                                    <span>العام الجامعي: {academicYear === 'all' ? 'شامل' : academicYear}</span>
                                    <span className="text-gray-400">|</span>
                                    <span>الشهر: {selectedMonth}</span>
                                    <span className="text-gray-400">|</span>
                                    <span>تاريخ الطباعة: {currentDateTime}</span>
                                </div>
                            </div>

                            {/* اليسار: شعار الكلية (الديناميكي) */}
                            <div className="w-1/4 flex justify-end items-start">
                                {currentCollegeLogo ? (
                                  <img 
                                      src={currentCollegeLogo} 
                                      alt="College Logo" 
                                      className="h-24 w-auto object-contain"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                      }} 
                                  />
                                ) : (
                                  <div className="h-24 w-24 flex items-center justify-center border border-dashed border-gray-300 rounded text-xs text-gray-400">
                                     شعار الكلية
                                  </div> 
                                )}
                            </div>
                        </div>
                        
                        {/* شريط المعلومات */}
                        <div className="hidden print:flex justify-between text-sm mb-4 font-bold px-3 py-1 bg-gray-100 border border-black/20 rounded shadow-sm items-center">
                              <div className="flex gap-2">
                                <span className="text-gray-600">القسم / التخصص:</span>
                                <span className="text-black">{departmentName}</span>
                              </div>
                              <div className="flex gap-2">
                                <span className="text-gray-600">عدد المحاضرين:</span>
                                <span className="text-black">{instructors.length}</span>
                              </div>
                        </div>
                        {/* ==================================================== */}

                        {/* جدول البيانات */}
                        <div className="border-t border-x print:border-black/30 overflow-hidden bg-white/95 rounded-none">
                          <Table className="border-collapse w-full text-right text-sm">
                            <TableHeader>
                              <TableRow className="bg-gray-200 print:bg-gray-200 print:text-black border-b border-black/30 h-10">
                                <TableHead className="text-center border-l border-black/30 font-extrabold text-black w-[40px]">#</TableHead>
                                <TableHead className="text-center border-l border-black/30 font-extrabold text-black">الاسم</TableHead>
                                <TableHead className="text-center border-l border-black/30 font-extrabold text-black">القسم</TableHead>
                                <TableHead className="text-center border-l border-black/30 font-extrabold text-black bg-blue-50/30 w-[60px]">الساعات</TableHead>
                                
                                {mode === 'financial' && (
                                  <>
                                    <TableHead className="text-center border-l border-black/30 font-extrabold text-black bg-blue-50/30">السعر</TableHead>
                                    <TableHead className="text-center border-l border-black/30 font-extrabold text-black">الأساسي</TableHead>
                                    <TableHead className="text-center border-l border-black/30 font-extrabold text-black text-xs w-[70px]">إضافي</TableHead>
                                    <TableHead className="text-center border-l border-black/30 font-extrabold text-black text-xs w-[70px]">استقطاع</TableHead>
                                    <TableHead className="text-center border-black/30 font-extrabold text-black bg-green-50/30 text-lg">الصافي</TableHead>
                                  </>
                                )}

                                {mode === 'performance' && (
                                  <>
                                    <TableHead className="text-center border-l border-black/30 font-extrabold text-black">المعتمد</TableHead>
                                    <TableHead className="text-center border-l border-black/30 font-extrabold text-black">المنفذ</TableHead>
                                    <TableHead className="text-center border-black/30 font-extrabold text-black w-[70px]">الإنجاز</TableHead>
                                  </>
                                )}

                                {mode === 'financial' && (
                                   <TableHead className="text-center border-l border-black/30 font-extrabold text-black w-[100px]">التوقيع</TableHead>
                                )}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {instructors.map((inst, idx) => (
                                <TableRow key={inst.id} className="print:break-inside-avoid border-b border-black/30 h-9">
                                  <TableCell className="text-center border-l border-black/30 font-bold">{idx + 1}</TableCell>
                                  <TableCell className="border-l border-black/30 font-bold">{inst.name}</TableCell>
                                  <TableCell className="text-center border-l border-black/30 text-xs font-bold">{inst.department}</TableCell>
                                  <TableCell className="text-center border-l border-black/30 font-extrabold font-mono">
                                    {inst.total_hours || 0}
                                  </TableCell>
                                  
                                  {mode === 'financial' && (
                                    <>
                                      <TableCell className="text-center border-l border-black/30 font-mono text-xs font-bold">
                                        {(inst.hourly_price || 0).toLocaleString()}
                                      </TableCell>
                                      <TableCell className="text-center border-l border-black/30 font-mono font-bold">
                                        {(inst.base_amount || 0).toLocaleString()}
                                      </TableCell>
                                      <TableCell className="text-center border-l border-black/30 font-mono text-xs text-green-700 font-bold">
                                        {(inst.total_bonuses || 0) > 0 ? `+${(inst.total_bonuses || 0).toLocaleString()}` : '-'}
                                      </TableCell>
                                      <TableCell className="text-center border-l border-black/30 font-mono text-xs text-red-700 font-bold">
                                        {((inst.total_deductions || 0) + (inst.tax_amount || 0)) > 0 
                                          ? `-${((inst.total_deductions || 0) + (inst.tax_amount || 0)).toLocaleString()}` 
                                          : '-'}
                                      </TableCell>
                                      <TableCell className="text-center border-black/30 font-black text-black bg-gray-50 text-base">
                                        {(inst.total_amount || 0).toLocaleString()}
                                      </TableCell>
                                      <TableCell className="text-center border-l border-black/30"></TableCell>
                                    </>
                                  )}

                                  {mode === 'performance' && (
                                    <>
                                      <TableCell className="text-center border-l border-black/30 font-bold">{inst.approved}</TableCell>
                                      <TableCell className="text-center border-l border-black/30 font-bold">{inst.delivered}</TableCell>
                                      <TableCell className="text-center border-black/30 text-xs font-black">
                                        {((inst.delivered / (inst.approved || 1)) * 100).toFixed(0)}%
                                      </TableCell>
                                    </>
                                  )}
                                </TableRow>
                              ))}
                              
                              {mode === 'financial' && (
                                <TableRow className="bg-gray-100 print:bg-gray-200 font-bold print:break-inside-avoid border-t-2 border-black/50">
                                  <TableCell colSpan={4} className="text-center border-l border-black/30 text-lg font-black">الإجمالي الكلي</TableCell>
                                  <TableCell className="text-center border-l border-black/30 font-mono text-lg font-black">
                                    {totalHoursSum || 0}
                                  </TableCell>
                                  <TableCell className="border-l border-black/30" colSpan={3}></TableCell>
                                  <TableCell className="text-center border-black/30 text-lg font-black font-mono">
                                    {(totalAmountSum || 0).toLocaleString()} ر.ي
                                  </TableCell>
                                  <TableCell className="border-l border-black/30"></TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </div>

                        {/* التذييل */}
                        <div className="hidden print:flex mt-12 justify-between px-10 text-sm font-bold page-break-inside-avoid">
                            {mode === 'financial' ? (
                                <>
                                   <div className="text-center w-1/3"><p className="mb-8 font-black text-base">أمين الصندوق</p><div className="border-b-2 border-black w-32 mx-auto"></div></div>
                                   <div className="text-center w-1/3"><p className="mb-8 font-black text-base">المدير المالي</p><div className="border-b-2 border-black w-32 mx-auto"></div></div>
                                   <div className="text-center w-1/3"><p className="mb-8 font-black text-base">عميد الكلية</p><div className="border-b-2 border-black w-32 mx-auto"></div></div>
                                </>
                            ) : (
                                <>
                                   <div className="text-center w-1/3"><p className="mb-8 font-black text-base">رئيس القسم</p><div className="border-b-2 border-black w-40 mx-auto"></div></div>
                                   <div className="text-center w-1/3"><p className="mb-8 font-black text-base">عميد الكلية</p><div className="border-b-2 border-black w-40 mx-auto"></div></div>
                                </>
                            )}
                        </div>
                        
                      </td>
                    </tr>
                  </tbody>
                </table>

              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}