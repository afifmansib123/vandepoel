"use client";

import React from "react";
import { motion } from "framer-motion";

const TokenLoadingAnimation = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Background animated gradient */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute inset-0 opacity-30"
          animate={{
            background: [
              "radial-gradient(circle at 20% 50%, rgba(220, 40, 40, 0.3) 0%, transparent 50%)",
              "radial-gradient(circle at 80% 50%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)",
              "radial-gradient(circle at 50% 80%, rgba(220, 40, 40, 0.3) 0%, transparent 50%)",
              "radial-gradient(circle at 20% 50%, rgba(220, 40, 40, 0.3) 0%, transparent 50%)",
            ],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Rotating token/coin stack */}
        <div className="relative w-32 h-32 mb-8">
          {/* Main center token */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{
              rotateY: [0, 360],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 shadow-2xl flex items-center justify-center border-4 border-yellow-300">
              <span className="text-3xl font-bold text-white">$</span>
            </div>
          </motion.div>

          {/* Orbiting tokens */}
          {[0, 120, 240].map((angle, index) => (
            <motion.div
              key={index}
              className="absolute inset-0 flex items-center justify-center"
              animate={{
                rotate: [angle, angle + 360],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "linear",
                delay: index * 0.3,
              }}
            >
              <motion.div
                className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 shadow-lg flex items-center justify-center border-2 border-blue-300"
                style={{
                  position: "absolute",
                  top: -20,
                }}
                animate={{
                  scale: [1, 1.2, 1],
                  rotateY: [0, 360],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: index * 0.2,
                }}
              >
                <span className="text-sm font-bold text-white">₮</span>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* AssetXToken branding */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <h2 className="text-4xl font-bold text-white mb-2">
            Asset<span className="text-secondary-500">X</span>Token
          </h2>
          <p className="text-gray-400 text-sm">Tokenizing Real Estate</p>
        </motion.div>

        {/* Loading progress dots */}
        <div className="flex gap-2 mt-8">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-3 h-3 rounded-full bg-secondary-500"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>

        {/* Loading text */}
        <motion.p
          className="text-gray-400 mt-4 text-sm"
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        >
          Loading your tokenized marketplace...
        </motion.p>
      </div>

      {/* Floating coin particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 border border-yellow-500/30"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.random() * 20 - 10, 0],
            opacity: [0, 0.6, 0],
            scale: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: i * 0.5,
          }}
        />
      ))}
    </div>
  );
};

export default TokenLoadingAnimation;
