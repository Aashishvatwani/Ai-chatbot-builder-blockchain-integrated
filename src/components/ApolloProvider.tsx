'use client';

import { ApolloProvider } from "@apollo/client";
import client from "../../graphql/apollo-client"
function ApolloProviderwrapper({
  children,
}: Readonly<{
  children: React.ReactNode;
}>){
  return (
     <ApolloProvider client={client}>{children}</ApolloProvider>
  )
}
export default ApolloProviderwrapper