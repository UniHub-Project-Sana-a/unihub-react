import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { 
  Search, 
  Filter, 
  Download, 
  FileText, 
  Calendar,
  Clock,
  User,
  Building,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  TrendingUp,
  Users,
  ArrowUp
} from "lucide-react";

// Mock data for pending excuse requests
const pendingRequests = [
  {
    id: "REQ-001",
    staffName: "Dr. Ahmed Hassan",
    department: "Computer Science",
    rank: "Professor",
    requestType: "Make-Up Lecture",
    submittedDate: "2024-01-15",
    originalDate: "2024-01-10",
    reason: "Missed lecture due to conference attendance",
    status: "Pending",
    urgency: "medium",
    description: "Requesting to schedule make-up lecture for Advanced Algorithms course. Original lecture was missed due to attending IEEE Computer Science Conference.",
    attachments: ["conference_certificate.pdf"],
    email: "ahmed.hassan@unihub.edu",
    phone: "+20 12 345 6789",
    studentCount: 45
  },
  {
    id: "REQ-002", 
    staffName: "Dr. Sarah Wilson",
    department: "Mathematics",
    rank: "Associate Professor",
    requestType: "Leave Request",
    submittedDate: "2024-01-14",
    originalDate: "2024-01-20",
    reason: "Medical leave for surgery",
    status: "Pending",
    urgency: "high",
    description: "Requesting medical leave for urgent surgery. Will need 3 days recovery time.",
    attachments: ["medical_certificate.pdf", "doctor_recommendation.pdf"],
    email: "sarah.wilson@unihub.edu", 
    phone: "+20 12 567 8901",
    studentCount: 38
  },
  {
    id: "REQ-003",
    staffName: "Prof. Mohamed Ali",
    department: "Physics",
    rank: "Lecturer",
    requestType: "Salary Increase",
    submittedDate: "2024-01-12",
    originalDate: "2024-02-01",
    reason: "Additional research supervision responsibilities",
    status: "Pending",
    urgency: "low",
    description: "Requesting salary adjustment due to taking on additional PhD student supervision and research project management responsibilities.",
    attachments: ["research_workload.pdf", "supervision_agreement.pdf"],
    email: "mohamed.ali@unihub.edu",
    phone: "+20 12 789 0123",
    studentCount: 32
  },
  {
    id: "REQ-004",
    staffName: "Dr. Chen Liu",
    department: "Engineering",
    rank: "Assistant Professor", 
    requestType: "Make-Up Lecture",
    submittedDate: "2024-01-16",
    originalDate: "2024-01-12",
    reason: "Family emergency",
    status: "Pending",
    urgency: "high",
    description: "Emergency family situation required immediate attention. Need to reschedule Control Systems lecture.",
    attachments: [],
    email: "chen.liu@unihub.edu",
    phone: "+20 12 456 7890",
    studentCount: 28
  }
];

export function PendingExcuses() {
  const [selectedRequest, setSelectedRequest] = useState<typeof pendingRequests[0] | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterType, setFilterType] = useState("");
  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState(false);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [isRejectionDialogOpen, setIsRejectionDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionType, setActionType] = useState("");

  const filteredRequests = pendingRequests.filter(request => {
    return (
      request.staffName.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (filterDepartment === "" || filterDepartment === "all" || request.department === filterDepartment) &&
      (filterType === "" || filterType === "all" || request.requestType === filterType)
    );
  });

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Leave Request":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "Salary Increase":
        return "bg-green-100 text-green-800 border-green-200";
      case "Make-Up Lecture":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleApprove = (request: typeof pendingRequests[0]) => {
    setSelectedRequest(request);
    setActionType("approve");
    setIsApprovalDialogOpen(true);
  };

  const handleReject = (request: typeof pendingRequests[0]) => {
    setSelectedRequest(request);
    setActionType("reject");
    setIsRejectionDialogOpen(true);
  };

  const handleEscalate = (request: typeof pendingRequests[0]) => {
    setSelectedRequest(request);
    setActionType("escalate");
    // Handle escalation logic
    console.log("Escalating request:", request.id);
  };

  const handleRowClick = (request: typeof pendingRequests[0]) => {
    setSelectedRequest(request);
    setIsDetailsPanelOpen(true);
  };

  const confirmApproval = () => {
    console.log("Approving request:", selectedRequest?.id);
    setIsApprovalDialogOpen(false);
    setSelectedRequest(null);
  };

  const confirmRejection = () => {
    console.log("Rejecting request:", selectedRequest?.id, "Reason:", rejectionReason);
    setIsRejectionDialogOpen(false);
    setRejectionReason("");
    setSelectedRequest(null);
  };

  const exportPendingList = () => {
    console.log("Exporting pending requests list");
  };

  const generateSummaryReport = () => {
    console.log("Generating summary report");
  };

  const totalPending = pendingRequests.length;
  const approvedThisMonth = 12; // Mock data
  const rejectedThisMonth = 3; // Mock data
  const escalatedCount = 2; // Mock data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Pending Excuse Requests</h1>
        <p className="text-muted-foreground">
          Manage and review all pending requests from academic staff
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-yellow-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{totalPending}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting review
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-green-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved This Month</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedThisMonth}</div>
            <p className="text-xs text-muted-foreground">
              Successfully processed
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-red-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected This Month</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedThisMonth}</div>
            <p className="text-xs text-muted-foreground">
              Not approved
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-purple-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Escalated</CardTitle>
            <ArrowUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{escalatedCount}</div>
            <p className="text-xs text-muted-foreground">
              Sent to Academic Affairs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <div>
              <CardTitle>Pending Requests</CardTitle>
              <CardDescription>Review and manage pending excuse requests</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={exportPendingList} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export List
              </Button>
              <Button onClick={generateSummaryReport} variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Summary Report
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-6 grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search staff..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Select value={filterDepartment} onValueChange={setFilterDepartment}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="Computer Science">Computer Science</SelectItem>
                <SelectItem value="Mathematics">Mathematics</SelectItem>
                <SelectItem value="Physics">Physics</SelectItem>
                <SelectItem value="Engineering">Engineering</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Leave Request">Leave Request</SelectItem>
                <SelectItem value="Salary Increase">Salary Increase</SelectItem>
                <SelectItem value="Make-Up Lecture">Make-Up Lecture</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Date Range
            </Button>
          </div>

          {/* Requests Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request ID</TableHead>
                  <TableHead>Staff Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Request Type</TableHead>
                  <TableHead>Submitted Date</TableHead>
                  <TableHead>Urgency</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow 
                    key={request.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleRowClick(request)}
                  >
                    <TableCell className="font-medium">{request.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{request.staffName}</div>
                          <div className="text-sm text-muted-foreground">{request.rank}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        {request.department}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(request.requestType)}>
                        {request.requestType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {request.submittedDate}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getUrgencyColor(request.urgency)}>
                        {request.urgency.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApprove(request);
                          }}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReject(request);
                          }}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEscalate(request);
                          }}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Request Details Panel */}
      <Dialog open={isDetailsPanelOpen} onOpenChange={setIsDetailsPanelOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Request Details - {selectedRequest?.id}</DialogTitle>
            <DialogDescription>
              Review complete information for this excuse request
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-6">
              {/* Staff Bio Card */}
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold">{selectedRequest.staffName}</h3>
                      <p className="text-muted-foreground">{selectedRequest.rank} • {selectedRequest.department}</p>
                      <div className="mt-2 grid gap-1 text-sm">
                        <div>Email: {selectedRequest.email}</div>
                        <div>Phone: {selectedRequest.phone}</div>
                        <div>Students: {selectedRequest.studentCount}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Request Information */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Request Type</Label>
                  <Badge className={cn("mt-1", getTypeColor(selectedRequest.requestType))}>
                    {selectedRequest.requestType}
                  </Badge>
                </div>
                <div>
                  <Label>Urgency</Label>
                  <Badge className={cn("mt-1", getUrgencyColor(selectedRequest.urgency))}>
                    {selectedRequest.urgency.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <Label>Submitted Date</Label>
                  <Input value={selectedRequest.submittedDate} readOnly className="mt-1" />
                </div>
                {selectedRequest.originalDate && (
                  <div>
                    <Label>Original Date</Label>
                    <Input value={selectedRequest.originalDate} readOnly className="mt-1" />
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <Label>Detailed Description</Label>
                <Textarea 
                  value={selectedRequest.description} 
                  readOnly 
                  className="mt-1 min-h-[100px]"
                />
              </div>

              {/* Reason */}
              <div>
                <Label>Reason</Label>
                <Input value={selectedRequest.reason} readOnly className="mt-1" />
              </div>

              {/* Attachments */}
              {selectedRequest.attachments.length > 0 && (
                <div>
                  <Label>Attachments</Label>
                  <div className="mt-2 space-y-2">
                    {selectedRequest.attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{attachment}</span>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button 
                  onClick={() => handleApprove(selectedRequest)}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button 
                  onClick={() => handleReject(selectedRequest)}
                  variant="destructive"
                  className="flex-1"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button 
                  onClick={() => handleEscalate(selectedRequest)}
                  variant="outline"
                  className="flex-1"
                >
                  <ArrowUp className="h-4 w-4 mr-2" />
                  Escalate to Academic Affairs
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Request</DialogTitle>
            <DialogDescription>
              Confirm approval of {selectedRequest?.id} - {selectedRequest?.staffName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p>Are you sure you want to approve this request? This action will:</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Mark the request as approved</li>
              <li>Send notification to the staff member</li>
              <li>Log the action in the audit trail</li>
            </ul>
            <div className="flex gap-3">
              <Button onClick={confirmApproval} className="flex-1 bg-green-600 hover:bg-green-700">
                Confirm Approval
              </Button>
              <Button onClick={() => setIsApprovalDialogOpen(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={isRejectionDialogOpen} onOpenChange={setIsRejectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Request</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting {selectedRequest?.id} - {selectedRequest?.staffName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Rejection Reason *</Label>
              <Textarea 
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a detailed reason for rejection..."
                className="mt-1 min-h-[100px]"
              />
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={confirmRejection} 
                variant="destructive"
                className="flex-1"
                disabled={!rejectionReason.trim()}
              >
                Confirm Rejection
              </Button>
              <Button onClick={() => setIsRejectionDialogOpen(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}