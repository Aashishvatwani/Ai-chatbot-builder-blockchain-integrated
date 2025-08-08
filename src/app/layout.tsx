import type { Metadata } from "next";

import "./globals.css";
import {
  ClerkProvider,
 
} from '@clerk/nextjs'
import ApolloProviderwrapper from "@/components/ApolloProvider";
import { Toaster } from "@/components/ui/sonner"
import { Web3Provider } from "@/components/Web3Provider";


export const metadata: Metadata = {
  title: "AI chatpod",
  description: "Build AI chatpods using this app ",
};

export default  function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <ApolloProviderwrapper>
    <ClerkProvider>
    <Web3Provider>
    <html lang="en">
      <body
        className="min-h-screen  "
      >
        <Toaster />
       
          {children}
      

      </body>
    </html>
    </Web3Provider>
    </ClerkProvider>
    </ApolloProviderwrapper>
  );
}
