// @ts-nocheck
"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export function Hero() {
  return (
    <section className="relative w-full bg-white overflow-hidden pt-20 pb-12 md:pb-16 lg:pb-20">
      <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16">
        <div className="flex flex-col items-center justify-center min-h-[60vh] md:min-h-[70vh] space-y-6 md:space-y-8 lg:space-y-10">
          {/* Tagline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-center"
          >
            <p
              className="text-sm md:text-base font-normal"
              style={{ 
                fontFamily: 'var(--font-sans)',
                color: '#4A5568'
              }}
            >
              For creatives & agencies
            </p>
          </motion.div>

          {/* Hero Text (Title) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center px-4"
          >
            <h1
              className="font-normal text-black"
              style={{ 
                fontFamily: 'var(--font-sans)',
                fontSize: 'clamp(32px, 5vw, 58px)',
                lineHeight: 'clamp(35px, 5.5vw, 63.8px)',
                letterSpacing: '-2.9px',
                fontWeight: 400
              }}
            >
              Build yourdream site with sapphire
            </h1>
          </motion.div>

          {/* Hero Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center px-4"
          >
            <p
              className="font-normal mx-auto"
              style={{ 
                fontFamily: 'var(--font-sans)',
                fontSize: 'clamp(14px, 2vw, 16px)',
                lineHeight: '24px',
                fontWeight: 400,
                maxWidth: '400px',
                minHeight: 'clamp(40px, 8vw, 48px)',
                color: '#4A5568'
              }}
            >
              Made for agencies and creatives, designed to showcase your work with a polished, professional look.
            </p>
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex justify-center mt-2"
          >
            <Link href="#contact" aria-label="Explore">
              <button
                type="button"
                className="flex justify-center gap-2 items-center mx-auto shadow-xl text-lg backdrop-blur-md lg:font-semibold isolation-auto before:absolute before:w-full before:transition-all before:duration-700 before:hover:w-full before:-left-full before:hover:left-0 before:rounded-full before:bg-emerald-500 hover:text-primary-foreground before:-z-10 before:aspect-square before:hover:scale-150 before:hover:duration-700 relative z-10 px-4 py-2 overflow-hidden border-2 rounded-full group text-white"
                style={{
                  fontFamily: 'var(--font-sans)',
                  backgroundColor: 'hsl(var(--primary))',
                  borderColor: 'hsl(var(--primary))'
                }}
                aria-label="Explore"
              >
                Explore
                <svg
                  className="w-8 h-8 justify-end group-hover:rotate-90 group-hover:bg-background ease-linear duration-300 rounded-full border group-hover:border-none p-2 rotate-45"
                  style={{
                    color: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--background))'
                  }}
                  viewBox="0 0 16 19"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M7 18C7 18.5523 7.44772 19 8 19C8.55228 19 9 18.5523 9 18H7ZM8.70711 0.292893C8.31658 -0.0976311 7.68342 -0.0976311 7.29289 0.292893L0.928932 6.65685C0.538408 7.04738 0.538408 7.68054 0.928932 8.07107C1.31946 8.46159 1.95262 8.46159 2.34315 8.07107L8 2.41421L13.6569 8.07107C14.0474 8.46159 14.6805 8.46159 15.0711 8.07107C15.4616 7.68054 15.4616 7.04738 15.0711 6.65685L8.70711 0.292893ZM9 18L9 1H7L7 18H9Z"
                    style={{ fill: 'hsl(var(--background))' }}
                    className="group-hover:fill-background"
                  />
                </svg>
              </button>
            </Link>
          </motion.div>

          {/* Multimedia Container - Pill/Oval Shape */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="w-full max-w-6xl mt-12 md:mt-16 lg:mt-20 px-4"
          >
            <div className="relative w-full overflow-hidden border-2 border-white rounded-full shadow-lg" style={{ aspectRatio: '16/7' }}>
              <video
                className="absolute inset-0 w-full h-full object-cover"
                autoPlay
                loop
                muted
                playsInline
              >
                <source src="/sapphire.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
