import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Target, Plus, Edit, Trash2, Info, BookOpen, GraduationCap, 
  Lightbulb, Layers, Book, ClipboardList, Save, Download, X,
  AlertCircle, FileText, Award, BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CourseQualityDialogProps {
  isOpen: boolean;
  onClose: () => void;
  course: {
    id: number;
    course_code: string;
    course_name: string;
    credit_hours: number;
    parts?: string[];
    weight?: number;
    category?: string;
    prerequisites?: string;
    corequisites?: string;
    teaching_language?: string;
    course_parts?: Array<{
      name: string;
      theoretical_hours: number;
      practical_hours: number;
      exercise_hours: number;
      seminar_hours: number;
    }>;
  } | null;
}

interface CourseGoal {
  id: string;
  text: string;
}

interface LearningOutcome {
  id: string;
  code: string;
  text: string;
  category: "knowledge" | "intellectual" | "professional" | "general";
  program_outcome_id?: string;
  program_outcome_weight?: number;
  weight?: number;
}

interface TeachingStrategy {
  id: string;
  name: string;
}

interface AssessmentMethod {
  id: string;
  name: string;
}

interface OutcomeMapping {
  outcome_id: string;
  teaching_strategies: string[];
  assessment_methods: string[];
}

interface Topic {
  id: string;
  part: string;
  week: number;
  unit_name: string;
  subtopics: string[];
  outcome_ids: string[];
  hours: number;
  is_exam?: boolean;
}

interface Question {
  id: string;
  topic_id: string;
  subtopic: string;
  question_text: string;
  options: Array<{ id: string; text: string; is_correct: boolean }>;
}

interface Assignment {
  id: string;
  part: string;
  title: string;
  week: number;
  grade: number;
  outcome_ids: string[];
}

interface AssessmentItem {
  id: string;
  name: string;
  week: number;
  grade: number;
  percentage: number;
  outcome_ids: string[];
}

interface Reference {
  id: string;
  type: "main" | "support" | "electronic";
  author?: string;
  year?: string;
  title: string;
  edition?: string;
  publisher?: string;
  country?: string;
  url?: string;
}

interface Policy {
  id: string;
  title: string;
  content: string;
}

export default function CourseQualityDialog({ isOpen, onClose, course }: CourseQualityDialogProps) {
  const [activeTab, setActiveTab] = useState("info");
  const [activePart, setActivePart] = useState<string>(course?.parts?.[0] || "نظري");

  const [courseDescription, setCourseDescription] = useState(
    "يهدف هذا المقرر إلى تزويد الطلاب بالمعرفة الأساسية حول هياكل البيانات والخوارزميات وكيفية استخدامها في حل المشكلات البرمجية. ويغطي هذا المقرر المصفوفات، القوائم المترابطة، الأشجار، الرسوم البيانية، وخوارزميات البحث والترتيب. ويركز هذا المقرر على الجانب العملي من خلال تطبيق المفاهيم في مشاريع برمجية حقيقية باستخدام لغة Java. ويعتمد هذا المقرر على إتمام مقرر مقدمة في البرمجة (CS101) كمتطلب سابق."
  );

  const [courseGoals, setCourseGoals] = useState<CourseGoal[]>([
    { id: "1", text: "تطوير فهم عميق للمفاهيم الأساسية لهياكل البيانات والخوارزميات" },
    { id: "2", text: "تمكين الطلاب من تحليل كفاءة الخوارزميات باستخدام التدوين الكبير O" },
    { id: "3", text: "إكساب الطلاب القدرة على اختيار هيكل البيانات المناسب لحل مشكلة معينة" },
    { id: "4", text: "تطوير مهارات البرمجة من خلال تطبيق هياكل البيانات في مشاريع عملية" }
  ]);

  const [learningOutcomes, setLearningOutcomes] = useState<LearningOutcome[]>([
    { 
      id: "a1", 
      code: "A1", 
      text: "يشرح المفاهيم الأساسية لهياكل البيانات المختلفة (المصفوفات، القوائم، الأشجار)", 
      category: "knowledge", 
      program_outcome_id: "PLO-1", 
      program_outcome_weight: 40,
      weight: 20 
    },
    { 
      id: "a2", 
      code: "A2", 
      text: "يصف خوارزميات البحث والترتيب الأساسية ويحدد تعقيدها الزمني", 
      category: "knowledge", 
      program_outcome_id: "PLO-1", 
      program_outcome_weight: 40,
      weight: 15 
    },
    { 
      id: "b1", 
      code: "B1", 
      text: "يحلل كفاءة الخوارزميات المختلفة ويقارن بينها", 
      category: "intellectual", 
      program_outcome_id: "PLO-2", 
      program_outcome_weight: 30,
      weight: 20 
    },
    { 
      id: "b2", 
      code: "B2", 
      text: "يقيّم هياكل البيانات المختلفة ويختار الأنسب لحل مشكلة محددة", 
      category: "intellectual", 
      program_outcome_id: "PLO-2", 
      program_outcome_weight: 30,
      weight: 15 
    },
    { 
      id: "c1", 
      code: "C1", 
      text: "يطبق هياكل البيانات والخوارزميات في حل مشاكل برمجية حقيقية", 
      category: "professional", 
      program_outcome_id: "PLO-3", 
      program_outcome_weight: 20,
      weight: 20 
    },
    { 
      id: "c2", 
      code: "C2", 
      text: "يبرمج هياكل بيانات مخصصة باستخدام لغة Java", 
      category: "professional", 
      program_outcome_id: "PLO-3", 
      program_outcome_weight: 20,
      weight: 10 
    }
  ]);

  const [teachingStrategies, setTeachingStrategies] = useState<TeachingStrategy[]>([
    { id: "1", name: "المحاضرة التفاعلية" },
    { id: "2", name: "التعلم بالممارسة" },
    { id: "3", name: "حل المشكلات الجماعي" },
    { id: "4", name: "المشاريع العملية" }
  ]);

  const [assessmentMethods, setAssessmentMethods] = useState<AssessmentMethod[]>([
    { id: "1", name: "اختبارات قصيرة" },
    { id: "2", name: "واجبات برمجية" },
    { id: "3", name: "امتحان نصفي" },
    { id: "4", name: "مشروع نهائي" },
    { id: "5", name: "امتحان نهائي" }
  ]);

  const [outcomesMappings, setOutcomesMappings] = useState<OutcomeMapping[]>([
    {
      outcome_id: "a1",
      teaching_strategies: ["1", "2"],
      assessment_methods: ["1", "3"]
    },
    {
      outcome_id: "a2",
      teaching_strategies: ["1", "2"],
      assessment_methods: ["1", "3", "5"]
    },
    {
      outcome_id: "b1",
      teaching_strategies: ["1", "3"],
      assessment_methods: ["2", "3", "5"]
    },
    {
      outcome_id: "b2",
      teaching_strategies: ["3", "4"],
      assessment_methods: ["2", "4"]
    },
    {
      outcome_id: "c1",
      teaching_strategies: ["2", "4"],
      assessment_methods: ["2", "4"]
    },
    {
      outcome_id: "c2",
      teaching_strategies: ["2", "4"],
      assessment_methods: ["2", "4", "5"]
    }
  ]);

  const [topics, setTopics] = useState<Topic[]>([
    {
      id: "1",
      part: "نظري",
      week: 1,
      unit_name: "مقدمة في هياكل البيانات",
      subtopics: ["مفهوم هياكل البيانات", "أهمية هياكل البيانات", "أنواع هياكل البيانات"],
      outcome_ids: ["A1"],
      hours: 2
    },
    {
      id: "2",
      part: "نظري",
      week: 2,
      unit_name: "المصفوفات Arrays",
      subtopics: ["المصفوفات أحادية البعد", "المصفوفات متعددة الأبعاد", "عمليات المصفوفات"],
      outcome_ids: ["A1", "C1"],
      hours: 2
    },
    {
      id: "3",
      part: "نظري",
      week: 3,
      unit_name: "القوائم المترابطة Linked Lists",
      subtopics: ["القوائم المترابطة المفردة", "القوائم المترابطة المزدوجة", "القوائم الدائرية"],
      outcome_ids: ["A1", "C1"],
      hours: 2
    },
    {
      id: "4",
      part: "نظري",
      week: 4,
      unit_name: "الأكوام Stacks والطوابير Queues",
      subtopics: ["مفهوم الأكوام", "تطبيقات الأكوام", "مفهوم الطوابير", "أنواع الطوابير"],
      outcome_ids: ["A1", "B2", "C1"],
      hours: 2
    },
    {
      id: "5",
      part: "نظري",
      week: 5,
      unit_name: "خوارزميات البحث",
      subtopics: ["البحث الخطي", "البحث الثنائي", "تحليل كفاءة خوارزميات البحث"],
      outcome_ids: ["A2", "B1"],
      hours: 2
    },
    {
      id: "6",
      part: "نظري",
      week: 6,
      unit_name: "خوارزميات الترتيب (1)",
      subtopics: ["Bubble Sort", "Selection Sort", "Insertion Sort"],
      outcome_ids: ["A2", "B1"],
      hours: 2
    },
    {
      id: "7",
      part: "نظري",
      week: 7,
      unit_name: "خوارزميات الترتيب (2)",
      subtopics: ["Merge Sort", "Quick Sort", "مقارنة الخوارزميات"],
      outcome_ids: ["A2", "B1"],
      hours: 2
    },
    {
      id: "8",
      part: "نظري",
      week: 8,
      unit_name: "الامتحان النصفي",
      subtopics: [],
      outcome_ids: ["A1", "A2", "B1"],
      hours: 2,
      is_exam: true
    },
    {
      id: "9",
      part: "نظري",
      week: 9,
      unit_name: "الأشجار Trees - الجزء الأول",
      subtopics: ["مفهوم الأشجار", "الأشجار الثنائية", "اجتياز الأشجار"],
      outcome_ids: ["A1", "C1"],
      hours: 2
    },
    {
      id: "10",
      part: "نظري",
      week: 10,
      unit_name: "أشجار البحث الثنائية BST",
      subtopics: ["خصائص BST", "الإضافة والحذف", "البحث في BST"],
      outcome_ids: ["A1", "B2", "C1"],
      hours: 2
    },
    {
      id: "11",
      part: "عملي",
      week: 1,
      unit_name: "تطبيق المصفوفات في Java",
      subtopics: ["إنشاء المصفوفات", "العمليات الأساسية", "أمثلة تطبيقية"],
      outcome_ids: ["C1", "C2"],
      hours: 2
    },
    {
      id: "12",
      part: "عملي",
      week: 2,
      unit_name: "برمجة القوائم المترابطة",
      subtopics: ["تصميم Node Class", "تطبيق LinkedList", "العمليات الأساسية"],
      outcome_ids: ["C1", "C2"],
      hours: 2
    },
    {
      id: "13",
      part: "عملي",
      week: 3,
      unit_name: "تطبيق الأكوام والطوابير",
      subtopics: ["برمجة Stack", "برمجة Queue", "تطبيقات عملية"],
      outcome_ids: ["C1", "C2"],
      hours: 2
    }
  ]);

  const [questions, setQuestions] = useState<Question[]>([
    {
      id: "q1",
      topic_id: "1",
      subtopic: "مفهوم هياكل البيانات",
      question_text: "ما هي هياكل البيانات؟",
      options: [
        { id: "1", text: "طريقة لتنظيم وتخزين البيانات بكفاءة", is_correct: true },
        { id: "2", text: "لغة برمجة خاصة", is_correct: false },
        { id: "3", text: "نوع من قواعد البيانات", is_correct: false },
        { id: "4", text: "برنامج تطبيقي", is_correct: false }
      ]
    },
    {
      id: "q2",
      topic_id: "1",
      subtopic: "أنواع هياكل البيانات",
      question_text: "أي من التالي يُعتبر هيكل بيانات خطي؟",
      options: [
        { id: "1", text: "الأشجار", is_correct: false },
        { id: "2", text: "الرسوم البيانية", is_correct: false },
        { id: "3", text: "المصفوفات", is_correct: true },
        { id: "4", text: "الأكوام الثنائية", is_correct: false }
      ]
    },
    {
      id: "q3",
      topic_id: "2",
      subtopic: "المصفوفات أحادية البعد",
      question_text: "ما هو التعقيد الزمني للوصول إلى عنصر في المصفوفة باستخدام الفهرس؟",
      options: [
        { id: "1", text: "O(n)", is_correct: false },
        { id: "2", text: "O(log n)", is_correct: false },
        { id: "3", text: "O(1)", is_correct: true },
        { id: "4", text: "O(n²)", is_correct: false }
      ]
    },
    {
      id: "q4",
      topic_id: "3",
      subtopic: "القوائم المترابطة المفردة",
      question_text: "في القائمة المترابطة المفردة، كل عقدة تحتوي على:",
      options: [
        { id: "1", text: "البيانات فقط", is_correct: false },
        { id: "2", text: "المؤشر للعقدة التالية فقط", is_correct: false },
        { id: "3", text: "البيانات والمؤشر للعقدة التالية", is_correct: true },
        { id: "4", text: "البيانات ومؤشران", is_correct: false }
      ]
    },
    {
      id: "q5",
      topic_id: "4",
      subtopic: "مفهوم الأكوام",
      question_text: "الأكوام Stack تتبع مبدأ:",
      options: [
        { id: "1", text: "FIFO - الأول في الأول خارج", is_correct: false },
        { id: "2", text: "LIFO - الأخير في الأول خارج", is_correct: true },
        { id: "3", text: "Random Access", is_correct: false },
        { id: "4", text: "Sequential Access", is_correct: false }
      ]
    },
    {
      id: "q6",
      topic_id: "5",
      subtopic: "البحث الثنائي",
      question_text: "متى يمكن استخدام خوارزمية البحث الثنائي؟",
      options: [
        { id: "1", text: "في أي مصفوفة", is_correct: false },
        { id: "2", text: "في مصفوفة مرتبة فقط", is_correct: true },
        { id: "3", text: "في القوائم المترابطة فقط", is_correct: false },
        { id: "4", text: "في الأشجار فقط", is_correct: false }
      ]
    }
  ]);

  const [assignments, setAssignments] = useState<Assignment[]>([
    {
      id: "1",
      part: "نظري",
      title: "واجب: تحليل كفاءة الخوارزميات",
      week: 3,
      grade: 5,
      outcome_ids: ["A2", "B1"]
    },
    {
      id: "2",
      part: "نظري",
      title: "بحث: تطبيقات هياكل البيانات في الحياة الواقعية",
      week: 6,
      grade: 5,
      outcome_ids: ["A1", "B2"]
    },
    {
      id: "3",
      part: "عملي",
      title: "مشروع: برمجة قائمة مترابطة كاملة",
      week: 5,
      grade: 10,
      outcome_ids: ["C1", "C2"]
    },
    {
      id: "4",
      part: "عملي",
      title: "مشروع نهائي: نظام إدارة باستخدام هياكل البيانات",
      week: 15,
      grade: 15,
      outcome_ids: ["B2", "C1", "C2"]
    }
  ]);

  const [assessmentItems, setAssessmentItems] = useState<AssessmentItem[]>([
    {
      id: "1",
      name: "الأنشطة والتكليفات",
      week: 0,
      grade: 10,
      percentage: 10,
      outcome_ids: ["A1", "A2", "B2"]
    },
    {
      id: "2",
      name: "اختبارات قصيرة",
      week: 0,
      grade: 10,
      percentage: 10,
      outcome_ids: ["A1", "A2"]
    },
    {
      id: "3",
      name: "المشاريع العملية",
      week: 0,
      grade: 20,
      percentage: 20,
      outcome_ids: ["C1", "C2"]
    },
    {
      id: "4",
      name: "اختبار منتصف الفصل",
      week: 8,
      grade: 20,
      percentage: 20,
      outcome_ids: ["A1", "A2", "B1"]
    },
    {
      id: "5",
      name: "الاختبار النهائي",
      week: 16,
      grade: 40,
      percentage: 40,
      outcome_ids: ["A1", "A2", "B1", "B2", "C1", "C2"]
    }
  ]);

  const [references, setReferences] = useState<Reference[]>([
    {
      id: "1",
      type: "main",
      author: "Mark Allen Weiss",
      year: "2022",
      title: "Data Structures and Algorithm Analysis in Java",
      edition: "الطبعة الرابعة",
      publisher: "Pearson Education",
      country: "الولايات المتحدة"
    },
    {
      id: "2",
      type: "main",
      author: "Robert Lafore",
      year: "2021",
      title: "Data Structures and Algorithms in Java",
      edition: "الطبعة الثانية",
      publisher: "Sams Publishing",
      country: "الولايات المتحدة"
    },
    {
      id: "3",
      type: "support",
      author: "Michael T. Goodrich",
      year: "2020",
      title: "Data Structures and Algorithms in Java",
      edition: "الطبعة السادسة",
      publisher: "Wiley",
      country: "الولايات المتحدة"
    },
    {
      id: "4",
      type: "support",
      author: "Adam Drozdek",
      year: "2019",
      title: "Data Structures and Algorithms in Java",
      edition: "الطبعة الرابعة",
      publisher: "Cengage Learning",
      country: "الولايات المتحدة"
    },
    {
      id: "5",
      type: "electronic",
      title: "GeeksforGeeks - Data Structures",
      url: "https://www.geeksforgeeks.org/data-structures/"
    },
    {
      id: "6",
      type: "electronic",
      title: "Visualgo - Data Structures Visualization",
      url: "https://visualgo.net/"
    },
    {
      id: "7",
      type: "electronic",
      title: "MIT OpenCourseWare - Introduction to Algorithms",
      url: "https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/"
    }
  ]);

  const [policies, setPolicies] = useState<Policy[]>([
    {
      id: "1",
      title: "الحضور والغياب",
      content: "الحضور إلزامي ويعتبر الطالب محروماً إذا تجاوزت نسبة غيابه 25% من الساعات المحددة. يجب على الطالب تقديم عذر رسمي في حالة الغياب الضروري."
    },
    {
      id: "2",
      title: "الحضور المتأخر",
      content: "يعتبر الطالب متأخراً عن الفصل إذا لم يكن في الفصل بعد 10 دقائق من وقت بدء المحاضرة. التأخر المتكرر (أكثر من 3 مرات) يحتسب كغياب."
    },
    {
      id: "3",
      title: "ضوابط الاختبار",
      content: "لا يُسمح لأي طالب دخول قاعة الاختبارات بعد مرور 30 دقيقة من وقت بدء الاختبار، ولا يُسمح له بمغادرة القاعة قبل مرور نصف وقت الاختبار. يجب إحضار البطاقة الجامعية."
    },
    {
      id: "4",
      title: "التكليفات والمشاريع",
      content: "يجب على الطالب تقديم الواجبات والمشاريع في الوقت المحدد. التأخير في التسليم يؤدي لخصم 20% من الدرجة عن كل يوم تأخير. لن يُقبل أي عمل بعد أسبوع من الموعد المحدد."
    },
    {
      id: "5",
      title: "الغش والانتحال",
      content: "الغش في الامتحانات أو انتحال الأعمال هو فعل احتيالي ينتج عنه إلغاء الاختبار/العمل للطالب وإعطاؤه درجة صفر. في حالة التكرار يتم تطبيق العقوبات المنصوص عليها في نظام الطلاب الموحد (2008)."
    },
    {
      id: "6",
      title: "التزوير وانتحال الهوية",
      content: "التزوير أو انتحال الهوية هو عمل احتيالي خطير ينتج عنه إلغاء الاختبار وإحالة الطالب للجنة التأديبية مع تطبيق العقوبات المنصوص عليها في النظام الموحد."
    },
    {
      id: "7",
      title: "الأجهزة الإلكترونية",
      content: "يُمنع استخدام الهواتف المحمولة أو أي أجهزة إلكترونية أثناء المحاضرات والامتحانات إلا بإذن صريح من المدرس. يجب وضع الأجهزة في وضع الصامت."
    },
    {
      id: "8",
      title: "آداب الحضور",
      content: "يجب على الطلاب الالتزام بالزي المحتشم واحترام المدرس وزملاء الدراسة. يُمنع الأكل والشرب داخل القاعات الدراسية (ماعدا الماء). يُمنع إحداث أي إزعاج أثناء المحاضرة."
    }
  ]);

  

  const [isOutcomeFormOpen, setIsOutcomeFormOpen] = useState(false);
  const [outcomeFormData, setOutcomeFormData] = useState<Partial<LearningOutcome>>({});
  const [editingOutcomeId, setEditingOutcomeId] = useState<string | null>(null);

  const [isTopicFormOpen, setIsTopicFormOpen] = useState(false);
  const [topicFormData, setTopicFormData] = useState<Partial<Topic>>({});
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);

  const [isQuestionFormOpen, setIsQuestionFormOpen] = useState(false);
  const [questionFormData, setQuestionFormData] = useState<Partial<Question>>({
    options: [
      { id: "1", text: "", is_correct: false },
      { id: "2", text: "", is_correct: false },
      { id: "3", text: "", is_correct: false },
      { id: "4", text: "", is_correct: false }
    ]
  });

  const [selectedTopicForQuestions, setSelectedTopicForQuestions] = useState<string | null>(null);

  // States الجديدة
  const [isAddTeachingStrategyOpen, setIsAddTeachingStrategyOpen] = useState(false);
  const [isAddAssessmentMethodOpen, setIsAddAssessmentMethodOpen] = useState(false);
  const [isEditMappingOpen, setIsEditMappingOpen] = useState(false);
  const [selectedTeachingStrategy, setSelectedTeachingStrategy] = useState('');
  const [selectedAssessmentMethod, setSelectedAssessmentMethod] = useState('');
  const [currentOutcomeId, setCurrentOutcomeId] = useState<string | null>(null);
  const [currentMapping, setCurrentMapping] = useState<OutcomeMapping | null>(null);
  const [editMappingData, setEditMappingData] = useState<{
    teaching_strategies: string[];
    assessment_methods: string[];
  }>({
    teaching_strategies: [],
    assessment_methods: []
  });

  if (!course) return null;

  const categoryLabels = {
    knowledge: "المعرفة والفهم",
    intellectual: "المهارات الذهنية",
    professional: "المهارات المهنية والعملية",
    general: "المهارات العامة"
  };

  const categoryColors = {
    knowledge: "bg-blue-50 text-blue-700 border-blue-200",
    intellectual: "bg-purple-50 text-purple-700 border-purple-200",
    professional: "bg-green-50 text-green-700 border-green-200",
    general: "bg-amber-50 text-amber-700 border-amber-200"
  };

  const totalOutcomeWeight = learningOutcomes.reduce((sum, o) => sum + (o.weight || 0), 0);
  const totalAssessmentPercentage = assessmentItems.reduce((sum, a) => sum + (a.percentage || 0), 0);

  const handleAddOutcome = (category: "knowledge" | "intellectual" | "professional" | "general") => {
    setOutcomeFormData({ 
      category, 
      code: "", 
      text: "", 
      weight: 0,
      program_outcome_id: "",
      program_outcome_weight: 0
    });
    setEditingOutcomeId(null);
    setIsOutcomeFormOpen(true);
  };

  const handleSaveOutcome = () => {
    if (editingOutcomeId) {
      setLearningOutcomes(learningOutcomes.map(o => 
        o.id === editingOutcomeId ? { ...o, ...outcomeFormData } as LearningOutcome : o
      ));
    } else {
      setLearningOutcomes([...learningOutcomes, {
        id: Date.now().toString(),
        ...outcomeFormData
      } as LearningOutcome]);
    }
    setIsOutcomeFormOpen(false);
  };

  const handleDeleteOutcome = (id: string) => {
    if (confirm("هل أنت متأكد من الحذف؟")) {
      setLearningOutcomes(learningOutcomes.filter(o => o.id !== id));
    }
  };

  const handleAddTopic = () => {
    setTopicFormData({
      part: activePart,
      week: 1,
      unit_name: "",
      subtopics: [""],
      outcome_ids: [],
      hours: 2,
      is_exam: false
    });
    setEditingTopicId(null);
    setIsTopicFormOpen(true);
  };

  const handleSaveTopic = () => {
    if (editingTopicId) {
      setTopics(topics.map(t => 
        t.id === editingTopicId ? { ...t, ...topicFormData } as Topic : t
      ));
    } else {
      setTopics([...topics, {
        id: Date.now().toString(),
        ...topicFormData
      } as Topic]);
    }
    setIsTopicFormOpen(false);
  };

  const handleDeleteTopic = (id: string) => {
    if (confirm("هل أنت متأكد من الحذف؟")) {
      setTopics(topics.filter(t => t.id !== id));
      setQuestions(questions.filter(q => q.topic_id !== id));
    }
  };

  const handleAddQuestion = (topicId: string) => {
    setQuestionFormData({
      topic_id: topicId,
      subtopic: "",
      question_text: "",
      options: [
        { id: "1", text: "", is_correct: false },
        { id: "2", text: "", is_correct: false },
        { id: "3", text: "", is_correct: false },
        { id: "4", text: "", is_correct: false }
      ]
    });
    setSelectedTopicForQuestions(topicId);
    setIsQuestionFormOpen(true);
  };

  const handleSaveQuestion = () => {
    setQuestions([...questions, {
      id: Date.now().toString(),
      ...questionFormData
    } as Question]);
    setIsQuestionFormOpen(false);
  };

  const handleDeleteQuestion = (id: string) => {
    if (confirm("هل أنت متأكد؟")) {
      setQuestions(questions.filter(q => q.id !== id));
    }
  };

  const handleUpdateQuestionOption = (optionId: string, field: "text" | "is_correct", value: any) => {
    setQuestionFormData({
      ...questionFormData,
      options: questionFormData.options!.map(opt => 
        opt.id === optionId 
          ? { ...opt, [field]: field === "is_correct" ? value : opt.is_correct, text: field === "text" ? value : opt.text }
          : field === "is_correct" && value ? { ...opt, is_correct: false } : opt
      )
    });
  };

  const getStrategyName = (id: string) => teachingStrategies.find(s => s.id === id)?.name || "";
  const getAssessmentName = (id: string) => assessmentMethods.find(m => m.id === id)?.name || "";

    // ========== أضف الدوال الجديدة هنا ==========

  // دالة إضافة استراتيجية تدريس
  const handleAddTeachingStrategy = (outcomeId: string) => {
    const mapping = outcomesMappings.find(m => m.outcome_id === outcomeId);
    setCurrentOutcomeId(outcomeId);
    setCurrentMapping(mapping || null);
    setSelectedTeachingStrategy('');
    setIsAddTeachingStrategyOpen(true);
  };

  const confirmAddTeachingStrategy = () => {
    if (!selectedTeachingStrategy || !currentOutcomeId) return;
    
    const mappingIndex = outcomesMappings.findIndex(m => m.outcome_id === currentOutcomeId);
    
    if (mappingIndex !== -1) {
      const updatedMappings = [...outcomesMappings];
      updatedMappings[mappingIndex] = {
        ...updatedMappings[mappingIndex],
        teaching_strategies: [...updatedMappings[mappingIndex].teaching_strategies, selectedTeachingStrategy]
      };
      setOutcomesMappings(updatedMappings);
    } else {
      // إذا لم يكن هناك mapping، أنشئ واحداً جديداً
      setOutcomesMappings([...outcomesMappings, {
        outcome_id: currentOutcomeId,
        teaching_strategies: [selectedTeachingStrategy],
        assessment_methods: []
      }]);
    }
    
    setSelectedTeachingStrategy('');
    setIsAddTeachingStrategyOpen(false);
  };

  // دالة حذف استراتيجية تدريس
  const handleRemoveTeachingStrategy = (outcomeId: string, strategyId: string) => {
    const mappingIndex = outcomesMappings.findIndex(m => m.outcome_id === outcomeId);
    
    if (mappingIndex !== -1) {
      const updatedMappings = [...outcomesMappings];
      updatedMappings[mappingIndex] = {
        ...updatedMappings[mappingIndex],
        teaching_strategies: updatedMappings[mappingIndex].teaching_strategies.filter(id => id !== strategyId)
      };
      setOutcomesMappings(updatedMappings);
    }
  };

  // دالة إضافة طريقة تقييم
  const handleAddAssessmentMethod = (outcomeId: string) => {
    const mapping = outcomesMappings.find(m => m.outcome_id === outcomeId);
    setCurrentOutcomeId(outcomeId);
    setCurrentMapping(mapping || null);
    setSelectedAssessmentMethod('');
    setIsAddAssessmentMethodOpen(true);
  };

  const confirmAddAssessmentMethod = () => {
    if (!selectedAssessmentMethod || !currentOutcomeId) return;
    
    const mappingIndex = outcomesMappings.findIndex(m => m.outcome_id === currentOutcomeId);
    
    if (mappingIndex !== -1) {
      const updatedMappings = [...outcomesMappings];
      updatedMappings[mappingIndex] = {
        ...updatedMappings[mappingIndex],
        assessment_methods: [...updatedMappings[mappingIndex].assessment_methods, selectedAssessmentMethod]
      };
      setOutcomesMappings(updatedMappings);
    } else {
      // إذا لم يكن هناك mapping، أنشئ واحداً جديداً
      setOutcomesMappings([...outcomesMappings, {
        outcome_id: currentOutcomeId,
        teaching_strategies: [],
        assessment_methods: [selectedAssessmentMethod]
      }]);
    }
    
    setSelectedAssessmentMethod('');
    setIsAddAssessmentMethodOpen(false);
  };

  // دالة حذف طريقة تقييم
  const handleRemoveAssessmentMethod = (outcomeId: string, methodId: string) => {
    const mappingIndex = outcomesMappings.findIndex(m => m.outcome_id === outcomeId);
    
    if (mappingIndex !== -1) {
      const updatedMappings = [...outcomesMappings];
      updatedMappings[mappingIndex] = {
        ...updatedMappings[mappingIndex],
        assessment_methods: updatedMappings[mappingIndex].assessment_methods.filter(id => id !== methodId)
      };
      setOutcomesMappings(updatedMappings);
    }
  };

  // دالة التعديل الشامل
  const handleEditMapping = (outcomeId: string) => {
    const mapping = outcomesMappings.find(m => m.outcome_id === outcomeId);
    setCurrentOutcomeId(outcomeId);
    setEditMappingData({
      teaching_strategies: mapping?.teaching_strategies || [],
      assessment_methods: mapping?.assessment_methods || []
    });
    setIsEditMappingOpen(true);
  };

  const confirmEditMapping = () => {
    if (!currentOutcomeId) return;
    
    const mappingIndex = outcomesMappings.findIndex(m => m.outcome_id === currentOutcomeId);
    
    if (mappingIndex !== -1) {
      const updatedMappings = [...outcomesMappings];
      updatedMappings[mappingIndex] = {
        ...updatedMappings[mappingIndex],
        ...editMappingData
      };
      setOutcomesMappings(updatedMappings);
    } else {
      // إذا لم يكن هناك mapping، أنشئ واحداً جديداً
      setOutcomesMappings([...outcomesMappings, {
        outcome_id: currentOutcomeId,
        ...editMappingData
      }]);
    }
    
    setIsEditMappingOpen(false);
  };
  
  // ========== نهاية الدوال الجديدة ==========
  

  return (
    <Dialog open={isOpen} onOpenChange={onClose} >
      <DialogContent className="max-w-[95vw] w-full h-[95vh] p-0 gap-0 flex flex-col overflow-hidden" dir="rtl">
        
        <DialogHeader className="p-4 md:p-6 border-b bg-gradient-to-r from-indigo-50 to-blue-50 shrink-0" dir="rtl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="bg-indigo-100 p-3 rounded-xl shrink-0">
                <Target className="w-6 h-6 text-indigo-700" />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-xl md:text-2xl text-slate-800 flex items-center gap-2 flex-wrap">
                  توصيف المقرر ومخرجات التعلم
                  <Badge variant="outline" className="bg-white font-mono">{course.course_code}</Badge>
                </DialogTitle>
                <DialogDescription className="text-base mt-1.5 text-slate-600">
                  {course.course_name} • {course.credit_hours} ساعات معتمدة
                </DialogDescription>
              </div>
            </div>
            
            {course.parts && course.parts.length > 1 && (
              <div className="flex bg-white p-1 rounded-lg border shadow-sm w-fit">
                {course.parts.map((part) => (
                  <Button
                    key={part}
                    variant={activePart === part ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "px-4 md:px-6 rounded-md transition-all",
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

          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-white p-2 rounded-lg border">
              <div className="text-slate-500 mb-1">إجمالي المخرجات</div>
              <div className="font-bold text-lg text-indigo-600">{learningOutcomes.length}</div>
            </div>
            <div className="bg-white p-2 rounded-lg border">
              <div className="text-slate-500 mb-1">مجموع الأوزان</div>
              <div className={cn("font-bold text-lg", totalOutcomeWeight === 100 ? "text-green-600" : "text-amber-600")}>
                {totalOutcomeWeight}%
              </div>
            </div>
            <div className="bg-white p-2 rounded-lg border">
              <div className="text-slate-500 mb-1">نسب التقييم</div>
              <div className={cn("font-bold text-lg", totalAssessmentPercentage === 100 ? "text-green-600" : "text-red-600")}>
                {totalAssessmentPercentage}%
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden" dir="rtl">
          <div className="border-b bg-slate-50 px-4 shrink-0 overflow-x-auto">
            <TabsList className="bg-transparent h-auto p-0 gap-1 w-full md:w-auto inline-flex">
              <TabsTrigger value="info" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-t-lg border-b-2 border-transparent data-[state=active]:border-indigo-600">
                <FileText className="w-4 h-4 mr-2" /> معلومات عامة
              </TabsTrigger>
              <TabsTrigger value="description" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-t-lg border-b-2 border-transparent data-[state=active]:border-indigo-600">
                <BookOpen className="w-4 h-4 mr-2" /> الوصف والأهداف
              </TabsTrigger>
              <TabsTrigger value="outcomes" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-t-lg border-b-2 border-transparent data-[state=active]:border-indigo-600">
                <Target className="w-4 h-4 mr-2" /> مخرجات التعلم
              </TabsTrigger>
              <TabsTrigger value="strategies" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-t-lg border-b-2 border-transparent data-[state=active]:border-indigo-600">
                <Lightbulb className="w-4 h-4 mr-2" /> التدريس والتقييم
              </TabsTrigger>
              <TabsTrigger value="content" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-t-lg border-b-2 border-transparent data-[state=active]:border-indigo-600">
                <Layers className="w-4 h-4 mr-2" /> المحتوى وبنك الأسئلة
              </TabsTrigger>
              <TabsTrigger value="activities" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-t-lg border-b-2 border-transparent data-[state=active]:border-indigo-600">
                <ClipboardList className="w-4 h-4 mr-2" /> الأنشطة والتقييم
              </TabsTrigger>
              <TabsTrigger value="resources" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-t-lg border-b-2 border-transparent data-[state=active]:border-indigo-600">
                <Book className="w-4 h-4 mr-2" /> المصادر
              </TabsTrigger>
              <TabsTrigger value="policies" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-t-lg border-b-2 border-transparent data-[state=active]:border-indigo-600">
                <Award className="w-4 h-4 mr-2" /> الضوابط
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 bg-slate-50/30">
            <div className="p-4 md:p-6">
              
              <TabsContent value="info" className="mt-0" dir="rtl">
                <Card>
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Info className="w-5 h-5 text-indigo-600" />
                      I. معلومات عامة عن المقرر
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="p-4 bg-slate-50 rounded-lg border">
                          <Label className="text-xs text-slate-500 mb-1 block">كود المقرر</Label>
                          <div className="font-bold text-lg font-mono">{course.course_code}</div>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-lg border">
                          <Label className="text-xs text-slate-500 mb-1 block">اسم المقرر</Label>
                          <div className="font-bold text-lg">{course.course_name}</div>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-lg border">
                          <Label className="text-xs text-slate-500 mb-1 block">الساعات المعتمدة</Label>
                          <div className="font-bold text-lg text-blue-600">{course.credit_hours} ساعات</div>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-lg border">
                          <Label className="text-xs text-slate-500 mb-1 block">نوع المتطلب</Label>
                          <Badge className="text-sm">{course.category || "متطلب تخصص (إجباري)"}</Badge>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                          <Label className="text-xs text-emerald-700 mb-1 block">وزن المقرر من البرنامج</Label>
                          <div className="font-bold text-2xl text-emerald-600">{course.weight || 0}%</div>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-lg border">
                          <Label className="text-xs text-slate-500 mb-2 block">أجزاء المقرر</Label>
                          <div className="space-y-2">
                            {course.course_parts?.map((part, idx) => (
                              <div key={idx} className="p-3 bg-white rounded-lg border">
                                <div className="font-semibold mb-2">{part.name}</div>
                                <div className="text-xs text-slate-600">
                                  ساعات التدريس: {part.theoretical_hours + part.practical_hours + part.exercise_hours + part.seminar_hours} ساعة
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {course.prerequisites && (
                          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                            <Label className="text-xs text-amber-700 mb-1 block">المتطلبات السابقة</Label>
                            <div className="font-medium">{course.prerequisites}</div>
                          </div>
                        )}

                        {course.corequisites && (
                          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <Label className="text-xs text-blue-700 mb-1 block">المتطلبات المصاحبة</Label>
                            <div className="font-medium">{course.corequisites}</div>
                          </div>
                        )}

                        <div className="p-4 bg-slate-50 rounded-lg border">
                          <Label className="text-xs text-slate-500 mb-1 block">لغة التدريس</Label>
                          <div className="font-medium">{course.teaching_language || "العربية"}</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="description" className="mt-0 space-y-6" dir="rtl">
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
                          <div className="space-y-2 pr-4">
                            <p><strong>الجملة الأولى:</strong> يهدف هذا المقرر إلى... (أهم مخرجات التعلم)</p>
                            <p><strong>الجملة الثانية:</strong> ويغطي هذا المقرر... (أبرز الموضوعات)</p>
                            <p><strong>الجملة الثالثة:</strong> ويركز هذا المقرر على... (الجانب العملي/التطبيقي)</p>
                            <p><strong>الجملة الرابعة:</strong> ويعتمد هذا المقرر... (المتطلبات القبلية والمصاحبة)</p>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>

                    <div className="space-y-2">
                      <Label>وصف المقرر الكامل</Label>
                      <Textarea 
                        value={courseDescription}
                        onChange={(e) => setCourseDescription(e.target.value)}
                        className="bg-white min-h-[200px]"
                      />
                      <div className="text-xs text-slate-500">
                        عدد الكلمات: {courseDescription.split(' ').filter(w => w.length > 0).length}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Target className="w-5 h-5 text-purple-600" />
                          III. أهداف المقرر
                        </CardTitle>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => setCourseGoals([...courseGoals, { id: Date.now().toString(), text: "" }])}
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
                        <AccordionContent className="px-4 pb-4 text-sm text-slate-700 space-y-2">
                          <p>• الأهداف يجب أن تكون عامة وليست تفصيلية</p>
                          <p>• مرتبطة بالمقرر فعلياً</p>
                          <p>• عددها مناسب (4-6 أهداف)</p>
                          <p>• صياغة الأفعال من وجهة نظر المقرر</p>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>

                    <div className="space-y-3">
                      {courseGoals.map((goal, index) => (
                        <div key={goal.id} className="flex gap-3 items-start">
                          <Badge className="shrink-0 bg-purple-600 mt-2">{index + 1}</Badge>
                          <Textarea 
                            value={goal.text}
                            onChange={(e) => {
                              const updated = [...courseGoals];
                              updated[index].text = e.target.value;
                              setCourseGoals(updated);
                            }}
                            placeholder={`الهدف ${index + 1}`}
                            className="bg-white min-h-[60px] flex-1"
                          />
                          {courseGoals.length > 1 && (
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="shrink-0 text-red-500 hover:bg-red-50"
                              onClick={() => setCourseGoals(courseGoals.filter(g => g.id !== goal.id))}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="outcomes" className="mt-0" dir="rtl">
                <Card>
                  <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <GraduationCap className="w-5 h-5 text-indigo-600" />
                          IV. مخرجات التعلم المقصودة للمقرر (CLOs)
                        </CardTitle>
                      </div>
                      <div className={cn(
                        "px-4 py-2 rounded-lg border text-center",
                        totalOutcomeWeight === 100 ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"
                      )}>
                        <div className="text-xs text-slate-500 mb-1">مجموع الأوزان</div>
                        <div className={cn(
                          "font-bold text-lg",
                          totalOutcomeWeight === 100 ? "text-green-600" : totalOutcomeWeight > 100 ? "text-red-600" : "text-amber-600"
                        )}>
                          {totalOutcomeWeight}%
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    
                    {Object.entries(categoryLabels).map(([categoryKey, categoryLabel]) => {
                      const categoryOutcomes = learningOutcomes.filter(o => o.category === categoryKey);
                      
                      if (categoryOutcomes.length === 0) return null;

                      return (
                        <div key={categoryKey} className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold text-slate-800 text-lg">{categoryLabel}</h3>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleAddOutcome(categoryKey as any)}
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              إضافة مخرج
                            </Button>
                          </div>

                          <div className="space-y-2">
                            {categoryOutcomes.map((outcome) => (
                              <div key={outcome.id} className={cn(
                                "p-4 rounded-lg border-2 bg-white",
                                categoryColors[categoryKey as keyof typeof categoryColors]
                              )}>
                                <div className="flex gap-3 items-start">
                                  <Badge className={cn("shrink-0 mt-1", categoryColors[categoryKey as keyof typeof categoryColors])}>
                                    {outcome.code}
                                  </Badge>
                                  <div className="flex-1">
                                    <p className="font-medium text-slate-800 mb-3">{outcome.text}</p>
                                    <div className="flex flex-wrap items-center gap-3 text-sm">
                                      <div className="flex items-center gap-2">
                                        <Label className="text-xs text-slate-600">مخرج البرنامج:</Label>
                                        <Badge variant="outline">{outcome.program_outcome_id || "غير محدد"}</Badge>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Label className="text-xs text-slate-600">وزن المخرج:</Label>
                                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                          {outcome.weight}%
                                        </Badge>
                                      </div>
                                      {outcome.program_outcome_weight && (
                                        <div className="flex items-center gap-2">
                                          <Label className="text-xs text-slate-500">وزن مخرج البرنامج:</Label>
                                          <span className="text-xs text-slate-600">{outcome.program_outcome_weight}%</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex gap-1 shrink-0">
                                    <Button 
                                      size="icon" 
                                      variant="ghost"
                                      onClick={() => {
                                        setOutcomeFormData(outcome);
                                        setEditingOutcomeId(outcome.id);
                                        setIsOutcomeFormOpen(true);
                                      }}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                      size="icon" 
                                      variant="ghost"
                                      className="text-red-500 hover:bg-red-50"
                                      onClick={() => handleDeleteOutcome(outcome.id)}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </TabsContent>

              <Dialog open={isOutcomeFormOpen} onOpenChange={setIsOutcomeFormOpen}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingOutcomeId ? "تعديل مخرج التعلم" : "إضافة مخرج تعلم جديد"}
                    </DialogTitle>
                    <DialogDescription>
                      المجال: {categoryLabels[outcomeFormData.category as keyof typeof categoryLabels]}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>رمز المخرج *</Label>
                        <Input 
                          value={outcomeFormData.code || ""}
                          onChange={e => setOutcomeFormData({...outcomeFormData, code: e.target.value})}
                          placeholder="مثال: A1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>وزن المخرج (%) *</Label>
                        <Input 
                          type="number"
                          min="0"
                          max="100"
                          value={outcomeFormData.weight || ""}
                          onChange={e => setOutcomeFormData({...outcomeFormData, weight: Number(e.target.value)})}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>نص المخرج *</Label>
                      <Textarea 
                        value={outcomeFormData.text || ""}
                        onChange={e => setOutcomeFormData({...outcomeFormData, text: e.target.value})}
                        placeholder="اكتب وصف المخرج..."
                        className="min-h-[100px]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>مخرج البرنامج المرتبط</Label>
                        <Input 
                          value={outcomeFormData.program_outcome_id || ""}
                          onChange={e => setOutcomeFormData({...outcomeFormData, program_outcome_id: e.target.value})}
                          placeholder="مثال: PLO-1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>وزن مخرج البرنامج (%)</Label>
                        <Input 
                          type="number"
                          value={outcomeFormData.program_outcome_weight || ""}
                          onChange={e => setOutcomeFormData({...outcomeFormData, program_outcome_weight: Number(e.target.value)})}
                          placeholder="للمرجع فقط"
                        />
                      </div>
                    </div>

                    {outcomeFormData.weight && outcomeFormData.program_outcome_weight && outcomeFormData.weight > outcomeFormData.program_outcome_weight && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                        <p className="text-sm text-red-700">
                          تحذير: وزن مخرج المقرر ({outcomeFormData.weight}%) أكبر من وزن مخرج البرنامج ({outcomeFormData.program_outcome_weight}%)
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsOutcomeFormOpen(false)}>
                      إلغاء
                    </Button>
                    <Button onClick={handleSaveOutcome}>
                      حفظ
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <TabsContent value="strategies" className="mt-0 space-y-6" dir="rtl">
                <Card>
                  <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-amber-600" />
                      V. ربط مخرجات التعلم باستراتيجيات التدريس والتقييم
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-8">
                    
                    {Object.entries(categoryLabels).map(([categoryKey, categoryLabel]) => {
                      const categoryOutcomes = learningOutcomes.filter(o => o.category === categoryKey);
                      if (categoryOutcomes.length === 0) return null;
              
                      return (
                        <div key={categoryKey} className="space-y-4">
                          <h3 className="font-bold text-slate-800 text-lg pb-2 border-b">
                            ({categoryKey.toUpperCase()}) ربط مخرجات تعلم المقرر ({categoryLabel}) باستراتيجية التدريس والتقييم:
                          </h3>
              
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-slate-50">
                                <TableHead className="w-[35%]">مخرجات التعلم المقصودة</TableHead>
                                <TableHead className="w-[30%]">استراتيجيات التدريس</TableHead>
                                <TableHead className="w-[30%]">طرق التقييم</TableHead>
                                <TableHead className="w-[5%]">إجراءات</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {categoryOutcomes.map(outcome => {
                                const mapping = outcomesMappings.find(m => m.outcome_id === outcome.id);
                                return (
                                  <TableRow key={outcome.id}>
                                    <TableCell>
                                      <div className="flex items-start gap-2">
                                        <Badge className="shrink-0">{outcome.code}</Badge>
                                        <span className="text-sm">{outcome.text}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="space-y-2">
                                        <div className="flex flex-wrap gap-1">
                                          {mapping?.teaching_strategies.map(sid => (
                                            <Badge key={sid} variant="outline" className="text-xs group relative">
                                              {getStrategyName(sid)}
                                              <button
                                                onClick={() => handleRemoveTeachingStrategy(outcome.id, sid)}
                                                className="mr-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                              >
                                                <X className="w-3 h-3 text-red-500" />
                                              </button>
                                            </Badge>
                                          ))}
                                        </div>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-7 text-xs"
                                          onClick={() => handleAddTeachingStrategy(outcome.id)}
                                        >
                                          <Plus className="w-3 h-3 ml-1" />
                                          إضافة استراتيجية
                                        </Button>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="space-y-2">
                                        <div className="flex flex-wrap gap-1">
                                          {mapping?.assessment_methods.map(mid => (
                                            <Badge key={mid} variant="outline" className="text-xs group relative">
                                              {getAssessmentName(mid)}
                                              <button
                                                onClick={() => handleRemoveAssessmentMethod(outcome.id, mid)}
                                                className="mr-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                              >
                                                <X className="w-3 h-3 text-red-500" />
                                              </button>
                                            </Badge>
                                          ))}
                                        </div>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-7 text-xs"
                                          onClick={() => handleAddAssessmentMethod(outcome.id)}
                                        >
                                          <Plus className="w-3 h-3 ml-1" />
                                          إضافة طريقة تقييم
                                        </Button>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => handleEditMapping(outcome.id)}
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
                      );
                    })}
                  </CardContent>
                </Card>
              
                {/* Dialog لإضافة استراتيجية تدريس */}
                <Dialog open={isAddTeachingStrategyOpen} onOpenChange={setIsAddTeachingStrategyOpen}>
                  <DialogContent dir="rtl">
                    <DialogHeader>
                      <DialogTitle>إضافة استراتيجية تدريس</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Label>اختر استراتيجية التدريس</Label>
                      <Select
                        value={selectedTeachingStrategy}
                        onValueChange={setSelectedTeachingStrategy}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر استراتيجية..." />
                        </SelectTrigger>
                        <SelectContent>
                          {teachingStrategies
                            .filter(ts => !currentMapping?.teaching_strategies.includes(ts.id))
                            .map(strategy => (
                              <SelectItem key={strategy.id} value={strategy.id.toString()}>
                                {strategy.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddTeachingStrategyOpen(false)}>
                        إلغاء
                      </Button>
                      <Button onClick={confirmAddTeachingStrategy}>
                        إضافة
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              
                {/* Dialog لإضافة طريقة تقييم */}
                <Dialog open={isAddAssessmentMethodOpen} onOpenChange={setIsAddAssessmentMethodOpen}>
                  <DialogContent dir="rtl">
                    <DialogHeader>
                      <DialogTitle>إضافة طريقة تقييم</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Label>اختر طريقة التقييم</Label>
                      <Select
                        value={selectedAssessmentMethod}
                        onValueChange={setSelectedAssessmentMethod}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر طريقة..." />
                        </SelectTrigger>
                        <SelectContent>
                          {assessmentMethods
                            .filter(am => !currentMapping?.assessment_methods.includes(am.id))
                            .map(method => (
                              <SelectItem key={method.id} value={method.id.toString()}>
                                {method.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddAssessmentMethodOpen(false)}>
                        إلغاء
                      </Button>
                      <Button onClick={confirmAddAssessmentMethod}>
                        إضافة
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              
                {/* Dialog للتعديل الشامل */}
                <Dialog open={isEditMappingOpen} onOpenChange={setIsEditMappingOpen}>
                  <DialogContent className="max-w-2xl" dir="rtl">
                    <DialogHeader>
                      <DialogTitle>تعديل الربط الشامل</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <Label>استراتيجيات التدريس</Label>
                        <div className="border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                          {teachingStrategies.map(strategy => (
                            <div key={strategy.id} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id={`strategy-${strategy.id}`}
                                checked={editMappingData.teaching_strategies.includes(strategy.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setEditMappingData(prev => ({
                                      ...prev,
                                      teaching_strategies: [...prev.teaching_strategies, strategy.id]
                                    }));
                                  } else {
                                    setEditMappingData(prev => ({
                                      ...prev,
                                      teaching_strategies: prev.teaching_strategies.filter(id => id !== strategy.id)
                                    }));
                                  }
                                }}
                                className="rounded"
                              />
                              <label htmlFor={`strategy-${strategy.id}`} className="text-sm cursor-pointer">
                                {strategy.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
              
                      <div className="space-y-3">
                        <Label>طرق التقييم</Label>
                        <div className="border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                          {assessmentMethods.map(method => (
                            <div key={method.id} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id={`method-${method.id}`}
                                checked={editMappingData.assessment_methods.includes(method.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setEditMappingData(prev => ({
                                      ...prev,
                                      assessment_methods: [...prev.assessment_methods, method.id]
                                    }));
                                  } else {
                                    setEditMappingData(prev => ({
                                      ...prev,
                                      assessment_methods: prev.assessment_methods.filter(id => id !== method.id)
                                    }));
                                  }
                                }}
                                className="rounded"
                              />
                              <label htmlFor={`method-${method.id}`} className="text-sm cursor-pointer">
                                {method.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsEditMappingOpen(false)}>
                        إلغاء
                      </Button>
                      <Button onClick={confirmEditMapping}>
                        حفظ التعديلات
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </TabsContent>

              <TabsContent value="content" className="mt-0" dir="rtl">
                <Card>
                  <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 border-b">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Layers className="w-5 h-5 text-violet-600" />
                          VI. محتوى المقرر - {activePart}
                        </CardTitle>
                        <p className="text-sm text-slate-600 mt-1">إدارة المحتوى الأسبوعي وبنك الأسئلة</p>
                      </div>
                      <Button 
                        size="sm"
                        onClick={handleAddTopic}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        إضافة موضوع
                      </Button>
                    </div>
                    
                    {/* التبويب الفرعي */}
                    <Tabs defaultValue="theoretical" className="mt-4">
                      <TabsList className="grid w-full grid-cols-3 bg-white border">
                        <TabsTrigger value="theoretical" className="data-[state=active]:bg-violet-100 data-[state=active]:text-violet-700">
                          محتوى نظري
                        </TabsTrigger>
                        <TabsTrigger value="practical" className="data-[state=active]:bg-violet-100 data-[state=active]:text-violet-700">
                          محتوى عملي
                        </TabsTrigger>
                        <TabsTrigger value="exercises" className="data-[state=active]:bg-violet-100 data-[state=active]:text-violet-700">
                          تمارين
                        </TabsTrigger>
                      </TabsList>
              
                      {/* محتوى نظري */}
                      <TabsContent value="theoretical" className="mt-0">
                        <CardContent className="p-6 space-y-6">
                          
                          <Accordion type="single" collapsible className="bg-violet-50/50 rounded-lg border border-violet-200">
                            <AccordionItem value="help" className="border-0">
                              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                                <div className="flex items-center gap-2 text-violet-700">
                                  <Info className="w-4 h-4" />
                                  <span className="font-medium">ملاحظات هامة</span>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="px-4 pb-4 text-sm text-slate-700 space-y-2">
                                <p>• عدد الأسابيع: 16 أسبوعاً شاملة الامتحانات</p>
                                <p>• الامتحان النصفي دائماً في الأسبوع الثامن</p>
                                <p>• مخرجات التعلم يجب أن تكون محددة لكل موضوع</p>
                                <p>• يمكن إضافة أسئلة متعددة لكل موضوع رئيسي</p>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
              
                          <div className="border rounded-lg overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-violet-50">
                                  <TableHead className="w-20">الأسبوع</TableHead>
                                  <TableHead className="w-48">الوحدة/الموضوع</TableHead>
                                  <TableHead>المواضيع الفرعية</TableHead>
                                  <TableHead className="w-32">المخرجات</TableHead>
                                  <TableHead className="w-24 text-center">الساعات</TableHead>
                                  <TableHead className="w-32">الإجراءات</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {topics.filter(t => t.part === activePart).map((topic) => (
                                  <React.Fragment key={topic.id}>
                                    <TableRow className={topic.is_exam ? "bg-amber-50" : ""}>
                                      <TableCell className="font-bold text-center">{topic.week}</TableCell>
                                      <TableCell className="font-semibold">{topic.unit_name}</TableCell>
                                      <TableCell>
                                        {!topic.is_exam && (
                                          <div className="flex flex-wrap gap-1">
                                            {topic.subtopics.map((sub, idx) => (
                                              <Badge key={idx} variant="secondary" className="text-xs">
                                                {sub}
                                              </Badge>
                                            ))}
                                          </div>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                          {topic.outcome_ids.map(oid => (
                                            <Badge key={oid} className="text-xs">{oid}</Badge>
                                          ))}
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-center">{topic.hours}</TableCell>
                                      <TableCell>
                                        <div className="flex gap-1">
                                          {!topic.is_exam && (
                                            <Button 
                                              size="sm" 
                                              variant="outline"
                                              onClick={() => handleAddQuestion(topic.id)}
                                            >
                                              <Plus className="w-3 h-3 mr-1" /> أسئلة
                                            </Button>
                                          )}
                                          <Button 
                                            size="icon" 
                                            variant="ghost"
                                            onClick={() => {
                                              setTopicFormData(topic);
                                              setEditingTopicId(topic.id);
                                              setIsTopicFormOpen(true);
                                            }}
                                          >
                                            <Edit className="w-3.5 h-3.5" />
                                          </Button>
                                          <Button 
                                            size="icon" 
                                            variant="ghost"
                                            className="text-red-500"
                                            onClick={() => handleDeleteTopic(topic.id)}
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </Button>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                    
                                    {questions.filter(q => q.topic_id === topic.id).map(question => (
                                      <TableRow key={question.id} className="bg-blue-50/30">
                                        <TableCell></TableCell>
                                        <TableCell colSpan={4}>
                                          <div className="p-3 bg-white rounded-lg border ml-4">
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                              <div className="flex-1">
                                                <Badge variant="outline" className="mb-2">سؤال</Badge>
                                                <p className="font-medium text-sm mb-2">{question.question_text}</p>
                                                {question.subtopic && (
                                                  <p className="text-xs text-slate-500 mb-2">الموضوع الفرعي: {question.subtopic}</p>
                                                )}
                                                <div className="grid grid-cols-2 gap-2">
                                                  {question.options.map(opt => (
                                                    <div 
                                                      key={opt.id} 
                                                      className={cn(
                                                        "p-2 rounded border text-sm",
                                                        opt.is_correct ? "bg-green-50 border-green-200" : "bg-slate-50"
                                                      )}
                                                    >
                                                      {opt.is_correct && <Badge className="mr-2 h-5 bg-green-600">✓</Badge>}
                                                      {opt.text}
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                              <Button 
                                                size="icon" 
                                                variant="ghost"
                                                className="text-red-500 shrink-0"
                                                onClick={() => handleDeleteQuestion(question.id)}
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </Button>
                                            </div>
                                          </div>
                                        </TableCell>
                                        <TableCell></TableCell>
                                      </TableRow>
                                    ))}
                                  </React.Fragment>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </CardContent>
                      </TabsContent>
              
                      {/* محتوى عملي */}
                      <TabsContent value="practical" className="mt-0">
                        <CardContent className="p-6 space-y-6">
                          
                          <Accordion type="single" collapsible className="bg-violet-50/50 rounded-lg border border-violet-200">
                            <AccordionItem value="help" className="border-0">
                              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                                <div className="flex items-center gap-2 text-violet-700">
                                  <Info className="w-4 h-4" />
                                  <span className="font-medium">ملاحظات هامة</span>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="px-4 pb-4 text-sm text-slate-700 space-y-2">
                                <p>• عدد الأسابيع: 16 أسبوعاً شاملة الامتحانات</p>
                                <p>• الامتحان النصفي دائماً في الأسبوع الثامن</p>
                                <p>• مخرجات التعلم يجب أن تكون محددة لكل موضوع</p>
                                <p>• يمكن إضافة أسئلة متعددة لكل موضوع رئيسي</p>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
              
                          <div className="border rounded-lg overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-violet-50">
                                  <TableHead className="w-20">الأسبوع</TableHead>
                                  <TableHead className="w-48">الوحدة/الموضوع</TableHead>
                                  <TableHead>المواضيع الفرعية</TableHead>
                                  <TableHead className="w-32">المخرجات</TableHead>
                                  <TableHead className="w-24 text-center">الساعات</TableHead>
                                  <TableHead className="w-32">الإجراءات</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {topics.filter(t => t.part === activePart).map((topic) => (
                                  <React.Fragment key={topic.id}>
                                    <TableRow className={topic.is_exam ? "bg-amber-50" : ""}>
                                      <TableCell className="font-bold text-center">{topic.week}</TableCell>
                                      <TableCell className="font-semibold">{topic.unit_name}</TableCell>
                                      <TableCell>
                                        {!topic.is_exam && (
                                          <div className="flex flex-wrap gap-1">
                                            {topic.subtopics.map((sub, idx) => (
                                              <Badge key={idx} variant="secondary" className="text-xs">
                                                {sub}
                                              </Badge>
                                            ))}
                                          </div>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                          {topic.outcome_ids.map(oid => (
                                            <Badge key={oid} className="text-xs">{oid}</Badge>
                                          ))}
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-center">{topic.hours}</TableCell>
                                      <TableCell>
                                        <div className="flex gap-1">
                                          {!topic.is_exam && (
                                            <Button 
                                              size="sm" 
                                              variant="outline"
                                              onClick={() => handleAddQuestion(topic.id)}
                                            >
                                              <Plus className="w-3 h-3 mr-1" /> أسئلة
                                            </Button>
                                          )}
                                          <Button 
                                            size="icon" 
                                            variant="ghost"
                                            onClick={() => {
                                              setTopicFormData(topic);
                                              setEditingTopicId(topic.id);
                                              setIsTopicFormOpen(true);
                                            }}
                                          >
                                            <Edit className="w-3.5 h-3.5" />
                                          </Button>
                                          <Button 
                                            size="icon" 
                                            variant="ghost"
                                            className="text-red-500"
                                            onClick={() => handleDeleteTopic(topic.id)}
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </Button>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                    
                                    {questions.filter(q => q.topic_id === topic.id).map(question => (
                                      <TableRow key={question.id} className="bg-blue-50/30">
                                        <TableCell></TableCell>
                                        <TableCell colSpan={4}>
                                          <div className="p-3 bg-white rounded-lg border ml-4">
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                              <div className="flex-1">
                                                <Badge variant="outline" className="mb-2">سؤال</Badge>
                                                <p className="font-medium text-sm mb-2">{question.question_text}</p>
                                                {question.subtopic && (
                                                  <p className="text-xs text-slate-500 mb-2">الموضوع الفرعي: {question.subtopic}</p>
                                                )}
                                                <div className="grid grid-cols-2 gap-2">
                                                  {question.options.map(opt => (
                                                    <div 
                                                      key={opt.id} 
                                                      className={cn(
                                                        "p-2 rounded border text-sm",
                                                        opt.is_correct ? "bg-green-50 border-green-200" : "bg-slate-50"
                                                      )}
                                                    >
                                                      {opt.is_correct && <Badge className="mr-2 h-5 bg-green-600">✓</Badge>}
                                                      {opt.text}
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                              <Button 
                                                size="icon" 
                                                variant="ghost"
                                                className="text-red-500 shrink-0"
                                                onClick={() => handleDeleteQuestion(question.id)}
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </Button>
                                            </div>
                                          </div>
                                        </TableCell>
                                        <TableCell></TableCell>
                                      </TableRow>
                                    ))}
                                  </React.Fragment>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </CardContent>
                      </TabsContent>
              
                      {/* تمارين */}
                      <TabsContent value="exercises" className="mt-0">
                        <CardContent className="p-6 space-y-6">
                          
                          <Accordion type="single" collapsible className="bg-violet-50/50 rounded-lg border border-violet-200">
                            <AccordionItem value="help" className="border-0">
                              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                                <div className="flex items-center gap-2 text-violet-700">
                                  <Info className="w-4 h-4" />
                                  <span className="font-medium">ملاحظات هامة</span>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="px-4 pb-4 text-sm text-slate-700 space-y-2">
                                <p>• عدد الأسابيع: 16 أسبوعاً شاملة الامتحانات</p>
                                <p>• الامتحان النصفي دائماً في الأسبوع الثامن</p>
                                <p>• مخرجات التعلم يجب أن تكون محددة لكل موضوع</p>
                                <p>• يمكن إضافة أسئلة متعددة لكل موضوع رئيسي</p>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
              
                          <div className="border rounded-lg overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-violet-50">
                                  <TableHead className="w-20">الأسبوع</TableHead>
                                  <TableHead className="w-48">الوحدة/الموضوع</TableHead>
                                  <TableHead>المواضيع الفرعية</TableHead>
                                  <TableHead className="w-32">المخرجات</TableHead>
                                  <TableHead className="w-24 text-center">الساعات</TableHead>
                                  <TableHead className="w-32">الإجراءات</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {topics.filter(t => t.part === activePart).map((topic) => (
                                  <React.Fragment key={topic.id}>
                                    <TableRow className={topic.is_exam ? "bg-amber-50" : ""}>
                                      <TableCell className="font-bold text-center">{topic.week}</TableCell>
                                      <TableCell className="font-semibold">{topic.unit_name}</TableCell>
                                      <TableCell>
                                        {!topic.is_exam && (
                                          <div className="flex flex-wrap gap-1">
                                            {topic.subtopics.map((sub, idx) => (
                                              <Badge key={idx} variant="secondary" className="text-xs">
                                                {sub}
                                              </Badge>
                                            ))}
                                          </div>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                          {topic.outcome_ids.map(oid => (
                                            <Badge key={oid} className="text-xs">{oid}</Badge>
                                          ))}
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-center">{topic.hours}</TableCell>
                                      <TableCell>
                                        <div className="flex gap-1">
                                          {!topic.is_exam && (
                                            <Button 
                                              size="sm" 
                                              variant="outline"
                                              onClick={() => handleAddQuestion(topic.id)}
                                            >
                                              <Plus className="w-3 h-3 mr-1" /> أسئلة
                                            </Button>
                                          )}
                                          <Button 
                                            size="icon" 
                                            variant="ghost"
                                            onClick={() => {
                                              setTopicFormData(topic);
                                              setEditingTopicId(topic.id);
                                              setIsTopicFormOpen(true);
                                            }}
                                          >
                                            <Edit className="w-3.5 h-3.5" />
                                          </Button>
                                          <Button 
                                            size="icon" 
                                            variant="ghost"
                                            className="text-red-500"
                                            onClick={() => handleDeleteTopic(topic.id)}
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </Button>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                    
                                    {questions.filter(q => q.topic_id === topic.id).map(question => (
                                      <TableRow key={question.id} className="bg-blue-50/30">
                                        <TableCell></TableCell>
                                        <TableCell colSpan={4}>
                                          <div className="p-3 bg-white rounded-lg border ml-4">
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                              <div className="flex-1">
                                                <Badge variant="outline" className="mb-2">سؤال</Badge>
                                                <p className="font-medium text-sm mb-2">{question.question_text}</p>
                                                {question.subtopic && (
                                                  <p className="text-xs text-slate-500 mb-2">الموضوع الفرعي: {question.subtopic}</p>
                                                )}
                                                <div className="grid grid-cols-2 gap-2">
                                                  {question.options.map(opt => (
                                                    <div 
                                                      key={opt.id} 
                                                      className={cn(
                                                        "p-2 rounded border text-sm",
                                                        opt.is_correct ? "bg-green-50 border-green-200" : "bg-slate-50"
                                                      )}
                                                    >
                                                      {opt.is_correct && <Badge className="mr-2 h-5 bg-green-600">✓</Badge>}
                                                      {opt.text}
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                              <Button 
                                                size="icon" 
                                                variant="ghost"
                                                className="text-red-500 shrink-0"
                                                onClick={() => handleDeleteQuestion(question.id)}
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </Button>
                                            </div>
                                          </div>
                                        </TableCell>
                                        <TableCell></TableCell>
                                      </TableRow>
                                    ))}
                                  </React.Fragment>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </CardContent>
                      </TabsContent>
                    </Tabs>
                    
                  </CardHeader>
                </Card>
              </TabsContent>

              <Dialog open={isTopicFormOpen} onOpenChange={setIsTopicFormOpen}>
                <DialogContent className="max-w-2xl">
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
                        onCheckedChange={c => setTopicFormData({...topicFormData, is_exam: c as boolean, subtopics: c ? [] : [""] })}
                      />
                      <Label className="cursor-pointer">
                        هذا الأسبوع مخصص لامتحان (نصفي/نهائي)
                      </Label>
                    </div>

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
                              {topicFormData.subtopics!.length > 1 && (
                                <Button 
                                  size="icon" 
                                  variant="ghost"
                                  className="text-red-500"
                                  onClick={() => setTopicFormData({
                                    ...topicFormData,
                                    subtopics: topicFormData.subtopics!.filter((_, i) => i !== idx)
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
                        <Label>مخرجات التعلم المغطاة</Label>
                        <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-slate-50 max-h-[120px] overflow-y-auto">
                          {learningOutcomes.map(outcome => (
                            <div key={outcome.id} className="flex items-center gap-2">
                              <Checkbox 
                                checked={topicFormData.outcome_ids?.includes(outcome.code) || false}
                                onCheckedChange={c => {
                                  const current = topicFormData.outcome_ids || [];
                                  setTopicFormData({
                                    ...topicFormData,
                                    outcome_ids: c 
                                      ? [...current, outcome.code]
                                      : current.filter(id => id !== outcome.code)
                                  });
                                }}
                              />
                              <Label className="text-sm cursor-pointer">{outcome.code}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>عدد الساعات</Label>
                        <Input 
                          type="number"
                          min="1"
                          value={topicFormData.hours || ""}
                          onChange={e => setTopicFormData({...topicFormData, hours: Number(e.target.value)})}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsTopicFormOpen(false)}>
                      إلغاء
                    </Button>
                    <Button onClick={handleSaveTopic}>
                      حفظ
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isQuestionFormOpen} onOpenChange={setIsQuestionFormOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>إضافة سؤال جديد</DialogTitle>
                    <DialogDescription>
                      الموضوع: {topics.find(t => t.id === selectedTopicForQuestions)?.unit_name}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>الموضوع الفرعي</Label>
                      <Select 
                        value={questionFormData.subtopic || ""}
                        onValueChange={v => setQuestionFormData({...questionFormData, subtopic: v})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر موضوع فرعي" />
                        </SelectTrigger>
                        <SelectContent>
                          {topics.find(t => t.id === selectedTopicForQuestions)?.subtopics.map((sub, idx) => (
                            <SelectItem key={idx} value={sub}>{sub}</SelectItem>
                          ))}
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

                    <div className="space-y-3">
                      <Label>الخيارات (4 خيارات)</Label>
                      {questionFormData.options?.map((option, idx) => (
                        <div key={option.id} className="flex gap-3 items-start">
                          <Badge className="shrink-0 mt-2">{idx + 1}</Badge>
                          <Input 
                            value={option.text}
                            onChange={e => handleUpdateQuestionOption(option.id, "text", e.target.value)}
                            placeholder={`الخيار ${idx + 1}`}
                            className="flex-1"
                          />
                          <div className="flex items-center gap-2 shrink-0">
                            <RadioGroup 
                              value={questionFormData.options?.find(o => o.is_correct)?.id}
                              onValueChange={v => handleUpdateQuestionOption(v, "is_correct", true)}
                            >
                              <div className="flex items-center gap-2">
                                <RadioGroupItem value={option.id} />
                                <Label className="text-sm cursor-pointer">صح</Label>
                              </div>
                            </RadioGroup>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsQuestionFormOpen(false)}>
                      إلغاء
                    </Button>
                    <Button onClick={handleSaveQuestion}>
                      حفظ السؤال
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <TabsContent value="activities" className="mt-0 space-y-6" dir="rtl">
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
                        onClick={() => setAssignments([...assignments, {
                          id: Date.now().toString(),
                          part: activePart,
                          title: "",
                          week: 1,
                          grade: 0,
                          outcome_ids: []
                        }])}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        إضافة تكليف
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50">
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>التكليف</TableHead>
                          <TableHead className="w-24 text-center">الأسبوع</TableHead>
                          <TableHead className="w-24 text-center">الدرجة</TableHead>
                          <TableHead className="w-48">المخرجات</TableHead>
                          <TableHead className="w-20"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {assignments.filter(a => a.part === activePart).map((assignment, index) => (
                          <TableRow key={assignment.id}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>
                              <Input 
                                value={assignment.title}
                                onChange={e => setAssignments(assignments.map(a => 
                                  a.id === assignment.id ? {...a, title: e.target.value} : a
                                ))}
                                className="bg-white"
                              />
                            </TableCell>
                            <TableCell>
                              <Input 
                                type="number"
                                value={assignment.week}
                                onChange={e => setAssignments(assignments.map(a => 
                                  a.id === assignment.id ? {...a, week: Number(e.target.value)} : a
                                ))}
                                className="bg-white text-center"
                              />
                            </TableCell>
                            <TableCell>
                              <Input 
                                type="number"
                                value={assignment.grade}
                                onChange={e => setAssignments(assignments.map(a => 
                                  a.id === assignment.id ? {...a, grade: Number(e.target.value)} : a
                                ))}
                                className="bg-white text-center"
                              />
                            </TableCell>
                            <TableCell>
                              <Input 
                                value={assignment.outcome_ids.join(", ")}
                                onChange={e => setAssignments(assignments.map(a => 
                                  a.id === assignment.id ? {...a, outcome_ids: e.target.value.split(",").map(s => s.trim())} : a
                                ))}
                                placeholder="A1, C1"
                                className="bg-white text-xs"
                              />
                            </TableCell>
                            <TableCell>
                              <Button 
                                size="icon" 
                                variant="ghost"
                                className="text-red-500"
                                onClick={() => setAssignments(assignments.filter(a => a.id !== assignment.id))}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-blue-50 font-bold">
                          <TableCell colSpan={3} className="text-left">الإجمالي</TableCell>
                          <TableCell className="text-center text-lg text-blue-600">
                            {assignments.filter(a => a.part === activePart).reduce((sum, a) => sum + a.grade, 0)}
                          </TableCell>
                          <TableCell colSpan={2}></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <BarChart3 className="w-5 h-5 text-green-600" />
                          VIII. تقييم التعلم خلال الفصل الدراسي
                        </CardTitle>
                        <p className="text-sm text-slate-600 mt-1">
                          يجب أن تتسق الأسابيع والدرجات مع الجداول السابقة
                        </p>
                      </div>
                      <div className={cn(
                        "px-4 py-2 rounded-lg border text-center",
                        totalAssessmentPercentage === 100 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                      )}>
                        <div className="text-xs text-slate-500 mb-1">الإجمالي</div>
                        <div className={cn(
                          "font-bold text-lg",
                          totalAssessmentPercentage === 100 ? "text-green-600" : "text-red-600"
                        )}>
                          {totalAssessmentPercentage}%
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50">
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>نشاط التقييم</TableHead>
                          <TableHead className="w-24 text-center">الأسبوع</TableHead>
                          <TableHead className="w-24 text-center">الدرجة</TableHead>
                          <TableHead className="w-24 text-center">النسبة %</TableHead>
                          <TableHead className="w-48">المخرجات</TableHead>
                          <TableHead className="w-20"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {assessmentItems.map((item, index) => (
                          <TableRow key={item.id}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>
                              <Input 
                                value={item.name}
                                onChange={e => setAssessmentItems(assessmentItems.map(i => 
                                  i.id === item.id ? {...i, name: e.target.value} : i
                                ))}
                                className="bg-white"
                              />
                            </TableCell>
                            <TableCell>
                              <Input 
                                type="number"
                                value={item.week}
                                onChange={e => setAssessmentItems(assessmentItems.map(i => 
                                  i.id === item.id ? {...i, week: Number(e.target.value)} : i
                                ))}
                                className="bg-white text-center"
                              />
                            </TableCell>
                            <TableCell>
                              <Input 
                                type="number"
                                value={item.grade}
                                onChange={e => setAssessmentItems(assessmentItems.map(i => 
                                  i.id === item.id ? {...i, grade: Number(e.target.value)} : i
                                ))}
                                className="bg-white text-center"
                              />
                            </TableCell>
                            <TableCell>
                              <Input 
                                type="number"
                                value={item.percentage}
                                onChange={e => setAssessmentItems(assessmentItems.map(i => 
                                  i.id === item.id ? {...i, percentage: Number(e.target.value)} : i
                                ))}
                                className="bg-white text-center"
                              />
                            </TableCell>
                            <TableCell>
                              <Input 
                                value={item.outcome_ids.join(", ")}
                                onChange={e => setAssessmentItems(assessmentItems.map(i => 
                                  i.id === item.id ? {...i, outcome_ids: e.target.value.split(",").map(s => s.trim())} : i
                                ))}
                                placeholder="A1, B1"
                                className="bg-white text-xs"
                              />
                            </TableCell>
                            <TableCell>
                              <Button 
                                size="icon" 
                                variant="ghost"
                                className="text-red-500"
                                onClick={() => setAssessmentItems(assessmentItems.filter(i => i.id !== item.id))}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-green-50 font-bold">
                          <TableCell colSpan={4} className="text-left">الإجمالي</TableCell>
                          <TableCell className={cn(
                            "text-center text-lg",
                            totalAssessmentPercentage === 100 ? "text-green-600" : "text-red-600"
                          )}>
                            {totalAssessmentPercentage}%
                          </TableCell>
                          <TableCell colSpan={2}></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

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
                        onClick={() => setReferences([...references, { 
                          id: Date.now().toString(), 
                          type: "main", 
                          title: "" 
                        }])}
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
                        <AccordionContent className="px-4 pb-4 text-sm text-slate-700 space-y-2">
                          <p>• العدد المطلوب: مرجعان رئيسيان (على الأكثر) + مرجعان ثانويان (على الأقل) + مصدران إلكترونيان</p>
                          <p>• يجب أن يكون المرجع حديثاً</p>
                          <p>• صيغة التوثيق: (اسم المؤلف، سنة النشر، اسم الكتاب، الإصدار، دار النشر، بلد النشر)</p>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>

                    <div className="space-y-4">
                      {["main", "support", "electronic"].map(type => (
                        <div key={type} className="space-y-3">
                          <h4 className="font-bold text-slate-800">
                            {type === "main" && "1) المراجع الرئيسية"}
                            {type === "support" && "2) المراجع المساعدة"}
                            {type === "electronic" && "3) مواد إلكترونية وإنترنت"}
                          </h4>
                          
                          {references.filter(r => r.type === type).map((ref) => (
                            <div key={ref.id} className="p-4 bg-slate-50 rounded-lg border space-y-3">
                              {type !== "electronic" ? (
                                <>
                                  <div className="grid grid-cols-3 gap-3">
                                    <Input 
                                      value={ref.author || ""}
                                      onChange={e => setReferences(references.map(r => 
                                        r.id === ref.id ? {...r, author: e.target.value} : r
                                      ))}
                                      placeholder="اسم المؤلف"
                                      className="bg-white"
                                    />
                                    <Input 
                                      value={ref.year || ""}
                                      onChange={e => setReferences(references.map(r => 
                                        r.id === ref.id ? {...r, year: e.target.value} : r
                                      ))}
                                      placeholder="سنة النشر"
                                      className="bg-white"
                                    />
                                    <Input 
                                      value={ref.edition || ""}
                                      onChange={e => setReferences(references.map(r => 
                                        r.id === ref.id ? {...r, edition: e.target.value} : r
                                      ))}
                                      placeholder="الإصدار"
                                      className="bg-white"
                                    />
                                  </div>
                                  <Input 
                                    value={ref.title}
                                    onChange={e => setReferences(references.map(r => 
                                      r.id === ref.id ? {...r, title: e.target.value} : r
                                    ))}
                                    placeholder="اسم الكتاب"
                                    className="bg-white"
                                  />
                                  <div className="grid grid-cols-2 gap-3">
                                    <Input 
                                      value={ref.publisher || ""}
                                      onChange={e => setReferences(references.map(r => 
                                        r.id === ref.id ? {...r, publisher: e.target.value} : r
                                      ))}
                                      placeholder="دار النشر"
                                      className="bg-white"
                                    />
                                    <div className="flex gap-2">
                                      <Input 
                                        value={ref.country || ""}
                                        onChange={e => setReferences(references.map(r => 
                                          r.id === ref.id ? {...r, country: e.target.value} : r
                                        ))}
                                        placeholder="بلد النشر"
                                        className="bg-white flex-1"
                                      />
                                      <Button 
                                        size="icon" 
                                        variant="ghost"
                                        className="text-red-500"
                                        onClick={() => setReferences(references.filter(r => r.id !== ref.id))}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <div className="space-y-2">
                                  <Input 
                                    value={ref.title}
                                    onChange={e => setReferences(references.map(r => 
                                      r.id === ref.id ? {...r, title: e.target.value} : r
                                    ))}
                                    placeholder="اسم الموقع/المصدر"
                                    className="bg-white"
                                  />
                                  <div className="flex gap-2">
                                    <Input 
                                      value={ref.url || ""}
                                      onChange={e => setReferences(references.map(r => 
                                        r.id === ref.id ? {...r, url: e.target.value} : r
                                      ))}
                                      placeholder="https://example.com"
                                      className="bg-white flex-1"
                                    />
                                    <Button 
                                      size="icon" 
                                      variant="ghost"
                                      className="text-red-500"
                                      onClick={() => setReferences(references.filter(r => r.id !== ref.id))}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="policies" className="mt-0" dir="rtl">
                <Card>
                  <CardHeader className="bg-gradient-to-r from-rose-50 to-red-50 border-b">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Award className="w-5 h-5 text-rose-600" />
                          X. الضوابط والسياسات المتبعة في المقرر
                        </CardTitle>
                        <p className="text-sm text-slate-600 mt-1">
                          بناءً على النظام الموحد لشئون الطلاب
                        </p>
                      </div>
                      <Button 
                        size="sm"
                        onClick={() => setPolicies([...policies, { 
                          id: Date.now().toString(), 
                          title: "", 
                          content: "" 
                        }])}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        إضافة ضابط
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {policies.map((policy, index) => (
                      <div key={policy.id} className="p-4 bg-slate-50 rounded-lg border space-y-3">
                        <div className="flex items-center gap-3">
                          <Badge className="bg-rose-600 shrink-0">{index + 1}</Badge>
                          <Input 
                            value={policy.title}
                            onChange={e => setPolicies(policies.map(p => 
                              p.id === policy.id ? {...p, title: e.target.value} : p
                            ))}
                            placeholder="عنوان الضابط (مثال: الحضور والغياب)"
                            className="bg-white flex-1 font-semibold"
                          />
                          {policies.length > 1 && (
                            <Button 
                              size="icon" 
                              variant="ghost"
                              className="text-red-500 shrink-0"
                              onClick={() => setPolicies(policies.filter(p => p.id !== policy.id))}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        <Textarea 
                          value={policy.content}
                          onChange={e => setPolicies(policies.map(p => 
                            p.id === policy.id ? {...p, content: e.target.value} : p
                          ))}
                          placeholder="اكتب نص الضابط والسياسة..."
                          className="bg-white min-h-[100px]"
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

            </div>
          </ScrollArea>
        </Tabs>

        <div className="p-4 border-t bg-slate-50 shrink-0 flex flex-col sm:flex-row justify-between gap-3" dir="rtl">
          {/* <div className="flex items-center gap-2 text-sm text-slate-600">
            <Info className="w-4 h-4" />
            <span>الجزء النشط: <strong>{activePart}</strong></span>
          </div> */}
          <div className="flex gap-2 justify-end">
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
      </DialogContent>
    </Dialog>
  );
}