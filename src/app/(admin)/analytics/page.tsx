'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];

// Dummy data for top questions
const questionData = [
  { question: 'What is the price?', count: 25 },
  { question: 'How do I buy?', count: 18 },
  { question: 'Where are you located?', count: 15 },
  { question: 'What are your working hours?', count: 12 },
  { question: 'How do I reset my password?', count: 10 },
  { question: 'Where can I find my invoice?', count: 8 },
  { question: 'Do you offer discounts?', count: 7 },
  { question: 'Can I return a product?', count: 6 },
  { question: 'Is shipping free?', count: 5 },
  { question: 'When will my order arrive?', count: 4 }
];

// Dummy data for chatbot distribution
const chatbotData = [
  { name: 'SalesBot', value: 60 },
  { name: 'SupportBot', value: 40 },
  { name: 'InfoBot', value: 25 },
  { name: 'HelpBot', value: 15 }
];

export default function AnalyticsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
        <p className="text-muted-foreground">Dummy data preview of chatbot analytics</p>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Questions Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Most Frequently Asked Questions</CardTitle>
            <CardDescription>Dummy data (Top 10 questions)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={questionData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis 
                  type="category" 
                  dataKey="question" 
                  width={150}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip formatter={(value: number) => [`${value}`, 'Count']} />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Chatbot Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Message Distribution by Chatbot</CardTitle>
            <CardDescription>Dummy data (Chatbot activity share)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={chatbotData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chatbotData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
