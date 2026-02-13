import React, { useEffect, useState, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { usePermission } from "@/hooks/usePermission";

type ApiBuilding = {
  building_id: number;
  building_name: string;
  floors_count: number;
  college_id: number;
};

type Building = {
  id: string;
  name: string;
  floorCount: number;
  collegeId: string;
};

type ApiClassroom = {
  classroom_id: number;
  classroom_name: string;
  building_id: number;
  floor: number | null;
  capacity: number;
  latitude: number | null;
  longitude: number | null;
  allowed_distance: number | null;
  classroom_type: number; // 0: CLASSROOM, 1: LAB
};

interface Classroom {
  id: string;
  name: string;
  type: "CLASSROOM" | "LAB";
  capacity: number;
  floor: number | null;
  latitude?: number | null;
  longitude?: number | null;
  allowedDistance?: number | null;
  buildingId: string;
}

type ClassroomFormData = {
  name: string;
  type: "CLASSROOM" | "LAB";
  capacity: number;
  floor: number;
  latitude: string | number | "";
  longitude: string | number | "";
  allowedDistance: string | number | "";
};

interface Props {
  collegeId: string;
}

const typeIntToStr = (v: number): "CLASSROOM" | "LAB" => (v === 1 ? "LAB" : "CLASSROOM");
const typeStrToInt = (v: "CLASSROOM" | "LAB"): number => (v === "LAB" ? 1 : 0);

// دالة تجلب إحداثيات دقيقة قدر الإمكان مع تحسين تدريجي حتى نصل لدقة الهدف
function getPreciseLocation(
  targetAccuracy = 10,
  maxWaitMs = 30000
): Promise<{ lat: number; lng: number; accuracy: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("المتصفح لا يدعم تحديد الموقع"));
      return;
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: maxWaitMs,
    };

    let best: GeolocationPosition | null = null;
    let settled = false;
    let watchId: number | null = null;

    const cleanup = () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      clearTimeout(timerId);
    };

    const finish = (pos: GeolocationPosition) => {
      const lat = Number(pos.coords.latitude.toFixed(7));
      const lng = Number(pos.coords.longitude.toFixed(7));
      const accuracy = Math.round(pos.coords.accuracy ?? 9999);
      resolve({ lat, lng, accuracy });
    };

    const onSuccess = (pos: GeolocationPosition) => {
      const acc = pos.coords.accuracy ?? 9999;
      if (!best || acc < (best.coords.accuracy ?? 9999)) best = pos;
      if (acc <= targetAccuracy && !settled) {
        settled = true;
        cleanup();
        finish(best!);
      }
    };

    const onError = () => {
      if (!settled) {
        settled = true;
        cleanup();
        if (best) finish(best);
        else reject(new Error("تعذّر تحديد الموقع"));
      }
    };

    const timerId = window.setTimeout(() => {
      if (!settled) {
        settled = true;
        cleanup();
        if (best) finish(best);
        else reject(new Error("انتهى وقت تحديد الموقع"));
      }
    }, maxWaitMs);

    navigator.geolocation.getCurrentPosition(onSuccess, () => {}, options);
    watchId = navigator.geolocation.watchPosition(onSuccess, onError, options);
  });
}

export default function ClassroomsModule({ collegeId }: Props) {
  const { can } = usePermission();
  const { toast } = useToast();
  const lastAccuracyRef = useRef<number>(Infinity);
  // Buildings
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);

  

  // Building form (جديد)
  const [isBuildingFormOpen, setIsBuildingFormOpen] = useState(false);
  const [buildingFormData, setBuildingFormData] = useState<{ name: string; floorCount: number }>({
    name: "",
    floorCount: 1,
  });

  // Classrooms
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);

  // Classroom form
  const [isClassroomFormOpen, setIsClassroomFormOpen] = useState(false);
  const [editingClassroomId, setEditingClassroomId] = useState<string | null>(null);
  const [classroomFormData, setClassroomFormData] = useState<ClassroomFormData>({
    name: "",
    type: "CLASSROOM",
    capacity: 30,
    floor: 0,
    latitude: "",
    longitude: "",
    allowedDistance: "",
  });

  // Fetch buildings for selected college
  const fetchBuildings = async () => {
    try {
      const res = await api.get("/v1/buildings", { params: { college_id: collegeId } });
      const raw: ApiBuilding[] = res.data?.data ?? res.data;
      const mapped: Building[] = raw.map((b) => ({
        id: String(b.building_id),
        name: b.building_name,
        floorCount: b.floors_count,
        collegeId: String(b.college_id),
      }));
      setBuildings(mapped);
    } catch {
      toast({ title: "خطأ", description: "فشل تحميل المباني", variant: "destructive" });
    }
  };

  // Fetch classrooms for selected building
  const fetchClassrooms = async (buildingId: string) => {
    try {
      const res = await api.get("/v1/classrooms", { params: { building_id: Number(buildingId) } });
      const raw: ApiClassroom[] = res.data?.data ?? res.data;
      const mapped: Classroom[] = raw.map((c) => ({
        id: String(c.classroom_id),
        name: c.classroom_name,
        type: typeIntToStr(c.classroom_type),
        capacity: c.capacity,
        floor: c.floor ?? 0,
        latitude: c.latitude,
        longitude: c.longitude,
        allowedDistance: c.allowed_distance,
        buildingId: String(c.building_id),
      }));
      setClassrooms(mapped);
    } catch {
      toast({ title: "خطأ", description: "فشل تحميل القاعات", variant: "destructive" });
    }
  };

  // Effects
  useEffect(() => {
    if (!collegeId) return;
    setSelectedBuilding(null);
    setClassrooms([]);
    fetchBuildings();
  }, [collegeId]);

  // Handlers
  const onSelectBuilding = async (b: Building) => {
    setSelectedBuilding(b);
    setIsClassroomFormOpen(false);
    setEditingClassroomId(null);
    setClassroomFormData({
      name: "",
      type: "CLASSROOM",
      capacity: 30,
      floor: 0,
      latitude: "",
      longitude: "",
      allowedDistance: "",
    });
    await fetchClassrooms(b.id);
  };

  // إنشاء مبنى (جديد)
  const handleAddBuilding = () => {
    setIsBuildingFormOpen(true);
    setBuildingFormData({ name: "", floorCount: 1 });
  };

  const handleSubmitBuilding = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        building_name: buildingFormData.name,
        floors_count: Number(buildingFormData.floorCount || 1),
        college_id: Number(collegeId),
      };
      const res = await api.post("/v1/buildings", payload);
      const b: ApiBuilding = res.data?.data ?? res.data;

      const mapped: Building = {
        id: String(b.building_id),
        name: b.building_name,
        floorCount: b.floors_count,
        collegeId: String(b.college_id),
      };

      // حدّث القائمة وحدد المبنى الجديد مباشرة
      setBuildings((prev) => [mapped, ...prev]);
      setSelectedBuilding(mapped);
      setIsBuildingFormOpen(false);
      toast({ title: "نجاح", description: "تم إنشاء المبنى" });

      // تحميل القاعات الخاصة بالمبنى الجديد (فارغة غالبًا)
      await fetchClassrooms(mapped.id);
    } catch (error: any) {
      const err = error?.response?.data?.errors || error?.response?.data?.message || "فشل حفظ المبنى";
      const msg = typeof err === "string" ? err : Object.values(err)?.[0]?.[0] || "فشل حفظ المبنى";
      toast({ title: "خطأ", description: String(msg), variant: "destructive" });
    }
  };

  // Classrooms
const handleAddClassroom = () => {
  if (!selectedBuilding) {
    toast({ title: "تنبيه", description: "اختر مبنى أولاً لإضافة قاعة", variant: "destructive" });
    return;
  }

  setEditingClassroomId(null);
  setClassroomFormData({
    name: "",
    type: "CLASSROOM",
    capacity: 30,
    floor: 0,
    latitude: "",
    longitude: "",
    allowedDistance: "",
  });
  setIsClassroomFormOpen(true);

  if (!navigator.geolocation) {
    toast({ title: "تنبيه", description: "المتصفح لا يدعم تحديد الموقع", variant: "destructive" });
    return;
  }

  // محاولة سريعة لعرض إحداثيات فورية
  const quickOptions: PositionOptions = { enableHighAccuracy: true, maximumAge: 0, timeout: 8000 };
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const lat = Number(pos.coords.latitude.toFixed(7));
      const lng = Number(pos.coords.longitude.toFixed(7));
      const acc = Math.round(pos.coords.accuracy ?? 9999);
      lastAccuracyRef.current = acc;

      setClassroomFormData((prev) => ({
        ...prev,
        latitude: prev.latitude || lat,
        longitude: prev.longitude || lng,
      }));

      // تحسين الدقة تدريجيًا
      getPreciseLocation(10, 30000)
        .then(({ lat: pLat, lng: pLng, accuracy }) => {
          if (accuracy < (lastAccuracyRef.current ?? Infinity)) {
            lastAccuracyRef.current = accuracy;
            setClassroomFormData((prev) => ({
              ...prev,
              latitude: pLat,
              longitude: pLng,
            }));
            // toast({ title: "تم تحسين الدقة", description: `الدقة ≈ ${accuracy}م`, variant: "default" });
          }
        })
        .catch(() => {
          // تجاهل أو أعرض تنبيه خفيف
        });
    },
    (err) => {
      const map: Record<number, string> = {
        1: "تم رفض الإذن للوصول للموقع",
        2: "تعذّر الحصول على موقع الجهاز",
        3: "انتهت مهلة تحديد الموقع",
      };
      toast({ title: "تعذّر تحديد الموقع", description: map[err.code] || "تحقق من إعدادات الموقع وGPS", variant: "destructive" });
    },
    quickOptions
  );
};
  const handleSubmitClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBuilding) {
      toast({ title: "تنبيه", description: "يرجى اختيار مبنى أولاً", variant: "destructive" });
      return;
    }

    try {
      const payload = {
        classroom_name: classroomFormData.name,
        building_id: Number(selectedBuilding.id),
        floor: Number(classroomFormData.floor || 0),
        capacity: Number(classroomFormData.capacity || 0),
        latitude:
          classroomFormData.latitude === "" || classroomFormData.latitude === null
            ? null
            : Number(classroomFormData.latitude),
        longitude:
          classroomFormData.longitude === "" || classroomFormData.longitude === null
            ? null
            : Number(classroomFormData.longitude),
        allowed_distance:
          classroomFormData.allowedDistance === "" || classroomFormData.allowedDistance === null
            ? null
            : Number(classroomFormData.allowedDistance),
        classroom_type: typeStrToInt(classroomFormData.type),
      };

      if (editingClassroomId) {
        await api.put(`/v1/classrooms/${editingClassroomId}`, payload);
        toast({ title: "نجاح", description: "تم تعديل القاعة" });
      } else {
        await api.post("/v1/classrooms", payload);
        toast({ title: "نجاح", description: "تم إنشاء القاعة" });
      }

      setIsClassroomFormOpen(false);
      setEditingClassroomId(null);
      await fetchClassrooms(selectedBuilding.id);
    } catch (error: any) {
      const err =
        error?.response?.data?.errors ||
        error?.response?.data?.message ||
        "فشل حفظ القاعة";
      const msg =
        typeof err === "string"
          ? err
          : Object.values(err)?.[0]?.[0] || "فشل حفظ القاعة";
      toast({ title: "خطأ", description: String(msg), variant: "destructive" });
    }
  };

  const handleDeleteClassroom = async (id: string) => {
    if (!selectedBuilding) return;
    if (!confirm("هل تريد حذف هذه القاعة؟")) return;

    try {
      await api.delete(`/v1/classrooms/${id}`);
      toast({ title: "نجاح", description: "تم حذف القاعة" });
      await fetchClassrooms(selectedBuilding.id);
    } catch (error: any) {
      const msg = error?.response?.data?.message || "فشل حذف القاعة";
      toast({ title: "خطأ", description: msg, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">القاعات الدراسية</h2>
        {can('locations.create') && (
          <Button onClick={handleAddClassroom} disabled={!selectedBuilding}>
            <Plus className="w-4 h-4 mr-2" />
            إضافة قاعة
          </Button>
        )}
      </div>

      {/* Buildings grid */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>اختر مبنى</CardTitle>
            {can('locations.create') && (
              <Button variant="outline" onClick={handleAddBuilding}>
                <Plus className="w-4 h-4 ml-2" />
                إضافة مبنى
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Building form (جديد) */}
          {isBuildingFormOpen && (
            <div className="mb-4">
              <form onSubmit={handleSubmitBuilding} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label>اسم المبنى *</Label>
                  <Input
                    value={buildingFormData.name}
                    onChange={(e) => setBuildingFormData({ ...buildingFormData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>عدد الأدوار *</Label>
                  <Input
                    type="number"
                    min={1}
                    value={buildingFormData.floorCount}
                    onChange={(e) => setBuildingFormData({ ...buildingFormData, floorCount: parseInt(e.target.value || "1") })}
                    required
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button type="submit">حفظ</Button>
                  <Button type="button" variant="outline" onClick={() => setIsBuildingFormOpen(false)}>
                    إلغاء
                  </Button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {buildings.map((b) => (
              <Card
                key={b.id}
                className={cn("cursor-pointer", selectedBuilding?.id === b.id && "border-primary")}
                onClick={() => onSelectBuilding(b)}
              >
                <CardContent className="pt-6">
                  <div className="flex justify-between">
                    <span className="font-semibold">{b.name}</span>
                    <span className="text-sm text-muted-foreground">الأدوار: {b.floorCount}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
            {buildings.length === 0 && (
              <div className="text-sm text-muted-foreground">لا توجد مبانٍ لهذه الكلية</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Classroom form */}
      {isClassroomFormOpen && (
        <Card>
          <CardHeader>
            <CardTitle>{editingClassroomId ? "تعديل قاعة" : "إضافة قاعة جديدة"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitClassroom} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>الاسم *</Label>
                  <Input
                    value={classroomFormData.name}
                    onChange={(e) => setClassroomFormData({ ...classroomFormData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>النوع *</Label>
                  <Select
                    value={classroomFormData.type}
                    onValueChange={(value: "CLASSROOM" | "LAB") =>
                      setClassroomFormData({ ...classroomFormData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CLASSROOM">قاعة</SelectItem>
                      <SelectItem value="LAB">معمل</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>السعة *</Label>
                  <Input
                    type="number"
                    min={1}
                    value={classroomFormData.capacity}
                    onChange={(e) =>
                      setClassroomFormData({ ...classroomFormData, capacity: parseInt(e.target.value || "0") })
                    }
                    required
                  />
                </div>
                <div>
                  <Label>الدور</Label>
                  <Input
                    type="number"
                    min={0}
                    value={classroomFormData.floor}
                    onChange={(e) =>
                      setClassroomFormData({ ...classroomFormData, floor: parseInt(e.target.value || "0") })
                    }
                  />
                </div>
                <div>
                  <Label>خط العرض (Latitude)</Label>
                  <Input
                    type="number"
                    step="0.0000001"
                    value={classroomFormData.latitude}
                    onChange={(e) => setClassroomFormData({ ...classroomFormData, latitude: e.target.value })}
                  />
                </div>
                <div>
                  <Label>خط الطول (Longitude)</Label>
                  <Input
                    type="number"
                    step="0.0000001"
                    value={classroomFormData.longitude}
                    onChange={(e) => setClassroomFormData({ ...classroomFormData, longitude: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>المسافة المسموحة (متر)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={classroomFormData.allowedDistance}
                    onChange={(e) => setClassroomFormData({ ...classroomFormData, allowedDistance: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={!selectedBuilding}>
                  حفظ
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsClassroomFormOpen(false)}>
                  إلغاء
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Classrooms table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>السعة</TableHead>
                <TableHead>الدور</TableHead>
                <TableHead>الإحداثيات</TableHead>
                <TableHead>المسافة المسموحة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classrooms.map((classroom) => (
                <TableRow key={classroom.id}>
                  <TableCell className="font-medium">{classroom.name}</TableCell>
                  <TableCell>{classroom.type === "CLASSROOM" ? "قاعة" : "معمل"}</TableCell>
                  <TableCell>{classroom.capacity}</TableCell>
                  <TableCell>{classroom.floor ?? 0}</TableCell>
                  <TableCell>
                    {classroom.latitude && classroom.longitude ? `${classroom.latitude}, ${classroom.longitude}` : "-"}
                  </TableCell>
                  <TableCell>{classroom.allowedDistance ?? "-"}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {can('locations.update') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setIsClassroomFormOpen(true);
                            setEditingClassroomId(classroom.id);
                            setClassroomFormData({
                              name: classroom.name,
                              type: classroom.type,
                              capacity: classroom.capacity,
                              floor: classroom.floor ?? 0,
                              latitude: classroom.latitude ?? "",
                              longitude: classroom.longitude ?? "",
                              allowedDistance: classroom.allowedDistance ?? "",
                            });
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      )}
                      {can('locations.delete') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            await handleDeleteClassroom(classroom.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {selectedBuilding && classrooms.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    لا توجد قاعات لهذا المبنى
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}