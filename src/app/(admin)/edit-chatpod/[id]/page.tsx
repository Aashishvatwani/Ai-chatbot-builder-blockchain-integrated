'use client';
import { redirect, useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BASE_URL } from '../../../../../graphql/apollo-client';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Copy, X } from "lucide-react";
import Avatar from "@/components/Avatar";
import { useQuery, useMutation } from "@apollo/client";
import { toast } from "sonner";
import { GET_CHATPODS_BY_ID } from "../../../../../graphql/queries/queries";
import { GetChatbotResponse, GetChatbotByIdVariables } from "../../../../../types/types";
import Characteristic from "@/components/Characterictic";
import { DELETE_CHATBOT, ADD_CHARACTERISTIC } from "../../../../../graphql/mutations/mutations";
import { UPDATE_CHATPOD } from "../../../../../graphql/mutations/mutations";
export default function Page() {
  const { id } = useParams();
  const router = useRouter();
  const [url, setUrl] = useState<string>("");
  const [chatbotName, setChatbotName] = useState<string>("");
  const [newCharacteristic, setNewCharacteristic] = useState<string>("");

  useEffect(() => {
    if (id) {
      setUrl(`${BASE_URL}/chatbot/${id}`);
    }
  }, [id]);
  const [updateChatpod] = useMutation(UPDATE_CHATPOD, {
    refetchQueries: [{ query: GET_CHATPODS_BY_ID, variables: { id: parseInt(id as string) } }],
    awaitRefetchQueries: true,
  });

  const { data, loading, error } = useQuery<GetChatbotResponse, GetChatbotByIdVariables>(
    GET_CHATPODS_BY_ID,
    {
      variables: { id: parseInt(id as string) },
      onCompleted: (data) => {
        if (data.chatbots?.length > 0) {
          setChatbotName(data.chatbots[0].name);
        }
      },
      onError: () => toast.error("Failed to fetch chatbot data"),
    }
  );

  
  const [deleteChatbot] = useMutation(DELETE_CHATBOT, {
    refetchQueries: [{ query: GET_CHATPODS_BY_ID, variables: { id: parseInt(id as string) } }],
    awaitRefetchQueries: true,
  });

  const [addCharacteristic] = useMutation(ADD_CHARACTERISTIC, {
    refetchQueries: [{ query: GET_CHATPODS_BY_ID, variables: { id: parseInt(id as string) } }],
    awaitRefetchQueries: true,
  });
  const handleUpdateChatbot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatbotName.trim()) {
      toast.error("Chatbot name cannot be empty");
      return;
    }
    try{
      const promise=updateChatpod({
        variables: {
          id: parseInt(id as string),
          name: chatbotName,
        },
      });
      toast.promise(promise, {
        loading: "Updating chatbot name...",
        success: "Chatbot name updated successfully",
        error: "Failed to update chatbot name",
      });
    } catch (error) {
      console.error("Error updating chatbot name:", error);
      toast.error("Failed to update chatbot name");
    }
  }

  const handleAddCharacteristic = async (content: string) => {
    try {
      const promise = addCharacteristic({
        variables: {
          chatbotId: parseInt(id as string),
          content,
        },
      });
      toast.promise(promise, {
        loading: "Adding characteristic...",
        success: "Characteristic added successfully",
        error: "Failed to add characteristic",
      });
    } catch (error) {
      console.error("Error adding characteristic:", error);
      toast.error("Failed to add characteristic");
    }
  };

  const handleDeleteChatbot = async (id: string) => {
    try {
      const isConfirmed = window.confirm("Are you sure you want to delete this chatbot?");
      if (!isConfirmed) return;

      await deleteChatbot({ variables: { id: parseInt(id) } });
      toast.success("Chatbot deleted successfully");
      router.push("/view-chatpods");
    } catch (error) {
      console.error("Error deleting chatbot:", error);
      toast.error("Failed to delete chatbot");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-pulse">
        <Avatar seed={chatbotName} className="w-20 h-20 mb-4" />
        <p className="text-gray-500">Loading chatbot details...</p>
      </div>
    );
  }

  if (error) return <p className="text-red-500 text-center">Error: {error.message}</p>;
  if (!data?.chatbots) return redirect("/view-chatbots");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-100 py-10 px-4 md:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Shareable Link */}
        <div className="bg-gradient-to-r from-indigo-700 via-purple-600 to-pink-600 rounded-2xl shadow-xl p-6 text-white space-y-3">
          <h2 className="text-xl font-bold">Link to Chat</h2>
          <p className="text-sm italic opacity-90">
            Share this link with customers to let them talk to your AI.
          </p>
          <div className="flex gap-2 items-center">
            <Input value={url} readOnly className="flex-1 bg-white text-black" />
            <Button
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(url);
                toast.success("Link copied to clipboard");
              }}
              className="bg-white text-indigo-700 hover:bg-indigo-100 font-semibold"
            >
              <Copy className="w-4 h-4 mr-2" /> Copy
            </Button>
          </div>
        </div>

        {/* Chatbot Details */}
      
        <section className="relative bg-white border border-gray-200 rounded-2xl shadow-md p-8 space-y-6">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 hover:bg-red-100"
            onClick={() => handleDeleteChatbot(id as string)}
          >
            <X className="text-gray-400 hover:text-red-500" />
          </Button>

          <div className="flex flex-col items-center gap-4">
            <Avatar seed={chatbotName} className="w-24 h-24 shadow-lg" />
            <form
              onSubmit={handleUpdateChatbot}
              className="flex w-full max-w-md gap-3"
            >
              <Input
                value={chatbotName}
                onChange={(e) => setChatbotName(e.target.value)}
                required
                className="flex-1"
              />
              <Button type="submit" disabled={!chatbotName.trim()}>
                Update
              </Button>
            </form>
          </div>

          <div>
            <h2 className="text-xl font-bold">Here&apos;s what your AI knows</h2>
            <p className="text-gray-600 mt-1">
              Add personalized information or behavior hints below.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddCharacteristic(newCharacteristic);
                setNewCharacteristic("");
              }}
              className="flex flex-col sm:flex-row items-center gap-3 mt-4"
            >
              <Input
                type="text"
                placeholder="E.g. If customer asks for refund, explain the policy"
                value={newCharacteristic}
                onChange={(e) => setNewCharacteristic(e.target.value)}
              />
              <Button type="submit" disabled={!newCharacteristic}>
                Add
              </Button>
            </form>
          </div>

          <ul className="flex flex-wrap gap-4 mt-6">
            {data.chatbots[0]?.chatbot_characteristics?.map((char) => (
              <Characteristic key={char.content} characteristic={char} />
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
