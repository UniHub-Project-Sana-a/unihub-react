import { useState, useRef } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Upload,
  Camera,
  CheckCircle2,
  XCircle,
  Loader2,
  Paperclip,
  Trash2,
  FileCheck,
} from "lucide-react";

interface RegisteredCourse {
  course_id: number;
  course_name: string;
  course_code: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  courses: RegisteredCourse[];
  onSuccess?: () => void;
}

export default function StudentAssignmentSubmissionModal({ open, onClose, courses, onSuccess }: Props) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const [courseId, setCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (file.type.startsWith("image/")) {
        setPreviewUrl(URL.createObjectURL(file));
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId || !title.trim()) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى اختيار المقرر وكتابة عنوان التكليف أو الواجب.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedFile) {
      toast({
        title: "الملف مطلوب",
        description: "يرجى تصوير ورقة الواجب أو إرفاق ملف التكليف قبل الإرسال.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("course_id", courseId);
      formData.append("title", title.trim());
      if (notes.trim()) formData.append("notes", notes.trim());
      formData.append("file", selectedFile);

      const res = await api.post("/v1/student/assignments/submit", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.status) {
        toast({
          title: "تم تسليم التكليف بنجاح! 📄",
          description: res.data.message || "تم إرسال الملف إلى دكتور المقرر.",
        });
        clearFile();
        setTitle("");
        setNotes("");
        setCourseId("");
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (error: any) {
      toast({
        title: "خطأ أثناء التسليم",
        description: error?.response?.data?.message || "تعذر تسليم الملف.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl" dir="rtl">
        <div className="p-4 sm:p-6 pb-3 sm:pb-4 bg-gradient-to-br from-primary/10 via-background to-background border-b">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-primary" />
              تسليم تكليف / واجب دراسي
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              يمكنك تصوير ورقة الحل بالكاميرا مباشرة أو إرفاق أي ملف (PDF، صور، مستندات) لإرسالها لأستاذ المقرر.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3 sm:space-y-4">
          {/* اختيار المقرر */}
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">المقرر الدراسي *</label>
            <Select value={courseId} onValueChange={setCourseId} required>
              <SelectTrigger className="text-xs h-9">
                <SelectValue placeholder="اختر المقرر الدراسي" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((c) => (
                  <SelectItem key={c.course_id} value={c.course_id.toString()} className="text-xs">
                    {c.course_name} ({c.course_code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* عنوان الواجب */}
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">عنوان التكليف أو الواجب *</label>
            <Input
              placeholder="مثال: واجب الأسبوع الثالث - التشريح العام"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xs h-9"
              required
            />
          </div>

          {/* ملاحظات للطالب */}
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">ملاحظات أو توضيح للدكتور (اختياري)</label>
            <Textarea
              placeholder="أي ملاحظات تود إرفاقها مع الحل..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="text-xs"
            />
          </div>

          {/* منطقة التصوير ورفع الملفات */}
          <div>
            <label className="text-xs font-semibold text-foreground block mb-2">إرفاق ملف الحل أو التصوير *</label>
            
            {/* أزرار الإجراء السريع */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              {/* تصوير بالكاميرا */}
              <Button
                type="button"
                variant="outline"
                className="gap-2 h-10 border-dashed border-primary/40 hover:bg-primary/5 text-xs font-medium"
                onClick={() => cameraInputRef.current?.click()}
              >
                <Camera className="w-4 h-4 text-primary" />
                تصوير ورقة الحل 📷
              </Button>
              <input
                type="file"
                ref={cameraInputRef}
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
              />

              {/* اختيار ملف من الجهاز */}
              <Button
                type="button"
                variant="outline"
                className="gap-2 h-10 border-dashed border-primary/40 hover:bg-primary/5 text-xs font-medium"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 text-primary" />
                رفع ملف (PDF / صورة) 📁
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*,application/pdf,.doc,.docx"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* معاينة الملف المختار */}
            {selectedFile && (
              <div className="p-3 bg-muted/40 rounded-xl border flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 overflow-hidden">
                  <Paperclip className="w-4 h-4 text-primary shrink-0" />
                  <div className="truncate">
                    <p className="font-semibold text-foreground truncate">{selectedFile.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} ميجابايت
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearFile}
                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-7 w-7 p-0 shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}

            {previewUrl && (
              <div className="mt-2 rounded-xl overflow-hidden border max-h-48 flex justify-center bg-black/5">
                <img src={previewUrl} alt="معاينة المستند" className="object-contain max-h-48" />
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-row justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} size="sm">
              إلغاء
            </Button>
            <Button type="submit" disabled={isSubmitting || !selectedFile} className="gap-1.5" size="sm">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري التسليم...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  إرسال التكليف للدكتور
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
