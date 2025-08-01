// src/app/api/graphql/route.ts

import { serveClient } from "@/lib/server/serverClient";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { gql, ApolloError } from "@apollo/client";

export async function POST(request: NextRequest) {
  try {
    const { query, variables } = await request.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { errors: [{ message: "Invalid or missing GraphQL query." }] },
        { status: 400 }
      );
    }

    const gqlQuery = gql`${query}`;
    const isMutation = query.trim().startsWith("mutation");

    const result = isMutation
      ? await serveClient.mutate({ mutation: gqlQuery, variables })
      : await serveClient.query({ query: gqlQuery, variables });

    // ✅ **CORRECT:** Return the entire result object from the client.
    // This will contain either a `data` or `errors` key, which is what the frontend expects.
    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error("GraphQL API error:", error);

    // ✅ **CORRECT:** If the error is an ApolloError, forward its structured errors.
    // Otherwise, create a generic GraphQL-compliant error response.
    if (error instanceof ApolloError) {
      return NextResponse.json({ errors: error.graphQLErrors }, { status: 500 });
    }

    const message = error instanceof Error ? error.message : "Unexpected server error";
    return NextResponse.json({ errors: [{ message }] }, { status: 500 });
  }
}