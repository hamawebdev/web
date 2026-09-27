import { APP_URL } from '@/lib/config';

export const JsonLd = () => {
    const jsonLd = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "SoftwareApplication",
                "name": "Med-ADN",
                "applicationCategory": "EducationalApplication",
                "operatingSystem": "Web",
                "offers": {
                    "@type": "Offer",
                    "price": "0",
                    "priceCurrency": "DZD"
                },
                "description": "Med-ADN is the largest medical education platform in Algeria, offering over 150k+ questions and 12k+ resources for medical students and residency exam preparation.",
                "aggregateRating": {
                    "@type": "AggregateRating",
                    "ratingValue": "4.8",
                    "ratingCount": "1200"
                }
            },
            {
                "@type": "Organization",
                "name": "Med-ADN",
                "url": APP_URL,
                "logo": `${APP_URL}/logo.png`,
                "sameAs": [
                    "https://www.facebook.com/medadn",
                    "https://twitter.com/medadn"
                ]
            },
            {
                "@type": "FAQPage",
                "mainEntity": [
                    {
                        "@type": "Question",
                        "name": "What are the available payment methods to purchase a Med-Adn subscription?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "The Med-Adn platform offers the following 3 payment methods: Payment by CCP (postal checking account), Payment via the BaridiMob application, and Purchase of an activation card from our points of sale."
                        }
                    },
                    {
                        "@type": "Question",
                        "name": "How to get the latest updates on Med-Adn?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Our team works daily to update the content of our Med-Adn platform throughout the academic year: The course list is updated according to the new official program. Current year exam questions are added, corrected, commented on, and organized by course, year, and exam period. All updates are automatically and freely included in your subscription."
                        }
                    },
                    {
                        "@type": "Question",
                        "name": "What is the content of the Med-Adn platform?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Med-Adn is an exercise and training platform aligned with the Algerian Faculty of Medicine program. It includes all questions from externship exams (MCQs, QROCs, Clinical Cases) and residency exams (since 2002) as well as other international sources. Everything is organized by course, modules, and exam types."
                        }
                    }
                ]
            }
        ]
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
    );
};
