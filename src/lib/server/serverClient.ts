import { ApolloClient, DefaultOptions, InMemoryCache, HttpLink } from "@apollo/client";
import fetch from "cross-fetch";

const defaultOptions: DefaultOptions = {
  watchQuery: {
    fetchPolicy: 'no-cache',
    errorPolicy: "all",
  },
  query: {
    fetchPolicy: 'no-cache',
    errorPolicy: "all",
  },
  mutate: {
    fetchPolicy: 'no-cache',
    errorPolicy: "all",
  }
}

export const serveClient = new ApolloClient({
  ssrMode: true,
  link: new HttpLink({
    uri: process.env.NEXT_PUBLIC_HASURA_GRAPHQL_ENDPOINT!,
    headers: {
      'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET!,
    },
    fetch, 
  }),
  cache: new InMemoryCache(),
  defaultOptions: defaultOptions,
});
