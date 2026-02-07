// @ts-nocheck
import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
  import { Providers } from "@/components/providers";
  import Script from "next/script";
  import { FrontextInit } from "@/components/frontext-init";
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
    title: "Med-ADN - Trusted Medical Education Platform",
    description: "Comprehensive medical learning platform designed by healthcare professionals with evidence-based content, detailed analytics, and collaborative study tools for medical students.",
    keywords: "medical education, medical students, USMLE, MCAT, medical learning platform, evidence-based learning, medical questions bank",
    authors: [{ name: "Med-ADN Team" }],
    creator: "Med-ADN",
    metadataBase: new URL("https://med-adn.com"),
    openGraph: {
      title: "Med-ADN - Trusted Medical Education Platform",
      description: "Comprehensive medical learning platform designed by healthcare professionals with evidence-based content and collaborative study tools.",
      url: "https://med-adn.com",
      siteName: "Med-ADN",
      images: [
        {
          url: "/og-image.jpg",
          width: 1200,
          height: 630,
          alt: "Med-ADN - Medical Education Platform",
        },
      ],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Med-ADN - Trusted Medical Education Platform",
      description: "Comprehensive medical learning platform designed by healthcare professionals with evidence-based content and collaborative study tools.",
      images: ["/og-image.jpg"],
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
              <FrontextInit/>
              {children}
     
              <MobileSafetyGuard />
            </ThemeProvider>
          </Providers>
        </body>
    </html>
  );
}
