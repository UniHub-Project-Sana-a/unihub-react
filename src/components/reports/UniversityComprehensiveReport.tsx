import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Loader2, Printer, AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useNavigate } from "react-router-dom"; 

// شعارات
// import logoSanaa from "@/assets/logo.png";
// import logoUniHub from "@/assets/logo-sidebar.png";
import logoSanaa from "@/assets/logo.png"; // شعار الجامعة
import logoCenter from "@/assets/logo-center.png"; // شعار مركز التحول (أضف الملف لاحقاً)
import logoUniHub from "@/assets/logo-dark.png";
// ملاحظة: تأكد من حذف استيراد logo-center إذا لم يكن موجوداً
// const logoCenter = ""; // أو الرابط إذا توفر

export default function UniversityComprehensiveReport() {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/v1/reports/university-comprehensive');
        setData(res.data);
      } catch (e) { console.error(e); } 
      finally { setIsLoading(false); }
    };
    fetchData();
  }, []);

  const handlePrint = () => window.print();

  if (isLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-white text-black p-8 print:p-0 font-sans" dir="rtl">
      
      {/* زر الطباعة العائم */}
      <div className="fixed bottom-8 left-8 print:hidden z-50">
        <Button onClick={handlePrint} size="lg" className="shadow-xl gap-2 bg-blue-900 hover:bg-blue-800 text-white">
            <Printer className="w-5 h-5" /> طباعة التقرير الرسمي
        </Button>

        <Button 
            onClick={() => navigate('/')} 
            size="lg" 
            variant="secondary" 
            className="shadow-xl gap-2 border border-gray-300 hover:bg-gray-100"
        >
            <ArrowRight className="w-5 h-5" /> عودة للوحة التحكم
        </Button>
      </div>

      {/* 
         ✅ حيلة الطباعة لتكرار الترويسة في كل صفحة:
         نضع الترويسة داخل thead في جدول رئيسي يغلف المحتوى
      */}
      <table className="w-full">
        <thead className="print:table-header-group">
            <tr>
                <td>
                    <div className="flex justify-between items-start border-b-4 border-double border-black pb-4 mb-8 pt-4">
                        <div className="w-1/4 text-center">
                            <img src={logoSanaa} alt="جامعة صنعاء" className="h-28 w-auto mx-auto object-contain" />
                            <p className="text-sm font-bold mt-2">الجمهورية اليمنية<br/>جامعة صنعاء</p>
                        </div>
                        
                        <div className="w-2/4 text-center pt-2">
                            <img src={logoUniHub} alt="UniHub" className="h-24 w-auto mx-auto object-contain mb-2" />
                            <h1 className="text-3xl font-black mb-1 tracking-wide">التقرير الأكاديمي الشامل</h1>
                            <div className="inline-block bg-gray-100 px-4 py-1 rounded border border-gray-300 mt-2">
                                <p className="text-sm font-bold text-gray-700">تاريخ الإصدار: {new Date().toLocaleDateString('ar-EG')}</p>
                            </div>
                        </div>

                        <div className="w-1/4 text-center">
                            {logoCenter ? (
                                <img src={logoCenter} alt="مركز التحول" className="h-24 w-auto mx-auto object-contain" />
                            ) : (
                                <div className="h-24 w-24 mx-auto border-2 border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-400 rounded-full">شعار المركز</div>
                            )}
                            <p className="text-sm font-bold mt-2">مركز التحول الرقمي</p>
                        </div>
                    </div>
                </td>
            </tr>
        </thead>

        <tbody>
            <tr>
                <td>
                    {/* جسم التقرير */}
                    <div className="space-y-16">
                        {data.map((college, idx) => (
                            <div key={college.college_id} className="break-after-page mb-16 last:mb-0">
                                
                                {/* عنوان الكلية المميز */}
                                <div className="flex items-center gap-4 bg-gray-900 text-white p-4 mb-8 rounded-lg shadow-sm print:bg-gray-200 print:text-black print:border-2 print:border-black">
                                    <div className="bg-white text-black w-10 h-10 flex items-center justify-center rounded-full font-bold text-lg border-2 border-gray-300">{idx + 1}</div>
                                    <div>
                                        <h2 className="text-2xl font-bold">{college.college_name}</h2>
                                        <span className="text-xs font-mono opacity-80 print:text-black">Code: {college.college_code}</span>
                                    </div>
                                </div>

                                <div className="space-y-10 px-2">
                                    
                                    {/* 1. الخطة الدراسية (تصميم الجدول الهرمي) */}
                                    <SectionBlock title="1. الهيكلة الأكاديمية والخطة الدراسية">
                                        {college.departments?.length > 0 ? (
                                            <div className="space-y-6">
                                                {college.departments.map((dept: any) => (
                                                    <div key={dept.department_id} className="border-2 border-gray-200 rounded-lg overflow-hidden break-inside-avoid">
                                                        <div className="bg-blue-50/50 p-3 border-b border-blue-100 font-bold text-blue-900 flex justify-between items-center">
                                                            <span>قسم: {dept.department_name}</span>
                                                            <span className="text-xs font-normal text-gray-500">{dept.department_code}</span>
                                                        </div>
                                                        <div className="p-4 bg-white">
                                                            {dept.programs?.map((prog: any) => (
                                                                <div key={prog.program_id} className="mb-4 last:mb-0">
                                                                    <h5 className="font-bold text-sm mb-2 flex items-center gap-2">
                                                                        <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                                                                        برنامج: {prog.program_name}
                                                                    </h5>
                                                                    
                                                                    {/* جدول المستويات والمواد */}
                                                                    <div className="mr-4 border-r-2 border-gray-100 pr-4 space-y-4">
                                                                        {prog.levels?.map((lvl: any) => (
                                                                            <div key={lvl.level_id}>
                                                                                <div className="text-xs font-bold text-gray-500 mb-1 bg-gray-50 inline-block px-2 py-0.5 rounded border">المستوى {lvl.level_number}</div>
                                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                                    {lvl.semesters?.map((sem: any) => (
                                                                                        <div key={sem.semester_id} className="bg-gray-50/30 border border-gray-200 rounded p-2 text-sm">
                                                                                            <span className="font-bold text-xs block mb-1 underline">الفصل الدراسي {sem.term_number}:</span>
                                                                                            <ul className="list-disc list-inside text-xs text-gray-700 space-y-0.5">
                                                                                                {sem.courses?.length > 0 ? sem.courses.map((c: any) => (
                                                                                                    <li key={c.course_id}>
                                                                                                        <span className="font-medium">{c.course_name}</span> 
                                                                                                        <span className="text-[10px] text-gray-400 mx-1">({c.course_code})</span>
                                                                                                        <span className="text-[10px] bg-white border px-1 rounded">{c.credit_hours} س</span>
                                                                                                    </li>
                                                                                                )) : <span className="text-gray-400 italic">لا يوجد مقررات</span>}
                                                                                            </ul>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : <NoData />}
                                    </SectionBlock>

                                    {/* 2. القاعات والمباني (تصميم البطاقات) */}
                                    <SectionBlock title="2. البنية التحتية (المباني والقاعات)">
                                        {college.buildings?.length > 0 ? (
                                            <div className="grid grid-cols-1 gap-4">
                                                {college.buildings.map((build: any) => (
                                                    <div key={build.building_id} className="flex border rounded-lg overflow-hidden break-inside-avoid">
                                                        <div className="bg-gray-100 w-32 p-4 flex items-center justify-center text-center font-bold border-l">
                                                            {build.building_name}
                                                        </div>
                                                        <div className="p-4 flex-1 bg-white">
                                                            <div className="flex flex-wrap gap-2">
                                                                {build.classrooms?.map((room: any) => (
                                                                    <div key={room.classroom_id} className="flex flex-col items-center bg-white border border-gray-200 px-3 py-2 rounded shadow-sm min-w-[80px]">
                                                                        <span className="font-bold text-sm">{room.classroom_name}</span>
                                                                        <span className="text-[10px] text-gray-500 bg-gray-50 px-1 rounded mt-1">سعة: {room.capacity}</span>
                                                                    </div>
                                                                ))}
                                                                {(!build.classrooms || build.classrooms.length === 0) && <span className="text-gray-400 text-sm">لا يوجد قاعات مسجلة</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : <NoData />}
                                    </SectionBlock>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 break-inside-avoid">
                                        {/* 3. الرتب الأكاديمية */}
                                        <SectionBlock title="3. لائحة الرتب الأكاديمية">
                                            {college.academic_titles?.length > 0 ? (
                                                <Table className="border text-sm">
                                                    <TableHeader className="bg-gray-50"><TableRow><TableHead className="text-right">الرتبة</TableHead><TableHead className="text-center">سعر الساعة المعتمد</TableHead></TableRow></TableHeader>
                                                    <TableBody>
                                                        {college.academic_titles.map((title: any) => (
                                                            <TableRow key={title.title_id}>
                                                                <TableCell className="font-bold">{title.title_name}</TableCell>
                                                                <TableCell className="text-center font-mono text-green-700">{title.hourly_price} ر.ي</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            ) : <NoData />}
                                        </SectionBlock>

                                        {/* 5. الفترات الزمنية */}
                                        <SectionBlock title="5. فترات الجدول الدراسي">
                                            {college.periods?.length > 0 ? (
                                                <Table className="border text-sm">
                                                    <TableHeader className="bg-gray-50"><TableRow><TableHead className="text-right">الفترة</TableHead><TableHead className="text-center">وقت البدء</TableHead><TableHead className="text-center">وقت الانتهاء</TableHead></TableRow></TableHeader>
                                                    <TableBody>
                                                        {college.periods.map((per: any) => (
                                                            <TableRow key={per.period_id}>
                                                                <TableCell className="font-bold">{per.period_name}</TableCell>
                                                                <TableCell className="text-center font-mono dir-ltr">{per.start_time}</TableCell>
                                                                <TableCell className="text-center font-mono dir-ltr">{per.end_time}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            ) : <NoData />}
                                        </SectionBlock>
                                    </div>

                                    {/* 4. أعضاء هيئة التدريس */}
                                    <SectionBlock title="4. سجل الكادر الأكاديمي">
                                        {college.lecturers?.length > 0 ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                                {college.lecturers.map((lect: any) => (
                                                    <div key={lect.lecturer_id} className="border p-3 rounded flex items-center gap-3 bg-white hover:bg-gray-50 break-inside-avoid">
                                                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-xs shrink-0">
                                                            {lect.user?.full_name?.substring(0,2)}
                                                        </div>
                                                        <div className="overflow-hidden">
                                                            <p className="font-bold text-sm truncate" title={lect.user?.full_name}>
                                                                {lect.academic_title?.title_name ? `${lect.academic_title.title_name}/ ` : ""}{lect.user?.full_name}
                                                            </p>
                                                            <p className="text-xs text-gray-500 truncate">{lect.department?.department_name || "قسم عام"}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : <NoData />}
                                    </SectionBlock>

                                    {/* 6. تسجيل الطلاب */}
                                    <SectionBlock title="6. المجموعات الطلابية (الدفعات)">
                                        {college.student_groups?.length > 0 ? (
                                            <Table className="border text-sm">
                                                <TableHeader className="bg-gray-50">
                                                    <TableRow>
                                                        <TableHead className="text-right font-bold w-1/4">اسم المجموعة</TableHead>
                                                        <TableHead className="text-right font-bold w-1/4">القسم</TableHead>
                                                        <TableHead className="text-center font-bold w-1/4">المستوى / الفصل</TableHead>
                                                        <TableHead className="text-center font-bold w-1/4">عدد الطلاب</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {college.student_groups.map((group: any) => (
                                                        <TableRow key={group.group_id}>
                                                            <TableCell className="font-bold text-blue-900">{group.group_name}</TableCell>
                                                            <TableCell>{group.department?.department_name}</TableCell>
                                                            <TableCell className="text-center">
                                                                <span className="bg-gray-100 px-2 py-1 rounded text-xs border">
                                                                    مستوى {group.level?.level_number} - ترم {group.semester?.term_number}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell className="text-center font-mono font-bold text-lg bg-green-50">
                                                                {group.students_count}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        ) : <NoData />}
                                    </SectionBlock>

                                </div>
                            </div>
                        ))}
                    </div>
                </td>
            </tr>
        </tbody>
        
        {/* التذييل المتكرر (Footer) */}
        <tfoot className="print:table-footer-group">
            <tr>
                <td className="pt-8">
                    {/* قمنا بإزالة رقم الصفحة لأنه غير مدعوم في HTML Print */}
                    <div className="border-t-2 border-black pt-2 flex justify-between text-xs text-gray-500 font-bold">
                        <span>نظام UniHub لإدارة الأداء الجامعي والتحضر</span>
                        <span>تمت الطباعة بواسطة: {localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).full_name : 'المسؤول'}</span>
                        <span>نسخة أصلية</span>
                    </div>
                </td>
            </tr>
        </tfoot>
      </table>

        {/* CSS للطباعة */}
        <style>{`
            @media print {
                /* 1. تصفير الهوامش لإخفاء ترويسة وتذييل المتصفح (الرابط والتاريخ) */
                @page { 
                    size: A4; 
                    margin: 0 !important; 
                }
                
                /* 2. إضافة هوامش داخلية للمحتوى لكي لا يلتصق بحافة الورقة */
                body { 
                    background: white; 
                    -webkit-print-color-adjust: exact; 
                    padding: 10mm 15mm !important; /* أعلى/أسفل: 10mm، يمين/يسار: 15mm */
                }

                /* ضمان عدم قص المحتوى */
                .break-after-page { page-break-after: always; }
                .break-inside-avoid { page-break-inside: avoid; }
                
                /* إخفاء أي عناصر غير مرغوب فيها */
                html, body {
                    height: auto;
                    font-size: 12px; /* تصغير الخط قليلاً ليتناسب مع الورقة */
                }
            }
        `}</style>
    </div>
  );
}

// مكونات مساعدة
const SectionBlock = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="border border-black/10 rounded-lg overflow-hidden mb-8 break-inside-avoid shadow-sm print:shadow-none print:border-black">
        <div className="bg-gray-800 text-white px-4 py-2 font-bold flex items-center gap-2 print:bg-gray-300 print:text-black print:border-b print:border-black">
            {title}
        </div>
        <div className="p-5 bg-white">
            {children}
        </div>
    </div>
);

const NoData = ({ text = "لم يتم إدخال بيانات." }: { text?: string }) => (
    <div className="flex items-center justify-center gap-2 text-gray-400 py-6 text-sm border-2 border-dashed rounded bg-gray-50/50">
        <AlertCircle className="w-4 h-4" /> {text}
    </div>
);