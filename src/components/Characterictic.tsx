'use client';

import React, { useState } from "react";
import { useMutation } from "@apollo/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, Trash2, Loader2 } from "lucide-react";

// Assuming these are defined in your project
import { ChatbotCharacteristic } from "../../types/types";
import { REMOVE_CHARACTERISTIC } from "../../graphql/mutations/mutations";

/**
 * A professional, animated component to display a single chatbot characteristic.
 * It features a clean design, smooth entry/exit animations, and a clear
 * user interaction for deletion.
 * * IMPORTANT: For the exit animation to work correctly, the list of these
 * components must be wrapped in an <AnimatePresence> tag in the parent component.
 * e.g.,
 * <AnimatePresence>
 * {characteristics.map(char => <Characteristic key={char.id} ... />)}
 * </AnimatePresence>
 */
function Characteristic({
  characteristic,
}: {
  characteristic: ChatbotCharacteristic;
}) {
  const [isHovered, setIsHovered] = useState(false);

  // The useMutation hook provides the loading state, which is crucial for UI feedback.
  const [removeCharacteristic, { loading: isDeleting }] = useMutation(REMOVE_CHARACTERISTIC, {
    // We optimistically refetch the list to keep it in sync.
    refetchQueries: ["GetChatbotById"],
    onError: (error) => {
      // Provide specific feedback on failure.
      toast.error(`Failed to remove: ${error.message}`);
    }
  });
  

  const handleDelete = () => {
    // Prevent multiple deletion requests while one is in progress.
    if (isDeleting) return;

    const promise = removeCharacteristic({
      variables: {
        id: characteristic.id,
      },
    });

    // Use toast.promise for a clean loading/success/error state notification.
    toast.promise(promise, {
      loading: "Removing characteristic...",
      success: "Characteristic removed!",
      error: "Failed to remove characteristic.",
    });
  };

  const itemVariants = {
    initial: { opacity: 0, y: 20, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { type: "tween", stiffness: 300, damping: 25 } as const },
    exit: { opacity: 0, x: -50, transition: { duration: 0.3 } },
  };

  return (
    <motion.li
      layout // This prop enables smooth reordering of the list when an item is deleted.
      variants={itemVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-lg shadow-sm transition-shadow duration-300 hover:shadow-md"
    >
      <div className="flex-shrink-0 p-2 bg-blue-100 text-blue-600 rounded-full">
        <Lightbulb className="w-5 h-5" />
      </div>
      
      <p className="flex-grow text-slate-700 text-sm leading-relaxed">
        {characteristic.content}
      </p>

      <div className="relative w-8 h-8">
        <AnimatePresence>
          {isHovered && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              onClick={handleDelete}
              disabled={isDeleting}
              className="absolute inset-0 flex items-center justify-center w-8 h-8 bg-red-100 text-red-600 rounded-full transition-colors hover:bg-red-200 disabled:cursor-not-allowed disabled:bg-slate-200"
              aria-label="Remove characteristic"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.li>
  );
}

export default Characteristic;
