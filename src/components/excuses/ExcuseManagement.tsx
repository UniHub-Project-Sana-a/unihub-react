import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Clock, DollarSign, CheckCircle, XCircle, AlertTriangle, User, MessageSquare, Eye } from "lucide-react";

const excuseRequests = [
  {
    id: 1,
    instructor: "د. سارة جونسون", // Instructor: Dr. Sarah Johnson
    type: "إجازة مرضية", // Type: Medical Leave
    reason: "موعد عملية جراحية", // Reason: Surgery appointment
    dateRequested: "2024-01-10",
    dateFrom: "2024-01-15",
    dateTo: "2024-01-17",
    status: "Pending", // Status: Pending
    sessionsAffected: 6,
    salaryImpact: -450,
    replacementInstructor: "أ. أحمد حسن", // Replacement Instructor: Prof. Ahmed Hassan
    documents: ["medical_certificate.pdf"],
    comments: []
  },
  {
    id: 2,
    instructor: "أ. أحمد حسن", // Instructor: Prof. Ahmed Hassan
    type: "تعديل الراتب", // Type: Salary Adjustment
    reason: "ساعات إشراف بحثي إضافية", // Reason: Additional research supervision hours
    dateRequested: "2024-01-12",
    dateFrom: "2024-01-01",
    dateTo: "2024-01-31",
    status: "Approved", // Status: Approved
    sessionsAffected: 0,
    salaryImpact: +800,
    replacementInstructor: null,
    documents: ["research_hours_log.pdf"],
    comments: [
      { user: "رئيس القسم", date: "2024-01-13", comment: "تمت الموافقة بسبب الإخراج البحثي الممتاز والمسؤوليات الإضافية.", action: "Approved" }
    ]
  },
  {
    id: 3,
    instructor: "د. تشن ليو", // Instructor: Dr. Chen Liu
    type: "إجازة شخصية", // Type: Personal Leave
    reason: "حالة طوارئ عائلية", // Reason: Family emergency
    dateRequested: "2024-01-14",
    dateFrom: "2024-01-20",
    dateTo: "2024-01-22",
    status: "Pending", // Status: Pending
    sessionsAffected: 4,
    salaryImpact: -300,
    replacementInstructor: "د. مارتينيز", // Replacement Instructor: Dr. Martinez
    documents: [],
    comments: []
  },
  {
    id: 4,
    instructor: "أ. ويلسون", // Instructor: Prof. Wilson
    type: "إجازة مؤتمر", // Type: Conference Leave
    reason: "مؤتمر أكاديمي دولي", // Reason: International Academic Conference
    dateRequested: "2024-01-08",
    dateFrom: "2024-01-25",
    dateTo: "2024-01-28",
    status: "Rejected", // Status: Rejected
    sessionsAffected: 8,
    salaryImpact: -600,
    replacementInstructor: null,
    documents: ["conference_invitation.pdf"],
    comments: [
      { user: "رئيس القسم", date: "2024-01-09", comment: "تعذر ترتيب مدرب بديل مناسب لهذه الفترة. يرجى إعادة الجدولة.", action: "Rejected" }
    ]
  }
];

export function ExcuseManagement() {
  const [selectedExcuse, setSelectedExcuse] = useState(null);
  const [filterStatus, setFilterStatus] = useState("All");
  const [newComment, setNewComment] = useState("");
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [actionType, setActionType] = useState("");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-700";
      case "Rejected":
        return "bg-red-100 text-red-700";
      case "Pending":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "تعديل الراتب": // Salary Adjustment
        return "bg-blue-100 text-blue-700";
      case "إجازة مرضية": // Medical Leave
        return "bg-purple-100 text-purple-700";
      case "إجازة شخصية": // Personal Leave
        return "bg-orange-100 text-orange-700";
      case "إجازة مؤتمر": // Conference Leave
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // دالة تحويل حالة الطلب من الإنجليزي إلى العربي (للعرض فقط)
  const getStatusArabic = (status: string) => {
      switch (status) {
          case "Approved":
              return "تمت الموافقة";
          case "Rejected":
              return "تم الرفض";
          case "Pending":
              return "قيد الانتظار";
          default:
              return status;
      }
  };

  // دالة تحويل نوع الطلب من الإنجليزي إلى العربي (للعرض فقط)
  const getTypeArabic = (type: string) => {
      switch (type) {
          case "Salary Adjustment":
              return "تعديل الراتب";
          case "Medical Leave":
              return "إجازة مرضية";
          case "Personal Leave":
              return "إجازة شخصية";
          case "Conference Leave":
              return "إجازة مؤتمر";
          default:
              return type;
      }
  };


  const handleApproveReject = (requestId: number, action: string) => {
    setSelectedExcuse(requestId);
    setActionType(action);
    setShowCommentDialog(true);
  };

  const submitComment = () => {
    console.log("Submitting comment:", {
      requestId: selectedExcuse,
      action: actionType,
      comment: newComment,
      user: "Current User",
      date: new Date().toISOString().split('T')[0]
    });
    setNewComment("");
    setShowCommentDialog(false);
    setSelectedExcuse(null);
    setActionType("");
  };

  const filteredRequests = filterStatus === "All"
    ? excuseRequests
    : excuseRequests.filter(req => getStatusArabic(req.status) === filterStatus || req.status === filterStatus);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة طلبات الإجازة/الاستثناء</h1>
          <p className="text-gray-600">إدارة طلبات المدربين وتعديلات الرواتب</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/excuses/pending">
              <Eye className="w-4 h-4 mr-2" />
              عرض الطلبات المعلقة
            </Link>
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 shadow-lg">
            <FileText className="w-4 h-4 mr-2" />
            طلب جديد
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="shadow-xl bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">الطلبات المعلقة</p>
                <p className="text-3xl font-bold text-yellow-600">{excuseRequests.filter(r => r.status === "Pending").length}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-xl bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">إجمالي الطلبات</p>
                <p className="text-3xl font-bold text-blue-600">{excuseRequests.length}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-xl bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">تأثير الراتب الصافي</p>
                <p className="text-3xl font-bold text-green-600">
                    {/* حساب التأثير الصافي للراتب من البيانات */}
                    ${excuseRequests.reduce((sum, req) => sum + req.salaryImpact, 0)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-xl bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">معدل الموافقة</p>
                <p className="text-3xl font-bold text-purple-600">
                    {/* حساب معدل الموافقة */}
                    {Math.round((excuseRequests.filter(r => r.status === "Approved").length / excuseRequests.length) * 100)}%
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests Table */}
      <Card className="shadow-xl bg-white">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span>جميع الطلبات</span>
            </div>
            <div className="flex items-center space-x-2">
              {["All", "Pending", "Approved", "Rejected"].map((status) => (
                <Button
                  key={status}
                  variant={filterStatus === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus(status)}
                >
                  {getStatusArabic(status)}
                </Button>
              ))}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المدرب</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>السبب</TableHead>
                <TableHead>نطاق التاريخ</TableHead>
                <TableHead>التأثير</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((request) => (
                <TableRow key={request.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{request.instructor}</p>
                        <p className="text-sm text-gray-500">الرقم التعريفي: {request.id.toString().padStart(4, '0')}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getTypeColor(getTypeArabic(request.type))}>
                      {getTypeArabic(request.type)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-gray-900">{request.reason}</p>
                    <p className="text-xs text-gray-500">تاريخ الطلب: {request.dateRequested}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-gray-900">من {request.dateFrom} إلى {request.dateTo}</p>
                    {request.sessionsAffected > 0 && (
                      <p className="text-xs text-gray-500">{request.sessionsAffected} حصة متأثرة</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <DollarSign className="w-4 h-4 text-gray-500" />
                      <span className={`font-medium ${request.salaryImpact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {request.salaryImpact >= 0 ? '+' : ''}{request.salaryImpact}
                      </span>
                    </div>
                    {request.replacementInstructor && (
                      <p className="text-xs text-gray-500">البديل: {request.replacementInstructor}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(request.status)}>
                        {getStatusArabic(request.status)}
                      </Badge>
                      {request.comments.length > 0 && (
                        <MessageSquare className="w-4 h-4 text-blue-500" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {request.status === "Pending" && (
                        <>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleApproveReject(request.id, "Approve")}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleApproveReject(request.id, "Reject")}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            عرض
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                          <DialogHeader>
                            <DialogTitle>تفاصيل الطلب - {request.instructor}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>النوع</Label>
                                <Badge className={getTypeColor(getTypeArabic(request.type))}>{getTypeArabic(request.type)}</Badge>
                              </div>
                              <div>
                                <Label>الحالة</Label>
                                <Badge className={getStatusColor(request.status)}>{getStatusArabic(request.status)}</Badge>
                              </div>
                            </div>
                            <div>
                              <Label>السبب</Label>
                              <p className="text-sm text-gray-700">{request.reason}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>تاريخ البدء</Label>
                                <Input value={request.dateFrom} readOnly />
                              </div>
                              <div>
                                <Label>تاريخ الانتهاء</Label>
                                <Input value={request.dateTo} readOnly />
                              </div>
                            </div>
                            {request.type === "Salary Adjustment" && (
                              <div className="bg-blue-50 p-4 rounded-lg">
                                <h4 className="font-medium text-blue-900 mb-2">تفاصيل تعديل الراتب</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="text-blue-700">المبلغ:</span>
                                    <span className="ml-2 font-medium">${Math.abs(request.salaryImpact)}</span>
                                  </div>
                                  <div>
                                    <span className="text-blue-700">النوع:</span>
                                    <span className="ml-2 font-medium">
                                      {request.salaryImpact >= 0 ? 'زيادة' : 'خصم'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                            {request.documents.length > 0 && (
                              <div>
                                <Label>المستندات الداعمة</Label>
                                <div className="space-y-2">
                                  {request.documents.map((doc, index) => (
                                    <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                                      <FileText className="w-4 h-4 text-gray-500" />
                                      <span className="text-sm text-gray-700">{doc}</span>
                                      <Button variant="ghost" size="sm">تحميل</Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Comments Section */}
                            {request.comments.length > 0 && (
                              <div>
                                <Label className="flex items-center space-x-2">
                                  <MessageSquare className="w-4 h-4" />
                                  <span>التعليقات وسجل التدقيق</span>
                                </Label>
                                <div className="space-y-3 mt-2">
                                  {request.comments.map((comment, index) => (
                                    <div key={index} className="p-3 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium text-gray-900">{comment.user}</span>
                                        <div className="flex items-center space-x-2">
                                          <Badge className={comment.action === "Approved" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                                            {comment.action === "Approved" ? "تمت الموافقة" : "تم الرفض"}
                                          </Badge>
                                          <span className="text-sm text-gray-500">{comment.date}</span>
                                        </div>
                                      </div>
                                      <p className="text-sm text-gray-700">{comment.comment}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Comment Dialog */}
      <Dialog open={showCommentDialog} onOpenChange={setShowCommentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{actionType === "Approve" ? "الموافقة على الطلب" : "رفض الطلب"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>الإجراء</Label>
              <Badge className={actionType === "Approve" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                {actionType === "Approve" ? "موافقة" : "رفض"}
              </Badge>
            </div>
            <div>
              <Label>إضافة تعليق (اختياري)</Label>
              <Textarea
                placeholder="أضف تعليقك موضحًا القرار..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex items-center justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowCommentDialog(false)}>
                إلغاء
              </Button>
              <Button onClick={submitComment} className={actionType === "Approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}>
                {actionType === "Approve" ? "الموافقة على الطلب" : "رفض الطلب"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}