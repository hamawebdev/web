'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { LiquidButton } from '@/components/animate-ui/primitives/buttons/liquid';

export default function Globe3D() {
  return (
    <section
      className="relative w-full overflow-hidden bg-background pt-32 pb-10 antialiased md:pt-20 md:pb-16"
    >
      {/* Decorative gradient accents */}
      <div
        className="absolute top-0 right-0 h-1/2 w-1/2"
        style={{
          background:
            'radial-gradient(circle at 70% 30%, hsla(354, 62%, 66%, 0.08) 0%, transparent 60%)',
        }}
      />
      <div
        className="absolute top-0 left-0 h-1/2 w-1/2 -scale-x-100"
        style={{
          background:
            'radial-gradient(circle at 70% 30%, hsla(354, 62%, 66%, 0.08) 0%, transparent 60%)',
        }}
      />

      <div className="relative z-10 container mx-auto max-w-2xl px-4 text-center md:max-w-4xl md:px-6 lg:max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <span className="mb-6 inline-block rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary">
            THE NEXT GENERATION OF MEDICAL EDUCATION
          </span>
          <h1 className="mx-auto mb-6 max-w-4xl text-4xl font-semibold text-foreground md:text-5xl lg:text-7xl">
            Master Medicine with{' '}
            <span className="text-primary">GPT5-PRO</span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground md:text-xl">
            MedADN combines the official curriculum with cutting-edge learning technology to help you achieve medical excellence with precision.
          </p>

          <div className="mb-10 flex flex-col items-center justify-center gap-4 sm:mb-0 sm:flex-row">
            <LiquidButton
              asChild
              className="w-full rounded-full [--liquid-button-background-color:var(--primary)] px-8 py-4 text-primary-foreground font-medium sm:w-auto"
            >
              <Link prefetch={false} href="/register">
                Get Started
              </Link>
            </LiquidButton>
            <a
              href="#features"
              className="flex w-full items-center justify-center gap-2 text-muted-foreground transition-colors hover:text-foreground sm:w-auto"
            >
              <span>Discover features</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m6 9 6 6 6-6"></path>
              </svg>
            </a>
          </div>
        </motion.div>
        <motion.div
          className="relative mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
        >
          <div className="relative z-10 mx-auto max-w-5xl overflow-hidden rounded-2xl shadow-[0_20px_60px_-15px_hsla(354,62%,66%,0.25)] border border-border/50">
            <img
              src="/dashboard.webp"
              alt="MedADN Dashboard"
              width={1920}
              height={1080}
              className="h-auto w-full"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
