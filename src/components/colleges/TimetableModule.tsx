import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  Link, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Download,
  ZoomIn,
  ZoomOut,
  Calendar,
  Clock,
  MapPin,
  User
} from "lucide-react";
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

export const TimetableModule = () => {
  const [importSource, setImportSource] = useState<"api" | "file" | null>(null);
  const [importStatus, setImportStatus] = useState<"idle" | "success" | "conflict">("idle");
  const [fileName, setFileName] = useState("");
  const [zoomLevel, setZoomLevel] = useState(100);

  const mockConflicts = [
    { course: "CS101", instructor: "د. أحمد", room: "C-101", date: "الأحد", time: "08:00-10:00" },
    { course: "CS202", instructor: "د. سارة", room: "C-102", date: "الثلاثاء", time: "10:00-12:00" }
  ];

  const mockImportLog = [
    { date: "2025-10-15 14:30", source: "API", items: 120, status: "نجح", notes: "تم الاستيراد بنجاح" },
    { date: "2025-10-10 09:15", source: "Excel", items: 95, status: "فشل", notes: "خطأ في التنسيق" },
    { date: "2025-10-05 16:20", source: "CSV", items: 110, status: "نجح", notes: "لا توجد تعارضات" }
  ];

  const mockSchedule = [
    { id: 1, day: "الأحد", time: "08:00-10:00", course: "مدخل إلى الحاسوب", code: "CS101", instructor: "د. أحمد الحربي", room: "C-101", capacity: "60/60", color: "bg-blue-500/10 border-blue-500/30" },
    { id: 2, day: "الأحد", time: "10:00-12:00", course: "هياكل البيانات", code: "CS202", instructor: "د. سارة القحطاني", room: "C-102", capacity: "45/60", color: "bg-purple-500/10 border-purple-500/30" },
    { id: 3, day: "الاثنين", time: "08:00-10:00", course: "قواعد البيانات", code: "CS301", instructor: "د. مريم باوزير", room: "Lab-1", capacity: "30/30", color: "bg-teal-500/10 border-teal-500/30" },
    { id: 4, day: "الاثنين", time: "12:00-14:00", course: "الذكاء الاصطناعي", code: "CS401", instructor: "أ.د. محمد", room: "C-201", capacity: "40/60", color: "bg-orange-500/10 border-orange-500/30" },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="import" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-card/50 backdrop-blur-sm">
          <TabsTrigger value="import" className="data-[state=active]:bg-primary/10">استيراد الجدول</TabsTrigger>
          <TabsTrigger value="view" className="data-[state=active]:bg-primary/10">عرض الجدول</TabsTrigger>
        </TabsList>

        {/* Import Schedule */}
        <TabsContent value="import" className="space-y-6">
          {/* Source Selector */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card 
              className={`cursor-pointer transition-all duration-300 hover:scale-105 backdrop-blur-sm ${
                importSource === "api" ? "border-primary shadow-lg shadow-primary/20" : "border-border/50"
              }`}
              onClick={() => setImportSource("api")}
            >
              <CardContent className="pt-6 text-center">
                <Link className="w-12 h-12 mx-auto mb-4 text-primary" />
                <h3 className="font-bold text-lg mb-2">تكامل API</h3>
                <p className="text-sm text-muted-foreground">الاتصال بنظام خارجي</p>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all duration-300 hover:scale-105 backdrop-blur-sm ${
                importSource === "file" ? "border-primary shadow-lg shadow-primary/20" : "border-border/50"
              }`}
              onClick={() => setImportSource("file")}
            >
              <CardContent className="pt-6 text-center">
                <Upload className="w-12 h-12 mx-auto mb-4 text-primary" />
                <h3 className="font-bold text-lg mb-2">رفع ملف</h3>
                <p className="text-sm text-muted-foreground">Excel, PDF, CSV</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer transition-all duration-300 hover:scale-105 backdrop-blur-sm border-border/50">
              <CardContent className="pt-6 text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-bold text-lg mb-2">إدخال يدوي</h3>
                <p className="text-sm text-muted-foreground">قريباً</p>
              </CardContent>
            </Card>
          </div>

          {/* API Integration Form */}
          {importSource === "api" && (
            <Card className="backdrop-blur-sm border-primary/30">
              <CardHeader>
                <CardTitle>تكامل API</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>عنوان URL</Label>
                  <Input placeholder="https://api.example.com/timetable" />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline">اختبار الاتصال</Button>
                  <Button onClick={() => setImportStatus("success")}>استيراد</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* File Upload */}
          {importSource === "file" && (
            <Card className="backdrop-blur-sm border-primary/30">
              <CardHeader>
                <CardTitle>رفع ملف</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-primary/30 rounded-lg p-8 text-center hover:border-primary/60 transition-colors">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">اسحب الملف هنا أو</p>
                  <Input 
                    type="file" 
                    accept=".xlsx,.xls,.csv,.pdf" 
                    onChange={handleFileUpload}
                    className="max-w-xs mx-auto"
                  />
                  {fileName && (
                    <p className="mt-4 text-sm font-medium text-primary">{fileName}</p>
                  )}
                </div>
                <Button className="w-full" onClick={() => setImportStatus("conflict")}>استيراد</Button>
              </CardContent>
            </Card>
          )}

          {/* Success Banner */}
          {importStatus === "success" && (
            <Card className="border-green-500/50 bg-green-500/10 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2">تم الاستيراد بنجاح!</h3>
                    <p className="text-sm text-muted-foreground mb-3">تم استيراد 120 محاضرة، 45 مقرراً، 0 تعارض</p>
                    <Button size="sm">معاينة في التقويم</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Conflicts Panel */}
          {importStatus === "conflict" && (
            <Card className="border-red-500/50 bg-red-500/10 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                  <CardTitle className="text-red-600">تم اكتشاف تعارضات</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المقرر</TableHead>
                      <TableHead>المحاضر</TableHead>
                      <TableHead>القاعة</TableHead>
                      <TableHead>اليوم</TableHead>
                      <TableHead>الوقت</TableHead>
                      <TableHead>الإجراء</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockConflicts.map((conflict, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{conflict.course}</TableCell>
                        <TableCell>{conflict.instructor}</TableCell>
                        <TableCell>{conflict.room}</TableCell>
                        <TableCell>{conflict.date}</TableCell>
                        <TableCell>{conflict.time}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline">تجاهل</Button>
                            <Button size="sm" variant="outline">تعديل</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Import Log */}
          <Card className="backdrop-blur-sm">
            <CardHeader>
              <CardTitle>سجل الاستيراد/التصدير</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>التاريخ والوقت</TableHead>
                    <TableHead>المصدر</TableHead>
                    <TableHead>عدد العناصر</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>ملاحظات</TableHead>
                    <TableHead>تحميل</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockImportLog.map((log, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{log.date}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.source}</Badge>
                      </TableCell>
                      <TableCell>{log.items}</TableCell>
                      <TableCell>
                        <Badge variant={log.status === "نجح" ? "default" : "destructive"}>
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{log.notes}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost">
                          <Download className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* View Schedule */}
        <TabsContent value="view" className="space-y-6">
          {/* Filters */}
          <Card className="backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>القسم</Label>
                  <Select defaultValue="cs">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cs">علوم الحاسوب</SelectItem>
                      <SelectItem value="is">نظم المعلومات</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>البرنامج</Label>
                  <Select defaultValue="bachelor">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bachelor">بكالوريوس</SelectItem>
                      <SelectItem value="master">ماجستير</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>المستوى</Label>
                  <Select defaultValue="1">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">المستوى الأول</SelectItem>
                      <SelectItem value="2">المستوى الثاني</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>الترم</Label>
                  <Select defaultValue="1">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">الترم الأول</SelectItem>
                      <SelectItem value="2">الترم الثاني</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Zoom Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium">{zoomLevel}%</span>
              <Button size="sm" variant="outline" onClick={() => setZoomLevel(Math.min(150, zoomLevel + 10))}>
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline">اليوم</Button>
              <Button size="sm" variant="outline">طباعة</Button>
              <Button size="sm" variant="outline">تصدير</Button>
            </div>
          </div>

          {/* Weekly Grid */}
          <Card className="backdrop-blur-sm overflow-x-auto">
            <CardContent className="pt-6">
              <div className="min-w-[800px]" style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top right' }}>
                <div className="grid grid-cols-6 gap-2">
                  <div className="font-bold text-center p-4 bg-card rounded-lg">الوقت</div>
                  {["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"].map(day => (
                    <div key={day} className="font-bold text-center p-4 bg-card rounded-lg">{day}</div>
                  ))}
                </div>

                {["08:00-10:00", "10:00-12:00", "12:00-14:00", "14:00-16:00"].map((time, timeIdx) => (
                  <div key={time} className="grid grid-cols-6 gap-2 mt-2">
                    <div className="text-center p-4 bg-card/50 rounded-lg flex items-center justify-center">
                      <Clock className="w-4 h-4 ml-2" />
                      {time}
                    </div>
                    {["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"].map((day, dayIdx) => {
                      const lecture = mockSchedule.find(s => s.day === day && s.time === time);
                      return (
                        <div key={dayIdx} className="min-h-[120px]">
                          {lecture ? (
                            <Card className={`h-full ${lecture.color} border backdrop-blur-sm hover:scale-105 transition-all duration-200 cursor-pointer`}>
                              <CardContent className="p-3">
                                <div className="font-bold text-sm mb-1">{lecture.code}</div>
                                <div className="text-xs mb-2">{lecture.course}</div>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                                  <User className="w-3 h-3" />
                                  {lecture.instructor}
                                </div>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                                  <MapPin className="w-3 h-3" />
                                  {lecture.room}
                                </div>
                                <Badge variant="outline" className="text-xs">{lecture.capacity}</Badge>
                              </CardContent>
                            </Card>
                          ) : (
                            <div className="h-full border border-dashed border-border/30 rounded-lg bg-card/20"></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Legend */}
          <Card className="backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-blue-500/30"></div>
                  <span className="text-sm">علوم الحاسوب</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-purple-500/30"></div>
                  <span className="text-sm">نظم المعلومات</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-teal-500/30"></div>
                  <span className="text-sm">الذكاء الاصطناعي</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-orange-500/30"></div>
                  <span className="text-sm">هندسة البرمجيات</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
export default TimetableModule;