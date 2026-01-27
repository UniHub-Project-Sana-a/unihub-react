import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle2, XCircle, CalendarClock, ArrowUpRight, MoreHorizontal, MapPin, Clock, CalendarCheck, CalendarX, UserCheck, BellRing, RefreshCcw } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { usePermission } from "@/hooks/usePermission";

interface MakeupRequestsModuleProps {
  collegeId: string | number;
}

export default function MakeupRequestsModule({ collegeId }: MakeupRequestsModuleProps) {
  const { can } = usePermission();
  const { toast } = useToast();
  
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // 1. حالة لتخزين الإحصائيات (الأعداد)
  const [stats, setStats] = useState({ pending: 0, ready: 0, scheduled: 0, rejected: 0 });

  // Tabs: pending, approved (ready), scheduled, rejected
  const [activeTab, setActiveTab] = useState("pending");
  
  // Dialog States
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isProcessDialogOpen, setIsProcessDialogOpen] = useState(false);
  const [processType, setProcessType] = useState<'approve' | 'reject' | 'restore' | null>(null);
  const [notes, setNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // دالة لجلب الإحصائيات (الأعداد)
  const fetchStats = async () => {
    try {
        // نقوم بطلب موازي لجلب أعداد كل الحالات (أو يمكن عمل اندبوينت مخصص في الباك إند للإحصائيات)
        // هنا سنفترض أننا نجلب القوائم ونحسب الطول، أو الأفضل وجود اندبوينت statistics
        // للتبسيط، سنقوم بجلب القوائم (هذا قد يكون ثقيلاً إذا كانت البيانات كثيرة، يفضل endpoint مخصص)
        const [pendingRes, readyRes, scheduledRes, rejectedRes] = await Promise.all([
            api.get(`/v1/colleges/${collegeId}/makeup-requests`, { params: { status_group: 'pending' } }),
            api.get(`/v1/colleges/${collegeId}/makeup-requests`, { params: { status_group: 'ready' } }), // approved formerly
            api.get(`/v1/colleges/${collegeId}/makeup-requests`, { params: { status_group: 'scheduled' } }),
            api.get(`/v1/colleges/${collegeId}/makeup-requests`, { params: { status_group: 'rejected' } })
        ]);

        setStats({
            pending: pendingRes.data.data?.length || 0,
            ready: readyRes.data.data?.length || 0,
            scheduled: scheduledRes.data.data?.length || 0,
            rejected: rejectedRes.data.data?.length || 0
        });
    } catch (error) {
        console.error("Error fetching stats", error);
    }
  };

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      // mapping tabs to backend status_group
      let statusGroup = activeTab;
      if (activeTab === 'approved') statusGroup = 'ready'; // mapping frontend tab name to backend param if needed

      const res = await api.get(`/v1/colleges/${collegeId}/makeup-requests`, {
        params: { status_group: statusGroup } 
      });
      setRequests(res.data.data || []);
      
      // تحديث الإحصائيات أيضاً عند تحديث الجدول
      fetchStats();

    } catch (error) {
      console.error("Error fetching makeup requests", error);
      toast({ title: "خطأ", description: "فشل تحميل الطلبات", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [collegeId, activeTab]);

  const handleProcess = async () => {
    if (!selectedRequest || !processType) return;
    
    setIsProcessing(true);
    try {
        let newStatus = 5; 
        
        if (processType === 'approve') {
            if (selectedRequest.status === 0) newStatus = 1;
            else if (selectedRequest.status === 1) newStatus = 2;
            else if (selectedRequest.status === 2) newStatus = 3; 
            // الحالة 3 لا يتم معالجتها هنا (تتم في TimetableModule)
        } else if (processType === 'restore') {
            // ✅ التعديل الجديد: إعادة الحالة إلى 3 (جاهز للجدولة)
            newStatus = 2;
        }
        else {
            newStatus = 5; // رفض
        }
        
        await api.put(`/v1/makeup-lectures/${selectedRequest.request_id}/review`, {
            status: newStatus,
            notes: notes
        });

        toast({ 
            title: processType === 'approve' ? "تمت الموافقة" : "تم الرفض", 
            description: processType === 'approve' ? 'تم نقل الطلب للمرحلة التالية بنجاح.' : 'تم رفض الطلب وإغلاقه.',
            variant: processType === 'approve' ? "default" : "destructive"
        });

        setIsProcessDialogOpen(false);
        fetchRequests(); 
    } catch (error) {
        toast({ title: "خطأ", description: "فشل معالجة الطلب", variant: "destructive" });
    } finally {
        setIsProcessing(false);
    }
  };

  const openProcessDialog = (req: any, type: 'approve' | 'reject' | 'restore') => {
      setSelectedRequest(req);
      setProcessType(type);
      setNotes("");
      setIsProcessDialogOpen(true);
  }

  const getActionLabel = (status: number) => {
      switch (status) {
          case 0: return "موافقة الشؤون الأكاديمية";
          case 1: return "موافقة رئيس القسم";
          case 2: return "اعتماد العميد";
          default: return "موافقة";
      }
  };

  const getStatusBadge = (status: number) => {
      switch (status) {
          case 0: return <Badge variant="outline" className="text-orange-600 bg-orange-50 border-orange-200">بانتظار الشؤون</Badge>;
          case 1: return <Badge variant="outline" className="text-blue-600 bg-blue-50 border-blue-200">بانتظار رئيس القسم</Badge>;
          case 2: return <Badge variant="outline" className="text-purple-600 bg-purple-50 border-purple-200">بانتظار العميد</Badge>;
          case 3: return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-200">بانتظار الجدولة</Badge>;
          case 4: return <Badge className="bg-green-600">تمت الجدولة</Badge>;
          case 5: return <Badge variant="destructive">مرفوض</Badge>;
          default: return <Badge variant="outline">غير معروف</Badge>;
      }
  };

  const translateReason = (type: string) => {
      const map: Record<string, string> = {
          'sick_leave': 'عذر طبي', 'travel': 'سفر / مهمة', 'schedule_conflict': 'تعارض جداول',
          'official_holiday': 'إجازة رسمية', 'event': 'فعالية', 'maintenance': 'صيانة', 'other': 'أخرى'
      };
      return map[type] || type;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return dateString.split('T')[0]; 
  };

  return (
    <div className="space-y-6" dir="rtl">
        <Card className="shadow-md border-t-4 border-t-primary/60">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <CalendarClock className="w-6 h-6 text-primary" />
                            إدارة طلبات التعويض
                        </CardTitle>
                        <CardDescription className="mt-1">
                            نظام الموافقات الهرمي للمحاضرات التعويضية (شؤون - قسم - عمادة).
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-4 mb-6 bg-muted/50 p-1 rounded-xl">
                        {/* 1. التبويبات بالأرقام الديناميكية */}
                        <TabsTrigger value="pending" className="flex items-center gap-2">
                            الطلبات <Badge variant="secondary" className="px-1.5 h-5 text-[10px]">{stats.pending}</Badge>
                        </TabsTrigger>
                        <TabsTrigger value="approved" className="flex items-center gap-2">
                            جاهز للجدولة <Badge variant="secondary" className="px-1.5 h-5 text-[10px] bg-emerald-100 text-emerald-700">{stats.ready}</Badge>
                        </TabsTrigger>
                        <TabsTrigger value="scheduled" className="flex items-center gap-2">
                            تمت الجدولة <Badge variant="secondary" className="px-1.5 h-5 text-[10px] bg-green-100 text-green-700">{stats.scheduled}</Badge>
                        </TabsTrigger>
                        <TabsTrigger value="rejected" className="flex items-center gap-2">
                            المرفوضة <Badge variant="secondary" className="px-1.5 h-5 text-[10px] bg-red-100 text-red-700">{stats.rejected}</Badge>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value={activeTab}>
                        <div className="border rounded-xl overflow-hidden bg-white" dir="rtl">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/30">
                                        <TableHead className="text-right">المحاضر / المقرر</TableHead>
                                        <TableHead className="text-right">تفاصيل الغياب</TableHead>
                                        <TableHead className="text-right">الاقتراح البديل</TableHead>
                                        <TableHead className="text-right">الحالة الحالية</TableHead>
                                        <TableHead className="text-left w-[220px] px-6">الإجراء</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow><TableCell colSpan={5} className="h-32 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                                    ) : requests.length === 0 ? (
                                        <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground">لا يوجد طلبات في هذه القائمة.</TableCell></TableRow>
                                    ) : (
                                        requests.map((req) => (
                                            <TableRow key={req.request_id} className="hover:bg-muted/5 group">
                                                {/* المحاضر والمقرر */}
                                                <TableCell className="align-top pt-4">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="font-bold text-primary">{req.lecturer_name}</span>
                                                        <span className="font-medium text-sm">{req.course_name}</span>
                                                        <span className="text-xs text-muted-foreground bg-muted w-fit px-2 py-0.5 rounded mt-1">{req.group_name}</span>
                                                    </div>
                                                </TableCell>
                                                
                                                {/* الغياب */}
                                                <TableCell className="align-top pt-4">
                                                  <div className="flex flex-col gap-2">
                                                      <div className="flex items-center gap-2 text-red-700">
                                                        <CalendarX className="w-4 h-4" />
                                                        <span className="font-mono font-semibold text-sm">{formatDate(req.original_date)}</span>
                                                      </div>
                                                      <Badge variant="outline" className="w-fit text-xs font-normal">
                                                        {translateReason(req.reason_type)}
                                                      </Badge>
                                                  </div>
                                                </TableCell>
                                                
                                                {/* الاقتراح */}
                                                <TableCell className="align-top pt-4">
                                                  <div className="flex flex-col gap-1.5">
                                                    <div className="flex items-center gap-2 text-emerald-700">
                                                      <CalendarCheck className="w-4 h-4" />
                                                      <span className="font-mono font-bold text-sm">{formatDate(req.requested_date)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                      <Clock className="w-3.5 h-3.5" />
                                                      <span className="font-mono">{req.start_time?.slice(0, 5)} - {req.end_time?.slice(0, 5)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                      <MapPin className="w-3.5 h-3.5" />
                                                      <span>{req.classroom_name || "غير محدد"}</span>
                                                    </div>
                                                  </div>
                                                </TableCell>
                                                
                                                {/* الحالة */}
                                                <TableCell className="align-top pt-4">
                                                    {getStatusBadge(req.status)}
                                                </TableCell>
                                                
                                                {/* الإجراءات - مختلفة حسب التبويب */}
                                                <TableCell className="text-left align-top pt-3 px-6">
                                                    
                                                    {/* 1. تبويب الطلبات (قيد التوقيع) */}
                                                    {activeTab === 'pending' && (
                                                        <div className="flex items-center justify-end gap-2">
                                                            {can('requests.approve_makeup') && (
                                                              <Button 
                                                                  size="sm" 
                                                                  className="bg-primary hover:bg-primary/90 shadow-sm h-8 px-3 gap-2 text-xs"
                                                                  onClick={() => openProcessDialog(req, 'approve')}
                                                              >
                                                                  <UserCheck className="w-3.5 h-3.5" />
                                                                  {getActionLabel(req.status)}
                                                              </Button>
                                                            )}

                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                                                        <MoreHorizontal className="w-4 h-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuItem onClick={() => openProcessDialog(req, 'reject')} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                                                                        <XCircle className="w-4 h-4 mr-2" />
                                                                        رفض نهائي
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                    )}

                                                    {/* 2. تبويب جاهز للجدولة (عرض فقط) */}
                                                    {activeTab === 'approved' && (
                                                        <div className="text-xs text-muted-foreground italic flex justify-end">
                                                            بانتظار مسؤول الجداول
                                                        </div>
                                                    )}

                                                    {/* 3. تبويب تمت الجدولة (عرض رسالة التأكيد) */}
                                                    {activeTab === 'scheduled' && (
                                                        <div className="flex items-center justify-end gap-1.5 text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100 w-fit ml-auto">
                                                            <BellRing className="w-3.5 h-3.5" />
                                                            <span className="text-[10px] font-medium">تم الإشعار والجدولة</span>
                                                        </div>
                                                    )}

                                                    {/* 4. تبويب المرفوضة */}
                                                    {activeTab === 'rejected' && (
                                                        <div className="flex justify-end">
                                                            {can('requests.rejected_makeup') && (
                                                              <Button 
                                                                  size="sm" 
                                                                  variant="outline"
                                                                  className="text-blue-600 border-blue-200 hover:bg-blue-50 gap-2 h-8 text-xs"
                                                                  onClick={() => openProcessDialog(req, 'restore')}
                                                              >
                                                                  <RefreshCcw className="w-3.5 h-3.5" />
                                                                  إعادة للجدولة
                                                              </Button>
                                                            )}
                                                        </div>
                                                    )}

                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>

        {/* مودال التأكيد */}
        <Dialog open={isProcessDialogOpen} onOpenChange={setIsProcessDialogOpen}>
            <DialogContent className="sm:max-w-[450px]" dir="rtl">
                <DialogHeader className="text-right">
                    <DialogTitle className="flex items-center gap-2">
                        {processType === 'approve' && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                        {processType === 'reject' && <XCircle className="w-5 h-5 text-red-600" />}
                        {/* أيقونة الاستعادة */}
                        {processType === 'restore' && <RefreshCcw className="w-5 h-5 text-blue-600" />}
                        
                        {processType === 'approve' ? 'تأكيد الموافقة' : 
                         processType === 'restore' ? 'تراجع عن الرفض' : 'رفض الطلب'}
                    </DialogTitle>
                    <DialogDescription className="text-right mt-2">
                        {processType === 'approve' ? 'سيتم اعتماد هذا الطلب ونقله للمرحلة التالية.' : 
                         processType === 'restore' ? 'سيتم إلغاء الرفض وإعادة الطلب لمرحلة "اعتماد العميد" للمراجعة مرة أخرى.' :
                         'سيتم رفض الطلب نهائياً.'}
                    </DialogDescription>
                </DialogHeader>
                
                {/* (تم حذف التيكست ايريا كما طلبت سابقاً) */}

                <DialogFooter className="gap-2 sm:justify-between mt-4">
                    {/* حالة الموافقة (مع زر الرفض السريع) */}
                    {processType === 'approve' && (
                        <div className="flex w-full gap-2">
                             <Button variant="destructive" className="w-1/3 opacity-90 hover:opacity-100" onClick={() => setProcessType('reject')}>
                                <XCircle className="w-4 h-4 ml-2" /> رفض
                             </Button>
                             <Button onClick={handleProcess} className="w-2/3 bg-green-600 hover:bg-green-700" disabled={isProcessing}>
                                {isProcessing && <Loader2 className="w-4 h-4 ml-2 animate-spin" />} نعم، موافقة
                             </Button>
                        </div>
                    )}

                    {/* حالة الرفض */}
                    {processType === 'reject' && (
                        <div className="flex w-full gap-2 justify-end">
                            <Button variant="outline" onClick={() => setIsProcessDialogOpen(false)}>إلغاء</Button>
                            <Button variant="destructive" onClick={handleProcess} disabled={isProcessing}>
                                {isProcessing && <Loader2 className="w-4 h-4 ml-2 animate-spin" />} تأكيد الرفض
                            </Button>
                        </div>
                    )}

                    {/* ✅ حالة الاستعادة (الجديدة) */}
                    {processType === 'restore' && (
                        <div className="flex w-full gap-2 justify-end">
                            <Button variant="outline" onClick={() => setIsProcessDialogOpen(false)}>إلغاء</Button>
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleProcess} disabled={isProcessing}>
                                {isProcessing && <Loader2 className="w-4 h-4 ml-2 animate-spin" />} تأكيد الاستعادة
                            </Button>
                        </div>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}