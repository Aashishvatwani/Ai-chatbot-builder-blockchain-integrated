import type { Metadata } from "next";

import "./globals.css";
import {
  ClerkProvider,
 
} from '@clerk/nextjs'
import ApolloProviderwrapper from "@/components/ApolloProvider";
import { Toaster } from "@/components/ui/sonner"


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
    <html lang="en">
      <body
        className="min-h-screen  "
      >
        <Toaster />
       
          {children}
      

      </body>
    </html>
    </ClerkProvider>
    </ApolloProviderwrapper>
  );
}
