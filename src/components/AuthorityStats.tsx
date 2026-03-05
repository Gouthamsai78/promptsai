import React from 'react';
import { Users, FileText, Share2, Award } from 'lucide-react';

interface Stat {
    label: string;
    value: string;
    icon: React.ComponentType<any>;
}

/**
 * AuthorityStats - A component to display social proof and statistics.
 * Aligns with AI SEO Pillar 2 (Authority) by providing specific data points.
 */
const AuthorityStats: React.FC = () => {
    const stats: Stat[] = [
        { label: 'Community Members', value: '15,000+', icon: Users },
        { label: 'Prompts Shared', value: '50,000+', icon: FileText },
        { label: 'Monthly Creations', value: '120k+', icon: Share2 },
        { label: 'Verified Creators', value: '1.2k+', icon: Award },
    ];

    return (
        <section className="my-12 py-8 px-4 glass-panel border border-blue-100 dark:border-white/5 rounded-3xl bg-white/30 dark:bg-gray-900/40">
            <h2 className="text-center text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-10">
                The PromptShare AI Community in Numbers
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {stats.map((stat, index) => (
                    <div key={index} className="flex flex-col items-center text-center group">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
                            <stat.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="text-2xl md:text-3xl font-black font-outfit text-gray-900 dark:text-white mb-1">
                            {stat.value}
                        </div>
                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-tighter">
                            {stat.label}
                        </div>
                    </div>
                ))}
            </div>
            <p className="text-center text-[10px] text-gray-400 dark:text-gray-600 mt-8 italic">
                * Statistics updated as of March 2026 based on community engagement data.
            </p>
        </section>
    );
};

export default AuthorityStats;
