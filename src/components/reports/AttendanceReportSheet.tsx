import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// ✅ 1. استيراد شعار الجامعة
import uniLogo from "@/assets/logo.png"; 

// ✅ 2. استيراد صور الكليات (ديناميكي)
const collegeLogosGlob = import.meta.glob('/src/assets/colleges/*.png', { eager: true });

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
  time: string;       
  timeLabel: string;  
  studentsList: ReportStudent[];
  presentCount: number;
  absentCount: number;
  // ✅ أضفنا collegeId لتحديد الشعار
  collegeId?: string | number;
}

export const AttendanceReportSheet = React.forwardRef<HTMLDivElement, AttendanceReportSheetProps>(
  ({ 
    lectureTitle, 
    groupName, 
    lecturerName, 
    classroomName, 
    buildingName, 
    date,
    time,       
    timeLabel,  
    studentsList, 
    presentCount, 
    absentCount,
    collegeId
  }, ref) => {
    
    // ✅ دالة البحث عن الشعار
    const getCollegeLogoSrc = (id: string | number | undefined) => {
        if (!id) return null;
        const idStr = String(id);
        const foundKey = Object.keys(collegeLogosGlob).find((key) => {
            return key.endsWith(`/${idStr}.png`);
        });
        if (foundKey) {
            return (collegeLogosGlob[foundKey] as any).default;
        }
        return null;
    };
    
    const currentCollegeLogo = getCollegeLogoSrc(collegeId);

    return (
      <div 
        ref={ref} 
        className="bg-white p-8 rounded-xl shadow-sm border print:shadow-none print:border-none print:p-0 relative print:block print:bg-white"
        dir="rtl"
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
            <table style={{ width: '100%', border: 'none' }}>
              
              <thead className="hidden print:table-header-group">
                <tr><td style={{ height: '15px' }} colSpan={5}>&nbsp;</td></tr>
              </thead>
              
              <tfoot className="hidden print:table-footer-group">
                <tr><td className="footer-space" colSpan={5}>&nbsp;</td></tr>
              </tfoot>
              
              <tbody>
                <tr>
                  <td colSpan={5}>
                    
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
                                كشف حضور وغياب الطلاب
                            </h1>
                            
                            {/* صندوق التاريخ والوقت */}
                            <div className="flex justify-center items-center mt-1">
                                <div className="inline-flex items-center justify-center bg-white border border-dashed border-gray-300 rounded-lg py-1 px-3">
                                    <div className="flex flex-col items-center px-3">
                                        <span className="text-[10px] text-gray-500 font-bold whitespace-nowrap">التاريخ</span>
                                        <span className="font-bold text-sm dir-ltr whitespace-nowrap">{date}</span>
                                    </div>
                                    <div className="h-6 w-px bg-gray-300 mx-1"></div>
                                    <div className="flex flex-col items-center px-3">
                                        <span className="text-[10px] text-gray-500 font-bold whitespace-nowrap">{timeLabel}</span>
                                        <span className="font-bold text-sm dir-ltr whitespace-nowrap">{time}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* اليسار: شعار الكلية */}
                        <div className="w-1/4 flex justify-end items-start">
                            {currentCollegeLogo ? (
                              <img 
                                  src={currentCollegeLogo} 
                                  alt="College Logo" 
                                  className="h-24 w-auto object-contain" 
                              />
                            ) : (
                              <div className="h-24 w-24 flex items-center justify-center border border-dashed border-gray-300 rounded text-xs text-gray-400">
                                 شعار الكلية
                              </div> 
                            )}
                        </div>
                    </div>
                    
                    {/* معلومات المحاضرة */}
                    <div className="hidden print:flex justify-between px-4 mt-4 w-full bg-gray-50 border border-gray-200 rounded-md py-2 mb-4">
                         <div className="text-right w-1/2 border-l pl-4">
                            <p className="mb-1 text-sm font-bold whitespace-nowrap">المادة: <span className="font-normal">{lectureTitle}</span></p>
                            <p className="mb-0 text-sm font-bold whitespace-nowrap">المجموعة: <span className="font-normal">{groupName}</span></p>
                         </div>
                         <div className="text-left w-1/2 pr-4">
                            <p className="mb-1 text-sm font-bold whitespace-nowrap">المحاضر: <span className="font-normal">{lecturerName}</span></p>
                            <p className="mb-0 text-sm font-bold whitespace-nowrap">القاعة: <span className="font-normal">{classroomName} ({buildingName})</span></p>
                         </div>
                    </div>

                    <div className="mt-2 flex justify-center gap-8 text-sm font-bold mb-4">
                      <span>إجمالي الطلاب: {studentsList.length}</span>
                      <span className="text-green-700">حضور: {presentCount}</span>
                      <span className="text-red-700">غياب: {absentCount}</span>
                    </div>
                    {/* ==================================================== */}
                    
                    <div className="border-t border-x print:border-black/30 overflow-hidden bg-white/95 rounded-none">
                      <Table className="border-collapse w-full text-right text-sm">
                        <TableHeader>
                          <TableRow className="bg-gray-200 print:bg-gray-200 print:text-black border-b border-black/30 h-10">
                            <TableHead className="text-center border-l border-black/30 font-extrabold text-black w-[50px]">#</TableHead>
                            <TableHead className="text-right border-l border-black/30 font-extrabold text-black">اسم الطالب</TableHead>
                            <TableHead className="text-center border-l border-black/30 font-extrabold text-black w-[150px]">الرقم الجامعي</TableHead>
                            <TableHead className="text-center border-l border-black/30 font-extrabold text-black w-[100px]">الحالة</TableHead>
                            <TableHead className="text-center border-black/30 font-extrabold text-black w-[100px]">الطريقة</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {studentsList.map((student, index) => (
                            <TableRow key={student.id} className="print:break-inside-avoid border-b border-black/30 h-9">
                                <TableCell className="text-center border-l border-black/30 font-bold">{index + 1}</TableCell>
                                <TableCell className="border-l border-black/30 font-bold">{student.name}</TableCell>
                                <TableCell className="text-center border-l border-black/30 font-mono dir-ltr font-bold">{student.id}</TableCell>
                                <TableCell className="text-center border-l border-black/30 font-extrabold">
                                    {student.status === 'present' ? <span className="text-green-700">حاضر</span> : <span className="text-red-700">غائب</span>}
                                </TableCell>
                                <TableCell className="text-center border-black/30 text-xs font-bold">
                                     {student.status === 'present' ? (student.method === 'QR' ? 'QR Code' : 'يدوي') : '-'}
                                </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* التذييل */}
                    <div className="hidden print:flex mt-16 justify-between px-10 text-sm font-bold page-break-inside-avoid">
                        <div className="text-center w-1/3">
                            <p className="mb-12 font-black text-base">توقيع المحاضر</p>
                            <div className="border-b-2 border-black w-32 mx-auto"></div>
                        </div>
                        <div className="text-center w-1/3">
                            <p className="mb-12 font-black text-base">اعتماد القسم</p>
                            <div className="border-b-2 border-black w-32 mx-auto"></div>
                        </div>
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