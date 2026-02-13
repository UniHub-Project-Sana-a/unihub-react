import React, { useState, useEffect } from 'react';
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Search, FileText, CheckCircle2, XCircle, Filter } from "lucide-react";

// --- Types ---
interface TimetableSummary {
    timetable_id: number;
    course_name: string;
    course_code: string;
    lecturer_name: string;
    group_name: string;
    program_name: string;
    sessions_held: number;
    students_count: number;
}

interface SessionDetail {
    session_date: string;
    attendance_count: number;
    topics: { title: string; coverage_status: string }[];
    quiz_stats: { participants: number; success_rate: number; };
}

interface ExecutionDetail {
    header: {
        course: string; lecturer: string; group: string;
        total_sessions: number; topics_coverage: string;
    };
    sessions_log: SessionDetail[];
}

interface FilterMeta {
    academic_years: string[];
    departments: { department_id: number; department_name: string }[];
    programs: { program_id: number; program_name: string }[];
}

export default function CourseExecutionReports({ collegeId }: { collegeId: number }) {
    // States
    const [academicYear, setAcademicYear] = useState("2025-2026"); // يمكن جعلها ديناميكية
    const [timetables, setTimetables] = useState<TimetableSummary[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [meta, setMeta] = useState<FilterMeta>({ academic_years: [], departments: [], programs: [] });
    const [filters, setFilters] = useState({
        academic_year: "",
        department_id: "",
        semester_id: "", 
    });
    
    
    // Details Dialog State
    const [selectedTimetableId, setSelectedTimetableId] = useState<number | null>(null);
    const [details, setDetails] = useState<ExecutionDetail | null>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    
    // 1. Fetch Filters Data (عند تحميل الصفحة)
    useEffect(() => {
        const fetchFilters = async () => {
            try {
                const res = await api.get(`/qa/reports/execution/filters-meta?college_id=${collegeId}`);
                setMeta(res.data);
                // تحديد أحدث سنة افتراضياً
                if (res.data.academic_years.length > 0) {
                    setFilters(prev => ({ ...prev, academic_year: res.data.academic_years[0] }));
                }
            } catch (e) { console.error(e); }
        };
        fetchFilters();
    }, [collegeId]);

    // 2. Fetch List
    const handleSearch = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/qa/reports/execution/list', {
                params: { college_id: collegeId, academic_year: academicYear, department_id: filters.department_id }
            });
            setTimetables(res.data);
        } catch (e) { console.error(e); } 
        finally { setIsLoading(false); }
    };

    // تنفيذ البحث تلقائياً عند تحميل الفلاتر أول مرة
    useEffect(() => {
        if (filters.academic_year) handleSearch();
    }, [filters.academic_year]);

    // 3. Fetch Details
    const openDetails = async (id: number) => {
        setSelectedTimetableId(id);
        setLoadingDetails(true);
        try {
            const res = await api.get(`/qa/reports/execution/details/${id}`);
            setDetails(res.data);
        } catch (e) { console.error(e); } 
        finally { setLoadingDetails(false); }
    };

    

    return (
        <div className="space-y-6" dir="rtl">
            
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl border shadow-sm items-end">
                
                {/* السنة الدراسية */}
                <div className="space-y-2 w-full md:w-[200px]">
                    <label className="text-sm font-medium text-muted-foreground">السنة الدراسية</label>
                    <Select value={filters.academic_year} onValueChange={(v) => setFilters({...filters, academic_year: v})}>
                        <SelectTrigger className="bg-muted/30">
                            <SelectValue placeholder="اختر السنة" />
                        </SelectTrigger>
                        <SelectContent dir="rtl">
                            {meta.academic_years.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                {/* القسم */}
                <div className="space-y-2 w-full md:w-[250px]">
                    <label className="text-sm font-medium text-muted-foreground">القسم العلمي</label>
                    <Select value={filters.department_id} onValueChange={(v) => setFilters({...filters, department_id: v})}>
                        <SelectTrigger className="bg-muted/30">
                            <SelectValue placeholder="كل الأقسام" />
                        </SelectTrigger>
                        <SelectContent dir="rtl">
                            <SelectItem value="0">عرض الكل</SelectItem>
                            {meta.departments.map((d) => <SelectItem key={d.department_id} value={String(d.department_id)}>{d.department_name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                {/* زر البحث */}
                <Button onClick={handleSearch} disabled={isLoading} className="w-full md:w-auto gap-2 min-w-[120px]">
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Filter className="w-4 h-4" />}
                    تطبيق الفلتر
                </Button>
            </div>

            {/* Results Table */}
            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="text-right">المقرر</TableHead>
                            <TableHead className="text-right">المحاضر</TableHead>
                            <TableHead className="text-right">المجموعة</TableHead>
                            <TableHead className="text-center">الجلسات المنفذة</TableHead>
                            <TableHead className="text-center">عدد الطلاب</TableHead>
                            <TableHead className="text-center">الإجراء</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {timetables.map((t) => (
                            <TableRow key={t.timetable_id} className="hover:bg-muted/5">
                                <TableCell className="font-medium">
                                    {t.course_name} <br/> <span className="text-xs text-muted-foreground">{t.course_code}</span>
                                </TableCell>
                                <TableCell>{t.lecturer_name}</TableCell>
                                <TableCell><Badge variant="outline">{t.group_name}</Badge></TableCell>
                                <TableCell className="text-center font-bold text-blue-600">{t.sessions_held}</TableCell>
                                <TableCell className="text-center">{t.students_count}</TableCell>
                                <TableCell className="text-center">
                                    <Button variant="secondary" size="sm" onClick={() => openDetails(t.timetable_id)}>
                                        <FileText className="w-4 h-4 ml-2" /> التفاصيل
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {timetables.length === 0 && !isLoading && (
                            <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">لا توجد بيانات مطابقة</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Details Dialog */}
            <Dialog open={!!selectedTimetableId} onOpenChange={(open) => !open && setSelectedTimetableId(null)}>
                <DialogContent className="max-w-4xl h-[85vh] flex flex-col" dir="rtl">
                    <DialogHeader>
                        <DialogTitle>تقرير تنفيذ المقرر ومخرجات التعلم</DialogTitle>
                        <DialogDescription>تفاصيل المواضيع التي تم شرحها وأداء الطلاب في كل جلسة.</DialogDescription>
                    </DialogHeader>

                    {loadingDetails ? (
                        <div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                    ) : details ? (
                        <div className="flex-1 overflow-hidden flex flex-col gap-4">
                            
                            {/* Header Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-muted/20 p-4 rounded-lg border">
                                <div><p className="text-xs text-muted-foreground">المقرر</p><p className="font-bold">{details.header.course}</p></div>
                                <div><p className="text-xs text-muted-foreground">المحاضر</p><p className="font-bold">{details.header.lecturer}</p></div>
                                <div><p className="text-xs text-muted-foreground">نسبة تغطية المواضيع</p><p className="font-bold text-green-600">{details.header.topics_coverage}</p></div>
                                <div><p className="text-xs text-muted-foreground">إجمالي الجلسات</p><p className="font-bold text-blue-600">{details.header.total_sessions}</p></div>
                            </div>

                            {/* Sessions List */}
                            <ScrollArea className="flex-1 border rounded-lg p-4">
                                <div className="space-y-6">
                                    {details.sessions_log.map((session, idx) => (
                                        <div key={idx} className="relative border-r-2 border-primary/20 pr-4 mr-2 pb-6 last:pb-0">
                                            {/* Timeline Dot */}
                                            <div className="absolute -right-[9px] top-0 w-4 h-4 rounded-full bg-primary/20 border-2 border-white flex items-center justify-center">
                                                <div className="w-2 h-2 rounded-full bg-primary" />
                                            </div>

                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-bold text-sm">الجلسة بتاريخ: {session.session_date}</h4>
                                                <Badge variant="outline">حضور: {session.attendance_count}</Badge>
                                            </div>

                                            {/* Topics */}
                                            <div className="bg-gray-50 p-3 rounded-md mb-2">
                                                <p className="text-xs font-semibold text-muted-foreground mb-2">المواضيع المغطاة:</p>
                                                <ul className="space-y-1">
                                                    {session.topics.map((t, i) => (
                                                        <li key={i} className="text-sm flex items-center gap-2">
                                                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                                                            {t.title}
                                                        </li>
                                                    ))}
                                                    {session.topics.length === 0 && <li className="text-sm text-muted-foreground italic">لم يتم تسجيل مواضيع</li>}
                                                </ul>
                                            </div>

                                            {/* Quiz Stats */}
                                            <div className="flex items-center gap-4 text-xs bg-blue-50/50 p-2 rounded border border-blue-100">
                                                <span className="font-semibold text-blue-700">📊 التقييم الفوري:</span>
                                                <span>مشاركون: {session.quiz_stats.participants}</span>
                                                <span>نسبة الإجابات الصحيحة: <span className={session.quiz_stats.success_rate > 50 ? "text-green-600 font-bold" : "text-red-600 font-bold"}>{session.quiz_stats.success_rate}%</span></span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    ) : null}
                </DialogContent>
            </Dialog>
        </div>
    );
}