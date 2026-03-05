import React from 'react';

interface AISEOAnswerBlockProps {
    title: string;
    answer: string;
    citation?: {
        text: string;
        link: string;
    };
    id?: string;
}

/**
 * AISEOAnswerBlock - A highly extractable content block designed for AI SEO (AEO).
 * Optimized for snippet extraction by Google AI Overviews, ChatGPT, and Perplexity.
 */
const AISEOAnswerBlock: React.FC<AISEOAnswerBlockProps> = ({ title, answer, citation, id }) => {
    return (
        <section
            id={id}
            className="my-10 p-6 md:p-8 glass-panel border border-blue-100 dark:border-blue-900/30 rounded-2xl bg-gradient-to-br from-white/50 to-blue-50/30 dark:from-gray-900/50 dark:to-blue-900/10"
        >
            <h2 className="text-xl md:text-2xl font-bold font-outfit text-gray-900 dark:text-white mb-4 leading-tight">
                {title}
            </h2>
            <div className="prose prose-blue dark:prose-invert max-w-none">
                <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
                    {answer}
                </p>
                {citation && (
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-semibold">Source:</span>
                        <a
                            href={citation.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline transition-colors"
                        >
                            {citation.text}
                        </a>
                    </div>
                )}
            </div>
        </section>
    );
};

export default AISEOAnswerBlock;
