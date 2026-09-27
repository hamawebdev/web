// @ts-nocheck
import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { Providers } from "@/components/providers";
import Script from "next/script";
import { APP_URL } from "@/lib/config";
import { MobileSafetyGuard } from "@/components/mobile-safety-guard";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Med-ADN - The Largest Medical App in Algeria",
    template: "%s | Med-ADN"
  },
  description: "Join the largest medical community in Algeria with over 150k+ questions and 12k+ resources. Trusted by students from 10+ universities for residency exam preparation (Résidanat) and medical studies.",
  keywords: [
    "medical education algeria",
    "résidanat algerie",
    "medical students algeria",
    "qcm médecine",
    "faculté de médecine algerie",
    "residency exam preparation",
    "150k questions",
    "medical resources",
    "med-adn",
    "medical learning platform"
  ],
  authors: [{ name: "Med-ADN Team" }],
  creator: "Med-ADN",
  publisher: "Med-ADN",
  metadataBase: new URL(APP_URL),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Med-ADN - The #1 Medical Learning Platform in Algeria",
    description: "Access 150k+ questions and 12k+ resources. The trusted choice for medical students across 10+ Algerian universities for Résidanat and daily studies.",
    url: APP_URL,
    siteName: "Med-ADN",
    images: [
      {
        url: "/dashboard.webp",
        alt: "Med-ADN dashboard preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Med-ADN - Ace Your Medical Exams in Algeria",
    description: "Join thousands of students using Med-ADN. 150k+ QCMs, 12k+ resources, and comprehensive tools for medical success.",
    creator: "@medadn",
    images: ["/dashboard.webp"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "education",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${poppins.variable} font-sans antialiased min-h-screen min-h-[100dvh]`}>
        <Script id="theme-init" strategy="beforeInteractive">
          {`(function() {
              try {
                var storageKey = 'theme';
                var stored = localStorage.getItem(storageKey);
                // Support system theme detection - use system preference if no stored theme or 'system' is selected
                var theme;
                if (stored === 'system' || !stored) {
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  theme = prefersDark ? 'dark' : 'light';
                } else {
                  theme = stored;
                }
                var root = document.documentElement;
                
                // Ensure we always have a theme class applied
                root.classList.remove('light','dark');
                root.classList.add(theme);
                root.setAttribute('data-theme', theme);
                
                // Force a style recalculation to ensure CSS variables are available
                root.style.setProperty('--theme-initialized', '1');

                // Set immediate sidebar color for all platforms based on theme
                if (theme === 'dark') {
                  root.style.setProperty('--sidebar-immediate', 'hsl(0 0% 7.0588%)');
                } else {
                  root.style.setProperty('--sidebar-immediate', 'hsl(0 0% 98.8235%)');
                }
                // After a tick, refine immediate color to the computed --sidebar value if available
                setTimeout(function() {
                  try {
                    var computed = getComputedStyle(root).getPropertyValue('--sidebar');
                    if (computed && computed.trim()) {
                      root.style.setProperty('--sidebar-immediate', computed.trim());
                    }
                  } catch (e) { /* noop */ }
                }, 0);
                
                // Mobile device detection (broader than just iOS)
                var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
                
                if (isMobile) {
                  // Force reflow to ensure CSS variables are computed
                  root.offsetHeight;
                  // Force another reflow
                  root.offsetHeight;
                  
                  // Mobile safety timeout - ensure theme-ready is applied
                  setTimeout(function() {
                    if (!root.classList.contains('theme-ready')) {
                      root.classList.add('theme-ready');
                      console.warn('Mobile safety timeout: Force applied theme-ready');
                    }
                  }, 8000);
                }
                
                // Add a temporary class to prevent FOUC (Flash of Unstyled Content)
                root.classList.add('theme-ready');
              } catch (e) {
                // Enhanced fallback with mobile safety
                console.error('Theme initialization failed:', e);
                var root = document.documentElement;
                root.classList.add('light');
                root.setAttribute('data-theme', 'light');
                root.style.setProperty('--sidebar-immediate', 'hsl(0 0% 98.8235%)');
                root.classList.add('theme-ready');
                
                // Emergency mobile visibility restore
                setTimeout(function() {
                  root.style.visibility = 'visible';
                  root.style.setProperty('visibility', 'visible', 'important');
                }, 5000);
              }
            })();`}
        </Script>
        <Providers>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem={true}
            disableTransitionOnChange={true}
            storageKey="theme"
          >
            {children}

            <MobileSafetyGuard />
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
