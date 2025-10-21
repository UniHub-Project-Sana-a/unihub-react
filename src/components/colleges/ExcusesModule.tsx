import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock,
  Paperclip,
  User,
  Calendar,
  MapPin,
  MessageSquare
} from "lucide-react";

export const ExcusesModule = () => {
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [actionReason, setActionReason] = useState("");

  const mockRequests = [
    {
      id: "REQ-1001",
      instructor: "د. أحمد الحربي",
      course: "CS101 - مدخل إلى الحاسوب",
      section: "A",
      date: "2025-10-20",
      time: "08:00-10:00",
      room: "C-101",
      type: "عذر غياب",
      reason: "ظرف صحي طارئ",
      submittedAt: "2025-10-18 14:30",
      status: "جديد",
      department: "علوم الحاسوب",
      attachments: 2,
      history: [
        { action: "تم التقديم", by: "د. أحمد الحربي", date: "2025-10-18 14:30", status: "جديد" }
      ]
    },
    {
      id: "REQ-1002",
      instructor: "د. سارة القحطاني",
      course: "CS202 - هياكل البيانات",
      section: "B",
      date: "2025-10-21",
      time: "10:00-12:00",
      room: "C-102",
      type: "محاضرة تعويضية",
      reason: "تعويض محاضرة فائتة",
      submittedAt: "2025-10-17 09:15",
      status: "معتمد من الشؤون",
      department: "علوم الحاسوب",
      attachments: 1,
      history: [
        { action: "تم التقديم", by: "د. سارة القحطاني", date: "2025-10-17 09:15", status: "جديد" },
        { action: "تمت الموافقة", by: "أ.د. محمد - الشؤون الأكاديمية", date: "2025-10-17 15:20", status: "معتمد" }
      ]
    },
    {
      id: "REQ-1003",
      instructor: "د. مريم باوزير",
      course: "CS301 - قواعد البيانات",
      section: "A",
      date: "2025-10-19",
      time: "12:00-14:00",
      room: "Lab-1",
      type: "عذر غياب",
      reason: "مهمة رسمية",
      submittedAt: "2025-10-16 11:00",
      status: "مرفوض",
      department: "علوم الحاسوب",
      attachments: 0,
      history: [
        { action: "تم التقديم", by: "د. مريم باوزير", date: "2025-10-16 11:00", status: "جديد" },
        { action: "تم الرفض", by: "أ.د. علي - الشؤون الأكاديمية", date: "2025-10-16 16:45", status: "مرفوض" }
      ]
    }
  ];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", icon: any }> = {
      "جديد": { variant: "outline", icon: Clock },
      "معتمد من الشؤون": { variant: "default", icon: CheckCircle },
      "معتمد": { variant: "default", icon: CheckCircle },
      "مرفوض": { variant: "destructive", icon: XCircle },
      "قيد المراجعة": { variant: "secondary", icon: Clock },
    };
    const config = variants[status] || variants["جديد"];
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="academic" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-card/50 backdrop-blur-sm">
          <TabsTrigger value="academic" className="data-[state=active]:bg-primary/10">الشؤون الأكاديمية</TabsTrigger>
          <TabsTrigger value="chairs" className="data-[state=active]:bg-primary/10">رؤساء الأقسام</TabsTrigger>
        </TabsList>

        {/* Academic Affairs */}
        <TabsContent value="academic" className="space-y-6">
          {/* Filter Bar */}
          <Card className="backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>نوع الطلب</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="الكل" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      <SelectItem value="excuse">عذر غياب</SelectItem>
                      <SelectItem value="makeup">محاضرة تعويضية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>القسم</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="الكل" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      <SelectItem value="cs">علوم الحاسوب</SelectItem>
                      <SelectItem value="is">نظم المعلومات</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>الحالة</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="الكل" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      <SelectItem value="new">جديد</SelectItem>
                      <SelectItem value="approved">معتمد</SelectItem>
                      <SelectItem value="rejected">مرفوض</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>الفترة الزمنية</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="آخر 30 يوم" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">آخر 7 أيام</SelectItem>
                      <SelectItem value="30">آخر 30 يوم</SelectItem>
                      <SelectItem value="90">آخر 90 يوم</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Requests Inbox */}
          <Card className="backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>صندوق الطلبات</CardTitle>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">موافقة جماعية</Button>
                  <Button size="sm" variant="outline">رفض جماعي</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الطلب</TableHead>
                    <TableHead>المحاضر</TableHead>
                    <TableHead>المقرر</TableHead>
                    <TableHead>التاريخ والوقت</TableHead>
                    <TableHead>القاعة</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>المرفقات</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockRequests.map(request => (
                    <TableRow key={request.id} className="hover:bg-primary/5">
                      <TableCell className="font-medium">{request.id}</TableCell>
                      <TableCell>{request.instructor}</TableCell>
                      <TableCell>{request.course}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{request.date}</div>
                          <div className="text-muted-foreground">{request.time}</div>
                        </div>
                      </TableCell>
                      <TableCell>{request.room}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{request.type}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>
                        {request.attachments > 0 && (
                          <Badge variant="secondary" className="gap-1">
                            <Paperclip className="w-3 h-3" />
                            {request.attachments}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setSelectedRequest(request)}
                            >
                              عرض
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl backdrop-blur-sm">
                            <DialogHeader>
                              <DialogTitle>تفاصيل الطلب - {request.id}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-6">
                              {/* Request Info */}
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2 text-sm">
                                    <User className="w-4 h-4 text-muted-foreground" />
                                    <span className="font-medium">المحاضر:</span>
                                    <span>{request.instructor}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <FileText className="w-4 h-4 text-muted-foreground" />
                                    <span className="font-medium">المقرر:</span>
                                    <span>{request.course}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <Calendar className="w-4 h-4 text-muted-foreground" />
                                    <span className="font-medium">التاريخ:</span>
                                    <span>{request.date} {request.time}</span>
                                  </div>
                                </div>
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2 text-sm">
                                    <MapPin className="w-4 h-4 text-muted-foreground" />
                                    <span className="font-medium">القاعة:</span>
                                    <span>{request.room}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <Clock className="w-4 h-4 text-muted-foreground" />
                                    <span className="font-medium">تاريخ التقديم:</span>
                                    <span>{request.submittedAt}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Reason */}
                              <div>
                                <Label>السبب</Label>
                                <p className="text-sm p-3 bg-secondary/50 rounded-lg mt-2">
                                  {request.reason}
                                </p>
                              </div>

                              {/* Timeline */}
                              <div>
                                <Label className="mb-3 block">سجل الحالات</Label>
                                <div className="space-y-3">
                                  {request.history.map((item, idx) => (
                                    <div key={idx} className="flex items-start gap-3 p-3 bg-card rounded-lg border">
                                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <MessageSquare className="w-4 h-4 text-primary" />
                                      </div>
                                      <div className="flex-1">
                                        <div className="font-medium text-sm">{item.action}</div>
                                        <div className="text-xs text-muted-foreground">بواسطة: {item.by}</div>
                                        <div className="text-xs text-muted-foreground">{item.date}</div>
                                      </div>
                                      {getStatusBadge(item.status)}
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Actions */}
                              {request.status === "جديد" && (
                                <div className="space-y-4 pt-4 border-t">
                                  <div>
                                    <Label>السبب (مطلوب)</Label>
                                    <Textarea 
                                      value={actionReason}
                                      onChange={(e) => setActionReason(e.target.value)}
                                      placeholder="أدخل سبب القرار..."
                                      className="mt-2"
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <Button className="flex-1" disabled={!actionReason}>
                                      <CheckCircle className="w-4 h-4 ml-2" />
                                      موافقة
                                    </Button>
                                    <Button variant="destructive" className="flex-1" disabled={!actionReason}>
                                      <XCircle className="w-4 h-4 ml-2" />
                                      رفض
                                    </Button>
                                  </div>
                                  <Button variant="outline" className="w-full">
                                    إضافة ملاحظة داخلية
                                  </Button>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Department Chairs */}
        <TabsContent value="chairs" className="space-y-6">
          <Card className="backdrop-blur-sm border-primary/30">
            <CardHeader>
              <CardTitle>الطلبات المعتمدة من الشؤون الأكاديمية</CardTitle>
              <p className="text-sm text-muted-foreground">تحتاج إلى تأكيد رئيس القسم</p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الطلب</TableHead>
                    <TableHead>المحاضر</TableHead>
                    <TableHead>المقرر</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>معتمد بواسطة</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockRequests.filter(r => r.status === "معتمد من الشؤون").map(request => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.id}</TableCell>
                      <TableCell>{request.instructor}</TableCell>
                      <TableCell>{request.course}</TableCell>
                      <TableCell>{request.date}</TableCell>
                      <TableCell>
                        <Badge variant="default" className="gap-1">
                          <Clock className="w-3 h-3" />
                          في انتظار رئيس القسم
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        أ.د. محمد - الشؤون الأكاديمية
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="default">
                            <CheckCircle className="w-3 h-3 ml-1" />
                            تأكيد
                          </Button>
                          <Button size="sm" variant="outline">
                            تجاوز
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
export default ExcusesModule;