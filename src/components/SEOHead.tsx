import { useEffect } from 'react';

interface SEOHeadProps {
    title?: string;
    description?: string;
    keywords?: string[];
    image?: string;
    url?: string;
    type?: 'website' | 'article';
}

/**
 * SEOHead - Dynamically sets document title and meta tags for SEO.
 * Use this component in pages/components that need unique SEO settings.
 */
const SEOHead: React.FC<SEOHeadProps> = ({
    title = 'PromptShare AI - Universal AI Prompt Platform',
    description = 'Discover, share, and enhance AI prompts for Nano Banana, Gemini, Midjourney, ChatGPT, DALL-E, and more. The ultimate AI prompt community.',
    keywords = ['AI prompts', 'Nano Banana', 'Gemini AI', 'prompt engineering', 'AI image generation', 'ChatGPT prompts', 'Midjourney prompts'],
    image = '/og-image.png',
    url,
    type = 'website',
}) => {
    useEffect(() => {
        // Set document title
        document.title = title;

        // Helper to set or create meta tag
        const setMeta = (name: string, content: string, property = false) => {
            const attr = property ? 'property' : 'name';
            let meta = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
            if (!meta) {
                meta = document.createElement('meta');
                meta.setAttribute(attr, name);
                document.head.appendChild(meta);
            }
            meta.setAttribute('content', content);
        };

        // Standard meta tags
        setMeta('description', description);
        setMeta('keywords', keywords.join(', '));

        // Canonical URL
        const currentUrl = url || window.location.origin + window.location.pathname;
        let canonical = document.querySelector('link[rel="canonical"]');
        if (!canonical) {
            canonical = document.createElement('link');
            canonical.setAttribute('rel', 'canonical');
            document.head.appendChild(canonical);
        }
        canonical.setAttribute('href', currentUrl);

        // Open Graph tags
        setMeta('og:title', title, true);
        setMeta('og:description', description, true);
        setMeta('og:type', type, true);
        if (image) setMeta('og:image', image, true);
        if (url) setMeta('og:url', currentUrl, true);

        // Twitter Card tags
        setMeta('twitter:card', 'summary_large_image');
        setMeta('twitter:title', title);
        setMeta('twitter:description', description);
        if (image) setMeta('twitter:image', image);

    }, [title, description, keywords, image, url, type]);

    return null; // This component doesn't render anything
};

export default SEOHead;
