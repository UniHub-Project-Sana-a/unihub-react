import { useState, useEffect } from "react";
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
  Clock,
  Search,
  User,
  ShieldAlert,
  CheckCheck,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/api";

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
  announcements?: AnnouncementItem[];
  onRefresh?: () => Promise<void> | void;
}

export default function StudentNotificationsModal({ open, onClose, announcements: initialAnnouncements, onRefresh }: Props) {
  const [filterType, setFilterType] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [items, setItems] = useState<AnnouncementItem[]>(initialAnnouncements || []);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [readIds, setReadIds] = useState<number[]>(() => {
    try {
      const raw = localStorage.getItem("unihub_read_announcements");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // مزامنة العناصر عند تغير الـ props
  useEffect(() => {
    if (initialAnnouncements && initialAnnouncements.length > 0) {
      setItems(initialAnnouncements);
    }
  }, [initialAnnouncements]);

  // جلب الإعلانات ذاتياً إذا لم تكن ممررة
  const fetchDirectAnnouncements = async () => {
    setIsRefreshing(true);
    try {
      if (onRefresh) {
        await onRefresh();
      } else {
        const res = await api.get("/v1/student/announcements");
        if (res.data?.announcements) {
          setItems(res.data.announcements);
        }
      }
    } catch (e) {
      console.warn("Failed to refresh announcements:", e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (open) {
      // قراءة المعرفات المقروءة الحديثة
      try {
        const raw = localStorage.getItem("unihub_read_announcements");
        if (raw) setReadIds(JSON.parse(raw));
      } catch {}
      
      if (!initialAnnouncements || initialAnnouncements.length === 0) {
        fetchDirectAnnouncements();
      }
    }
  }, [open]);

  // تحديد الكل كمقروء
  const handleMarkAllAsRead = async () => {
    const allIds = items.map((i) => i.id);
    const updated = Array.from(new Set([...readIds, ...allIds]));
    setReadIds(updated);
    try {
      localStorage.setItem("unihub_read_announcements", JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent("unihub:announcements-read"));
      await api.post("/v1/student/announcements/mark-read");
    } catch (e) {
      console.warn(e);
    }
  };

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

  const filtered = items.filter((item) => {
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

  const unreadCount = items.filter((i) => !readIds.includes(i.id)).length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 flex flex-col overflow-hidden rounded-2xl" dir="rtl">
        {/* Header */}
        <div className="p-3.5 sm:p-5 pb-3 sm:pb-4 bg-gradient-to-br from-primary/10 via-background to-background border-b shrink-0">
          <DialogHeader>
            <div className="flex items-center justify-between gap-3">
              <DialogTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Bell className="w-4 h-4 text-primary" />
                </div>
                <span>تنبيهات وإعلانات الدكاترة المباشرة</span>
                {unreadCount > 0 ? (
                  <Badge className="bg-rose-600 text-white text-xs px-2 py-0.5">
                    {unreadCount} جديد
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    {items.length} تنبيه
                  </Badge>
                )}
              </DialogTitle>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={fetchDirectAnnouncements}
                  disabled={isRefreshing}
                  title="تحديث الإعلانات"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-primary" : ""}`} />
                </Button>

                {unreadCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1 text-primary border-primary/20 hover:bg-primary/5"
                    onClick={handleMarkAllAsRead}
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">تحديد الكل كمقروء</span>
                  </Button>
                )}
              </div>
            </div>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              إشعارات وتنبيهات أعضاء هيئة التدريس لمجموعتك الدراسية حول اعتذارات المحاضرات، الكويزات، والتكليفات.
            </DialogDescription>
          </DialogHeader>

          {/* Search & Category Filter Pills */}
          <div className="mt-4 space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute right-3 top-2.5" />
              <Input
                placeholder="بحث في التنبيهات، اسم الدكتور، أو الموضوع..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-9 text-xs h-9 bg-background/60"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              <Button
                variant={filterType === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("all")}
                className="h-7 text-xs rounded-full px-3"
              >
                الكل ({items.length})
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
                variant={filterType === "exam" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("exam")}
                className="h-7 text-xs rounded-full px-3 gap-1"
              >
                <AlertTriangle className="w-3 h-3 text-rose-500" />
                مواعيد واختبارات
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
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1 divide-y divide-border/30">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground space-y-2">
              <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto text-muted-foreground/50">
                <Bell className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-foreground">لا توجد تنبيهات مطابقة لهذا التصنيف حالياً.</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                سيظهر أي تنبيه جديد فور قيام أستاذ المقرر بإرساله لمجموعتك الدراسية مباشرة.
              </p>
            </div>
          ) : (
            filtered.map((item) => {
              const cat = categorize(item);
              const Icon = cat.icon;
              const isUnread = !readIds.includes(item.id);

              return (
                <div
                  key={item.id}
                  className={`pt-3 first:pt-0 p-3.5 rounded-xl border transition-all ${
                    isUnread
                      ? "border-primary/40 bg-primary/[0.02] shadow-2xs"
                      : "border-border/60 bg-card hover:bg-muted/20"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 border border-primary/20">
                        {item.sender?.charAt(0) || "د"}
                      </div>
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-sm text-foreground leading-snug">{item.subject}</h4>
                          <Badge variant="outline" className={`text-[10px] gap-1 py-0 px-2 border ${cat.color}`}>
                            <Icon className="w-3 h-3" />
                            {cat.label}
                          </Badge>
                          {isUnread && (
                            <Badge className="bg-rose-500 hover:bg-rose-600 text-white text-[10px] py-0 px-1.5 h-4 font-bold">
                              جديد
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-2 flex-wrap">
                          <span className="flex items-center gap-1 font-medium text-foreground">
                            <User className="w-3 h-3 text-primary" />
                            {item.sender}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3 text-muted-foreground/70" />
                            {item.date}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="mt-3 p-3 bg-muted/40 rounded-xl text-xs text-foreground/90 leading-relaxed border border-border/50 whitespace-pre-line">
                    {item.message}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-muted/20 border-t flex items-center justify-between shrink-0">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>نظام إشعارات UniHub الأكاديمي الفوري</span>
          </span>
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs h-8 px-4">
            إغلاق
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
