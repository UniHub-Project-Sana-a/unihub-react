import React, { useState, useEffect } from 'react';
import { api } from "@/lib/api";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { 
    Card, CardContent, CardDescription, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { 
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CalendarRange, Plus, Trash2, Calendar as CalendarIcon, Loader2, PlayCircle, StopCircle, Check } from "lucide-react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar"; // تأكد من وجود مكون التقويم (shadcn)
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction, AlertDialogTitle } from '@/components/ui/alert-dialog';

// --- Types ---
interface Campaign {
    campaign_id: number;
    campaign_name: string;
    start_date: string;
    end_date: string;
    is_published: boolean;
    form: { title: string; target_type: string };
    academic_year: string;
    target_percentage?: number;
}

interface MetaData {
    forms: { form_id: number; title: string; target_type: string }[];
    academic_years: string[];
}

interface TimetableRow {
    timetable_id: number;
    course_name: string;
    course_code: string;
    lecturer_name: string;
    group_name: string;
    has_substitutes?: boolean;
    lecture_type: number | string; // حسب قاعدة بياناتك
}

export default function QaCampaignsManager({ collegeId }: { collegeId: number }) {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [meta, setMeta] = useState<MetaData>({ forms: [], academic_years: [] });
    const [isLoading, setIsLoading] = useState(false);
    
    // Create State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [newCampaign, setNewCampaign] = useState({
        campaign_name: "",
        form_id: "",
        academic_year: "", 
        timetable_ids: [] as string[],
        min_attendance: 75,
        target_percentage: 80,
        start_date: undefined as Date | undefined,
        end_date: undefined as Date | undefined
    });

    const [yearStats, setYearStats] = useState<{courses_count: number, lecturers_count: number} | null>(null);
    const [timetableRows, setTimetableRows] = useState<TimetableRow[]>([]);

    // --- API Calls ---

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [campaignsRes, metaRes] = await Promise.all([
                api.get(`/v1/qa/campaigns?college_id=${collegeId}`),
                api.get(`/v1/qa/campaigns/create-meta?college_id=${collegeId}`)
            ]);
            // console.log("Years from API:", metaRes.data.academic_years);
            setCampaigns(campaignsRes.data);
            setMeta(metaRes.data);
        } catch (error) {
            toast.error("فشل تحميل البيانات");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (collegeId) fetchData();
    }, [collegeId]);

    // دالة لجلب إحصائيات السنة عند اختيارها
    const handleYearChange = async (year: string) => {
        setNewCampaign({ ...newCampaign, academic_year: year, timetable_ids: [] });
        setTimetableRows([]);
        try {
            const res = await api.get(`/v1/qa/campaigns/year-details`, {
                params: { year, college_id: collegeId }
            });
            setTimetableRows(res.data.rows);
        } catch (error) {
            console.error(error);
        }
    };

    // دالة للتعامل مع الـ Checkbox
    const toggleTimetable = (id: string) => {
        setNewCampaign(prev => {
            const newIds = prev.timetable_ids.includes(id)
                ? prev.timetable_ids.filter(x => x !== id)
                : [...prev.timetable_ids, id];
            return { ...prev, timetable_ids: newIds };
        });
    };

    // دالة "تحديد الكل"
    const toggleSelectAll = () => {
        if (newCampaign.timetable_ids.length === timetableRows.length) {
            setNewCampaign(prev => ({ ...prev, timetable_ids: [] }));
        } else {
            setNewCampaign(prev => ({ ...prev, timetable_ids: timetableRows.map(r => String(r.timetable_id)) }));
        }
    };

    const handleCreate = async () => {
        // ✅ 1. التحقق المسبق (Validation) قبل الاتصال بالسيرفر
        if (!newCampaign.campaign_name.trim()) {
            toast.error("يرجى إدخال اسم الحملة");
            return;
        }
        if (!newCampaign.academic_year) {
            toast.error("يرجى اختيار السنة الدراسية");
            return;
        }
        if (newCampaign.timetable_ids.length === 0) {
            toast.error("يرجى اختيار مقرر واحد على الأقل من الجدول");
            return;
        }
        if (!newCampaign.form_id) {
            toast.error("يرجى اختيار نموذج التقييم");
            return;
        }
        if (!newCampaign.start_date) {
            toast.error("يرجى تحديد تاريخ بدء الحملة");
            return;
        }
        if (!newCampaign.end_date) {
            toast.error("يرجى تحديد تاريخ انتهاء الحملة");
            return;
        }
        if (newCampaign.end_date < newCampaign.start_date) {
            toast.error("تاريخ الانتهاء لا يمكن أن يكون قبل تاريخ البدء");
            return;
        }

        // ✅ 2. إرسال الطلب (إذا تجاوز كل الشروط السابقة)
        setIsSaving(true);
        try {
            const payload = {
                campaign_name: newCampaign.campaign_name,
                form_id: Number(newCampaign.form_id),
                timetable_ids: newCampaign.timetable_ids.map(Number),
                academic_year: newCampaign.academic_year,
                min_attendance_percentage: newCampaign.min_attendance,
                target_percentage: newCampaign.target_percentage,
                start_date: format(newCampaign.start_date!, 'yyyy-MM-dd'),
                end_date: format(newCampaign.end_date!, 'yyyy-MM-dd'),
            };
            const res = await api.post('/v1/qa/campaigns', payload);
            
            setCampaigns([res.data, ...campaigns]);
            
            setIsDialogOpen(false);
            setNewCampaign({
                campaign_name: "", form_id: "", academic_year: "", timetable_ids: [],
                min_attendance: 75, target_percentage: 80, start_date: undefined, end_date: undefined
            });
            setTimetableRows([]);
            toast.success("تم إطلاق الحملة بنجاح");
        } catch (error) {
            toast.error("فشل الحفظ، يرجى التأكد من البيانات والمحاولة مرة أخرى");
        } finally {
            setIsSaving(false);
        }
    };

    const togglePublish = async (id: number, currentStatus: boolean) => {
        try {
            const res = await api.put(`/v1/qa/campaigns/${id}`, { is_published: !currentStatus });
            setCampaigns(campaigns.map(c => c.campaign_id === id ? { ...c, is_published: res.data.is_published } : c));
            toast.success(currentStatus ? "تم إيقاف النشر" : "تم النشر للطلاب");
        } catch (error) {
            toast.error("فشل تحديث الحالة");
        }
    };

    const handleDelete = async (id: number) => {
        if(!confirm("هل أنت متأكد من حذف هذه الحملة؟ سيتم حذف جميع التقييمات المرتبطة بها!")) return;
        try {
            await api.delete(`/v1/qa/campaigns/${id}`);
            setCampaigns(campaigns.filter(c => c.campaign_id !== id));
            toast.success("تم الحذف");
        } catch (error) {
            toast.error("فشل الحذف");
        }
    };

    // --- Helper to determine status color ---
    const getStatusBadge = (c: Campaign) => {
        const now = new Date();
        const start = new Date(c.start_date);
        const end = new Date(c.end_date);

        if (!c.is_published) return <Badge variant="secondary">مسودة (غير منشورة)</Badge>;
        if (now < start) return <Badge variant="outline" className="text-yellow-600 border-yellow-600">مجدولة (لم تبدأ)</Badge>;
        if (now > end) return <Badge variant="secondary" className="bg-gray-200 text-gray-600">منتهية</Badge>;
        return <Badge className="bg-green-600 hover:bg-green-700 animate-pulse">جارية الآن</Badge>;
    };

    // --- Render ---

    return (
        <div className="space-y-6" dir="rtl">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-medium">جدول التقييمات</h3>
                    <p className="text-sm text-muted-foreground">قم بإطلاق حملات تقييم متعددة وربطها بالمقررات الدراسية.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="w-4 h-4 ml-2" />
                            حملة تقييم جديدة
                        </Button>
                    </DialogTrigger>
                    
                    <DialogContent className="w-[95%] sm:max-w-[700px] max-h-[90vh] overflow-y-auto px-4 sm:px-6" dir="rtl">
                        <DialogHeader className="text-right space-y-2">
                            <DialogTitle>إطلاق حملة تقييم جديدة</DialogTitle>
                            <DialogDescription className="text-sm leading-relaxed">
                                يمكنك اختيار مقرر واحد أو عدة مقررات لنفس الحملة. سيتم تطبيق نفس النموذج والتواريخ عليها جميعاً.
                            </DialogDescription>
                        </DialogHeader>
                
                        <div className="grid gap-6 py-4">
                            {/* 1. اسم الحملة */}
                            <div className="grid gap-2">
                                <Label className="text-right">اسم الحملة</Label>
                                <Input 
                                    placeholder="مثال: التقييم الشامل - خريف 2025" 
                                    value={newCampaign.campaign_name}
                                    onChange={e => setNewCampaign({...newCampaign, campaign_name: e.target.value})}
                                />
                            </div>
                        
                            {/* 2. السنة والنموذج */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label className="text-right">السنة الدراسية</Label>
                                    <Select value={newCampaign.academic_year} onValueChange={handleYearChange}>
                                        <SelectTrigger dir="rtl"><SelectValue placeholder="اختر السنة" /></SelectTrigger>
                                        <SelectContent dir="rtl">
                                            {meta.academic_years.map((year, idx) => (
                                                <SelectItem key={idx} value={year}>{year}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-right">النموذج المستخدم</Label>
                                    <Select value={newCampaign.form_id} onValueChange={v => setNewCampaign({...newCampaign, form_id: v})}>
                                        <SelectTrigger dir="rtl"><SelectValue placeholder="اختر النموذج" /></SelectTrigger>
                                        <SelectContent dir="rtl">
                                            {meta.forms.map(f => (
                                                <SelectItem key={f.form_id} value={String(f.form_id)}>
                                                    {f.title} ({f.target_type === 'theory' ? 'نظري' : 'عملي'})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        
                            {/* ✅ 3. القائمة المتعددة (Checkboxes) */}
                            {timetableRows.length > 0 ? (
                                <div className="border rounded-md p-3 sm:p-4 bg-muted/10">
                                    <div className="flex justify-between items-center mb-3">
                                        <Label className="font-semibold text-primary text-sm sm:text-base">
                                            المقررات المستهدفة ({newCampaign.timetable_ids.length} مختار):
                                        </Label>
                                        <Button variant="ghost" size="sm" onClick={toggleSelectAll} className="h-8 text-xs">
                                            {newCampaign.timetable_ids.length === timetableRows.length ? "إلغاء الكل" : "تحديد الكل"}
                                        </Button>
                                    </div>
                                    
                                    <ScrollArea className="h-[250px] pr-3" dir="rtl">
                                        <div className="space-y-2">
                                            {timetableRows.map((row) => {
                                                const isSelected = newCampaign.timetable_ids.includes(String(row.timetable_id));
                                                return (
                                                    <div 
                                                        key={row.timetable_id} 
                                                        className={cn(
                                                            "flex items-start space-x-3 space-x-reverse border p-3 rounded-md transition-all cursor-pointer hover:bg-white",
                                                            isSelected ? "border-primary bg-primary/5 ring-1 ring-primary" : "bg-background border-border"
                                                        )}
                                                        onClick={() => toggleTimetable(String(row.timetable_id))}
                                                    >
                                                        {/* Checkbox */}
                                                        <div className={cn(
                                                            "w-5 h-5 rounded border flex items-center justify-center mt-1 shrink-0 transition-colors",
                                                            isSelected ? "bg-primary border-primary text-primary-foreground" : "border-input bg-background"
                                                        )}>
                                                            {isSelected && <Check className="w-3.5 h-3.5" />}
                                                        </div>

                                                        <div className="flex-1 grid gap-1 min-w-0 pr-2">
                                                            <div className="flex flex-wrap justify-between items-center gap-2">
                                                                <span className="font-bold text-sm sm:text-base truncate">
                                                                    {row.course_name}
                                                                </span>
                                                                <Badge variant={Number(row.lecture_type) === 1 ? "secondary" : "outline"} className="shrink-0 text-xs">
                                                                    {Number(row.lecture_type) === 1 ? "عملي" : "نظري"}
                                                                </Badge>
                                                            </div>
                                                            
                                                            <div className="flex flex-wrap justify-between items-center text-xs text-muted-foreground mt-1 gap-2">
                                                                <span className={cn("flex items-center gap-1 truncate", row.has_substitutes ? "text-orange-600 font-bold" : "")}>
                                                                    👨‍🏫 {row.lecturer_name}
                                                                    
                                                                    {/* ✅ أيقونة تنبيه للمدير */}
                                                                    {row.has_substitutes && (
                                                                        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-orange-100 text-orange-600" title="يوجد محاضرون بدلاء في هذا الجدول">
                                                                            !
                                                                        </span>
                                                                    )}
                                                                </span>
                                                                <span className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded text-[10px] shrink-0">
                                                                    👥 {row.group_name}
                                                                </span>
                                                            </div>
                                                            <span className="text-[10px] text-muted-foreground font-mono mt-1 block text-left" dir="ltr">
                                                                {row.course_code}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </ScrollArea>
                                </div>
                            ) : newCampaign.academic_year ? (
                                    <div className="text-center py-8 text-muted-foreground border border-dashed rounded-md bg-muted/5 flex flex-col items-center justify-center">
                                        <span className="block mb-2 text-2xl">📭</span>
                                        <span className="text-sm">لا توجد محاضرات مسجلة في الجدول لهذه السنة.</span>
                                    </div>
                            ) : null}
                        
                            {/* 4. النسب المستهدفة (KPIs) */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* نسبة الحرمان */}
                                <div className="grid gap-2 bg-red-50/50 p-3 rounded-lg border border-red-100">
                                    <div className="flex justify-between items-center">
                                        <Label className="text-red-900 text-sm">نسبة الحرمان (%)</Label>
                                        <Input 
                                            type="number" min={0} max={100}
                                            value={newCampaign.min_attendance}
                                            onChange={e => setNewCampaign({...newCampaign, min_attendance: Number(e.target.value)})}
                                            className="w-16 text-center font-bold text-red-600 h-8 bg-white"
                                        />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">أقل نسبة حضور مسموحة للطالب.</p>
                                </div>

                                {/* ✅ نسبة الهدف (جديد) */}
                                <div className="grid gap-2 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                                    <div className="flex justify-between items-center">
                                        <Label className="text-blue-900 text-sm">هدف الجودة (%)</Label>
                                        <Input 
                                            type="number" min={50} max={100}
                                            value={newCampaign.target_percentage}
                                            onChange={e => setNewCampaign({...newCampaign, target_percentage: Number(e.target.value)})}
                                            className="w-16 text-center font-bold text-blue-600 h-8 bg-white"
                                        />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">معيار النجاح المستهدف (KPI).</p>
                                </div>
                            </div>
                            
                            {/* 5. التواريخ */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label className="text-right">تاريخ البدء</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant={"outline"} className={cn("justify-start text-left font-normal w-full", !newCampaign.start_date && "text-muted-foreground")}>
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {newCampaign.start_date ? format(newCampaign.start_date, "PPP", { locale: ar }) : <span>اختر تاريخ</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar mode="single" selected={newCampaign.start_date} onSelect={d => setNewCampaign({...newCampaign, start_date: d})} initialFocus dir="ltr" />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-right">تاريخ الانتهاء</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant={"outline"} className={cn("justify-start text-left font-normal w-full", !newCampaign.end_date && "text-muted-foreground")}>
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {newCampaign.end_date ? format(newCampaign.end_date, "PPP", { locale: ar }) : <span>اختر تاريخ</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar mode="single" selected={newCampaign.end_date} onSelect={d => setNewCampaign({...newCampaign, end_date: d})} initialFocus dir="ltr"/>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                        </div>
                
                        <DialogFooter className="gap-2 sm:gap-0 mt-2">
                            <Button 
                                className="w-full sm:w-auto" 
                                onClick={handleCreate} 
                                disabled={isSaving} // ✅ التعديل هنا: الزر مفعل دائماً إلا أثناء التحميل
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
                                {isSaving ? "جاري الحفظ..." : `إطلاق الحملة (${newCampaign.timetable_ids.length} مقرر)`}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* --- عرض الكروت (Cards Grid) كما هي في الكود السابق --- */}
            {isLoading && campaigns.length === 0 ? (
                <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" /></div>
            ) : (
                <div className="grid gap-4" dir="rtl">
                    {/* ... (نفس كود عرض الكروت السابق تماماً، لا تغيير عليه) ... */}
                    {/* (إذا أردتني أن أكتبه مرة أخرى أخبرني، لكنه لم يتغير) */}
                    
                    {/* 👇 هذا الجزء فقط لإكمال الصورة 👇 */}
                    {campaigns.map(campaign => (
                        <Card key={campaign.campaign_id} className="overflow-hidden group hover:shadow-md transition-shadow">
                            {/* ... نفس الكود السابق ... */}
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 sm:p-6 gap-4">
                                <div className="space-y-3 flex-1 min-w-0 w-full">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h4 className="font-bold text-lg truncate">{campaign.campaign_name}</h4>
                                        {getStatusBadge(campaign)}
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-2 sm:items-center text-sm">
                                        <div className="flex items-center gap-1.5 bg-green-50 border border-green-100 px-2.5 py-1 rounded-md text-xs text-green-700 w-fit">
                                            <span className="opacity-70">يبدأ:</span>
                                            <span className="font-bold">{format(new Date(campaign.start_date), "dd MMMM yyyy", { locale: ar })}</span>
                                        </div>
                                        <span className="hidden sm:inline text-muted-foreground/30">⬅️</span>
                                        <div className="flex items-center gap-1.5 bg-red-50 border border-red-100 px-2.5 py-1 rounded-md text-xs text-red-700 w-fit">
                                            <span className="opacity-70">ينتهي:</span>
                                            <span className="font-bold">{format(new Date(campaign.end_date), "dd MMMM yyyy", { locale: ar })}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground pt-1">
                                        <div className="flex items-center gap-1">
                                            <span>النموذج:</span>
                                            <span className="font-medium text-foreground">{campaign.form?.title}</span>
                                            <Badge variant="secondary" className="text-[10px] px-1 h-5">
                                                {campaign.form?.target_type === 'theory' ? 'نظري' : campaign.form?.target_type === 'practical' ? 'عملي' : 'عام'}
                                            </Badge>
                                        </div>
                                        <span className="hidden sm:inline text-border">|</span>
                                        <div className="flex items-center gap-1">
                                            <span>السنة:</span>
                                            <span className="font-mono bg-muted px-1.5 rounded text-xs text-foreground">{campaign.academic_year}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0 border-t md:border-t-0 pt-3 md:pt-0">
                                    <Button variant={campaign.is_published ? "outline" : "default"} size="sm" onClick={() => togglePublish(campaign.campaign_id, campaign.is_published)} className={cn("flex-1 md:flex-none transition-all shadow-sm", campaign.is_published ? "border-destructive text-destructive hover:bg-destructive/10" : "bg-green-600 hover:bg-green-700 text-white")}>
                                        {campaign.is_published ? <><StopCircle className="w-4 h-4 ml-2" /> إيقاف النشر</> : <><PlayCircle className="w-4 h-4 ml-2" /> نشر للطلاب</>}
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="hover:bg-destructive/10 hover:text-destructive"><Trash2 className="w-4 h-4" /></Button></AlertDialogTrigger>
                                        <AlertDialogContent dir="rtl">
                                            <AlertDialogHeader className="text-right"><AlertDialogTitle>حذف الحملة نهائياً</AlertDialogTitle><AlertDialogDescription className="text-right">هل أنت متأكد؟ سيتم حذف جميع النتائج المرتبطة.</AlertDialogDescription></AlertDialogHeader>
                                            <AlertDialogFooter className="gap-2 sm:gap-0"><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(campaign.campaign_id)} className="bg-destructive hover:bg-destructive/90">نعم، احذف</AlertDialogAction></AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                            {campaign.is_published && <div className="h-1 w-full bg-green-100"><div className="h-full bg-green-500 w-full origin-right animate-pulse" /></div>}
                        </Card>
                    ))}
                    {campaigns.length === 0 && <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-xl bg-muted/5 text-muted-foreground col-span-full"><div className="bg-muted p-4 rounded-full mb-3"><CalendarRange className="w-8 h-8 opacity-50" /></div><h3 className="font-semibold text-lg">لا توجد حملات تقييم</h3><p className="text-sm max-w-sm mt-1">ابدأ بإنشاء حملة جديدة.</p></div>}
                </div>
            )}
        </div>
    );
}