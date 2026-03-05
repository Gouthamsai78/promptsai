import React from 'react';

interface FAQ {
    question: string;
    answer: string;
}

interface FAQSectionProps {
    faqs: FAQ[];
    title?: string;
}

/**
 * FAQSection - SEO-optimized FAQ component with JSON-LD schema for AI extraction.
 */
const FAQSection: React.FC<FAQSectionProps> = ({ faqs, title = "Frequently Asked Questions" }) => {
    // Generate JSON-LD schema
    const schema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqs.map(faq => ({
            "@type": "Question",
            "name": faq.question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer
            }
        }))
    };

    return (
        <section className="my-12 px-4 max-w-2xl mx-auto">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
            />

            <h2 className="text-2xl md:text-3xl font-bold font-outfit text-gray-900 dark:text-white mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                {title}
            </h2>

            <div className="space-y-4">
                {faqs.map((faq, index) => (
                    <div
                        key={index}
                        className="p-5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 hover:bg-white dark:hover:bg-gray-900 transition-all duration-300 shadow-sm"
                    >
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-start gap-3">
                            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs">Q</span>
                            {faq.question}
                        </h3>
                        <div className="text-gray-600 dark:text-gray-400 pl-9 leading-relaxed">
                            {faq.answer}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default FAQSection;
