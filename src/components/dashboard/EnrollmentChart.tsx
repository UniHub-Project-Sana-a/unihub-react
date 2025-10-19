import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { month: "يناير", students: 2400, instructors: 240 },
  { month: "فبراير", students: 2210, instructors: 198 },
  { month: "مارس", students: 2290, instructors: 220 },
  { month: "أبريل", students: 2000, instructors: 208 },
  { month: "مايو", students: 2181, instructors: 189 },
  { month: "يونيو", students: 2500, instructors: 250 },
  { month: "يوليو", students: 2847, instructors: 287 }
];

export function EnrollmentChart() {
  return (
    <Card className="shadow-xl bg-white">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">اتجاهات التسجيل</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" stroke="#666" />
            <YAxis stroke="#666" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
              }} 
            />
            <Area 
              type="monotone" 
              dataKey="students" 
              stackId="1" 
              stroke="#3b82f6" 
              fill="url(#studentsGradient)" 
            />
            <Area 
              type="monotone" 
              dataKey="instructors" 
              stackId="1" 
              stroke="#10b981" 
              fill="url(#instructorsGradient)" 
            />
            <defs>
              <linearGradient id="studentsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="instructorsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}