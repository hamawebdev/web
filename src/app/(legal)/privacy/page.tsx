
import Link from 'next/link';

export const metadata = {
    title: 'Privacy Policy - Med-ADN',
    description: 'Privacy Policy for Med-ADN. Learn how we collect, use, and protect your data.',
};

export default function PrivacyPage() {
    return (
        <article className="prose prose-slate max-w-none dark:prose-invert">
            <div className="mb-8 border-b pb-8">
                <h1 className="mb-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                    Privacy Policy
                </h1>
                <p className="text-muted-foreground">
                    Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
            </div>

            <section className="space-y-6">
                <div>
                    <h2>1. Introduction</h2>
                    <p>
                        Welcome to Med-ADN ("we," "our," or "us"). We are committed to protecting your privacy and ensuring you have a positive experience on our platform.
                        This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website med-adn.com and use our medical exam preparation services.
                    </p>
                </div>

                <div>
                    <h2>2. Information We Collect</h2>
                    <p>
                        We collect information that you voluntarily provide to us when you register on the platform, express an interest in obtaining information about us or our products and services, or otherwise contact us.
                    </p>
                    <h3>Google OAuth Disclosure</h3>
                    <p>
                        Our application uses Google OAuth to allow you to sign in easily. When you choose to sign in with Google, we access your basic profile information, specifically your <strong>name</strong> and <strong>email address</strong>.
                        We use this information solely to create your user account, authenticate your identity, and communicate with you regarding your account and our services.
                    </p>
                </div>

                <div>
                    <h2>3. How We Use Your Information</h2>
                    <p>
                        We use the information we collect or receive:
                    </p>
                    <ul>
                        <li>To facilitate account creation and logon process.</li>
                        <li>To provide and manage your access to our medical exam preparation content.</li>
                        <li>To track your progress on exams and quizzes to help you improve your learning.</li>
                        <li>To send you administrative information, such as product, service, and new feature information and/or information about changes to our terms, conditions, and policies.</li>
                    </ul>
                    <p className="font-medium">
                        We do not sell, rent, or trade your personal information to third parties for marketing purposes.
                    </p>
                </div>

                <div>
                    <h2>4. Google API Services User Data Policy</h2>
                    <div className="rounded-lg bg-muted p-4 border border-border">
                        <p className="mb-0 font-medium">
                            Med-ADN's use and transfer to any other app of information received from Google APIs will adhere to
                            <Link href="https://developers.google.com/terms/api-services-user-data-policy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer"> Google API Services User Data Policy</Link>,
                            including the Limited Use requirements.
                        </p>
                    </div>
                </div>

                <div>
                    <h2>5. Data Storage and Security</h2>
                    <p>
                        We use administrative, technical, and physical security measures to help protect your personal information.
                        Your data, including your exam progress and account details, is stored securely on our servers.
                        While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.
                    </p>
                </div>

                <div>
                    <h2>6. Contact Us</h2>
                    <p>
                        If you have questions or comments about this policy, you may email us at <a href="mailto:support@med-adn.com" className="text-primary hover:underline">support@med-adn.com</a>.
                    </p>
                </div>
            </section>
        </article>
    );
}
