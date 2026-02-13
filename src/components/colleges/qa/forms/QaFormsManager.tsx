import React, { useState, useEffect } from 'react';
import { api } from "@/lib/api"; // ✅ تم التعديل
import { 
    Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
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
import { Separator } from "@/components/ui/separator";
import { 
    Plus, Trash2, Edit2, GripVertical, FileText, ArrowRight, Save, Loader2 ,CalendarRange 
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner"; 
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// --- Types ---
interface QaQuestion {
    question_id?: number; 
    question_text: string;
    domain_id?: number;
}

interface QaDomain {
    domain_id?: number;
    domain_name: string;
    questions: QaQuestion[];
}

interface QaForm {
    form_id: number;
    title: string;
    description: string | null;
    target_type: 'theory' | 'practical' | 'both';
    is_active: boolean;
    academic_year: string;
    domains: QaDomain[];
    questions_count?: number;
    domains_count?: number;
}

export default function QaFormsManager({ collegeId }: { collegeId: number }) {
    // State
    const [forms, setForms] = useState<QaForm[]>([]);
    const [selectedForm, setSelectedForm] = useState<QaForm | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

    // Form Creation State
    const [newFormTitle, setNewFormTitle] = useState("");
    const [newFormType, setNewFormType] = useState("");
    const [newAcademicYear, setNewAcademicYear] = useState("");

    // --- API calls ---

    // 1. Fetch Forms List
    const fetchForms = async () => {
        setIsLoading(true);
        try {
            // ✅ استخدام api بدلاً من axios
            const res = await api.get(`/v1/qa/forms?college_id=${collegeId}`);
            setForms(res.data);
        } catch (error) {
            console.error("Failed to fetch forms", error);
            toast.error("فشل تحميل النماذج");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (collegeId) fetchForms();
    }, [collegeId]);

    // 2. Create New Form
    const handleCreateForm = async () => {
        try {
            setIsSaving(true);
            const payload = {
                title: newFormTitle,
                target_type: newFormType,
                college_id: collegeId,
                description: "وصف افتراضي للنموذج",
                academic_year: newAcademicYear || undefined 
            };
            // ✅ استخدام api
            const res = await api.post('/v1/qa/forms', payload);
            
            setForms([res.data, ...forms]);
            // نفتح النموذج الجديد للتعديل مباشرة (مع مصفوفة مجالات فارغة لتجنب الخطأ)
            const newForm = { ...res.data, domains: [] }; 
            setSelectedForm(newForm);
            
            setIsCreateDialogOpen(false);
            setNewFormTitle("");
            setNewAcademicYear("");
            toast.success("تم إنشاء النموذج بنجاح");
        } catch (error) {
            console.error(error);
            toast.error("حدث خطأ أثناء الإنشاء");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteForm = async (id: number) => {
        try {
            await api.delete(`/v1/qa/forms/${id}`);
            setForms(forms.filter(f => f.form_id !== id));
            toast.success("تم حذف النموذج بنجاح");
        } catch (error) {
            toast.error("فشل الحذف، قد يكون النموذج مرتبطاً ببيانات أخرى");
        }
    };

    // 3. Fetch Single Form Details
    const handleEditClick = async (id: number) => {
        setIsLoading(true);
        try {
            // ✅ استخدام api
            const res = await api.get(`/v1/qa/forms/${id}`);
            setSelectedForm(res.data);
        } catch (error) {
            toast.error("فشل تحميل تفاصيل النموذج");
        } finally {
            setIsLoading(false);
        }
    };

    // 4. Save Changes (Full Sync)
    const handleSaveChanges = async () => {
        if (!selectedForm) return;
        setIsSaving(true);
        try {
            // ✅ استخدام api
            const res = await api.put(`/v1/qa/forms/${selectedForm.form_id}`, selectedForm);
            
            setSelectedForm(res.data); 
            
            // تحديث القائمة الخارجية
            setForms(forms.map(f => f.form_id === res.data.form_id ? res.data : f));
            
            toast.success("تم حفظ التغييرات بنجاح");
        } catch (error) {
            console.error(error);
            toast.error("فشل الحفظ، تأكد من البيانات");
        } finally {
            setIsSaving(false);
        }
    };

    // --- UI Logic Helpers ---

    const handleAddDomain = () => {
        if (!selectedForm) return;
        const newDomain: QaDomain = {
            domain_name: "مجال جديد",
            questions: []
        };
        setSelectedForm({ ...selectedForm, domains: [...selectedForm.domains, newDomain] });
    };

    const handleRemoveDomain = (index: number) => {
        if (!selectedForm) return;
        const newDomains = [...selectedForm.domains];
        newDomains.splice(index, 1);
        setSelectedForm({ ...selectedForm, domains: newDomains });
    };

    const handleAddQuestion = (domainIndex: number) => {
        if (!selectedForm) return;
        const newDomains = [...selectedForm.domains];
        newDomains[domainIndex].questions.push({
            question_text: ""
        });
        setSelectedForm({ ...selectedForm, domains: newDomains });
    };

    const handleRemoveQuestion = (domainIndex: number, questionIndex: number) => {
        if (!selectedForm) return;
        const newDomains = [...selectedForm.domains];
        newDomains[domainIndex].questions.splice(questionIndex, 1);
        setSelectedForm({ ...selectedForm, domains: newDomains });
    };

    // --- Render ---

    // 1. Loading State
    if (isLoading && !selectedForm && forms.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <p>جاري تحميل النماذج...</p>
            </div>
        );
    }

    // 2. Main List View
    if (!selectedForm) {
        return (
            <div className="space-y-6" dir="rtl">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-muted/20 p-4 rounded-lg border gap-4">
                    <div>
                        <h3 className="font-semibold text-lg">نماذج التقييم</h3>
                        <p className="text-sm text-muted-foreground">قم بإنشاء وتعديل نماذج الاستبيانات الخاصة بالكلية.</p>
                    </div>
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="w-4 h-4 ml-2" />
                                نموذج جديد
                            </Button>
                        </DialogTrigger>
                        {/* ✅ إضافة dir="rtl" لتنسيق المحتوى بالكامل */}
                        <DialogContent dir="rtl">
                            <DialogHeader className="text-center sm:text-center">
                                <DialogTitle>إنشاء نموذج تقييم جديد</DialogTitle>
                                <DialogDescription>حدد البيانات الأساسية للنموذج.</DialogDescription>
                            </DialogHeader>
                            
                            <div className="space-y-4 py-4">
                                {/* حقل العنوان */}
                                <div className="space-y-2">
                                    <Label className="text-right block">عنوان النموذج</Label>
                                    <Input 
                                        placeholder="مثال: استمارة تقييم عضو هيئة التدريس" 
                                        value={newFormTitle}
                                        onChange={(e) => setNewFormTitle(e.target.value)}
                                    />
                                </div>
                
                                {/* حقل النوع - تم التأكد من الربط */}
                                <div className="space-y-2">
                                    <Label className="text-right block">نوع النموذج</Label>
                                    <Select value={newFormType} onValueChange={setNewFormType}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="اختر النوع" />
                                        </SelectTrigger>
                                        <SelectContent dir="rtl">
                                            <SelectItem value="theory">نظري</SelectItem>
                                            <SelectItem value="practical">عملي</SelectItem>
                                            <SelectItem value="both">عام</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                
                                {/* ✅ حقل السنة الدراسية الجديد */}
                                <div className="space-y-2">
                                    <Label className="text-right block">السنة الدراسية (اختياري)</Label>
                                    <Input 
                                        placeholder={`افتراضي: ${new Date().getFullYear()}-${new Date().getFullYear()+1}`} 
                                        value={newAcademicYear}
                                        onChange={(e) => setNewAcademicYear(e.target.value)}
                                        className="text-left" // الأرقام بالإنجليزية تظهر أفضل من اليسار
                                        dir="ltr"
                                    />
                                    <p className="text-xs text-muted-foreground text-right">
                                        اتركه فارغاً ليتم اعتماد السنة الحالية تلقائياً.
                                    </p>
                                </div>
                            </div>
                
                            <DialogFooter className="gap-2 sm:gap-0">
                                {/* في وضع RTL، الأزرار قد تحتاج ترتيب عكسي أو gap */}
                                <Button onClick={handleCreateForm} disabled={isSaving || !newFormTitle}>
                                    {isSaving ? "جاري الإنشاء..." : "إنشاء"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {forms.map(form => (
                        <Card 
                            key={form.form_id} 
                            className="cursor-pointer hover:border-primary transition-colors group relative overflow-hidden" 
                            onClick={() => handleEditClick(form.form_id)}
                        >
                            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                                <div className="space-y-1">
                                    <div className="flex gap-2 mb-1">
                                        <Badge variant={form.is_active ? "default" : "secondary"}>
                                            {form.is_active ? "نشط" : "مسودة"}
                                        </Badge>
                                        {/* 3. تعديل قراءة النوع ليتوافق مع target_type */}
                                        <Badge variant="outline">
                                            {(form.target_type ) === 'theory' ? 'نظري' : 
                                             (form.target_type ) === 'practical' ? 'عملي' : 'عام'}
                                        </Badge>
                                    </div>
                                    
                                    {/* 2. عرض السنة الدراسية */}
                                    <div className="flex items-center text-xs text-muted-foreground gap-1 bg-muted/50 px-2 py-0.5 rounded-sm w-fit">
                                        <CalendarRange className="w-3 h-3" />
                                        <span>{form.academic_year}</span>
                                    </div>
                                </div>
                
                                {/* 1. زر الحذف مع التنبيه */}
                                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                    {/* زر التعديل (شكلي فقط لأنه نفس وظيفة ضغط الكرت) */}
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <Edit2 className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                                    </Button>
                
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent dir="rtl">
                                            <AlertDialogHeader className="text-right">
                                                <AlertDialogTitle className="text-destructive flex items-center gap-2">
                                                    <Trash2 className="w-5 h-5" />
                                                    حذف النموذج نهائياً
                                                </AlertDialogTitle>
                                                <AlertDialogDescription className="text-right">
                                                    هل أنت متأكد من حذف نموذج <b>"{form.title}"</b>؟
                                                    <br />
                                                    هذا الإجراء لا يمكن التراجع عنه وسيؤدي لحذف جميع الأسئلة المرتبطة به.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter className="gap-2 sm:gap-0">
                                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                                <AlertDialogAction 
                                                    onClick={() => handleDeleteForm(form.form_id)}
                                                    className="bg-destructive hover:bg-destructive/90"
                                                >
                                                    نعم، احذف النموذج
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </CardHeader>
                
                            <CardContent className="pt-2">
                                <div className="flex items-center gap-2 mb-2">
                                    <FileText className="w-5 h-5 text-primary/80" />
                                    <h4 className="font-semibold line-clamp-1">{form.title}</h4>
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                                    {form.description || "لا يوجد وصف"}
                                </p>
                            </CardContent>
                
                            <CardFooter className="border-t bg-muted/10 pt-3 text-xs text-muted-foreground flex justify-between">
                                {/* 3. حل مشكلة العداد: استخدام domains_count القادم من الباك إند */}
                                <span>{form.domains_count || 0} مجالات</span>
                                <span>{form.questions_count || 0} أسئلة</span>
                            </CardFooter>
                        </Card>
                    ))}
                    
                    {forms.length === 0 && !isLoading && (
                        <div className="col-span-full py-10 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                            لا توجد نماذج مضافة بعد. اضغط على "نموذج جديد" للبدء.
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // 3. Form Builder View
    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300" dir="rtl">
            {/* Top Bar */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur py-4 border-b flex items-center justify-between" dir="rtl">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedForm(null)}>
                        <ArrowRight className="w-4 h-4 ml-1" />
                        خروج
                    </Button>
                    <Separator orientation="vertical" className="h-6" />
                    <h3 className="font-bold text-lg line-clamp-1 max-w-[200px] md:max-w-md">{selectedForm.title}</h3>
                </div>
                <div className="flex gap-2 items-center">
                    <div className="hidden md:flex items-center gap-2 bg-muted px-3 py-1.5 rounded-md border text-sm">
                        <span>الحالة:</span>
                        <Switch 
                            checked={selectedForm.is_active} 
                            onCheckedChange={(checked) => setSelectedForm({...selectedForm, is_active: checked})}
                        />
                        <span className={selectedForm.is_active ? "text-green-600 font-bold" : "text-muted-foreground"}>
                            {selectedForm.is_active ? "مفعل" : "معطل"}
                        </span>
                    </div>
                    <Button onClick={handleSaveChanges} disabled={isSaving}>
                        {isSaving ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Save className="w-4 h-4 ml-2" />}
                        حفظ التغييرات
                    </Button>
                </div>
            </div>

            {/* Form Metadata */}
            <Card dir="rtl">
                <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>عنوان النموذج</Label>
                        <Input 
                            value={selectedForm.title} 
                            onChange={(e) => setSelectedForm({...selectedForm, title: e.target.value})} 
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>الوصف / التعليمات للطالب</Label>
                        <Input 
                            value={selectedForm.description || ""} 
                            onChange={(e) => setSelectedForm({...selectedForm, description: e.target.value})} 
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Domains & Questions */}
            <div className="space-y-6 pb-20" dir="rtl">
                {selectedForm.domains.map((domain, dIndex) => (
                    <Card key={dIndex} className="border-l-4 border-l-primary/60 relative">
                        <CardHeader className="bg-muted/30 pb-3">
                            <div className="flex items-center gap-3">
                                <Badge variant="outline" className="h-8 w-8 rounded-full flex items-center justify-center p-0 text-base">
                                    {dIndex + 1}
                                </Badge>
                                <Input 
                                    className="font-bold text-lg bg-transparent border-transparent hover:border-input focus:bg-background h-auto py-1 flex-1"
                                    placeholder="عنوان المجال (مثلاً: الشخصية)"
                                    value={domain.domain_name}
                                    onChange={(e) => {
                                        const newDomains = [...selectedForm.domains];
                                        newDomains[dIndex].domain_name = e.target.value;
                                        setSelectedForm({...selectedForm, domains: newDomains});
                                    }}
                                />
                                <Button 
                                    variant="ghost" size="icon" 
                                    className="text-muted-foreground hover:text-destructive"
                                    onClick={() => handleRemoveDomain(dIndex)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-3">
                            {domain.questions.map((question, qIndex) => (
                                <div key={qIndex} className="flex items-start gap-3 group">
                                    <div className="mt-2 text-muted-foreground cursor-grab">
                                        <GripVertical className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1">
                                        <Textarea 
                                            className="resize-none min-h-[40px] py-2"
                                            rows={1}
                                            placeholder={`نص السؤال رقم ${qIndex + 1}...`}
                                            value={question.question_text}
                                            onChange={(e) => {
                                                const newDomains = [...selectedForm.domains];
                                                newDomains[dIndex].questions[qIndex].question_text = e.target.value;
                                                setSelectedForm({...selectedForm, domains: newDomains});
                                            }}
                                        />
                                    </div>
                                    <Button 
                                        variant="ghost" size="icon" 
                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                                        onClick={() => handleRemoveQuestion(dIndex, qIndex)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}

                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="w-full border-dashed text-muted-foreground mt-2 hover:bg-muted/50"
                                onClick={() => handleAddQuestion(dIndex)}
                            >
                                <Plus className="w-4 h-4 ml-2" />
                                إضافة فقرة / سؤال
                            </Button>
                        </CardContent>
                    </Card>
                ))}

                <Button 
                    variant="secondary" 
                    className="w-full py-8 text-lg border-2 border-dashed"
                    onClick={handleAddDomain}
                >
                    <Plus className="w-6 h-6 ml-2" />
                    إضافة مجال جديد (Domain)
                </Button>
            </div>
        </div>
    );
}