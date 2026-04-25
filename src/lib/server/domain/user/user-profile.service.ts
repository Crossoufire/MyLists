import {MediaType} from "@/lib/utils/enums";
import {MediaServiceRegistry} from "@/lib/server/domain/media/media.registries";
import {UserProfileRepository} from "@/lib/server/domain/user/user-profile.repository";
import {
    HighlightedMediaRef,
    HighlightedMediaResolvedItem,
    HighlightedMediaResolvedSettings,
    HighlightedMediaSettings,
    HighlightedMediaTab,
} from "@/lib/types/profile-custom.types";


const PROFILE_MAX_HIGHLIGHTED_MEDIA = 7;


export class UserProfileService {
    constructor(
        private repository: typeof UserProfileRepository,
        private mediaServiceRegistry: typeof MediaServiceRegistry,
    ) {
    }

    async resolveHighlightedMedia(userId: number) {
        const savedSettings = await this.repository.getHighlightedMediaSettings(userId);
        const settings = this._resolveSettingsDefaults(savedSettings);

        const mediaTypes = Object.values(MediaType);
        const overviewPool: HighlightedMediaResolvedItem[] = [];
        const resolvedTabs: Partial<HighlightedMediaResolvedSettings> = {};

        // Resolve specific tabs while building overview pool
        await Promise.all(mediaTypes.map(async (mediaType) => {
            const tabConfig = settings[mediaType];
            let tabItems: HighlightedMediaResolvedItem[] = [];
            let poolItems: HighlightedMediaResolvedItem[] = [];

            if (tabConfig.mode === "curated") {
                tabItems = await this.resolveCuratedItems(mediaType, tabConfig.items);
                poolItems = tabItems;
            }
            else {
                const needsRandomForTab = (tabConfig.mode === "random");
                const needsRandomForOverview = (tabConfig.mode === "disabled" && settings.overview.mode === "random");

                if (needsRandomForTab || needsRandomForOverview) {
                    const mediaService = this.mediaServiceRegistry.getService(mediaType);
                    const favorites = await mediaService.getUserFavorites(userId, 3 * PROFILE_MAX_HIGHLIGHTED_MEDIA);
                    const mapFavorites = favorites.map((fav) => ({ ...fav, mediaType }));

                    poolItems = mapFavorites;
                    if (needsRandomForTab) tabItems = mapFavorites;
                }
            }

            overviewPool.push(...poolItems);
            resolvedTabs[mediaType] = { ...tabConfig, items: tabItems };
        }));

        // Resolve Overview tab
        const overviewConfig = settings.overview;
        let overviewItems: HighlightedMediaResolvedItem[] = [];

        if (overviewConfig.mode === "random") {
            overviewItems = this._shuffle(overviewPool).slice(0, PROFILE_MAX_HIGHLIGHTED_MEDIA);
        }
        else if (overviewConfig.mode === "curated") {
            overviewItems = await this.resolveCuratedItems("overview", overviewConfig.items);
        }

        return { overview: { ...overviewConfig, items: overviewItems }, ...resolvedTabs } as HighlightedMediaResolvedSettings;
    }

    private async resolveCuratedItems(tab: HighlightedMediaTab, items: HighlightedMediaRef[]): Promise<HighlightedMediaResolvedItem[]> {
        if (items.length === 0) return [];

        const groupedByMediaType = items.reduce((acc, item) => {
            if (tab !== "overview" && item.mediaType !== tab) return acc;
            acc[item.mediaType] = acc[item.mediaType] || [];
            acc[item.mediaType].push(item.mediaId);
            return acc;
        }, {} as Record<string, number[]>);

        const lookupMap = new Map<string, Omit<HighlightedMediaResolvedItem, "mediaType">>();

        await Promise.all(Object.entries(groupedByMediaType).map(async ([mediaType, mediaIds]) => {
            const mediaService = this.mediaServiceRegistry.getService(mediaType as MediaType);
            const mediaDetails = await mediaService.getMediaDetailsByIds(mediaIds);
            for (const md of mediaDetails) {
                lookupMap.set(`${mediaType}|${md.id}`, {
                    mediaId: md.id,
                    mediaName: md.name,
                    mediaCover: md.imageCover,
                });
            }
        }));

        return items
            .map((item) => {
                const mediaDetails = lookupMap.get(`${item.mediaType}|${item.mediaId}`);
                return mediaDetails ? { ...mediaDetails, mediaType: item.mediaType } : null;
            })
            .filter((item): item is HighlightedMediaResolvedItem => item !== null)
            .slice(0, PROFILE_MAX_HIGHLIGHTED_MEDIA);
    }

    private _resolveSettingsDefaults(settings?: HighlightedMediaSettings): HighlightedMediaSettings {
        const allTabs: HighlightedMediaTab[] = ["overview", ...Object.values(MediaType)];

        return Object.fromEntries(
            allTabs.map((tab) => {
                const userTab = settings?.[tab];
                return [tab, {
                    mode: userTab?.mode || "random",
                    title: userTab?.title.trim() || "Highlighted Media",
                    items: userTab?.items.slice(0, PROFILE_MAX_HIGHLIGHTED_MEDIA) || [],
                }];
            }),
        ) as HighlightedMediaSettings;
    }

    private _shuffle<T>(items: T[]) {
        const next = [...items];
        for (let i = next.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [next[i], next[j]] = [next[j], next[i]];
        }
        return next;
    }
}
