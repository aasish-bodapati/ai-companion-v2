'use client';

import { useState } from 'react';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

interface FloatingActionButtonProps {
  onOpen: () => void;
  isOpen?: boolean;
  className?: string;
}

export default function FloatingActionButton({ 
  onOpen, 
  isOpen = false, 
  className = '' 
}: FloatingActionButtonProps) {
  return (
    <motion.button
      onClick={onOpen}
      className={`fixed bottom-20 right-4 z-40 w-14 h-14 bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={isOpen ? 'close' : 'plus'}
          initial={{ rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          exit={{ rotate: 90, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {isOpen ? (
            <XMarkIcon className="h-6 w-6" />
          ) : (
            <PlusIcon className="h-6 w-6" />
          )}
        </motion.div>
      </AnimatePresence>
    </motion.button>
  );
}
