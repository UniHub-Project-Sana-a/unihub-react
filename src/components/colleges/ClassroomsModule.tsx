import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Building } from "@/services/buildings";

interface Classroom {
  id: string;
  name: string;
  type: "CLASSROOM" | "LAB";
  capacity: number;
  floor: number;
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
  buildings: Building[];
  selectedBuilding: Building | null;
  onSelectBuilding: (b: Building) => void | Promise<void>;
  classrooms: Classroom[];

  isClassroomFormOpen: boolean;
  editingClassroomId: string | null;
  classroomFormData: ClassroomFormData;
  setIsClassroomFormOpen: (v: boolean) => void;
  setEditingClassroomId: (v: string | null) => void;
  setClassroomFormData: (v: ClassroomFormData) => void;

  handleAddClassroom: () => void;
  handleDeleteClassroom: (id: string) => void | Promise<void>;
  handleSubmitClassroom: (e: React.FormEvent) => void | Promise<void>;
}

const ClassroomsModule: React.FC<Props> = ({
  buildings,
  selectedBuilding,
  onSelectBuilding,
  classrooms,

  isClassroomFormOpen,
  editingClassroomId,
  classroomFormData,
  setIsClassroomFormOpen,
  setEditingClassroomId,
  setClassroomFormData,

  handleAddClassroom,
  handleDeleteClassroom,
  handleSubmitClassroom,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">القاعات الدراسية</h2>
        <Button onClick={handleAddClassroom}>
          <Plus className="w-4 h-4 mr-2" />
          إضافة قاعة
        </Button>
      </div>

      {/* Buildings grid */}
      <Card>
        <CardHeader>
          <CardTitle>اختر مبنى</CardTitle>
        </CardHeader>
        <CardContent>
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
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          await handleDeleteClassroom(classroom.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
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
};

export default ClassroomsModule;