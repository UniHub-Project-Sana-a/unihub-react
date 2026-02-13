import React, { useState, useEffect } from 'react';
import { api } from "@/lib/api";
import { 
    Card, CardContent, CardDescription, CardHeader, CardTitle 
} from "@/components/ui/card";
import { 
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { 
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
    Loader2, Users, TrendingUp, BarChart3, HelpCircle, FileText, Target, Download, User, Trophy, Medal, Star, Printer
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PDFDownloadLink } from '@react-pdf/renderer';
import { QaReportDocument } from '@/components/reports/QaReportDocument';
import { QaReportPrintDialog } from '@/components/reports/QaReportPrintDialog'; 

// --- Types ---
interface CampaignSimple { 
    campaign_id: number; 
    campaign_name: string; 
}

interface TimetableSimple { 
    timetable_id: number; 
    course_name: string; 
    lecturer_name: string; 
    lecture_type: number; 
    group_name: string;
}

interface ReportData {
    summary: {
        total_submissions: number;
        overall_score: number;
        overall_percentage: number;
        target_percentage: number;
    };
    domains_analysis: {
        name: string; 
        score: number; 
        percentage: number;
        questions: { 
            question: string; 
            avg_score: number; 
            distribution: { agree: number; neutral: number; disagree: number; }; 
        }[];
    }[];
    leaderboard: {
        name: string; 
        course: string; 
        eval_count: number; 
        score: number; 
        percentage: number; 
        rating_label: string; 
        is_current: boolean; 
    }[];
}

export default function QaReportsDashboard({ collegeId }: { collegeId: number }) {
    const [campaigns, setCampaigns] = useState<CampaignSimple[]>([]);
    const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
    
    const [timetables, setTimetables] = useState<TimetableSimple[]>([]);
    const [selectedTimetableId, setSelectedTimetableId] = useState<string>("");

    const [data, setData] = useState<ReportData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    // ✅ 2. State جديد للطباعة
    const [isPrintOpen, setIsPrintOpen] = useState(false);
    const [printType, setPrintType] = useState<'single' | 'full'>('full');

    // 1. جلب الحملات
    useEffect(() => {
        const fetchCampaigns = async () => {
            try {
                const res = await api.get(`/v1/qa/campaigns?college_id=${collegeId}`);
                setCampaigns(res.data);
                if (res.data.length > 0) setSelectedCampaignId(String(res.data[0].campaign_id));
            } catch (e) { console.error(e); }
        };
        fetchCampaigns();
    }, [collegeId]);

    // 2. جلب الجداول
    useEffect(() => {
        if (!selectedCampaignId) return;
        const fetchTimetables = async () => {
            try {
                const res = await api.get(`/v1/qa/reports/campaign-timetables?campaign_id=${selectedCampaignId}`);
                setTimetables(res.data);
                if (res.data.length > 0) setSelectedTimetableId(String(res.data[0].timetable_id));
                else setSelectedTimetableId("");
            } catch (e) { console.error(e); }
        };
        fetchTimetables();
    }, [selectedCampaignId]);

    // 3. جلب التقرير
    useEffect(() => {
        if (!selectedCampaignId) return;
        const fetchReport = async () => {
            setIsLoading(true);
            try {
                const res = await api.get(`/v1/qa/reports/campaign-summary`, {
                    params: { 
                        campaign_id: selectedCampaignId, 
                        college_id: collegeId,
                        timetable_id: selectedTimetableId 
                    }
                });
                setData(res.data);
            } catch (e) { console.error(e); } 
            finally { setIsLoading(false); }
        };
        fetchReport();
    }, [selectedCampaignId, selectedTimetableId, collegeId]);

    // --- Helpers ---
    const getScoreColor = (s: number) => s >= 2.5 ? "text-green-600" : s >= 2.0 ? "text-blue-600" : s >= 1.5 ? "text-yellow-600" : "text-red-600";
    const getProgressColor = (s: number) => s >= 2.5 ? "bg-green-600" : s >= 2.0 ? "bg-blue-600" : s >= 1.5 ? "bg-yellow-500" : "bg-red-500";
    
    const currentTimetable = timetables.find(t => String(t.timetable_id) === selectedTimetableId);
    const currentCampaignName = campaigns.find(c => String(c.campaign_id) === selectedCampaignId)?.campaign_name || "تقرير الجودة";

    // استخراج أفضل 3 محاضرين
    const topPerformers = data?.leaderboard.slice(0, 3) || [];

    return (
        <div className="space-y-8" dir="rtl">
            
            {/* 1. الشريط العلوي */}
            <div className="flex flex-col md:flex-row justify-between gap-4 bg-white p-4 rounded-xl border shadow-sm items-start md:items-center">
                <div>
                    <h3 className="font-bold text-xl text-primary flex items-center gap-2">
                        <BarChart3 className="w-5 h-5"/> لوحة تحليلات الجودة
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">اختر الحملة ثم المقرر لعرض التفاصيل.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
                        <SelectTrigger className="w-full sm:w-[250px] bg-muted/30">
                            <SelectValue placeholder="اختر الحملة" />
                        </SelectTrigger>
                        <SelectContent dir="rtl">
                            {campaigns.map(c => <SelectItem key={c.campaign_id} value={String(c.campaign_id)}>{c.campaign_name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    
                    <Select value={selectedTimetableId} onValueChange={setSelectedTimetableId}>
                        <SelectTrigger className="w-full sm:w-[350px] border-primary/30 bg-primary/5 text-primary font-medium">
                            <SelectValue placeholder="اختر المقرر/المحاضر" />
                        </SelectTrigger>
                        <SelectContent dir="rtl">
                            {timetables.map(t => (
                                <SelectItem key={t.timetable_id} value={String(t.timetable_id)}>
                                    {t.course_name} - {t.lecturer_name} ({Number(t.lecture_type) === 1 ? 'عملي' : 'نظري'})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>
            ) : !data ? (
                <div className="text-center py-20 border-2 border-dashed rounded-lg bg-muted/5 text-muted-foreground">لا توجد بيانات متاحة</div>
            ) : (
                <div className="space-y-8 animate-in fade-in duration-500">
                    
                    {/* 2. البطاقة التعريفية (Hero Card) */}
                    {currentTimetable && (
                        <div className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-xl p-6 shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-20 blur-3xl"></div>
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30 border-0">
                                            {Number(currentTimetable.lecture_type) === 1 ? 'عملي' : 'نظري'}
                                        </Badge>
                                        <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30 border-0">
                                            {currentTimetable.group_name}
                                        </Badge>
                                    </div>
                                    <h2 className="text-3xl font-bold">{currentTimetable.course_name}</h2>
                                    <div className="flex items-center gap-4 text-primary-foreground/90 text-sm">
                                        <span className="flex items-center gap-1"><User className="w-4 h-4" /> د. {currentTimetable.lecturer_name}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 bg-white/10 p-2 pr-6 rounded-lg backdrop-blur-sm border border-white/10">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold">{data.summary.overall_score}</div>
                                        <div className="text-[10px] opacity-70">المتوسط / 3</div>
                                    </div>
                                    <div className="w-px h-8 bg-white/20"></div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold">{data.summary.overall_percentage}%</div>
                                        <div className="text-[10px] opacity-70">النسبة</div>
                                    </div>
                                    <div className="mr-2">
                                            <Button 
                                                size="icon" 
                                                variant="secondary" 
                                                onClick={() => {
                                                    setPrintType('single'); // طباعة مخصصة لهذا المقرر
                                                    setIsPrintOpen(true);
                                                }}
                                                className="h-10 w-10 rounded-full shadow-md hover:bg-white/20"
                                                title="طباعة تقرير هذا المقرر"
                                            >
                                                <Printer className="w-5 h-5" />
                                            </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 3. الإحصائيات العامة (KPIs) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="border-r-4 border-r-blue-500 shadow-sm">
                            <CardContent className="p-4 flex justify-between items-center">
                                <div><p className="text-sm text-muted-foreground">عدد الاستجابات</p><h4 className="text-2xl font-bold">{data.summary.total_submissions}</h4></div>
                                <div className="bg-blue-50 p-2 rounded-full"><Users className="w-6 h-6 text-blue-500" /></div>
                            </CardContent>
                        </Card>
                        <Card className="border-r-4 border-r-green-500 shadow-sm">
                            <CardContent className="p-4 flex justify-between items-center">
                                <div><p className="text-sm text-muted-foreground">المتوسط العام</p><h4 className={cn("text-2xl font-bold", getScoreColor(data.summary.overall_score))}>{data.summary.overall_score}</h4></div>
                                <div className="bg-green-50 p-2 rounded-full"><TrendingUp className="w-6 h-6 text-green-500" /></div>
                            </CardContent>
                        </Card>
                        <Card className={cn("border-r-4 shadow-sm", data.summary.overall_percentage >= data.summary.target_percentage ? "border-r-green-600" : "border-r-yellow-500")}>
                            <CardContent className="p-4 flex justify-between items-center">
                                <div><p className="text-sm text-muted-foreground">الهدف ({data.summary.target_percentage}%)</p><h4 className="text-lg font-bold flex items-center gap-1">{data.summary.overall_percentage >= data.summary.target_percentage ? "محقق ✅" : "غير محقق ⚠️"}</h4></div>
                                <div className="bg-gray-100 p-2 rounded-full"><Target className="w-6 h-6 text-gray-600" /></div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* ✅ 4. (NEW) أفضل المحاضرين (Top Performers) في الأعلى */}
                    {topPerformers.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {topPerformers.map((perf, idx) => (
                                <Card key={idx} className="relative overflow-hidden border-yellow-200 bg-gradient-to-br from-yellow-50/50 to-white">
                                    <div className="absolute top-0 left-0 p-3">
                                        {idx === 0 && <Medal className="w-8 h-8 text-yellow-500 drop-shadow-sm" />}
                                        {idx === 1 && <Medal className="w-7 h-7 text-gray-400 drop-shadow-sm" />}
                                        {idx === 2 && <Medal className="w-6 h-6 text-orange-400 drop-shadow-sm" />}
                                    </div>
                                    <CardContent className="p-5 text-center pt-8">
                                        <div className="w-16 h-16 rounded-full bg-white border-2 border-yellow-100 flex items-center justify-center mx-auto mb-3 shadow-sm">
                                            <Trophy className={cn("w-8 h-8", idx===0?"text-yellow-500":idx===1?"text-gray-400":"text-orange-500")} />
                                        </div>
                                        <h4 className="font-bold text-lg line-clamp-1">{perf.name}</h4>
                                        <p className="text-xs text-muted-foreground mb-3 line-clamp-1">{perf.course}</p>
                                        <div className="flex justify-center items-center gap-2">
                                            <Badge variant="secondary" className="font-bold">{perf.score}</Badge>
                                            <span className="text-sm font-bold text-primary">{perf.percentage}%</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* 5. جدول المقارنة الشامل (Leaderboard) - تصميم مميز للأوائل */}
                    <Card className="mt-8 shadow-md overflow-hidden border-t-4 border-t-gray-700">
                        <CardHeader className="bg-gray-50/50 pb-4">
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                <div>
                                    <CardTitle className="flex items-center gap-2 text-xl">
                                        <Trophy className="w-6 h-6 text-yellow-500"/>
                                        لوحة الصدارة (Leaderboard)
                                    </CardTitle>
                                    <CardDescription>ترتيب جميع المحاضرين في الحملة بناءً على الأداء</CardDescription>
                                </div>
                                
                                {/* مجموعة الإجراءات: الزر + البادج */}
                                <div className="flex items-center gap-2">
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        className="gap-2 border-gray-300 text-gray-700 hover:bg-white hover:text-primary hover:border-primary/30 shadow-sm"
                                        onClick={() => {
                                            setPrintType('full'); // طباعة شاملة (Leaderboard)
                                            setIsPrintOpen(true);
                                        }}
                                    >
                                        <Printer className="w-4 h-4" />
                                        طباعة التقرير الشامل
                                    </Button>

                                    <Badge variant="outline" className="bg-white h-9 px-3 border-gray-300">
                                        {data.leaderboard.length} محاضر
                                    </Badge>
                                </div>
                            </div>
                        </CardHeader>
                        
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-gray-100/80">
                                    <TableRow>
                                        <TableHead className="w-[60px] text-center font-bold text-gray-700">الترتيب</TableHead>
                                        <TableHead className="text-right font-bold text-gray-700">المحاضر</TableHead>
                                        <TableHead className="text-right font-bold text-gray-700">المقرر</TableHead>
                                        <TableHead className="text-center font-bold text-gray-700">الاستجابات</TableHead>
                                        <TableHead className="text-center font-bold text-gray-700">الدرجة</TableHead>
                                        <TableHead className="text-center w-[180px] font-bold text-gray-700">الأداء النسبي</TableHead>
                                        <TableHead className="text-center font-bold text-gray-700">التقدير</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.leaderboard.map((item, idx) => {
                                        // تحديد ستايل الصف بناءً على الترتيب وحالة الاختيار
                                        let rowStyle = "hover:bg-muted/5 transition-colors"; // الافتراضي
                                        let rankBadge = <span className="font-bold text-muted-foreground">{idx + 1}</span>;

                                        // تمييز الصف المختار حالياً (له الأولوية)
                                        if (item.is_current) {
                                            rowStyle = "bg-blue-50 ring-1 ring-blue-200 border-l-4 border-l-blue-500";
                                        } 
                                        // تمييز الأوائل (إذا لم يكن هو المختار حالياً)
                                        else if (idx === 0) rowStyle = "bg-gradient-to-r from-yellow-50/80 to-transparent border-l-4 border-l-yellow-400"; // الأول
                                        else if (idx === 1) rowStyle = "bg-gradient-to-r from-slate-50/80 to-transparent border-l-4 border-l-slate-400";   // الثاني
                                        else if (idx === 2) rowStyle = "bg-gradient-to-r from-orange-50/80 to-transparent border-l-4 border-l-orange-400"; // الثالث

                                        // أيقونات الترتيب
                                        if (idx === 0) rankBadge = <div className="mx-auto w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center border border-yellow-300 shadow-sm"><Trophy className="w-4 h-4 text-yellow-600" /></div>;
                                        else if (idx === 1) rankBadge = <div className="mx-auto w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-300 shadow-sm"><Medal className="w-4 h-4 text-slate-600" /></div>;
                                        else if (idx === 2) rankBadge = <div className="mx-auto w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center border border-orange-300 shadow-sm"><Medal className="w-4 h-4 text-orange-600" /></div>;

                                        return (
                                            <TableRow key={idx} className={rowStyle}>
                                                <TableCell className="text-center p-3">
                                                    {rankBadge}
                                                </TableCell>
                                                
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className={cn("font-semibold text-base", idx < 3 ? "text-primary" : "text-gray-700")}>
                                                            {item.name}
                                                        </span>
                                                        {item.is_current && <Badge className="w-fit mt-1 text-[10px] h-5 bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200">المعروض حالياً</Badge>}
                                                    </div>
                                                </TableCell>
                                                
                                                <TableCell className="text-muted-foreground text-sm">
                                                    <div className="flex items-center gap-2">
                                                        {item.course}
                                                    </div>
                                                </TableCell>
                                                
                                                <TableCell className="text-center font-mono text-gray-600">{item.eval_count}</TableCell>
                                                
                                                <TableCell className="text-center">
                                                    <span className={cn("font-bold text-lg", getScoreColor(item.score))}>
                                                        {item.score}
                                                    </span>
                                                </TableCell>
                                                
                                                <TableCell className="text-center">
                                                    <div className="flex items-center gap-2">
                                                        <Progress value={item.percentage} className="h-2 flex-1 bg-gray-200" indicatorClassName={getProgressColor(item.score)} />
                                                        <span className="text-xs font-bold text-muted-foreground w-9 text-left">{item.percentage}%</span>
                                                    </div>
                                                </TableCell>
                                                
                                                <TableCell className="text-center">
                                                    <Badge variant="outline" className={cn(
                                                        "font-medium shadow-sm px-3",
                                                        item.rating_label === 'ممتاز' ? "border-green-500 text-green-700 bg-green-50" :
                                                        item.rating_label === 'جيد جداً' ? "border-blue-500 text-blue-700 bg-blue-50" :
                                                        item.rating_label === 'متوسط' ? "border-yellow-500 text-yellow-700 bg-yellow-50" :
                                                        "border-red-500 text-red-700 bg-red-50"
                                                    )}>
                                                        {item.rating_label}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* ✅ 6. (Merged) تحليل المجالات والأسئلة (مدمج في كروت واحدة) */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold flex items-center gap-2 text-gray-700">
                            <HelpCircle className="w-5 h-5 text-primary" />
                            التحليل التفصيلي للمجالات والفقرات
                        </h3>
                        
                        {data.domains_analysis.map((domain, dIdx) => (
                            <Card key={dIdx} className="shadow-sm border-t-4 border-t-primary/20 overflow-hidden">
                                {/* رأس البطاقة: يعرض أداء المجال */}
                                <CardHeader className="bg-muted/10 py-4 border-b">
                                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                                        <div>
                                            <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
                                                <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center">{dIdx + 1}</Badge>
                                                {domain.name}
                                            </CardTitle>
                                        </div>
                                        <div className="flex items-center gap-4 min-w-[250px]">
                                            <div className="text-left w-full">
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-xs text-muted-foreground">أداء المجال</span>
                                                    <span className={cn("text-sm font-bold", getScoreColor(domain.score))}>{domain.score}</span>
                                                </div>
                                                <Progress value={domain.percentage} className="h-2.5 bg-white border" indicatorClassName={getProgressColor(domain.score)} />
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                
                                {/* جسم البطاقة: يعرض الأسئلة */}
                                <CardContent className="p-0">
                                    <div className="divide-y">
                                        {domain.questions.map((q, qIdx) => (
                                            <div key={qIdx} className="p-4 hover:bg-gray-50/50 transition-colors grid grid-cols-1 md:grid-cols-[1fr_220px] gap-6 items-center">
                                                
                                                {/* تفاصيل السؤال */}
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-start">
                                                        <p className="text-sm font-medium leading-relaxed flex gap-2 text-gray-700">
                                                            <span className="text-muted-foreground font-mono opacity-50">{dIdx + 1}.{qIdx + 1}</span>
                                                            {q.question}
                                                        </p>
                                                        <Badge variant="secondary" className={cn("shrink-0 font-bold ml-2", getScoreColor(q.avg_score))}>
                                                            {q.avg_score}
                                                        </Badge>
                                                    </div>
                                                </div>

                                                {/* شريط التوزيع المكدس */}
                                                <div className="space-y-1">
                                                    <div className="h-4 w-full flex rounded-full overflow-hidden bg-gray-100 text-[9px] text-white font-bold leading-4 text-center border">
                                                        {q.distribution.agree > 0 && <div style={{ width: `${q.distribution.agree}%` }} className="bg-green-500" title={`موافق: ${q.distribution.agree}%`}>{q.distribution.agree > 10 && `${q.distribution.agree}%`}</div>}
                                                        {q.distribution.neutral > 0 && <div style={{ width: `${q.distribution.neutral}%` }} className="bg-yellow-400 text-black/70" title={`محايد: ${q.distribution.neutral}%`}>{q.distribution.neutral > 10 && `${q.distribution.neutral}%`}</div>}
                                                        {q.distribution.disagree > 0 && <div style={{ width: `${q.distribution.disagree}%` }} className="bg-red-500" title={`غير موافق: ${q.distribution.disagree}%`}>{q.distribution.disagree > 10 && `${q.distribution.disagree}%`}</div>}
                                                    </div>
                                                    
                                                    {/* مفتاح الألوان الصغير */}
                                                    <div className="flex justify-between text-[9px] text-muted-foreground px-1">
                                                        <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-500"/>{q.distribution.agree}%</span>
                                                        <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-yellow-400"/>{q.distribution.neutral}%</span>
                                                        <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-500"/>{q.distribution.disagree}%</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {data && (
                        <QaReportPrintDialog 
                            isOpen={isPrintOpen}
                            onClose={() => setIsPrintOpen(false)}
                            data={data}
                            campaignName={currentCampaignName || ""}
                            collegeId={collegeId}
                            reportType={printType}
                            targetTimetableId={selectedTimetableId}
                        />
                    )}

                </div>
            )}
        </div>

        
    );
}