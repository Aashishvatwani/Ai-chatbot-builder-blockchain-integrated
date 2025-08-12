'use client';

import Web3Debug from '@/components/Web3Debug';

export default function DebugPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Web3 Payment Debug</h1>
        <Web3Debug />
        
        <div className="mt-8 max-w-2xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">How to Test:</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Connect your MetaMask wallet to the application</li>
                <li>Click &quot;Mint 100 Demo Tokens&quot; to get test CHAT tokens</li>
                <li>Click &quot;Test Payment&quot; to simulate a 10 CHAT token payment</li>
                <li>Check MetaMask transaction history to see the actual token deduction</li>
                <li>Refresh balance to see updated token count</li>
            </ol>
            
            <div className="mt-4 p-4 bg-blue-50 rounded">
              <h3 className="font-medium text-blue-800">Expected Behavior:</h3>
              <ul className="list-disc list-inside text-sm text-blue-700 mt-2">
                <li>Tokens should be actually deducted from your MetaMask account</li>
                <li>You should see a transaction in MetaMask history</li>
                <li>Balance should decrease by 10 CHAT after payment</li>
                <li>If chatbot is not registered, tokens go to platform address</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
