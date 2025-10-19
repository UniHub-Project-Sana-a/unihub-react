import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { name: "Dr. Smith", sessions: 24, maxCapacity: 30 },
  { name: "Prof. Johnson", sessions: 28, maxCapacity: 30 },
  { name: "Dr. Ahmed", sessions: 22, maxCapacity: 30 },
  { name: "Prof. Garcia", sessions: 26, maxCapacity: 30 },
  { name: "Dr. Chen", sessions: 20, maxCapacity: 30 },
  { name: "Prof. Wilson", sessions: 25, maxCapacity: 30 }
];

export function InstructorWorkload() {
  return (
    <Card className="shadow-xl bg-white">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">عبء التدريس للمحاضرين</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" stroke="#666" />
            <YAxis stroke="#666" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
              }} 
            />
            <Bar dataKey="sessions" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="maxCapacity" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}