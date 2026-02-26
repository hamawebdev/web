'use client';

import { Instrument_Serif } from 'next/font/google';
import { cn } from '@/lib/utils';
import { Check, Crown, Zap, Clock, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const serif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
});

export default function DesignerPricing() {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState({
    days: 7,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    // Set deadline to 7 days from now (static for this implementation to ensure availability)
    const calculateTimeLeft = () => {
      // Hardcoded date relative to implementation: 2026-02-18
      const deadline = new Date('2026-02-18T23:59:59');
      const now = new Date();
      const difference = deadline.getTime() - now.getTime();

      if (difference > 0) {
        return {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        };
      }
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    };

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative min-h-full w-full bg-background font-sans text-foreground antialiased">
      <section className="relative mr-auto ml-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-20 lg:px-8">
        <div className="mb-10 text-center sm:mb-16 lg:mb-20">
          <h1 className="mb-4 text-3xl leading-tight font-bold tracking-tight sm:text-4xl lg:text-6xl">
            <span
              className={cn(
                'text-4xl sm:text-5xl font-normal tracking-tight text-primary',
                serif.className,
              )}
            >
              Unlock Your
            </span>
            <br />
            <span
              className={cn(
                'text-5xl sm:text-6xl lg:text-7xl font-normal tracking-tight text-foreground',
                serif.className,
              )}
            >
              Academic Potential
            </span>
          </h1>
          <p className="mr-auto ml-auto max-w-3xl text-sm text-muted-foreground sm:text-base md:text-lg">
            Join thousands of successful students with our comprehensive preparation platforms.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8 mb-12 lg:mb-16">
          {/* Card A: All Years Pass */}
          <article className="relative flex flex-col rounded-2xl border-2 border-border bg-card p-6 transition-all duration-300 hover:border-primary lg:p-10">
            <div className="mb-8 flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-primary fill-current" />
                <span className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                  Standard
                </span>
              </div>
              <span className="rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary uppercase sm:px-5 sm:py-2 sm:text-base">
                30% OFF
              </span>
            </div>

            <div className="mb-8">
              <h2 className="mb-3 text-3xl leading-tight font-medium lg:text-3xl">
                All Years Pass
              </h2>

            </div>

            <div className="mb-8">
              <div className="mb-2 flex items-center gap-3">
                <span className="text-2xl text-muted-foreground line-through font-medium">
                  1,800 DA
                </span>
                <span className="text-4xl font-bold tracking-tight lg:text-5xl text-primary">
                  1,200 DA<span className="text-lg font-medium text-muted-foreground ml-1">/ year</span>
                </span>
              </div>

            </div>

            <div className="mb-8 flex flex-col gap-3">
              <button
                onClick={() => router.push('/register')}
                className="w-full rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90 shadow-lg shadow-primary/20 cursor-pointer"
              >
                Get Started
              </button>
            </div>

            <hr className="mb-8 border-border" />

            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                <span>
                  <strong>Access to all university levels</strong>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                <span>
                  <strong>250k+ Questions</strong> including QCMs & cases
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                <span>
                  <strong>10k+ Resources</strong> & study materials
                </span>
              </li>

            </ul>
          </article>

          {/* Card B: Residency Elite */}
          <article className="dark relative z-10 flex flex-col rounded-2xl border-2 border-border bg-card p-6 text-foreground transition-all duration-300 lg:scale-110 lg:p-10 shadow-2xl shadow-black/20">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 transform">
              <div className="rounded-full bg-[image:var(--primary-gradient)] px-6 py-2 text-xs font-bold text-white uppercase tracking-wider shadow-lg">
                Most Popular
              </div>
            </div>

            <div className="mt-4 mb-8 flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-500 fill-current" />
                <span className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                  Elite
                </span>
              </div>
              <span className="rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary uppercase sm:px-5 sm:py-2 sm:text-base">
                40% OFF
              </span>
            </div>

            <div className="mb-8">
              <h2 className="mb-3 text-2xl leading-tight font-medium lg:text-3xl bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground">
                Residency Elite
              </h2>

            </div>

            <div className="mb-8">
              <div className="mb-2 flex items-center gap-3">
                <span className="text-2xl text-muted-foreground line-through font-medium">
                  12,500 DA
                </span>
                <span className="text-4xl font-bold tracking-tight lg:text-5xl text-foreground">
                  7,500 DA<span className="text-lg font-medium text-muted-foreground ml-1">/ year</span>
                </span>
              </div>

            </div>

            <div className="mb-8 flex flex-col gap-3">
              <button
                onClick={() => router.push('/register')}
                className="w-full rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition-all duration-200 hover:bg-foreground/90 shadow-lg hover:scale-105 cursor-pointer"
              >
                Become Elite
              </button>
            </div>

            <hr className="mb-8 border-border" />

            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-400" />
                <span className="text-foreground">
                  <strong>Everything in All Years Pass</strong>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-400" />
                <span className="text-foreground">
                  <strong>All Residency Exams</strong> (All years/universities)
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-400" />
                <span className="text-foreground">
                  <strong>Advanced Analytics</strong> & Performance Tracking
                </span>
              </li>

            </ul>
          </article>
        </div>

        {/* FOMO Component */}
        <div className="dark relative mx-auto max-w-5xl overflow-hidden rounded-xl bg-background p-1 shadow-2xl lg:rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/50 to-primary opacity-20 animate-pulse"></div>
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 rounded-lg bg-card/90 backdrop-blur-sm px-4 py-8 md:px-10 md:py-8 border border-border shadow-xl">
            <div className="flex flex-col gap-2 text-center md:text-left max-w-md">
              <div className="flex items-center justify-center md:justify-start gap-2 text-primary">
                <Clock className="w-4 h-4 animate-bounce" />
                <span className="font-bold tracking-widest uppercase text-[10px] sm:text-xs">Limited Time Offer</span>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-foreground md:text-4xl">
                Exclusive Launch Discount
              </h3>
              <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                Secure your premium access at these prices before the offer expires. Don't miss the chance to upgrade your career.
              </p>
            </div>

            <div className="flex gap-3 sm:gap-4 text-foreground">
              {[
                { label: 'Days', value: timeLeft.days },
                { label: 'Hours', value: timeLeft.hours },
                { label: 'Mins', value: timeLeft.minutes },
                { label: 'Secs', value: timeLeft.seconds }
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col items-center group">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-muted rounded-xl flex items-center justify-center border border-border shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] group-hover:border-primary/50 transition-colors">
                    <span className="text-2xl sm:text-4xl font-bold font-mono text-foreground tabular-nums">
                      {String(item.value).padStart(2, '0')}
                    </span>
                  </div>
                  <span className="text-[10px] sm:text-xs mt-2 text-muted-foreground uppercase tracking-wider font-semibold group-hover:text-primary transition-colors">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
