import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function LegalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen flex-col bg-background">
            <Header />
            <main className="flex-1 pt-20 pb-16">
                <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-10">
                        {children}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
