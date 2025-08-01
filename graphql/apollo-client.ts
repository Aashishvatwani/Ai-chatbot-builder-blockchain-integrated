import {
  ApolloClient,
  DefaultOptions,
  InMemoryCache,
  HttpLink,
  ApolloLink,
  from,
} from "@apollo/client";
import { onError } from "@apollo/client/link/error";
const getBaseUrl = () => {
  // Server-side (Node.js)
  if (typeof window === 'undefined') {
    return process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
  }
  
  // Client-side (Browser)
  return window.location.origin;
};

// Export BASE_URL for use in other parts of the app
export const BASE_URL = process.env.NODE_ENV === "development" 
  ? "http://localhost:3000" 
  : getBaseUrl();

// Create the HTTP link
const httpLink = new HttpLink({
  uri: process.env.NODE_ENV === "development" 
    ? "http://localhost:3000/api/graphql"
    : "/api/graphql", // Use relative URL in production to avoid CORS
});

// Log outgoing operation requests
const requestLoggerLink = new ApolloLink((operation, forward) => {
  console.log("[GraphQL Request]:", {
    operationName: operation.operationName,
    variables: operation.variables,
    query: operation.query.loc?.source.body.slice(0, 300), // Print only first 300 chars
  });
  return forward(operation).map((response: any) => {
    console.log("[GraphQL Response]:", {
      operationName: operation.operationName,
      data: response.data,
    });
    return response;
  });
});

// Error link
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      );
    });
  }
  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
  }
});

// Safe forwarding link with internal error logging
const safeHttpLink = new ApolloLink((operation, forward) => {
  try {
    return forward(operation);
  } catch (error) {
    console.error("Apollo Link error (safeHttpLink):", error);
    throw error;
  }
});

// Default fetch/cache/error policies
const defaultOptions: DefaultOptions = {
  watchQuery: {
    fetchPolicy: "no-cache",
    errorPolicy: "all",
  },
  query: {
    fetchPolicy: "no-cache",
    errorPolicy: "all",
  },
  mutate: {
    fetchPolicy: "no-cache",
    errorPolicy: "all",
  },
};

// Compose all links together
const client = new ApolloClient({
  link: from([requestLoggerLink, errorLink, safeHttpLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions,
});

export default client;
