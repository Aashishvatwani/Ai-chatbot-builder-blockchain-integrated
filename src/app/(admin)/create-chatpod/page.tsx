'use client'
import Avatar from "@/components/Avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation } from "@apollo/client";
import client from "../../../../graphql/apollo-client";
import { CREATE_CHATBOT, CREATE_CHATBOT_BASIC, UPDATE_CHATPOD } from "../../../../graphql/mutations/mutations";
import { MINT_CHATBOT_NFT } from "../../../../graphql/mutations/blockchainMutations";
import { useUser } from "@clerk/nextjs";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ipfsService } from "@/lib/ipfsService";
import { toast } from "sonner";
import { Coins, Zap, Shield} from "lucide-react";
import { useWeb3 } from "@/components/Web3Provider";

function CreateChatpods() {
  const { user } = useUser();
  const [name, setName] = useState("");
  const [ipfsHash, setIpfsHash] = useState("");
  const [shouldMintNFT, setShouldMintNFT] = useState(false);
  const [characteristics, setCharacteristics] = useState<string[]>([]);
  const [currentCharacteristic, setCurrentCharacteristic] = useState("");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { isConnected, mintChatbotNFT, connectWallet, account } = useWeb3();

  const [createChatbot] = useMutation(CREATE_CHATBOT, {
    client,
  });

  const [createChatbotBasic] = useMutation(CREATE_CHATBOT_BASIC, {
    client,
  });

  const [updateChatbot] = useMutation(UPDATE_CHATPOD, {
    client,
  });

  const [mintNFTMutation] = useMutation(MINT_CHATBOT_NFT, {
    client,
  });

  const addCharacteristic = () => {
    if (currentCharacteristic.trim() && characteristics.length < 5) {
      setCharacteristics([...characteristics, currentCharacteristic.trim()]);
      setCurrentCharacteristic("");
    }
  };

  const removeCharacteristic = (index: number) => {
    setCharacteristics(characteristics.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter a chatbot name");
      return;
    }

    if (shouldMintNFT && !isConnected) {
      toast.error("Please connect your wallet to mint an NFT");
      return;
    }

    startTransition(async () => {
      try {
        // Step 1: Create chatbot in database
        console.log("Creating chatbot with variables:", {
          clerk_user_id: user?.id,
          name,
          ipfs_hash: ipfsHash.trim() || null,
        });
        
        let data, errors;

        try {
          // Try creating with IPFS hash field first
          const result = await createChatbot({
            variables: {
              clerk_user_id: user?.id,
              name,
              ipfs_hash: ipfsHash.trim() || null,
            },
          });
          data = result.data;
          errors = result.errors;
        } catch (createError) {
          console.log("Main create failed, trying basic create:", createError);
          // Fallback to basic creation without ipfs_hash
          const result = await createChatbotBasic({
            variables: {
              clerk_user_id: user?.id,
              name,
            },
          });
          data = result.data;
          errors = result.errors;
        }

        if (errors) {
          console.error("GraphQL errors:", errors);
          throw new Error(`GraphQL Error: ${errors.map(e => e.message).join(', ')}`);
        }

        if (!data?.insert_chatbots?.returning?.[0]?.id) {
          throw new Error("Failed to create chatbot - no ID returned");
        }

       const  chatbotId = data.insert_chatbots.returning[0].id;
        console.log("Chatbot created with ID:", chatbotId);

        // Step 2: Add characteristics if any
        if (characteristics.length > 0) {
          // You would need to create a mutation to add multiple characteristics
          // For now, we'll add them individually in the edit page
        }

        // Step 3: Auto-generate IPFS metadata if no hash provided
        let finalIpfsHash = ipfsHash.trim();
        if (!finalIpfsHash && characteristics.length > 0) {
          try {
            toast.loading("Generating IPFS metadata...", { id: "ipfs-gen" });
            const { metadataHash } = await ipfsService.uploadChatbotMetadata(
              chatbotId,
              name,
              characteristics
            );
            finalIpfsHash = metadataHash;
            
            // Update chatbot with generated IPFS hash
            console.log("Updating chatbot with IPFS hash:", {
              id: chatbotId,
              name: name,
              ipfs_hash: metadataHash
            });
            
            const { data: updateData, errors: updateErrors } = await updateChatbot({
              variables: {
                id: chatbotId,
                name: name, // Keep the same name
                ipfs_hash: metadataHash
              }
            });

            if (updateErrors) {
              console.error("Update GraphQL errors:", updateErrors);
              throw new Error(`Update Error: ${updateErrors.map(e => e.message).join(', ')}`);
            }

            console.log("Chatbot updated successfully:", updateData);
            
            toast.success("IPFS metadata generated!", { id: "ipfs-gen" });
            console.log("Auto-generated IPFS hash:", metadataHash);
          } catch (ipfsError) {
            console.error("IPFS upload failed, continuing without:", ipfsError);
            toast.dismiss("ipfs-gen");
            // Continue without IPFS - chatbot will work with just characteristics
          }
        }

        // Step 4: Mint NFT if requested
        let nftResult = null;
        if (shouldMintNFT && isConnected) {
          try {
            toast.loading("Minting NFT...", { id: "nft-mint" });
            
            nftResult = await mintChatbotNFT(
              name,
              characteristics.length > 0 ? characteristics : ["AI Assistant"],
              chatbotId
            );

            // Record NFT in database
            await mintNFTMutation({
              variables: {
                chatbot_id: chatbotId,
                token_id: nftResult.tokenId,
                contract_address: process.env.NEXT_PUBLIC_CHATBOT_NFT_ADDRESS,
                ipfs_hash: nftResult.ipfsHashes?.metadataHash || null,
              },
            });

            toast.success("NFT minted successfully!", { id: "nft-mint" });
          } catch (error) {
            console.error("Error minting NFT:", error);
            toast.error("Failed to mint NFT, but chatbot was created", { id: "nft-mint" });
          }
        }

        // Reset form
        setName("");
        setIpfsHash("");
        setCharacteristics([]);
        setShouldMintNFT(false);

        // Navigate to edit page
        router.push(`/edit-chatpod/${chatbotId}`);
        
        toast.success(
          finalIpfsHash 
            ? `Chatbot created with IPFS metadata! ${nftResult ? `NFT Token ID: ${nftResult.tokenId}` : ''}` 
            : `Chatbot created successfully! ${nftResult ? `NFT Token ID: ${nftResult.tokenId}` : ''}`
        );

      } catch (error) {
        console.error("Error creating chatbot:", error);
        toast.error("Failed to create chatbot");
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            <Zap className="h-6 w-6 text-blue-500" />
            Create Your AI ChatPod
          </CardTitle>
          <CardDescription>
            Build a personalized AI assistant for your business
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-6">
            <Avatar seed={name || "create-chatpod"} className="w-20 h-20" />
            
            <form onSubmit={handleSubmit} className="w-full space-y-6">
              {/* Chatbot Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Chatbot Name *
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Customer Support Bot"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full"
                />
                <p className="text-xs text-gray-500">
                  Choose a memorable name for your AI assistant
                </p>
              </div>

              {/* IPFS Hash Input */}
              <div className="space-y-2">
                <Label htmlFor="ipfs-hash" className="text-sm font-medium">
                  IPFS Metadata Hash (Optional)
                </Label>
                <Input
                  id="ipfs-hash"
                  placeholder="e.g., QmYourIPFSHashHere..."
                  value={ipfsHash}
                  onChange={(e) => setIpfsHash(e.target.value)}
                  className="w-full font-mono text-sm"
                />
                <p className="text-xs text-gray-500">
                  Optional: Provide existing IPFS hash or leave empty to auto-generate metadata from characteristics
                </p>
              </div>

              {/* Characteristics */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Initial Characteristics (Used for IPFS metadata)
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., Friendly customer service agent"
                    value={currentCharacteristic}
                    onChange={(e) => setCurrentCharacteristic(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCharacteristic())}
                    disabled={characteristics.length >= 5}
                  />
                  <Button
                    type="button"
                    onClick={addCharacteristic}
                    disabled={!currentCharacteristic.trim() || characteristics.length >= 5}
                    variant="outline"
                  >
                    Add
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Add characteristics to auto-generate rich IPFS metadata for enhanced AI responses (max 5)
                </p>
                
                {/* Display characteristics */}
                {characteristics.length > 0 && (
                  <div className="space-y-2">
                    {characteristics.map((char, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span className="text-sm">{char}</span>
                        <Button
                          type="button"
                          onClick={() => removeCharacteristic(index)}
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                    <p className="text-xs text-gray-500">
                      {5 - characteristics.length} characteristics remaining
                    </p>
                  </div>
                )}
              </div>

              {/* NFT Minting Option */}
              <Card className="border-2 border-dashed border-blue-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-blue-500" />
                        <Label htmlFor="mint-nft" className="font-medium">
                          Mint as NFT
                        </Label>
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          New
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        Create a blockchain-owned chatbot NFT
                      </p>
                    </div>
                    <Switch
                      id="mint-nft"
                      checked={shouldMintNFT}
                      onCheckedChange={setShouldMintNFT}
                      disabled={!isConnected}
                    />
                  </div>
                  
                  {shouldMintNFT && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Coins className="h-4 w-4 text-blue-600 mt-0.5" />
                        <div className="text-xs text-blue-800">
                          <p className="font-medium mb-1">NFT Benefits:</p>
                          <ul className="space-y-1">
                            <li>• True ownership of your AI chatbot</li>
                            <li>• Earn tokens from conversations</li>
                            <li>• Trade on NFT marketplaces</li>
                            <li>• Proof of authenticity & creation</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Wallet Connection Status */}
                  {!isConnected ? (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-yellow-800">Wallet Required for NFT</p>
                          <p className="text-xs text-yellow-600">Connect your wallet to mint chatbot as NFT</p>
                        </div>
                        <Button 
                          onClick={connectWallet}
                          size="sm"
                          variant="outline"
                          className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                        >
                          Connect Wallet
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <p className="text-sm font-medium text-green-800">Wallet Connected</p>
                      </div>
                      <p className="text-xs text-green-600 mt-1">
                        {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Ready to mint NFT'}
                      </p>
                    </div>
                  )}

                  {!isConnected && shouldMintNFT && (
                    <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
                      ⚠️ Please connect your wallet first to enable NFT minting
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Submit Button */}
              <Button 
                type="submit" 
                disabled={isPending || !name.trim()}
                className="w-full"
                size="lg"
              >
                {isPending ? (
                  shouldMintNFT ? "Creating & Minting..." : "Creating Chatbot..."
                ) : (
                  shouldMintNFT ? "Create & Mint NFT" : "Create Chatbot"
                )}
              </Button>
            </form>

            <p className="text-xs text-gray-400 text-center">
              You can always add more characteristics and features after creation
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CreateChatpods;
