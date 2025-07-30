import React from 'react';
import { motion } from 'framer-motion';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <motion.div
        className="w-16 h-16 border-4 border-night-accent border-t-transparent rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
      <p className="text-night-text-secondary">Loading your universe...</p>
    </div>
  );
};

export default LoadingSpinner; 