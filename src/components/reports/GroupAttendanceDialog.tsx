import { useEffect, useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { Loader2, Printer, FileText } from "lucide-react";
import { useReactToPrint } from "react-to-print";

// ✅ 1. استيراد الصورة الصحيحة
import reportBg from "@/assets/report-bg.png"; 

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
  
  // ✅ لم نعد بحاجة للمسار النصي الثابت
  // const bgImage = "/images/report-bg.png";

  const handlePrint = useReactToPrint({
    // @ts-ignore
    contentRef: printRef, 
    documentTitle: `كشف_حضور_${groupName}_${courseName}`,
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
        
        {/* Header */}
        <DialogHeader className="p-6 border-b shadow-sm bg-card z-10">
          <div className="flex justify-between items-center">
            <div>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-primary">
                <FileText className="w-6 h-6" />
                كشف تفصيلي للمجموعة: {groupName}
              </DialogTitle>
              
              {/* ✅ 2. إضافة الوصف لحل التحذير */}
              <DialogDescription>
                تقرير تفصيلي لحضور وغياب الطلاب في المقرر المحدد.
              </DialogDescription>

              <p className="text-muted-foreground mt-1 text-sm">
                المقرر: <span className="font-medium text-foreground">{courseName}</span> | 
                السنة الدراسية: <span className="font-medium text-foreground">{academicYear === 'all' ? 'الكل' : academicYear}</span>
              </p>
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
            
            /* حاوية الطباعة (Ref) */
            <div 
              ref={printRef} 
              className="bg-white p-8 rounded-xl shadow-sm border print:shadow-none print:border-none print:p-0 relative print:block print:bg-transparent"
            >
              
              <style type="text/css" media="print">
                {`
                  @page { 
                    size: A4 portrait; 
                    margin: 0mm; 
                  }
                  body { 
                    margin: 0;
                    -webkit-print-color-adjust: exact !important; 
                    print-color-adjust: exact !important; 
                  }

                  /* الخلفية الثابتة */
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
                    object-fit: cover; /* تغطية كاملة */
                  }

                  .print-container {
                    direction: rtl;
                    font-family: 'Tajawal', 'Cairo', sans-serif;
                    width: 100%;
                    position: relative;
                    z-index: 5;
                  }

                  .print-content-wrapper {
                    padding-left: 15mm;    
                    padding-right: 15mm;   
                  }

                  .header-space { height: 160px; } 
                  .footer-space { height: 100px; } 

                  thead { display: table-header-group; }
                  tfoot { display: table-footer-group; }
                  tr { page-break-inside: avoid; }
                  
                  table { background-color: transparent !important; width: 100%; }
                  th, td { text-align: right; }
                  th.text-center, td.text-center { text-align: center; }
                  
                  .no-print { display: none; }
                `}
              </style>

              {/* ✅ 3. استخدام الصورة المستوردة */}
              <div className="print-watermark-container hidden print:block">
                <img src={reportBg} className="print-watermark-img" alt="Background" />
              </div>

              {/* المحتوى */}
              <div className="print-container">
                <div className="print-content-wrapper">
                  
                  <table style={{ width: '100%', border: 'none', background: 'transparent' }}>
                    
                    {/* مساحة الترويسة */}
                    <thead className="hidden print:table-header-group">
                      <tr>
                        <td className="header-space" colSpan={8}>&nbsp;</td>
                      </tr>
                    </thead>

                    {/* مساحة التذييل */}
                    <tfoot className="hidden print:table-footer-group">
                      <tr>
                        <td className="footer-space" colSpan={8}>&nbsp;</td>
                      </tr>
                    </tfoot>

                    {/* جسم الصفحة */}
                    <tbody>
                      <tr>
                        <td colSpan={8}>
                          
                          {/* عنوان التقرير */}
                          <div className="hidden print:block text-center mb-6">
                            <h1 className="text-2xl font-bold text-black/90 mb-4 border-b-2 border-black/10 pb-2 inline-block px-8">
                              كشف حضور وغياب الطلاب
                            </h1>
                            <div className="flex flex-wrap justify-between text-sm mt-4 bg-white/80 border border-black/20 rounded p-3 gap-4 shadow-sm">
                                <div><strong>المقرر:</strong> {courseName}</div>
                                <div><strong>المجموعة:</strong> {groupName}</div>
                                <div><strong>العام الجامعي:</strong> {academicYear === 'all' ? 'شامل' : academicYear}</div>
                            </div>
                          </div>

                          {/* جدول البيانات */}
                          <div className="overflow-hidden rounded-lg border print:border-black/20">
                            <Table className="border-collapse w-full text-right bg-white/95 text-sm">
                              <TableHeader>
                                <TableRow className="bg-muted/50 print:bg-gray-100 print:text-black">
                                  <TableHead className="w-[40px] text-center border-b border-r print:border-black/20 font-bold text-black">#</TableHead>
                                  <TableHead className="border-b border-r print:border-black/20 font-bold text-black">اسم الطالب</TableHead>
                                  <TableHead className="w-[100px] border-b border-r print:border-black/20 font-bold text-black text-center">الرقم الجامعي</TableHead>
                                  <TableHead className="text-center border-b border-r print:border-black/20 font-bold text-black w-[70px] bg-blue-50/30">المعتمدة</TableHead>
                                  <TableHead className="text-center border-b border-r print:border-black/20 font-bold text-black w-[70px] bg-blue-50/30">المنفذة</TableHead>
                                  <TableHead className="text-center border-b border-r print:border-black/20 font-bold text-black w-[60px] bg-green-50/30">حضور</TableHead>
                                  <TableHead className="text-center border-b border-r print:border-black/20 font-bold text-black w-[60px] bg-red-50/30">غياب</TableHead>
                                  <TableHead className="text-center border-b print:border-black/20 font-bold text-black w-[70px]">النسبة</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {students.map((student, index) => (
                                  <TableRow key={student.student_id} className="print:break-inside-avoid hover:bg-muted/5">
                                    <TableCell className="text-center font-medium border-r print:border-black/20 border-b py-2">{index + 1}</TableCell>
                                    <TableCell className="border-r print:border-black/20 border-b py-2 font-medium">{student.name}</TableCell>
                                    <TableCell className="border-r print:border-black/20 border-b py-2 font-mono text-xs text-center">{student.academic_number}</TableCell>
                                    <TableCell className="text-center border-r print:border-black/20 border-b py-2 bg-blue-50/10">{student.total_sessions_approved}</TableCell>
                                    <TableCell className="text-center border-r print:border-black/20 border-b py-2 font-semibold bg-blue-50/10">{student.total_sessions_executed}</TableCell>
                                    <TableCell className="text-center border-r print:border-black/20 border-b py-2 text-green-600 font-bold bg-green-50/10">{student.present_count}</TableCell>
                                    <TableCell className="text-center border-r print:border-black/20 border-b py-2 text-red-600 font-bold bg-red-50/10">{student.absent_count}</TableCell>
                                    <TableCell className="text-center border-b py-2">
                                      <Badge 
                                        variant="outline" 
                                        className={`h-6 min-w-[50px] justify-center border-0 print:border text-xs ${
                                          student.attendance_percentage >= 85 ? "bg-green-100 text-green-800 print:bg-transparent print:text-black" : 
                                          student.attendance_percentage >= 60 ? "bg-yellow-100 text-yellow-800 print:bg-transparent print:text-black" : 
                                          "bg-red-100 text-red-800 print:bg-transparent print:text-black"
                                        }`}
                                      >
                                        {student.attendance_percentage}%
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>

                          {/* التذييل */}
                          <div className="hidden print:flex mt-16 justify-between px-10 text-sm page-break-inside-avoid">
                              <div className="text-center">
                                  <p className="mb-10 font-bold text-black">توقيع المحاضر</p>
                                  <div className="border-b border-black border-dashed w-48 opacity-50"></div>
                              </div>
                              <div className="text-center">
                                  <p className="mb-10 font-bold text-black">يعتمد، رئيس القسم</p>
                                  <div className="border-b border-black border-dashed w-48 opacity-50"></div>
                              </div>
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
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}