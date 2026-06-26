'use client';

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Target, Plus, Edit, Trash2, Info, BookOpen, GraduationCap, 
  Lightbulb, Layers, Book, ClipboardList, Save, Download, X,
  AlertCircle, FileText, Award, BarChart3, Loader2, Check, AlertTriangle, CheckCircle, Link, Building2 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ============ INTERFACES ============

interface CourseQualityDialogProps {
  isOpen: boolean;
  onClose: () => void;
  course: CourseInfoData | null;
}

interface CourseInfoData {
  // البيانات الأساسية
  id: number;
  course_code: string;
  course_name: string;
  credit_hours: number;
  category?: string;
  weight: number;
  teaching_language?: string;
  notes?: string;
  is_active: boolean;
  
  // حالة الاعتماد
  is_approved: boolean;
  approval_date?: string;
  approved_by?: string;
  
  // ✅ أضف هذا
  specification_status?: string;
  
  // المؤسسات
  college?: { id: number; name: string } | null;
  department?: { id: number; name: string } | null;
  program?: { id: number; name: string; academic_system?: string } | null;
  level?: { id: number; number: number } | null;
  semester?: { id: number; name: string } | null;
  block?: { id: number; name: string } | null;
  
  // أجزاء المقرر
  course_parts?: Array<{
    id: number;
    name: string;
    theoretical_hours: number;
    practical_hours: number;
    exercise_hours: number;
    seminar_hours: number;
    clinical_hours: number;
    total_hours: number;
  }>;
  
  // المتطلبات
  prerequisites?: Array<{ id: number; code: string; name: string }>;
  corequisites?: Array<{ id: number; code: string; name: string }>;
  
  // الوصف والأهداف
  description?: {
    id: number;                    // ✅ أضف الـ ID
    description: string;
    goals: string[];
    word_count: number;
    goal_count?: number;           // ✅ عدد الأهداف
    is_completed: boolean;         // ✅ هل مكتمل
    is_approved?: boolean;         // ✅ هل موافق عليه
    created_at?: string;
    updated_at?: string;
  } | null;
  
  // مخرجات التعلم
  learning_outcomes?: Array<{
    id: number;
    code: string;
    domain: string;
    description: string;
    weight: number;
  }>;
}
interface ProgramLearningOutcome {
  plo_id: number;
  code: string; // A1, B1, C1, D1
  domain: "Knowledge" | "Intellectual" | "Professional" | "General";
  description: string;
  weight: number; // ✅ إضافة الوزن
  is_active: boolean;
  order: number;
}

interface CourseLearningOutcome {
  clo_id: number;
  code: string; // a1, b1, c1, d1
  domain: "Knowledge" | "Intellectual" | "Professional" | "General";
  description: string;
  weight: number; // وزن من وزن المقرر
  plo_id?: number;
  plo_weight?: number; // ✅ سيتم حسابه من قيمة weight في CLO
  order: number;
  is_active: boolean;
}

interface CourseDescription {
  id: number;
  course_id: number;
  description: string;
  goals: string[];
  word_count: number;
  goal_count: number;
  is_completed: boolean;
  is_approved?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface CourseTopic {
  topic_id: number;
  part: string; // نظري، عملي، تمارين، سريري
  week: number;
  unit_name: string;
  subtopics: string[];
  outcome_ids: string[]; // رموز CLO (a1, b1, إلخ)
  hours: number;
  is_exam: boolean;
  exam_type?: "midterm" | "final";
}

interface TopicQuestion {
  question_id: number;
  topic_id: number;
  subtopic: string;
  question_text: string;
  question_type: "MCQ" | "essay";
  difficulty_level: number;
  clo_code: string;
  options?: Array<{ id: string; text: string; is_correct: boolean }>;
  correct_answer?: string;
  is_active: boolean;
}

interface CourseAssignment {
  assignment_id: number;
  part: string;
  title: string;
  description?: string;
  week: number;
  grade: number;
  clo_ids: string[];
  assignment_type: "homework" | "project" | "presentation" | "quiz" | "other";
  is_mandatory: boolean;
}

interface CourseAssessment {
  assessment_id: number;
  name: string;
  week?: number;
  grade: number;
  weight: number;
  percentage: number;
  clo_ids: string[];
  assessment_type: "activities" | "quizzes" | "midterm_exam" | "final_exam" | "project" | "presentation" | "practical_exam" | "other";
}

interface TeachingStrategy {
  id: number;
  name: string;
  category: string;
  is_active: boolean;
}

interface AssessmentMethod {
  id: number;
  name: string;
  category: string;
  is_active: boolean;
}

interface CourseReference {
  reference_id: number;
  type: "main" | "support" | "electronic";
  author?: string;
  year?: string;
  title: string;
  edition?: string;
  publisher?: string;
  country?: string;
  url?: string;
}

interface CoursePolicy {
  policy_id: number;
  policy_number: number;
  title: string;
  content: string;
  is_fixed: boolean;
}

interface OutcomeMapping {
  clo_id: string;
  teaching_strategies: number[];
  assessment_methods: number[];
}

// ============ COMPONENT ============

export default function CourseQualityDialog({ 
  isOpen, 
  onClose, 
  course 
}: CourseQualityDialogProps) {
  
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("info");
  const [activePart, setActivePart] = useState<string>("نظري");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set(["info"]));
  const [courseInfo, setCourseInfo] = useState<CourseInfoData | null>(null);
  const [courseInfoLoading, setCourseInfoLoading] = useState(false);

  // ============ STATE - برنامج مخرجات التعلم ============
  const [programOutcomes, setProgramOutcomes] = useState<ProgramLearningOutcome[]>([]);
  const [courseOutcomes, setCourseOutcomes] = useState<CourseLearningOutcome[]>([]);

  // ============ STATE - وصف المقرر ============
  const [courseDescription, setCourseDescription] = useState<CourseDescription | null>(null);
  const [descriptionText, setDescriptionText] = useState<string>("");
  const [courseGoals, setCourseGoals] = useState<string[]>([]);
  const [newGoal, setNewGoal] = useState<string>("");
  const [editingGoalIndex, setEditingGoalIndex] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  // ============ STATE - مخرجات تعلم المقرر ============
  const [isAddingOutcome, setIsAddingOutcome] = useState(false);
  const [outcomeFormData, setOutcomeFormData] = useState<Partial<CourseLearningOutcome>>({});
  const [editingOutcomeId, setEditingOutcomeId] = useState<number | null>(null);

  // ============ STATE - المحتوى والمواضيع ============
  const [topics, setTopics] = useState<CourseTopic[]>([]);
  const [isAddingTopic, setIsAddingTopic] = useState(false);
  const [topicFormData, setTopicFormData] = useState<Partial<CourseTopic>>({});
  const [editingTopicId, setEditingTopicId] = useState<number | null>(null);

  // ============ STATE - الأسئلة ============
  const [questions, setQuestions] = useState<TopicQuestion[]>([]);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [selectedTopicForQuestion, setSelectedTopicForQuestion] = useState<number | null>(null);
  const [questionFormData, setQuestionFormData] = useState<Partial<TopicQuestion>>({});

  // ============ STATE - التكليفات والأنشطة ============
  const [assignments, setAssignments] = useState<CourseAssignment[]>([]);
  const [isAddingAssignment, setIsAddingAssignment] = useState(false);
  const [assignmentFormData, setAssignmentFormData] = useState<Partial<CourseAssignment>>({});
  const [editingAssignmentId, setEditingAssignmentId] = useState<number | null>(null);

  // ============ STATE - التقييمات ============
  const [assessments, setAssessments] = useState<CourseAssessment[]>([]);
  const [isAddingAssessment, setIsAddingAssessment] = useState(false);
  const [assessmentFormData, setAssessmentFormData] = useState<Partial<CourseAssessment>>({});
  const [editingAssessmentId, setEditingAssessmentId] = useState<number | null>(null);

  // ============ STATE - استراتيجيات التدريس والتقييم ============
  const [teachingStrategies, setTeachingStrategies] = useState<TeachingStrategy[]>([]);
  const [assessmentMethods, setAssessmentMethods] = useState<AssessmentMethod[]>([]);
  const [outcomeMappings, setOutcomeMappings] = useState<OutcomeMapping[]>([]);
  const [isEditingMapping, setIsEditingMapping] = useState(false);
  const [currentMappingClo, setCurrentMappingClo] = useState<string | null>(null);
  const [mappingData, setMappingData] = useState<OutcomeMapping>({ 
    clo_id: "", 
    teaching_strategies: [], 
    assessment_methods: [] 
  });

  // ============ STATE - المراجع ============
  const [references, setReferences] = useState<CourseReference[]>([]);
  const [isAddingReference, setIsAddingReference] = useState(false);
  const [referenceFormData, setReferenceFormData] = useState<Partial<CourseReference>>({});
  const [editingReferenceId, setEditingReferenceId] = useState<number | null>(null);

  // ============ STATE - الضوابط ============
  const [policies, setPolicies] = useState<CoursePolicy[]>([]);
  const [isAddingPolicy, setIsAddingPolicy] = useState(false);
  const [policyFormData, setPolicyFormData] = useState<Partial<CoursePolicy>>({});
  const [editingPolicyId, setEditingPolicyId] = useState<number | null>(null);

  // ============ FIXED POLICIES ============
  const FIXED_POLICIES = [
    {
      policy_number: 1,
      title: "الحضور والغياب",
      content: "حضور المحاضرات إلزامي، ويعتبر الطالب غائباً إذا تجاوزت نسبة غيابه عن ٪25 من الساعات المحددة، ويُعد محروماً من دخول الاختبار النهائي."
    },
    {
      policy_number: 2,
      title: "الحضور المتأخر",
      content: "يعتبر الطالب متأخراً عن الفصل إذا لم يكن في الفصل بعد 10 دقائق من وقت بدء المحاضرة."
    },
    {
      policy_number: 3,
      title: "ضوابط الاختبار",
      content: "لا يُسمح لأي طالب دخول قاعة الاختبارات بعد مرور 30 دقيقة من وقت بدء الاختبار، ولا يُسمح له بمغادرة القاعة قبل مرور نصف وقت الاختبار."
    },
    {
      policy_number: 4,
      title: "التكليفات/ المهام والمشاريع",
      content: "يجب على الطالب تقديم الواجبات والمشاريع في الوقت المحدد، وإذا تأخر الطالب عن تسليم واجباته عن الموعد المحدد فسيفقد الدرجة المخصصة لذلك."
    },
    {
      policy_number: 5,
      title: "الغش",
      content: "الغش هو فعل احتيالي ينتج عنه إلغاء الاختبار النهائي للطالب وتطبق عليه العقوبات المنصوص عليها في نظام الطلاب الموحد (2008)."
    },
    {
      policy_number: 6,
      title: "التزوير وانتحال الهوية",
      content: "التزوير/ انتحال الهوية هو عمل احتيالي ينتج عنه إلغاء الاختبار النهائي للطالب، وتطبق عليه العقوبات المنصوص عليها في النظام الموحد لشئون الطلاب (2008)."
    },
    {
      policy_number: 7,
      title: "سياسات أخرى",
      content: "يتم التقيد الصارم باللوائح الرسمية الأكاديمية السارية ويجب على الطلاب الامتثال لجميع القواعد واللوائح الخاصة بالاختبارات."
    }
  ];

  // ============ CONSTANTS ============
  const MAX_COURSE_OUTCOMES = 8;

  const domainLabels = {
    Knowledge: "المعرفة والفهم",
    Intellectual: "المهارات الذهنية",
    Professional: "المهارات المهنية والعملية",
    General: "المهارات العامة"
  };

  const domainAbbreviations = {
    Knowledge: "a",
    Intellectual: "b",
    Professional: "c",
    General: "d"
  } as const;

  const domainColors = {
    Knowledge: "bg-blue-50 text-blue-700 border-blue-200",
    Intellectual: "bg-purple-50 text-purple-700 border-purple-200",
    Professional: "bg-green-50 text-green-700 border-green-200",
    General: "bg-amber-50 text-amber-700 border-amber-200"
  };

  // ============ HELPER FUNCTIONS ============
  const getCourseParts = () => {
    // الحصول على أجزاء المقرر من قاعدة البيانات
    // هذا سيتم تعديله حسب طريقة تخزين البيانات
    const parts = new Set<string>();
    topics.forEach(t => {
      if (t.hours > 0 || t.is_exam) {
        parts.add(t.part);
      }
    });
    return Array.from(parts);
  };

  // ✅ حماية من القيم الفارغة
  const getTotalOutcomeWeight = (): number => {
    return courseOutcomes.reduce((sum, o) => {
      return sum + safeWeight(o.weight); // ✅ استخدام الدالة الجديدة
    }, 0);
  };

  
  const getRemainingWeight = (): number => {
    const courseWeight = safeWeight(courseInfo?.weight); // ✅ استخدام الدالة الجديدة
    const totalWeight = getTotalOutcomeWeight();
    return courseWeight - totalWeight;
  };
  
  const getOutcomeCountByDomain = (domain: keyof typeof domainLabels): number => {
    return courseOutcomes.filter(o => o.domain === domain).length;
  };
  
  const canAddMoreOutcomes = (): boolean => {
    return courseOutcomes.length < MAX_COURSE_OUTCOMES;
  };
  
  const generateNextCode = (domain: keyof typeof domainLabels): string => {
    const prefix = domainAbbreviations[domain];
    const domainOutcomes = courseOutcomes.filter(o => o.domain === domain);
    
    if (domainOutcomes.length === 0) {
      return `${prefix}1`;
    }
    
    const numbers = domainOutcomes
      .map(o => parseInt(o.code.substring(1)))
      .filter(n => !isNaN(n));
    
    const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
    return `${prefix}${maxNumber + 1}`;
  };

  const getTotalAssessmentPercentage = () => {
    return assessments.reduce((sum, a) => sum + (a.percentage || 0), 0);
  };

  const getTopicsByPart = (part: string) => {
    return topics.filter(t => t.part === part);
  };

  const getTopicHours = (part: string) => {
    return getTopicsByPart(part).reduce((sum, t) => sum + (t.hours || 0), 0);
  };

  const getTopicWeekCount = (part: string) => {
    return getTopicsByPart(part).filter(t => !t.is_exam).length;
  };

  const getAssignmentsByPart = (part: string) => {
    return assignments.filter(a => a.part === part);
  };

  const getTotalAssignmentGrade = (part: string) => {
    return getAssignmentsByPart(part).reduce((sum, a) => sum + (a.grade || 0), 0);
  };

  // ============ HELPER FUNCTIONS ============

  /**
   * دالة آمنة لتحويل أي بيانات إلى array
   */
  const safeArray = (data: any): any[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (typeof data === 'object' && data.data && Array.isArray(data.data)) return data.data;
    return [];
  };
  
  /**
   * دالة آمنة جداً لمعالجة الـ strings
   * تتعامل مع جميع الحالات المحتملة
   */
  const safeString = (value: any, defaultValue: string = ''): string => {
    try {
      // إذا كانت undefined أو null
      if (value === null || value === undefined) {
        return defaultValue;
      }
  
      // إذا كانت بالفعل string
      if (typeof value === 'string') {
        return value.trim();
      }
  
      // إذا كانت رقم
      if (typeof value === 'number') {
        return String(value);
      }
  
      // إذا كانت boolean
      if (typeof value === 'boolean') {
        return value ? 'true' : 'false';
      }
  
      // إذا كانت object (احذر من استدعاء split عليها!)
      if (typeof value === 'object') {
        // حاول تحويلها إلى JSON string
        try {
          return JSON.stringify(value);
        } catch (e) {
          return defaultValue;
        }
      }
  
      // حالة افتراضية
      return defaultValue;
    } catch (error) {
      console.warn('Error in safeString:', error, 'value:', value);
      return defaultValue;
    }
  };
  
  /**
   * دالة آمنة لمعالجة الأرقام
   */
  const safeNumber = (value: any, defaultValue: number = 0): number => {
    try {
      if (value === null || value === undefined) return defaultValue;
      
      const num = Number(value);
      return isNaN(num) ? defaultValue : num;
    } catch (error) {
      console.warn('Error in safeNumber:', error);
      return defaultValue;
    }
  };
  
  /**
   * معالجة آمنة لـ exam_type
   */
  const safeExamType = (value: any): "midterm" | "final" | undefined => {
    try {
      const str = safeString(value, '').toLowerCase().trim();
      
      if (!str) return undefined;
      
      if (str === "midterm" || str === "نصفي" || str === "mid-term" || str === "mid_term") {
        return "midterm";
      }
      if (str === "final" || str === "نهائي" || str === "final-exam" || str === "final_exam") {
        return "final";
      }
      
      return undefined;
    } catch (error) {
      console.warn('Error in safeExamType:', error);
      return undefined;
    }
  };
  
  /**
   * معالجة آمنة لـ question_type
   */
  const safeQuestionType = (value: any): "MCQ" | "essay" => {
    try {
      const str = safeString(value, 'MCQ').toUpperCase().trim();
      
      if (str === "MCQ" || str === "MULTIPLE_CHOICE" || str === "اختيار من متعدد") {
        return "MCQ";
      }
      
      return "essay";
    } catch (error) {
      console.warn('Error in safeQuestionType:', error);
      return "essay";
    }
  };
  
  /**
   * معالجة آمنة لـ assignment_type
   */
  const safeAssignmentType = (value: any): "homework" | "project" | "presentation" | "quiz" | "other" => {
    try {
      const str = safeString(value, 'other').toLowerCase().trim().replace(/ /g, '_');
      
      const validTypes: Array<"homework" | "project" | "presentation" | "quiz" | "other"> = [
        "homework",
        "project",
        "presentation",
        "quiz",
        "other"
      ];
      
      if (validTypes.includes(str as any)) {
        return str as any;
      }
      
      return "other";
    } catch (error) {
      console.warn('Error in safeAssignmentType:', error);
      return "other";
    }
  };
  
  /**
   * معالجة آمنة لـ assessment_type
   */
  const safeAssessmentType = (value: any): "activities" | "quizzes" | "midterm_exam" | "final_exam" | "project" | "presentation" | "practical_exam" | "other" => {
    try {
      const str = safeString(value, 'other').toLowerCase().trim().replace(/ /g, '_').replace(/-/g, '_');
      
      const validTypes: Array<"activities" | "quizzes" | "midterm_exam" | "final_exam" | "project" | "presentation" | "practical_exam" | "other"> = [
        "activities",
        "quizzes",
        "midterm_exam",
        "final_exam",
        "project",
        "presentation",
        "practical_exam",
        "other"
      ];
      
      if (validTypes.includes(str as any)) {
        return str as any;
      }
      
      return "other";
    } catch (error) {
      console.warn('Error in safeAssessmentType:', error);
      return "other";
    }
  };
  
  /**
   * معالجة آمنة لـ reference_type
   */
  const safeReferenceType = (value: any): "main" | "support" | "electronic" => {
    try {
      const str = safeString(value, 'main').toLowerCase().trim();
      
      if (str === "main" || str === "رئيسي") return "main";
      if (str === "support" || str === "مساعد") return "support";
      if (str === "electronic" || str === "إلكتروني") return "electronic";
      
      return "main";
    } catch (error) {
      console.warn('Error in safeReferenceType:', error);
      return "main";
    }
  };
  
  /**
   * معالجة آمنة لـ domain
   */
  const safeDomain = (value: any): "Knowledge" | "Intellectual" | "Professional" | "General" => {
    try {
      const str = safeString(value, 'Knowledge').toLowerCase().trim();
      
      if (str === "knowledge" || str === "المعرفة والفهم") return "Knowledge";
      if (str === "intellectual" || str === "المهارات الذهنية") return "Intellectual";
      if (str === "professional" || str === "المهارات المهنية والعملية") return "Professional";
      if (str === "general" || str === "المهارات العامة") return "General";
      
      return "Knowledge";
    } catch (error) {
      console.warn('Error in safeDomain:', error);
      return "Knowledge";
    }
  };
  
  // ✅ دالة جديدة خاصة بالوزن فقط
  const safeWeight = (value: any): number => {
    if (value === null || value === undefined) return 0;
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };
  /**
   * معالج أخطاء عام
   */
  const handleApiError = (error: any, defaultMessage: string = "حدث خطأ") => {
    console.error("API Error:", error);
    
    if (error.response?.status === 404) {
      return `${defaultMessage}: البيانات غير موجودة (404)`;
    }
    if (error.response?.status === 500) {
      return "خطأ من الخادم، يرجى المحاولة لاحقاً (500)";
    }
    if (error.message === "Network Error") {
      return "فشل الاتصال بالخادم";
    }
    
    return defaultMessage;
  };

  // ============ EFFECTS - تحميل البيانات ============
  useEffect(() => {
    if (isOpen && course?.id) {
      // ✅ استدعاء الدالة الجديدة
      console.log("Loading description for course:", course.id);
      loadFullCourseData();
      loadCourseDescription();
    }
  }, [isOpen, course?.id]);

  useEffect(() => {
    if (!isOpen) {
      // تنظيف عند الإغلاق
      console.log("Closing dialog - cleaning up");
      setDescriptionText("");
      setCourseGoals([]);
      setNewGoal("");
      setIsAddingOutcome(false);
      setEditingGoalIndex(null);
      setDeleteConfirm(null);
      setActiveTab("info");
    }
  }, [isOpen]);

  useEffect(() => {
    if (descriptionText && typeof descriptionText !== 'string') {
      console.warn("Invalid descriptionText type:", typeof descriptionText);
      setDescriptionText('');
    }
  }, [descriptionText]);
  
  useEffect(() => {
    if (courseGoals && !Array.isArray(courseGoals)) {
      console.warn("Invalid courseGoals type:", typeof courseGoals);
      setCourseGoals([]);
    }
  }, [courseGoals]);

  useEffect(() => {
    console.log("Description text updated:", descriptionText);
    console.log("Course goals updated:", courseGoals);
  }, [descriptionText, courseGoals]);

  useEffect(() => {
    console.log("activeTab changed to:", activeTab);
  }, [activeTab]);
  
  useEffect(() => {
    console.log("descriptionText type:", typeof descriptionText);
    console.log("descriptionText value:", descriptionText);
  }, [descriptionText]);


  // ============ LAZY LOADING FUNCTIONS ============
  
  /**
   * جلب معلومات عامة (عند فتح Dialog)
   */
  const loadFullCourseData = async () => {
    if (!course?.id) return;
    
    setCourseInfoLoading(true);
    try {
      // ✅ استدعاء show endpoint - يرجع كل البيانات
      const response = await api.get(`/v1/courses/${course.id}`);
      
      if (response.data?.success && response.data?.data) {
        setCourseInfo(response.data.data);
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل تحميل معلومات المقرر",
        variant: "destructive"
      });
    } finally {
      setCourseInfoLoading(false);
    }
  };
  
  /**
   * جلب الوصف والأهداف
   */
  const loadCourseDescription = async () => {
    if (!course?.id) {
      console.log("No course ID");
      return;
    }
    
    try {
      console.log("Fetching description for course:", course.id);
      
      const response = await api.get(`/v1/courses/${course.id}/description`);
      
      console.log("API Response:", response.data);
      
      // ✅ تأكد 100% أنك تأخذ string و array فقط
      if (response.data?.success && response.data?.description) {
        const desc = response.data.description;
        
        // ✅ خذ الوصف - تأكد أنه string
        const descriptionValue = desc.description && typeof desc.description === 'string' 
          ? desc.description 
          : '';
        
        // ✅ خذ الأهداف - تأكد أنها array
        const goalsValue = Array.isArray(desc.goals) ? desc.goals : [];
        
        console.log("Setting description:", descriptionValue);
        console.log("Setting goals:", goalsValue);
        
        setDescriptionText(descriptionValue);
        setCourseGoals(goalsValue);
      } else {
        console.log("No description found");
        setDescriptionText("");
        setCourseGoals([]);
      }
    } catch (error: any) {
      console.error("Error loading description:", error);
      
      if (error.response?.status !== 404) {
        toast({
          title: "خطأ",
          description: "تعذر تحميل البيانات",
          variant: "destructive"
        });
      }
      
      setDescriptionText("");
      setCourseGoals([]);
    }
  };
  
  /**
   *  جلب مخرجات تعلم البرنامج
   */
  const loadProgramOutcomes = async () => {
    if (!courseInfo?.program?.id) {
      console.warn("No program ID available");
      return;
    }
  
    try {
      const res = await api.get(`/v1/program-learning-outcomes/${courseInfo.program.id}`);
      const plosData = safeArray(res.data?.data || res.data).map((plo: any) => ({
        plo_id: safeNumber(plo.plo_id),
        code: safeString(plo.code),
        domain: safeDomain(plo.domain),
        description: safeString(plo.description),
        weight: safeWeight(plo.weight), // ✅ هنا
        order: safeNumber(plo.order, 0),
        is_active: Boolean(plo.is_active)
      })) as ProgramLearningOutcome[];
      
      setProgramOutcomes(plosData);
    } catch (error) {
      console.error("Failed to load program outcomes:", error);
      setProgramOutcomes([]);
    }
  };

  /**
   * جلب مخرجات التعلم
   */
  const loadOutcomes = async () => {
    if (!courseInfo || loadedTabs.has("outcomes")) return;
    setLoading(true);
    
    try {
      // ✅ جلب مخرجات البرنامج أولاً
      await loadProgramOutcomes();
  
      // ✅ ثم جلب مخرجات المقرر
      const closRes = await api.get(`/v1/courses/${courseInfo.id}/learning-outcomes`);
      const closData = safeArray(closRes.data?.data || closRes.data).map((clo: any) => ({
        clo_id: safeNumber(clo.clo_id),
        code: safeString(clo.code),
        domain: safeDomain(clo.domain),
        description: safeString(clo.description),
        weight: safeNumber(clo.weight, 0), // ✅ تأكد من أنه رقم
        plo_id: safeNumber(clo.plo_id) || undefined,
        plo_weight: safeNumber(clo.plo_weight, 0),
        order: safeNumber(clo.order, 0),
        is_active: Boolean(clo.is_active)
      })) as CourseLearningOutcome[];
      
      setCourseOutcomes(closData);
      setLoadedTabs(new Set(loadedTabs).add("outcomes"));
      console.log("Course outcomes loaded:", closData.length);
    } catch (error) {
      console.error("Failed to load outcomes:", error);
      toast({
        title: "خطأ",
        description: "فشل تحميل المخرجات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * جلب استراتيجيات التدريس والتقييم
   */
  const loadStrategies = async () => {
    if (!course || loadedTabs.has("strategies")) return;
    setLoading(true);
    
    try {
      // جلب الاستراتيجيات
      const strategiesRes = await api.get(`/v1/teaching-strategies`);
      const strategiesData = safeArray(strategiesRes.data).map((s: any) => ({
        id: safeNumber(s.id),
        name: safeString(s.name),
        category: safeString(s.category),
        is_active: Boolean(s.is_active)
      })) as TeachingStrategy[];
      setTeachingStrategies(strategiesData);
  
      // جلب طرق التقييم
      const methodsRes = await api.get(`/v1/assessment-methods`);
      const methodsData = safeArray(methodsRes.data).map((m: any) => ({
        id: safeNumber(m.id),
        name: safeString(m.name),
        category: safeString(m.category),
        is_active: Boolean(m.is_active)
      })) as AssessmentMethod[];
      setAssessmentMethods(methodsData);
  
      setLoadedTabs(new Set(loadedTabs).add("strategies"));
    } catch (error) {
      console.warn("Failed to load strategies:", error);
      toast({
        title: "خطأ",
        description: "فشل تحميل الاستراتيجيات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * جلب المحتوى والأسئلة
   */
  const loadContent = async () => {
    if (!course || loadedTabs.has("content")) return;
    setLoading(true);
    
    try {
      // جلب المواضيع
      const topicsRes = await api.get(`/v1/courses/${course.id}/topics`);
      const topicsData = safeArray(topicsRes.data);
      
      const processedTopics: CourseTopic[] = topicsData.map((topic: any) => ({
        topic_id: safeNumber(topic.topic_id),
        part: safeString(topic.part, "نظري"),
        week: safeNumber(topic.week),
        unit_name: safeString(topic.unit_name),
        subtopics: safeArray(topic.subtopics).map((s: any) => safeString(s)),
        outcome_ids: safeArray(topic.outcome_ids).map((id: any) => safeString(id)),
        hours: safeNumber(topic.hours),
        is_exam: Boolean(topic.is_exam),
        exam_type: safeExamType(topic.exam_type)
      }));
      
      setTopics(processedTopics);
      
      if (processedTopics.length > 0) {
        const firstPart = processedTopics[0]?.part || "نظري";
        setActivePart(firstPart);
      }
  
      // جلب الأسئلة
      const allQuestions: TopicQuestion[] = [];
      for (const topic of topicsData) {
        try {
          const questionsRes = await api.get(`/v1/topics/${topic.topic_id}/questions`);
          const questionsData = safeArray(questionsRes.data);
          
          const processedQuestions: TopicQuestion[] = questionsData.map((q: any) => ({
            question_id: safeNumber(q.question_id),
            topic_id: safeNumber(q.topic_id),
            subtopic: safeString(q.subtopic),
            question_text: safeString(q.question_text),
            question_type: safeQuestionType(q.question_type),
            difficulty_level: safeNumber(q.difficulty_level, 1),
            clo_code: safeString(q.clo_code),
            options: safeArray(q.options).map((opt: any) => ({
              id: safeString(opt.id),
              text: safeString(opt.text),
              is_correct: Boolean(opt.is_correct)
            })),
            correct_answer: safeString(q.correct_answer),
            is_active: Boolean(q.is_active)
          }));
          
          allQuestions.push(...processedQuestions);
        } catch (error) {
          console.warn(`Failed to load questions for topic ${topic.topic_id}:`, error);
        }
      }
      setQuestions(allQuestions);
  
      setLoadedTabs(new Set(loadedTabs).add("content"));
    } catch (error) {
      console.warn("Failed to load content:", error);
      toast({
        title: "خطأ",
        description: "فشل تحميل المحتوى",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * جلب الأنشطة والتقييمات
   */
  const loadActivities = async () => {
    if (!course || loadedTabs.has("activities")) return;
    setLoading(true);
    
    try {
      // جلب التكليفات
      const assignmentsRes = await api.get(`/v1/courses/${course.id}/assignments`);
      const assignmentsData = safeArray(assignmentsRes.data);
      
      const processedAssignments: CourseAssignment[] = assignmentsData.map((a: any) => ({
        assignment_id: safeNumber(a.assignment_id),
        part: safeString(a.part),
        title: safeString(a.title),
        description: safeString(a.description),
        week: safeNumber(a.week),
        grade: safeNumber(a.grade),
        clo_ids: safeArray(a.clo_ids).map((id: any) => safeString(id)),
        assignment_type: safeAssignmentType(a.assignment_type),
        is_mandatory: Boolean(a.is_mandatory)
      }));
      
      setAssignments(processedAssignments);
  
      // جلب التقييمات
      const assessmentsRes = await api.get(`/v1/courses/${course.id}/assessments`);
      const assessmentsData = safeArray(assessmentsRes.data);
      
      const processedAssessments: CourseAssessment[] = assessmentsData.map((a: any) => ({
        assessment_id: safeNumber(a.assessment_id),
        name: safeString(a.name),
        week: safeNumber(a.week),
        grade: safeNumber(a.grade),
        weight: safeNumber(a.weight),
        percentage: safeNumber(a.percentage),
        clo_ids: safeArray(a.clo_ids).map((id: any) => safeString(id)),
        assessment_type: safeAssessmentType(a.assessment_type)
      }));
      
      setAssessments(processedAssessments);
  
      setLoadedTabs(new Set(loadedTabs).add("activities"));
    } catch (error) {
      console.warn("Failed to load activities:", error);
      toast({
        title: "خطأ",
        description: "فشل تحميل الأنشطة",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * جلب المصادر
   */
  const loadResources = async () => {
    if (!course || loadedTabs.has("resources")) return;
    setLoading(true);
    
    try {
      const referencesRes = await api.get(`/v1/courses/${course.id}/references`);
      const referencesData = safeArray(referencesRes.data);
      
      const processedReferences: CourseReference[] = referencesData.map((r: any) => ({
        reference_id: safeNumber(r.reference_id),
        type: safeReferenceType(r.type),
        author: safeString(r.author),
        year: safeString(r.year),
        title: safeString(r.title),
        edition: safeString(r.edition),
        publisher: safeString(r.publisher),
        country: safeString(r.country),
        url: safeString(r.url)
      }));
      
      setReferences(processedReferences);
      setLoadedTabs(new Set(loadedTabs).add("resources"));
    } catch (error) {
      console.warn("Failed to load resources:", error);
      toast({
        title: "خطأ",
        description: "فشل تحميل المصادر",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * جلب الضوابط
   */
  const loadPolicies = async () => {
    if (!course || loadedTabs.has("policies")) return;
    setLoading(true);
    
    try {
      const policiesRes = await api.get(`/v1/courses/${course.id}/policies`);
      const policiesData = safeArray(policiesRes.data);
      
      const processedPolicies: CoursePolicy[] = policiesData.map((p: any) => ({
        policy_id: safeNumber(p.policy_id),
        policy_number: safeNumber(p.policy_number),
        title: safeString(p.title),
        content: safeString(p.content),
        is_fixed: Boolean(p.is_fixed)
      }));
      
      setPolicies(processedPolicies);
      setLoadedTabs(new Set(loadedTabs).add("policies"));
    } catch (error) {
      console.warn("Failed to load policies:", error);
      toast({
        title: "خطأ",
        description: "فشل تحميل الضوابط",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // ============ HANDLERS - وصف المقرر ============

  const handleSaveDescription = async () => {
    if (!course) return;

    const wordCount = countWords(descriptionText);
    
    if (wordCount < 80 || wordCount > 100) {
      toast({
        title: "خطأ",
        description: `الوصف: ${wordCount} كلمة (80-100 مطلوب)`,
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      await api.put(`/v1/courses/${course.id}/description`, {
        description: descriptionText.trim()
      });

      toast({
        title: "نجح ✓",
        description: "تم حفظ الوصف"
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل الحفظ",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddGoal = () => {
    if (!newGoal.trim()) {
      toast({
        title: "خطأ",
        description: "أدخل نص الهدف",
        variant: "destructive"
      });
      return;
    }

    if (courseGoals.length >= 6) {
      toast({
        title: "خطأ",
        description: "الحد الأقصى 6 أهداف",
        variant: "destructive"
      });
      return;
    }

    setCourseGoals([...courseGoals, newGoal.trim()]);
    setNewGoal("");
    setIsAddingOutcome(false);
    
    toast({
      title: "تم",
      description: `أضفت هدف (${courseGoals.length + 1}/4-6)`,
    });
  };

  const saveGoalsToDatabase = async (goals: string[]) => {
    if (!course) return;
  
    // ✅ التحقق من صحة الأهداف
    if (goals.length < 4 || goals.length > 6) {
      toast({
        title: "خطأ في الأهداف",
        description: `عدد الأهداف يجب أن يكون 4-6 (الحالي: ${goals.length})`,
        variant: "destructive"
      });
      return;
    }
  
    setSaving(true);
    try {
      // ✅ إرسال الأهداف فقط
      await api.put(`/v1/courses/${course.id}/goals`, {
        goals: goals
        // ❌ لا تُرسل الوصف
      });
  
      toast({
        title: "نجح ✓",
        description: `تم حفظ ${goals.length} أهداف بنجاح`
      });
      
    } catch (error) {
      console.error("Error saving goals:", error);
      toast({
        title: "خطأ في الحفظ",
        description: error.response?.data?.message || "فشل حفظ الأهداف",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  
  const handleUpdateGoal = (index: number, value: string) => {
    // ✅ تأكد أن القيمة string
    if (typeof value !== 'string') {
      console.warn("Invalid goal value type:", typeof value);
      return;
    }
  
    const updated = [...courseGoals];
    updated[index] = value;
    setCourseGoals(updated);
  };
  
  const handleDeleteGoal = (index: number) => {
    console.log("Delete button clicked for index:", index);
    
    if (courseGoals.length <= 4) {
      toast({
        title: "خطأ",
        description: "يجب 4 أهداف على الأقل",
        variant: "destructive"
      });
      return;
    }
  
    // ✅ افتح Dialog التأكيد
    console.log("Opening delete confirmation for index:", index);
    setDeleteConfirm(index);
  };
  
  const confirmDelete = async (index: number) => {
    if (!course) return;
  
    console.log("Confirming delete for index:", index);
  
    setSaving(true);
    try {
      const updated = courseGoals.filter((_, i) => i !== index);
      
      // ✅ حفظ في Database فوراً
      await api.put(`/v1/courses/${course.id}/goals`, {
        goals: updated.map(g => g.trim())
      });
  
      // ✅ حدّث الـ State بعد النجاح
      setCourseGoals(updated);
      setDeleteConfirm(null);
  
      toast({
        title: "تم ✓",
        description: "تم حذف الهدف",
      });
    } catch (error) {
      console.error("Error deleting goal:", error);
      setDeleteConfirm(null);
      
      toast({
        title: "خطأ",
        description: "فشل حذف الهدف",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const countWords = (text: string): number => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const handleSaveGoals = async () => {
    if (!course) return;

    if (courseGoals.length < 4 || courseGoals.length > 6) {
      toast({
        title: "خطأ",
        description: `الأهداف: ${courseGoals.length} (4-6 مطلوب)`,
        variant: "destructive"
      });
      return;
    }

    const errors: string[] = [];
    courseGoals.forEach((goal, i) => {
      if (!goal.trim()) errors.push(`الهدف ${i + 1}: فارغ`);
      if (countWords(goal) < 3) errors.push(`الهدف ${i + 1}: أقل من 3 كلمات`);
    });

    if (errors.length > 0) {
      toast({
        title: "أخطاء",
        description: errors.join('\n'),
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      await api.put(`/v1/courses/${course.id}/goals`, {
        goals: courseGoals.map(g => g.trim())
      });

      toast({
        title: "نجح ✓",
        description: `تم حفظ ${courseGoals.length} أهداف`
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل الحفظ",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  // ============ HANDLERS - مخرجات تعلم المقرر ============
  const handleAddOutcome = (domain: keyof typeof domainLabels) => {
    // ✅ التحقق فقط من الحد الأقصى الكلي
    if (!canAddMoreOutcomes()) {
      toast({
        title: "تنبيه",
        description: `لا يمكن إضافة أكثر من ${MAX_COURSE_OUTCOMES} مخرجات تعلم للمقرر`,
        variant: "destructive"
      });
      return;
    }
  
    const code = generateNextCode(domain);
  
    setOutcomeFormData({
      code,
      domain,
      description: "",
      weight: 0,
      order: courseOutcomes.length + 1,
      is_active: true
    });
    setEditingOutcomeId(null);
    setIsAddingOutcome(true);
  };
  
  const handleSaveOutcome = async () => {
    if (!courseInfo || !outcomeFormData.description || outcomeFormData.weight === undefined) {
      toast({
        title: "تنبيه",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }
  
    if (outcomeFormData.description.length < 10) {
      toast({
        title: "تنبيه",
        description: "الوصف يجب أن يكون 10 أحرف على الأقل",
        variant: "destructive"
      });
      return;
    }
  
    if (!outcomeFormData.plo_id) {
      toast({
        title: "تنبيه",
        description: "يجب ربط المخرج بمخرج تعلم البرنامج",
        variant: "destructive"
      });
      return;
    }
  
    const currentWeight = courseOutcomes
      .filter(o => o.clo_id !== editingOutcomeId)
      .reduce((sum, o) => sum + safeWeight(o.weight), 0); // ✅ استخدام الدالة الجديدة
    
    const newWeight = safeWeight(outcomeFormData.weight); // ✅ استخدام الدالة الجديدة
    const totalWeight = currentWeight + newWeight;
    const courseWeight = safeWeight(courseInfo.weight); // ✅ استخدام الدالة الجديدة
  
    if (totalWeight > courseWeight) {
      toast({
        title: "خطأ في الوزن",
        description: `مجموع الأوزان سيصبح ${totalWeight.toFixed(2)}%. يجب ألا يتجاوز وزن المقرر ${courseWeight.toFixed(2)}%`,
        variant: "destructive"
      });
      return;
    }
  
    setSaving(true);
    try {
      const dataToSend = {
        domain: outcomeFormData.domain,
        description: outcomeFormData.description,
        weight: newWeight,
        plo_id: outcomeFormData.plo_id,
        order: outcomeFormData.order || (courseOutcomes.length + 1),
        is_active: outcomeFormData.is_active ?? true
      };
  
      let savedOutcome;
  
      if (editingOutcomeId) {
        const res = await api.put(
          `/v1/courses/${courseInfo.id}/learning-outcomes/${editingOutcomeId}`, 
          dataToSend
        );
        savedOutcome = res.data.data;
        
        setCourseOutcomes(courseOutcomes.map(o => 
          o.clo_id === editingOutcomeId ? savedOutcome : o
        ));
        
        toast({
          title: "نجح",
          description: "تم تحديث المخرج بنجاح"
        });
      } else {
        const res = await api.post(
          `/v1/courses/${courseInfo.id}/learning-outcomes`, 
          dataToSend
        );
        savedOutcome = res.data.data;
        
        setCourseOutcomes([...courseOutcomes, savedOutcome]);
        
        toast({
          title: "نجح",
          description: "تم إضافة مخرج جديد بنجاح"
        });
      }
  
      setIsAddingOutcome(false);
      setOutcomeFormData({});
      setEditingOutcomeId(null);
      
    } catch (error: any) {
      console.error("Error saving outcome:", error);
      const errorMsg = error?.response?.data?.message || "فشل العملية";
      toast({
        title: "خطأ",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  
  const handleDeleteOutcome = async (id: number) => {
    if (!courseInfo || !confirm("هل أنت متأكد من الحذف؟")) return;
  
    setSaving(true);
    try {
      await api.delete(`/v1/courses/${courseInfo.id}/learning-outcomes/${id}`);
      setCourseOutcomes(courseOutcomes.filter(o => o.clo_id !== id));
      
      toast({
        title: "نجح",
        description: "تم حذف المخرج بنجاح"
      });
    } catch (error: any) {
      console.error("Error:", error);
      const errorMsg = error?.response?.data?.message || "فشل الحذف";
      toast({
        title: "خطأ",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  // ============ HANDLERS - المواضيع ============
  const handleAddTopic = () => {
    setTopicFormData({
      part: activePart,
      week: 1,
      unit_name: "",
      subtopics: [""],
      hours: 2,
      is_exam: false,
      outcome_ids: []
    });
    setEditingTopicId(null);
    setIsAddingTopic(true);
  };

  const handleSaveTopic = async () => {
    if (!course || !topicFormData.unit_name || topicFormData.week === undefined) return;
  
    setSaving(true);
    try {
      if (editingTopicId) {
        await api.put(`/v1/courses/${course.id}/topics/${editingTopicId}`, topicFormData);
        
        // ✅ تحديث محلي
        setTopics(topics.map(t => 
          t.topic_id === editingTopicId ? { ...t, ...topicFormData } as CourseTopic : t
        ));
      } else {
        const res = await api.post(`/v1/courses/${course.id}/topics`, topicFormData);
        
        // ✅ إضافة الموضوع الجديد محلياً
        if (res.data?.topic_id) {
          setTopics([...topics, res.data as CourseTopic]);
        }
      }
  
      setIsAddingTopic(false);
      toast({
        title: "نجح",
        description: editingTopicId ? "تم تحديث الموضوع" : "تم إضافة موضوع جديد"
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "خطأ",
        description: "فشل العملية",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTopic = async (id: number) => {
    if (!course || !confirm("هل أنت متأكد؟")) return;
  
    setSaving(true);
    try {
      await api.delete(`/v1/courses/${course.id}/topics/${id}`);
      
      // ✅ تحديث محلي
      setTopics(topics.filter(t => t.topic_id !== id));
      setQuestions(questions.filter(q => q.topic_id !== id));
      
      toast({
        title: "نجح",
        description: "تم حذف الموضوع"
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "خطأ",
        description: "فشل الحذف",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  // ============ HANDLERS - الأسئلة ============
  const handleAddQuestion = (topicId: number) => {
    setSelectedTopicForQuestion(topicId);
    setQuestionFormData({
      question_id: 0,
      topic_id: topicId,
      subtopic: "",
      question_text: "",
      question_type: "MCQ",
      difficulty_level: 1,
      clo_code: "",
      options: [
        { id: "1", text: "", is_correct: false },
        { id: "2", text: "", is_correct: false },
        { id: "3", text: "", is_correct: false },
        { id: "4", text: "", is_correct: false }
      ],
      is_active: true
    } as any);
    setIsAddingQuestion(true);
  };
  
  const handleSaveQuestion = async () => {
    if (!selectedTopicForQuestion || !questionFormData.question_text?.trim()) {
      toast({
        title: "تحذير",
        description: "أدخل نص السؤال",
        variant: "destructive"
      });
      return;
    }
  
    if (questionFormData.question_type === "MCQ") {
      const hasCorrectAnswer = questionFormData.options?.some(o => o.is_correct);
      if (!hasCorrectAnswer) {
        toast({
          title: "تحذير",
          description: "يجب تحديد إجابة صحيحة واحدة",
          variant: "destructive"
        });
        return;
      }
    }
  
    setSaving(true);
    try {
      const payload = {
        topic_id: selectedTopicForQuestion,
        subtopic: questionFormData.subtopic || "",
        question_text: questionFormData.question_text,
        question_type: questionFormData.question_type,
        difficulty_level: questionFormData.difficulty_level || 1,
        clo_code: questionFormData.clo_code || "",
        options: questionFormData.question_type === "MCQ" ? questionFormData.options : null,
        correct_answer: questionFormData.question_type === "essay" ? questionFormData.correct_answer : null,
        is_active: true
      };
  
      const res = await api.post(`/v1/topics/${selectedTopicForQuestion}/questions`, payload);
      
      // ✅ إضافة محلياً
      if (res.data?.question_id) {
        setQuestions([...questions, res.data as TopicQuestion]);
      }
  
      setIsAddingQuestion(false);
      setSelectedTopicForQuestion(null);
      
      toast({
        title: "نجح",
        description: "تم إضافة السؤال"
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "خطأ",
        description: "فشل حفظ السؤال",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  
  const handleDeleteQuestion = async (id: number) => {
    if (!selectedTopicForQuestion || !confirm("هل أنت متأكد؟")) return;
  
    setSaving(true);
    try {
      await api.delete(`/v1/topics/${selectedTopicForQuestion}/questions/${id}`);
      
      // ✅ تحديث محلي
      setQuestions(questions.filter(q => q.question_id !== id));
      
      toast({
        title: "نجح",
        description: "تم حذف السؤال"
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "خطأ",
        description: "فشل الحذف",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  // ============ HANDLERS - التكليفات ============
  const handleAddAssignment = () => {
    setAssignmentFormData({
      part: activePart,
      title: "",
      week: 1,
      grade: 0,
      clo_ids: [],
      assignment_type: "homework",
      is_mandatory: true
    });
    setEditingAssignmentId(null);
    setIsAddingAssignment(true);
  };

  const handleSaveAssignment = async () => {
    if (!course || !assignmentFormData.title) return;
  
    setSaving(true);
    try {
      if (editingAssignmentId) {
        await api.put(`/v1/courses/${course.id}/assignments/${editingAssignmentId}`, assignmentFormData);
        
        setAssignments(assignments.map(a => 
          a.assignment_id === editingAssignmentId 
            ? { ...a, ...assignmentFormData } as CourseAssignment 
            : a
        ));
      } else {
        const res = await api.post(`/v1/courses/${course.id}/assignments`, assignmentFormData);
        
        if (res.data?.assignment_id) {
          setAssignments([...assignments, res.data as CourseAssignment]);
        }
      }
  
      setIsAddingAssignment(false);
      toast({
        title: "نجح",
        description: editingAssignmentId ? "تم التحديث" : "تم الإضافة"
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "خطأ",
        description: "فشل العملية",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAssignment = async (id: number) => {
    if (!course || !confirm("هل أنت متأكد؟")) return;
  
    setSaving(true);
    try {
      await api.delete(`/v1/courses/${course.id}/assignments/${id}`);
      
      setAssignments(assignments.filter(a => a.assignment_id !== id));
      
      toast({
        title: "نجح",
        description: "تم الحذف"
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "خطأ",
        description: "فشل الحذف",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  // ============ HANDLERS - التقييمات ============
  const handleAddAssessment = () => {
    setAssessmentFormData({
      name: "",
      week: 0,
      grade: 0,
      weight: 0,
      percentage: 0,
      clo_ids: [],
      assessment_type: "activities"
    });
    setEditingAssessmentId(null);
    setIsAddingAssessment(true);
  };

  const handleSaveAssessment = async () => {
    if (!course || !assessmentFormData.name) return;
  
    setSaving(true);
    try {
      if (editingAssessmentId) {
        await api.put(`/v1/courses/${course.id}/assessments/${editingAssessmentId}`, assessmentFormData);
        
        setAssessments(assessments.map(a => 
          a.assessment_id === editingAssessmentId 
            ? { ...a, ...assessmentFormData } as CourseAssessment 
            : a
        ));
      } else {
        const res = await api.post(`/v1/courses/${course.id}/assessments`, assessmentFormData);
        
        if (res.data?.assessment_id) {
          setAssessments([...assessments, res.data as CourseAssessment]);
        }
      }
  
      setIsAddingAssessment(false);
      toast({
        title: "نجح",
        description: editingAssessmentId ? "تم التحديث" : "تم الإضافة"
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "خطأ",
        description: "فشل العملية",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAssessment = async (id: number) => {
    if (!course || !confirm("هل أنت متأكد؟")) return;
  
    setSaving(true);
    try {
      await api.delete(`/v1/courses/${course.id}/assessments/${id}`);
      
      setAssessments(assessments.filter(a => a.assessment_id !== id));
      
      toast({
        title: "نجح",
        description: "تم الحذف"
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "خطأ",
        description: "فشل الحذف",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  // ============ HANDLERS - المراجع ============
  const handleAddReference = () => {
    setReferenceFormData({
      type: "main",
      title: "",
      author: "",
      year: undefined,
      edition: "",
      publisher: "",
      country: ""
    });
    setEditingReferenceId(null);
    setIsAddingReference(true);
  };

  const handleSaveReference = async () => {
    if (!course || !referenceFormData.title) return;
  
    setSaving(true);
    try {
      if (editingReferenceId) {
        await api.put(`/v1/courses/${course.id}/references/${editingReferenceId}`, referenceFormData);
        
        setReferences(references.map(r => 
          r.reference_id === editingReferenceId 
            ? { ...r, ...referenceFormData } as CourseReference 
            : r
        ));
      } else {
        const res = await api.post(`/v1/courses/${course.id}/references`, referenceFormData);
        
        if (res.data?.reference_id) {
          setReferences([...references, res.data as CourseReference]);
        }
      }
  
      setIsAddingReference(false);
      toast({
        title: "نجح",
        description: editingReferenceId ? "تم التحديث" : "تم الإضافة"
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "خطأ",
        description: "فشل العملية",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteReference = async (id: number) => {
    if (!course || !confirm("هل أنت متأكد؟")) return;
  
    setSaving(true);
    try {
      await api.delete(`/v1/courses/${course.id}/references/${id}`);
      
      setReferences(references.filter(r => r.reference_id !== id));
      
      toast({
        title: "نجح",
        description: "تم الحذف"
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "خطأ",
        description: "فشل الحذف",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  // ============ HANDLERS - الضوابط ============
  const handleAddPolicy = () => {
    setPolicyFormData({
      policy_number: (policies.filter(p => !p.is_fixed).length || 0) + 8,
      title: "",
      content: "",
      is_fixed: false
    });
    setEditingPolicyId(null);
    setIsAddingPolicy(true);
  };

  const handleSavePolicy = async () => {
    if (!course || !policyFormData.title || !policyFormData.content) return;
  
    setSaving(true);
    try {
      if (editingPolicyId) {
        await api.put(`/v1/courses/${course.id}/policies/${editingPolicyId}`, policyFormData);
        
        setPolicies(policies.map(p => 
          p.policy_id === editingPolicyId 
            ? { ...p, ...policyFormData } as CoursePolicy 
            : p
        ));
      } else {
        const res = await api.post(`/v1/courses/${course.id}/policies`, policyFormData);
        
        if (res.data?.policy_id) {
          setPolicies([...policies, res.data as CoursePolicy]);
        }
      }
  
      setIsAddingPolicy(false);
      toast({
        title: "نجح",
        description: editingPolicyId ? "تم التحديث" : "تم الإضافة"
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "خطأ",
        description: "فشل العملية",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePolicy = async (id: number) => {
    if (!course || !confirm("هل أنت متأكد؟")) return;
  
    setSaving(true);
    try {
      await api.delete(`/v1/courses/${course.id}/policies/${id}`);
      
      setPolicies(policies.filter(p => p.policy_id !== id));
      
      toast({
        title: "نجح",
        description: "تم الحذف"
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "خطأ",
        description: "فشل الحذف",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  // ============ HANDLERS - Mapping ============
  const handleEditMapping = (cloCode: string) => {
    const mapping = outcomeMappings.find(m => m.clo_id === cloCode);
    setCurrentMappingClo(cloCode);
    setMappingData(mapping || {
      clo_id: cloCode,
      teaching_strategies: [],
      assessment_methods: []
    });
    setIsEditingMapping(true);
  };

  const handleSaveMapping = async () => {
    if (!course || !currentMappingClo) return;
  
    setSaving(true);
    try {
      const existingMapping = outcomeMappings.find(m => m.clo_id === currentMappingClo);
      
      if (existingMapping) {
        // تحديث
        await api.put(
          `/v1/courses/${course.id}/outcome-mappings/${currentMappingClo}`, 
          mappingData
        );
      } else {
        // إضافة
        await api.post(
          `/v1/courses/${course.id}/outcome-mappings`, 
          mappingData
        );
      }
  
      // ✅ تحديث محلي
      const updatedMappings = outcomeMappings.filter(m => m.clo_id !== currentMappingClo);
      updatedMappings.push(mappingData);
      setOutcomeMappings(updatedMappings);
  
      setIsEditingMapping(false);
      toast({
        title: "نجح",
        description: "تم حفظ الربط"
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "خطأ",
        description: "فشل الحفظ",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  /**
   * معالج تغيير التبويبات مع Lazy Loading
   */
  const handleTabChange = async (newTab: string) => {
    // منع التبديل أثناء التحميل
    if (loading) {
      toast({
        title: "جاري التحميل",
        description: "يرجى الانتظار حتى انتهاء تحميل البيانات الحالية",
      });
      return;
    }
  
    // إذا كان التبويب مُحمّل بالفعل، غيّر مباشرة
    if (loadedTabs.has(newTab)) {
      setActiveTab(newTab);
      return;
    }
  
    // جلب البيانات حسب التبويب
    switch(newTab) {
      case "description":
        await loadCourseDescription();
        break;
      case "outcomes":
        await loadOutcomes();
        break;
      case "strategies":
        await loadStrategies();
        break;
      case "content":
        await loadContent();
        break;
      case "activities":
        await loadActivities();
        break;
      case "resources":
        await loadResources();
        break;
      case "policies":
        await loadPolicies();
        break;
      default:
        break;
    }
  
    // تغيير التبويب بعد انتهاء التحميل
    setActiveTab(newTab);
  };

  // ✅ الصحيح
  if (!course || !course.id) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>خطأ</DialogTitle>
            <DialogDescription>لم يتم اختيار مقرر</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }
  
  // ✅ للتحميل
  if (loading || courseInfoLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>جاري التحميل</DialogTitle>
            <DialogDescription>يرجى الانتظار...</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center gap-2 py-8">
            <Loader2 className="w-5 h-5 animate-spin" />
            <p>جاري تحميل بيانات المقرر...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
  
  // ✅ للخطأ
  if (!courseInfo) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              خطأ
            </DialogTitle>
            <DialogDescription className="text-red-500">
              فشل تحميل بيانات المقرر. يرجى المحاولة لاحقاً.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-full h-[95vh] p-0 gap-0 flex flex-col overflow-hidden" dir="rtl">
        
        {/* ==================== HEADER ==================== */}
        <DialogHeader className="p-4 md:p-6 border-b bg-gradient-to-r from-indigo-50 to-blue-50 shrink-0" dir="rtl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="bg-indigo-100 p-3 rounded-xl shrink-0">
                <Target className="w-6 h-6 text-indigo-700" />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-xl md:text-2xl text-slate-800 flex items-center gap-2 flex-wrap">
                  توصيف المقرر ومخرجات التعلم
                  <Badge variant="outline" className="bg-white font-mono">{courseInfo.course_code}</Badge>
                </DialogTitle>
                <DialogDescription className="text-base mt-1.5 text-slate-600">
                  {courseInfo.course_name} • {courseInfo.credit_hours} ساعات معتمدة
                </DialogDescription>
              </div>
            </div>
            
            {/* Parts Toggle */}
            {getCourseParts().length > 1 && (
              <div className="flex bg-white p-1 rounded-lg border shadow-sm w-fit overflow-x-auto">
                {getCourseParts().map((part) => (
                  <Button
                    key={part}
                    variant={activePart === part ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "px-4 md:px-6 rounded-md transition-all whitespace-nowrap",
                      activePart === part && "bg-indigo-600 text-white shadow-sm"
                    )}
                    onClick={() => setActivePart(part)}
                  >
                    {part}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-white p-2 rounded-lg border">
              <div className="text-slate-500 mb-1">إجمالي المخرجات</div>
              <div className="font-bold text-lg text-indigo-600">{courseOutcomes.length}</div>
            </div>
            <div className="bg-white p-2 rounded-lg border">
              <div className="text-slate-500 mb-1">مجموع الأوزان</div>
              <div className={cn("font-bold text-lg", getTotalOutcomeWeight() === courseInfo.weight ? "text-green-600" : "text-amber-600")}>
                {getTotalOutcomeWeight()}%
              </div>
            </div>
            <div className="bg-white p-2 rounded-lg border">
              <div className="text-slate-500 mb-1">نسب التقييم</div>
              <div className={cn("font-bold text-lg", getTotalAssessmentPercentage() === 100 ? "text-green-600" : "text-red-600")}>
                {getTotalAssessmentPercentage()}%
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* ==================== TABS ==================== */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden" dir="rtl">
          
          {/* Tabs List */}
          <div className="border-b bg-slate-50 px-4 shrink-0 overflow-x-auto">
            <TabsList className="bg-transparent h-auto p-0 gap-1 w-full md:w-auto inline-flex">
              <TabsTrigger value="info" disabled={loading} onClick={() => handleTabChange("info")} className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-t-lg border-b-2 border-transparent data-[state=active]:border-indigo-600 whitespace-nowrap">
                <FileText className="w-4 h-4 mr-2" /> معلومات عامة
              </TabsTrigger>
              <TabsTrigger value="description" disabled={loading} onClick={() => handleTabChange("description")} className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-t-lg border-b-2 border-transparent data-[state=active]:border-indigo-600 whitespace-nowrap">
                <BookOpen className="w-4 h-4 mr-2" /> الوصف والأهداف
              </TabsTrigger>
              <TabsTrigger value="outcomes" disabled={loading} onClick={() => handleTabChange("outcomes")} className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-t-lg border-b-2 border-transparent data-[state=active]:border-indigo-600 whitespace-nowrap">
                <Target className="w-4 h-4 mr-2" /> المخرجات
              </TabsTrigger>
              <TabsTrigger value="strategies" disabled={loading} onClick={() => handleTabChange("strategies")} className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-t-lg border-b-2 border-transparent data-[state=active]:border-indigo-600 whitespace-nowrap">
                <Lightbulb className="w-4 h-4 mr-2" /> التدريس والتقييم
              </TabsTrigger>
              <TabsTrigger value="content" disabled={loading} onClick={() => handleTabChange("content")} className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-t-lg border-b-2 border-transparent data-[state=active]:border-indigo-600 whitespace-nowrap">
                <Layers className="w-4 h-4 mr-2" /> المحتوى والأسئلة
              </TabsTrigger>
              <TabsTrigger value="activities" disabled={loading} onClick={() => handleTabChange("activities")} className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-t-lg border-b-2 border-transparent data-[state=active]:border-indigo-600 whitespace-nowrap">
                <ClipboardList className="w-4 h-4 mr-2" /> الأنشطة والتقييم
              </TabsTrigger>
              <TabsTrigger value="resources" disabled={loading} onClick={() => handleTabChange("resources")} className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-t-lg border-b-2 border-transparent data-[state=active]:border-indigo-600 whitespace-nowrap">
                <Book className="w-4 h-4 mr-2" /> المصادر
              </TabsTrigger>
              <TabsTrigger value="policies" disabled={loading} onClick={() => handleTabChange("policies")} className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-t-lg border-b-2 border-transparent data-[state=active]:border-indigo-600 whitespace-nowrap">
                <Award className="w-4 h-4 mr-2" /> الضوابط
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Scroll Area for Content */}
          <ScrollArea className="flex-1 bg-slate-50/30">
            <div className="p-4 md:p-6">
              
              {/* جميع التبويبات */}

              {/* ==================== TAB 1: معلومات عامة ==================== */}
              {activeTab === "info" && courseInfo && (
                <TabsContent value="info" className="mt-0" dir="rtl">
                  {courseInfoLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                        <p className="text-sm text-slate-600">جاري تحميل معلومات المقرر...</p>
                      </div>
                    </div>
                  ) : courseInfo ? (
                    <div className="space-y-6">
                      
                      {/* ==================== المعلومات الأساسية ==================== */}
                      <Card>
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <FileText className="w-5 h-5 text-indigo-600" />
                            معلومات المقرر الأساسية
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            
                            {/* الكود */}
                            <div className="p-4 bg-slate-50 rounded-lg border">
                              <Label className="text-xs text-slate-500 mb-2 block font-semibold">كود المقرر</Label>
                              <div className="font-bold text-lg font-mono text-slate-800">{courseInfo.course_code}</div>
                            </div>
                
                            {/* الاسم */}
                            <div className="p-4 bg-slate-50 rounded-lg border lg:col-span-2">
                              <Label className="text-xs text-slate-500 mb-2 block font-semibold">اسم المقرر</Label>
                              <div className="font-semibold text-slate-800">{courseInfo.course_name}</div>
                            </div>
                
                            {/* الساعات المعتمدة */}
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                              <Label className="text-xs text-blue-600 mb-2 block font-semibold">الساعات المعتمدة</Label>
                              <div className="font-bold text-xl text-blue-700">{courseInfo.credit_hours} ساعات</div>
                            </div>
                
                            {/* الوزن */}
                            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                              <Label className="text-xs text-emerald-600 mb-2 block font-semibold">وزن المقرر من البرنامج</Label>
                              <div className="font-bold text-xl text-emerald-700">{courseInfo.weight || 0}%</div>
                            </div>
                
                            {/* نوع المتطلب */}
                            <div className="p-4 bg-slate-50 rounded-lg border">
                              <Label className="text-xs text-slate-500 mb-2 block font-semibold">نوع المتطلب</Label>
                              <Badge className="text-sm">{courseInfo.category || "غير محدد"}</Badge>
                            </div>
                
                            {/* لغة التدريس */}
                            <div className="p-4 bg-slate-50 rounded-lg border">
                              <Label className="text-xs text-slate-500 mb-2 block font-semibold">لغة التدريس</Label>
                              <div className="flex items-center gap-2">
                                <span className="text-xl">
                                  {courseInfo.teaching_language === 'العربية' && '🇸🇦'}
                                  {courseInfo.teaching_language === 'الإنجليزية' && '🇬🇧'}
                                  {courseInfo.teaching_language === 'ثنائي اللغة' && '🌐'}
                                </span>
                                <span className="text-sm text-slate-700">{courseInfo.teaching_language || "غير محدد"}</span>
                              </div>
                            </div>
                
                            {/* الحالة */}
                            <div className="p-4 bg-slate-50 rounded-lg border">
                              <Label className="text-xs text-slate-500 mb-2 block font-semibold">حالة المقرر</Label>
                              <Badge className={courseInfo.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                                {courseInfo.is_active ? "✓ نشط" : "✗ غير نشط"}
                              </Badge>
                            </div>
                          </div>
                
                          {/* الملاحظات */}
                          {courseInfo.notes && (
                            <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                              <Label className="text-xs text-amber-700 mb-2 block font-semibold">ملاحظات</Label>
                              <p className="text-sm text-amber-900">{courseInfo.notes}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                
                      {/* ==================== معلومات المؤسسات ==================== */}
                      <Card>
                        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-purple-600" />
                            معلومات المؤسسات التعليمية
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            {/* الكلية */}
                            <div className="p-4 bg-slate-50 rounded-lg border">
                              <Label className="text-xs text-slate-500 mb-2 block font-semibold">الكلية</Label>
                              <div className="font-semibold text-slate-800">{courseInfo.college?.name || "غير محدد"}</div>
                            </div>
                
                            {/* القسم */}
                            <div className="p-4 bg-slate-50 rounded-lg border">
                              <Label className="text-xs text-slate-500 mb-2 block font-semibold">القسم</Label>
                              <div className="font-semibold text-slate-800">{courseInfo.department?.name || "غير محدد"}</div>
                            </div>
                
                            {/* البرنامج */}
                            <div className="p-4 bg-slate-50 rounded-lg border">
                              <Label className="text-xs text-slate-500 mb-2 block font-semibold">البرنامج</Label>
                              <div className="font-semibold text-slate-800">{courseInfo.program?.name || "غير محدد"}</div>
                              {courseInfo.program && (
                                <div className="text-xs text-slate-500 mt-1">
                                  النظام: {courseInfo.program.academic_system === 'credit' ? 'نظام الساعات المعتمدة' : 'نظام الفصول'}
                                </div>
                              )}
                            </div>
                
                            {/* المستوى */}
                            {courseInfo.level && (
                              <div className="p-4 bg-slate-50 rounded-lg border">
                                <Label className="text-xs text-slate-500 mb-2 block font-semibold">المستوى</Label>
                                <div className="font-semibold text-slate-800">المستوى {courseInfo.level.number}</div>
                              </div>
                            )}
                
                            {/* الفصل الدراسي */}
                            {courseInfo.semester && (
                              <div className="p-4 bg-slate-50 rounded-lg border">
                                <Label className="text-xs text-slate-500 mb-2 block font-semibold">الفصل الدراسي</Label>
                                <div className="font-semibold text-slate-800">{courseInfo.semester.name}</div>
                              </div>
                            )}
                
                            {/* الكتلة */}
                            {courseInfo.block && (
                              <div className="p-4 bg-slate-50 rounded-lg border">
                                <Label className="text-xs text-slate-500 mb-2 block font-semibold">الكتلة</Label>
                                <div className="font-semibold text-slate-800">{courseInfo.block.name}</div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                
                      {/* ==================== أجزاء المقرر ==================== */}
                      {courseInfo?.course_parts && courseInfo.course_parts.length > 0 && (
                        <Card>
                          <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b">
                            <CardTitle className="text-lg flex items-center gap-2">
                              <Layers className="w-5 h-5 text-orange-600" />
                              أجزاء المقرر وساعاته
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-6">
                            <div className="space-y-3">
                              {courseInfo.course_parts.map((part: any, idx: number) => {
                                // ✅ حساب الساعات المعتمدة
                                const creditedHours = Math.round(part.actual_hours * part.rate);
                                
                                return (
                                  <div key={idx} className="p-4 bg-white rounded-lg border-2 border-orange-100 hover:border-orange-300 transition-colors">
                                    <div className="flex items-center justify-between flex-wrap gap-4">
                                      <Badge className="bg-orange-100 text-orange-700 font-bold text-sm px-3 py-1">
                                        {part.name}
                                      </Badge>
                                      
                                      <div className="flex gap-6">
                                        <div className="text-center">
                                          <div className="text-xs text-slate-500 mb-1">الساعات الفعلية</div>
                                          <div className="font-bold text-sm text-slate-700">{part.actual_hours}</div>
                                        </div>
                                        
                                        <div className="text-center">
                                          <div className="text-xs text-slate-500 mb-1">المعدل</div>
                                          <div className="font-bold text-sm text-slate-700">
                                            {part.name === "نظري" ? "×1" : 
                                             part.name === "سريري" ? "÷3" : "÷2"}
                                          </div>
                                        </div>
                                        
                                        <div className="text-center">
                                          <div className="text-xs text-slate-500 mb-1">معتمدة</div>
                                          <div className="font-bold text-sm text-emerald-700">{creditedHours}</div>
                                        </div>
                                      </div>
                                      
                                      <Badge className="bg-emerald-100 text-emerald-700 font-bold">
                                        {creditedHours} ساعة
                                      </Badge>
                                    </div>
                                  </div>
                                );
                              })}
                              
                              {/* الإجمالي */}
                              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 flex justify-between">
                                <span className="font-bold text-emerald-800">الإجمالي:</span>
                                <span className="font-bold text-emerald-700">
                                  {courseInfo.course_parts.reduce((sum: number, p: any) => 
                                    sum + Math.round(p.actual_hours * p.rate), 0
                                  )} ساعة معتمدة
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                      
                      {/* ==================== المتطلبات ==================== */}
                      {((courseInfo?.prerequisites && courseInfo.prerequisites.length > 0) || 
                        (courseInfo?.corequisites && courseInfo.corequisites.length > 0)) && (
                        <Card>
                          <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 border-b">
                            <CardTitle className="text-lg flex items-center gap-2">
                              <Link className="w-5 h-5 text-cyan-600" />
                              المتطلبات
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              
                              {/* المتطلبات السابقة */}
                              {courseInfo.prerequisites && courseInfo.prerequisites.length > 0 && (
                                <div className="space-y-3">
                                  <Label className="font-bold text-indigo-700 text-base">
                                    المتطلبات السابقة
                                  </Label>
                                  <div className="space-y-2">
                                    {courseInfo.prerequisites.map((prereq: any, idx: number) => (
                                      <div key={idx} className="p-3 bg-indigo-50 rounded-lg border border-indigo-200 flex items-center gap-3">
                                        <Badge className="bg-indigo-100 text-indigo-700 font-mono whitespace-nowrap">
                                          {prereq.course_code  || "N/A"}
                                        </Badge>
                                        <span className="text-sm text-slate-700">
                                          {prereq.course_name || "بدون اسم"}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* المتطلبات المصاحبة */}
                              {courseInfo.corequisites && courseInfo.corequisites.length > 0 && (
                                <div className="space-y-3">
                                  <Label className="font-bold text-blue-700 text-base">
                                    المتطلبات المصاحبة
                                  </Label>
                                  <div className="space-y-2">
                                    {courseInfo.corequisites.map((coreq: any, idx: number) => (
                                      <div key={idx} className="p-3 bg-blue-50 rounded-lg border border-blue-200 flex items-center gap-3">
                                        <Badge className="bg-blue-100 text-blue-700 font-mono whitespace-nowrap">
                                          {coreq.course_code  || "N/A"}
                                        </Badge>
                                        <span className="text-sm text-slate-700">
                                          {coreq.course_name || "بدون اسم"}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                      
                      {/* ==================== حالة الاعتماد ==================== */}
                      <Card>
                        <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-indigo-600" />
                            حالة الاعتماد والتوصيف
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            
                            {/* حالة الاعتماد */}
                            <div className="p-4 bg-slate-50 rounded-lg border">
                              <Label className="text-xs text-slate-500 mb-2 block font-semibold">حالة الاعتماد</Label>
                              <Badge className={courseInfo.is_approved 
                                ? "bg-green-100 text-green-700 text-base font-bold px-3 py-2" 
                                : "bg-amber-100 text-amber-700 text-base font-bold px-3 py-2"
                              }>
                                {courseInfo.is_approved ? "✓ معتمد" : "⏳ قيد المراجعة"}
                              </Badge>
                            </div>
                      
                            {/* حالة التوصيف */}
                            {courseInfo?.specification_status && (
                              <div className="p-4 bg-slate-50 rounded-lg border">
                                <Label className="text-xs text-slate-500 mb-2 block font-semibold">
                                  حالة التوصيف
                                </Label>
                                <Badge className={cn(
                                  courseInfo.specification_status === 'approved' && "bg-green-100 text-green-700",
                                  courseInfo.specification_status === 'in_progress' && "bg-blue-100 text-blue-700",
                                  courseInfo.specification_status === 'under_review' && "bg-yellow-100 text-yellow-700",
                                  courseInfo.specification_status === 'draft' && "bg-slate-100 text-slate-700"
                                )}>
                                  {courseInfo.specification_status === 'approved' && "✓ معتمد"}
                                  {courseInfo.specification_status === 'in_progress' && "🔄 قيد الإعداد"}
                                  {courseInfo.specification_status === 'under_review' && "👁 قيد المراجعة"}
                                  {courseInfo.specification_status === 'draft' && "📝 مسودة"}
                                </Badge>
                              </div>
                            )}
                      
                            {/* تاريخ الاعتماد */}
                            {courseInfo.approval_date && (
                              <div className="p-4 bg-slate-50 rounded-lg border">
                                <Label className="text-xs text-slate-500 mb-2 block font-semibold">تاريخ الاعتماد</Label>
                                <div className="font-semibold text-slate-800">{courseInfo.approval_date}</div>
                              </div>
                            )}
                      
                            {/* معتمد من */}
                            {courseInfo.approved_by && (
                              <div className="p-4 bg-slate-50 rounded-lg border">
                                <Label className="text-xs text-slate-500 mb-2 block font-semibold">معتمد من</Label>
                                <div className="font-semibold text-slate-800">{courseInfo.approved_by}</div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-12">
                      <p className="text-slate-500">لم يتم تحميل البيانات</p>
                    </div>
                  )}
                </TabsContent>
              )}

              {/* ==================== TAB 2: الوصف والأهداف ==================== */}
              {activeTab === "description" && (
                <TabsContent value="description" className="mt-0 space-y-6" dir="rtl">

                  {/* Wصف المقرر */}
                  <Card>
                    <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-green-600" />
                        II. وصف المقرر
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      
                      <Accordion type="single" collapsible className="bg-green-50/50 rounded-lg border border-green-200">
                        <AccordionItem value="help" className="border-0">
                          <AccordionTrigger className="px-4 py-3 hover:no-underline">
                            <div className="flex items-center gap-2 text-green-700">
                              <Info className="w-4 h-4" />
                              <span className="font-medium">إرشادات كتابة الوصف</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4 text-sm text-slate-700 space-y-3">
                            <p className="font-semibold text-green-800">يجب أن يتكون الوصف من 4 جمل (80-100 كلمة):</p>
                            <div className="space-y-2 pr-4 border-r-2 border-green-300">
                              <p><strong>الجملة الأولى:</strong> يهدف هذا المقرر إلى... (أهم مخرجات التعلم)</p>
                              <p><strong>الجملة الثانية:</strong> ويغطي هذا المقرر... (أبرز الموضوعات)</p>
                              <p><strong>الجملة الثالثة:</strong> ويركز هذا المقرر على... (الجانب العملي/التطبيقي والاستراتيجيات)</p>
                              <p><strong>الجملة الرابعة:</strong> ويعتمد هذا المقرر... (المتطلبات القبلية والمصاحبة)</p>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
  
                      <div className="space-y-2">
                        <Label>وصف المقرر الكامل</Label>
                        <Textarea 
                          value={
                            typeof descriptionText === 'string' 
                              ? descriptionText 
                              : ''
                          }
                          onChange={(e) => {
                            // ✅ تأكد أن القيمة string
                            const newValue = typeof e.target.value === 'string' ? e.target.value : '';
                            setDescriptionText(newValue);
                          }}
                          className="bg-white min-h-[200px] font-sans"
                          placeholder="اكتب وصف المقرر بناءً على الإرشادات..."
                        />
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>عدد الكلمات: {descriptionText.split(' ').filter(w => w.length > 0).length}</span>
                          <span className={descriptionText.split(' ').filter(w => w.length > 0).length >= 80 && descriptionText.split(' ').filter(w => w.length > 0).length <= 100 ? "text-green-600" : "text-amber-600"}>
                            {descriptionText.split(' ').filter(w => w.length > 0).length >= 80 && descriptionText.split(' ').filter(w => w.length > 0).length <= 100 ? "✓ مناسب" : descriptionText.split(' ').filter(w => w.length > 0).length < 80 ? "⚠ أقل من المطلوب" : "⚠ أكثر من المطلوب"}
                          </span>
                        </div>
                      </div>
  
                      <div className="flex justify-end gap-2">
                        <Button 
                          size="sm"
                          onClick={handleSaveDescription}
                          disabled={saving}
                        >
                          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                          حفظ الوصف
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
  
                  {/* أهداف المقرر */}
                  <Card>
                    <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Target className="w-5 h-5 text-purple-600" />
                            III. أهداف المقرر
                          </CardTitle>
                          <CardDescription className="text-xs mt-1">
                            {courseGoals.length > 0 && (
                              <span className={courseGoals.length >= 4 && courseGoals.length <= 6 ? "text-green-600" : "text-amber-600"}>
                                {courseGoals.length >= 4 && courseGoals.length <= 6 
                                  ? `✓ ${courseGoals.length} أهداف (مناسب)` 
                                  : `⚠ ${courseGoals.length} هدف (4-6 مطلوبة)`}
                              </span>
                            )}
                          </CardDescription>
                        </div>
                        <Button 
                          size="sm"
                          onClick={() => setIsAddingOutcome(true)}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          إضافة هدف
                        </Button>
                      </div>
                    </CardHeader>

                    <CardContent className="p-6 space-y-4">
                      
                      <Accordion type="single" collapsible className="bg-purple-50/50 rounded-lg border border-purple-200">
                        <AccordionItem value="help" className="border-0">
                          <AccordionTrigger className="px-4 py-3 hover:no-underline">
                            <div className="flex items-center gap-2 text-purple-700">
                              <Info className="w-4 h-4" />
                              <span className="font-medium">إرشادات كتابة الأهداف</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4 text-sm text-slate-700 space-y-2 border-r-2 border-purple-300 pr-4">
                            <p>✓ الأهداف يجب أن تكون عامة وليست تفصيلية</p>
                            <p>✓ مرتبطة بالمقرر فعلياً</p>
                            <p>✓ عددها مناسب (4-6 أهداف)</p>
                            <p>✓ صياغة الأفعال من وجهة نظر المقرر</p>
                            <p>✓ توضح الفائدة والأهمية للطالب</p>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
  
                      {/* Add New Goal Form */}
                      {isAddingOutcome && activeTab === "description" && (
                        <div className="p-4 bg-purple-50 rounded-lg border-2 border-purple-200 space-y-3">
                          <Label className="font-semibold">إضافة هدف جديد</Label>
                          <Textarea 
                            value={newGoal}
                            onChange={(e) => setNewGoal(e.target.value)}
                            placeholder="مثال: تمكين الطلاب من فهم واستخدام هياكل البيانات بفعالية"
                            className="bg-white min-h-[60px]"
                          />
                          <div className="flex gap-2 justify-end">
                            <Button 
                              size="sm"
                              variant="outline"
                              onClick={() => setIsAddingOutcome(false)}
                            >
                              إلغاء
                            </Button>
                            <Button 
                              size="sm"
                              className="bg-purple-600"
                              onClick={handleAddGoal}
                              disabled={!newGoal.trim()}
                            >
                              إضافة
                            </Button>
                          </div>
                        </div>
                      )}
  
                      {/* Goals List */}
                      <div className="space-y-2">
                        {Array.isArray(courseGoals) && courseGoals.length > 0 ? (
                          courseGoals.map((goal, index) => (
                            <div 
                              key={index} 
                              className="flex gap-3 p-3 bg-white rounded-lg border hover:border-purple-300"
                            >
                              <Badge className="shrink-0 bg-purple-600 mt-1">
                                {index + 1}
                              </Badge>
                      
                              {editingGoalIndex === index ? (
                                <Textarea 
                                  value={typeof goal === 'string' ? goal : ''}
                                  onChange={(e) => handleUpdateGoal(index, e.target.value)}
                                  className="flex-1 min-h-[60px]"
                                  autoFocus
                                />
                              ) : (
                                <p className="flex-1 pt-2 text-slate-700">
                                  {typeof goal === 'string' ? goal : 'بيانات غير صحيحة'}
                                </p>
                              )}
                      
                              <div className="flex gap-1 shrink-0">
                                {editingGoalIndex === index ? (
                                  <>
                                    <Button 
                                      size="icon" 
                                      variant="ghost"
                                      onClick={() => setEditingGoalIndex(null)}
                                      className="text-green-600"
                                    >
                                      <Check className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                      size="icon" 
                                      variant="ghost"
                                      onClick={() => setEditingGoalIndex(null)}
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Button 
                                      size="icon" 
                                      variant="ghost"
                                      onClick={() => setEditingGoalIndex(index)}
                                      className="text-slate-400"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                      size="icon" 
                                      variant="ghost"
                                      onClick={() => {
                                        console.log("Delete button clicked, index:", index);
                                        handleDeleteGoal(index);
                                      }}
                                      className="text-red-500"
                                      disabled={saving || courseGoals.length <= 4}  // ✅ عطّل إذا 4 أو أقل
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-6 text-center bg-slate-50 rounded-lg border border-dashed text-slate-400">
                            لا توجد أهداف
                          </div>
                        )}
                      </div>
                      
                      {/* ملخص الأهداف قبل الحفظ */}
                      <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                        <p className="text-sm font-semibold text-purple-900 mb-2">ملخص الأهداف:</p>
                        <div className="space-y-1 text-xs text-purple-800">
                          <p>✓ العدد: {courseGoals.length}/4-6</p>
                          <p>✓ الأهداف الصحيحة: {courseGoals.filter(g => countWords(g) >= 3 && g.trim()).length}/{courseGoals.length}</p>
                          {courseGoals.some(g => countWords(g) < 3 || !g.trim()) && (
                            <p className="text-red-600">❌ يوجد أهداف تحتاج تصحيح</p>
                          )}
                        </div>
                      </div>
                      
                      {/* ✅ زر حفظ الأهداف */}
                      <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button 
                          size="sm"
                          onClick={handleSaveGoals}
                          disabled={
                            saving || 
                            courseGoals.length < 4 || 
                            courseGoals.length > 6 ||
                            courseGoals.some(g => countWords(g) < 3 || !g.trim())
                          }
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                          حفظ الأهداف
                        </Button>
                      </div>

                    </CardContent>
                  </Card>
                </TabsContent>
              )}
              
              {/* ✅ Dialog التأكيد من الحذف */}
              <AlertDialog 
                open={deleteConfirm !== null} 
                onOpenChange={(open) => {
                  if (!open) setDeleteConfirm(null);
                }}
              >
                <AlertDialogContent dir="rtl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>حذف الهدف</AlertDialogTitle>
                    <AlertDialogDescription>
                      {deleteConfirm !== null && (
                        <>
                          هل أنت متأكد من حذف هذا الهدف؟
                          <p className="mt-3 p-2 bg-slate-100 rounded text-slate-900 text-sm">
                            "{courseGoals[deleteConfirm]}"
                          </p>
                        </>
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="flex gap-2 justify-end">
                    <AlertDialogCancel 
                      onClick={() => setDeleteConfirm(null)}
                      disabled={saving}
                    >
                      إلغاء
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        if (deleteConfirm !== null) {
                          confirmDelete(deleteConfirm);
                        }
                      }}
                      className="bg-red-600 hover:bg-red-700"
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          جاري الحذف...
                        </>
                      ) : (
                        "حذف"
                      )}
                    </AlertDialogAction>
                  </div>
                </AlertDialogContent>
              </AlertDialog>

              {/* ==================== TAB 3: مخرجات التعلم ==================== */}
              {activeTab === "outcomes" && (
                <TabsContent value="outcomes" className="mt-0" dir="rtl">
                  <Card>
                    <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <GraduationCap className="w-5 h-5 text-indigo-600" />
                            IV. مخرجات التعلم المقصودة للمقرر (CLOs)
                          </CardTitle>
                          <CardDescription className="text-xs mt-1">
                            الحد الأقصى: {MAX_COURSE_OUTCOMES} مخرجات • 
                            الحالي: {courseOutcomes.length} • 
                            لا يشترط التوزيع على جميع المجالات
                          </CardDescription>
                        </div>
                        
                        <div className="flex gap-3">
                          {/* وزن المقرر المستهدف */}
                          <div className="px-4 py-2 rounded-lg border bg-blue-50 border-blue-200 text-center shrink-0">
                            <div className="text-xs text-slate-500 mb-1">وزن المقرر</div>
                            <div className="font-bold text-lg text-blue-600">
                              {courseInfo?.weight || 0}%
                            </div>
                          </div>
                          
                          {/* مجموع الأوزان الحالي */}
                          <div className={cn(
                            "px-4 py-2 rounded-lg border text-center shrink-0",
                            getTotalOutcomeWeight() === (courseInfo?.weight || 0)
                              ? "bg-green-50 border-green-200"
                              : getTotalOutcomeWeight() > (courseInfo?.weight || 0)
                              ? "bg-red-50 border-red-200"
                              : "bg-amber-50 border-amber-200"
                          )}>
                            <div className="text-xs text-slate-500 mb-1">مجموع الأوزان</div>
                            <div className={cn(
                              "font-bold text-lg",
                              getTotalOutcomeWeight() === (courseInfo?.weight || 0)
                                ? "text-green-600"
                                : getTotalOutcomeWeight() > (courseInfo?.weight || 0)
                                ? "text-red-600"
                                : "text-amber-600"
                            )}>
                              {getTotalOutcomeWeight().toFixed(2)}%
                            </div>
                          </div>
                          
                          {/* الوزن المتبقي */}
                          <div className="px-4 py-2 rounded-lg border bg-slate-50 border-slate-200 text-center shrink-0">
                            <div className="text-xs text-slate-500 mb-1">المتبقي</div>
                            <div className={cn(
                              "font-bold text-lg",
                              getRemainingWeight() >= 0 ? "text-slate-600" : "text-red-600"
                            )}>
                              {getRemainingWeight().toFixed(2)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-8">
                      {(Object.keys(domainLabels) as Array<keyof typeof domainLabels>).map((domain) => {
                        const domainOutcomes = courseOutcomes.filter(o => o.domain === domain);
                        const domainCount = domainOutcomes.length;
                        const canAdd = canAddMoreOutcomes();
                        
                        // ✅ استخدام safeWeight
                        const domainWeight = domainOutcomes.reduce((sum, o) => {
                          return sum + safeWeight(o.weight);
                        }, 0);
                        
                        return (
                          <div key={domain} className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <h3 className="font-bold text-slate-800 text-lg">
                                  ({domainAbbreviations[domain]}) {domainLabels[domain]}
                                </h3>
                                {domainCount > 0 && (
                                  <>
                                    <Badge variant="outline" className="bg-white">
                                      {domainCount} {domainCount === 1 ? 'مخرج' : 'مخرجات'}
                                    </Badge>
                                    <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200">
                                      {/* ✅ الآن آمن تماماً */}
                                      الوزن: {domainWeight.toFixed(2)}%
                                    </Badge>
                                  </>
                                )}
                              </div>
                              
                              {canAdd && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleAddOutcome(domain)}
                                  className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                                >
                                  <Plus className="w-4 h-4 mr-2" />
                                  إضافة مخرج
                                </Button>
                              )}
                            </div>
                      
                            {domainOutcomes.length === 0 ? (
                              <div className="p-6 text-center bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                                <p className="text-slate-400 text-sm">لا توجد مخرجات في هذا المجال</p>
                                {canAdd && (
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => handleAddOutcome(domain)}
                                    className="mt-2 text-indigo-600"
                                  >
                                    <Plus className="w-4 h-4 mr-1" /> أضف الآن
                                  </Button>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {domainOutcomes
                                  .sort((a, b) => a.order - b.order)
                                  .map((outcome) => {
                                    const linkedPLO = programOutcomes.find(p => p.plo_id === outcome.plo_id);
                                    const outcomeWeight = safeWeight(outcome.weight); // ✅ آمن
                                    const ploWeight = linkedPLO ? safeWeight(linkedPLO.weight) : 0; // ✅ آمن
                      
                                    return (
                                      <div 
                                        key={outcome.clo_id} 
                                        className="p-4 rounded-lg border-2 bg-white hover:shadow-md transition-shadow"
                                      >
                                        <div className="flex gap-3 items-start">
                                          <Badge className="shrink-0 mt-1 bg-indigo-50 text-indigo-700 border-indigo-200 font-mono">
                                            {outcome.code}
                                          </Badge>
                                          <div className="flex-1">
                                            <p className="font-medium text-slate-800 mb-3 leading-relaxed">
                                              {outcome.description}
                                            </p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                              <div className="flex items-center gap-2">
                                                <Label className="text-xs font-semibold text-slate-600">
                                                  وزن المخرج:
                                                </Label>
                                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                                  {outcomeWeight.toFixed(2)}%
                                                </Badge>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <Label className="text-xs font-semibold text-slate-600">
                                                  مرتبط بـ:
                                                </Label>
                                                {linkedPLO ? (
                                                  <div className="flex items-center gap-1">
                                                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                                      {linkedPLO.code}
                                                    </Badge>
                                                    {ploWeight > 0 && (
                                                      <Badge variant="outline" className="bg-blue-50 text-blue-600 text-xs">
                                                        {ploWeight.toFixed(2)}%
                                                      </Badge>
                                                    )}
                                                  </div>
                                                ) : (
                                                  <Badge variant="secondary" className="bg-slate-100">
                                                    غير محدد
                                                  </Badge>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                          <div className="flex gap-1 shrink-0">
                                            <Button 
                                              size="icon" 
                                              variant="ghost"
                                              className="hover:bg-indigo-50 hover:text-indigo-600"
                                              onClick={() => {
                                                setOutcomeFormData(outcome);
                                                setEditingOutcomeId(outcome.clo_id);
                                                setIsAddingOutcome(true);
                                              }}
                                            >
                                              <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button 
                                              size="icon" 
                                              variant="ghost"
                                              className="text-red-500 hover:bg-red-50"
                                              onClick={() => handleDeleteOutcome(outcome.clo_id)}
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </Button>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    
                      {/* ✅ تحذير: تجاوز الوزن */}
                      {getTotalOutcomeWeight() > (courseInfo?.weight || 0) && (
                        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg flex gap-3">
                          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                          <div className="text-sm text-red-700">
                            <p className="font-semibold mb-1">⚠️ تحذير: تجاوز وزن المقرر</p>
                            <p>
                              مجموع أوزان المخرجات ({getTotalOutcomeWeight().toFixed(2)}%) 
                              يتجاوز وزن المقرر ({courseInfo?.weight}%)
                            </p>
                          </div>
                        </div>
                      )}
                    
                      {/* ✅ تنبيه: لم يكتمل التوزيع */}
                      {getTotalOutcomeWeight() < (courseInfo?.weight || 0) && courseOutcomes.length > 0 && (
                        <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-lg flex gap-3">
                          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                          <div className="text-sm text-amber-700">
                            <p className="font-semibold mb-1">ℹ️ تنبيه: لم يكتمل توزيع الأوزان</p>
                            <p>
                              الوزن المتبقي: {getRemainingWeight().toFixed(2)}% من {courseInfo?.weight}%
                            </p>
                          </div>
                        </div>
                      )}
                    
                      {/* ✅ معلومة: التوزيع الحالي */}
                      {courseOutcomes.length > 0 && (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-800 font-semibold mb-2">📊 توزيع المخرجات:</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                            {(Object.keys(domainLabels) as Array<keyof typeof domainLabels>).map((domain) => {
                              const count = getOutcomeCountByDomain(domain);
                              const weight = courseOutcomes
                                .filter(o => o.domain === domain)
                                .reduce((sum, o) => sum + o.weight, 0);
                              
                              return count > 0 ? (
                                <div key={domain} className="bg-white p-2 rounded border">
                                  <div className="text-slate-600">{domainLabels[domain]}</div>
                                  <div className="font-bold text-blue-700">
                                    {count} ({weight.toFixed(1)}%)
                                  </div>
                                </div>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
  
                  {/* Dialog: Add/Edit Outcome */}
                  <Dialog open={isAddingOutcome && activeTab === "outcomes"} onOpenChange={setIsAddingOutcome}>
                    <DialogContent className="max-w-2xl" dir="rtl">
                      <DialogHeader>
                        <DialogTitle>
                          {editingOutcomeId ? "تعديل مخرج التعلم" : "إضافة مخرج تعلم جديد"}
                        </DialogTitle>
                        <DialogDescription>
                          المجال: {domainLabels[outcomeFormData.domain as keyof typeof domainLabels]} • 
                          الرمز: {outcomeFormData.code}
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>رمز المخرج</Label>
                            <Input 
                              value={outcomeFormData.code || ""}
                              disabled
                              className="bg-slate-100 font-mono"
                            />
                            <p className="text-xs text-slate-500">يتم إنشاؤه تلقائياً</p>
                          </div>
                          
                          <div className="space-y-2">
                            <Label>وزن المخرج (%) <span className="text-red-500">*</span></Label>
                            <Input 
                              type="number"
                              min="0"
                              max={courseInfo?.weight || 100}
                              step="0.01"
                              value={outcomeFormData.weight || ""}
                              onChange={e => setOutcomeFormData({
                                ...outcomeFormData, 
                                weight: parseFloat(e.target.value) || 0
                              })}
                              placeholder="0.00"
                            />
                            <p className="text-xs text-slate-500">
                              المتبقي: {getRemainingWeight().toFixed(2)}%
                            </p>
                          </div>
                        </div>
                  
                        <div className="space-y-2">
                          <Label>وصف المخرج <span className="text-red-500">*</span></Label>
                          <Textarea 
                            value={outcomeFormData.description || ""}
                            onChange={e => setOutcomeFormData({
                              ...outcomeFormData, 
                              description: e.target.value
                            })}
                            placeholder="اكتب وصف مخرج التعلم بشكل واضح..."
                            className="min-h-[120px]"
                            rows={5}
                          />
                          <p className="text-xs text-slate-500">
                            الحد الأدنى: 10 أحرف • الحالي: {outcomeFormData.description?.length || 0}
                          </p>
                        </div>
                  
                        {/* ✅ ربط PLO إجباري */}
                        <div className="space-y-2">
                          <Label>
                            ربط بمخرج تعلم البرنامج <span className="text-red-500">*</span>
                          </Label>
                          {programOutcomes.length === 0 ? (
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                              ⚠️ لا توجد مخرجات تعلم للبرنامج. يرجى إضافة مخرجات البرنامج أولاً.
                            </div>
                          ) : programOutcomes.filter(p => p.domain === outcomeFormData.domain).length === 0 ? (
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                              ⚠️ لا توجد مخرجات للبرنامج في مجال {domainLabels[outcomeFormData.domain as keyof typeof domainLabels]}
                            </div>
                          ) : (
                          <Select 
                            value={outcomeFormData.plo_id?.toString() || ""}
                            onValueChange={v => {
                              const ploId = v ? Number(v) : undefined;
                              const plo = programOutcomes.find(p => p.plo_id === ploId);
                              
                              setOutcomeFormData({
                                ...outcomeFormData, 
                                plo_id: ploId,
                                plo_weight: safeWeight(plo?.weight) // ✅ استخدام الدالة الجديدة
                              });
                            }}
                          >
                            <SelectTrigger className="bg-white">
                              <SelectValue placeholder="اختر مخرج البرنامج المناسب..." />
                            </SelectTrigger>
                            <SelectContent>
                              {programOutcomes
                                .filter(p => p.domain === outcomeFormData.domain && p.is_active)
                                .sort((a, b) => a.order - b.order)
                                .map(plo => {
                                  const ploWeight = safeWeight(plo.weight); // ✅ استخدام الدالة الجديدة
                                  
                                  return (
                                    <SelectItem key={plo.plo_id} value={plo.plo_id.toString()}>
                                      <div className="flex items-center gap-2 w-full">
                                        <Badge className="bg-blue-100 text-blue-700 text-xs shrink-0">
                                          {plo.code}
                                        </Badge>
                                        <span className="text-sm flex-1 truncate">
                                          {plo.description.substring(0, 60)}
                                          {plo.description.length > 60 ? '...' : ''}
                                        </span>
                                        {ploWeight > 0 && (
                                          <Badge variant="outline" className="text-xs shrink-0">
                                            {ploWeight.toFixed(2)}%
                                          </Badge>
                                        )}
                                      </div>
                                    </SelectItem>
                                  );
                                })
                              }
                            </SelectContent>
                          </Select>
                          )}
                        </div>
                      </div>
                      
                      <DialogFooter>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setIsAddingOutcome(false);
                            setOutcomeFormData({});
                            setEditingOutcomeId(null);
                          }}
                        >
                          إلغاء
                        </Button>
                        <Button 
                          onClick={handleSaveOutcome}
                          disabled={
                            saving || 
                            !outcomeFormData.description || 
                            outcomeFormData.description.length < 10 ||
                            !outcomeFormData.plo_id ||
                            programOutcomes.filter(p => p.domain === outcomeFormData.domain).length === 0
                          }
                          className="bg-indigo-600 hover:bg-indigo-700"
                        >
                          {saving ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4 mr-2" />
                          )}
                          حفظ
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </TabsContent>
              )}

              {/* ==================== TAB 4: التدريس والتقييم ==================== */}
              {activeTab === "strategies" && (
                <TabsContent value="strategies" className="mt-0 space-y-6" dir="rtl">
                  <Card>
                    <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-amber-600" />
                        V. ربط مخرجات التعلم باستراتيجيات التدريس والتقييم
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-8">
                      
                      {(Object.keys(domainLabels) as Array<keyof typeof domainLabels>).map((domain, domainIndex) => {
                        const domainOutcomes = courseOutcomes.filter(o => o.domain === domain);
                        if (domainOutcomes.length === 0) return null;
  
                        return (
                          <div key={domain} className="space-y-4">
                            <h3 className="font-bold text-slate-800 text-lg pb-2 border-b">
                              ({String.fromCharCode(65 + domainIndex)}) ربط مخرجات تعلم المقرر ({domainLabels[domain]}) باستراتيجية التدريس والتقييم:
                            </h3>
  
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow className="bg-slate-50">
                                    <TableHead className="w-[35%] text-right">مخرجات التعلم</TableHead>
                                    <TableHead className="w-[30%] text-right">استراتيجيات التدريس</TableHead>
                                    <TableHead className="w-[30%] text-right">طرق التقييم</TableHead>
                                    <TableHead className="w-[5%] text-center">إجراءات</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {domainOutcomes.map(outcome => {
                                    const mapping = outcomeMappings.find(m => m.clo_id === outcome.code);
                                    const outcomeStrategies = mapping?.teaching_strategies || [];
                                    const outcomeMethods = mapping?.assessment_methods || [];
  
                                    return (
                                      <TableRow key={outcome.clo_id} className="hover:bg-slate-50">
                                        <TableCell>
                                          <div className="flex items-start gap-2">
                                            <Badge className="shrink-0 bg-indigo-600">{outcome.code}</Badge>
                                            <span className="text-sm text-slate-700">{outcome.description}</span>
                                          </div>
                                        </TableCell>
                                        <TableCell>
                                          <div className="space-y-2">
                                            <div className="flex flex-wrap gap-1">
                                              {outcomeStrategies.map(stratId => {
                                                const strat = teachingStrategies.find(s => s.id === stratId);
                                                return strat ? (
                                                  <Badge key={stratId} variant="secondary" className="text-xs">
                                                    {strat.name}
                                                  </Badge>
                                                ) : null;
                                              })}
                                            </div>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-7 text-xs w-full justify-start"
                                              onClick={() => {
                                                setCurrentMappingClo(outcome.code);
                                                const existingMapping = outcomeMappings.find(m => m.clo_id === outcome.code);
                                                setMappingData(existingMapping || {
                                                  clo_id: outcome.code,
                                                  teaching_strategies: [],
                                                  assessment_methods: []
                                                });
                                                setIsEditingMapping(true);
                                              }}
                                            >
                                              <Plus className="w-3 h-3 ml-1" />
                                              تعديل
                                            </Button>
                                          </div>
                                        </TableCell>
                                        <TableCell>
                                          <div className="space-y-2">
                                            <div className="flex flex-wrap gap-1">
                                              {outcomeMethods.map(methodId => {
                                                const method = assessmentMethods.find(m => m.id === methodId);
                                                return method ? (
                                                  <Badge key={methodId} variant="secondary" className="text-xs">
                                                    {method.name}
                                                  </Badge>
                                                ) : null;
                                              })}
                                            </div>
                                          </div>
                                        </TableCell>
                                        <TableCell>
                                          <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => {
                                              setCurrentMappingClo(outcome.code);
                                              const existingMapping = outcomeMappings.find(m => m.clo_id === outcome.code);
                                              setMappingData(existingMapping || {
                                                clo_id: outcome.code,
                                                teaching_strategies: [],
                                                assessment_methods: []
                                              });
                                              setIsEditingMapping(true);
                                            }}
                                          >
                                            <Edit className="w-4 h-4" />
                                          </Button>
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
  
                  {/* Dialog: Edit Mapping */}
                  <Dialog open={isEditingMapping} onOpenChange={setIsEditingMapping}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
                      <DialogHeader>
                        <DialogTitle>تعديل ربط مخرج التعلم</DialogTitle>
                        <DialogDescription>
                          المخرج: {currentMappingClo}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-6 py-4">
                        {/* Teaching Strategies */}
                        <div className="space-y-3">
                          <Label className="font-semibold text-base">استراتيجيات التدريس</Label>
                          <div className="border rounded-lg p-3 space-y-2 max-h-64 overflow-y-auto">
                            {teachingStrategies.map(strategy => (
                              <div key={strategy.id} className="flex items-center gap-2">
                                <Checkbox 
                                  checked={mappingData.teaching_strategies?.includes(strategy.id) || false}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setMappingData({
                                        ...mappingData,
                                        teaching_strategies: [...(mappingData.teaching_strategies || []), strategy.id]
                                      });
                                    } else {
                                      setMappingData({
                                        ...mappingData,
                                        teaching_strategies: mappingData.teaching_strategies?.filter(id => id !== strategy.id) || []
                                      });
                                    }
                                  }}
                                />
                                <Label className="text-sm cursor-pointer font-normal">
                                  {strategy.name}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
  
                        {/* Assessment Methods */}
                        <div className="space-y-3">
                          <Label className="font-semibold text-base">طرق التقييم</Label>
                          <div className="border rounded-lg p-3 space-y-2 max-h-64 overflow-y-auto">
                            {assessmentMethods.map(method => (
                              <div key={method.id} className="flex items-center gap-2">
                                <Checkbox 
                                  checked={mappingData.assessment_methods?.includes(method.id) || false}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setMappingData({
                                        ...mappingData,
                                        assessment_methods: [...(mappingData.assessment_methods || []), method.id]
                                      });
                                    } else {
                                      setMappingData({
                                        ...mappingData,
                                        assessment_methods: mappingData.assessment_methods?.filter(id => id !== method.id) || []
                                      });
                                    }
                                  }}
                                />
                                <Label className="text-sm cursor-pointer font-normal">
                                  {method.name}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditingMapping(false)}>
                          إلغاء
                        </Button>
                        <Button 
                          onClick={handleSaveMapping}
                          disabled={saving}
                        >
                          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                          حفظ
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </TabsContent>
              )}

              {/* ==================== TAB 5: المحتوى والأسئلة ==================== */}
              {activeTab === "content" && (
                <TabsContent value="content" className="mt-0" dir="rtl">
                  <Card>
                    <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 border-b">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Layers className="w-5 h-5 text-violet-600" />
                            VI. محتوى المقرر - {activePart}
                          </CardTitle>
                          <CardDescription className="text-xs mt-1">
                            الأسابيع: {getTopicWeekCount(activePart)} | الساعات: {getTopicHours(activePart)}/32
                          </CardDescription>
                        </div>
                        <Button 
                          size="sm"
                          onClick={handleAddTopic}
                          className="whitespace-nowrap"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          إضافة موضوع
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      
                      <Accordion type="single" collapsible className="bg-violet-50/50 rounded-lg border border-violet-200 mb-6">
                        <AccordionItem value="help" className="border-0">
                          <AccordionTrigger className="px-4 py-3 hover:no-underline">
                            <div className="flex items-center gap-2 text-violet-700">
                              <Info className="w-4 h-4" />
                              <span className="font-medium">ملاحظات هامة</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4 text-sm text-slate-700 space-y-2 border-r-2 border-violet-300 pr-4">
                            <p>✓ عدد الأسابيع: 16 أسبوعاً شاملة الامتحانات</p>
                            <p>✓ إجمالي الساعات: 32 ساعة</p>
                            <p>✓ الامتحان النصفي في الأسبوع الثامن</p>
                            <p>✓ الامتحان النهائي في الأسبوع 16</p>
                            <p>✓ مخرجات التعلم يجب أن تكون محددة لكل موضوع</p>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
  
                      <div className="overflow-x-auto border rounded-lg">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-violet-50">
                              <TableHead className="w-16 text-center">الأسبوع</TableHead>
                              <TableHead className="w-40">الوحدة/الموضوع</TableHead>
                              <TableHead>المواضيع الفرعية</TableHead>
                              <TableHead className="w-32">المخرجات</TableHead>
                              <TableHead className="w-20 text-center">الساعات</TableHead>
                              <TableHead className="w-28 text-center">الإجراءات</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {getTopicsByPart(activePart).length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">
                                  <p className="text-slate-400">لم تتم إضافة مواضيع بعد</p>
                                </TableCell>
                              </TableRow>
                            ) : (
                              getTopicsByPart(activePart).map((topic) => (
                                <React.Fragment key={topic.topic_id}>
                                  <TableRow className={topic.is_exam ? "bg-amber-50" : ""}>
                                    <TableCell className="font-bold text-center">{topic.week}</TableCell>
                                    <TableCell className="font-semibold">{topic.unit_name}</TableCell>
                                    <TableCell>
                                      {!topic.is_exam ? (
                                        <div className="flex flex-wrap gap-1">
                                          {topic.subtopics?.map((sub, idx) => (
                                            <Badge key={idx} variant="secondary" className="text-xs">
                                              {sub}
                                            </Badge>
                                          ))}
                                        </div>
                                      ) : (
                                        <Badge className="bg-amber-100 text-amber-800">
                                          {topic.exam_type === "midterm" ? "امتحان نصفي" : "امتحان نهائي"}
                                        </Badge>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex flex-wrap gap-1">
                                        {topic.outcome_ids?.map(oid => (
                                          <Badge key={oid} className="text-xs">{oid}</Badge>
                                        ))}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-center font-semibold">{topic.hours}</TableCell>
                                    <TableCell>
                                      <div className="flex gap-1 justify-center">
                                        {!topic.is_exam && (
                                          <Button 
                                            size="sm" 
                                            variant="outline"
                                            className="text-xs h-8"
                                            onClick={() => handleAddQuestion(topic.topic_id)}
                                          >
                                            <Plus className="w-3 h-3 mr-1" /> أسئلة
                                          </Button>
                                        )}
                                        <Button 
                                          size="icon" 
                                          variant="ghost"
                                          className="h-8 w-8"
                                          onClick={() => {
                                            setTopicFormData(topic);
                                            setEditingTopicId(topic.topic_id);
                                            setIsAddingTopic(true);
                                          }}
                                        >
                                          <Edit className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button 
                                          size="icon" 
                                          variant="ghost"
                                          className="h-8 w-8 text-red-500 hover:bg-red-50"
                                          onClick={() => handleDeleteTopic(topic.topic_id)}
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
  
                                  {/* Questions for this topic */}
                                  {!topic.is_exam && questions.filter(q => q.topic_id === topic.topic_id).map(question => (
                                    <TableRow key={question.question_id} className="bg-blue-50/30 border-l-4 border-blue-300">
                                      <TableCell colSpan={2}></TableCell>
                                      <TableCell colSpan={4}>
                                        <div className="p-3 bg-white rounded-lg border ml-4">
                                          <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1">
                                              <Badge variant="outline" className="mb-2 text-xs">
                                                {question.question_type === "MCQ" ? "اختيار من متعدد" : "مقالي"}
                                              </Badge>
                                              <p className="font-medium text-sm mb-2">{question.question_text}</p>
                                              {question.subtopic && (
                                                <p className="text-xs text-slate-500 mb-2">الموضوع الفرعي: {question.subtopic}</p>
                                              )}
                                              {question.question_type === "MCQ" && question.options && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                  {question.options.map(opt => (
                                                    <div 
                                                      key={opt.id} 
                                                      className={cn(
                                                        "p-2 rounded border text-xs",
                                                        opt.is_correct ? "bg-green-50 border-green-200" : "bg-slate-50"
                                                      )}
                                                    >
                                                      {opt.is_correct && <span className="text-green-600 font-bold mr-1">✓</span>}
                                                      {opt.text}
                                                    </div>
                                                  ))}
                                                </div>
                                              )}
                                            </div>
                                            <Button 
                                              size="icon" 
                                              variant="ghost"
                                              className="text-red-500 shrink-0"
                                              onClick={() => handleDeleteQuestion(question.question_id)}
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                          </div>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </React.Fragment>
                              ))
                            )}
                            <TableRow className="bg-violet-50 font-bold">
                              <TableCell colSpan={4} className="text-right">الإجمالي</TableCell>
                              <TableCell className="text-center">{getTopicHours(activePart)}</TableCell>
                              <TableCell></TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
  
                      {getTopicHours(activePart) > 32 && (
                        <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg flex gap-3">
                          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                          <p className="text-sm text-red-700">
                            تحذير: إجمالي الساعات ({getTopicHours(activePart)}) يتجاوز الحد الأقصى (32)
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
  
                  {/* Dialog: Add/Edit Topic */}
                  <Dialog open={isAddingTopic && activeTab === "content"} onOpenChange={setIsAddingTopic}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
                      <DialogHeader>
                        <DialogTitle>
                          {editingTopicId ? "تعديل الموضوع" : "إضافة موضوع جديد"}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>الأسبوع *</Label>
                            <Input 
                              type="number"
                              min="1"
                              max="16"
                              value={topicFormData.week || ""}
                              onChange={e => setTopicFormData({...topicFormData, week: Number(e.target.value)})}
                            />
                          </div>
                          <div className="space-y-2 col-span-2">
                            <Label>اسم الوحدة/الموضوع الرئيسي *</Label>
                            <Input 
                              value={topicFormData.unit_name || ""}
                              onChange={e => setTopicFormData({...topicFormData, unit_name: e.target.value})}
                              placeholder="مثال: مقدمة في البرمجة"
                            />
                          </div>
                        </div>
  
                        <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                          <Checkbox 
                            checked={topicFormData.is_exam || false}
                            onCheckedChange={c => setTopicFormData({
                              ...topicFormData, 
                              is_exam: c as boolean,
                              subtopics: c ? [] : [""]
                            })}
                          />
                          <Label className="cursor-pointer font-medium text-sm">
                            هذا الأسبوع مخصص لامتحان (نصفي/نهائي)
                          </Label>
                        </div>
  
                        {topicFormData.is_exam && (
                          <div className="space-y-2">
                            <Label>نوع الامتحان</Label>
                            <Select 
                              value={topicFormData.exam_type || ""}
                              onValueChange={v => setTopicFormData({...topicFormData, exam_type: v as "midterm" | "final"})}
                            >
                              <SelectTrigger className="bg-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="midterm">امتحان نصفي</SelectItem>
                                <SelectItem value="final">امتحان نهائي</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
  
                        {!topicFormData.is_exam && (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <Label>المواضيع الفرعية</Label>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setTopicFormData({
                                  ...topicFormData, 
                                  subtopics: [...(topicFormData.subtopics || []), ""]
                                })}
                              >
                                <Plus className="w-3 h-3 mr-1" /> إضافة
                              </Button>
                            </div>
                            <div className="space-y-2">
                              {topicFormData.subtopics?.map((sub, idx) => (
                                <div key={idx} className="flex gap-2">
                                  <Input 
                                    value={sub}
                                    onChange={e => {
                                      const updated = [...(topicFormData.subtopics || [])];
                                      updated[idx] = e.target.value;
                                      setTopicFormData({...topicFormData, subtopics: updated});
                                    }}
                                    placeholder={`الموضوع الفرعي ${idx + 1}`}
                                    className="flex-1"
                                  />
                                  {(topicFormData.subtopics?.length || 0) > 1 && (
                                    <Button 
                                      size="icon" 
                                      variant="ghost"
                                      className="text-red-500"
                                      onClick={() => setTopicFormData({
                                        ...topicFormData,
                                        subtopics: topicFormData.subtopics?.filter((_, i) => i !== idx) || []
                                      })}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
  
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>عدد الساعات</Label>
                            <Input 
                              type="number"
                              min="1"
                              max="4"
                              value={topicFormData.hours || ""}
                              onChange={e => setTopicFormData({...topicFormData, hours: Number(e.target.value)})}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>مخرجات التعلم المغطاة</Label>
                            <Button 
                              size="sm"
                              variant="outline"
                              className="w-full"
                              onClick={() => {
                                // Selector for outcomes
                              }}
                            >
                              اختر المخرجات...
                            </Button>
                          </div>
                        </div>
  
                        <div className="flex flex-wrap gap-2">
                          {(topicFormData.outcome_ids || []).map(id => (
                            <Badge key={id} variant="secondary">
                              {id}
                              <button
                                onClick={() => setTopicFormData({
                                  ...topicFormData,
                                  outcome_ids: topicFormData.outcome_ids?.filter(o => o !== id) || []
                                })}
                                className="ml-1"
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddingTopic(false)}>
                          إلغاء
                        </Button>
                        <Button 
                          onClick={handleSaveTopic}
                          disabled={saving || !topicFormData.unit_name}
                        >
                          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                          حفظ
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
  
                  {/* Dialog: Add Question */}
                  <Dialog open={isAddingQuestion && activeTab === "content"} onOpenChange={setIsAddingQuestion}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
                      <DialogHeader>
                        <DialogTitle>إضافة سؤال جديد</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>نوع السؤال</Label>
                          <Select 
                            value={questionFormData.question_type || "MCQ"}
                            onValueChange={v => setQuestionFormData({...questionFormData, question_type: v as "MCQ" | "essay"})}
                          >
                            <SelectTrigger className="bg-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="MCQ">اختيار من متعدد</SelectItem>
                              <SelectItem value="essay">مقالي</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
  
                        <div className="space-y-2">
                          <Label>نص السؤال *</Label>
                          <Textarea 
                            value={questionFormData.question_text || ""}
                            onChange={e => setQuestionFormData({...questionFormData, question_text: e.target.value})}
                            placeholder="اكتب السؤال..."
                            className="min-h-[80px]"
                          />
                        </div>
  
                        {questionFormData.question_type === "MCQ" && (
                          <div className="space-y-3">
                            <Label>الخيارات (4 خيارات)</Label>
                            {questionFormData.options?.map((option, idx) => (
                              <div key={option.id} className="flex gap-3 items-center">
                                <Badge className="shrink-0">{idx + 1}</Badge>
                                <Input 
                                  value={option.text}
                                  onChange={e => {
                                    const updated = [...(questionFormData.options || [])];
                                    updated[idx] = {...option, text: e.target.value};
                                    setQuestionFormData({...questionFormData, options: updated});
                                  }}
                                  placeholder={`الخيار ${idx + 1}`}
                                  className="flex-1"
                                />
                                <RadioGroup 
                                  value={questionFormData.options?.find(o => o.is_correct)?.id || ""}
                                  onValueChange={v => {
                                    const updated = questionFormData.options?.map(o => ({
                                      ...o,
                                      is_correct: o.id === v
                                    })) || [];
                                    setQuestionFormData({...questionFormData, options: updated});
                                  }}
                                >
                                  <div className="flex items-center gap-2">
                                    <RadioGroupItem value={option.id} />
                                    <Label className="text-sm cursor-pointer">صح</Label>
                                  </div>
                                </RadioGroup>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddingQuestion(false)}>
                          إلغاء
                        </Button>
                        <Button 
                          onClick={handleSaveQuestion}
                          disabled={saving || !questionFormData.question_text}
                        >
                          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                          حفظ
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </TabsContent>
              )}

              {/* ==================== TAB 6: الأنشطة والتقييم ==================== */}
              {activeTab === "activities" && (
                <TabsContent value="activities" className="mt-0 space-y-6" dir="rtl">
                  
                  {/* التكليفات */}
                  <Card>
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <ClipboardList className="w-5 h-5 text-blue-600" />
                            VII. الأنشطة والتكليفات - {activePart}
                          </CardTitle>
                        </div>
                        <Button 
                          size="sm"
                          onClick={handleAddAssignment}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          إضافة تكليف
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-slate-50">
                              <TableHead className="w-12 text-center">#</TableHead>
                              <TableHead>التكليف/النشاط</TableHead>
                              <TableHead className="w-24 text-center">الأسبوع</TableHead>
                              <TableHead className="w-24 text-center">الدرجة</TableHead>
                              <TableHead className="w-32">النوع</TableHead>
                              <TableHead className="w-20"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {getAssignmentsByPart(activePart).length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">
                                  <p className="text-slate-400">لم تتم إضافة تكاليف بعد</p>
                                </TableCell>
                              </TableRow>
                            ) : (
                              getAssignmentsByPart(activePart).map((assignment, index) => (
                                <TableRow key={assignment.assignment_id} className="hover:bg-slate-50">
                                  <TableCell className="text-center">{index + 1}</TableCell>
                                  <TableCell>
                                    <Input 
                                      value={assignment.title}
                                      onChange={e => {
                                        const updated = assignments.map(a => 
                                          a.assignment_id === assignment.assignment_id 
                                            ? {...a, title: e.target.value}
                                            : a
                                        );
                                        setAssignments(updated);
                                      }}
                                      onBlur={handleSaveAssignment}
                                      className="bg-white"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Input 
                                      type="number"
                                      value={assignment.week}
                                      onChange={e => {
                                        const updated = assignments.map(a => 
                                          a.assignment_id === assignment.assignment_id 
                                            ? {...a, week: Number(e.target.value)}
                                            : a
                                        );
                                        setAssignments(updated);
                                      }}
                                      onBlur={handleSaveAssignment}
                                      className="bg-white text-center"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Input 
                                      type="number"
                                      value={assignment.grade}
                                      onChange={e => {
                                        const updated = assignments.map(a => 
                                          a.assignment_id === assignment.assignment_id 
                                            ? {...a, grade: Number(e.target.value)}
                                            : a
                                        );
                                        setAssignments(updated);
                                      }}
                                      onBlur={handleSaveAssignment}
                                      className="bg-white text-center"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Badge className="text-xs">{assignment.assignment_type}</Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Button 
                                      size="icon" 
                                      variant="ghost"
                                      className="text-red-500 h-8 w-8"
                                      onClick={() => handleDeleteAssignment(assignment.assignment_id)}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                            <TableRow className="bg-blue-50 font-bold">
                              <TableCell colSpan={3} className="text-left">الإجمالي</TableCell>
                              <TableCell className="text-center text-lg text-blue-600">
                                {getTotalAssignmentGrade(activePart)}
                              </TableCell>
                              <TableCell colSpan={2}></TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
  
                  {/* التقييمات */}
                  <Card>
                    <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-green-600" />
                            VIII. تقييم التعلم خلال الفصل الدراسي
                          </CardTitle>
                          <CardDescription className="text-xs mt-1">
                            يجب أن يساوي الإجمالي 100%
                          </CardDescription>
                        </div>
                        <div className={cn(
                          "px-4 py-2 rounded-lg border text-center shrink-0",
                          getTotalAssessmentPercentage() === 100 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                        )}>
                          <div className="text-xs text-slate-500 mb-1">الإجمالي</div>
                          <div className={cn(
                            "font-bold text-lg",
                            getTotalAssessmentPercentage() === 100 ? "text-green-600" : "text-red-600"
                          )}>
                            {getTotalAssessmentPercentage()}%
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-slate-50">
                              <TableHead className="w-12 text-center">#</TableHead>
                              <TableHead>نشاط التقييم</TableHead>
                              <TableHead className="w-24 text-center">الأسبوع</TableHead>
                              <TableHead className="w-24 text-center">الدرجة</TableHead>
                              <TableHead className="w-24 text-center">النسبة %</TableHead>
                              <TableHead className="w-20"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {assessments.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">
                                  <p className="text-slate-400">لم تتم إضافة تقييمات بعد</p>
                                </TableCell>
                              </TableRow>
                            ) : (
                              assessments.map((item, index) => (
                                <TableRow key={item.assessment_id} className="hover:bg-slate-50">
                                  <TableCell className="text-center">{index + 1}</TableCell>
                                  <TableCell>
                                    <Input 
                                      value={item.name}
                                      onChange={e => {
                                        const updated = assessments.map(a => 
                                          a.assessment_id === item.assessment_id 
                                            ? {...a, name: e.target.value}
                                            : a
                                        );
                                        setAssessments(updated);
                                      }}
                                      onBlur={handleSaveAssessment}
                                      className="bg-white"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Input 
                                      type="number"
                                      value={item.week || 0}
                                      onChange={e => {
                                        const updated = assessments.map(a => 
                                          a.assessment_id === item.assessment_id 
                                            ? {...a, week: Number(e.target.value)}
                                            : a
                                        );
                                        setAssessments(updated);
                                      }}
                                      onBlur={handleSaveAssessment}
                                      className="bg-white text-center"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Input 
                                      type="number"
                                      value={item.grade}
                                      onChange={e => {
                                        const updated = assessments.map(a => 
                                          a.assessment_id === item.assessment_id 
                                            ? {...a, grade: Number(e.target.value)}
                                            : a
                                        );
                                        setAssessments(updated);
                                      }}
                                      onBlur={handleSaveAssessment}
                                      className="bg-white text-center"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Input 
                                      type="number"
                                      value={item.percentage}
                                      onChange={e => {
                                        const updated = assessments.map(a => 
                                          a.assessment_id === item.assessment_id 
                                            ? {...a, percentage: Number(e.target.value)}
                                            : a
                                        );
                                        setAssessments(updated);
                                      }}
                                      onBlur={handleSaveAssessment}
                                      className="bg-white text-center"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Button 
                                      size="icon" 
                                      variant="ghost"
                                      className="text-red-500 h-8 w-8"
                                      onClick={() => handleDeleteAssessment(item.assessment_id)}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                            <TableRow className="bg-green-50 font-bold">
                              <TableCell colSpan={4} className="text-left">الإجمالي</TableCell>
                              <TableCell className={cn(
                                "text-center text-lg",
                                getTotalAssessmentPercentage() === 100 ? "text-green-600" : "text-red-600"
                              )}>
                                {getTotalAssessmentPercentage()}%
                              </TableCell>
                              <TableCell></TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
  
                      {getTotalAssessmentPercentage() !== 100 && (
                        <div className="mt-4 p-4 bg-amber-50 border-2 border-amber-200 rounded-lg flex gap-3">
                          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                          <p className="text-sm text-amber-700">
                            تحذير: إجمالي النسب ({getTotalAssessmentPercentage()}%) لا يساوي 100%. يرجى التأكد من صحة النسب.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              {/* ==================== TAB 7: المصادر ==================== */}
              {activeTab === "resources" && (
                <TabsContent value="resources" className="mt-0" dir="rtl">
                  <Card>
                    <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 border-b">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Book className="w-5 h-5 text-teal-600" />
                            IX. مصادر التعلم
                          </CardTitle>
                        </div>
                        <Button 
                          size="sm"
                          onClick={handleAddReference}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          إضافة مرجع
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      
                      <Accordion type="single" collapsible className="bg-teal-50/50 rounded-lg border border-teal-200">
                        <AccordionItem value="help" className="border-0">
                          <AccordionTrigger className="px-4 py-3 hover:no-underline">
                            <div className="flex items-center gap-2 text-teal-700">
                              <Info className="w-4 h-4" />
                              <span className="font-medium">إرشادات المراجع</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4 text-sm text-slate-700 space-y-2 border-r-2 border-teal-300 pr-4">
                            <p>✓ العدد المطلوب: مرجعان رئيسيان (على الأكثر)</p>
                            <p>✓ إضافة: مرجعان ثانويان (على الأقل)</p>
                            <p>✓ ومصدران إلكترونيان (موقع ويب أو مجلة)</p>
                            <p>✓ يجب أن يكون المرجع حديثاً</p>
                            <p>✓ صيغة: (اسم المؤلف، سنة النشر، العنوان، الإصدار، الناشر، البلد)</p>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
  
                      {(["main", "support", "electronic"] as const).map(type => (
                        <div key={type} className="space-y-3">
                          <h4 className="font-bold text-slate-800">
                            {type === "main" && "1) المراجع الرئيسية"}
                            {type === "support" && "2) المراجع المساعدة"}
                            {type === "electronic" && "3) مواد إلكترونية وإنترنت"}
                          </h4>
                          
                          {references.filter(r => r.type === type).length === 0 ? (
                            <div className="p-4 bg-slate-50 rounded-lg border border-dashed text-center text-slate-400 text-sm">
                              لم تتم إضافة مراجع من هذا النوع بعد
                            </div>
                          ) : (
                            references.filter(r => r.type === type).map((ref) => (
                              <div key={ref.reference_id} className="p-4 bg-slate-50 rounded-lg border space-y-3 hover:border-teal-300 transition-colors">
                                {type !== "electronic" ? (
                                  <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      <Input 
                                        value={ref.author || ""}
                                        onChange={e => {
                                          const updated = references.map(r => 
                                            r.reference_id === ref.reference_id 
                                              ? {...r, author: e.target.value}
                                              : r
                                          );
                                          setReferences(updated);
                                        }}
                                        placeholder="اسم المؤلف"
                                        className="bg-white"
                                      />
                                      <Input 
                                        value={ref.year || ""}
                                        onChange={e => {
                                          const updated = references.map(r => 
                                            r.reference_id === ref.reference_id 
                                              ? {...r, year: e.target.value}
                                              : r
                                          );
                                          setReferences(updated);
                                        }}
                                        placeholder="السنة"
                                        className="bg-white"
                                      />
                                    </div>
                                    <Input 
                                      value={ref.title}
                                      onChange={e => {
                                        const updated = references.map(r => 
                                          r.reference_id === ref.reference_id 
                                            ? {...r, title: e.target.value}
                                            : r
                                        );
                                        setReferences(updated);
                                      }}
                                      placeholder="العنوان"
                                      className="bg-white"
                                    />
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                      <Input 
                                        value={ref.edition || ""}
                                        onChange={e => {
                                          const updated = references.map(r => 
                                            r.reference_id === ref.reference_id 
                                              ? {...r, edition: e.target.value}
                                              : r
                                          );
                                          setReferences(updated);
                                        }}
                                        placeholder="الإصدار"
                                        className="bg-white"
                                      />
                                      <Input 
                                        value={ref.publisher || ""}
                                        onChange={e => {
                                          const updated = references.map(r => 
                                            r.reference_id === ref.reference_id 
                                              ? {...r, publisher: e.target.value}
                                              : r
                                          );
                                          setReferences(updated);
                                        }}
                                        placeholder="الناشر"
                                        className="bg-white"
                                      />
                                      <div className="flex gap-2">
                                        <Input 
                                          value={ref.country || ""}
                                          onChange={e => {
                                            const updated = references.map(r => 
                                              r.reference_id === ref.reference_id 
                                                ? {...r, country: e.target.value}
                                                : r
                                            );
                                            setReferences(updated);
                                          }}
                                          placeholder="البلد"
                                          className="bg-white flex-1"
                                        />
                                        <Button 
                                          size="icon" 
                                          variant="ghost"
                                          className="text-red-500 h-10"
                                          onClick={() => handleDeleteReference(ref.reference_id)}
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  </>
                                ) : (
                                  <div className="space-y-2 flex gap-2">
                                    <Input 
                                      value={ref.title}
                                      onChange={e => {
                                        const updated = references.map(r => 
                                          r.reference_id === ref.reference_id 
                                            ? {...r, title: e.target.value}
                                            : r
                                        );
                                        setReferences(updated);
                                      }}
                                      placeholder="اسم الموقع/المصدر"
                                      className="bg-white flex-1"
                                    />
                                    <Button 
                                      size="icon" 
                                      variant="ghost"
                                      className="text-red-500 h-10"
                                      onClick={() => handleDeleteReference(ref.reference_id)}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                )}
                                {type === "electronic" && (
                                  <Input 
                                    value={ref.url || ""}
                                    onChange={e => {
                                      const updated = references.map(r => 
                                        r.reference_id === ref.reference_id 
                                          ? {...r, url: e.target.value}
                                          : r
                                      );
                                      setReferences(updated);
                                    }}
                                    placeholder="https://example.com"
                                    className="bg-white"
                                  />
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              {/* ==================== TAB 8: الضوابط والسياسات ==================== */}
              {activeTab === "policies" && (
                <TabsContent value="policies" className="mt-0" dir="rtl">
                  <Card>
                    <CardHeader className="bg-gradient-to-r from-rose-50 to-red-50 border-b">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Award className="w-5 h-5 text-rose-600" />
                            X. الضوابط والسياسات المتبعة في المقرر
                          </CardTitle>
                          <CardDescription className="text-xs mt-1">
                            السياسات السبع الأولى ثابتة وإجبارية
                          </CardDescription>
                        </div>
                        <Button 
                          size="sm"
                          onClick={handleAddPolicy}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          إضافة سياسة
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      
                      {/* Fixed Policies */}
                      {FIXED_POLICIES.map((fixedPolicy, index) => (
                        <div key={fixedPolicy.policy_number} className="p-4 bg-red-50 rounded-lg border-2 border-red-200">
                          <div className="flex items-start gap-3">
                            <Badge className="shrink-0 bg-red-600 mt-1">{fixedPolicy.policy_number}</Badge>
                            <div className="flex-1">
                              <h4 className="font-bold text-slate-800 mb-2">{fixedPolicy.title}</h4>
                              <p className="text-sm text-slate-700 leading-relaxed">{fixedPolicy.content}</p>
                              <Badge variant="outline" className="mt-2 bg-red-100 text-red-700 border-red-300">
                                ثابتة
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
  
                      {/* Custom Policies */}
                      {policies.filter(p => !p.is_fixed).length > 0 && (
                        <div className="mt-6 pt-6 border-t">
                          <h4 className="font-bold text-slate-800 mb-4">سياسات إضافية</h4>
                          {policies.filter(p => !p.is_fixed).map((policy) => (
                            <div key={policy.policy_id} className="p-4 bg-slate-50 rounded-lg border mb-3 space-y-3 hover:border-slate-300 transition-colors">
                              <div className="flex items-start gap-3">
                                <Badge className="shrink-0 bg-slate-600 mt-1">{policy.policy_number}</Badge>
                                <div className="flex-1">
                                  <Input 
                                    value={policy.title}
                                    onChange={e => {
                                      const updated = policies.map(p => 
                                        p.policy_id === policy.policy_id 
                                          ? {...p, title: e.target.value}
                                          : p
                                      );
                                      setPolicies(updated);
                                    }}
                                    className="bg-white font-bold mb-2"
                                    placeholder="عنوان السياسة"
                                  />
                                  <Textarea 
                                    value={policy.content}
                                    onChange={e => {
                                      const updated = policies.map(p => 
                                        p.policy_id === policy.policy_id 
                                          ? {...p, content: e.target.value}
                                          : p
                                      );
                                      setPolicies(updated);
                                    }}
                                    className="bg-white min-h-[80px]"
                                    placeholder="محتوى السياسة..."
                                  />
                                </div>
                                <Button 
                                  size="icon" 
                                  variant="ghost"
                                  className="text-red-500 shrink-0"
                                  onClick={() => handleDeletePolicy(policy.policy_id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

            </div>
          </ScrollArea>
        </Tabs>

        {/* ==================== FOOTER ==================== */}
        <div className="p-4 border-t bg-slate-50 shrink-0 flex flex-col sm:flex-row justify-between gap-3" dir="rtl">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Info className="w-4 h-4" />
            <span>الجزء النشط: <strong>{activePart}</strong> • التاب: <strong>{activeTab}</strong></span>
          </div>
          <div className="flex gap-2 justify-end flex-wrap">
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              إغلاق
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              تصدير PDF
            </Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Save className="w-4 h-4 mr-2" />
              حفظ جميع التغييرات
            </Button>
          </div>
        </div>

        {loading && (
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center rounded-lg z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <p className="text-sm font-medium text-slate-700">جاري تحميل البيانات...</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}