import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Bell,
  Megaphone,
  AlertTriangle,
  FileText,
  Calendar,
  Clock,
  Search,
  User,
  Mail,
  Sparkles,
  ShieldAlert,
} from "lucide-react";

export interface AnnouncementItem {
  id: number;
  subject: string;
  message: string;
  sender: string;
  sender_email?: string;
  date: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  announcements: AnnouncementItem[];
}

export default function StudentNotificationsModal({ open, onClose, announcements }: Props) {
  const [filterType, setFilterType] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // تصنيف نوع التنبيه بناءً على الكلمات المفتاحية في العنوان أو النص
  const categorize = (item: AnnouncementItem) => {
    const text = (item.subject + " " + item.message).toLowerCase();
    if (text.includes("اختبار") || text.includes("كويز") || text.includes("امتحان") || text.includes("موعد")) {
      return { type: "exam", label: "موعد اختبار / كويز", color: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20", icon: AlertTriangle };
    }
    if (text.includes("اعتذار") || text.includes("تأجيل") || text.includes("إلغاء") || text.includes("عذر")) {
      return { type: "apology", label: "اعتذار عن محاضرة", color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20", icon: ShieldAlert };
    }
    if (text.includes("واجب") || text.includes("تكليف") || text.includes("مشروع") || text.includes("تسليم")) {
      return { type: "assignment", label: "تكليف / واجب منزلي", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20", icon: FileText };
    }
    return { type: "general", label: "إعلان عام", color: "bg-primary/10 text-primary border-primary/20", icon: Megaphone };
  };

  const filtered = announcements.filter((item) => {
    const cat = categorize(item);
    if (filterType !== "all" && cat.type !== filterType) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        item.subject.toLowerCase().includes(q) ||
        item.message.toLowerCase().includes(q) ||
        item.sender.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 flex flex-col overflow-hidden" dir="rtl">
        {/* Header */}
        <div className="p-6 pb-4 bg-gradient-to-br from-primary/10 via-background to-background border-b shrink-0">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                مركز التنبيهات والإعلانات العاجلة
                <Badge variant="secondary" className="mr-2 text-xs">
                  {announcements.length} تنبيه
                </Badge>
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              متابعة آخر التنبيهات الرسمية، مواعيد الاختبارات الفجائية والنصفيّة، اعتذارات الدكاترة، وتكليفات الشعبة.
            </DialogDescription>
          </DialogHeader>

          {/* Search & Category Filter Pills */}
          <div className="mt-4 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute right-3 top-2.5" />
              <Input
                placeholder="بحث في التنبيهات، اسم الدكتور، أو اسم المقرر..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-9 text-xs h-9"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              <Button
                variant={filterType === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("all")}
                className="h-7 text-xs rounded-full px-3"
              >
                الكل ({announcements.length})
              </Button>
              <Button
                variant={filterType === "exam" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("exam")}
                className="h-7 text-xs rounded-full px-3 gap-1"
              >
                <AlertTriangle className="w-3 h-3 text-rose-500" />
                مواعيد واختبارات
              </Button>
              <Button
                variant={filterType === "apology" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("apology")}
                className="h-7 text-xs rounded-full px-3 gap-1"
              >
                <ShieldAlert className="w-3 h-3 text-amber-500" />
                اعتذارات الدكاترة
              </Button>
              <Button
                variant={filterType === "assignment" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("assignment")}
                className="h-7 text-xs rounded-full px-3 gap-1"
              >
                <FileText className="w-3 h-3 text-blue-500" />
                تكليفات وواجبات
              </Button>
            </div>
          </div>
        </div>

        {/* List of Announcements */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1 divide-y divide-border/40">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground space-y-2">
              <Bell className="w-10 h-10 mx-auto text-muted-foreground/40" />
              <p className="text-sm font-medium">لا توجد تنبيهات مطابقة لهذا التصنيف حالياً.</p>
              <p className="text-xs">سيتم إشعارك فور قيام أي دكتور بنشر تنبيه لمجموعتك الدراسية.</p>
            </div>
          ) : (
            filtered.map((item) => {
              const cat = categorize(item);
              const Icon = cat.icon;
              return (
                <div key={item.id} className="pt-3 first:pt-0 space-y-2 group">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                        {item.sender?.charAt(0) || "د"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-foreground">{item.subject}</h4>
                          <Badge variant="outline" className={`text-[10px] gap-1 py-0 px-2 border ${cat.color}`}>
                            <Icon className="w-3 h-3" />
                            {cat.label}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3 text-primary" />
                            {item.sender}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {item.date}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-3 bg-muted/40 rounded-xl text-xs text-foreground/90 leading-relaxed border border-border/50">
                    {item.message}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-muted/20 border-t flex justify-end shrink-0">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs h-8">
            إغلاق
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
