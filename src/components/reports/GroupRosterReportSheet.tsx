import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { storageUrl } from "@/lib/api";

// ✅ شعار الجامعة الثابت (محلياً لأنه لا يتغير)
import uniLogo from "@/assets/366544.png";

export interface GroupRosterStudent {
  id: string | number;
  name: string;
  academicNumber: string;
}

interface GroupRosterReportSheetProps {
  groupName: string;
  collegeName?: string;
  departmentName?: string;
  programName?: string;
  levelLabel?: string;
  semesterLabel?: string;
  blockName?: string;
  studentsList: GroupRosterStudent[];
  // ✅ collegeId لتحديد رابط شعار الكلية
  collegeId?: string | number;
}

export const GroupRosterReportSheet = React.forwardRef<HTMLDivElement, GroupRosterReportSheetProps>(
  (
    {
      groupName,
      collegeName,
      departmentName,
      programName,
      levelLabel,
      semesterLabel,
      blockName,
      studentsList,
      collegeId,
    },
    ref
  ) => {
    // ✅ بناء رابط الشعار الديناميكي للكلية من نفس مضيف الـ API (مع كسر الكاش)
    const collegeLogoPath = collegeId ? `colleges/${collegeId}.png` : null;
    const currentCollegeLogo = collegeLogoPath
      ? `${storageUrl(collegeLogoPath)}?t=${new Date().toDateString()}`
      : null;

    const printDate = new Date().toLocaleDateString("en-CA");

    // ✅ بيانات المسار الدراسي (نعرض فقط الحقول المتوفرة)
    const pathItems = [
      { label: "الكلية", value: collegeName },
      { label: "القسم", value: departmentName },
      { label: "البرنامج", value: programName },
      { label: "المستوى", value: levelLabel },
      { label: "الترم", value: semesterLabel },
      { label: "البلوك", value: blockName },
    ].filter((item) => !!item.value);

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
            <table style={{ width: "100%", border: "none" }}>
              <thead className="hidden print:table-header-group">
                <tr>
                  <td style={{ height: "15px" }} colSpan={3}>
                    &nbsp;
                  </td>
                </tr>
              </thead>

              <tfoot className="hidden print:table-footer-group">
                <tr>
                  <td className="footer-space" colSpan={3}>
                    &nbsp;
                  </td>
                </tr>
              </tfoot>

              <tbody>
                <tr>
                  <td colSpan={3}>
                    {/* ======================= HEADER ======================= */}
                    <div className="hidden print:flex justify-between items-start mb-2 border-b-2 border-black pb-2 pt-0 mt-0">
                      {/* اليمين: شعار الجامعة */}
                      <div className="w-1/4 flex justify-start items-start">
                        <img src={uniLogo} alt="University Logo" className="h-24 w-auto object-contain" />
                      </div>

                      {/* المنتصف */}
                      <div className="w-2/4 text-center pt-1">
                        <h2 className="text-lg font-bold leading-tight">الجمهورية اليمنية</h2>
                        <h2 className="text-lg font-bold leading-tight mb-2"> جامعة العلوم والتكنولوجيا </h2>

                        <h1 className="text-xl font-black mb-2 inline-block px-6 py-1 bg-gray-100 border border-black/10 rounded-md">
                          كشف دفعة "{groupName}"
                        </h1>
                      </div>

                      {/* اليسار: شعار الكلية (الديناميكي) */}
                      <div className="w-1/4 flex justify-end items-start">
                        {currentCollegeLogo ? (
                          <img
                            src={currentCollegeLogo}
                            alt="College Logo"
                            className="h-24 w-auto object-contain"
                            onError={(e) => {
                              // إخفاء الصورة في حال فشل التحميل
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="h-24 w-24 flex items-center justify-center border border-dashed border-gray-300 rounded text-xs text-gray-400">
                            شعار الكلية
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ======================= معلومات المسار ======================= */}
                    <div className="hidden print:block px-4 mt-4 w-full bg-gray-50 border border-gray-200 rounded-md py-2 mb-3">
                      <div className="grid grid-cols-3 gap-x-6 gap-y-1">
                        {pathItems.map((item) => (
                          <p key={item.label} className="mb-0 text-sm font-bold whitespace-nowrap">
                            {item.label}: <span className="font-normal">{item.value}</span>
                          </p>
                        ))}
                      </div>

                      <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-300 text-sm font-bold">
                        <span>عدد الطلاب: <span className="font-normal">{studentsList.length}</span></span>
                        <span>تاريخ الطباعة: <span className="font-normal dir-ltr">{printDate}</span></span>
                      </div>
                    </div>
                    {/* ============================================================= */}

                    <div className="border-t border-x print:border-black/30 overflow-hidden bg-white/95 rounded-none">
                      <Table className="border-collapse w-full text-right text-sm">
                        <TableHeader>
                          <TableRow className="bg-gray-200 print:bg-gray-200 print:text-black border-b border-black/30 h-10">
                            <TableHead className="text-center border-l border-black/30 font-extrabold text-black w-[50px]">
                              #
                            </TableHead>
                            <TableHead className="text-right border-l border-black/30 font-extrabold text-black">
                              اسم الطالب
                            </TableHead>
                            <TableHead className="text-center border-black/30 font-extrabold text-black w-[180px]">
                              الرقم الجامعي
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {studentsList.map((student, index) => (
                            <TableRow
                              key={student.id}
                              className="print:break-inside-avoid border-b border-black/30 h-9"
                            >
                              <TableCell className="text-center border-l border-black/30 font-bold">
                                {index + 1}
                              </TableCell>
                              <TableCell className="border-l border-black/30 font-bold">{student.name}</TableCell>
                              <TableCell className="text-center border-black/30 font-mono dir-ltr font-bold">
                                {student.academicNumber}
                              </TableCell>
                            </TableRow>
                          ))}

                          {studentsList.length === 0 && (
                            <TableRow className="border-b border-black/30 h-9">
                              <TableCell colSpan={3} className="text-center font-bold text-gray-500">
                                لا يوجد طلاب في هذه المجموعة
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    {/* التذييل */}
                    <div className="hidden print:flex mt-16 justify-between px-10 text-sm font-bold page-break-inside-avoid">
                      <div className="text-center w-1/3">
                        <p className="mb-12 font-black text-base">توقيع رئيس القسم</p>
                        <div className="border-b-2 border-black w-32 mx-auto"></div>
                      </div>
                      <div className="text-center w-1/3">
                        <p className="mb-12 font-black text-base">اعتماد عميد الكلية</p>
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

GroupRosterReportSheet.displayName = "GroupRosterReportSheet";
