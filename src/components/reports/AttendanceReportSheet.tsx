import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// ✅ 1. استيراد الصورة
import reportBg from "@/assets/report-bg.png"; 

export interface ReportStudent {
  name: string;
  id: string;
  status: 'present' | 'absent';
  method: string;
}

interface AttendanceReportSheetProps {
  lectureTitle: string;
  groupName: string;
  lecturerName: string;
  classroomName: string;
  buildingName: string;
  date: string;
  
  // ✅ التعديل هنا: جعلنا الوقت ومسماه متغيرين
  time: string;       // القيمة (مثلاً 08:30 ص)
  timeLabel: string;  // العنوان (مثلاً "وقت الطباعة" أو "وقت التحضير")
  
  studentsList: ReportStudent[];
  presentCount: number;
  absentCount: number;
}

export const AttendanceReportSheet = React.forwardRef<HTMLDivElement, AttendanceReportSheetProps>(
  ({ 
    lectureTitle, 
    groupName, 
    lecturerName, 
    classroomName, 
    buildingName, 
    date,
    time,       // ✅
    timeLabel,  // ✅
    studentsList, 
    presentCount, 
    absentCount 
  }, ref) => {
    
    // ✅ تم إلغاء المسار النصي
    // const bgImage = "/images/report-bg.png"; 

    return (
      <div 
        ref={ref} 
        className="bg-white p-8 rounded-xl shadow-sm border print:shadow-none print:border-none print:p-0 relative print:block print:bg-transparent"
        dir="rtl"
      >
        <style type="text/css" media="print">
          {`
            @page { size: A4 portrait; margin: 0mm; }
            body { margin: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .print-watermark-container { position: fixed; top: 0; left: 0; width: 210mm; height: 297mm; z-index: -10; overflow: hidden; }
            .print-watermark-img { width: 100%; height: 100%; object-fit: fill; }
            .print-content-wrapper { position: relative; z-index: 5; width: 100%; direction: rtl; font-family: 'Tajawal', 'Cairo', sans-serif; padding-left: 35px; padding-right: 35px; }
            .header-space { height: 160px; }
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

        {/* ✅ 2. استخدام الصورة المستوردة */}
        <div className="print-watermark-container hidden print:block">
          <img src={reportBg} className="print-watermark-img" alt="Letterhead" />
        </div>

        <div className="print-container">
          <div className="print-content-wrapper">
            <table style={{ width: '100%', border: 'none' }}>
              <thead className="hidden print:table-header-group">
                <tr><td className="header-space" colSpan={5}>&nbsp;</td></tr>
              </thead>
              <tfoot className="hidden print:table-footer-group">
                <tr><td className="footer-space" colSpan={5}>&nbsp;</td></tr>
              </tfoot>
              <tbody>
                <tr>
                  <td colSpan={5}>
                    
                    <div className="hidden print:block text-center mb-6">
                      <h1 className="text-2xl font-bold text-black/90 mb-4 border-b-2 border-black/10 pb-2 inline-block px-8">
                        كشف حضور وغياب الطلاب
                      </h1>
                      
                      <div className="flex justify-between items-center px-4 mt-4 w-full">
                         
                         <div className="text-right w-1/3">
                            <p className="mb-1 text-sm font-bold whitespace-nowrap">المادة: <span className="font-normal">{lectureTitle}</span></p>
                            <p className="mb-0 text-sm font-bold whitespace-nowrap">المجموعة: <span className="font-normal">{groupName}</span></p>
                         </div>
                         
                         {/* ✅ الصندوق المعدل */}
                         <div className="text-center w-1/3">
                            <div className="inline-flex items-center justify-center bg-white/90 border border-black/10 rounded-lg py-1 px-3 shadow-sm">
                                
                                <div className="flex flex-col items-center px-3">
                                    <span className="text-[10px] text-gray-500 font-bold whitespace-nowrap">التاريخ</span>
                                    <span className="font-bold text-sm dir-ltr whitespace-nowrap">{date}</span>
                                </div>
                                
                                <div className="h-6 w-px bg-gray-300 mx-1"></div>

                                {/* ✅ عرض الوقت مع العنوان الديناميكي */}
                                <div className="flex flex-col items-center px-3">
                                    <span className="text-[10px] text-gray-500 font-bold whitespace-nowrap">{timeLabel}</span>
                                    <span className="font-bold text-sm dir-ltr whitespace-nowrap">{time}</span>
                                </div>

                            </div>
                         </div>

                         <div className="text-left w-1/3">
                            <p className="mb-1 text-sm font-bold whitespace-nowrap">المحاضر: <span className="font-normal">{lecturerName}</span></p>
                            <p className="mb-0 text-sm font-bold whitespace-nowrap">القاعة: <span className="font-normal">{classroomName}</span></p>
                         </div>
                      </div>

                      <div className="mt-4 flex justify-center gap-8 text-sm bg-gray-50 border border-gray-200 rounded-md py-2 mx-10">
                        <span><strong>إجمالي الطلاب:</strong> {studentsList.length}</span>
                        <span className="text-green-700"><strong>حضور:</strong> {presentCount}</span>
                        <span className="text-red-700"><strong>غياب:</strong> {absentCount}</span>
                      </div>
                    </div>
                    
                    <div className="border rounded-lg overflow-hidden print:border-black/20 bg-white/95 mt-4">
                      <Table className="border-collapse w-full text-right text-sm">
                        <TableHeader>
                          <TableRow className="bg-muted/50 print:bg-gray-200 print:text-black">
                            <TableHead className="text-center border print:border-black font-bold text-black w-[50px]">#</TableHead>
                            <TableHead className="text-right border print:border-black font-bold text-black">اسم الطالب</TableHead>
                            <TableHead className="text-center border print:border-black font-bold text-black w-[150px]">الرقم الجامعي</TableHead>
                            <TableHead className="text-center border print:border-black font-bold text-black w-[100px]">الحالة</TableHead>
                            <TableHead className="text-center border print:border-black font-bold text-black w-[100px]">الطريقة</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {studentsList.map((student, index) => (
                            <TableRow key={student.id} className="print:break-inside-avoid">
                                <TableCell className="text-center border print:border-black/20">{index + 1}</TableCell>
                                <TableCell className="border print:border-black/20 font-medium">{student.name}</TableCell>
                                <TableCell className="text-center border print:border-black/20 font-mono dir-ltr">{student.id}</TableCell>
                                <TableCell className="text-center border print:border-black/20 font-bold">
                                    {student.status === 'present' ? <span className="text-green-700">حاضر</span> : <span className="text-red-700">غائب</span>}
                                </TableCell>
                                <TableCell className="text-center border print:border-black/20 text-xs">
                                     {student.status === 'present' ? (student.method === 'QR' ? 'QR Code' : 'يدوي') : '-'}
                                </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="hidden print:flex mt-16 justify-between px-10 text-sm font-bold page-break-inside-avoid">
                        <div className="text-center w-1/3">
                            <p className="mb-12">توقيع المحاضر</p>
                            <div className="border-b border-black border-dashed opacity-50 w-3/4 mx-auto"></div>
                        </div>
                        <div className="text-center w-1/3">
                            <p className="mb-12">اعتماد القسم</p>
                            <div className="border-b border-black border-dashed opacity-50 w-3/4 mx-auto"></div>
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
    );
  }
);
AttendanceReportSheet.displayName = "AttendanceReportSheet";