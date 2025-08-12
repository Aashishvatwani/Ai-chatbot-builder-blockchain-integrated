'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@apollo/client';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GET_USER_CHATPODS, GET_CHATPODS_BY_ID } from '../../../../graphql/queries/queries';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { 
  MessageCircle, 
  TrendingUp, 
  Bot, 
  Hash, 
  Calendar,
  Users,
  Star,
  Package,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Filter,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender: string;
}

interface ChatSession {
  id: string;
  messages: Message[];
  created_at: string;
  guest_id: string;
}

interface Chatbot {
  id: string;
  name: string;
  created_at: string;
  chat_sessions: ChatSession[];
}

interface QuestionAnalysis {
  question: string;
  count: number;
  percentage: number;
  lastAsked: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  isProductRelated: boolean;
}

interface ProductMention {
  product: string;
  count: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  mentionType: 'inquiry' | 'complaint' | 'praise' | 'feature_request';
  lastMentioned: string;
}

interface TimeSeriesData {
  date: string;
  questions: number;
  productMentions: number;
}

interface CategoryData {
  category: string;
  count: number;
  percentage: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];

const PRODUCT_KEYWORDS = [
  'product', 'item', 'laptop', 'phone', 'computer', 'software', 'app', 'service',
  'feature', 'tool', 'solution', 'package', 'plan', 'subscription', 'device'
];

const QUESTION_CATEGORIES = {
  'Product Inquiry': ['product', 'item', 'buy', 'purchase', 'price', 'cost', 'available', 'stock'],
  'Support Request': ['help', 'support', 'problem', 'issue', 'error', 'bug', 'not working', 'broken'],
  'Pricing Information': ['price', 'cost', 'expensive', 'cheap', 'discount', 'deal', 'offer'],
  'Feature Request': ['feature', 'improve', 'add', 'wish', 'would like', 'suggestion'],
  'Shipping Information': ['shipping', 'delivery', 'ship', 'arrive', 'tracking', 'when'],
  'General Information': ['about', 'company', 'who', 'what is', 'how does', 'information'],
  'Comparison': ['compare', 'vs', 'versus', 'difference', 'better', 'best', 'alternative'],
  'Complaint': ['complain', 'unhappy', 'disappointed', 'bad', 'terrible', 'awful']
};

export default function ChatbotAnalyticsDashboard() {
  const { user } = useUser();
  const [selectedChatbotId, setSelectedChatbotId] = useState<string>('');
  const [questionAnalysis, setQuestionAnalysis] = useState<QuestionAnalysis[]>([]);
  const [productMentions, setProductMentions] = useState<ProductMention[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [totalStats, setTotalStats] = useState({
    totalQuestions: 0,
    totalSessions: 0,
    avgQuestionsPerSession: 0,
    productInquiries: 0,
    positivesentiment: 0,
    negativesentiment: 0
  });
  const [dateRange, setDateRange] = useState('30'); // days
  const [viewType, setViewType] = useState<'questions' | 'products' | 'trends'>('questions');

  // Fetch user's chatbots
  const { data: chatbotsData, loading: chatbotsLoading } = useQuery(GET_USER_CHATPODS, {
    variables: { userId: user?.id },
    skip: !user?.id,
  });

  // Fetch specific chatbot data
  const { data: chatbotData, loading: chatbotLoading, refetch: refetchChatbot } = useQuery(GET_CHATPODS_BY_ID, {
    variables: { id: parseInt(selectedChatbotId) },
    skip: !selectedChatbotId,
  });

  // Auto-select first chatbot if none selected
  useEffect(() => {
    if (chatbotsData?.chatbots?.length > 0 && !selectedChatbotId) {
      setSelectedChatbotId(chatbotsData.chatbots[0].id);
    }
  }, [chatbotsData, selectedChatbotId]);

  // Analyze data when chatbot data changes
  useEffect(() => {
    if (chatbotData?.chatbots?.[0]) {
      analyzeSpecificChatbot(chatbotData.chatbots[0]);
    }
  }, [chatbotData, dateRange]);

  const analyzeSpecificChatbot = (chatbot: Chatbot) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(dateRange));

    // Filter messages by date range and only include user/guest messages
    const allMessages: (Message & { sessionId: string; sessionDate: string })[] = [];
    
    chatbot.chat_sessions.forEach(session => {
      const sessionDate = new Date(session.created_at);
      if (sessionDate >= cutoffDate) {
        session.messages.forEach(message => {
          if (message.sender === 'user' || message.sender === 'guest') {
            const messageDate = new Date(message.created_at);
            if (messageDate >= cutoffDate) {
              allMessages.push({
                ...message,
                sessionId: session.id,
                sessionDate: session.created_at
              });
            }
          }
        });
      }
    });

    // Analyze questions
    const questionMap = new Map<string, {
      count: number;
      lastAsked: string;
      sentiment: 'positive' | 'negative' | 'neutral';
      isProductRelated: boolean;
      originalMessages: string[];
    }>();

    // Analyze product mentions
    const productMap = new Map<string, {
      count: number;
      sentiment: 'positive' | 'negative' | 'neutral';
      mentionType: 'inquiry' | 'complaint' | 'praise' | 'feature_request';
      lastMentioned: string;
      contexts: string[];
    }>();

    // Category analysis
    const categoryMap = new Map<string, number>();

    allMessages.forEach(message => {
      const content = message.content.toLowerCase().trim();
      
      if (content.length < 3) return;

      // Normalize question for grouping
      const normalizedQuestion = normalizeQuestion(content);
      
      // Analyze sentiment
      const sentiment = analyzeSentiment(content);
      
      // Check if product-related
      const isProductRelated = PRODUCT_KEYWORDS.some(keyword => 
        content.includes(keyword.toLowerCase())
      );

      // Categorize question
      let category = 'General Information';
      for (const [cat, keywords] of Object.entries(QUESTION_CATEGORIES)) {
        if (keywords.some(keyword => content.includes(keyword))) {
          category = cat;
          break;
        }
      }
      
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);

      // Group similar questions
      if (questionMap.has(normalizedQuestion)) {
        const existing = questionMap.get(normalizedQuestion)!;
        existing.count++;
        existing.lastAsked = message.created_at;
        existing.originalMessages.push(message.content);
      } else {
        questionMap.set(normalizedQuestion, {
          count: 1,
          lastAsked: message.created_at,
          sentiment,
          isProductRelated,
          originalMessages: [message.content]
        });
      }

      // Extract product mentions
      if (isProductRelated) {
        PRODUCT_KEYWORDS.forEach(product => {
          if (content.includes(product.toLowerCase())) {
            const mentionType = determineMentionType(content);
            
            if (productMap.has(product)) {
              const existing = productMap.get(product)!;
              existing.count++;
              existing.lastMentioned = message.created_at;
              existing.contexts.push(message.content);
            } else {
              productMap.set(product, {
                count: 1,
                sentiment,
                mentionType,
                lastMentioned: message.created_at,
                contexts: [message.content]
              });
            }
          }
        });
      }
    });

    // Convert to arrays and sort
    const questionsArray: QuestionAnalysis[] = Array.from(questionMap.entries())
      .map(([question, data]) => ({
        question: data.originalMessages[0], // Use original message instead of normalized
        count: data.count,
        percentage: Math.round((data.count / allMessages.length) * 100 * 100) / 100,
        lastAsked: data.lastAsked,
        sentiment: data.sentiment,
        isProductRelated: data.isProductRelated
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    const productsArray: ProductMention[] = Array.from(productMap.entries())
      .map(([product, data]) => ({
        product,
        count: data.count,
        sentiment: data.sentiment,
        mentionType: data.mentionType,
        lastMentioned: data.lastMentioned
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    const categoriesArray: CategoryData[] = Array.from(categoryMap.entries())
      .map(([category, count]) => ({
        category,
        count,
        percentage: Math.round((count / allMessages.length) * 100 * 100) / 100
      }))
      .sort((a, b) => b.count - a.count);

    // Generate time series data
    const timeSeriesMap = new Map<string, { questions: number; productMentions: number }>();
    
    allMessages.forEach(message => {
      const date = new Date(message.created_at).toDateString();
      const isProductRelated = PRODUCT_KEYWORDS.some(keyword => 
        message.content.toLowerCase().includes(keyword.toLowerCase())
      );
      
      if (timeSeriesMap.has(date)) {
        const existing = timeSeriesMap.get(date)!;
        existing.questions++;
        if (isProductRelated) existing.productMentions++;
      } else {
        timeSeriesMap.set(date, {
          questions: 1,
          productMentions: isProductRelated ? 1 : 0
        });
      }
    });

    const timeSeriesArray: TimeSeriesData[] = Array.from(timeSeriesMap.entries())
      .map(([date, data]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        questions: data.questions,
        productMentions: data.productMentions
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate stats
    const filteredSessions = chatbot.chat_sessions.filter(session => 
      new Date(session.created_at) >= cutoffDate
    );
    
    const positiveCount = questionsArray.filter(q => q.sentiment === 'positive').length;
    const negativeCount = questionsArray.filter(q => q.sentiment === 'negative').length;

    setQuestionAnalysis(questionsArray);
    setProductMentions(productsArray);
    setTimeSeriesData(timeSeriesArray);
    setCategoryData(categoriesArray);
    setTotalStats({
      totalQuestions: allMessages.length,
      totalSessions: filteredSessions.length,
      avgQuestionsPerSession: filteredSessions.length > 0 ? 
        Math.round((allMessages.length / filteredSessions.length) * 100) / 100 : 0,
      productInquiries: productsArray.reduce((sum, p) => sum + p.count, 0),
      positivesentiment: Math.round((positiveCount / questionsArray.length) * 100) || 0,
      negativesentiment: Math.round((negativeCount / questionsArray.length) * 100) || 0
    });
  };

  const normalizeQuestion = (question: string): string => {
    return question
      .toLowerCase()
      .replace(/[?!.,]/g, '')
      .replace(/\b(what|how|when|where|why|who|can|could|would|will|is|are|do|does|did)\b/g, '')
      .trim()
      .substring(0, 50);
  };

  const analyzeSentiment = (text: string): 'positive' | 'negative' | 'neutral' => {
    const positiveWords = ['good', 'great', 'excellent', 'love', 'amazing', 'perfect', 'awesome'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'worst', 'problem', 'issue', 'broken'];
    
    const hasPositive = positiveWords.some(word => text.includes(word));
    const hasNegative = negativeWords.some(word => text.includes(word));
    
    if (hasPositive && !hasNegative) return 'positive';
    if (hasNegative && !hasPositive) return 'negative';
    return 'neutral';
  };

  const determineMentionType = (text: string): 'inquiry' | 'complaint' | 'praise' | 'feature_request' => {
    if (text.includes('complain') || text.includes('problem') || text.includes('issue')) return 'complaint';
    if (text.includes('love') || text.includes('great') || text.includes('excellent')) return 'praise';
    if (text.includes('feature') || text.includes('improve') || text.includes('add')) return 'feature_request';
    return 'inquiry';
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-500';
      case 'negative': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <ThumbsUp className="h-4 w-4" />;
      case 'negative': return <ThumbsDown className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (chatbotsLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (!chatbotsData?.chatbots?.length) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-600 mb-2">No Chatbots Found</h2>
              <p className="text-gray-500">Create a chatbot first to view analytics.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Chatbot Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          Analyze questions and product inquiries for specific chatbots
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            <Select value={selectedChatbotId} onValueChange={setSelectedChatbotId}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select a chatbot" />
              </SelectTrigger>
              <SelectContent>
                {chatbotsData.chatbots.map((chatbot: Chatbot) => (
                  <SelectItem key={chatbot.id} value={chatbot.id}>
                    {chatbot.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant={viewType === 'questions' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewType('questions')}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Questions
          </Button>
          <Button
            variant={viewType === 'products' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewType('products')}
          >
            <Package className="h-4 w-4 mr-2" />
            Products
          </Button>
          <Button
            variant={viewType === 'trends' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewType('trends')}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Trends
          </Button>
        </div>
      </div>

      {chatbotLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalStats.totalQuestions.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  in {totalStats.totalSessions} sessions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Product Inquiries</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalStats.productInquiries}</div>
                <p className="text-xs text-muted-foreground">
                  {totalStats.totalQuestions > 0 ? 
                    Math.round((totalStats.productInquiries / totalStats.totalQuestions) * 100) : 0
                  }% of questions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Questions/Session</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalStats.avgQuestionsPerSession}</div>
                <p className="text-xs text-muted-foreground">questions per chat session</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sentiment</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="text-sm font-bold text-green-600">
                    {totalStats.positivesentiment}%
                  </div>
                  <div className="text-xs text-muted-foreground">/</div>
                  <div className="text-sm font-bold text-red-600">
                    {totalStats.negativesentiment}%
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">positive / negative</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          {viewType === 'questions' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Questions */}
              <Card>
                <CardHeader>
                  <CardTitle>Most Asked Questions</CardTitle>
                  <CardDescription>
                    Top questions for this specific chatbot
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={questionAnalysis.slice(0, 10)} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis 
                        type="category" 
                        dataKey="question" 
                        width={150}
                        tick={{ fontSize: 10 }}
                      />
                      <Tooltip 
                        formatter={(value: number) => [value, 'Count']}
                        labelFormatter={(label: string) => `"${label.slice(0, 50)}..."`}
                      />
                      <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Question Categories */}
              <Card>
                <CardHeader>
                  <CardTitle>Question Categories</CardTitle>
                  <CardDescription>
                    Distribution of question types
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ category, percentage }) => `${category}: ${percentage}%`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          {viewType === 'products' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Product Mentions */}
              <Card>
                <CardHeader>
                  <CardTitle>Most Mentioned Products</CardTitle>
                  <CardDescription>
                    Products customers are asking about
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={productMentions.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="product" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#00C49F" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Product Insights List */}
              <Card>
                <CardHeader>
                  <CardTitle>Product Insights</CardTitle>
                  <CardDescription>
                    Detailed product mention analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {productMentions.map((product, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium capitalize">{product.product}</h4>
                            <Badge variant="outline" className="text-xs capitalize">
                              {product.mentionType.replace('_', ' ')}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className={`w-2 h-2 rounded-full ${getSentimentColor(product.sentiment)}`} />
                            <span className="text-xs text-gray-500 capitalize">
                              {product.sentiment} sentiment
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">{product.count}</div>
                          <div className="text-xs text-gray-500">mentions</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {viewType === 'trends' && (
            <div className="space-y-6">
              {/* Time Series Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Question & Product Mention Trends</CardTitle>
                  <CardDescription>
                    Daily trends over the selected period
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={timeSeriesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="questions" 
                        stackId="1"
                        stroke="#8884d8" 
                        fill="#8884d8" 
                        name="Questions"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="productMentions" 
                        stackId="1"
                        stroke="#00C49F" 
                        fill="#00C49F" 
                        name="Product Mentions"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Detailed Questions List */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Questions Analysis</CardTitle>
              <CardDescription>
                Detailed breakdown of questions with sentiment and context
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {questionAnalysis.slice(0, 15).map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.question}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs text-white ${getSentimentColor(item.sentiment)}`}>
                          {getSentimentIcon(item.sentiment)}
                          <span className="capitalize">{item.sentiment}</span>
                        </div>
                        {item.isProductRelated && (
                          <Badge variant="secondary" className="text-xs">
                            <Package className="h-3 w-3 mr-1" />
                            Product Related
                          </Badge>
                        )}
                        <span className="text-xs text-gray-500">
                          Last asked: {new Date(item.lastAsked).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-lg font-bold">{item.count}</div>
                      <div className="text-xs text-gray-500">{item.percentage}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
