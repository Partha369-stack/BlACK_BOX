import { useEffect } from 'react';

/**
 * Hook to update the document title based on the current page.
 * @param title The title to set for the page.
 */
export const usePageTitle = (title: string) => {
    useEffect(() => {
        document.title = title;
    }, [title]);
};
