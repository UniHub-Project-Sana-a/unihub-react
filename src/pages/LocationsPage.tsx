import React, { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Building2, MapPin, Plus, FileJson, Search, Filter, RefreshCw, Layers, ArrowLeftRight, CheckCircle2, Trash2, Monitor, Projector, Tv } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import JsonImportModal from "@/components/colleges/JsonImportModal";
import { usePermission } from "@/hooks/usePermission";

interface Building {
  building_id: number;
  building_name: string;
  building_code: string | null;
  floors_count: number;
  college_id: number | null;
  classrooms_count?: number;
  colleges?: { college_id: number; college_name: string }[];
}

interface Classroom {
  classroom_id: number;
  classroom_name: string;
  building_id: number;
  college_id: number | null;
  floor: number | null;
  capacity: number;
  classroom_type: number;
  windows_count?: number | null;
  has_computer?: boolean;
  display_type?: "none" | "screen" | "projector" | "smart_board";
  notes?: string | null;
  location_address?: string | null;
  remote_id?: string | null;
  building?: { building_name: string; building_code: string | null };
  college?: { college_name: string };
}

interface College {
  college_id: number;
  college_name: string;
}

export default function LocationsPage() {
  const { toast } = useToast();
  const { can } = usePermission();

  const [activeTab, setActiveTab] = useState("buildings");
  const [isLoading, setIsLoading] = useState(false);

  // Data
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBuildingFilter, setSelectedBuildingFilter] = useState<string>("all");
  const [selectedCollegeFilter, setSelectedCollegeFilter] = useState<string>("all");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("all");

  // Modals
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isBuildingModalOpen, setIsBuildingModalOpen] = useState(false);
  const [buildingFormData, setBuildingFormData] = useState({ name: "", code: "", floorsCount: 1, collegeId: "none" });

  // Reallocate Classroom Dialog
  const [reallocatingRoom, setReallocatingRoom] = useState<Classroom | null>(null);
  const [targetCollegeId, setTargetCollegeId] = useState<string>("");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [bRes, cRes, colRes] = await Promise.all([
        api.get("/v1/buildings"),
        api.get("/v1/classrooms?all=true"),
        api.get("/v1/colleges"),
      ]);

      const rawBuildings: Building[] = bRes.data?.data ?? bRes.data ?? [];
      const rawClassrooms: Classroom[] = cRes.data?.data ?? cRes.data ?? [];
      const rawColleges: College[] = colRes.data?.data ?? colRes.data ?? [];

      setBuildings(rawBuildings);
      setClassrooms(rawClassrooms);
      setColleges(rawColleges);
    } catch {
      toast({ title: "خطأ", description: "فشل تحميل بيانات المباني والقاعات", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handlers
  const handleCreateBuilding = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        building_name: buildingFormData.name,
        building_code: buildingFormData.code || buildingFormData.name,
        floors_count: Number(buildingFormData.floorsCount || 1),
      };
      if (buildingFormData.collegeId !== "none") {
        payload.college_id = Number(buildingFormData.collegeId);
      }

      await api.post("/v1/buildings", payload);
      toast({ title: "نجاح", description: "تم تسجيل المبنى العام للحرم الجامعي بنجاح" });
      setIsBuildingModalOpen(false);
      setBuildingFormData({ name: "", code: "", floorsCount: 1, collegeId: "none" });
      fetchData();
    } catch (error: any) {
      const err = error?.response?.data?.message || "فشل حفظ المبنى";
      toast({ title: "خطأ", description: String(err), variant: "destructive" });
    }
  };

  // Delete States
  const [deletingBuilding, setDeletingBuilding] = useState<Building | null>(null);
  const [isDeletingBuilding, setIsDeletingBuilding] = useState(false);
  const [deletingClassroom, setDeletingClassroom] = useState<Classroom | null>(null);
  const [isDeletingClassroom, setIsDeletingClassroom] = useState(false);

  const handleConfirmDeleteBuilding = async () => {
    if (!deletingBuilding) return;
    setIsDeletingBuilding(true);
    try {
      await api.delete(`/v1/buildings/${deletingBuilding.building_id}`);
      toast({ title: "نجاح الحذف", description: `تم حذف المبنى (${deletingBuilding.building_name}) بنجاح.` });
      setDeletingBuilding(null);
      fetchData();
    } catch (error: any) {
      const msg = error?.response?.data?.message || "فشل حذف المبنى، قد يكون يحتوي على قاعات مرتبطة به.";
      toast({ title: "تعذر الحذف", description: String(msg), variant: "destructive" });
    } finally {
      setIsDeletingBuilding(false);
    }
  };

  const handleConfirmDeleteClassroom = async () => {
    if (!deletingClassroom) return;
    setIsDeletingClassroom(true);
    try {
      await api.delete(`/v1/classrooms/${deletingClassroom.classroom_id}`);
      toast({ title: "نجاح الحذف", description: `تم حذف القاعة (${deletingClassroom.classroom_name}) بنجاح.` });
      setDeletingClassroom(null);
      fetchData();
    } catch (error: any) {
      const msg = error?.response?.data?.message || "فشل حذف القاعة.";
      toast({ title: "خطأ في الحذف", description: String(msg), variant: "destructive" });
    } finally {
      setIsDeletingClassroom(false);
    }
  };

  const handleConfirmReallocate = async () => {
    if (!reallocatingRoom || targetCollegeId === "") return;
    try {
      await api.put(`/v1/classrooms/${reallocatingRoom.classroom_id}`, {
        classroom_name: reallocatingRoom.classroom_name,
        building_id: reallocatingRoom.building_id,
        college_id: targetCollegeId === "none" ? null : Number(targetCollegeId),
      });

      toast({ title: "نجاح التخصيص", description: `تم نقل تبعية قاعة (${reallocatingRoom.classroom_name}) بنجاح.` });
      setReallocatingRoom(null);
      await fetchData();
    } catch (error: any) {
      const msg = error?.response?.data?.message || "فشل إعادة نقل تبعية القاعة";
      toast({ title: "خطأ", description: String(msg), variant: "destructive" });
    }
  };

  // Filtered Classrooms
  const filteredClassrooms = classrooms.filter((item) => {
    const matchesSearch = (item.classroom_name || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBuilding = selectedBuildingFilter === "all" || String(item.building_id) === selectedBuildingFilter;
    const matchesCollege = selectedCollegeFilter === "all" || String(item.college_id) === selectedCollegeFilter;
    const matchesType = selectedTypeFilter === "all" || String(item.classroom_type) === selectedTypeFilter;
    return matchesSearch && matchesBuilding && matchesCollege && matchesType;
  });

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-2xl border shadow-sm">
          <div>
            <h1 className="text-2xl font-extrabold flex items-center gap-2">
              <Building2 className="w-7 h-7 text-primary" />
              إدارة المباني والقاعات المركزية
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              منظومة حوكمة الحرم الجامعي الموحدة لإدارة المباني وتخصيص المساحات ومزامنة بيانات الموبايل الميدانية.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="gap-2 border-primary/30 hover:bg-primary/5"
              onClick={() => setIsImportModalOpen(true)}
            >
              <FileJson className="w-4 h-4 text-primary" />
              استيراد ملف JSON الميداني
            </Button>
            <Button className="gap-2" onClick={() => setIsBuildingModalOpen(true)}>
              <Plus className="w-4 h-4" />
              إضافة مبنى عام
            </Button>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 bg-muted/40 p-1.5 rounded-xl border max-w-xl">
            <TabsTrigger value="buildings" className="gap-2">
              <Building2 className="w-4 h-4" />
              سجل المباني العامة
            </TabsTrigger>
            <TabsTrigger value="classrooms" className="gap-2">
              <Layers className="w-4 h-4" />
              مستودع القاعات وتخصيصها
            </TabsTrigger>
            <TabsTrigger value="sync" className="gap-2">
              <FileJson className="w-4 h-4" />
              بوابة المزامنة الميدانية
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: CAMPUS BUILDINGS REGISTRY */}
          <TabsContent value="buildings" className="mt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {buildings.map((bld) => {
                const roomCount = classrooms.filter((c) => c.building_id === bld.building_id).length;
                const buildingColleges = Array.from(
                  new Set(
                    classrooms
                      .filter((c) => c.building_id === bld.building_id)
                      .map((c) => {
                        if (c.college?.college_name) return c.college.college_name;
                        if (c.college_id) {
                          const foundCol = colleges.find((col) => col.college_id === c.college_id);
                          if (foundCol) return foundCol.college_name;
                        }
                        return null;
                      })
                  )
                ).filter(Boolean) as string[];

                return (
                  <Card key={bld.building_id} className="hover:border-primary/40 transition-all shadow-sm">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base font-bold flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-primary" />
                            {bld.building_name}
                          </CardTitle>
                          <CardDescription className="text-xs mt-1">
                            كود المبنى: <span className="font-semibold text-foreground">{bld.building_code || bld.building_id}</span>
                          </CardDescription>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant="secondary" className="text-xs">
                            {bld.floors_count} أدوار
                          </Badge>
                          {bld.college_id == null && (
                            <Badge variant="outline" className="text-[10px]">عام / مشترك</Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 text-xs">
                      <div className="flex justify-between items-center bg-muted/30 p-2.5 rounded-lg border">
                        <span className="text-muted-foreground">عدد القاعات المجهزة:</span>
                        <span className="font-extrabold text-sm text-primary">{roomCount} قاعة</span>
                      </div>

                      <div>
                        <span className="text-muted-foreground block mb-1.5">الكليات الفاعلة بالمبنى:</span>
                        <div className="flex flex-wrap gap-1">
                          {buildingColleges.length > 0 ? (
                            buildingColleges.map((colName, idx) => (
                              <Badge key={idx} variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[11px]">
                                {colName}
                              </Badge>
                            ))
                          ) : roomCount > 0 ? (
                            <Badge variant="secondary" className="text-[11px]">قاعات عامة مشتركة للجامعة</Badge>
                          ) : (
                            <span className="text-muted-foreground text-[11px]">لا توجد قاعات مسجلة بعد</span>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            setSelectedBuildingFilter(String(bld.building_id));
                            setActiveTab("classrooms");
                          }}
                        >
                          عرض قاعات هذا المبنى
                        </Button>

                        {can('locations.delete') && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10 shrink-0"
                            onClick={() => setDeletingBuilding(bld)}
                            title="حذف المبنى"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {buildings.length === 0 && !isLoading && (
                <div className="col-span-full text-center py-12 text-muted-foreground border-2 border-dashed rounded-2xl">
                  لا توجد مبانٍ مسجلة بالحرم الجامعي بعد.
                </div>
              )}
            </div>
          </TabsContent>

          {/* TAB 2: CLASSROOMS & SPACE ALLOCATION */}
          <TabsContent value="classrooms" className="mt-6 space-y-4">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <CardTitle className="text-lg font-bold">جدول وتخصيص قاعات الحرم الجامعي</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={fetchData} className="gap-1">
                      <RefreshCw className="w-3.5 h-3.5" />
                      تحديث
                    </Button>
                  </div>
                </div>

                {/* Multi-Dimensional Search Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute right-3 top-3 text-muted-foreground" />
                    <Input
                      placeholder="بحث باسم القاعة..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pr-9"
                    />
                  </div>

                  <Select value={selectedBuildingFilter} onValueChange={setSelectedBuildingFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="فلتر المبنى" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">كافة المباني</SelectItem>
                      {buildings.map((b) => (
                        <SelectItem key={b.building_id} value={String(b.building_id)}>
                          {b.building_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedCollegeFilter} onValueChange={setSelectedCollegeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="فلتر الكلية" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">كافة الكليات</SelectItem>
                      {colleges.map((c) => (
                        <SelectItem key={c.college_id} value={String(c.college_id)}>
                          {c.college_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedTypeFilter} onValueChange={setSelectedTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="نوع القاعة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الأنواع</SelectItem>
                      <SelectItem value="0">قاعة دراسية</SelectItem>
                      <SelectItem value="1">معمل</SelectItem>
                      <SelectItem value="2">مدرج</SelectItem>
                      <SelectItem value="3">مكتبة</SelectItem>
                      <SelectItem value="4">ورشة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>

              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>اسم القاعة</TableHead>
                      <TableHead>المبنى المادي</TableHead>
                      <TableHead>الكلية المخصصة</TableHead>
                      <TableHead>النوع</TableHead>
                      <TableHead>السعة / الدور</TableHead>
                      <TableHead>الأصول والموقع</TableHead>
                      <TableHead className="text-left">إعادة التخصيص</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClassrooms.map((room) => {
                      const bld = buildings.find((b) => b.building_id === room.building_id);
                      const col = colleges.find((c) => c.college_id === room.college_id);

                      const typeText =
                        room.classroom_type === 1
                          ? "معمل"
                          : room.classroom_type === 2
                          ? "مدرج"
                          : room.classroom_type === 3
                          ? "مكتبة"
                          : room.classroom_type === 4
                          ? "ورشة"
                          : "قاعة عامة";

                      return (
                        <TableRow key={room.classroom_id}>
                          <TableCell className="font-bold">{room.classroom_name}</TableCell>
                          <TableCell>
                            <span className="inline-flex items-center gap-1">
                              <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                              {bld?.building_name || `مبنى ${room.building_id}`}
                            </span>
                          </TableCell>
                          <TableCell>
                            {col ? (
                              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                                {col.college_name}
                              </Badge>
                            ) : (
                              <Badge variant="secondary">عام / مشترك</Badge>
                            )}
                          </TableCell>
                          <TableCell>{typeText}</TableCell>
                          <TableCell>
                            {room.capacity} طالب (دور {room.floor ?? 0})
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              {room.has_computer && <Monitor className="w-4 h-4 text-primary" aria-label="يوجد حاسوب" />}
                              {room.display_type === "projector" && <Projector className="w-4 h-4 text-primary" />}
                              {room.display_type === "screen" && <Tv className="w-4 h-4 text-primary" />}
                              {!room.has_computer && (!room.display_type || room.display_type === "none") && (
                                <span className="text-xs">-</span>
                              )}
                            </div>
                            {room.location_address && (
                              <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
                                <MapPin className="w-3 h-3" />
                                {room.location_address}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-left">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="gap-1 hover:bg-primary/10 hover:text-primary"
                                onClick={() => {
                                  setReallocatingRoom(room);
                                  setTargetCollegeId(room.college_id ? String(room.college_id) : "none");
                                }}
                              >
                                <ArrowLeftRight className="w-4 h-4" />
                                نقل التبعية
                              </Button>

                              {can('locations.delete') && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                  onClick={() => setDeletingClassroom(room)}
                                  title="حذف القاعة"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}

                    {filteredClassrooms.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          لا توجد قاعات تطابق الفلاتر المحددة.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: JSON IMPORT GATEWAY */}
          <TabsContent value="sync" className="mt-6">
            <Card className="p-6 text-center space-y-4">
              <FileJson className="w-12 h-12 text-primary mx-auto" />
              <h3 className="text-lg font-bold">بوابة استيراد بيانات الموبايل الميدانية</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                انقر على الزر أدناه لسحب وإفلات ملف JSON المصدّر من تطبيق القاعات ومزامنتها فورياً.
              </p>
              <Button size="lg" className="gap-2" onClick={() => setIsImportModalOpen(true)}>
                <FileJson className="w-5 h-5" />
                فتح أداة استيراد الـ JSON
              </Button>
            </Card>
          </TabsContent>
        </Tabs>

        {/* MODAL: Add Campus Building */}
        <Dialog open={isBuildingModalOpen} onOpenChange={setIsBuildingModalOpen}>
          <DialogContent className="max-w-md text-right" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                تسجيل مبنى مادي جديد للحرم الجامعي
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleCreateBuilding} className="space-y-4 py-2">
              <div>
                <Label>اسم المبنى *</Label>
                <Input
                  value={buildingFormData.name}
                  onChange={(e) => setBuildingFormData({ ...buildingFormData, name: e.target.value })}
                  placeholder="مثال: مبنى 9 - القاعات المركزية"
                  required
                />
              </div>

              <div>
                <Label>كود المبنى</Label>
                <Input
                  value={buildingFormData.code}
                  onChange={(e) => setBuildingFormData({ ...buildingFormData, code: e.target.value })}
                  placeholder="مثال: BLD-09"
                />
              </div>

              <div>
                <Label>عدد الأدوار *</Label>
                <Input
                  type="number"
                  min={1}
                  value={buildingFormData.floorsCount}
                  onChange={(e) => setBuildingFormData({ ...buildingFormData, floorsCount: Number(e.target.value || 1) })}
                  required
                />
              </div>

              <div>
                <Label>الكلية الشاغرة الرئيسية (اختياري)</Label>
                <Select
                  value={buildingFormData.collegeId}
                  onValueChange={(val) => setBuildingFormData({ ...buildingFormData, collegeId: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر كلية (أو مبنى عام)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">مبنى مادي عام للحرم الجامعي</SelectItem>
                    {colleges.map((c) => (
                      <SelectItem key={c.college_id} value={String(c.college_id)}>
                        {c.college_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter className="flex-row-reverse justify-start gap-2 pt-2 border-t">
                <Button type="submit">تسجيل المبنى</Button>
                <Button type="button" variant="outline" onClick={() => setIsBuildingModalOpen(false)}>
                  إلغاء
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* MODAL: Reallocate Classroom */}
        <Dialog open={!!reallocatingRoom} onOpenChange={(open) => !open && setReallocatingRoom(null)}>
          <DialogContent className="max-w-md text-right" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-primary" />
                تعديل تخصيص تبعية القاعة
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2 text-sm">
              <div className="bg-muted/40 p-3 rounded-lg border space-y-1">
                <div>
                  القاعة: <strong className="text-primary">{reallocatingRoom?.classroom_name}</strong>
                </div>
                <div className="text-xs text-muted-foreground">
                  المبنى المادي: {buildings.find((b) => b.building_id === reallocatingRoom?.building_id)?.building_name}
                </div>
              </div>

              <div>
                <Label>اختر الكلية الجديدة التابعة لها القاعة إدارياً:</Label>
                <Select value={targetCollegeId} onValueChange={setTargetCollegeId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="اختر الكلية..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">مشتركة / غير مخصصة لكلية</SelectItem>
                    {colleges.map((c) => (
                      <SelectItem key={c.college_id} value={String(c.college_id)}>
                        {c.college_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="flex-row-reverse justify-start gap-2 pt-2 border-t">
              <Button onClick={handleConfirmReallocate}>حفظ التبعية الجديدة</Button>
              <Button variant="outline" onClick={() => setReallocatingRoom(null)}>
                إلغاء
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* JSON Import Modal */}
        <JsonImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onSuccess={fetchData}
        />

        {/* Building Delete Dialog */}
        <AlertDialog open={!!deletingBuilding} onOpenChange={(open) => !open && !isDeletingBuilding && setDeletingBuilding(null)}>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle>تأكيد حذف المبنى العام</AlertDialogTitle>
              <AlertDialogDescription>
                هل أنت تأكد من رغبتك في حذف المبنى <strong className="text-foreground">"{deletingBuilding?.building_name}"</strong>؟
                <br />
                ملاحظة: يمنع النظام حذف المبنى المادي إذا كان يحتوي على قاعات مرتبطة به لضمان سلامة قاعدة البيانات.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-row-reverse justify-start gap-2">
              <Button
                variant="destructive"
                onClick={handleConfirmDeleteBuilding}
                disabled={isDeletingBuilding}
              >
                {isDeletingBuilding ? "جاري الحذف..." : "نعم، احذف المبنى"}
              </Button>
              <AlertDialogCancel disabled={isDeletingBuilding}>إلغاء</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Classroom Delete Dialog */}
        <AlertDialog open={!!deletingClassroom} onOpenChange={(open) => !open && !isDeletingClassroom && setDeletingClassroom(null)}>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle>تأكيد حذف القاعة الدراسية</AlertDialogTitle>
              <AlertDialogDescription>
                هل أنت تأكد من رغبتك في حذف القاعة <strong className="text-foreground">"{deletingClassroom?.classroom_name}"</strong>؟
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-row-reverse justify-start gap-2">
              <Button
                variant="destructive"
                onClick={handleConfirmDeleteClassroom}
                disabled={isDeletingClassroom}
              >
                {isDeletingClassroom ? "جاري الحذف..." : "نعم، احذف القاعة"}
              </Button>
              <AlertDialogCancel disabled={isDeletingClassroom}>إلغاء</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
