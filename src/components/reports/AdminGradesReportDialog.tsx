import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Printer, FileText } from "lucide-react";
import { api } from "@/lib/api";
import { useReactToPrint } from "react-to-print";

// ✅ استيراد الشعارات
import uniLogo from "@/assets/logo.png"; 
const collegeLogosGlob = import.meta.glob('@/assets/colleges/*.png', { eager: true });

interface AdminGradesReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  collegeId: string | number;
  courseId: number;
  groupId: number;
  academicYear: string; // ✅ هذا المتغير سيحمل القيمة الديناميكية
}

export function AdminGradesReportDialog({
  isOpen, onClose, collegeId, courseId, groupId, academicYear
}: AdminGradesReportDialogProps) {
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // شعار الكلية
  const getCollegeLogoSrc = (id: string | number) => {
    const foundKey = Object.keys(collegeLogosGlob).find((key) => key.endsWith(`/${id}.png`));
    return foundKey ? (collegeLogosGlob[foundKey] as any).default : null;
  };
  const currentCollegeLogo = getCollegeLogoSrc(collegeId);

  // التاريخ والوقت الحالي للطباعة
  const currentDateTime = new Date().toLocaleString('ar-EG', {
    year: 'numeric', month: '2-digit', day: '2-digit', 
    hour: '2-digit', minute: '2-digit', hour12: true 
 });

  // إعداد الطباعة
  const handlePrint = useReactToPrint({
    // @ts-ignore
    contentRef: printRef,
    documentTitle: " ", 
  });

  useEffect(() => {
    if (isOpen && courseId && groupId) {
      fetchReport();
    }
  }, [isOpen, courseId, groupId]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/v1/colleges/${collegeId}/reports/group-grades`, {
        params: { course_id: courseId, group_id: groupId, academic_year: academicYear }
      });
      setData(res.data);
    } catch (error) {
      console.error("Failed to fetch grades report", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 gap-0 bg-background">
        
        {/* Header (Screen View) */}
        <DialogHeader className="p-6 border-b shadow-sm bg-card z-10">
          <div className="flex justify-between items-center">
            <div>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-primary">
                <FileText className="w-6 h-6" />
                تقرير درجات أعمال الفصل
              </DialogTitle>
              <DialogDescription>
                كشف تفصيلي للدرجات المرصودة للمجموعة والمقرر المختار.
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => handlePrint()} 
                disabled={loading || !data}
                className="gap-2 border-primary/20 hover:bg-primary/5 hover:text-primary transition-colors"
              >
                <Printer className="w-4 h-4" />
                طباعة الكشف
              </Button>
              <Button variant="ghost" onClick={onClose}>إغلاق</Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto p-6 bg-muted/10" dir="rtl">
          {loading ? (
            <div className="flex h-full items-center justify-center flex-col gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-muted-foreground font-medium">جاري إعداد التقرير...</p>
            </div>
          ) : data ? (
            
            // ================= PRINT AREA =================
            <div 
              ref={printRef} 
              className="bg-white p-8 rounded-xl shadow-sm border print:shadow-none print:border-none print:p-0 relative print:block print:bg-white"
            >
               <style type="text/css" media="print">
                {`
                  @page { 
                    size: A4 landscape; 
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
                  .print-content-wrapper {
                    padding: 5mm 10mm 0 10mm;
                  }
                  .footer-space { height: 50px; } 
                  thead { display: table-header-group; }
                  tfoot { display: table-footer-group; }
                  tr { page-break-inside: avoid; }
                  
                  table { background-color: transparent !important; width: 100%; border-collapse: collapse; }
                  th, td { text-align: center; border: 1px solid rgba(0,0,0,0.3); } 
                  
                  .no-print { display: none; }
                `}
              </style>

              <div className="print-container">
                <div className="print-content-wrapper">
                    
                  <table style={{ width: '100%', border: 'none', background: 'transparent' }}>
                    
                    <thead className="hidden print:table-header-group">
                      <tr><td style={{ height: '15px', border: 'none' }} colSpan={100}>&nbsp;</td></tr>
                    </thead>
                    
                    <tfoot className="hidden print:table-footer-group">
                      <tr><td className="footer-space" style={{border: 'none'}} colSpan={100}>&nbsp;</td></tr>
                    </tfoot>

                    <tbody>
                      <tr>
                        <td colSpan={100} style={{ border: 'none', padding: 0 }}>
                          
                          {/* ======================= HEADER ======================= */}
                          <div className="hidden print:flex justify-between items-start mb-2 border-b-2 border-black pb-2 pt-0 mt-0">
                            
                            {/* Logo Right */}
                            <div className="w-1/4 flex justify-start items-start">
                                <img src={uniLogo} alt="University Logo" className="h-24 w-auto object-contain" />
                            </div>

                            {/* Center Info */}
                            <div className="w-2/4 text-center pt-1">
                                <h2 className="text-lg font-bold leading-tight">الجمهورية اليمنية</h2>
                                <h2 className="text-lg font-bold leading-tight mb-2"> جامعة صنعاء </h2>
                                
                                <h1 className="text-xl font-black mb-2 inline-block px-6 py-1 bg-gray-100 border border-black/10 rounded-md">
                                    كشف درجات أعمال الفصل
                                </h1>
                                
                                <div className="text-xs font-bold mt-1 flex flex-row gap-4 items-center justify-center bg-white border border-dashed border-gray-300 py-1 px-2 rounded">
                                    {/* ✅ هنا يتم عرض المتغير الديناميكي academicYear */}
                                    <span>العام الجامعي: {academicYear}</span>
                                    
                                    <span className="text-gray-400">|</span>
                                    <span className="dir-ltr">{currentDateTime}</span>
                                </div>
                            </div>

                            {/* Logo Left */}
                            <div className="w-1/4 flex justify-end items-start">
                                {currentCollegeLogo ? (
                                  <img src={currentCollegeLogo} alt="College Logo" className="h-24 w-auto object-contain" />
                                ) : <div className="h-24 w-24"></div> }
                            </div>
                          </div>

                          {/* ======================= INFO BAR ======================= */}
                          <div className="hidden print:flex justify-between text-sm mb-4 font-bold px-3 py-1 bg-gray-100 border border-black/20 rounded shadow-sm items-center">
                                <div className="flex gap-4">
                                  <div className="flex gap-2">
                                    <span className="text-gray-600">المقرر الدراسي:</span>
                                    <span className="text-black">{data.meta.course_name}</span>
                                  </div>
                                  <div className="flex gap-2 border-r border-gray-400 pr-4">
                                    <span className="text-gray-600">المجموعة:</span>
                                    <span className="text-black">{data.meta.group_name}</span>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                   <span className="text-gray-600">عدد الطلاب:</span>
                                   <span className="text-black">{data.students.length}</span>
                                </div>
                          </div>

                          {/* ======================= THE TABLE ======================= */}
                          <div className="overflow-hidden rounded-none border-t border-x print:border-none">
                            <Table className="border-collapse w-full text-center bg-white text-sm">
                              <TableHeader>
                                <TableRow className="bg-gray-200 print:bg-gray-200 print:text-black border-b border-black/30 h-10">
                                  <TableHead className="w-[40px] text-center border border-black/30 font-extrabold text-black">#</TableHead>
                                  <TableHead className="w-[100px] text-center border border-black/30 font-extrabold text-black">رقم القيد</TableHead>
                                  <TableHead className="text-right border border-black/30 font-extrabold text-black px-4">اسم الطالب</TableHead>
                                  
                                  {data.columns.map((col: any) => (
                                    <TableHead key={col.assessment_id} className="text-center border border-black/30 font-extrabold text-black w-24">
                                      <div className="flex flex-col leading-tight py-1">
                                          <span>{col.name}</span>
                                          <span className="text-[10px] font-normal">({col.max_score})</span>
                                      </div>
                                    </TableHead>
                                  ))}
                                  
                                  <TableHead className="text-center border border-black/30 font-extrabold text-black bg-gray-300 w-20">المجموع</TableHead>
                                  <TableHead className="text-center border border-black/30 font-extrabold text-black w-20">حضور %</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {data.students.map((student: any, idx: number) => (
                                  <TableRow key={student.student_id} className="print:break-inside-avoid border-b border-black/30 h-9">
                                    <TableCell className="text-center font-bold border border-black/30 py-1">{idx + 1}</TableCell>
                                    <TableCell className="text-center border border-black/30 py-1 font-mono font-bold text-xs">{student.academic_number}</TableCell>
                                    <TableCell className="text-right border border-black/30 py-1 font-bold px-4">{student.full_name}</TableCell>
                                    
                                    {data.columns.map((col: any) => (
                                      <TableCell key={col.assessment_id} className="text-center border border-black/30 py-1 font-medium">
                                        {student.grades[col.assessment_id] !== undefined && student.grades[col.assessment_id] !== null 
                                          ? student.grades[col.assessment_id] 
                                          : '-'}
                                      </TableCell>
                                    ))}
                                    
                                    <TableCell className="text-center border border-black/30 py-1 font-black bg-gray-50 text-black">
                                      {student.total_score}
                                    </TableCell>

                                     <TableCell className="text-center border border-black/30 py-1 font-bold">
                                      {student.attendance_percent}%
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>

                          {/* ======================= FOOTER ======================= */}
                          <div className="hidden print:flex mt-12 justify-between px-16 text-sm page-break-inside-avoid">
                              <div className="text-center">
                                  <p className="mb-8 font-bold text-black text-base">أستاذ المقرر</p>
                                  <div className="border-b-2 border-black w-48"></div>
                              </div>
                              <div className="text-center">
                                  <p className="mb-8 font-bold text-black text-base">رئيس القسم</p>
                                  <div className="border-b-2 border-black w-48"></div>
                              </div>
                              <div className="text-center">
                                  <p className="mb-8 font-bold text-black text-base">يعتمد، عميد الكلية</p>
                                  <div className="border-b-2 border-black w-48"></div>
                              </div>
                          </div>

                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 flex flex-col items-center justify-center text-muted-foreground">
                <FileText className="w-12 h-12 opacity-20 mb-2" />
                <p>لا توجد بيانات متاحة.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}