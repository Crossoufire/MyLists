import {ImportItemStatus, Status} from "@/lib/utils/enums";
import {TvService} from "@/lib/server/domain/media/tv/tv.service";
import {ImportItemOutcome, MatchedImportItem} from "@/lib/types/imports.types";
import {attachTvSeasonEpisodes, getTvSeasonTotals} from "@/lib/utils/media/tv-seasons";
import {ImportListWriter} from "@/lib/server/domain/imports/matchers/media-matcher.interfaces";
import {tvFinalListInsertSchema, TvImportPayload, tvImportPayloadSchema} from "@/lib/server/domain/media/tv/tv.types";


type SeasonEpisodes = {
    season: number;
    episodes: number;
};


const SPECIAL_STATUSES: Status[] = [Status.RANDOM, Status.PLAN_TO_WATCH];


export class TvImportListWriter implements ImportListWriter {
    constructor(private tvService: TvService) {
    }

    async addMatchedItems(userId: number, matches: MatchedImportItem[]): Promise<ImportItemOutcome[]> {
        if (matches.length === 0) return [];

        const userTvRows = [];

        for (const { item, mediaId } of matches) {
            const payload = tvImportPayloadSchema.parse(item.payload);
            const fullPayload = await this._materializeTvListPayload(mediaId, payload);
            userTvRows.push(tvFinalListInsertSchema.parse({ userId, mediaId, ...fullPayload }));
        }

        await this.tvService.bulkInsertUserMedia(userTvRows);

        return matches.map(({ item, mediaId }) => ({
            itemId: item.id,
            matchedMediaId: mediaId,
            status: ImportItemStatus.COMPLETED,
        }));
    }

    private async _materializeTvListPayload(mediaId: number, payload: TvImportPayload) {
        const seasons = this.tvService.getMediaEpsPerSeason(mediaId);

        const states = payload.seasons ?? [
            ...seasons.map((season, index) => ({
                season: season.season, redo: payload.redo?.[index] ?? 0, rating: payload.rating ?? null,
            })),
            ...(payload.redo?.slice(seasons.length) ?? []).map((redo, index) => ({
                season: seasons.length + index + 1, redo, rating: null,
            })).filter(s => s.redo > 0),
        ];

        const existing = new Set(states.map(s => s.season));
        const completeStates = [...states, ...seasons.filter(s => !existing.has(s.season)).map(s => ({ season: s.season, redo: 0, rating: null }))];

        const totals = getTvSeasonTotals(attachTvSeasonEpisodes(completeStates, seasons));
        const currentSeason = payload.currentSeason ?? this._defaultCurrentSeason(payload.status, seasons);

        const currentEpisode = payload.currentEpisode ?? this._defaultCurrentEpisode(payload.status, currentSeason, seasons);
        const total = payload.total ?? this._calculateTotal(payload.status, currentSeason, currentEpisode, totals.redoEpisodes, seasons);

        return {
            ...payload,
            total,
            currentSeason,
            currentEpisode,
            redo: totals.redo,
            rating: totals.rating,
            seasons: completeStates,
        };
    }

    private _defaultCurrentSeason(status: Status, seasons: SeasonEpisodes[]) {
        if (status === Status.COMPLETED) return seasons.at(-1)!.season;
        return seasons[0].season;
    }

    private _defaultCurrentEpisode(status: Status, currentSeason: number, seasons: SeasonEpisodes[]) {
        if (status === Status.COMPLETED) {
            return seasons.find(s => s.season === currentSeason)?.episodes ?? seasons.at(-1)!.episodes;
        }

        if (SPECIAL_STATUSES.includes(status)) return 0;

        return 1;
    }

    private _calculateTotal(status: Status, currentSeason: number, currentEpisode: number, redoTotal: number, seasons: SeasonEpisodes[]) {
        if (status === Status.COMPLETED) {
            return seasons.reduce((sum, season) => sum + season.episodes, 0) + redoTotal;
        }

        if (SPECIAL_STATUSES.includes(status)) {
            return 0;
        }

        const previousSeasonsTotal = seasons
            .filter((s) => s.season < currentSeason)
            .reduce((sum, s) => sum + s.episodes, 0);

        return previousSeasonsTotal + currentEpisode + redoTotal;
    }
}
