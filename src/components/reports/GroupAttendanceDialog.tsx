import { useEffect, useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { Loader2, Printer, FileText } from "lucide-react";
import { useReactToPrint } from "react-to-print";

// ✅ استيراد شعار الجامعة الثابت
import uniLogo from "@/assets/logo.png"; 

// ✅✅ حل مشكلة الصور الديناميكية داخل src:
// نقوم باستيراد جميع صور الكليات دفعة واحدة عند التحميل
// هذا السطر يخبر React أن يجهز جميع الصور الموجودة في هذا المجلد
const collegeLogosGlob = import.meta.glob('@/assets/colleges/*.png', { eager: true });

interface GroupAttendanceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: number;
  groupName: string;
  courseId: number;
  courseName: string;
  collegeId: string | number;
  academicYear: string;
}

interface StudentStats {
  student_id: number;
  name: string;
  academic_number: string;
  total_sessions_approved: number;
  total_sessions_executed: number;
  present_count: number;
  absent_count: number;
  attendance_percentage: number;
}

export function GroupAttendanceDialog({
  isOpen,
  onClose,
  groupId,
  groupName,
  courseId,
  courseName,
  collegeId,
  academicYear
}: GroupAttendanceDialogProps) {
  
  const [students, setStudents] = useState<StudentStats[]>([]);
  const [loading, setLoading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  
  // ✅ دالة لجلب مسار صورة الكلية الصحيح من الملفات المستوردة
  const getCollegeLogoSrc = (id: string | number) => {
    // نبحث عن المفتاح الذي ينتهي بـ /id.png
    const foundKey = Object.keys(collegeLogosGlob).find((key) => key.endsWith(`/${id}.png`));
    // إذا وجدنا الصورة نرجع مسارها، وإلا نرجع null
    return foundKey ? (collegeLogosGlob[foundKey] as any).default : null;
  };

  // تحديد شعار الكلية الحالي
  const currentCollegeLogo = getCollegeLogoSrc(collegeId);

  const currentDateTime = new Date().toLocaleString('ar-EG', {
     year: 'numeric', month: '2-digit', day: '2-digit', 
     hour: '2-digit', minute: '2-digit', hour12: true 
  });

  const handlePrint = useReactToPrint({
    // @ts-ignore
    contentRef: printRef, 
    documentTitle: " ", 
  });

  useEffect(() => {
    if (isOpen && groupId && courseId) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const res = await api.get(`/v1/colleges/${collegeId}/reports/group-students-attendance`, {
            params: {
              course_id: courseId,
              group_id: groupId,
              academic_year: academicYear === "all" ? null : academicYear
            }
          });
          setStudents(res.data.data || []);
        } catch (error) {
          console.error("Error fetching student attendance", error);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [isOpen, groupId, courseId, academicYear, collegeId]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 gap-0 bg-background">
        
        {/* Header - يظهر فقط في الشاشة */}
        <DialogHeader className="p-6 border-b shadow-sm bg-card z-10">
          <div className="flex justify-between items-center">
            <div>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-primary">
                <FileText className="w-6 h-6" />
                كشف تفصيلي للمجموعة: {groupName}
              </DialogTitle>
              <DialogDescription>
                تقرير تفصيلي لحضور وغياب الطلاب في المقرر المحدد.
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => handlePrint()} 
                disabled={loading || students.length === 0}
                className="gap-2 border-primary/20 hover:bg-primary/5 hover:text-primary transition-colors"
              >
                <Printer className="w-4 h-4" />
                طباعة الكشف
              </Button>
              <Button variant="ghost" onClick={onClose}>إغلاق</Button>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 bg-muted/10">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full animate-in fade-in">
              <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground font-medium">جاري تحليل بيانات الحضور...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
              <FileText className="w-12 h-12 opacity-20" />
              <p>لا توجد بيانات طلاب مسجلة لهذه المجموعة.</p>
            </div>
          ) : (
            
            /* ================= PRINT AREA ================= */
            <div 
              ref={printRef} 
              className="bg-white p-8 rounded-xl shadow-sm border print:shadow-none print:border-none print:p-0 relative print:block print:bg-white"
            >
              <style type="text/css" media="print">
                {`
                  @page { 
                    size: A4 portrait; 
                    margin: 0; /* ✅ هامش الصفحة صفر */
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
                  
                  /* ✅ تقليل الهامش العلوي لأقل درجة ممكنة */
                  .print-content-wrapper {
                    padding: 5mm 10mm 0 10mm; /* 5mm فقط من الأعلى */
                  }

                  .footer-space { height: 50px; } 

                  thead { display: table-header-group; }
                  tfoot { display: table-footer-group; }
                  tr { page-break-inside: avoid; }
                  
                  table { background-color: transparent !important; width: 100%; }
                  th, td { text-align: right; }
                  th.text-center, td.text-center { text-align: center; }
                  
                  .no-print { display: none; }
                `}
              </style>

              <div className="print-container">
                <div className="print-content-wrapper">
                  
                  <table style={{ width: '100%', border: 'none', background: 'transparent' }}>
                    
                    <thead className="hidden print:table-header-group">
                      <tr>
                        <td style={{ height: '15px' }} colSpan={8}>&nbsp;</td>
                      </tr>
                    </thead>

                    <tfoot className="hidden print:table-footer-group">
                      <tr>
                        <td className="footer-space" colSpan={8}>&nbsp;</td>
                      </tr>
                    </tfoot>

                    <tbody>
                      <tr>
                        <td colSpan={8}>
                          
                          {/* ======================= HEADER ======================= */}
                          {/* تأكدنا من إزالة أي padding أو margin زائد */}
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
                                    كشف حضور وغياب الطلاب
                                </h1>
                                
                                <div className="text-xs font-bold mt-1 flex flex-row gap-4 items-center justify-center bg-white border border-dashed border-gray-300 py-1 px-2 rounded">
                                    <span>العام الجامعي: {academicYear === 'all' ? 'شامل' : academicYear}</span>
                                    <span className="text-gray-400">|</span>
                                    <span className="dir-ltr">{currentDateTime}</span>
                                </div>
                            </div>

                            {/* اليسار: شعار الكلية (من src assets) */}
                            <div className="w-1/4 flex justify-end items-start">
                                {currentCollegeLogo ? (
                                  <img 
                                      src={currentCollegeLogo} 
                                      alt="College Logo" 
                                      className="h-24 w-auto object-contain" 
                                  />
                                ) : (
                                  // عنصر فارغ بنفس الحجم للحفاظ على التنسيق إذا لم توجد صورة
                                  <div className="h-24 w-24"></div> 
                                )}
                            </div>
                          </div>
                          
                          {/* الشريط الرمادي */}
                          <div className="hidden print:flex justify-between text-sm mb-4 font-bold px-3 py-1 bg-gray-100 border border-black/20 rounded shadow-sm items-center">
                                <div className="flex gap-2">
                                  <span className="text-gray-600">المقرر الدراسي:</span>
                                  <span className="text-black">{courseName}</span>
                                </div>
                                <div className="flex gap-2">
                                  <span className="text-gray-600">المجموعة:</span>
                                  <span className="text-black">{groupName}</span>
                                </div>
                          </div>
                          {/* ==================================================== */}


                          {/* TABLE */}
                          <div className="overflow-hidden rounded-none border-t border-x print:border-black/30">
                            <Table className="border-collapse w-full text-right bg-white text-sm">
                              <TableHeader>
                                <TableRow className="bg-gray-200 print:bg-gray-200 print:text-black border-b border-black/30 h-10">
                                  <TableHead className="w-[40px] text-center border-l border-black/30 font-extrabold text-black">#</TableHead>
                                  <TableHead className="border-l border-black/30 font-extrabold text-black">اسم الطالب</TableHead>
                                  <TableHead className="w-[100px] border-l border-black/30 font-extrabold text-black text-center">الرقم الجامعي</TableHead>
                                  <TableHead className="text-center border-l border-black/30 font-extrabold text-black w-[70px]">المعتمدة</TableHead>
                                  <TableHead className="text-center border-l border-black/30 font-extrabold text-black w-[70px]">المنفذة</TableHead>
                                  <TableHead className="text-center border-l border-black/30 font-extrabold text-black w-[60px]">حضور</TableHead>
                                  <TableHead className="text-center border-l border-black/30 font-extrabold text-black w-[60px]">غياب</TableHead>
                                  <TableHead className="text-center border-black/30 font-extrabold text-black w-[70px]">النسبة</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {students.map((student, index) => (
                                  <TableRow key={student.student_id} className="print:break-inside-avoid border-b border-black/30 h-9">
                                    <TableCell className="text-center font-bold border-l border-black/30 py-1">{index + 1}</TableCell>
                                    <TableCell className="border-l border-black/30 py-1 font-bold">{student.name}</TableCell>
                                    <TableCell className="border-l border-black/30 py-1 font-mono text-xs text-center font-bold">{student.academic_number}</TableCell>
                                    <TableCell className="text-center border-l border-black/30 py-1 font-bold">{student.total_sessions_approved}</TableCell>
                                    <TableCell className="text-center border-l border-black/30 py-1 font-bold">{student.total_sessions_executed}</TableCell>
                                    <TableCell className="text-center border-l border-black/30 py-1 font-bold">{student.present_count}</TableCell>
                                    <TableCell className="text-center border-l border-black/30 py-1 font-bold">{student.absent_count}</TableCell>
                                    <TableCell className="text-center py-1">
                                      <span className="font-bold text-black">
                                        {student.attendance_percentage}%
                                      </span>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>

                          {/* FOOTER */}
                          <div className="hidden print:flex mt-12 justify-between px-16 text-sm page-break-inside-avoid">
                              <div className="text-center">
                                  <p className="mb-8 font-bold text-black text-base">توقيع المحاضر</p>
                                  <div className="border-b-2 border-black w-48"></div>
                              </div>
                              <div className="text-center">
                                  <p className="mb-8 font-bold text-black text-base">يعتمد، رئيس القسم</p>
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
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}