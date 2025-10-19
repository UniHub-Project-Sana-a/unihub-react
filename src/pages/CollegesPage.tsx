import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Trash2, Plus, ArrowLeft, ChevronRight, Users, BookOpen, Building2, DollarSign } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// Services
import { getColleges, createCollege, updateCollege, deleteCollege, type College as ApiCollege } from '@/services/colleges';
import { getDepartmentsByCollege, createDepartment, updateDepartment, deleteDepartment, type Department as ApiDepartment } from '@/services/departments';
import { getBuildingsByCollege, type Building } from '@/services/buildings';
import { getClassroomsByBuilding, getClassroomsByCollege, createClassroom, updateClassroom, deleteClassroom, type Classroom as ApiClassroom } from '@/services/classrooms';
import { getProgramsByDepartment, createProgram, updateProgram, deleteProgram, type Program as ApiProgram } from '@/services/programs';
import { getLevelsByProgram, createLevel, updateLevel, deleteLevel, type ProgramLevel as ApiProgramLevel } from '@/services/levels';
import { getTermsByLevel, createTerm, updateTerm, deleteTerm, type ProgramTerm as ApiProgramTerm } from '@/services/terms';
import { getCoursesByTerm, createCourse, updateCourse, deleteCourse, type ProgramCourse as ApiProgramCourse } from '@/services/courses';
import { getStaffByCollege, createStaff, updateStaff, deleteStaff, type Staff as ApiStaff } from '@/services/staff';

// Data types (واجهة العرض - متوافقة مع القاعدة)
interface College {
  id: string;
  name: string;            // college_name
  academicCode: string;    // academic_code
}

interface Department {
  id: string;              // department_id
  name: string;            // department_name
  code: string;            // department_code
  collegeId: string;       // college_id
}

interface Classroom {
  id: string;              // classroom_id
  name: string;            // classroom_name
  type: "CLASSROOM" | "LAB"; // classroom_type
  capacity: number;
  floor: number;
  latitude?: number | null;
  longitude?: number | null;
  allowedDistance?: number | null;
  buildingId: string;
}

interface Program {
  id: string;              // program_id
  name: string;            // program_name
  code?: string;           // code (اختياري)
  description?: string;    // description (اختياري)
  collegeId: string;
  departmentId: string;
}

interface ProgramLevel {
  id: string;              // program_level_id
  programId: string;
  levelNumber: number;
  title: string;
}

interface ProgramTerm {
  id: string;              // program_term_id
  programLevelId: string;
  termNumber: 1 | 2;
  title: string;
}

interface ProgramCourse {
  id: string;
  programTermId: string;
  programLevelId: string;  // مهم لتوافق القاعدة
  courseCode: string;
  courseName: string;
  creditHours: number;
  isElective: boolean;
  departmentId?: string;
  notes?: string;
}

interface AcademicStaff {
  id: string;
  fullName: string;
  staffNumber: string;
  academicAffairsNumber?: string;
  academicRank: string;
  employmentType: "متفرغ" | "غير متفرغ";
  lectureRate: number;     // سعر المحاضرة
  address?: string;
  phone?: string;
  email?: string;
  notes?: string;
  collegeId: string;
  departmentId?: string | null;
}

// Entitlements (واجهة فقط)
interface EntitlementPeriod {
  from: string;
  to: string;
}

interface EntitlementReview {
  staffId: string;
  hoursWorked: number;
  hourlyRate: number;
  total: number;
}

interface EntitlementApproval {
  staffId: string;
  status: string;
  approvedBy: string;
  date: string;
}

interface EntitlementPayout {
  staffId: string;
  amount: number;
  method: string;
  ref: string;
  date: string;
  status: string;
}

export default function CollegesPage() {
  const location = useLocation();

  // State: من API
  const [colleges, setColleges] = useState<College[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [levels, setLevels] = useState<ProgramLevel[]>([]);
  const [terms, setTerms] = useState<ProgramTerm[]>([]);
  const [courses, setCourses] = useState<ProgramCourse[]>([]);
  const [academicStaff, setAcademicStaff] = useState<AcademicStaff[]>([]);

  // Buildings/Classrooms
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [allClassroomsCount, setAllClassroomsCount] = useState(0);

  // Dashboard helper
  const [programsCount, setProgramsCount] = useState(0);

  // Entitlements (واجهة)
  const [entitlementPeriod, setEntitlementPeriod] = useState<EntitlementPeriod>({ from: "2025-09-01", to: "2025-09-30" });
  const [entitlementReviews] = useState<EntitlementReview[]>([
    { staffId: "stf-1001", hoursWorked: 36, hourlyRate: 150, total: 5400 },
    { staffId: "stf-1002", hoursWorked: 28, hourlyRate: 120, total: 3360 },
    { staffId: "stf-1003", hoursWorked: 32, hourlyRate: 130, total: 4160 },
    { staffId: "stf-1004", hoursWorked: 20, hourlyRate: 100, total: 2000 }
  ]);
  const [entitlementApprovals, setEntitlementApprovals] = useState<EntitlementApproval[]>([
    { staffId: "stf-1001", status: "قيد المراجعة", approvedBy: "", date: "" },
    { staffId: "stf-1002", status: "قيد المراجعة", approvedBy: "", date: "" },
    { staffId: "stf-1003", status: "قيد المراجعة", approvedBy: "", date: "" },
    { staffId: "stf-1004", status: "قيد المراجعة", approvedBy: "", date: "" }
  ]);
  const [entitlementPayouts] = useState<EntitlementPayout[]>([
    { staffId: "stf-1001", amount: 5400, method: "تحويل بنكي", ref: "TRX-9011", date: "2025-10-02", status: "تم" },
    { staffId: "stf-1002", amount: 3360, method: "تحويل بنكي", ref: "TRX-9012", date: "2025-10-02", status: "معلق" }
  ]);
  const [entitlementStep, setEntitlementStep] = useState<string>("1");

  // UI selection
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<ProgramLevel | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<ProgramTerm | null>(null);

  // Form states
  const [isCollegeFormOpen, setIsCollegeFormOpen] = useState(false);
  const [editingCollegeId, setEditingCollegeId] = useState<string | null>(null);
  const [collegeFormData, setCollegeFormData] = useState({ name: "", academicCode: "" });

  const [isDeptFormOpen, setIsDeptFormOpen] = useState(false);
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);
  const [deptFormData, setDeptFormData] = useState({ name: "", code: "" });

  const [isClassroomFormOpen, setIsClassroomFormOpen] = useState(false);
  const [editingClassroomId, setEditingClassroomId] = useState<string | null>(null);
  const [classroomFormData, setClassroomFormData] = useState({
    name: "",
    type: "CLASSROOM" as "CLASSROOM" | "LAB",
    capacity: 0,
    floor: 0,
    latitude: "" as string | number | "",
    longitude: "" as string | number | "",
    allowedDistance: "" as string | number | ""
  });

  const [isProgramFormOpen, setIsProgramFormOpen] = useState(false);
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null);
  const [programFormData, setProgramFormData] = useState({
    name: "",
    code: "",
    description: ""
  });

  const [isLevelFormOpen, setIsLevelFormOpen] = useState(false);
  const [editingLevelId, setEditingLevelId] = useState<string | null>(null);
  const [levelFormData, setLevelFormData] = useState({ levelNumber: 1 });

  const [isTermFormOpen, setIsTermFormOpen] = useState(false);
  const [editingTermId, setEditingTermId] = useState<string | null>(null);
  const [termFormData, setTermFormData] = useState({ termNumber: 1 as 1 | 2 });

  const [isCourseFormOpen, setIsCourseFormOpen] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [courseFormData, setCourseFormData] = useState({
    courseCode: "",
    courseName: "",
    creditHours: 3,
    isElective: false,
    departmentId: "",
    notes: ""
  });

  const [isStaffFormOpen, setIsStaffFormOpen] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [staffFormData, setStaffFormData] = useState({
    fullName: "",
    staffNumber: "",
    academicAffairsNumber: "",
    academicRank: "محاضر",
    departmentId: "" as string,
    employmentType: "متفرغ" as "متفرغ" | "غير متفرغ",
    lectureRate: 100,
    address: "",
    phone: "",
    email: "",
    notes: ""
  });

  // Loading helpers
  const loadColleges = async () => {
    const data: ApiCollege[] = await getColleges();
    setColleges(data.map(c => ({
      id: c.id,
      name: c.name,
      academicCode: c.academicCode
    })));
  };

  const loadDepartments = async (collegeId: string) => {
    const data: ApiDepartment[] = await getDepartmentsByCollege(collegeId);
    const mapped = data.map(d => ({
      id: d.id,
      name: d.name,
      code: d.code || "",
      collegeId: d.collegeId
    }));
    setDepartments(mapped);
    return mapped;
  };

  const loadBuildings = async (collegeId: string) => {
    const data = await getBuildingsByCollege(collegeId);
    setBuildings(data);
    setSelectedBuilding(null);
    setClassrooms([]);
    // عدد القاعات الإجمالي بالكلية
    const allRooms = await getClassroomsByCollege(collegeId);
    setAllClassroomsCount(allRooms.length);
  };

  const loadClassroomsByBuildingId = async (buildingId: string) => {
    const data: ApiClassroom[] = await getClassroomsByBuilding(buildingId);
    setClassrooms(data.map(c => ({
      id: c.id,
      name: c.name,
      type: c.type,
      capacity: c.capacity,
      floor: c.floor ?? 0,
      latitude: typeof c.latitude === "number" ? c.latitude : c.latitude ? Number(c.latitude) : null,
      longitude: typeof c.longitude === "number" ? c.longitude : c.longitude ? Number(c.longitude) : null,
      allowedDistance: typeof c.allowedDistance === "number" ? c.allowedDistance : c.allowedDistance ? Number(c.allowedDistance) : null,
      buildingId: c.buildingId
    })));
  };

  const loadPrograms = async (departmentId: string) => {
    const data: ApiProgram[] = await getProgramsByDepartment(departmentId);
    setPrograms(data.map(p => ({
      id: p.id,
      name: p.name,
      code: p.code || "",
      description: p.description || "",
      collegeId: p.collegeId,
      departmentId: p.departmentId
    })));
  };

  const loadLevels = async (programId: string) => {
    const data: ApiProgramLevel[] = await getLevelsByProgram(programId);
    setLevels(data.map(l => ({
      id: l.id,
      programId: l.programId,
      levelNumber: l.levelNumber,
      title: l.title
    })));
  };

  const loadTerms = async (levelId: string) => {
    const data: ApiProgramTerm[] = await getTermsByLevel(levelId);
    setTerms(data.map(t => ({
      id: t.id,
      programLevelId: t.programLevelId,
      termNumber: t.termNumber as 1 | 2,
      title: t.title
    })));
  };

  const loadCourses = async (termId: string) => {
    const data: ApiProgramCourse[] = await getCoursesByTerm(termId);
    setCourses(data.map(c => ({
      id: c.id,
      programTermId: c.programTermId,
      programLevelId: c.programLevelId,
      courseCode: c.courseCode,
      courseName: c.courseName,
      creditHours: c.creditHours,
      isElective: c.isElective,
      departmentId: c.departmentId || "",
      notes: c.notes || ""
    })));
  };

  const loadStaff = async (collegeId: string) => {
    const data: ApiStaff[] = await getStaffByCollege(collegeId);
    setAcademicStaff(data.map(s => ({
      id: s.id,
      fullName: s.fullName,
      staffNumber: s.staffNumber,
      academicAffairsNumber: s.academicAffairsNumber || "",
      academicRank: s.academicRank,
      employmentType: s.employmentType,
      lectureRate: s.lectureRate,
      address: s.address || "",
      phone: s.phone || "",
      email: s.email || "",
      notes: s.notes || "",
      collegeId: s.collegeId,
      departmentId: s.departmentId || ""
    })));
  };

  // حساب عدد البرامج على مستوى الكلية
  const computeProgramsCountForCollege = async (deps: Department[]) => {
    const lists = await Promise.all(deps.map(d => getProgramsByDepartment(d.id)));
    const total = lists.reduce((acc, arr) => acc + arr.length, 0);
    setProgramsCount(total);
  };

  // Reset & load on route
  useEffect(() => {
    if (location.pathname === "/colleges") {
      setSelectedCollege(null);
      setSelectedDepartment(null);
      setSelectedProgram(null);
      setSelectedLevel(null);
      setSelectedTerm(null);
      loadColleges();
    }
  }, [location.pathname]);

  // On select college
  useEffect(() => {
    if (!selectedCollege) return;
    const collegeId = selectedCollege.id;
    (async () => {
      const deps = await loadDepartments(collegeId);
      await Promise.all([
        loadBuildings(collegeId),
        loadStaff(collegeId),
      ]);
      await computeProgramsCountForCollege(deps);
      setSelectedDepartment(null);
      setSelectedProgram(null);
      setSelectedLevel(null);
      setSelectedTerm(null);
    })();
  }, [selectedCollege?.id]);

  // On select department
  useEffect(() => {
    if (selectedDepartment) {
      loadPrograms(selectedDepartment.id);
      setSelectedProgram(null);
      setSelectedLevel(null);
      setSelectedTerm(null);
    } else {
      setPrograms([]);
    }
  }, [selectedDepartment?.id]);

  // On select program
  useEffect(() => {
    if (selectedProgram) {
      loadLevels(selectedProgram.id);
      setSelectedLevel(null);
      setSelectedTerm(null);
    } else {
      setLevels([]);
    }
  }, [selectedProgram?.id]);

  // On select level
  useEffect(() => {
    if (selectedLevel) {
      loadTerms(selectedLevel.id);
      setSelectedTerm(null);
    } else {
      setTerms([]);
    }
  }, [selectedLevel?.id]);

  // On select term
  useEffect(() => {
    if (selectedTerm) {
      loadCourses(selectedTerm.id);
    } else {
      setCourses([]);
    }
  }, [selectedTerm?.id]);

  // Approvals toggle (واجهة فقط) - إصلاح stale state
  const toggleApprovalStatus = (staffId: string) => {
    setEntitlementApprovals(prev =>
      prev.map(a =>
        a.staffId === staffId
          ? {
              ...a,
              status: a.status === "قيد المراجعة" ? "معتمد" : "قيد المراجعة",
              approvedBy: a.status === "قيد المراجعة" ? "المدير الأكاديمي" : "",
              date: a.status === "قيد المراجعة" ? new Date().toLocaleDateString('ar') : ""
            }
          : a
      )
    );
  };

  // Derived
  const collegeDepartments = departments;
  const collegeStaff = academicStaff;
  const departmentPrograms = selectedDepartment ? programs.filter(p => p.departmentId === selectedDepartment.id) : [];
  const programLevels = selectedProgram ? levels.filter(l => l.programId === selectedProgram.id) : [];
  const levelTerms = selectedLevel ? terms.filter(t => t.programLevelId === selectedLevel.id) : [];
  const termCourses = selectedTerm ? courses.filter(c => c.programTermId === selectedTerm.id) : [];

  // College CRUD
  const handleAddCollege = () => {
    setIsCollegeFormOpen(true);
    setEditingCollegeId(null);
    setCollegeFormData({ name: "", academicCode: "" });
  };

  const handleEditCollege = (college: College) => {
    setIsCollegeFormOpen(true);
    setEditingCollegeId(college.id);
    setCollegeFormData({ name: college.name, academicCode: college.academicCode });
  };

  const handleDeleteCollege = async (id: string) => {
    if (!confirm("سيتم حذف الكلية وكل ما يتبعها. هل أنت متأكد؟")) return;
    await deleteCollege(id);
    if (selectedCollege?.id === id) setSelectedCollege(null);
    await loadColleges();
  };

  const handleSubmitCollege = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCollegeId) {
      await updateCollege(editingCollegeId, {
        name: collegeFormData.name,
        academicCode: collegeFormData.academicCode
      });
    } else {
      await createCollege({
        name: collegeFormData.name,
        academicCode: collegeFormData.academicCode
      });
    }
    setIsCollegeFormOpen(false);
    await loadColleges();
  };

  // Department CRUD
  const handleAddDept = () => {
    if (!selectedCollege) return;
    setIsDeptFormOpen(true);
    setEditingDeptId(null);
    setDeptFormData({ name: "", code: "" });
  };

  const handleEditDept = (dept: Department) => {
    setIsDeptFormOpen(true);
    setEditingDeptId(dept.id);
    setDeptFormData({ name: dept.name, code: dept.code });
  };

  const handleDeleteDept = async (id: string) => {
    await deleteDepartment(id);
    if (selectedDepartment?.id === id) setSelectedDepartment(null);
    if (selectedCollege) await loadDepartments(selectedCollege.id);
  };

  const handleSubmitDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCollege) return;
    if (editingDeptId) {
      await updateDepartment(editingDeptId, {
        name: deptFormData.name,
        code: deptFormData.code || undefined,
        collegeId: selectedCollege.id
      });
    } else {
      await createDepartment({
        name: deptFormData.name,
        code: deptFormData.code || undefined,
        collegeId: selectedCollege.id
      });
    }
    setIsDeptFormOpen(false);
    await loadDepartments(selectedCollege.id);
  };

  // Classroom CRUD (يتطلب اختيار مبنى)
  const handleAddClassroom = () => {
    if (!selectedBuilding) return;
    setIsClassroomFormOpen(true);
    setEditingClassroomId(null);
    setClassroomFormData({
      name: "",
      type: "CLASSROOM",
      capacity: 0,
      floor: 0,
      latitude: "",
      longitude: "",
      allowedDistance: ""
    });
  };

  const handleEditClassroom = (classroom: Classroom) => {
    setIsClassroomFormOpen(true);
    setEditingClassroomId(classroom.id);
    setClassroomFormData({
      name: classroom.name,
      type: classroom.type,
      capacity: classroom.capacity,
      floor: classroom.floor ?? 0,
      latitude: classroom.latitude ?? "",
      longitude: classroom.longitude ?? "",
      allowedDistance: classroom.allowedDistance ?? ""
    });
  };

  const handleDeleteClassroom = async (id: string) => {
    await deleteClassroom(id);
    if (selectedBuilding) await loadClassroomsByBuildingId(selectedBuilding.id);
    if (selectedCollege) {
      const allRooms = await getClassroomsByCollege(selectedCollege.id);
      setAllClassroomsCount(allRooms.length);
    }
  };

  const handleSubmitClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBuilding) return;
    const payload = {
      name: classroomFormData.name,
      buildingId: selectedBuilding.id,
      floor: Number(classroomFormData.floor || 0),
      capacity: Number(classroomFormData.capacity || 0),
      latitude: classroomFormData.latitude === "" ? undefined : Number(classroomFormData.latitude),
      longitude: classroomFormData.longitude === "" ? undefined : Number(classroomFormData.longitude),
      allowedDistance: classroomFormData.allowedDistance === "" ? undefined : Number(classroomFormData.allowedDistance),
      type: classroomFormData.type
    };
    if (editingClassroomId) {
      await updateClassroom(editingClassroomId, payload);
    } else {
      await createClassroom(payload);
    }
    setIsClassroomFormOpen(false);
    await loadClassroomsByBuildingId(selectedBuilding.id);
    if (selectedCollege) {
      const allRooms = await getClassroomsByCollege(selectedCollege.id);
      setAllClassroomsCount(allRooms.length);
    }
  };

  // Program CRUD
  const handleAddProgram = () => {
    if (!selectedDepartment || !selectedCollege) return;
    setIsProgramFormOpen(true);
    setEditingProgramId(null);
    setProgramFormData({ name: "", code: "", description: "" });
  };

  const handleEditProgram = (program: Program) => {
    setIsProgramFormOpen(true);
    setEditingProgramId(program.id);
    setProgramFormData({ name: program.name, code: program.code || "", description: program.description || "" });
  };

  const handleDeleteProgram = async (id: string) => {
    await deleteProgram(id);
    if (selectedProgram?.id === id) setSelectedProgram(null);
    if (selectedDepartment) await loadPrograms(selectedDepartment.id);
  };

  const handleSubmitProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDepartment || !selectedCollege) return;
    const payload = {
      name: programFormData.name,
      code: programFormData.code?.trim() || undefined,
      description: programFormData.description?.trim() || undefined,
      collegeId: selectedCollege.id,
      departmentId: selectedDepartment.id
    };
    if (editingProgramId) {
      await updateProgram(editingProgramId, payload);
    } else {
      await createProgram(payload);
    }
    setIsProgramFormOpen(false);
    await loadPrograms(selectedDepartment.id);
  };

  // Level CRUD
  const handleAddLevel = () => {
    if (!selectedProgram) return;
    setIsLevelFormOpen(true);
    setEditingLevelId(null);
    setLevelFormData({ levelNumber: 1 });
  };

  const handleEditLevel = (level: ProgramLevel) => {
    setIsLevelFormOpen(true);
    setEditingLevelId(level.id);
    setLevelFormData({ levelNumber: level.levelNumber });
  };

  const handleDeleteLevel = async (id: string) => {
    await deleteLevel(id);
    if (selectedLevel?.id === id) setSelectedLevel(null);
    if (selectedProgram) await loadLevels(selectedProgram.id);
  };

  const handleSubmitLevel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProgram) return;
    const payload = {
      programId: selectedProgram.id,
      levelNumber: levelFormData.levelNumber,
      title: `المستوى ${levelFormData.levelNumber}`
    };
    if (editingLevelId) {
      await updateLevel(editingLevelId, payload);
    } else {
      await createLevel(payload);
    }
    setIsLevelFormOpen(false);
    await loadLevels(selectedProgram.id);
  };

  // Term CRUD
  const handleAddTerm = () => {
    if (!selectedLevel) return;
    setIsTermFormOpen(true);
    setEditingTermId(null);
    setTermFormData({ termNumber: 1 });
  };

  const handleEditTerm = (term: ProgramTerm) => {
    setIsTermFormOpen(true);
    setEditingTermId(term.id);
    setTermFormData({ termNumber: term.termNumber });
  };

  const handleDeleteTerm = async (id: string) => {
    await deleteTerm(id);
    if (selectedTerm?.id === id) setSelectedTerm(null);
    if (selectedLevel) await loadTerms(selectedLevel.id);
  };

  const handleSubmitTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLevel) return;
    const payload = {
      programLevelId: selectedLevel.id,
      termNumber: termFormData.termNumber,
      title: `الترم ${termFormData.termNumber}`
    };
    if (editingTermId) {
      await updateTerm(editingTermId, payload);
    } else {
      await createTerm(payload);
    }
    setIsTermFormOpen(false);
    await loadTerms(selectedLevel.id);
  };

  // Course CRUD
  const handleAddCourse = () => {
    if (!selectedTerm || !selectedLevel) return;
    setIsCourseFormOpen(true);
    setEditingCourseId(null);
    setCourseFormData({ courseCode: "", courseName: "", creditHours: 3, isElective: false, departmentId: "", notes: "" });
  };

  const handleEditCourse = (course: ProgramCourse) => {
    setIsCourseFormOpen(true);
    setEditingCourseId(course.id);
    setCourseFormData({
      courseCode: course.courseCode,
      courseName: course.courseName,
      creditHours: course.creditHours,
      isElective: course.isElective,
      departmentId: course.departmentId || "",
      notes: course.notes || ""
    });
  };

  const handleDeleteCourse = async (id: string) => {
    await deleteCourse(id);
    if (selectedTerm) await loadCourses(selectedTerm.id);
  };

  const handleSubmitCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTerm || !selectedLevel) return;
    const payload = {
      programTermId: selectedTerm.id,
      programLevelId: selectedLevel.id, // مهم لتوافق القاعدة
      courseCode: courseFormData.courseCode.trim(),
      courseName: courseFormData.courseName.trim(),
      creditHours: Number(courseFormData.creditHours),
      isElective: courseFormData.isElective,
      departmentId: courseFormData.departmentId || undefined,
      notes: courseFormData.notes?.trim() || undefined
    };
    if (editingCourseId) {
      await updateCourse(editingCourseId, payload);
    } else {
      await createCourse(payload);
    }
    setIsCourseFormOpen(false);
    await loadCourses(selectedTerm.id);
  };

  // Academic Staff CRUD
  const handleAddStaff = () => {
    if (!selectedCollege) return;
    setIsStaffFormOpen(true);
    setEditingStaffId(null);
    setStaffFormData({
      fullName: "",
      staffNumber: "",
      academicAffairsNumber: "",
      academicRank: "محاضر",
      departmentId: "",
      employmentType: "متفرغ",
      lectureRate: 100,
      address: "",
      phone: "",
      email: "",
      notes: ""
    });
  };

  const handleEditStaff = (staff: AcademicStaff) => {
    setIsStaffFormOpen(true);
    setEditingStaffId(staff.id);
    setStaffFormData({
      fullName: staff.fullName,
      staffNumber: staff.staffNumber,
      academicAffairsNumber: staff.academicAffairsNumber || "",
      academicRank: staff.academicRank,
      departmentId: staff.departmentId || "",
      employmentType: staff.employmentType,
      lectureRate: staff.lectureRate,
      address: staff.address || "",
      phone: staff.phone || "",
      email: staff.email || "",
      notes: staff.notes || ""
    });
  };

  const handleDeleteStaff = async (id: string) => {
    await deleteStaff(id);
    if (selectedCollege) await loadStaff(selectedCollege.id);
  };

  const handleSubmitStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCollege) return;
    const payload = {
      fullName: staffFormData.fullName,
      staffNumber: staffFormData.staffNumber,
      academicAffairsNumber: staffFormData.academicAffairsNumber || undefined,
      academicRank: staffFormData.academicRank,
      employmentType: staffFormData.employmentType,
      lectureRate: Number(staffFormData.lectureRate || 0),
      address: staffFormData.address || undefined,
      phone: staffFormData.phone || undefined,
      email: staffFormData.email || undefined,
      notes: staffFormData.notes || undefined,
      collegeId: selectedCollege.id,
      departmentId: staffFormData.departmentId || undefined
    };
    if (editingStaffId) {
      await updateStaff(editingStaffId, payload);
    } else {
      await createStaff(payload);
    }
    setIsStaffFormOpen(false);
    await loadStaff(selectedCollege.id);
  };

  return (
    <AdminLayout>
      <div className="p-3 sm:p-6">
        {!selectedCollege ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold">الكليات</h1>
              <Button onClick={handleAddCollege}>
                <Plus className="w-4 h-4 mr-2" />
                إضافة كلية
              </Button>
            </div>

            {isCollegeFormOpen && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>{editingCollegeId ? "تعديل كلية" : "إضافة كلية جديدة"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitCollege} className="space-y-4">
                    <div>
                      <Label>اسم الكلية *</Label>
                      <Input value={collegeFormData.name} onChange={(e) => setCollegeFormData({ ...collegeFormData, name: e.target.value })} required />
                    </div>
                    <div>
                      <Label>الكود الأكاديمي *</Label>
                      <Input value={collegeFormData.academicCode} onChange={(e) => setCollegeFormData({ ...collegeFormData, academicCode: e.target.value })} required />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit">حفظ</Button>
                      <Button type="button" variant="outline" onClick={() => setIsCollegeFormOpen(false)}>إلغاء</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>اسم الكلية</TableHead>
                      <TableHead>الكود الأكاديمي</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {colleges.map((college) => (
                      <TableRow key={college.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedCollege(college)}>
                        <TableCell className="font-medium">{college.name}</TableCell>
                        <TableCell>{college.academicCode}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleEditCollege(college); }}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleDeleteCollege(college.id); }}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setSelectedCollege(college); }}>
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <div className="mb-6">
              <Button variant="outline" onClick={() => { setSelectedCollege(null); setSelectedDepartment(null); setSelectedProgram(null); setSelectedLevel(null); setSelectedTerm(null); }}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                العودة للكليات
              </Button>
              <h1 className="text-2xl sm:text-3xl font-bold mt-4">{selectedCollege.name}</h1>
            </div>

            <Tabs defaultValue="colleges-dashboard" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="colleges-dashboard">لوحة التحكم</TabsTrigger>
                <TabsTrigger value="departments">الأقسام</TabsTrigger>
                <TabsTrigger value="classrooms">القاعات الدراسية</TabsTrigger>
                <TabsTrigger value="Academic Staff">أعضاء هيئة التدريس</TabsTrigger>
              </TabsList>

              {/* Dashboard */}
              <TabsContent value="colleges-dashboard">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">عدد الأقسام</p>
                            <p className="text-2xl font-bold">{collegeDepartments.length}</p>
                          </div>
                          <Building2 className="h-8 w-8 text-primary" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">عدد القاعات</p>
                            <p className="text-2xl font-bold">{allClassroomsCount}</p>
                          </div>
                          <BookOpen className="h-8 w-8 text-primary" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">عدد البرامج</p>
                            <p className="text-2xl font-bold">{programsCount}</p>
                          </div>
                          <BookOpen className="h-8 w-8 text-primary" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">أعضاء هيئة التدريس</p>
                            <p className="text-2xl font-bold">{collegeStaff.length}</p>
                          </div>
                          <Users className="h-8 w-8 text-primary" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">المصروفات الشهرية</p>
                            <p className="text-2xl font-bold">45,000</p>
                          </div>
                          <DollarSign className="h-8 w-8 text-primary" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>مصاريف الاستحقاقات لآخر 6 أشهر</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {[
                          { month: "أبريل", amount: 35000 },
                          { month: "مايو", amount: 38000 },
                          { month: "يونيو", amount: 41000 },
                          { month: "يوليو", amount: 39500 },
                          { month: "أغسطس", amount: 42000 },
                          { month: "سبتمبر", amount: 45000 }
                        ].map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center py-2 border-b">
                            <span className="font-medium">{item.month}</span>
                            <span className="text-primary font-bold">{item.amount.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>أعلى أعضاء هيئة التدريس صرفاً</CardTitle>
                    </CardHeader>
                    <CardContent>
                                            <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>الاسم</TableHead>
                            <TableHead>القسم</TableHead>
                            <TableHead>الساعات المدفوعة</TableHead>
                            <TableHead>الإجمالي</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell>أ.د. أحمد الحربي</TableCell>
                            <TableCell>نظم المعلومات</TableCell>
                            <TableCell>36</TableCell>
                            <TableCell className="font-bold">5,400</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>د. مريم باوزير</TableCell>
                            <TableCell>الذكاء الاصطناعي</TableCell>
                            <TableCell>32</TableCell>
                            <TableCell className="font-bold">4,160</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>د. سارة القحطاني</TableCell>
                            <TableCell>علوم الحاسوب</TableCell>
                            <TableCell>28</TableCell>
                            <TableCell className="font-bold">3,360</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Departments */}
              <TabsContent value="departments">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold">الأقسام</h2>
                    <Button onClick={handleAddDept}>
                      <Plus className="w-4 h-4 mr-2" />
                      إضافة قسم
                    </Button>
                  </div>

                  {isDeptFormOpen && (
                    <Card>
                      <CardHeader>
                        <CardTitle>{editingDeptId ? "تعديل قسم" : "إضافة قسم جديد"}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleSubmitDept} className="space-y-4">
                          <div>
                            <Label>اسم القسم *</Label>
                            <Input value={deptFormData.name} onChange={(e) => setDeptFormData({ ...deptFormData, name: e.target.value })} required />
                          </div>
                          <div>
                            <Label>كود القسم</Label>
                            <Input value={deptFormData.code} onChange={(e) => setDeptFormData({ ...deptFormData, code: e.target.value })} />
                          </div>
                          <div className="flex gap-2">
                            <Button type="submit">حفظ</Button>
                            <Button type="button" variant="outline" onClick={() => setIsDeptFormOpen(false)}>إلغاء</Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardContent className="pt-6">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>اسم القسم</TableHead>
                            <TableHead>كود القسم</TableHead>
                            <TableHead>الإجراءات</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {collegeDepartments.map((dept) => (
                            <TableRow key={dept.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedDepartment(dept)}>
                              <TableCell className="font-medium">{dept.name}</TableCell>
                              <TableCell>{dept.code}</TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleEditDept(dept); }}>
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleDeleteDept(dept.id); }}>
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  {selectedDepartment && (
                    <Card className="mt-6">
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <CardTitle>البرامج - {selectedDepartment.name}</CardTitle>
                          <Button onClick={handleAddProgram} size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            إضافة برنامج
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {isProgramFormOpen && (
                          <Card className="mb-4">
                            <CardContent className="pt-6">
                              <form onSubmit={handleSubmitProgram} className="space-y-4">
                                <div>
                                  <Label>اسم البرنامج *</Label>
                                  <Input value={programFormData.name} onChange={(e) => setProgramFormData({ ...programFormData, name: e.target.value })} required />
                                </div>
                                <div>
                                  <Label>الكود</Label>
                                  <Input value={programFormData.code} onChange={(e) => setProgramFormData({ ...programFormData, code: e.target.value })} />
                                </div>
                                <div>
                                  <Label>الوصف</Label>
                                  <Textarea value={programFormData.description} onChange={(e) => setProgramFormData({ ...programFormData, description: e.target.value })} />
                                </div>
                                <div className="flex gap-2">
                                  <Button type="submit">حفظ</Button>
                                  <Button type="button" variant="outline" onClick={() => setIsProgramFormOpen(false)}>إلغاء</Button>
                                </div>
                              </form>
                            </CardContent>
                          </Card>
                        )}

                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>اسم البرنامج</TableHead>
                              <TableHead>الكود</TableHead>
                              <TableHead>الإجراءات</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {departmentPrograms.map((program) => (
                              <TableRow key={program.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedProgram(program)}>
                                <TableCell className="font-medium">{program.name}</TableCell>
                                <TableCell>{program.code}</TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
                                    <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleEditProgram(program); }}>
                                      <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleDeleteProgram(program.id); }}>
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>

                        {selectedProgram && (
                          <Card className="mt-6">
                            <CardHeader>
                              <CardTitle>الخطة الدراسية - {selectedProgram.name}</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-6">
                                {/* Levels */}
                                <div>
                                  <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold">المستويات</h3>
                                    <Button onClick={handleAddLevel} size="sm">
                                      <Plus className="w-4 h-4 mr-2" />
                                      إضافة مستوى
                                    </Button>
                                  </div>

                                  {isLevelFormOpen && (
                                    <Card className="mb-4">
                                      <CardContent className="pt-6">
                                        <form onSubmit={handleSubmitLevel} className="space-y-4">
                                          <div>
                                            <Label>رقم المستوى *</Label>
                                            <Input type="number" min={1} value={levelFormData.levelNumber} onChange={(e) => setLevelFormData({ levelNumber: parseInt(e.target.value || "1") })} required />
                                          </div>
                                          <div className="flex gap-2">
                                            <Button type="submit">حفظ</Button>
                                            <Button type="button" variant="outline" onClick={() => setIsLevelFormOpen(false)}>إلغاء</Button>
                                          </div>
                                        </form>
                                      </CardContent>
                                    </Card>
                                  )}

                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {programLevels.map((level) => (
                                      <Card key={level.id} className={cn("cursor-pointer", selectedLevel?.id === level.id && "border-primary")} onClick={() => setSelectedLevel(level)}>
                                        <CardContent className="pt-6">
                                          <div className="flex justify-between items-start">
                                            <div>
                                              <h4 className="font-semibold">{level.title}</h4>
                                            </div>
                                            <div className="flex gap-1">
                                              <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleEditLevel(level); }}>
                                                <Pencil className="w-3 h-3" />
                                              </Button>
                                              <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleDeleteLevel(level.id); }}>
                                                <Trash2 className="w-3 h-3" />
                                              </Button>
                                            </div>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    ))}
                                  </div>
                                </div>

                                {/* Terms */}
                                {selectedLevel && (
                                  <div>
                                    <div className="flex justify-between items-center mb-4">
                                      <h3 className="text-lg font-semibold">الفصول - {selectedLevel.title}</h3>
                                      <Button onClick={handleAddTerm} size="sm">
                                        <Plus className="w-4 h-4 mr-2" />
                                        إضافة فصل
                                      </Button>
                                    </div>

                                    {isTermFormOpen && (
                                      <Card className="mb-4">
                                        <CardContent className="pt-6">
                                          <form onSubmit={handleSubmitTerm} className="space-y-4">
                                            <div>
                                              <Label>رقم الترم *</Label>
                                              <Select value={termFormData.termNumber.toString()} onValueChange={(value) => setTermFormData({ termNumber: parseInt(value) as 1 | 2 })}>
                                                <SelectTrigger>
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="1">الترم 1</SelectItem>
                                                  <SelectItem value="2">الترم 2</SelectItem>
                                                </SelectContent>
                                              </Select>
                                            </div>
                                            <div className="flex gap-2">
                                              <Button type="submit">حفظ</Button>
                                              <Button type="button" variant="outline" onClick={() => setIsTermFormOpen(false)}>إلغاء</Button>
                                            </div>
                                          </form>
                                        </CardContent>
                                      </Card>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {levelTerms.map((term) => (
                                        <Card key={term.id} className={cn("cursor-pointer", selectedTerm?.id === term.id && "border-primary")} onClick={() => setSelectedTerm(term)}>
                                          <CardContent className="pt-6">
                                            <div className="flex justify-between items-start">
                                              <div>
                                                <h4 className="font-semibold">{term.title}</h4>
                                              </div>
                                              <div className="flex gap-1">
                                                <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleEditTerm(term); }}>
                                                  <Pencil className="w-3 h-3" />
                                                </Button>
                                                <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleDeleteTerm(term.id); }}>
                                                  <Trash2 className="w-3 h-3" />
                                                </Button>
                                              </div>
                                            </div>
                                          </CardContent>
                                        </Card>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Courses */}
                                {selectedTerm && (
                                  <div>
                                    <div className="flex justify-between items-center mb-4">
                                      <h3 className="text-lg font-semibold">المواد - {selectedTerm.title}</h3>
                                      <Button onClick={handleAddCourse} size="sm">
                                        <Plus className="w-4 h-4 mr-2" />
                                        إضافة مادة
                                      </Button>
                                    </div>

                                    {isCourseFormOpen && (
                                      <Card className="mb-4">
                                        <CardContent className="pt-6">
                                          <form onSubmit={handleSubmitCourse} className="space-y-4">
                                            <div>
                                              <Label>كود المادة *</Label>
                                              <Input value={courseFormData.courseCode} onChange={(e) => setCourseFormData({ ...courseFormData, courseCode: e.target.value })} required />
                                            </div>
                                            <div>
                                              <Label>اسم المادة *</Label>
                                              <Input value={courseFormData.courseName} onChange={(e) => setCourseFormData({ ...courseFormData, courseName: e.target.value })} required />
                                            </div>
                                            <div>
                                              <Label>الساعات المعتمدة *</Label>
                                              <Input type="number" min={1} value={courseFormData.creditHours} onChange={(e) => setCourseFormData({ ...courseFormData, creditHours: parseInt(e.target.value || "1") })} required />
                                            </div>
                                            <div className="flex items-center space-x-2">
                                              <Switch checked={courseFormData.isElective} onCheckedChange={(checked) => setCourseFormData({ ...courseFormData, isElective: checked })} />
                                              <Label>اختيارية؟</Label>
                                            </div>
                                            <div>
                                              <Label>القسم (اختياري)</Label>
                                              <Select value={courseFormData.departmentId} onValueChange={(value) => setCourseFormData({ ...courseFormData, departmentId: value })}>
                                                <SelectTrigger>
                                                  <SelectValue placeholder="اختر قسم" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  {collegeDepartments.map((dept) => (
                                                    <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                                                  ))}
                                                </SelectContent>
                                              </Select>
                                            </div>
                                            <div>
                                              <Label>ملاحظات</Label>
                                              <Textarea value={courseFormData.notes} onChange={(e) => setCourseFormData({ ...courseFormData, notes: e.target.value })} />
                                            </div>
                                            <div className="flex gap-2">
                                              <Button type="submit">حفظ</Button>
                                              <Button type="button" variant="outline" onClick={() => setIsCourseFormOpen(false)}>إلغاء</Button>
                                            </div>
                                          </form>
                                        </CardContent>
                                      </Card>
                                    )}

                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>كود المادة</TableHead>
                                          <TableHead>اسم المادة</TableHead>
                                          <TableHead>الساعات</TableHead>
                                          <TableHead>النوع</TableHead>
                                          <TableHead>الإجراءات</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {termCourses.map((course) => (
                                          <TableRow key={course.id}>
                                            <TableCell>{course.courseCode}</TableCell>
                                            <TableCell>{course.courseName}</TableCell>
                                            <TableCell>{course.creditHours}</TableCell>
                                            <TableCell>{course.isElective ? "اختيارية" : "إجبارية"}</TableCell>
                                            <TableCell>
                                              <div className="flex gap-2">
                                                <Button size="sm" variant="outline" onClick={() => handleEditCourse(course)}>
                                                  <Pencil className="w-4 h-4" />
                                                </Button>
                                                <Button size="sm" variant="outline" onClick={() => handleDeleteCourse(course.id)}>
                                                  <Trash2 className="w-4 h-4" />
                                                </Button>
                                              </div>
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              {/* Classrooms (Buildings first) */}
              <TabsContent value="classrooms">
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
                            onClick={async () => {
                              setSelectedBuilding(b);
                              await loadClassroomsByBuildingId(b.id);
                            }}
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

                  {/* Classroom form - متوافق مع القاعدة */}
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
                              <Input value={classroomFormData.name} onChange={(e) => setClassroomFormData({ ...classroomFormData, name: e.target.value })} required />
                            </div>
                            <div>
                              <Label>النوع *</Label>
                              <Select value={classroomFormData.type} onValueChange={(value: any) => setClassroomFormData({ ...classroomFormData, type: value })}>
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
                              <Input type="number" min={1} value={classroomFormData.capacity} onChange={(e) => setClassroomFormData({ ...classroomFormData, capacity: parseInt(e.target.value || "0") })} required />
                            </div>
                            <div>
                              <Label>الدور</Label>
                              <Input type="number" min={0} value={classroomFormData.floor} onChange={(e) => setClassroomFormData({ ...classroomFormData, floor: parseInt(e.target.value || "0") })} />
                            </div>
                            <div>
                              <Label>خط العرض (Latitude)</Label>
                              <Input type="number" step="0.0000001" value={classroomFormData.latitude} onChange={(e) => setClassroomFormData({ ...classroomFormData, latitude: e.target.value })} />
                            </div>
                            <div>
                              <Label>خط الطول (Longitude)</Label>
                              <Input type="number" step="0.0000001" value={classroomFormData.longitude} onChange={(e) => setClassroomFormData({ ...classroomFormData, longitude: e.target.value })} />
                            </div>
                            <div className="md:col-span-2">
                              <Label>المسافة المسموحة (متر)</Label>
                              <Input type="number" min={0} value={classroomFormData.allowedDistance} onChange={(e) => setClassroomFormData({ ...classroomFormData, allowedDistance: e.target.value })} />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button type="submit" disabled={!selectedBuilding}>حفظ</Button>
                            <Button type="button" variant="outline" onClick={() => setIsClassroomFormOpen(false)}>إلغاء</Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  )}

                  {/* Classrooms table - متوافق مع القاعدة */}
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
                                {classroom.latitude && classroom.longitude
                                  ? `${classroom.latitude}, ${classroom.longitude}`
                                  : "-"}
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
                                        allowedDistance: classroom.allowedDistance ?? ""
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
              </TabsContent>

              {/* Academic Staff */}
              <TabsContent value="Academic Staff">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold">أعضاء هيئة التدريس</h2>
                    <Button onClick={handleAddStaff}>
                      <Plus className="w-4 h-4 mr-2" />
                      إضافة عضو
                    </Button>
                  </div>

                  {/* Entitlements (واجهة فقط) */}
                  <Card>
                    <CardHeader>
                      <CardTitle>الاستحقاقات الأكاديمية</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Tabs value={entitlementStep} onValueChange={setEntitlementStep}>
                        <TabsList className="grid w-full grid-cols-5">
                          <TabsTrigger value="1">فترات الاستحقاق</TabsTrigger>
                          <TabsTrigger value="2">أجر الساعة</TabsTrigger>
                          <TabsTrigger value="3">مراجعة</TabsTrigger>
                          <TabsTrigger value="4">اعتماد</TabsTrigger>
                          <TabsTrigger value="5">صرف</TabsTrigger>
                        </TabsList>

                        <TabsContent value="1" className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>تاريخ البداية</Label>
                              <Input type="date" value={entitlementPeriod.from} onChange={(e) => setEntitlementPeriod({ ...entitlementPeriod, from: e.target.value })} />
                            </div>
                            <div>
                              <Label>تاريخ النهاية</Label>
                              <Input type="date" value={entitlementPeriod.to} onChange={(e) => setEntitlementPeriod({ ...entitlementPeriod, to: e.target.value })} />
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="2">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>العضو</TableHead>
                                <TableHead>أجر الساعة</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {collegeStaff.map((staff) => (
                                <TableRow key={staff.id}>
                                  <TableCell>{staff.fullName}</TableCell>
                                  <TableCell>
                                    <Input type="number" min={0} defaultValue={staff.lectureRate} className="w-32" />
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TabsContent>

                        <TabsContent value="3">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>العضو</TableHead>
                                <TableHead>عدد الساعات</TableHead>
                                <TableHead>أجر الساعة</TableHead>
                                <TableHead>الإجمالي</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {entitlementReviews.map((review) => {
                                const staff = academicStaff.find(s => s.id === review.staffId);
                                return (
                                  <TableRow key={review.staffId}>
                                    <TableCell>{staff?.fullName || "-"}</TableCell>
                                    <TableCell>{review.hoursWorked}</TableCell>
                                    <TableCell>{review.hourlyRate}</TableCell>
                                    <TableCell className="font-bold">{review.total.toLocaleString()}</TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </TabsContent>

                        <TabsContent value="4">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>العضو</TableHead>
                                <TableHead>الحالة</TableHead>
                                <TableHead>مُعتمد بواسطة</TableHead>
                                <TableHead>التاريخ</TableHead>
                                <TableHead>إجراءات</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {entitlementApprovals.map((approval) => {
                                const staff = academicStaff.find(s => s.id === approval.staffId);
                                return (
                                  <TableRow key={approval.staffId}>
                                    <TableCell>{staff?.fullName || "-"}</TableCell>
                                    <TableCell>
                                      <span className={cn("px-2 py-1 rounded text-sm", approval.status === "معتمد" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800")}>
                                        {approval.status}
                                      </span>
                                    </TableCell>
                                    <TableCell>{approval.approvedBy}</TableCell>
                                    <TableCell>{approval.date}</TableCell>
                                    <TableCell>
                                      <Button size="sm" variant="outline" onClick={() => toggleApprovalStatus(approval.staffId)}>
                                        {approval.status === "قيد المراجعة" ? "اعتماد" : "إلغاء الاعتماد"}
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </TabsContent>

                        <TabsContent value="5">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>العضو</TableHead>
                                <TableHead>المبلغ</TableHead>
                                <TableHead>طريقة الصرف</TableHead>
                                <TableHead>رقم المرجع</TableHead>
                                <TableHead>التاريخ</TableHead>
                                <TableHead>الحالة</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {entitlementPayouts.map((payout) => {
                                const staff = academicStaff.find(s => s.id === payout.staffId);
                                return (
                                  <TableRow key={payout.staffId}>
                                    <TableCell>{staff?.fullName || "-"}</TableCell>
                                    <TableCell>{payout.amount.toLocaleString()}</TableCell>
                                    <TableCell>{payout.method}</TableCell>
                                    <TableCell>{payout.ref}</TableCell>
                                    <TableCell>{payout.date}</TableCell>
                                    <TableCell>
                                      <span className={cn("px-2 py-1 rounded text-sm", payout.status === "تم" ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800")}>
                                        {payout.status}
                                      </span>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>

                  {/* Staff form */}
                  {isStaffFormOpen && (
                    <Card>
                      <CardHeader>
                        <CardTitle>{editingStaffId ? "تعديل عضو هيئة تدريس" : "إضافة عضو هيئة تدريس جديد"}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleSubmitStaff} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>الاسم الكامل *</Label>
                              <Input value={staffFormData.fullName} onChange={(e) => setStaffFormData({ ...staffFormData, fullName: e.target.value })} required />
                            </div>
                            <div>
                              <Label>الرقم الوظيفي *</Label>
                              <Input value={staffFormData.staffNumber} onChange={(e) => setStaffFormData({ ...staffFormData, staffNumber: e.target.value })} required />
                            </div>
                            <div>
                              <Label>رقم الشؤون الأكاديمية</Label>
                              <Input value={staffFormData.academicAffairsNumber} onChange={(e) => setStaffFormData({ ...staffFormData, academicAffairsNumber: e.target.value })} />
                            </div>
                            <div>
                              <Label>الدرجة الأكاديمية *</Label>
                              <Select value={staffFormData.academicRank} onValueChange={(value) => setStaffFormData({ ...staffFormData, academicRank: value })}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="أستاذ">أستاذ</SelectItem>
                                  <SelectItem value="أستاذ مشارك">أستاذ مشارك</SelectItem>
                                  <SelectItem value="أستاذ مساعد">أستاذ مساعد</SelectItem>
                                  <SelectItem value="محاضر">محاضر</SelectItem>
                                  <SelectItem value="معيد">معيد</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>القسم</Label>
                              <Select value={staffFormData.departmentId} onValueChange={(value) => setStaffFormData({ ...staffFormData, departmentId: value })}>
                                <SelectTrigger>
                                  <SelectValue placeholder="اختر قسم" />
                                </SelectTrigger>
                                <SelectContent>
                                  {departments.map((dept) => (
                                    <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>الحالة الوظيفية *</Label>
                              <Select value={staffFormData.employmentType} onValueChange={(value: "متفرغ" | "غير متفرغ") => setStaffFormData({ ...staffFormData, employmentType: value })}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="متفرغ">متفرغ</SelectItem>
                                  <SelectItem value="غير متفرغ">غير متفرغ</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>أجر الساعة *</Label>
                              <Input type="number" min={0} value={staffFormData.lectureRate} onChange={(e) => setStaffFormData({ ...staffFormData, lectureRate: parseInt(e.target.value || "0") })} required />
                            </div>
                            <div>
                              <Label>رقم الجوال</Label>
                              <Input value={staffFormData.phone} onChange={(e) => setStaffFormData({ ...staffFormData, phone: e.target.value })} />
                            </div>
                            <div>
                              <Label>البريد الإلكتروني</Label>
                              <Input type="email" value={staffFormData.email} onChange={(e) => setStaffFormData({ ...staffFormData, email: e.target.value })} />
                            </div>
                            <div className="md:col-span-2">
                              <Label>العنوان</Label>
                              <Input value={staffFormData.address} onChange={(e) => setStaffFormData({ ...staffFormData, address: e.target.value })} />
                            </div>
                            <div className="md:col-span-2">
                              <Label>ملاحظات</Label>
                              <Textarea value={staffFormData.notes} onChange={(e) => setStaffFormData({ ...staffFormData, notes: e.target.value })} />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button type="submit">حفظ</Button>
                            <Button type="button" variant="outline" onClick={() => setIsStaffFormOpen(false)}>إلغاء</Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  )}

                  {/* Staff table */}
                  <Card>
                    <CardContent className="pt-6">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>الاسم الكامل</TableHead>
                            <TableHead>الرقم الوظيفي</TableHead>
                            <TableHead>رقم الشؤون</TableHead>
                            <TableHead>الدرجة</TableHead>
                            <TableHead>القسم</TableHead>
                            <TableHead>الحالة</TableHead>
                            <TableHead>أجر الساعة</TableHead>
                            <TableHead>الإجراءات</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {collegeStaff.map((staff) => (
                            <TableRow key={staff.id}>
                              <TableCell className="font-medium">{staff.fullName}</TableCell>
                              <TableCell>{staff.staffNumber}</TableCell>
                              <TableCell>{staff.academicAffairsNumber}</TableCell>
                              <TableCell>{staff.academicRank}</TableCell>
                              <TableCell>{departments.find(d => d.id === staff.departmentId)?.name || "-"}</TableCell>
                              <TableCell>{staff.employmentType}</TableCell>
                              <TableCell>{staff.lectureRate}</TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline" onClick={() => handleEditStaff(staff)}>
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => handleDeleteStaff(staff.id)}>
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </AdminLayout>
  );
}