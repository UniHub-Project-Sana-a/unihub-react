import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { Bell, Send, Megaphone, Calendar, Users, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

interface GroupInfo {
  group_id: number;
  group_name: string;
  courses: string[];
}

interface AnnouncementItem {
  id: number;
  group_id: number;
  group_name: string;
  subject: string;
  message: string;
  date: string;
}

export function LecturerAnnouncements() {
  const { toast } = useToast();
  const [groups, setGroups] = useState<GroupInfo[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [announcementType, setAnnouncementType] = useState<string>("exam");
  const [subject, setSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");

  const fetchGroupsAndAnnouncements = async () => {
    setIsLoading(true);
    try {
      const [groupsRes, annRes] = await Promise.all([
        api.get("/v1/lecturer/my-groups"),
        api.get("/v1/lecturer/group-announcements"),
      ]);

      if (groupsRes.data?.groups) {
        setGroups(groupsRes.data.groups);
        if (groupsRes.data.groups.length > 0 && !selectedGroupId) {
          setSelectedGroupId(groupsRes.data.groups[0].group_id.toString());
        }
      }

      if (annRes.data?.announcements) {
        setAnnouncements(annRes.data.announcements);
      }
    } catch (error) {
      console.error("Error fetching announcements data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupsAndAnnouncements();
  }, []);

  // Preset templates
  const applyTemplate = (type: string) => {
    setAnnouncementType(type);
    if (type === "exam") {
      setSubject("إشعار موعد اختبار نصفي / دوري");
      setMessageBody("أعزائي الطلاب، نحيطكم علماً بأنه تقرر عقد الاختبار القادم في القاعة المحددة بجدولكم. يرجى المذاكرة الجيدة والالتزام بالحضور في الموعد.");
    } else if (type === "apology") {
      setSubject("اعتذار عن حضور المحاضرة لظرف طارئ");
      setMessageBody("أبنائي الطلبة، أعتذر عن عدم التمكن من إلقاء محاضرة اليوم لظرف طارئ، وسيتم التنسيق معكم ومع إدارة الكلية لجدولة جلسة تعويضية قريباً.");
    } else if (type === "assignment") {
      setSubject("تكليف دراسي جديد وموعد التسليم");
      setMessageBody("يرجى الاطلاع على التكليف الأكاديمي المطلوب وتسليمه خلال أسبوع من تاريخ هذا الإشعار، مع مراعاة المعايير العلمية المطلوبة.");
    } else {
      setSubject("");
      setMessageBody("");
    }
  };

  const handleSendAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroupId || !subject.trim() || !messageBody.trim()) {
      toast({
        title: "بيانات غير مكتملة",
        description: "يرجى اختيار المجموعة الدراسية وكتابة عنوان ونص الإعلان.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/v1/lecturer/group-announcements", {
        group_id: parseInt(selectedGroupId),
        subject: subject.trim(),
        message_body: messageBody.trim(),
        notification_type: announcementType,
      });

      toast({
        title: "تم الإرسال بنجاح",
        description: "تم بث التنبيه لجميع طلاب المجموعة في بواباتهم.",
      });

      setSubject("");
      setMessageBody("");
      fetchGroupsAndAnnouncements();
    } catch (error: any) {
      toast({
        title: "خطأ في الإرسال",
        description: error?.response?.data?.message || "تعذر إرسال الإعلان.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">جاري تحميل مجموعات الطلاب والإعلانات...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* نموذج كتابة إعلان جديد */}
        <Card className="lg:col-span-5 shadow-sm border-border/60">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">بث إعلان / تنبيه للمجموعة</CardTitle>
            </div>
            <CardDescription>
              إرسال إشعار فوري لجميع طلاب المجموعة (اختبار، اعتذار عن محاضرة، تكليف...)
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSendAnnouncement} className="space-y-4">
              {/* اختيار المجموعة */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  المجموعة الدراسية المستهدفة
                </label>
                <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المجموعة" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((g) => (
                      <SelectItem key={g.group_id} value={g.group_id.toString()}>
                        {g.group_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* قوالب جاهزة سريعة */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                  قوالب إعلانات سريعة:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <Button
                    type="button"
                    variant={announcementType === "exam" ? "default" : "outline"}
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => applyTemplate("exam")}
                  >
                    📝 موعد اختبار
                  </Button>
                  <Button
                    type="button"
                    variant={announcementType === "apology" ? "default" : "outline"}
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => applyTemplate("apology")}
                  >
                    ⏳ اعتذار عن محاضرة
                  </Button>
                  <Button
                    type="button"
                    variant={announcementType === "assignment" ? "default" : "outline"}
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => applyTemplate("assignment")}
                  >
                    📂 تكليف أكاديمي
                  </Button>
                </div>
              </div>

              {/* عنوان الإعلان */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  عنوان الإشعار
                </label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="مثال: موعد الاختبار النصفي لمقرر التشريح"
                  required
                />
              </div>

              {/* نص الرسالة */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  نص وتفاصيل الإعلان
                </label>
                <Textarea
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  rows={4}
                  placeholder="اكتب التوجيهات أو الملاحظات التي تود إبلاغ الطلاب بها..."
                  required
                />
              </div>

              <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    جاري الإرسال...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    بث الإعلان للطلاب الآن
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* سجل الإعلانات المرسلة */}
        <Card className="lg:col-span-7 shadow-sm border-border/60">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">سجل الإعلانات والتنبيهات السابقة</CardTitle>
              </div>
              <Badge variant="secondary">{announcements.length} إعلان</Badge>
            </div>
            <CardDescription>
              جميع التوجيهات والإشعارات التي قمت ببثها لطلابك عبر المنصة
            </CardDescription>
          </CardHeader>

          <CardContent>
            {announcements.length === 0 ? (
              <div className="text-center py-10 border border-dashed rounded-lg bg-muted/20">
                <Megaphone className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">لم يتم إرسال أي إعلانات حتى الآن.</p>
                <p className="text-xs text-muted-foreground mt-1">
                  استخدم النموذج الجانبي لبث أول إعلان لمجموعاتك الدراسية.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {announcements.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-lg border border-border/70 bg-card hover:bg-accent/5 transition-colors space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        {item.subject}
                      </div>
                      <Badge variant="outline" className="text-[11px] shrink-0 font-normal">
                        {item.group_name}
                      </Badge>
                    </div>

                    <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
                      {item.message}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {item.date}
                      </span>
                      <span className="text-emerald-600 font-medium">تم التسليم في بوابات الطلاب</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

