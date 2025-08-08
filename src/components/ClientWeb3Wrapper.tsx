'use client';

import { Web3Provider } from "@/components/Web3Provider";
import { ReactNode } from "react";

interface ClientWeb3WrapperProps {
  children: ReactNode;
}

export default function ClientWeb3Wrapper({ children }: ClientWeb3WrapperProps) {
  return (
    <Web3Provider>
      {children}
    </Web3Provider>
  );
}
