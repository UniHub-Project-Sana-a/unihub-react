import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// التعديل 1: تم تعديل استيراد TableIcon لتجنب الخطأ
import { Settings, Database, Filter, Download, BarChart3, Table as TableIcon } from "lucide-react";

const dataSources = [
  { id: "students", name: "الطلاب", description: "بيانات الطلاب والتسجيل" },
  { id: "courses", name: "المقررات", description: "تفاصيل المقررات والجداول" },
  { id: "attendance", name: "الحضور", description: "سجلات حضور الطلاب" },
  { id: "grades", name: "الدرجات", description: "درجات الطلاب والتقييمات" },
  { id: "instructors", name: "المحاضرون", description: "بيانات المحاضرين والتكليفات" },
  { id: "excuses", name: "الأعذار", description: "طلبات الأعذار والموافقات" }
];

const availableFields = {
  students: [
    { id: "student_id", name: "الرقم الجامعي", type: "text" },
    { id: "student_name", name: "اسم الطالب", type: "text" },
    { id: "email", name: "البريد الإلكتروني", type: "text" },
    { id: "enrollment_date", name: "تاريخ التسجيل", type: "date" },
    { id: "gpa", name: "المعدل التراكمي", type: "number" },
    { id: "academic_standing", name: "الحالة الأكاديمية", type: "text" }
  ],
  courses: [
    { id: "course_code", name: "رمز المقرر", type: "text" },
    { id: "course_name", name: "اسم المقرر", type: "text" },
    { id: "instructor", name: "المحاضر", type: "text" },
    { id: "credits", name: "الساعات المعتمدة", type: "number" },
    { id: "schedule", name: "الجدول", type: "text" }
  ],
  attendance: [
    { id: "student_id", name: "الرقم الجامعي", type: "text" },
    { id: "course_code", name: "رمز المقرر", type: "text" },
    { id: "attendance_rate", name: "نسبة الحضور", type: "number" },
    { id: "sessions_attended", name: "جلسات الحضور", type: "number" },
    { id: "total_sessions", name: "إجمالي الجلسات", type: "number" }
  ],
  grades: [
    { id: "student_id", name: "الرقم الجامعي", type: "text" },
    { id: "course_code", name: "رمز المقرر", type: "text" },
    { id: "grade", name: "الدرجة", type: "text" },
    { id: "points", name: "النقاط", type: "number" },
    { id: "status", name: "حالة النجاح/الرسوب", type: "text" }
  ],
  instructors: [
    { id: "instructor_id", name: "رقم المحاضر", type: "text" },
    { id: "instructor_name", name: "اسم المحاضر", type: "text" },
    { id: "department", name: "القسم", type: "text" },
    { id: "hourly_rate", name: "الأجر بالساعة", type: "number" },
    { id: "total_sessions", name: "إجمالي الجلسات", type: "number" }
  ],
  excuses: [
    { id: "excuse_id", name: "رقم العذر", type: "text" },
    { id: "instructor_id", name: "رقم المحاضر", type: "text" },
    { id: "excuse_type", name: "نوع العذر", type: "text" },
    { id: "status", name: "الحالة", type: "text" },
    { id: "salary_impact", name: "تأثير على الراتب", type: "number" }
  ]
};

export function CustomReportBuilder() {
  const [selectedDataSource, setSelectedDataSource] = useState("");
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [filters, setFilters] = useState<Array<{field: string, operator: string, value: string}>>([]);
  const [outputFormat, setOutputFormat] = useState("table");
  const [reportName, setReportName] = useState("");

  const handleFieldToggle = (fieldId: string, checked: boolean) => {
    if (checked) {
      setSelectedFields([...selectedFields, fieldId]);
    } else {
      setSelectedFields(selectedFields.filter(id => id !== fieldId));
    }
  };

  const addFilter = () => {
    setFilters([...filters, { field: "", operator: "equals", value: "" }]);
  };

  const updateFilter = (index: number, field: string, value: string) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], [field]: value };
    setFilters(newFilters);
  };

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const generateReport = () => {
    console.log("Generating report with:", {
      dataSource: selectedDataSource,
      fields: selectedFields,
      filters,
      outputFormat,
      reportName
    });
  };

  const currentFields = selectedDataSource ? availableFields[selectedDataSource as keyof typeof availableFields] || [] : [];

  return (
    <div className="space-y-6">
      <Card className="shadow-xl bg-white">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <span>منشئ التقارير المخصصة</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <Label className="text-base font-medium">اسم التقرير</Label>
              <Input
                placeholder="أدخل اسم التقرير..."
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                className="mt-2"
              />
            </div>

            <Tabs defaultValue="datasource" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="datasource" className="flex items-center space-x-2">
                  <Database className="w-4 h-4" />
                  <span>مصدر البيانات</span>
                </TabsTrigger>
                <TabsTrigger value="fields" className="flex items-center space-x-2">
                  <TableIcon className="w-4 h-4" />
                  <span>الحقول</span>
                </TabsTrigger>
                <TabsTrigger value="filters" className="flex items-center space-x-2">
                  <Filter className="w-4 h-4" />
                  <span>المرشحات</span>
                </TabsTrigger>
                <TabsTrigger value="output" className="flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4" />
                  <span>المخرجات</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="datasource" className="space-y-4">
                <div>
                  <Label className="text-base font-medium">اختر مصدر البيانات</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    {dataSources.map((source) => (
                      <Card
                        key={source.id}
                        className={`cursor-pointer transition-all ${
                          selectedDataSource === source.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => setSelectedDataSource(source.id)}
                      >
                        <CardContent className="p-4">
                          <h3 className="font-medium text-gray-900">{source.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{source.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="fields" className="space-y-4">
                <div>
                  <Label className="text-base font-medium">اختر الحقول المراد تضمينها</Label>
                  {selectedDataSource ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {currentFields.map((field) => (
                        <div key={field.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                          <Checkbox
                            checked={selectedFields.includes(field.id)}
                            onCheckedChange={(checked) => handleFieldToggle(field.id, checked as boolean)}
                          />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{field.name}</p>
                            <Badge variant="outline" className="text-xs">
                              {field.type}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      يرجى اختيار مصدر بيانات أولاً
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="filters" className="space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">تطبيق المرشحات</Label>
                    <Button onClick={addFilter} variant="outline" size="sm">
                      إضافة مرشح
                    </Button>
                  </div>
                  
                  {filters.length > 0 ? (
                    <div className="space-y-3">
                      {filters.map((filter, index) => (
                        <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                          <Select
                            value={filter.field}
                            onValueChange={(value) => updateFilter(index, "field", value)}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue placeholder="الحقل" />
                            </SelectTrigger>
                            <SelectContent>
                              {currentFields.map((field) => (
                                <SelectItem key={field.id} value={field.id}>
                                  {field.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          <Select
                            value={filter.operator}
                            onValueChange={(value) => updateFilter(index, "operator", value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="equals">يساوي</SelectItem>
                              <SelectItem value="contains">يحتوي</SelectItem>
                              <SelectItem value="greater">أكبر من</SelectItem>
                              <SelectItem value="less">أقل من</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <Input
                            placeholder="القيمة"
                            value={filter.value}
                            onChange={(e) => updateFilter(index, "value", e.target.value)}
                            className="flex-1"
                          />
                          
                          <Button
                            onClick={() => removeFilter(index)}
                            variant="outline"
                            size="sm"
                          >
                            إزالة
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      لا توجد مرشحات مطبّقة. انقر "إضافة مرشح" لإضافة مرشحات.
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="output" className="space-y-4">
                <div>
                  <Label className="text-base font-medium">صيغة المخرجات</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    {[
                      { id: "table", name: "عرض جدولي", icon: TableIcon },
                      { id: "chart", name: "مخطط/رسم بياني", icon: BarChart3 },
                      { id: "csv", name: "تصدير CSV", icon: Download },
                      { id: "pdf", name: "تقرير PDF", icon: Download }
                    ].map((format) => (
                      <Card
                        key={format.id}
                        className={`cursor-pointer transition-all ${
                          outputFormat === format.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => setOutputFormat(format.id)}
                      >
                        <CardContent className="p-4 text-center">
                          <format.icon className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                          <p className="font-medium text-gray-900">{format.name}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex items-center justify-between pt-6 border-t">
              <div className="text-sm text-gray-600">
                {selectedFields.length > 0 && (
                  <span>تم اختيار {selectedFields.length} حقل من {selectedDataSource}</span>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <Button variant="outline">حفظ القالب</Button>
                <Button
                  onClick={generateReport}
                  disabled={!selectedDataSource || selectedFields.length === 0 || !reportName}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  إنشاء التقرير
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* قسم المعاينة */}
      {selectedFields.length > 0 && (
        <Card className="shadow-xl bg-white">
          <CardHeader>
            <CardTitle>معاينة التقرير</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              {/* التعديل 2: تم إصلاح الخطأ المتعلق بقوس/اقتباس ناقص */}
              <h3 className="font-medium text-gray-900">التقرير: {reportName || "تقرير بدون عنوان"}</h3> 
              <p className="text-sm text-gray-600">
                مصدر البيانات: {dataSources.find(s => s.id === selectedDataSource)?.name}
              </p>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  {selectedFields.map((fieldId) => {
                    const field = currentFields.find(f => f.id === fieldId);
                    return (
                      <TableHead key={fieldId}>{field?.name}</TableHead>
                    );
                  })}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  {selectedFields.map((fieldId) => (
                    <TableCell key={fieldId} className="text-gray-500 italic">
                      بيانات تجريبية
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}