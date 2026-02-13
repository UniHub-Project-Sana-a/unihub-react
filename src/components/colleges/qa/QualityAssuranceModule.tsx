import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, CalendarRange, BarChart3, Settings2, BookOpenCheck  } from "lucide-react";

// سنقوم بإنشاء هذه المكونات لاحقاً، حالياً سنضع مكونات فارغة (Placeholders)
import QaFormsManager from './forms/QaFormsManager';
import QaCampaignsManager from './campaigns/QaCampaignsManager';
import QaReportsDashboard from './reports/QaReportsDashboard';
import CourseExecutionReports from './reports/CourseExecutionReports'; 

interface QualityAssuranceModuleProps {
    collegeId: number | string;
}

export default function QualityAssuranceModule({ collegeId }: QualityAssuranceModuleProps) {
    const id = Number(collegeId);
    const [activeTab, setActiveTab] = useState("forms");

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500" dir="rtl">
            
            {/* الترويسة */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4" dir="rtl">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">نظام ضمان الجودة والاعتماد</h2>
                    <p className="text-muted-foreground">
                        إدارة نماذج التقييم، فترات الاستبيان، وتحليل نتائج تقييم الأداء.
                    </p>
                </div>
            </div>

            {/* التبويبات الداخلية */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" dir="rtl">
                <div className="flex items-center justify-between mb-4">
                    <TabsList className="grid grid-cols-4 w-full max-w-[800px]">
                        <TabsTrigger value="forms" className="gap-2">
                            <FileText className="h-4 w-4" />
                            <span>بناء النماذج</span>
                        </TabsTrigger>
                        <TabsTrigger value="campaigns" className="gap-2">
                            <CalendarRange className="h-4 w-4" />
                            <span>جدولة التقييم</span>
                        </TabsTrigger>
                        <TabsTrigger value="reports" className="gap-2">
                            <BarChart3 className="h-4 w-4" />
                            <span>النتائج والتحليل</span>
                        </TabsTrigger>
                        <TabsTrigger value="execution" className="gap-2">
                            <BookOpenCheck className="h-4 w-4" />
                            <span>متابعة التدريس</span>
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* المحتوى 1: بناء النماذج (الأسئلة والمجالات) */}
                <TabsContent value="forms" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>مكتبة نماذج التقييم</CardTitle>
                            <CardDescription>إدارة نماذج الاستبيانات وإضافة المجالات والأسئلة (كما في الدليل الإجرائي).</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <QaFormsManager collegeId={id} />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* المحتوى 2: إدارة الحملات (الفترات الزمنية) */}
                <TabsContent value="campaigns" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>إدارة حملات التقييم</CardTitle>
                            <CardDescription>تحديد الفترات الزمنية لفتح التقييم للطلاب وربطها بالفصول الدراسية.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <QaCampaignsManager collegeId={id} />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* المحتوى 3: التقارير */}
                <TabsContent value="reports" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>تحليل النتائج</CardTitle>
                            <CardDescription>استعراض نتائج تقييم أعضاء هيئة التدريس والمواد.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <QaReportsDashboard collegeId={id} />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/** المحتوى 4: تقارير تنفيذ المقررات ومخرجات التعلم */}
                <TabsContent value="execution" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>تقارير تنفيذ المقررات ومخرجات التعلم</CardTitle>
                            <CardDescription>متابعة تفصيلية للمواضيع التي تم شرحها، نسب الإنجاز، وأداء الطلاب في الأسئلة الصفية.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <CourseExecutionReports collegeId={id} />
                        </CardContent>
                    </Card>
                </TabsContent>

            </Tabs>
        </div>
    );
}