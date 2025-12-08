import { useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Printer, DollarSign, FileText } from "lucide-react";
import { useReactToPrint } from "react-to-print";

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
}

export function InstructorsReportDialog({
  isOpen,
  onClose,
  instructors,
  academicYear,
  departmentName,
  selectedMonth,
  mode = 'financial'
}: InstructorsReportDialogProps) {
  
  const printRef = useRef<HTMLDivElement>(null);
  const bgImage = "/images/report-bg.png"; 

  const handlePrint = useReactToPrint({
    // @ts-ignore
    contentRef: printRef,
    documentTitle: `تقرير_${mode === 'financial' ? 'المستحقات' : 'الأداء'}_${academicYear}`,
  });

  const totalAmountSum = instructors.reduce((sum, i) => sum + (Number(i.total_amount) || 0), 0);
  const totalHoursSum = instructors.reduce((sum, i) => sum + (i.total_hours || 0), 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 gap-0 bg-background">
        
        {/* Header */}
        <DialogHeader className="p-6 border-b shadow-sm bg-card z-10">
          <div className="flex justify-between items-center">
            <div>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-primary">
                {mode === 'financial' ? <DollarSign className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                {mode === 'financial' ? 'تقرير المستحقات المالية' : 'تقرير الأداء الأكاديمي'}
              </DialogTitle>
              <p className="text-muted-foreground mt-1 text-sm">
                معاينة قبل الطباعة | عدد المحاضرين: {instructors.length}
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
            className="bg-white p-8 rounded-xl shadow-sm border print:shadow-none print:border-none print:p-0 relative print:block print:bg-transparent"
          >
            <style type="text/css" media="print">
              {`
                /* 1. تصفير الهوامش لتمكين الخلفية الكاملة */
                @page { 
                  size: A4 portrait; 
                  margin: 0mm; 
                }
                body { 
                  margin: 0;
                  -webkit-print-color-adjust: exact !important; 
                  print-color-adjust: exact !important; 
                }

                /* 2. الخلفية الثابتة */
                .print-watermark-container {
                  position: fixed;
                  top: 0;
                  left: 0;
                  width: 210mm;
                  height: 297mm;
                  z-index: -10;
                  overflow: hidden;
                }
                .print-watermark-img {
                  width: 100%;
                  height: 100%;
                  object-fit: fill;
                }

                /* 3. حاوية المحتوى */
                .print-content-wrapper {
                  position: relative;
                  z-index: 5;
                  width: 100%;
                  direction: rtl;
                  font-family: 'Tajawal', 'Cairo', sans-serif;
                  
                  /* هوامش جانبية فقط */
                  padding-left: 50px;    
                  padding-right: 50px;   
                }

                /* 4. مسافات الحجز (Spacer Rows) */
                .header-space { height: 160px; } /* مسافة للترويسة */
                .footer-space { height: 100px; } /* مسافة للتذييل */

                /* تكرار الرأس والتذييل */
                thead { display: table-header-group; }
                tfoot { display: table-footer-group; }
                tr { page-break-inside: avoid; }
                
                table { background-color: transparent !important; width: 100%; border-collapse: collapse; }
                th, td { text-align: right; font-size: 12px; padding: 6px; }
                th.text-center, td.text-center { text-align: center; }
                
                .no-print { display: none; }
              `}
            </style>

            {/* الخلفية الثابتة */}
            <div className="print-watermark-container hidden print:block">
              <img src={bgImage} className="print-watermark-img" alt="Letterhead" />
            </div>

            <div className="print-container">
              <div className="print-content-wrapper">
                
                {/* الجدول الرئيسي الكبير */}
                <table style={{ width: '100%', border: 'none' }}>
                  
                  {/* مساحة الترويسة (Spacer) */}
                  <thead className="hidden print:table-header-group">
                    <tr><td className="header-space" colSpan={10}>&nbsp;</td></tr>
                  </thead>

                  {/* مساحة التذييل (Spacer) */}
                  <tfoot className="hidden print:table-footer-group">
                    <tr><td className="footer-space" colSpan={10}>&nbsp;</td></tr>
                  </tfoot>

                  {/* جسم الصفحة */}
                  <tbody>
                    <tr>
                      <td colSpan={10}>
                        
                        {/* عنوان التقرير */}
                        <div className="hidden print:block text-center mb-6">
                          <h1 className="text-2xl font-bold text-black/90 mb-4 border-b-2 border-black/10 pb-2 inline-block px-8">
                            {mode === 'financial' ? 'كشف استحقاق الساعات التدريسية' : 'تقرير الأداء الأكاديمي'}
                          </h1>
                          
                          <div className="flex justify-center items-center mt-4 bg-white/90 border border-black/10 rounded-lg py-2 px-8 mx-auto w-fit shadow-sm">
                            <div className="flex flex-col items-center px-6">
                              <span className="text-[10px] text-gray-500 mb-0.5">العام الجامعي</span>
                              <span className="font-bold text-sm">{academicYear === 'all' ? 'شامل' : academicYear}</span>
                            </div>
                            <div className="h-8 w-px bg-gray-300 mx-2"></div>
                            <div className="flex flex-col items-center px-6">
                              <span className="text-[10px] text-gray-500 mb-0.5">فترة التقرير (الشهر)</span>
                              <span className="font-bold text-sm">{selectedMonth}</span>
                            </div>
                          </div>
                        </div>

                                                {/* جدول البيانات الفعلي */}
                        <div className="border rounded-lg overflow-hidden print:border-black/20 bg-white/95">
                          <Table className="border-collapse w-full text-right text-sm">
                            <TableHeader>
                              <TableRow className="bg-muted/50 print:bg-gray-200 print:text-black">
                                <TableHead className="text-center border print:border-black font-bold text-black w-[40px]">#</TableHead>
                                <TableHead className="text-center border print:border-black font-bold text-black">الاسم</TableHead>
                                {/* <TableHead className="text-center border print:border-black font-bold text-black w-[80px]">الرتبة</TableHead> */}
                                <TableHead className="text-center border print:border-black font-bold text-black">القسم</TableHead>
                                
                                <TableHead className="text-center border print:border-black font-bold text-black bg-blue-50/30 w-[60px]">الساعات</TableHead>
                                
                                {mode === 'financial' && (
                                  <>
                                    <TableHead className="text-center border print:border-black font-bold text-black bg-blue-50/30">السعر</TableHead>
                                    <TableHead className="text-center border print:border-black font-bold text-black">الأساسي</TableHead>
                                    <TableHead className="text-center border print:border-black font-bold text-black text-xs w-[70px]">إضافي</TableHead>
                                    <TableHead className="text-center border print:border-black font-bold text-black text-xs w-[70px]">استقطاع</TableHead>
                                    <TableHead className="text-center border print:border-black font-bold text-black bg-green-50/30 text-lg">الصافي</TableHead>
                                  </>
                                )}

                                {mode === 'performance' && (
                                  <>
                                    <TableHead className="text-center border print:border-black font-bold text-black">المعتمد</TableHead>
                                    <TableHead className="text-center border print:border-black font-bold text-black">المنفذ</TableHead>
                                    <TableHead className="text-center border print:border-black font-bold text-black w-[70px]">الإنجاز</TableHead>
                                  </>
                                )}

                                {mode === 'financial' && (
                                   <TableHead className="text-center border print:border-black font-bold text-black w-[100px]">التوقيع</TableHead>
                                )}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {instructors.map((inst, idx) => (
                                <TableRow key={inst.id} className="print:break-inside-avoid">
                                  <TableCell className="text-center border print:border-black/20">{idx + 1}</TableCell>
                                  <TableCell className="border print:border-black/20 font-medium">{inst.name}</TableCell>
                                  {/* <TableCell className="text-center border print:border-black/20 text-xs">{inst.academic_rank}</TableCell> */}
                                  <TableCell className="text-center border print:border-black/20 text-xs">{inst.department}</TableCell>
                                  
                                  <TableCell className="text-center border print:border-black/20 font-bold font-mono">
                                    {inst.total_hours || 0}
                                  </TableCell>
                                  
                                  {/* أعمدة الوضع المالي */}
                                  {mode === 'financial' && (
                                    <>
                                      <TableCell className="text-center border print:border-black/20 font-mono text-xs">
                                        {(inst.hourly_price || 0).toLocaleString()}
                                      </TableCell>
                                      
                                      {/* الأساسي */}
                                      <TableCell className="text-center border print:border-black/20 font-mono font-semibold">
                                        {(inst.base_amount || 0).toLocaleString()}
                                      </TableCell>

                                      {/* إضافي (مكافآت) */}
                                      <TableCell className="text-center border print:border-black/20 font-mono text-xs text-green-700">
                                        {(inst.total_bonuses || 0) > 0 ? `+${(inst.total_bonuses || 0).toLocaleString()}` : '-'}
                                      </TableCell>

                                      {/* استقطاع (خصم + ضرائب) */}
                                      <TableCell className="text-center border print:border-black/20 font-mono text-xs text-red-700">
                                        {((inst.total_deductions || 0) + (inst.tax_amount || 0)) > 0 
                                          ? `-${((inst.total_deductions || 0) + (inst.tax_amount || 0)).toLocaleString()}` 
                                          : '-'}
                                      </TableCell>

                                      {/* الصافي النهائي */}
                                      <TableCell className="text-center border print:border-black/20 font-bold text-green-800 bg-green-50/10 text-lg">
                                        {(inst.total_amount || 0).toLocaleString()}
                                      </TableCell>
                                      
                                      {/* مكان التوقيع */}
                                      <TableCell className="text-center border print:border-black/20"></TableCell>
                                    </>
                                  )}

                                  {/* أعمدة وضع الأداء */}
                                  {mode === 'performance' && (
                                    <>
                                      <TableCell className="text-center border print:border-black/20">{inst.approved}</TableCell>
                                      <TableCell className="text-center border print:border-black/20">{inst.delivered}</TableCell>
                                      <TableCell className="text-center border print:border-black/20 text-xs font-bold">
                                        {((inst.delivered / (inst.approved || 1)) * 100).toFixed(0)}%
                                      </TableCell>
                                    </>
                                  )}
                                </TableRow>
                              ))}
                              
                              {/* سطر الإجمالي (للمالية فقط) */}
                              {mode === 'financial' && (
                                <TableRow className="bg-muted/30 print:bg-gray-100 font-bold print:break-inside-avoid">
                                  <TableCell colSpan={4} className="text-center border print:border-black text-lg">الإجمالي الكلي</TableCell>
                                  <TableCell className="text-center border print:border-black font-mono text-lg">
                                    {totalHoursSum || 0}
                                  </TableCell>
                                  <TableCell className="border print:border-black" colSpan={3}></TableCell> {/* دمجنا الخلايا الفارغة */}
                                  
                                  <TableCell className="text-center border print:border-black text-lg font-mono bg-green-100/50">
                                    {(totalAmountSum || 0).toLocaleString()} ر.ي
                                  </TableCell>
                                  
                                  <TableCell className="border print:border-black"></TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </div>

                        {/* التذييل (التوقيعات) */}
                        <div className="hidden print:flex mt-16 justify-between px-10 text-sm font-bold page-break-inside-avoid">
                            {mode === 'financial' ? (
                                <>
                                   <div className="text-center w-1/3"><p className="mb-10">أمين الصندوق</p><div className="border-b border-black border-dashed opacity-50"></div></div>
                                   <div className="text-center w-1/3"><p className="mb-10">المدير المالي</p><div className="border-b border-black border-dashed opacity-50"></div></div>
                                   <div className="text-center w-1/3"><p className="mb-10">عميد الكلية</p><div className="border-b border-black border-dashed opacity-50"></div></div>
                                </>
                            ) : (
                                <>
                                   <div className="text-center w-1/3"><p className="mb-10">رئيس القسم</p><div className="border-b border-black border-dashed opacity-50"></div></div>
                                   <div className="text-center w-1/3"><p className="mb-10">عميد الكلية</p><div className="border-b border-black border-dashed opacity-50"></div></div>
                                </>
                            )}
                        </div>
                        
                        <div className="hidden print:block mt-8 text-center text-[10px] text-gray-400">
                            تم استخراج هذا الكشف إلكترونياً من نظام UniHub بتاريخ {new Date().toLocaleDateString('ar-EG')}
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