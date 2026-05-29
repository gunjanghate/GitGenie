export interface LocalizedContentParams {
    type: string;
    slug: string;
    locale: string;
    fallbackLocale?: string;
}

/**
 * Fetch dynamic translated content.
 * Falls back to English (or the defined fallback) if missing.
 */
export async function getLocalizedContent({
    type,
    slug,
    locale,
    fallbackLocale = "en"
}: LocalizedContentParams) {
    // Simulating an external data source fetch handling
    const tryFetch = async (targetLocale: string) => {
        try {
            // Dummy check since we don't have a real CMS attached in this repo.
            // E.g. fetch(API_URL, { next: { tags: [`${type}:${targetLocale}:${slug}`] } })
            // For demonstration, we'll try to dynamically import local static JSON if it exists,
            // or return null simulating a missing record.
            return null;
        } catch {
            return null;
        }
    };

    let content = await tryFetch(locale);
    if (!content && locale !== fallbackLocale) {
        content = await tryFetch(fallbackLocale);
    }

    return content;
}
