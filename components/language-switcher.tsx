'use client';

import { useTransition } from 'react';
import { useRouter, usePathname } from '@/lib/i18n/routing';
import { useLocale } from 'next-intl';

export default function LanguageSwitcher() {
    const [isPending, startTransition] = useTransition();
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();

    function onSelectChange(event: React.ChangeEvent<HTMLSelectElement>) {
        const nextLocale = event.target.value;
        startTransition(() => {
            router.replace(pathname, { locale: nextLocale });
        });
    }

    return (
        <select
            value={locale}
            disabled={isPending}
            onChange={onSelectChange}
            className="appearance-none flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 pr-8 text-sm font-medium text-white transition-all duration-200 hover:bg-white/10 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22white%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[length:1em] bg-[position:right_0.6rem_center]"
            aria-label="Language Switcher"
        >
            <option value="en" className="bg-zinc-900 text-white font-medium">EN</option>
            <option value="hi" className="bg-zinc-900 text-white font-medium">HI</option>
            <option value="es" className="bg-zinc-900 text-white font-medium">ES</option>
        </select>
    );
}
