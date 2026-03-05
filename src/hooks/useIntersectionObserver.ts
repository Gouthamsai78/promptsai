import { useEffect, useRef, useState, RefObject } from 'react';

interface UseIntersectionObserverArgs {
    root?: Element | null;
    rootMargin?: string;
    threshold?: number | number[];
    initialIsIntersecting?: boolean;
}

export function useIntersectionObserver(
    ref: RefObject<Element>,
    options: UseIntersectionObserverArgs = {}
): boolean {
    const [isIntersecting, setIsIntersecting] = useState(
        options.initialIsIntersecting ?? false
    );

    const observerRef = useRef<IntersectionObserver | null>(null);

    useEffect(() => {
        const targetElement = ref.current;
        if (!targetElement) return;

        if (observerRef.current) {
            observerRef.current.disconnect();
        }

        observerRef.current = new IntersectionObserver(([entry]) => {
            setIsIntersecting(entry.isIntersecting);
        }, options);

        observerRef.current.observe(targetElement);

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [ref, options.root, options.rootMargin, options.threshold]); // eslint-disable-line react-hooks/exhaustive-deps

    return isIntersecting;
}

export default useIntersectionObserver;
