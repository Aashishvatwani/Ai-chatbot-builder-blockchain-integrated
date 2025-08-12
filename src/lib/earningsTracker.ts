// Earnings tracking utilities
export interface EarningsData {
  totalEthEarned: number;
  totalChatPurchased: number;
  totalTransactions: number;
  dailyEarnings: number;
  weeklyEarnings: number;
  monthlyEarnings: number;
  lastPurchaseDate: string;
}

export const EARNINGS_STORAGE_KEY = 'chatbot_earnings_data';

// Get earnings data from localStorage
export const getEarningsData = (): EarningsData => {
  if (typeof window === 'undefined') {
    return {
      totalEthEarned: 0,
      totalChatPurchased: 0,
      totalTransactions: 0,
      dailyEarnings: 0,
      weeklyEarnings: 0,
      monthlyEarnings: 0,
      lastPurchaseDate: new Date().toISOString(),
    };
  }

  const stored = localStorage.getItem(EARNINGS_STORAGE_KEY);
  if (!stored) {
    return {
      totalEthEarned: 0,
      totalChatPurchased: 0,
      totalTransactions: 0,
      dailyEarnings: 0,
      weeklyEarnings: 0,
      monthlyEarnings: 0,
      lastPurchaseDate: new Date().toISOString(),
    };
  }

  try {
    return JSON.parse(stored);
  } catch {
    return {
      totalEthEarned: 0,
      totalChatPurchased: 0,
      totalTransactions: 0,
      dailyEarnings: 0,
      weeklyEarnings: 0,
      monthlyEarnings: 0,
      lastPurchaseDate: new Date().toISOString(),
    };
  }
};

// Save earnings data to localStorage
export const saveEarningsData = (data: EarningsData): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(EARNINGS_STORAGE_KEY, JSON.stringify(data));
  }
};

// Record a new purchase
export const recordPurchase = (ethAmount: number, chatAmount: number): EarningsData => {
  const currentData = getEarningsData();
  const now = new Date();
  const lastPurchase = new Date(currentData.lastPurchaseDate);
  
  // Check if it's a new day
  const isNewDay = now.toDateString() !== lastPurchase.toDateString();
  const isNewWeek = now.getTime() - lastPurchase.getTime() > 7 * 24 * 60 * 60 * 1000;
  const isNewMonth = now.getMonth() !== lastPurchase.getMonth() || now.getFullYear() !== lastPurchase.getFullYear();

  const newData: EarningsData = {
    totalEthEarned: currentData.totalEthEarned + ethAmount,
    totalChatPurchased: currentData.totalChatPurchased + chatAmount,
    totalTransactions: currentData.totalTransactions + 1,
    dailyEarnings: isNewDay ? ethAmount : currentData.dailyEarnings + ethAmount,
    weeklyEarnings: isNewWeek ? ethAmount : currentData.weeklyEarnings + ethAmount,
    monthlyEarnings: isNewMonth ? ethAmount : currentData.monthlyEarnings + ethAmount,
    lastPurchaseDate: now.toISOString(),
  };

  saveEarningsData(newData);
  return newData;
};

// Get earnings statistics
export const getEarningsStats = () => {
  const data = getEarningsData();
  const ETH_TO_USD = 2500; // Approximate ETH price in USD
  
  return {
    ...data,
    totalUsdEarned: data.totalEthEarned * ETH_TO_USD,
    dailyUsdEarnings: data.dailyEarnings * ETH_TO_USD,
    weeklyUsdEarnings: data.weeklyEarnings * ETH_TO_USD,
    monthlyUsdEarnings: data.monthlyEarnings * ETH_TO_USD,
    averageTransactionSize: data.totalTransactions > 0 ? data.totalEthEarned / data.totalTransactions : 0,
  };
};
