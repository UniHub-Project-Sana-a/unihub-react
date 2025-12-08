import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, UserCheck, UserX, Search, ShieldCheck, MapPin, User, BookOpen, AlertCircle, Printer, Users, AlertTriangle } from "lucide-react";
import { AttendanceRecord } from "@/pages/LecturerPage";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface StudentData {
  academic_number: string;
  name: string;
  student_id: number;
}

interface AttendanceSummaryProps {
  records: any[];
  lectureTitle: string;
  groupName: string;
  lecturerName: string;
  classroomName: string;
  buildingName: string;
  groupId: string;
  timetableId: string;
  sessionId: string;
  onFinalized: () => void;
}

export function AttendanceSummary({
  records,
  lectureTitle,
  groupName,
  lecturerName,
  classroomName,
  buildingName,
  groupId,
  timetableId,
  sessionId,
  onFinalized
}: AttendanceSummaryProps) {
  const { toast } = useToast();

  // --- Helper: Normalize Data ---
  const normalizeRecord = (r: any): AttendanceRecord => {
    const name = r.studentName || r.student?.user?.full_name || r.student?.name || r.user?.full_name || "اسم غير معروف";
    const id = r.studentId || r.student?.user?.academic_number || r.student?.academic_number || r.academic_number || "---";
    return {
      studentName: name,
      studentId: String(id),
      scanTime: r.scanTime || r.created_at?.slice(11, 16) || "-",
      method: r.method || "QR"
    };
  };

  // --- State ---
  const [allStudents, setAllStudents] = useState<StudentData[]>([]);
  const [presentRecords, setPresentRecords] = useState<AttendanceRecord[]>(() => {
    const savedData = localStorage.getItem(`attendance_session_${sessionId}`);
    if (savedData) return JSON.parse(savedData);
    return Array.isArray(records) ? records.map(normalizeRecord) : [];
  });
  
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [filter, setFilter] = useState<'present' | 'absent'>('present');
  const [searchTerm, setSearchTerm] = useState("");
  const [isFinalizing, setIsFinalizing] = useState(false);

  // --- Persistence ---
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isFinalizing) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    localStorage.setItem(`attendance_session_${sessionId}`, JSON.stringify(presentRecords));
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [presentRecords, sessionId, isFinalizing]);

  // --- Fetch Students ---
  useEffect(() => {
    const fetchAllStudents = async () => {
      if (!groupId) return;
      setIsLoadingStudents(true);
      try {
        const res = await api.get(`/v1/groups/${groupId}/students`);
        const rawData = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        const normalizedStudents: StudentData[] = rawData.map((s: any) => ({
          student_id: s.student_id,
          academic_number: String(s.user?.academic_number || s.academic_number || s.student_university_id || "---"), 
          name: s.user?.full_name || s.name || s.full_name || "اسم طالب غير متوفر"
        }));
        setAllStudents(normalizedStudents);
      } catch (error) {
        console.error("Error fetching students:", error);
        toast({ title: "تنبيه", description: "فشل جلب قائمة الطلاب.", variant: "destructive" });
      } finally {
        setIsLoadingStudents(false);
      }
    };
    fetchAllStudents();
  }, [groupId, toast]);

  // --- Calculations ---
  const absentStudents = useMemo(() => {
    if (allStudents.length === 0) return [];
    const presentIds = new Set(presentRecords.map(r => String(r.studentId).trim()));
    return allStudents.filter(s => !presentIds.has(String(s.academic_number).trim()));
  }, [allStudents, presentRecords]);

  // --- ✅ قائمة الطباعة الموحدة (الكل مرتب أبجدياً) ---
  const printableList = useMemo(() => {
    const presentList = presentRecords.map(r => ({
      name: r.studentName,
      id: r.studentId,
      status: 'present',
      time: r.scanTime,
      method: r.method
    }));

    const absentList = absentStudents.map(s => ({
      name: s.name,
      id: s.academic_number,
      status: 'absent',
      time: '-',
      method: '-'
    }));

    // دمج وترتيب أبجدي
    return [...presentList, ...absentList].sort((a, b) => a.name.localeCompare(b.name));
  }, [presentRecords, absentStudents]);

  const displayedList = useMemo(() => {
    let list: { studentName: string; studentId: string; status: 'present' | 'absent' }[] = [];
    if (filter === 'present') {
      list = presentRecords.map(r => ({ studentName: r.studentName, studentId: r.studentId, status: 'present' }));
    } else {
      list = absentStudents.map(s => ({ studentName: s.name, studentId: s.academic_number, status: 'absent' }));
    }
    if (!searchTerm) return list;
    const lowerTerm = searchTerm.toLowerCase();
    return list.filter(item => item.studentName.toLowerCase().includes(lowerTerm) || String(item.studentId).includes(lowerTerm));
  }, [filter, presentRecords, absentStudents, searchTerm]);

  // --- Actions ---
  const handleToggleStatus = (studentId: string, currentStatus: 'present' | 'absent') => {
    if (currentStatus === 'present') {
      setPresentRecords(prev => prev.filter(r => String(r.studentId) !== String(studentId)));
      toast({ description: "تم تسجيل الطالب غائب." });
    } else {
      const student = allStudents.find(s => String(s.academic_number) === String(studentId));
      if (student) {
        setPresentRecords(prev => [...prev, {
          studentId: student.academic_number,
          studentName: student.name,
          scanTime: "-",
          method: "يدوي"
        }]);
        toast({ description: "تم تسجيل الطالب حاضر.", className: "bg-primary text-white" });
      }
    }
  };

  const handleFinalize = async () => {
    setIsFinalizing(true);
    try {
      const present_student_ids = presentRecords.map(record => {
          const student = allStudents.find(s => String(s.academic_number) === String(record.studentId));
          return student ? student.student_id : null; 
      }).filter(id => id !== null);

      await api.post('/v1/attendance/finalize', {
        timetable_id: Number(timetableId),
        session_id: Number(sessionId),
        present_student_ids: present_student_ids,
        group_id: Number(groupId) 
      });

      localStorage.removeItem(`attendance_session_${sessionId}`);
      toast({ title: "نجاح", description: "تم اعتماد الكشف النهائي." });
      onFinalized();
    } catch (error: any) {
      toast({ title: "خطأ", description: error.response?.data?.message || "فشل حفظ البيانات.", variant: "destructive" });
    } finally {
      setIsFinalizing(false);
    }
  };

  // دالة الطباعة
    const handlePrint = () => {
    // حفظ العنوان الأصلي
    const originalTitle = document.title;
    
    // تغيير العنوان لاسم النظام فقط (ليظهر نظيفاً في الـ PDF)
    document.title = "UniHub";
    
    // تنفيذ أمر الطباعة
    window.print();
    
    // إعادة العنوان الأصلي بعد إغلاق نافذة الطباعة (يحدث فوراً لأن window.print توقف التنفيذ في بعض المتصفحات فقط)
    // لضمان عودته، يمكن وضعه في timeout قصير
    setTimeout(() => {
      document.title = originalTitle;
    }, 100);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* ===================================================================================== */}
      {/* 1. الواجهة التفاعلية (تختفي عند الطباعة بفضل الكلاس print:hidden) */}
      {/* ===================================================================================== */}
      <div className="print:hidden space-y-6">
        
        {/* Header */}
        <Card className="border-t-4 border-t-primary shadow-sm bg-card">
          <CardHeader className="pb-6">
            <div className="flex flex-col gap-6">
              
              {/* الصف الأول: العناوين وزر الطباعة */}
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b pb-4 relative">
                
                <div className="w-full md:w-auto text-right">
                  <CardTitle className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                    {lectureTitle}
                  </CardTitle>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge variant="outline" className="text-sm md:text-base px-3 py-1 font-medium border-primary/30 text-primary bg-primary/5">
                      {groupName}
                    </Badge>
                    {!isLoadingStudents && (
                      <span className="text-xs md:text-sm text-muted-foreground font-medium flex items-center gap-1">
                        <Users className="w-3 h-3 md:w-4 md:h-4" />
                        {allStudents.length} طالب
                      </span>
                    )}
                  </div>
                </div>

                {/* عنوان "كشف حضور" في المنتصف */}
                <div className="order-first md:order-none absolute md:relative top-0 md:top-auto left-1/2 md:left-auto transform -translate-x-1/2 md:translate-x-0 w-full md:w-auto text-center mb-4 md:mb-0">
                  <div className="inline-block border-y-2 border-primary/20 py-1 px-6 bg-primary/5 rounded-sm">
                      <h2 className="text-lg md:text-xl font-extrabold text-primary uppercase tracking-wide">
                        كشف حضور
                      </h2>
                  </div>
                </div>
                
                {/* زر الطباعة + التاريخ */}
                <div className="w-full md:w-auto flex items-center justify-end gap-3">
                  {/* زر الطباعة */}
                  <Button variant="outline" onClick={handlePrint} className="gap-2 h-12 border-primary/20 hover:bg-primary/5 hover:text-primary">
                    <Printer className="w-4 h-4" />
                    <span className="hidden sm:inline">طباعة الكشف</span>
                  </Button>

                  <div className="bg-muted/50 px-4 py-2 rounded-md border text-center min-w-[140px] flex flex-col justify-center shadow-sm h-12">
                    <span className="text-sm font-bold text-foreground block mb-0.5">
                      {new Date().toLocaleDateString('ar-SA', { weekday: 'long' })}
                    </span>
                    <span className="font-mono text-sm font-medium tracking-wide text-muted-foreground" dir="ltr">
                      {new Date().toLocaleDateString('en-CA')} 
                    </span>
                  </div>
                </div>

              </div>

              {/* الصف الثاني: التفاصيل */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-background border hover:bg-accent/5 transition-colors">
                  <div className="p-2 rounded-full bg-primary/10 text-primary"><User className="w-5 h-5" /></div>
                  <div>
                    <p className="text-muted-foreground text-xs">المحاضر</p>
                    <p className="font-semibold text-foreground">{lecturerName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-background border hover:bg-accent/5 transition-colors">
                  <div className="p-2 rounded-full bg-primary/10 text-primary"><MapPin className="w-5 h-5" /></div>
                  <div>
                    <p className="text-muted-foreground text-xs">الموقع</p>
                    <p className="font-semibold text-foreground">{classroomName} - {buildingName}</p>
                  </div>
                </div>
              </div>

            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardContent className="pt-6">
            {/* Statistics */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div onClick={() => setFilter('present')} className={`p-4 rounded-xl border cursor-pointer flex flex-col items-center justify-center transition-all ${filter === 'present' ? 'bg-primary/5 border-primary ring-1 ring-primary' : 'hover:bg-accent'}`}>
                <UserCheck className="w-8 h-8 text-primary mb-2" />
                <span className="text-3xl font-bold text-foreground">{presentRecords.length}</span>
                <span className="text-sm text-muted-foreground">حاضر</span>
              </div>
              <div onClick={() => setFilter('absent')} className={`p-4 rounded-xl border cursor-pointer flex flex-col items-center justify-center transition-all ${filter === 'absent' ? 'bg-destructive/5 border-destructive ring-1 ring-destructive' : 'hover:bg-accent'}`}>
                <UserX className="w-8 h-8 text-destructive mb-2" />
                <span className="text-3xl font-bold text-foreground">{isLoadingStudents ? '...' : (allStudents.length > 0 ? absentStudents.length : '?')}</span>
                <span className="text-sm text-muted-foreground">غائب</span>
              </div>
            </div>

            {/* Search */}
            <div className="mb-4 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="بحث بالاسم أو الرقم..." className="pr-9" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>

            {/* Interactive Table */}
            <div className="border rounded-lg overflow-hidden min-h-[300px]">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-[50px] text-center">#</TableHead>
                    <TableHead className="text-right">اسم الطالب</TableHead>
                    <TableHead className="text-right">الرقم الأكاديمي</TableHead>
                    <TableHead className="text-center">الحالة</TableHead>
                    <TableHead className="text-left">الإجراء</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingStudents && filter === 'absent' ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />جاري التحميل...</TableCell></TableRow>
                  ) : displayedList.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">{filter === 'absent' && allStudents.length === 0 ? "لا توجد بيانات." : "لا توجد نتائج."}</TableCell></TableRow>
                  ) : (
                    displayedList.map((item, index) => (
                      <TableRow key={`${item.studentId}-${index}`} className="hover:bg-muted/50">
                        <TableCell className="text-center font-medium text-muted-foreground">{index + 1}</TableCell>
                        <TableCell className="font-medium">{item.studentName}</TableCell>
                        <TableCell className="font-mono text-sm">{item.studentId}</TableCell>
                        <TableCell className="text-center">
                          {item.status === 'present' ? <Badge className="bg-primary">حاضر</Badge> : <Badge variant="destructive">غائب</Badge>}
                        </TableCell>
                        <TableCell className="text-left">
                          <Button size="sm" variant={item.status === 'present' ? "destructive" : "default"} className="h-8 px-3 text-xs" onClick={() => handleToggleStatus(item.studentId, item.status)}>
                            {item.status === 'present' ? "تغييب" : "تحضير"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Footer Actions */}
            <div className="mt-8 border-t pt-6 bg-muted/20 -mx-6 px-6 pb-2 rounded-b-lg">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground order-2 md:order-1 text-center md:text-right">يرجى مراجعة البيانات بدقة قبل الاعتماد.</p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button disabled={isFinalizing} size="lg" className="order-1 md:order-2 gap-2 w-full md:w-auto min-w-[200px] font-bold shadow-md">
                      {isFinalizing ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                      اعتماد الكشف النهائي
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="max-w-lg">
                    <AlertDialogHeader>
                      <div className="flex items-center gap-3 text-destructive mb-2">
                        <div className="p-2 rounded-full bg-destructive/10"><AlertCircle className="w-6 h-6" /></div>
                        <AlertDialogTitle className="text-xl text-foreground">تنبيه هام جداً</AlertDialogTitle>
                      </div>
                      <AlertDialogDescription className="text-base leading-relaxed space-y-4 text-right text-foreground/90">
                        <p>أنت على وشك اعتماد كشف الحضور والغياب بشكل <strong>نهائي</strong>.</p>
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-md flex gap-3 items-start">
                          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                          <div className="text-sm text-amber-800 dark:text-amber-400 font-medium">
                            بعد التأكيد:
                            <ul className="list-disc list-inside mt-1 space-y-1 opacity-90">
                              <li>لن تتمكن من تعديل الحضور أو الغياب.</li>
                              <li>لن تتمكن من إعادة فتح الجلسة.</li>
                              <li>سيتم احتساب المستحقات المالية فوراً.</li>
                            </ul>
                          </div>
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-4 gap-3 sm:gap-0">
                      <AlertDialogCancel className="h-11">تراجع</AlertDialogCancel>
                      <AlertDialogAction onClick={handleFinalize} className="bg-primary hover:bg-primary/90 font-bold h-11 px-8">نعم، اعتمد</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ===================================================================================== */}
      {/* 2. تصميم الطباعة (يظهر فقط عند الطباعة) */}
      {/* ===================================================================================== */}
      <div className="hidden print:block p-8 bg-white text-black" dir="rtl">
        
        {/* الترويسة الرسمية للطباعة */}
        <div className="border-b-2 border-black pb-6 mb-6">
           <div className="flex justify-between items-start">
              <div className="text-right">
                  <h1 className="text-2xl font-bold mb-2">كشف حضور وغياب الطلاب</h1>
                  <p className="text-sm mb-1"><strong>المادة:</strong> {lectureTitle}</p>
                  <p className="text-sm mb-1"><strong>المجموعة:</strong> {groupName}</p>
              </div>
              <div className="text-left">
                  <p className="text-sm mb-1"><strong>التاريخ:</strong> {new Date().toLocaleDateString('en-CA')}</p>
                  <p className="text-sm mb-1"><strong>الوقت:</strong> {new Date().toLocaleTimeString('ar-SA', {hour:'2-digit', minute:'2-digit'})}</p>
                  {/* <p className="text-sm mb-1"><strong>رقم الجلسة:</strong> {sessionId}</p> */}
              </div>
           </div>
           <div className="mt-4 flex justify-between items-center bg-gray-100 p-2 border border-gray-300 rounded">
              <p className="text-sm"><strong>المحاضر:</strong> {lecturerName}</p>
              <p className="text-sm"><strong>القاعة:</strong> {classroomName} - {buildingName}</p>
           </div>
           {/* إحصائيات سريعة */}
           <div className="mt-2 flex gap-6 text-sm">
              <span><strong>إجمالي الطلاب:</strong> {printableList.length}</span>
              <span><strong>حضور:</strong> {presentRecords.length}</span>
              <span><strong>غياب:</strong> {absentStudents.length}</span>
           </div>
        </div>

        {/* جدول الطباعة */}
        <table className="w-full border-collapse text-sm text-right">
            <thead>
                <tr className="bg-gray-100">
                    <th className="border border-black px-2 py-1 w-10 text-center">#</th>
                    <th className="border border-black px-2 py-1">اسم الطالب</th>
                    <th className="border border-black px-2 py-1 w-32">الرقم الجامعي</th>
                    <th className="border border-black px-2 py-1 w-24 text-center">الحالة</th>
                    <th className="border border-black px-2 py-1 w-24 text-center">الطريقة</th>
                </tr>
            </thead>
            <tbody>
                {printableList.map((student, index) => (
                    <tr key={student.id}>
                        <td className="border border-black px-2 py-1 text-center">{index + 1}</td>
                        <td className="border border-black px-2 py-1">{student.name}</td>
                        <td className="border border-black px-2 py-1 font-mono dir-ltr">{student.id}</td>
                        <td className="border border-black px-2 py-1 text-center">
                            {student.status === 'present' ? 'حاضر' : 'غائب'}
                        </td>
                        <td className="border border-black px-2 py-1 text-center text-xs">
                             {student.status === 'present' ? (student.method === 'QR' ? 'QR Code' : 'يدوي') : '-'}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>

        {/* التذييل والتوقيع */}
        <div className="mt-12 flex justify-between items-center">
             <div className="text-center w-1/3">
                 <p className="mb-8 font-bold">توقيع المحاضر</p>
                 <div className="border-b border-black border-dashed w-full"></div>
             </div>
             <div className="text-center w-1/3">
                 <p className="mb-8 font-bold">اعتماد القسم</p>
                 <div className="border-b border-black border-dashed w-full"></div>
             </div>
        </div>
        
        <div className="mt-8 text-center text-xs text-gray-500">
            تم استخراج هذا الكشف إلكترونياً من النظام الأكاديمي UniHub
        </div>
      </div>

    </div>
  );
}