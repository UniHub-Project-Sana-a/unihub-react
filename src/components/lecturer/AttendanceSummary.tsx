// src/components/lecturer/AttendanceSummary.tsx

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Users, UserCheck, UserX, Search, ShieldCheck } from "lucide-react";
import { AttendanceRecord } from "@/pages/LecturerPage";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";

// واجهة لبيانات الطالب الكاملة
interface FullStudent {
  student_id: number;
  name: string;
  academic_number: string;
}

// ✅ 1. تحديث واجهة الخصائص
interface AttendanceSummaryProps {
  records: AttendanceRecord[]; // <-- تم تصحيح الاسم هنا
  lectureTitle: string;
  groupName: string;
  groupId: string;
  timetableId: string;
  onFinalized: () => void;
}

export function AttendanceSummary({ records, lectureTitle, groupName, groupId, timetableId, onFinalized  }: AttendanceSummaryProps) {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [allStudents, setAllStudents] = useState<FullStudent[]>([]);
  const [presentRecords, setPresentRecords] = useState<AttendanceRecord[]>(records);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'present' | 'absent'>('present');
  const [searchTerm, setSearchTerm] = useState("");
  const [isFinalizing, setIsFinalizing] = useState(false);

  // جلب قائمة الطلاب الكاملة للمجموعة
  useEffect(() => {
    const fetchAllStudents = async () => {
      if (!groupId) return;
      setIsLoading(true);
      try {
        const res = await api.get(`/v1/groups/${groupId}/students`);
        setAllStudents(res.data?.data || []);
      } catch (error) {
        toast({ title: "خطأ", description: "فشل جلب قائمة طلاب المجموعة.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllStudents();
  }, [groupId, toast]);

  const absentStudents = useMemo(() => {
    if (allStudents.length === 0) return [];
    const presentStudentIds = new Set(presentRecords.map(r => r.studentId));
    return allStudents.filter(s => !presentStudentIds.has(s.academic_number));
  }, [allStudents, presentRecords]);

  const displayedList = useMemo(() => {
    let list: (AttendanceRecord | { studentName: string; studentId: string; scanTime: string; method: string })[] = [];
    if (filter === 'present') {
      list = presentRecords;
    } else {
      list = absentStudents.map(s => ({
        studentName: s.name,
        studentId: s.academic_number,
        scanTime: "N/A",
        method: "غائب"
      }));
    }
    if (!searchTerm) return list;
    return list.filter(item => 
      item.studentName.includes(searchTerm) || item.studentId.includes(searchTerm)
    );
  }, [filter, presentRecords, absentStudents, searchTerm]);

  const toggleStudentStatus = (studentId: string) => {
    if (filter === 'present') {
      setPresentRecords(prev => prev.filter(r => r.studentId !== studentId));
    } else {
      const student = allStudents.find(s => s.academic_number === studentId);
      if (student) {
        const newRecord: AttendanceRecord = {
          studentId: student.academic_number,
          studentName: student.name,
          scanTime: new Date().toLocaleTimeString('ar-SA'),
          method: 'يدوي'
        };
        setPresentRecords(prev => [...prev, newRecord].sort((a, b) => a.studentName.localeCompare(b.studentName)));
      }
    }
  };

  const handleFinalize = async () => {
    if (!confirm("هل أنت متأكد من المصادقة على هذه القائمة؟ سيتم تسجيل الحضور والغياب بشكل نهائي.")) return;
    
    setIsFinalizing(true);
    try {
      // ✅ 1. استخراج معرفات الطلاب الحاضرين فقط
      const present_student_ids = presentRecords.map(record => {
          // ابحث عن الطالب في القائمة الكاملة للحصول على student_id الرقمي
          const student = allStudents.find(s => s.academic_number === record.studentId);
          return student ? student.student_id : null;
      }).filter(id => id !== null); // إزالة أي قيم null في حال عدم العثور على طالب

      console.log("Finalizing session with timetable_id:", timetableId);
      console.log("Sending PRESENT student IDs:", present_student_ids);

      // ✅ 2. إرسال الحمولة الجديدة إلى الـ API
      await api.post('/v1/attendance/finalize', {
        timetable_id: Number(timetableId),
        present_student_ids: present_student_ids, // <-- الاسم الجديد للمصفوفة
        group_id: Number(groupId) // <-- إرسال groupId ليتمكن الخادم من جلب كل الطلاب
      });

      toast({ title: "نجاح", description: "تمت مصادقة الجلسة بنجاح." });
      onFinalized();

    } catch (error: any) {
      console.error("Finalization failed:", error.response?.data || error);
      const errorMessage = error.response?.data?.message || "فشل إرسال البيانات النهائية.";
      toast({
        title: "خطأ في المصادقة",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsFinalizing(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center p-10"><Loader2 className="w-8 h-8 animate-spin" /><span>جاري تحميل قائمة الطلاب...</span></div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">ملخص حضور - {lectureTitle}</CardTitle>
          <CardDescription>{groupName}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card onClick={() => setFilter('present')} className={`p-4 text-center cursor-pointer transition-all ${filter === 'present' ? 'border-primary ring-2 ring-primary' : 'hover:bg-muted'}`}>
              <UserCheck className="mx-auto w-8 h-8 text-green-500" />
              <p className="text-2xl font-bold mt-2">{presentRecords.length}</p>
              <p className="text-muted-foreground">إجمالي الحضور</p>
            </Card>
            <Card onClick={() => setFilter('absent')} className={`p-4 text-center cursor-pointer transition-all ${filter === 'absent' ? 'border-destructive ring-2 ring-destructive' : 'hover:bg-muted'}`}>
              <UserX className="mx-auto w-8 h-8 text-destructive" />
              <p className="text-2xl font-bold mt-2">{absentStudents.length}</p>
              <p className="text-muted-foreground">إجمالي الغياب</p>
            </Card>
          </div>

          <div className="mb-4">
            <Label htmlFor="search-student">بحث بالاسم أو الرقم الأكاديمي</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input id="search-student" placeholder="بحث..." className="pl-9" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>اسم الطالب</TableHead>
                  <TableHead>الرقم الأكاديمي</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-left">تغيير الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedList.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8">لا توجد سجلات لعرضها حسب الفلتر الحالي.</TableCell></TableRow>
                ) : (
                  displayedList.map((item, index) => (
                    <TableRow key={`${item.studentId}-${index}`}>
                      <TableCell>{item.studentName}</TableCell>
                      <TableCell>{item.studentId}</TableCell>
                      <TableCell>
                        {item.method === 'غائب' ? <Badge variant="destructive">غائب</Badge> : <Badge variant="default">حاضر</Badge>}
                      </TableCell>
                      <TableCell className="text-left">
                        <Button size="sm" variant="outline" onClick={() => toggleStudentStatus(item.studentId)}>
                          {item.method === 'غائب' ? "تحضير" : "تغييب"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-6 flex justify-end">
            <Button onClick={handleFinalize} disabled={isFinalizing} size="lg" className="gap-2">
              {isFinalizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              مصادقة وإنهاء
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}