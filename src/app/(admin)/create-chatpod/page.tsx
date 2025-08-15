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
import { useState, FormEvent, useTransition, useCallback, DragEvent } from "react";
import { useRouter } from "next/navigation";
import { ipfsService } from "@/lib/ipfsService";
import { toast } from "sonner";
import { Coins, Zap, Shield, FileUp, X, Loader2, FileText } from "lucide-react";
import { useWeb3 } from "@/components/Web3Provider";

// A simple file upload component with drag-and-drop functionality
function FileUploader({ onFileDrop, uploadedFile, isFileUploading, onRemoveFile, disabled }: {
  onFileDrop: (files: File[]) => void;
  uploadedFile: File | null;
  isFileUploading: boolean;
  onRemoveFile: () => void;
  disabled: boolean;
}) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files && files.length > 0) {
      onFileDrop(files);
      e.dataTransfer.clearData();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files && files.length > 0) {
      onFileDrop(files);
    }
  };

  return (
    <Card className={`transition-all ${disabled ? 'bg-gray-50 opacity-60' : ''}`}>
      <CardContent className="pt-6">
        <div 
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={handleFileSelect}
            disabled={disabled || isFileUploading}
          />
          {isFileUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <p className="text-sm font-medium">Processing file...</p>
              <p className="text-xs text-gray-500">{uploadedFile?.name}</p>
            </div>
          ) : uploadedFile ? (
            <div className="flex flex-col items-center gap-3">
               <FileText className="h-8 w-8 text-green-600" />
               <p className="text-sm font-medium text-gray-800">{uploadedFile.name}</p>
               <p className="text-xs text-green-700">File processed and text extracted!</p>
               <Button
                  type="button"
                  onClick={onRemoveFile}
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-700 text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Remove File
                </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <FileUp className="h-8 w-8 text-gray-400" />
              <Label htmlFor="file-upload" className="font-medium text-blue-600 hover:underline cursor-pointer">
                Choose a file
                <span className="text-gray-600 font-normal"> or drag it here</span>
              </Label>
              <p className="text-xs text-gray-500">Any document type (PDF, DOCX, TXT, etc.)</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


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
  
  // New state for file handling
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isFileUploading, setIsFileUploading] = useState(false);
  const [fileBasedCharacteristic, setFileBasedCharacteristic] = useState<string | null>(null);


  const [createChatbot] = useMutation(CREATE_CHATBOT, { client });
  const [createChatbotBasic] = useMutation(CREATE_CHATBOT_BASIC, { client });
  const [updateChatbot] = useMutation(UPDATE_CHATPOD, { client });
  const [mintNFTMutation] = useMutation(MINT_CHATBOT_NFT, { client });

  const MAX_MANUAL_CHARACTERISTICS = 4;
  const hasFileCharacteristic = fileBasedCharacteristic !== null;
  const canAddMoreCharacteristics = characteristics.length < (hasFileCharacteristic ? MAX_MANUAL_CHARACTERISTICS : 5);


const handleFileDrop = useCallback(async (acceptedFiles: File[]) => {
  const file = acceptedFiles[0];
  if (!file) return;

  setUploadedFile(file);
  setIsFileUploading(true);
  // Start the first loading toast with a unique ID
  toast.loading("Uploading file to IPFS...", { id: "file-process" });

  try {
    // Step 1: Upload file to Pinata IPFS
    const formData = new FormData();
    formData.append("file", file);

    const uploadResponse = await fetch('/api/upload-file', {
      method: 'POST',
      body: formData,
    });
    
    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json();
      // Use toast.error() to update the 'file-process' toast
      toast.error(errorData.error || 'Failed to upload file to Pinata.', { id: "file-process" });
      setIsFileUploading(false); // Make sure to set the state here too
      throw new Error(errorData.error || 'Failed to upload file to Pinata.');
    }

    // Use toast.success() to update the 'file-process' toast
    toast.success("File uploaded to IPFS!", { id: "file-process" });

    // Step 2: Call backend API to extract text
    toast.loading("Extracting knowledge from file...", { id: "text-extract" });
    const uploadData = await uploadResponse.json();
    
    const extractResponse = await fetch('/api/extract-file-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ipfsCid: uploadData.ipfsHash }),
    });

    if (!extractResponse.ok) {
      const errorData = await extractResponse.json();
      // Use toast.error() to update the 'text-extract' toast
      toast.error(errorData.error || 'Failed to extract text from file.', { id: "text-extract" });
      throw new Error(errorData.error || 'Failed to extract text from file.');
    }

    const { text } = await extractResponse.json();
    if (!text || text.trim().length === 0) {
      // Use toast.error() to update the 'text-extract' toast
      toast.error("No text could be extracted from the file.", { id: "text-extract" });
      throw new Error("No text could be extracted from the file.");
    }

    // Step 3: Set the extracted text as the base characteristic
    setFileBasedCharacteristic(text);
    // Use toast.success() to update the 'text-extract' toast
    toast.success("Knowledge extracted and set as base characteristic!", { id: "text-extract" });

  } catch (error) {
    console.error("File processing failed:", error);
    // This is a general catch-all for any uncaught errors
    toast.error("File processing failed. Please try again.", { id: "file-process" });
    toast.error("File processing failed. Please try again.", { id: "text-extract" });
    setUploadedFile(null); // Reset on error
    setFileBasedCharacteristic(null);
  } finally {
    setIsFileUploading(false);
  }
}, []);

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setFileBasedCharacteristic(null);
    toast.info("File removed. You can now upload another or add characteristics manually.");
  };


  const addCharacteristic = () => {
    if (currentCharacteristic.trim() && canAddMoreCharacteristics) {
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
    
    // Combine file-based and manual characteristics
    const allCharacteristics = fileBasedCharacteristic ? [fileBasedCharacteristic, ...characteristics] : characteristics;

    startTransition(async () => {
      try {
        let data, errors;
        try {
          const result = await createChatbot({
            variables: { clerk_user_id: user?.id, name, ipfs_hash: ipfsHash.trim() || null },
          });
          data = result.data;
          errors = result.errors;
        } catch (createError) {
          const result = await createChatbotBasic({
            variables: { clerk_user_id: user?.id, name },
          });
          data = result.data;
          errors = result.errors;
        }

        if (errors) throw new Error(`GraphQL Error: ${errors.map(e => e.message).join(', ')}`);
        if (!data?.insert_chatbots?.returning?.[0]?.id) throw new Error("Failed to create chatbot - no ID returned");

        const chatbotId = data.insert_chatbots.returning[0].id;

        let finalIpfsHash = ipfsHash.trim();
        if (!finalIpfsHash && allCharacteristics.length > 0) {
          try {
            toast.loading("Generating IPFS metadata...", { id: "ipfs-gen" });
            const { metadataHash } = await ipfsService.uploadChatbotMetadata(chatbotId, name, allCharacteristics);
            finalIpfsHash = metadataHash;
            
            await updateChatbot({
              variables: { id: chatbotId, name: name, ipfs_hash: metadataHash }
            });

            toast.success("IPFS metadata generated!", { id: "ipfs-gen" });
          } catch (ipfsError) {
            console.error("IPFS upload failed, continuing without:", ipfsError);
            toast.dismiss("ipfs-gen");
          }
        }

        let nftResult = null;
        if (shouldMintNFT && isConnected) {
          try {
            toast.loading("Minting NFT...", { id: "nft-mint" });
            nftResult = await mintChatbotNFT(name, allCharacteristics.length > 0 ? allCharacteristics : ["AI Assistant"], chatbotId);
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
        setUploadedFile(null);
        setFileBasedCharacteristic(null);

        router.push(`/edit-chatpod/${chatbotId}`);
        toast.success(`Chatbot created successfully! ${nftResult ? `NFT Token ID: ${nftResult.tokenId}` : ''}`);

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
                <Label htmlFor="name" className="text-sm font-medium">Chatbot Name *</Label>
                <Input id="name" placeholder="e.g., Customer Support Bot" value={name} onChange={(e) => setName(e.target.value)} required className="w-full" />
                <p className="text-xs text-gray-500">Choose a memorable name for your AI assistant</p>
              </div>

              {/* File Upload Section */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Upload Knowledge Base (Optional)</Label>
                 <FileUploader 
                  onFileDrop={handleFileDrop}
                  uploadedFile={uploadedFile}
                  isFileUploading={isFileUploading}
                  onRemoveFile={handleRemoveFile}
                  disabled={hasFileCharacteristic}
                />
                <p className="text-xs text-gray-500">
                  Upload a file to automatically set the chatbots primary knowledge and personality.
                </p>
              </div>


              {/* IPFS Hash Input */}
              <div className="space-y-2">
                <Label htmlFor="ipfs-hash" className="text-sm font-medium">IPFS Metadata Hash (Optional)</Label>
                <Input id="ipfs-hash" placeholder="e.g., QmYourIPFSHashHere..." value={ipfsHash} onChange={(e) => setIpfsHash(e.target.value)} className="w-full font-mono text-sm" />
                <p className="text-xs text-gray-500">Optional: Provide existing IPFS hash or leave empty to auto-generate from characteristics.</p>
              </div>

              {/* Characteristics */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Additional Characteristics</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., Friendly and helpful tone"
                    value={currentCharacteristic}
                    onChange={(e) => setCurrentCharacteristic(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCharacteristic())}
                    disabled={!canAddMoreCharacteristics}
                  />
                  <Button type="button" onClick={addCharacteristic} disabled={!currentCharacteristic.trim() || !canAddMoreCharacteristics} variant="outline">Add</Button>
                </div>
                <p className="text-xs text-gray-500">
                  Add traits to refine the AI s personality. { hasFileCharacteristic ? `Max ${MAX_MANUAL_CHARACTERISTICS}.` : "Max 5."}
                </p>
                
                {(characteristics.length > 0 || hasFileCharacteristic) && (
                  <div className="space-y-2">
                    {hasFileCharacteristic && (
                       <div className="flex items-center justify-between bg-blue-50 p-2 rounded">
                        <span className="text-sm font-mono text-blue-800">****** (from uploaded file)</span>
                      </div>
                    )}
                    {characteristics.map((char, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span className="text-sm">{char}</span>
                        <Button type="button" onClick={() => removeCharacteristic(index)} variant="ghost" size="sm" className="text-red-500 hover:text-red-700">×</Button>
                      </div>
                    ))}
                     <p className="text-xs text-gray-500">
                      { (hasFileCharacteristic ? MAX_MANUAL_CHARACTERISTICS : 5) - characteristics.length} characteristics remaining
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
                        <Label htmlFor="mint-nft" className="font-medium">Mint as NFT</Label>
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">New</span>
                      </div>
                      <p className="text-xs text-gray-600">Create a blockchain-owned chatbot NFT</p>
                    </div>
                    <Switch id="mint-nft" checked={shouldMintNFT} onCheckedChange={setShouldMintNFT} disabled={!isConnected} />
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
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {!isConnected ? (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-yellow-800">Wallet Required for NFT</p>
                          <p className="text-xs text-yellow-600">Connect your wallet to mint chatbot as NFT</p>
                        </div>
                        <Button onClick={connectWallet} size="sm" variant="outline" className="border-yellow-300 text-yellow-700 hover:bg-yellow-100">Connect Wallet</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <p className="text-sm font-medium text-green-800">Wallet Connected</p>
                      </div>
                      <p className="text-xs text-green-600 mt-1">{account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Ready to mint NFT'}</p>
                    </div>
                  )}

                  {!isConnected && shouldMintNFT && (
                    <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
                      ⚠️ Please connect your wallet first to enable NFT minting
                    </div>
                  )}
                </CardContent>
              </Card>

              <Button type="submit" disabled={isPending || !name.trim()} className="w-full" size="lg">
                {isPending ? (shouldMintNFT ? "Creating & Minting..." : "Creating Chatbot...") : (shouldMintNFT ? "Create & Mint NFT" : "Create Chatbot")}
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
