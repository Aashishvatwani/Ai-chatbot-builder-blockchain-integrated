# Environment Variables Required for IPFS Auto-Generation

## Add these to your `.env.local` file:

```env
# Pinata IPFS Service (Required for auto IPFS generation)
NEXT_PUBLIC_PINATA_API_KEY=your_pinata_api_key_here
NEXT_PUBLIC_PINATA_SECRET_KEY=your_pinata_secret_key_here

# Existing variables (keep these)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret
NEXT_PUBLIC_HASURA_GRAPHQL_ENDPOINT=your_hasura_endpoint
HASURA_ADMIN_SECRET=your_hasura_secret
GEMINI_API_KEY=your_gemini_key
NEXT_PUBLIC_BASE_URL=https://ai-chatpod.vercel.app
```

## How to get Pinata API keys:

1. Go to [Pinata.cloud](https://pinata.cloud)
2. Sign up for a free account
3. Go to API Keys section
4. Create new API key with permissions:
   - pinFileToIPFS
   - pinJSONToIPFS
   - userPinnedDataTotal
5. Copy the API Key and Secret Key to your .env.local

## Test the setup:

1. Create a new chatbot with characteristics
2. Leave IPFS hash field empty
3. The system will auto-generate IPFS metadata
4. Check the console logs for "Auto-generated IPFS hash: QmXXXX..."
5. Test the chatbot - it should have enhanced responses from IPFS metadata

## Troubleshooting:

- If IPFS generation fails, the chatbot will still work with basic characteristics
- Check console for error messages
- Verify Pinata API keys are correct
- Make sure you have internet connection for IPFS upload
