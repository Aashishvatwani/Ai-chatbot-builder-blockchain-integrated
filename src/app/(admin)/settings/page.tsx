'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import SimpleWeb3Integration from '@/components/SimpleWeb3Integration';
import Web3Dashboard from '@/components/Web3Dashboard';
import { useUser } from '@clerk/nextjs';
import { 
  Settings, 
  Wallet, 
  User, 
  Bell, 
  Shield, 
  Coins,
  ExternalLink,
  Copy,
  Download
} from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('general');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-gray-600">Manage your account and blockchain preferences</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-5">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="blockchain" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            <span className="hidden sm:inline">Blockchain</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center gap-2">
            <Coins className="h-4 w-4" />
            <span className="hidden sm:inline">API</span>
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Your basic account information managed by Clerk
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Email</Label>
                  <Input value={user?.emailAddresses[0]?.emailAddress || ''} disabled />
                </div>
                <div>
                  <Label>User ID</Label>
                  <div className="flex gap-2">
                    <Input value={user?.id || ''} disabled />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(user?.id || '')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <div>
                <Label>Account Status</Label>
                <div className="mt-2">
                  <Badge variant="default">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Usage Statistics</CardTitle>
              <CardDescription>
                Your platform usage overview
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">0</div>
                  <div className="text-sm text-gray-600">Chatbots Created</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">0</div>
                  <div className="text-sm text-gray-600">Conversations</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">0</div>
                  <div className="text-sm text-gray-600">NFTs Owned</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Blockchain Settings */}
        <TabsContent value="blockchain" className="space-y-6">
          <SimpleWeb3Integration />
          
          <Web3Dashboard />
          
          <Card>
            <CardHeader>
              <CardTitle>Blockchain Network Configuration</CardTitle>
              <CardDescription>
                Current network settings and contract addresses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Preferred Network</Label>
                  <Input value="Sepolia Testnet" disabled />
                </div>
                <div>
                  <Label>Deployment Status</Label>
                  <Badge variant="default" className="bg-green-600">Live & Verified</Badge>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Contract Addresses</Label>
                <div className="bg-gray-50 p-3 rounded-lg space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span>ChatPod Token:</span>
                    <div className="flex items-center gap-2">
                      <code className="bg-white px-2 py-1 rounded text-xs">0x154eC1d3d1e83EAc7486e8381A280F7fE3e668C1</code>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-6 w-6 p-0"
                        onClick={() => copyToClipboard('0x154eC1d3d1e83EAc7486e8381A280F7fE3e668C1')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Chatbot NFT:</span>
                    <div className="flex items-center gap-2">
                      <code className="bg-white px-2 py-1 rounded text-xs">0x5063a369B8ae4BbEC1C3fba44E77528b9bfc2802</code>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-6 w-6 p-0"
                        onClick={() => copyToClipboard('0x5063a369B8ae4BbEC1C3fba44E77528b9bfc2802')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span>Network:</span>
                    <Badge variant="secondary">Sepolia Testnet</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose what notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">New Messages</div>
                    <div className="text-sm text-gray-600">Get notified when users message your chatbots</div>
                  </div>
                  <input type="checkbox" defaultChecked className="toggle" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Token Earnings</div>
                    <div className="text-sm text-gray-600">Notifications for blockchain token rewards</div>
                  </div>
                  <input type="checkbox" defaultChecked className="toggle" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">NFT Activities</div>
                    <div className="text-sm text-gray-600">Updates on NFT minting and trading</div>
                  </div>
                  <input type="checkbox" className="toggle" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your account security preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label>Authentication</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    Your authentication is managed by Clerk with enterprise-grade security
                  </p>
                  <Badge variant="default" className="mt-2">Secured by Clerk</Badge>
                </div>
                
                <div>
                  <Label>Wallet Security</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    Your wallet connection is managed locally and never stored on our servers
                  </p>
                  <Badge variant="outline" className="mt-2">Non-custodial</Badge>
                </div>
                
                <div className="pt-4 border-t">
                  <Button variant="outline" className="w-full">
                    <Shield className="h-4 w-4 mr-2" />
                    View Security Settings in Clerk
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Settings */}
        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Integration</CardTitle>
              <CardDescription>
                Integrate your chatbots with external applications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-semibold text-yellow-900 mb-2">🚧 API Coming Soon</h3>
                <p className="text-sm text-yellow-800">
                  We&apos;re working on comprehensive API access for your chatbots. This will include:
                </p>
                <ul className="list-disc list-inside text-sm text-yellow-800 mt-2 space-y-1">
                  <li>REST API for chatbot management</li>
                  <li>WebSocket for real-time messaging</li>
                  <li>Blockchain integration endpoints</li>
                  <li>Webhook notifications</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <Label>Webhook URL (Preview)</Label>
                <Input placeholder="https://your-app.com/webhook" disabled />
                <p className="text-xs text-gray-500">
                  Configure webhooks to receive real-time notifications
                </p>
              </div>
              
              <Button disabled variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download API Documentation
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
