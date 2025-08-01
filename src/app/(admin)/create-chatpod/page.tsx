'use client'
import Avatar from "@/components/Avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMutation } from "@apollo/client";
import client from "../../../../graphql/apollo-client";
import { CREATE_CHATBOT } from "../../../../graphql/mutations/mutations";
import { useUser } from "@clerk/nextjs";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

import { useTransition } from "react";

function CreateChatpods() {
  const { user } = useUser();
  const [name, setName] = useState("");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [Createchatpods] = useMutation(CREATE_CHATBOT, {
    client,
    variables: {
      clerk_user_id: user?.id,
      name,
    },
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      try {
        const { data } = await Createchatpods();
        console.log("CreateChatBot data:", data);
        setName("");
        router.push(`/edit-chatpod/${data.insert_chatbots.returning[0].id}`);
      } catch (error) {
        console.error("Error while calling CreateChatBot:", error);
      }
    });
  };

  return (
    <div className="flex flex-col items-center gap-2 justify-center md:flex-row md:space-x-10 bg-white p-10 rounded-md m-10">
      <Avatar seed="create-chatpod" />
      <div>
        <h1 className="text-xl lg:text-3xl font-semibold">Create</h1>
        <h2 className="font-light">
          Create a new chatpod to assist you in your conversation with your customer
        </h2>
        <form onSubmit={handleSubmit}>
          <Input
            placeholder="Chatbot Name..."
            className="max-w-lg mb-1"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="flex justify-center">
            <Button type="submit" disabled={isPending || !name}>
              {isPending ? "Creating Chatbot..." : "Create Chatpod"}
            </Button>
          </div>
        </form>
        <p className="text-gray-400 text-sm mt-2">Example: Customer Chatbot</p>
      </div>
    </div>
  );
}

export default CreateChatpods;
