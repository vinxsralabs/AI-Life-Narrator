import React from 'react';
import { motion } from 'framer-motion';

const AnimatedBackground: React.FC = () => {
  return (
    <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden bg-night-bg">
      {/* Stars */}
      {[...Array(50)].map((_, i) => (
        <motion.div
          key={`star-${i}`}
          className="absolute rounded-full bg-white"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            width: `${Math.random() * 2 + 1}px`,
            height: `${Math.random() * 2 + 1}px`,
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: Math.random() * 3 + 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}
      {/* Moon */}
      <motion.div
        className="absolute top-[10%] right-[10%] w-24 h-24 rounded-full bg-white/10 shadow-[0_0_40px_10px_rgba(255,255,255,0.1)]"
        animate={{
          y: [0, -10, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      {/* Clouds */}
      <motion.div
        className="absolute top-0 left-0 w-full h-full opacity-20"
        style={{
          backgroundImage: 'url(https://www.transparenttextures.com/patterns/fog.png)',
        }}
        animate={{
          x: ['-20%', '20%'],
        }}
        transition={{
          duration: 60,
          repeat: Infinity,
          repeatType: 'reverse',
          ease: 'linear',
        }}
      />
    </div>
  );
};

export default AnimatedBackground; 