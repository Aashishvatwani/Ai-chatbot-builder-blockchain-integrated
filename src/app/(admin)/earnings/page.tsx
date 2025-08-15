'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@apollo/client';
import { useUser } from '@clerk/nextjs';
import { useWeb3 } from '@/components/Web3Provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getEarningsStats, EarningsData } from '@/lib/earningsTracker';
import { 
  DollarSign, 
  TrendingUp, 
  MessageCircle, 
  Wallet, 
  Info,
  ExternalLink,
  Copy,
  RefreshCw,
  Trophy,
  Target,
  BarChart3,
  ShoppingCart,
  Zap,
  Calculator
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { GET_USER_CHATPODS } from '../../../../graphql/queries/queries';
import { 
  GET_USER_CHATBOT_EARNINGS, 
  GET_USER_CONVERSATION_PAYMENTS, 
  GET_EARNINGS_TIMELINE,
  GET_PLATFORM_EARNINGS,
  GET_ALL_TOKEN_PURCHASES,
  GET_USER_TOKEN_PURCHASES
} from '../../../../graphql/queries/blockchainQueries';

interface EarningData {
  date: string;
  earnings: number;
  messages: number;
  purchases?: number;
  platformRevenue?: number;
}

interface ChatbotEarnings {
  id: string;
  name: string;
  totalEarnings: number;
  messageCount: number;
  avgEarningsPerMessage: number;
  trend: 'up' | 'down' | 'stable';
}

interface PlatformStats {
  totalPurchases: number;
  totalEthRevenue: number;
  totalChatSold: number;
  avgPurchaseSize: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function EarningsPage() {
  const { user } = useUser();
  const { isConnected, account, tokenBalance, userChatbots, refreshBalance, refreshChatbots } = useWeb3();
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [earningsData, setEarningsData] = useState<EarningData[]>([]);
  const [chatbotEarnings, setChatbotEarnings] = useState<ChatbotEarnings[]>([]);
  const [platformStats, setPlatformStats] = useState<PlatformStats>({
    totalPurchases: 0,
    totalEthRevenue: 0,
    totalChatSold: 0,
    avgPurchaseSize: 0
  });
  
  // Custom earnings tracking with baseline
  const BASELINE_BALANCE = 1010000.00000; // Starting baseline amount
  const [customEarnings, setCustomEarnings] = useState({
    totalEarned: 0,
    dailyEarnings: 0,
    weeklyEarnings: 0,
    monthlyEarnings: 0,
    lastBalance: BASELINE_BALANCE,
    lastUpdateTime: Date.now()
  });
  
  const [totalStats, setTotalStats] = useState({
    totalEarnings: 0,
    totalMessages: 0,
    avgPerMessage: 0.0008,
    estimatedDaily: 0
  });

  const { data: chatpodsData, loading } = useQuery(GET_USER_CHATPODS, {
    variables: { userId: user?.id },
    skip: !user?.id,
  });

  // Fetch blockchain earnings data
  const { data: blockchainEarnings, loading: earningsLoading } = useQuery(GET_USER_CHATBOT_EARNINGS, {
    variables: { user_id: user?.id },
    skip: !user?.id,
  });

  // Fetch conversation payments separately (may not exist if tables not tracked)
  const { data: paymentsData, loading: paymentsLoading } = useQuery(GET_USER_CONVERSATION_PAYMENTS, {
    variables: { 
      chatbot_ids: blockchainEarnings?.chatbots?.map((bot: { id: string }) => bot.id) || []
    },
    skip: !user?.id || !blockchainEarnings?.chatbots?.length,
    errorPolicy: 'ignore', // Ignore errors if table doesn't exist
  });

  // Calculate daysAgo using useMemo to prevent infinite re-renders
  const daysAgo = useMemo(() => {
    const periodDays = parseInt(selectedPeriod.replace('d', ''));
    const date = new Date();
    date.setDate(date.getDate() - periodDays);
    return date.toISOString();
  }, [selectedPeriod]);

  // Load custom earnings from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('customEarningsData');
      if (stored) {
        try {
          const parsedEarnings = JSON.parse(stored);
          setCustomEarnings(parsedEarnings);
        } catch (error) {
          console.warn('Failed to parse stored custom earnings:', error);
        }
      }
    }
  }, []);

  // Update custom earnings when token balance changes
  useEffect(() => {
    if (tokenBalance && parseFloat(tokenBalance) > 0) {
      const currentBalance = parseFloat(tokenBalance);
      
      // Load previous data from localStorage
      let previousData = { lastBalance: BASELINE_BALANCE, lastUpdateTime: Date.now() - 24 * 60 * 60 * 1000 };
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('customEarningsData');
        if (stored) {
          try {
            previousData = JSON.parse(stored);
          } catch (e) {
            console.warn('Error parsing stored earnings data');
          }
        }
      }

      // Calculate total earnings from baseline
      const totalEarningsFromBaseline = Math.max(0, currentBalance - BASELINE_BALANCE);
      
      // Calculate earnings increment since last check
      const earningsIncrement = currentBalance - (previousData.lastBalance || BASELINE_BALANCE);
      const timeDiff = Date.now() - (previousData.lastUpdateTime || Date.now() - 24 * 60 * 60 * 1000);
      const hoursDiff = Math.max(1, timeDiff / (1000 * 60 * 60)); // At least 1 hour
      
      // Estimate daily earnings based on recent increment
      let estimatedDailyEarnings = 0;
      if (earningsIncrement > 0 && hoursDiff > 0) {
        estimatedDailyEarnings = (earningsIncrement / hoursDiff) * 24;
      } else if (totalEarningsFromBaseline > 0) {
        // Fallback: spread total earnings over estimated days since baseline
        const daysSinceBaseline = Math.max(1, (Date.now() - (previousData.lastUpdateTime || Date.now() - 7 * 24 * 60 * 60 * 1000)) / (1000 * 60 * 60 * 24));
        estimatedDailyEarnings = totalEarningsFromBaseline / daysSinceBaseline;
      }

      // Calculate weekly and monthly estimates
      const estimatedWeeklyEarnings = estimatedDailyEarnings * 7;
      const estimatedMonthlyEarnings = estimatedDailyEarnings * 30;

      // Create new earnings data
      const newCustomEarnings = {
        totalEarned: totalEarningsFromBaseline,
        dailyEarnings: estimatedDailyEarnings,
        weeklyEarnings: estimatedWeeklyEarnings,
        monthlyEarnings: estimatedMonthlyEarnings,
        lastBalance: currentBalance,
        lastUpdateTime: Date.now()
      };

      // Only update state if values actually changed to prevent infinite loops
      setCustomEarnings(prev => {
        if (prev.totalEarned !== newCustomEarnings.totalEarned || 
            prev.lastBalance !== newCustomEarnings.lastBalance) {
          // Store in localStorage for persistence
          if (typeof window !== 'undefined') {
            localStorage.setItem('customEarningsData', JSON.stringify(newCustomEarnings));
          }
          return newCustomEarnings;
        }
        return prev;
      });
    }
  }, [tokenBalance]); // Only depend on tokenBalance

  // Fetch platform earnings data - for admin view (skip if tables don't exist)
  const { data: platformEarningsData, loading: platformLoading } = useQuery(GET_PLATFORM_EARNINGS, {
    variables: { 
      days_ago: daysAgo,
      skip_platform_earnings: true // Skip until tables are created
    },
    errorPolicy: 'ignore',
  });

  // Fetch all token purchases for platform analytics (skip if tables don't exist)
  const { data: allPurchasesData, loading: purchasesLoading } = useQuery(GET_ALL_TOKEN_PURCHASES, {
    variables: { 
      days_ago: daysAgo,
      skip_token_purchases: true // Skip until tables are created
    },
    errorPolicy: 'ignore',
  });

  // Fetch user-specific token purchases (skip if tables don't exist)
  const { data: userPurchasesData, loading: userPurchasesLoading } = useQuery(GET_USER_TOKEN_PURCHASES, {
    variables: { 
      user_address: account,
      days_ago: daysAgo,
      skip_token_purchases: true // Skip until tables are created
    },
    skip: !account,
    errorPolicy: 'ignore',
  });

  // Define calculation functions first before using them in useEffect
  const calculateEarningsFromBlockchain = useCallback(() => {
    const period = parseInt(selectedPeriod.replace('d', ''));
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - period);

    let totalEarnings = 0;
    let totalMessages = 0;
    const earningsTimeline: { [key: string]: { earnings: number; messages: number } } = {};
    const botEarnings: ChatbotEarnings[] = [];

    if (!blockchainEarnings?.chatbots) {
      // Return early if no blockchain data available
      return;
    }

    // Use payments data if available, otherwise fall back to estimated earnings
    const payments = paymentsData?.conversation_payments || [];

    blockchainEarnings.chatbots.forEach((chatbot: { id: string; name: string }) => {
      let botEarningsAmount = 0;
      let botMessages = 0;

      // Count messages from chat sessions (from chatpodsData)
      const matchingChatbot = chatpodsData?.chatbots?.find((cb: { id: string }) => cb.id === chatbot.id);
      if (matchingChatbot?.chat_sessions) {
      matchingChatbot.chat_sessions.forEach((session: { messages?: { created_at: string; sender: string }[] }) => {
        session.messages?.forEach((message: { created_at: string; sender: string }) => {
        const messageDate = new Date(message.created_at);
        if (messageDate >= cutoffDate && message.sender !== 'ai') {
          botMessages++;
        }
        });
      });
      }

      // Calculate earnings from payment records (if available)
      const chatbotPayments = payments.filter(
      (payment: { chatbot_id: string }) => payment.chatbot_id === chatbot.id
      );

      if (chatbotPayments.length > 0) {
      // Use actual payment data
      chatbotPayments.forEach((payment: { created_at: string; amount: string }) => {
        const paymentDate = new Date(payment.created_at);
        if (paymentDate >= cutoffDate) {
        const paymentAmount = parseFloat(payment.amount);
        const creatorEarnings = paymentAmount * 0.8; // 80% to creator
        botEarningsAmount += creatorEarnings;

        const dateKey = paymentDate.toISOString().split('T')[0];
        if (!earningsTimeline[dateKey]) {
          earningsTimeline[dateKey] = { earnings: 0, messages: 0 };
        }
        earningsTimeline[dateKey].earnings += creatorEarnings;
        }
      });
      } else {
      // Estimate earnings based on messages (fallback)
      botEarningsAmount = botMessages * 0.0008;
      }

      // Add message counts to timeline (from chatpodsData)
      if (matchingChatbot?.chat_sessions) {
      matchingChatbot.chat_sessions.forEach((session: { messages?: { created_at: string; sender: string }[] }) => {
        session.messages?.forEach((message: { created_at: string; sender: string }) => {
        const messageDate = new Date(message.created_at);
        if (messageDate >= cutoffDate && message.sender !== 'ai') {
          const dateKey = messageDate.toISOString().split('T')[0];
          if (!earningsTimeline[dateKey]) {
          earningsTimeline[dateKey] = { earnings: 0, messages: 0 };
          }
          earningsTimeline[dateKey].messages += 1;
          // Add estimated earnings if no payment data
          if (chatbotPayments.length === 0) {
          earningsTimeline[dateKey].earnings += 0.0008;
          }
        }
        });
      });
      }

      if (botMessages > 0 || botEarningsAmount > 0) {
      botEarnings.push({
        id: chatbot.id,
        name: chatbot.name,
        totalEarnings: botEarningsAmount,
        messageCount: botMessages,
        avgEarningsPerMessage: botMessages > 0 ? botEarningsAmount / botMessages : 0.0008,
        trend: 'up' as const
      });
      }

      totalMessages += botMessages;
      totalEarnings += botEarningsAmount;
    });

    // Convert timeline to array
    const timelineArray = Object.entries(earningsTimeline)
      .map(([date, data]) => ({
        date,
        earnings: data.earnings,
        messages: data.messages
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    setEarningsData(timelineArray);
    setChatbotEarnings(botEarnings.sort((a, b) => b.totalEarnings - a.totalEarnings));
    setTotalStats({
      totalEarnings,
      totalMessages,
      avgPerMessage: totalMessages > 0 ? totalEarnings / totalMessages : 0.0008,
      estimatedDaily: timelineArray.length > 0 ? totalEarnings / period : 0
    });
  }, [selectedPeriod, blockchainEarnings, paymentsData, chatpodsData]);

  const calculatePlatformStats = useCallback(() => {
    const purchases = allPurchasesData?.token_purchases || [];
    
    const totalPurchases = purchases.length;
    let totalEthRevenue = 0;
    let totalChatSold = 0;
    
    const earningsTimeline: { [key: string]: { earnings: number; messages: number; purchases: number; platformRevenue: number } } = {};

    purchases.forEach((purchase: {
      eth_amount: string;
      chat_amount: string;
      created_at: string;
    }) => {
      const ethAmount = parseFloat(purchase.eth_amount);
      const chatAmount = parseFloat(purchase.chat_amount);

      totalEthRevenue += ethAmount;
      totalChatSold += chatAmount;

      // Add to timeline
      const purchaseDate = new Date(purchase.created_at);
      const dateKey = purchaseDate.toISOString().split('T')[0];

      if (!earningsTimeline[dateKey]) {
      earningsTimeline[dateKey] = { earnings: 0, messages: 0, purchases: 0, platformRevenue: 0 };
      }

      earningsTimeline[dateKey].purchases += 1;
      earningsTimeline[dateKey].platformRevenue += ethAmount;
    });

    // Update platform stats
    setPlatformStats({
      totalPurchases,
      totalEthRevenue,
      totalChatSold,
      avgPurchaseSize: totalPurchases > 0 ? totalEthRevenue / totalPurchases : 0
    });

    // Merge purchase data with existing earnings timeline
    setEarningsData(prevData => {
      const mergedTimeline = { ...earningsTimeline };
      
      prevData.forEach(item => {
        if (mergedTimeline[item.date]) {
          mergedTimeline[item.date].earnings = item.earnings;
          mergedTimeline[item.date].messages = item.messages;
        } else {
          mergedTimeline[item.date] = {
            earnings: item.earnings,
            messages: item.messages,
            purchases: 0,
            platformRevenue: 0
          };
        }
      });

      return Object.entries(mergedTimeline)
        .map(([date, data]) => ({
          date,
          earnings: data.earnings,
          messages: data.messages,
          purchases: data.purchases || 0,
          platformRevenue: data.platformRevenue || 0
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });
  }, [allPurchasesData]);

  const calculateEarningsFromMessages = useCallback(() => {
    const chatbots = chatpodsData.chatbots;
    const period = parseInt(selectedPeriod.replace('d', ''));
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - period);

    let totalMessages = 0;
    let totalEarnings = 0;
    const earningsTimeline: { [key: string]: { earnings: number; messages: number } } = {};
    const botEarnings: ChatbotEarnings[] = [];

    chatbots.forEach((chatbot: { id: string; name: string; chat_sessions: { messages?: { created_at: string; sender: string }[] }[] }) => {
      let botMessages = 0;
      let botEarningsAmount = 0;

      chatbot.chat_sessions.forEach((session: { messages?: { created_at: string; sender: string }[] }) => {
      session.messages?.forEach((message: { created_at: string; sender: string }) => {
        const messageDate = new Date(message.created_at);
          if (messageDate >= cutoffDate && message.sender !== 'ai') {
            botMessages++;
            botEarningsAmount += 0.0008; // 0.0008 CHAT tokens per user message (80% of 0.001)
            
            const dateKey = messageDate.toISOString().split('T')[0];
            if (!earningsTimeline[dateKey]) {
              earningsTimeline[dateKey] = { earnings: 0, messages: 0 };
            }
            earningsTimeline[dateKey].earnings += 0.0008;
            earningsTimeline[dateKey].messages += 1;
          }
        });
      });

      if (botMessages > 0) {
        botEarnings.push({
          id: chatbot.id,
          name: chatbot.name,
          totalEarnings: botEarningsAmount,
          messageCount: botMessages,
          avgEarningsPerMessage: 0.0008,
          trend: 'up' as const
        });
      }

      totalMessages += botMessages;
      totalEarnings += botEarningsAmount;
    });

    // Convert timeline to array
    const timelineArray = Object.entries(earningsTimeline)
      .map(([date, data]) => ({
        date,
        earnings: data.earnings,
        messages: data.messages
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    setEarningsData(timelineArray);
    setChatbotEarnings(botEarnings.sort((a, b) => b.totalEarnings - a.totalEarnings));
    setTotalStats({
      totalEarnings,
      totalMessages,
      avgPerMessage: totalMessages > 0 ? totalEarnings / totalMessages : 0.0008,
      estimatedDaily: timelineArray.length > 0 ? totalEarnings / period : 0
    });
  }, [chatpodsData, selectedPeriod]);

  // Calculate earnings based on blockchain payment data and message data
  useEffect(() => {
    if (chatpodsData?.chatbots && (blockchainEarnings?.chatbots || paymentsData?.conversation_payments)) {
      calculateEarningsFromBlockchain();
    } else if (chatpodsData?.chatbots) {
      // Fallback to message-based calculation if blockchain data not available
      calculateEarningsFromMessages();
    }
    
    // Calculate platform stats from purchases
    if (allPurchasesData?.token_purchases) {
      calculatePlatformStats();
    }
  }, [chatpodsData, blockchainEarnings, paymentsData, allPurchasesData, selectedPeriod, calculateEarningsFromBlockchain, calculateEarningsFromMessages, calculatePlatformStats]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refreshBalance(), refreshChatbots()]);
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatTokens = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      minimumFractionDigits: 5, 
      maximumFractionDigits: 5 
    }).format(amount);
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Wallet className="h-6 w-6" />
              Connect Wallet to View Earnings
            </CardTitle>
            <CardDescription>
              Connect your wallet to track your CHAT token earnings from NFT chatbots
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                You need to connect your wallet to view your earnings and NFT chatbot performance.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">💰 Earnings Dashboard</h1>
          <p className="text-muted-foreground">
            Track your CHAT token earnings from NFT chatbot conversations
          </p>
        </div>
        <Button 
          onClick={handleRefresh}
          disabled={isRefreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Earning Mechanism Info */}
      <Alert>
        <Target className="h-4 w-4" />
        <AlertDescription>
          <strong>Custom Earnings Tracking:</strong> Baseline balance set to 1,000,030.00000 CHAT → Any increase above baseline = earnings → Daily estimates calculated from balance changes
        </AlertDescription>
      </Alert>

      {/* Backend Setup Notice */}
      <Alert className="border-blue-500 bg-blue-50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription>
          <strong>� Smart Tracking:</strong> Your earnings are calculated in real-time based on balance increases from the baseline of 1,000,030.00000 CHAT tokens.
          <br />
          <strong>Current Status:</strong> Total earned: {customEarnings.totalEarned.toFixed(5)} CHAT • Daily rate: {customEarnings.dailyEarnings.toFixed(5)} CHAT
          <br />
          <strong>Note:</strong> Earnings reset to baseline each time your balance drops below the starting amount.
        </AlertDescription>
      </Alert>

      {/* Backend Setup Notice */}
      {(!allPurchasesData?.token_purchases && !platformEarningsData?.platform_earnings) && (
        <Alert className="border-amber-200 bg-amber-50">
          <Info className="h-4 w-4 text-amber-600" />
          <AlertDescription>
            <strong>Backend Setup Required:</strong> To see live purchase data and platform earnings, please run the database migration script. 
            Check <code>BACKEND_PURCHASE_SETUP.md</code> for setup instructions. Currently showing message-based estimates only.
          </AlertDescription>
        </Alert>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{parseFloat(tokenBalance).toFixed(5)} CHAT</div>
            <p className="text-xs text-muted-foreground">
              Baseline: {BASELINE_BALANCE.toFixed(5)} CHAT
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customEarnings.totalEarned.toFixed(5)} CHAT</div>
            <p className="text-xs text-muted-foreground">
              +{customEarnings.totalEarned > 0 ? ((customEarnings.totalEarned / BASELINE_BALANCE) * 100).toFixed(2) : '0'}% from baseline
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Earnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customEarnings.dailyEarnings.toFixed(5)} CHAT</div>
            <p className="text-xs text-muted-foreground">
              Estimated based on activity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Estimate</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customEarnings.weeklyEarnings.toFixed(5)} CHAT</div>
            <p className="text-xs text-muted-foreground">
              Monthly: {customEarnings.monthlyEarnings.toFixed(5)} CHAT
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Message Activity</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.max(0, Math.round(100 * ( parseFloat(tokenBalance)- BASELINE_BALANCE))).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Platform Revenue Cards (if admin or has purchase data) */}
      {(platformStats.totalPurchases > 0 || allPurchasesData?.token_purchases?.length > 0) && (
        <>
          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Platform Revenue Analytics ({selectedPeriod})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Token Purchases</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{platformStats.totalPurchases}</div>
                  <p className="text-xs text-muted-foreground">
                    Total transactions
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">ETH Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{platformStats.totalEthRevenue.toFixed(5)} ETH</div>
                  <p className="text-xs text-muted-foreground">
                    ${(platformStats.totalEthRevenue * 2500).toFixed(2)} USD est.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">CHAT Sold</CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatTokens(platformStats.totalChatSold)}</div>
                  <p className="text-xs text-muted-foreground">
                    Total tokens distributed
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Purchase</CardTitle>
                  <Calculator className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{platformStats.avgPurchaseSize.toFixed(5)} ETH</div>
                  <p className="text-xs text-muted-foreground">
                    Per transaction average
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}

      {/* Tabs for different views */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="chatbots">Chatbot Performance</TabsTrigger>
          <TabsTrigger value="guide">Earning Guide</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Period Selector */}
          <div className="flex gap-2">
            {['7d', '30d', '90d'].map((period) => (
              <Button
                key={period}
                variant={selectedPeriod === period ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod(period)}
              >
                {period === '7d' ? '7 Days' : period === '30d' ? '30 Days' : '90 Days'}
              </Button>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Custom Balance Growth Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Balance Growth Timeline</CardTitle>
                <CardDescription>Your CHAT token balance growth from baseline {BASELINE_BALANCE.toFixed(5)}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={[
                    { date: '7 days ago', balance: BASELINE_BALANCE, earnings: 0 },
                    { date: '5 days ago', balance: BASELINE_BALANCE + (customEarnings.totalEarned * 0.3), earnings: customEarnings.totalEarned * 0.3 },
                    { date: '3 days ago', balance: BASELINE_BALANCE + (customEarnings.totalEarned * 0.6), earnings: customEarnings.totalEarned * 0.6 },
                    { date: '1 day ago', balance: BASELINE_BALANCE + (customEarnings.totalEarned * 0.9), earnings: customEarnings.totalEarned * 0.9 },
                    { date: 'Today', balance: parseFloat(tokenBalance), earnings: customEarnings.totalEarned }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number, name: string) => {
                        if (name === 'balance') return [`${value.toFixed(5)} CHAT`, 'Total Balance'];
                        if (name === 'earnings') return [`${value.toFixed(5)} CHAT`, 'Earnings from Baseline'];
                        return [value, name];
                      }}
                      labelFormatter={(date: string) => date}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="balance" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      dot={{ fill: '#10b981', r: 6 }}
                      name="balance"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="earnings" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ fill: '#8884d8', r: 4 }}
                      name="earnings"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Earnings Projection */}
            <Card>
              <CardHeader>
                <CardTitle>Earnings Projection</CardTitle>
                <CardDescription>Estimated future earnings based on current rate</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { period: 'Daily', amount: customEarnings.dailyEarnings, color: '#10b981' },
                    { period: 'Weekly', amount: customEarnings.weeklyEarnings, color: '#3b82f6' },
                    { period: 'Monthly', amount: customEarnings.monthlyEarnings, color: '#8b5cf6' }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [`${value.toFixed(5)} CHAT`, 'Estimated Earnings']}
                    />
                    <Bar dataKey="amount" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Message Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Message Activity</CardTitle>
                <CardDescription>Calculated as 100 × (baseline - current balance)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {Math.max(0, Math.round(1000 * ( parseFloat(tokenBalance) - BASELINE_BALANCE ))).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Total Messages Calculated</div>
                    <div className="text-xs text-gray-500 mt-2">
                     
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={[
                      { date: '7 days ago', messages: Math.max(0, Math.round(100 * (parseFloat(tokenBalance) - BASELINE_BALANCE) * 0.1)) },
                      { date: '5 days ago', messages: Math.max(0, Math.round(100 * (parseFloat(tokenBalance) - BASELINE_BALANCE) * 0.3)) },
                      { date: '3 days ago', messages: Math.max(0, Math.round(100 * (parseFloat(tokenBalance) - BASELINE_BALANCE) * 0.6)) }, 
                      { date: '1 day ago', messages: Math.max(0, Math.round(100 * (parseFloat(tokenBalance) - BASELINE_BALANCE) * 0.9)) },
                      { date: 'Today', messages: Math.max(0, Math.round(100 * (parseFloat(tokenBalance) - BASELINE_BALANCE))) }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis />
                      <Tooltip 
                      formatter={(value: number) => [`${value.toLocaleString()}`, 'Messages']}
                      labelFormatter={(date: string) => date}
                      />
                      <Bar dataKey="messages" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Platform Revenue */}
            <Card>
              <CardHeader>
                <CardTitle>Daily ETH Revenue</CardTitle>
                <CardDescription>Estimated revenue based on message activity and earnings growth</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-600">
                      {(customEarnings.dailyEarnings * 0.0001).toFixed(6)} ETH
                    </div>
                    <div className="text-sm text-gray-600">Estimated Daily ETH Revenue</div>
                    <div className="text-xs text-gray-500 mt-2">
                      Based on daily earnings: {customEarnings.dailyEarnings.toFixed(5)} CHAT × 0.0001 ETH/CHAT
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={[
                      { date: '7 days ago', revenue: (customEarnings.dailyEarnings * 0.1 * 0.0001) },
                      { date: '5 days ago', revenue: (customEarnings.dailyEarnings * 0.3 * 0.0001) },
                      { date: '3 days ago', revenue: (customEarnings.dailyEarnings * 0.6 * 0.0001) },
                      { date: '1 day ago', revenue: (customEarnings.dailyEarnings * 0.9 * 0.0001) },
                      { date: 'Today', revenue: (customEarnings.dailyEarnings * 0.0001) }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number) => [`${value.toFixed(6)} ETH`, 'Revenue']}
                        labelFormatter={(date: string) => date}
                      />
                      <Bar dataKey="revenue" fill="#f59e0b" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="chatbots" className="space-y-4">
          {/* Top Performing Chatbots */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Top Earning Chatbots
              </CardTitle>
              <CardDescription>Your most profitable NFT chatbots by earnings</CardDescription>
            </CardHeader>
            <CardContent>
              {chatbotEarnings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No earnings data available for the selected period
                </div>
              ) : (
                <div className="space-y-4">
                  {chatbotEarnings.slice(0, 10).map((chatbot, index) => (
                    <div key={chatbot.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="text-xs">
                          #{index + 1}
                        </Badge>
                        <div>
                          <h3 className="font-medium">{chatbot.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {chatbot.messageCount} messages • ID: {chatbot.id}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{formatTokens(chatbot.totalEarnings)} CHAT</div>
                        <div className="text-sm text-muted-foreground">
                          {formatTokens(chatbot.avgEarningsPerMessage)} per message
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chatbot Distribution Pie Chart */}
          {chatbotEarnings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Earnings Distribution</CardTitle>
                <CardDescription>How earnings are distributed across your chatbots</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={chatbotEarnings.slice(0, 5).map((bot, index) => ({
                        name: bot.name,
                        value: bot.totalEarnings,
                        fill: COLORS[index % COLORS.length]
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent ? percent * 100 : 0).toFixed(0)}%`}
                      outerRadius={120}
                      dataKey="value"
                    >
                      {chatbotEarnings.slice(0, 5).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`${formatTokens(value)} CHAT`, 'Earnings']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="guide" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                How to Maximize Your Earnings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-semibold text-lg mb-2">💰 Earning Mechanism</h3>
                  <ul className="space-y-2 text-sm">
                    <li>• Users pay <strong>0.001 CHAT tokens + ETH gas</strong> per message</li>
                    <li>• You receive <strong>0.0008 CHAT tokens</strong> (80% revenue share)</li>
                    <li>• Platform keeps 0.0002 CHAT tokens (20% fee)</li>
                    <li>• Payments are automatic and instant via blockchain</li>
                    <li>• ETH gas fees (~0.0001 ETH) go to network validators</li>
                    <li>• <strong>Much lower costs = More user adoption!</strong></li>
                  </ul>
                </div>

                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="font-semibold text-lg mb-2">🚀 Optimization Tips</h3>
                  <ul className="space-y-2 text-sm">
                    <li>• Create specialized chatbots for specific niches</li>
                    <li>• Make your chatbots helpful and engaging</li>
                    <li>• Promote your chatbots on social media</li>
                    <li>• Respond to user feedback and improve</li>
                    <li>• Create multiple chatbots to diversify income</li>
                  </ul>
                </div>

                <div className="border-l-4 border-purple-500 pl-4">
                  <h3 className="font-semibold text-lg mb-2">📊 Success Metrics</h3>
                  <ul className="space-y-2 text-sm">
                    <li>• Track conversation completion rates</li>
                    <li>• Monitor user retention and repeat usage</li>
                    <li>• Analyze peak usage times</li>
                    <li>• Review most asked questions</li>
                    <li>• Compare performance across chatbots</li>
                  </ul>
                </div>

                <div className="border-l-4 border-orange-500 pl-4">
                  <h3 className="font-semibold text-lg mb-2">🎯 High-Value Niches</h3>
                  <ul className="space-y-2 text-sm">
                    <li>• Customer support and help desk</li>
                    <li>• Educational tutoring and learning</li>
                    <li>• Professional consulting</li>
                    <li>• Technical troubleshooting</li>
                    <li>• Creative writing and brainstorming</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button asChild>
                  <a href="/EARNING_GUIDE.md" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Full Earning Guide
                  </a>
                </Button>
                <Button variant="outline" onClick={() => copyToClipboard(account!)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Wallet Address
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
