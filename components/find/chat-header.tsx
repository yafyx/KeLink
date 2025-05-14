"use client";

import { MessageSquare } from "lucide-react";
import { motion } from "framer-motion";

interface ChatHeaderProps {
  toggleExpanded: () => void;
}

export function ChatHeader({ toggleExpanded }: ChatHeaderProps) {
  return (
    <motion.div
      className="flex items-center justify-between p-3 border-b"
      layout
      initial={{ opacity: 0.8 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4" />
        <span className="font-medium">KeliLink Ask</span>
      </div>
    </motion.div>
  );
}
