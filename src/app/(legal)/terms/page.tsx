
export const metadata = {
    title: 'Terms of Service - Med-ADN',
    description: 'Terms of Service for Med-ADN. Read our terms and conditions for using our medical exam preparation platform.',
};

export default function TermsPage() {
    return (
        <article className="prose prose-slate max-w-none dark:prose-invert">
            <div className="mb-8 border-b pb-8">
                <h1 className="mb-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                    Terms of Service
                </h1>
                <p className="text-muted-foreground">
                    Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
            </div>

            <section className="space-y-6">
                <div>
                    <h2>1. Acceptance of Terms</h2>
                    <p>
                        By accessing or using the Med-ADN platform, including creating an account via Email or Google OAuth, you agree to be bound by these Terms of Service and our Privacy Policy.
                        If you disagree with any part of the terms, you may not access the service.
                    </p>
                </div>

                <div>
                    <h2>2. Description of Service</h2>
                    <p>
                        Med-ADN provides a medical exam preparation platform designed to help students prepare for their exams through practice questions, quizzes, and progress tracking.
                        We reserve the right to modify, suspend, or discontinue the service at any time, with or without notice.
                    </p>
                </div>

                <div>
                    <h2>3. User Accounts</h2>
                    <p>
                        To access certain features of the platform, you must create an account. You agree to provide accurate, current, and complete information during the registration process.
                        You are responsible for safeguarding the password that you use to access the service and for any activities or actions under your password.
                    </p>
                </div>

                <div>
                    <h2>4. Intellectual Property</h2>
                    <p>
                        The service and its original content, features, and functionality are and will remain the exclusive property of Med-ADN.
                        This includes, but is not limited to, all medical exam questions, explanations, text, graphics, logos, and software code.
                    </p>
                    <p>
                        Our content is protected by copyright, trademark, and other laws. You may not reproduce, distribute, modify, create derivative works of, publicly display, publicly perform, republish, download, store, or transmit any of the material on our platform, except as follows:
                    </p>
                    <ul>
                        <li>Your computer may temporarily store copies of such materials in RAM incidental to your accessing and viewing those materials.</li>
                        <li>You may store files that are automatically cached by your Web browser for display enhancement purposes.</li>
                    </ul>
                </div>

                <div>
                    <h2>5. User Conduct</h2>
                    <p>
                        You agree not to use the service:
                    </p>
                    <ul>
                        <li>In any way that violates any applicable national or international law or regulation.</li>
                        <li>To impersonate or attempt to impersonate Med-ADN, a Med-ADN employee, another user, or any other person or entity.</li>
                        <li>To engage in any other conduct that restricts or inhibits anyone's use or enjoyment of the service.</li>
                    </ul>
                    <p>
                        <strong>Specifically, you agree not to:</strong>
                    </p>
                    <ul>
                        <li>Use any robot, spider, or other automatic device, process, or means to access the service for any purpose, including monitoring or copying any of the material on the service (Scraping).</li>
                        <li>Share your account credentials with others to allow unauthorized access to the platform.</li>
                        <li>Attempt to gain unauthorized access to, interfere with, damage, or disrupt any parts of the service, the server on which the service is stored, or any server, computer, or database connected to the service.</li>
                    </ul>
                </div>

                <div>
                    <h2>6. Termination</h2>
                    <p>
                        We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
                        Upon termination, your right to use the service will immediately cease.
                    </p>
                </div>

                <div>
                    <h2>7. Contact Us</h2>
                    <p>
                        If you have any questions about these Terms, please contact us at <a href="mailto:support@med-adn.com" className="text-primary hover:underline">support@med-adn.com</a>.
                    </p>
                </div>
            </section>
        </article>
    );
}
