import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Lock, LogOut, BookOpen, User, Loader2, Clock } from "lucide-react";
import { toast } from "sonner";
import { setAuthToken, api } from "@/lib/api";

// ✅ استدعاء المكون الفرعي (تأكد أن هذا الملف موجود بجانبه)
import StudentQaModule from './StudentQaModule'; 

// ✅ لاحظ: هذا المكون لا يستقبل أي Props
export default function StudentQaPage() {
    const [evaluations, setEvaluations] = useState<any[]>([]);
    const [activeEvaluation, setActiveEvaluation] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

    //  1. متغير لاسم الطالب
    const [studentName, setStudentName] = useState("");

    const handleLogout = async () => {
        if (loggingOut) return;
        setLoggingOut(true);
        try {
          await api.post("/v1/auth/logout");
        }  catch (error) {
            console.warn("Logout API failed, forcing local logout.");
        }
        if (setAuthToken) { 
            setAuthToken(null); 
        }

        // تنظيف التخزين المحلي
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/react-app/login";
    };
    // جلب القائمة
    const fetchEvaluations = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/v1/qa/student/pending');
            setEvaluations(res.data);
        } catch (error) {
            console.error(error);
            // toast.error("فشل تحميل البيانات"); // يمكن تفعيلها
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const initPage = async () => {
            setIsLoading(true);
            try {
                // 1. جلب بيانات الطالب
                const meRes = await api.get('/v1/auth/me');
                console.log("User Data:", meRes.data); // 👈 راقب هذا في الكونسول
    
                // محاولة استخراج الاسم بذكاء
                // بعض الـ Resources تعيد البيانات داخل data wrap
                const userData = meRes.data?.data || meRes.data?.user || meRes.data;
                
                // تأكد من اسم العمود في قاعدة البيانات (full_name أو name)
                const name = userData?.full_name || userData?.name || userData?.user?.full_name || "طالب";
                
                setStudentName(name);
    
                // 2. جلب التقييمات
                const evalRes = await api.get('/v1/qa/student/pending');
                setEvaluations(evalRes.data);
            } catch (error) {
                console.error("Error:", error);
            } finally {
                setIsLoading(false);
            }
        };
    
        initPage();
    }, []);

    useEffect(() => {
        fetchEvaluations();
    }, []);

    // 🔄 التبديل: إذا اختار الطالب تقييم، نعرض له ورقة الأسئلة
    if (activeEvaluation) {
        return (
            <StudentQaModule 
                evaluation={activeEvaluation} 
                onBack={() => setActiveEvaluation(null)}
                onSuccess={() => {
                    setActiveEvaluation(null);
                    fetchEvaluations(); 
                }} 
            />
        );
    }

    // العرض الرئيسي: قائمة المواد
    return (
        <div className="min-h-screen bg-gray-50/50 p-4 md:p-8" dir="rtl">
            <div className="max-w-4xl mx-auto space-y-8">
                
                {/* الترويسة */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-5 rounded-xl shadow-sm border border-primary/10 gap-4">
                    <div className="space-y-1">
                        <h1 className="text-xl md:text-2xl font-bold text-primary flex items-center gap-2">
                            <span className="text-2xl">👋</span>
                            مرحباً بك، {studentName}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            بوابة التقييم الطلابي - رأيك يساهم في تطوير العملية التعليمية.
                        </p>
                    </div>
                    
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleLogout}
                        className="hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                    >
                        <LogOut className="w-4 h-4 ml-2" />
                        تسجيل الخروج
                    </Button>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                ) : (
                    <>
                        <div className="grid gap-4 md:grid-cols-2">
                            {evaluations.map((item) => (
                                <Card key={`${item.timetable_id}-${item.lecturer_id}`} className={`overflow-hidden transition-all border shadow-sm ${item.can_evaluate ? 'hover:shadow-md border-primary/20 bg-white' : 'bg-gray-50/80'}`}>
                                    <CardHeader className="pb-3">
                                        <div className="flex justify-between items-start">
                                            {/* Badge الحالة */}
                                            {item.can_evaluate ? (
                                                <Badge className="bg-green-600 hover:bg-green-700">متاح الآن</Badge>
                                            ) : item.is_upcoming ? (
                                                <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">قريباً</Badge>
                                            ) : (
                                                <Badge variant="destructive">غير مؤهل</Badge>
                                            )}
                                            
                                            <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded">
                                                {item.course_code}
                                            </span>
                                        </div>
                                        <CardTitle className="mt-3 text-lg leading-snug text-gray-800">
                                            {item.course_name}
                                        </CardTitle>
                                    </CardHeader>
                                    
                                    <CardContent className="space-y-4 text-sm">
                                        {/* تفاصيل المحاضر والنوع */}
                                        <div className="flex items-center justify-between text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4" />
                                                <span className="font-medium text-foreground">{item.lecturer_name}</span>
                                            </div>
                                            <div className="flex items-center gap-1 bg-white border px-2 py-0.5 rounded-full text-xs shadow-sm">
                                                <BookOpen className="w-3 h-3" />
                                                <span>{item.lecture_type}</span>
                                            </div>
                                        </div>
                        
                                        {/* معلومات الحضور */}
                                        <div className="pt-3 border-t border-dashed">
                                            <div className="flex justify-between text-xs mb-1.5">
                                                <span className="text-muted-foreground">نسبة حضورك:</span>
                                                <div className="flex items-center gap-2">
                                                    <span className={item.is_eligible_attendance ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                                                        {item.student_attendance}%
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground">(مطلوب: {item.required_attendance}%)</span>
                                                </div>
                                            </div>
                                            
                                            {/* شريط التقدم */}
                                            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full transition-all duration-500 ${item.is_eligible_attendance ? 'bg-green-500' : 'bg-red-500'}`} 
                                                    style={{ width: `${Math.min(item.student_attendance, 100)}%` }} 
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                        
                                    <CardFooter>
                                        {/* الأزرار حسب الحالة */}
                                        {item.can_evaluate ? (
                                            <Button className="w-full bg-primary hover:bg-primary/90 shadow-sm transition-all" onClick={() => setActiveEvaluation(item)}>
                                                <CheckCircle2 className="w-4 h-4 ml-2" />
                                                ابدأ التقييم
                                            </Button>
                                        ) : item.is_upcoming ? (
                                            <div className="w-full bg-blue-50 text-blue-700 p-2.5 rounded-md text-sm font-medium flex items-center justify-center gap-2 border border-blue-100">
                                                <Clock className="w-4 h-4" />
                                                <span>يبدأ في {new Date(item.start_date).toLocaleDateString('ar-EG')}</span>
                                            </div>
                                        ) : (
                                            <div className="w-full bg-red-50 text-red-700 p-2.5 rounded-md text-xs font-medium flex items-center justify-center gap-2 border border-red-100">
                                                <Lock className="w-3.5 h-3.5 shrink-0" />
                                                <span className="truncate">{item.rejection_reason}</span>
                                            </div>
                                        )}
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>

                        {evaluations.length === 0 && (
                            <div className="text-center py-20 bg-white rounded-xl border border-dashed">
                                <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">لا توجد تقييمات معلقة</h3>
                                <p className="text-gray-500 mt-2">شكراً لك! لقد أتممت جميع التقييمات المطلوبة.</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}