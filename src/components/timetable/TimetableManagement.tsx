import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, Calendar, Users, MapPin, Clock, Download, RefreshCw, 
  FileUp, Database, Edit, AlertTriangle, CheckCircle, X,
  Filter, Search
} from "lucide-react";

const timeSlots = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];
const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const sampleTimetable = {
  "Computer Science": {
    "Level 1": {
      "Monday": {
        "09:00": { course: "CS101", code: "CS101", instructor: "Dr. Smith", room: "A101", group: "CS1-A", type: "Lecture", conflict: false },
        "11:00": { course: "MATH201", code: "MATH201", instructor: "Prof. Johnson", room: "B205", group: "CS1-B", type: "Lecture", conflict: false },
      },
      "Tuesday": {
        "08:00": { course: "CS102", code: "CS102", instructor: "Dr. Ahmed", room: "A102", group: "CS1-A", type: "Lab", conflict: false },
        "10:00": { course: "ENG101", code: "ENG101", instructor: "Prof. Wilson", room: "D101", group: "CS1-B", type: "Lecture", conflict: true },
      }
    }
  },
  "Engineering": {
    "Level 1": {
      "Monday": {
        "09:00": { course: "ENG101", code: "ENG101", instructor: "Dr. Brown", room: "E101", group: "ENG1-A", type: "Lecture", conflict: false },
      },
      "Wednesday": {
        "13:00": { course: "MATH202", code: "MATH202", instructor: "Prof. Johnson", room: "B206", group: "ENG1-B", type: "Lecture", conflict: false },
      }
    }
  }
};

const importHistory = [
  { id: 1, timestamp: "2024-01-15 14:30", source: "ASC API", records: 156, status: "success" },
  { id: 2, timestamp: "2024-01-10 09:15", source: "Excel Upload", records: 89, status: "success" },
  { id: 3, timestamp: "2024-01-08 16:45", source: "Manual Entry", records: 12, status: "failed" },
  { id: 4, timestamp: "2024-01-05 11:20", source: "CSV Import", records: 203, status: "success" },
];

const sampleImportData = [
  { course: "CS101", instructor: "Dr. Smith", room: "A101", time: "Monday 09:00", group: "CS1-A", type: "Lecture" },
  { course: "MATH201", instructor: "Prof. Johnson", room: "B205", time: "Monday 11:00", group: "CS1-B", type: "Lecture" },
  { course: "CS102", instructor: "Dr. Ahmed", room: "A102", time: "Tuesday 08:00", group: "CS1-A", type: "Lab" },
];

export function TimetableManagement() {
  const [activeTab, setActiveTab] = useState("import");
  const [importSource, setImportSource] = useState("api");
  const [importStatus, setImportStatus] = useState("idle");
  const [showPreview, setShowPreview] = useState(false);
  const [semester, setSemester] = useState("Fall");
  const [selectedDepartment, setSelectedDepartment] = useState("Computer Science");
  const [selectedLevel, setSelectedLevel] = useState("Level 1");
  const [filterGroup, setFilterGroup] = useState("");
  const [filterInstructor, setFilterInstructor] = useState("");
  const [filterRoom, setFilterRoom] = useState("");
  const { toast } = useToast();

  const handleImport = () => {
    setImportStatus("importing");
    setTimeout(() => {
      setImportStatus("success");
      toast({
        title: "تم الاستيراد بنجاح",
        description: "تم استيراد بيانات الجدول بنجاح.",
        className: "bg-blue-50 border-blue-200 text-blue-900",
      });
    }, 3000);
  };

  const handleFileUpload = () => {
    setShowPreview(true);
    toast({
      title: "تم رفع الملف",
      description: "قم بمعاينة البيانات وتعيين مطابقة الحقول قبل الاستيراد.",
      className: "bg-blue-50 border-blue-200 text-blue-900",
    });
  };

  const conflicts = [
    { course: "ENG101", time: "Tuesday 10:00", room: "D101", issue: "Room already booked" },
    { course: "CS201", time: "Wednesday 14:00", room: "A101", issue: "Instructor conflict" },
  ];

  const currentTimetable = sampleTimetable[selectedDepartment]?.[selectedLevel] || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">إدارة الجداول الدراسية</h1>
          <p className="text-muted-foreground">استيراد وإدارة الجداول الأكاديمية</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="import">استيراد الجدول</TabsTrigger>
          <TabsTrigger value="view">عرض الجدول</TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="space-y-6">
          {/* اختيار مصدر الاستيراد */}
          <Card className="shadow-lg border-border">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="w-5 h-5 text-primary" />
                <span>مصدر الاستيراد</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant={importSource === "api" ? "default" : "outline"}
                  onClick={() => setImportSource("api")}
                  className="h-24 flex flex-col space-y-2"
                >
                  <Database className="w-6 h-6" />
                  <span>تكامل API</span>
                  <span className="text-xs opacity-75">ASC Timetables</span>
                </Button>
                
                <Button
                  variant={importSource === "file" ? "default" : "outline"}
                  onClick={() => setImportSource("file")}
                  className="h-24 flex flex-col space-y-2"
                >
                  <FileUp className="w-6 h-6" />
                  <span>رفع ملف</span>
                  <span className="text-xs opacity-75">CSV, Excel, JSON, XML</span>
                </Button>
                
                <Button
                  variant={importSource === "manual" ? "default" : "outline"}
                  onClick={() => setImportSource("manual")}
                  className="h-24 flex flex-col space-y-2"
                >
                  <Edit className="w-6 h-6" />
                  <span>إدخال يدوي</span>
                  <span className="text-xs opacity-75">نموذج إدخال</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* واجهة الاستيراد */}
          {importSource === "file" && (
            <Card className="shadow-lg border-border">
              <CardHeader>
                <CardTitle>رفع ملف</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                  <FileUp className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">أسقط الملفات هنا أو انقر للتصفح</p>
                  <Button onClick={handleFileUpload}>
                    <Upload className="w-4 h-4 mr-2" />
                    رفع الملف
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {importSource === "api" && (
            <Card className="shadow-lg border-border">
              <CardHeader>
                <CardTitle>تكامل API</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">نقطة نهاية API</label>
                    <Input value="https://asc.university.edu/api/timetables" readOnly />
                  </div>
                  <Button 
                    onClick={handleImport} 
                    disabled={importStatus === "importing"}
                    className="w-full"
                  >
                    {importStatus === "importing" ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    {importStatus === "importing" ? "جارٍ الاستيراد..." : "جلب البيانات"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* معاينة البيانات */}
          {showPreview && (
            <Card className="shadow-lg border-border">
              <CardHeader>
                <CardTitle>معاينة البيانات ومطابقة الحقول</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>المقرر</TableHead>
                        <TableHead>المحاضر</TableHead>
                        <TableHead>القاعة</TableHead>
                        <TableHead>الوقت</TableHead>
                        <TableHead>المجموعة</TableHead>
                        <TableHead>النوع</TableHead>
                        <TableHead>الحالة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sampleImportData.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{row.course}</TableCell>
                          <TableCell>{row.instructor}</TableCell>
                          <TableCell>{row.room}</TableCell>
                          <TableCell>{row.time}</TableCell>
                          <TableCell>{row.group}</TableCell>
                          <TableCell>
                            <Badge variant={row.type === "Lecture" ? "default" : "secondary"}>
                              {row.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button onClick={handleImport}>
                    <Upload className="w-4 h-4 mr-2" />
                    استيراد البيانات
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* التعارضات والتنبيهات */}
          {conflicts.length > 0 && (
            <Card className="shadow-lg border-destructive">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-destructive">
                  <AlertTriangle className="w-5 h-5" />
                  <span>تم اكتشاف تعارضات</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {conflicts.map((conflict, index) => (
                    <div key={index} className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-destructive">{conflict.course}</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            {conflict.time} - {conflict.room}
                          </span>
                        </div>
                        <span className="text-sm text-destructive">{conflict.issue}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* سجل الاستيراد */}
          <Card className="shadow-lg border-border">
            <CardHeader>
              <CardTitle>سجل الاستيراد</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الطابع الزمني</TableHead>
                    <TableHead>المصدر</TableHead>
                    <TableHead>عدد السجلات</TableHead>
                    <TableHead>الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importHistory.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.timestamp}</TableCell>
                      <TableCell>{entry.source}</TableCell>
                      <TableCell>{entry.records}</TableCell>
                      <TableCell>
                        <Badge variant={entry.status === "success" ? "default" : "destructive"}>
                          {entry.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="view" className="space-y-6">
          {/* مرشحات الجدول */}
          <Card className="shadow-lg border-border">
            <CardHeader>
              <CardTitle>عوامل تصفية الجدول</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">الفصل الدراسي</label>
                  <Select value={semester} onValueChange={setSemester}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fall">خريف 2024</SelectItem>
                      <SelectItem value="Spring">ربيع 2024</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">القسم</label>
                  <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Computer Science">علوم الحاسب</SelectItem>
                      <SelectItem value="Engineering">الهندسة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">المستوى</label>
                  <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Level 1">المستوى 1</SelectItem>
                      <SelectItem value="Level 2">المستوى 2</SelectItem>
                      <SelectItem value="Level 3">المستوى 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">تصدير</label>
                  <Button variant="outline" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    تصدير PDF
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* عوامل تصفية إضافية */}
          <Card className="shadow-lg border-border">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Input 
                    placeholder="تصفية حسب المجموعة..."
                    value={filterGroup}
                    onChange={(e) => setFilterGroup(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <Input 
                    placeholder="تصفية حسب المحاضر..."
                    value={filterInstructor}
                    onChange={(e) => setFilterInstructor(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <Input 
                    placeholder="تصفية حسب القاعة..."
                    value={filterRoom}
                    onChange={(e) => setFilterRoom(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* شبكة الجدول */}
          <Card className="shadow-lg border-border">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-primary" />
                <span>جدول {selectedDepartment} - {selectedLevel}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* عرض سطح المكتب */}
              <div className="hidden md:block overflow-x-auto">
                <div className="grid grid-cols-6 gap-2 min-w-[800px]">
                  <div className="font-medium text-center p-3 bg-muted rounded-lg">الوقت</div>
                  {weekDays.map(day => (
                    <div key={day} className="font-medium text-center p-3 bg-muted rounded-lg">
                      {day}
                    </div>
                  ))}
                  
                  {timeSlots.map(time => (
                    <>
                      <div key={time} className="font-medium text-center p-3 bg-muted/50 rounded-lg">
                        {time}
                      </div>
                      {weekDays.map(day => {
                        const session = currentTimetable[day]?.[time];
                        return (
                          <div key={`${day}-${time}`} className="p-1">
                            {session ? (
                              <div className={`p-3 rounded-lg shadow-md border-2 transition-all duration-200 hover:shadow-lg ${
                                session.conflict 
                                  ? 'bg-destructive/10 border-destructive' 
                                  : 'bg-card border-primary'
                              }`}>
                                <div className="font-semibold text-sm mb-1">
                                  {session.course}
                                </div>
                                <div className="text-xs space-y-1">
                                  <div className="flex items-center">
                                    <Users className="w-3 h-3 mr-1" />
                                    {session.instructor}
                                  </div>
                                  <div className="flex items-center">
                                    <MapPin className="w-3 h-3 mr-1" />
                                    {session.room}
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span>{session.group}</span>
                                    <Badge variant={session.type === "Lecture" ? "default" : "secondary"} className="text-xs">
                                      {session.type}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="h-24 border-2 border-dashed border-muted rounded-lg flex items-center justify-center text-muted-foreground hover:border-primary/50 transition-colors">
                                <span className="text-xs">متاح</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </>
                  ))}
                </div>
              </div>

              {/* عرض الجوال */}
              <div className="md:hidden space-y-4">
                {weekDays.map(day => (
                  <div key={day} className="space-y-2">
                    <h3 className="font-semibold text-lg">{day}</h3>
                    <div className="space-y-2">
                      {timeSlots.map(time => {
                        const session = currentTimetable[day]?.[time];
                        return session ? (
                          <div key={time} className={`p-3 rounded-lg shadow-md border-2 ${
                            session.conflict 
                              ? 'bg-destructive/10 border-destructive' 
                              : 'bg-card border-primary'
                          }`}>
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-semibold">{session.course}</span>
                              <Badge variant={session.type === "Lecture" ? "default" : "secondary"}>
                                {session.type}
                              </Badge>
                            </div>
                            <div className="text-sm space-y-1">
                              <div>🕐 {time}</div>
                              <div>👨‍🏫 {session.instructor}</div>
                              <div>📍 {session.room}</div>
                              <div>👥 {session.group}</div>
                            </div>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}