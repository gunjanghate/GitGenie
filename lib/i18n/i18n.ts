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
        // TODO: Implement actual data fetching (e.g. headless CMS or local markdown/json)
        // E.g. fetch(API_URL, { next: { tags: [`${type}:${targetLocale}:${slug}`] } })
        // Currently returning null since no external dynamic content source is wired up.
        // It's safe to use this as a scaffold once a real database is attached.
        return null;
    };

    let content = await tryFetch(locale);
    if (!content && locale !== fallbackLocale) {
        content = await tryFetch(fallbackLocale);
    }

    return content;
}
