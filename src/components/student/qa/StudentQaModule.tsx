import React, { useState, useEffect } from 'react';
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Loader2, Send, ArrowRight, User, BookOpen, FileText } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// --- Props Definition ---
interface EvaluationData {
    campaign_id: number;
    course_id: number;
    lecturer_id: number;
    course_name: string;
    lecturer_name: string;
    [key: string]: any;
}

interface StudentQaModuleProps {
    evaluation: EvaluationData;
    onBack: () => void;
    onSuccess: () => void;
}

interface Question {
    question_id: number;
    question_text: string;
}

interface Domain {
    domain_id: number;
    domain_name: string;
    questions: Question[];
}

interface EvalForm {
    form_id: number;
    title: string;
    description: string;
    domains: Domain[];
}

export default function StudentQaModule({ evaluation, onBack, onSuccess }: StudentQaModuleProps) {
    const [activeForm, setActiveForm] = useState<EvalForm | null>(null);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccessView, setIsSuccessView] = useState(false);

    // 1. جلب البيانات
    useEffect(() => {
        const fetchForm = async () => {
            try {
                const res = await api.get(`/v1/qa/student/form/${evaluation.campaign_id}`);
                setActiveForm(res.data);
            } catch (error) {
                toast.error("فشل تحميل نموذج التقييم");
                onBack();
            } finally {
                setIsLoading(false);
            }
        };
        fetchForm();
    }, [evaluation.campaign_id]);

    // 2. تسجيل الإجابة
    const setAnswer = (questionId: number, value: number) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    // 3. الإرسال
    const handleSubmit = async () => {
        const totalQuestions = activeForm?.domains.reduce((acc, d) => acc + d.questions.length, 0) || 0;
        if (Object.keys(answers).length < totalQuestions) {
            toast.error("يرجى الإجابة على جميع فقرات الاستمارة");
            // تمرير للشواخص غير المجابة (اختياري)
            const firstUnanswered = document.querySelector('[data-answered="false"]');
            firstUnanswered?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                campaign_id: evaluation.campaign_id,
                course_id: evaluation.course_id,
                lecturer_id: evaluation.lecturer_id,
                answers: Object.entries(answers).map(([qId, val]) => ({
                    question_id: Number(qId),
                    value: val
                }))
            };

            await api.post('/v1/qa/student/submit', payload);
            toast.success("تم إرسال التقييم بنجاح");
            setIsSuccessView(true);
        } catch (error) {
            toast.error("حدث خطأ أثناء الإرسال");
            setIsSubmitting(false);
        }
    };

    // --- Loading View ---
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-muted-foreground">جاري تحضير الاستمارة...</p>
            </div>
        );
    }

    // --- Success View ---
    if (isSuccessView) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-6 animate-in zoom-in-95 duration-300 bg-white rounded-xl shadow-sm p-8 border max-w-lg mx-auto mt-10">
                <div className="bg-green-100 p-6 rounded-full ring-8 ring-green-50">
                    <CheckCircle2 className="w-16 h-16 text-green-600" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">شكراً لمشاركتك!</h2>
                    <p className="text-muted-foreground mt-2">تم حفظ إجاباتك بنجاح وسرية تامة.</p>
                </div>
                <Button onClick={onSuccess} size="lg" className="min-w-[200px]">
                    العودة للقائمة الرئيسية
                </Button>
            </div>
        );
    }

    // --- Form View ---
    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500" dir="rtl">
            
            {/* Header: يشبه رأس الاستمارة الورقية */}
            <div className="bg-white border rounded-xl shadow-sm sticky top-2 z-20 overflow-hidden">
                <div className="bg-primary/5 p-4 border-b flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        <h2 className="font-bold text-lg text-primary">{activeForm?.title}</h2>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onBack} className="hover:bg-red-50 hover:text-red-600 text-muted-foreground">
                        <ArrowRight className="w-4 h-4 ml-2" />
                        إلغاء
                    </Button>
                </div>
                
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center p-3 bg-muted/30 rounded-lg border">
                        <div className="bg-white p-2 rounded-full shadow-sm ml-3">
                            <BookOpen className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                            <span className="text-xs text-muted-foreground block">المقرر الدراسي</span>
                            <span className="font-bold text-gray-800">{evaluation.course_name}</span>
                        </div>
                    </div>
                    <div className="flex items-center p-3 bg-muted/30 rounded-lg border">
                        <div className="bg-white p-2 rounded-full shadow-sm ml-3">
                            <User className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                            <span className="text-xs text-muted-foreground block">عضو هيئة التدريس</span>
                            <span className="font-bold text-gray-800">{evaluation.lecturer_name}</span>
                        </div>
                    </div>
                </div>
                
                {/* التعليمات (تظهر فقط في الشاشات الكبيرة لتوفير المساحة في الجوال) */}
                {activeForm?.description && (
                    <div className="px-4 pb-4 hidden md:block">
                        <div className="text-xs text-muted-foreground bg-yellow-50 text-yellow-800 p-2 rounded border border-yellow-100">
                            💡 ملاحظة: {activeForm.description}
                        </div>
                    </div>
                )}
            </div>

            {/* Domains & Questions List */}
            <div className="space-y-8">
                {activeForm?.domains.map((domain, dIdx) => (
                    <div key={domain.domain_id} className="space-y-3">
                        
                        {/* عنوان المجال */}
                        <div className="flex items-center gap-2 px-2">
                            <span className="flex items-center justify-center bg-primary text-primary-foreground text-sm font-bold w-6 h-6 rounded-full shadow-sm">
                                {dIdx + 1}
                            </span>
                            <h3 className="text-lg font-bold text-gray-800">{domain.domain_name}</h3>
                        </div>

                        {/* جدول الأسئلة */}
                        <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
                            {/* رأس الجدول (للشاشات الكبيرة) */}
                            <div className="hidden md:grid grid-cols-[1fr_120px_120px_120px] gap-4 p-4 bg-muted/40 border-b text-sm font-medium text-muted-foreground">
                                <div>العبارة / الفقرة</div>
                                <div className="text-center text-green-700">تتفق تماماً (3)</div>
                                <div className="text-center text-yellow-700">إلى حد ما (2)</div>
                                <div className="text-center text-red-700">لا تتفق (1)</div>
                            </div>

                            <div className="divide-y">
                                {domain.questions.map((q, qIdx) => {
                                    const isAnswered = answers[q.question_id] !== undefined;
                                    const currentVal = answers[q.question_id];

                                    return (
                                        <div 
                                            key={q.question_id} 
                                            className={cn(
                                                "p-4 transition-colors",
                                                isAnswered ? "bg-white" : "bg-red-50/10 hover:bg-muted/20"
                                            )}
                                            data-answered={isAnswered}
                                        >
                                            <div className="flex flex-col md:grid md:grid-cols-[1fr_380px] gap-4 items-center">
                                                
                                                {/* نص السؤال */}
                                                <div className="w-full text-right">
                                                    <div className="flex gap-2">
                                                        <span className="text-muted-foreground font-mono text-sm pt-0.5 opacity-50">
                                                            {dIdx + 1}.{qIdx + 1}
                                                        </span>
                                                        <p className="font-medium text-gray-800 text-base leading-relaxed">
                                                            {q.question_text}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* خيارات الإجابة */}
                                                <div className="grid grid-cols-3 gap-2 w-full md:w-auto">
                                                    {[
                                                        { val: 3, label: "تتفق تماماً", color: "bg-green-100 text-green-700 border-green-200 hover:bg-green-200" },
                                                        { val: 2, label: "إلى حد ما", color: "bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200" },
                                                        { val: 1, label: "لا تتفق", color: "bg-red-100 text-red-700 border-red-200 hover:bg-red-200" }
                                                    ].map((opt) => (
                                                        <button
                                                            key={opt.val}
                                                            onClick={() => setAnswer(q.question_id, opt.val)}
                                                            className={cn(
                                                                "flex flex-col md:flex-row items-center justify-center p-2 md:p-3 rounded-lg border transition-all duration-200 text-sm font-medium h-full",
                                                                currentVal === opt.val
                                                                    ? `ring-2 ring-offset-1 ring-primary ${opt.color} font-bold shadow-sm scale-[1.02]`
                                                                    : "bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100"
                                                            )}
                                                        >
                                                            <span className="md:hidden text-lg mb-1">
                                                                {opt.val === 3 ? "😊" : opt.val === 2 ? "😐" : "😞"}
                                                            </span>
                                                            <span>{opt.label}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer Action Bar */}
            <div className="sticky bottom-4 z-20 flex justify-center">
                <Card className="shadow-xl border-primary/20 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 w-full max-w-2xl mx-4">
                    <CardContent className="p-4 flex items-center justify-between gap-4">
                        <div className="hidden sm:block text-sm text-muted-foreground">
                            {Object.keys(answers).length} / {activeForm?.domains.reduce((acc, d) => acc + d.questions.length, 0)} فقرة تمت الإجابة عليها
                        </div>
                        <div className="flex gap-3 w-full sm:w-auto">
                            <Button variant="outline" onClick={onBack} className="flex-1 sm:flex-none">
                                تراجع
                            </Button>
                            <Button 
                                onClick={handleSubmit} 
                                disabled={isSubmitting} 
                                className="flex-1 sm:flex-none min-w-[150px] shadow-lg shadow-primary/20"
                            >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Send className="w-4 h-4 ml-2" />}
                                اعتماد وإرسال
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}