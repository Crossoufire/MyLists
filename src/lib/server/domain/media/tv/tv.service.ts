import {pick} from "@/lib/utils/arrays-objects";
import {notFound} from "@tanstack/react-router";
import {FormattedError} from "@/lib/utils/error-classes";
import {LogPayload} from "@/lib/types/user-updates.types";
import {getTvSeasonTotals} from "@/lib/utils/media/tv-seasons";
import {MediaType, Status, UpdateType} from "@/lib/utils/enums";
import type {TvSeasonState} from "@/lib/schemas/tv-seasons.schema";
import {withTransaction} from "@/lib/server/database/async-storage";
import type {UpdateUserMedia} from "@/lib/schemas/user-media.schema";
import {TvList, TvType} from "@/lib/server/domain/media/tv/tv.types";
import {saveImageFromUrl} from "@/lib/server/core/images/image-saver";
import {BaseService} from "@/lib/server/domain/media/base/base.service";
import {TvRepository} from "@/lib/server/domain/media/tv/tv.repository";
import type {EditMediaDetailsPayloadByType} from "@/lib/schemas/media-details.schema";
import {EpsSeasonPayload, RedoTvPayload, StatusPayload} from "@/lib/types/user-media.types";
import {AnimeServerDefinition} from "@/lib/media-definitions/tv/anime/anime.definition.server";
import {SeriesServerDefinition} from "@/lib/media-definitions/tv/series/series.definition.server";


type TvDefinition = AnimeServerDefinition | SeriesServerDefinition;


export class TvService extends BaseService<TvDefinition, TvRepository> {
    constructor(repository: TvRepository, definition: TvDefinition) {
        super(repository, definition);

        this.updateHandlers = {
            ...this.updateHandlers,
            [UpdateType.REDO]: this.updateRedoHandler.bind(this),
            [UpdateType.STATUS]: this.updateStatusHandler.bind(this),
            [UpdateType.TV]: this.updateEpsSeasonsHandler.bind(this),
            [UpdateType.RATING]: this.updateRatingHandler.bind(this),
        }
    }

    async getMediaEditableFields(mediaId: number) {
        const { editableFields } = this.servicePolicy;

        const media = this.repository.findById(mediaId);
        if (!media) throw notFound();

        return {
            editableFields,
            fields: pick(media, editableFields.filter(field => field !== "imageCover")),
        };
    }

    getMediaEpsPerSeason(mediaId: number) {
        return this.repository.getMediaEpsPerSeason(mediaId);
    }

    override async downloadMediaListAsCSV(userId: number) {
        const rows = await this.repository.downloadMediaListAsCSV(userId);

        return rows?.map(({ addedAt: _addedAt, lastUpdated: _lastUpdated, ...row }) => ({
            ...row,
            formatVersion: "2",
            mediaType: this.identity.mediaType,
            externalApiSource: this.ingestion.externalApiSource,
        }));
    }

    async updateMediaEditableFields(mediaId: number, payload: EditMediaDetailsPayloadByType[typeof MediaType.SERIES | typeof MediaType.ANIME]) {
        const { coverDirectory } = this.identity;
        payload = this.editPayloadSchema.parse(payload);

        const media = this.repository.findById(mediaId);
        if (!media) throw notFound();

        const { imageCover, ...fields } = payload;
        const mediaData: Partial<TvType> & Pick<TvType, "apiId"> = { ...fields, apiId: media.apiId };

        if (imageCover) {
            mediaData.imageCover = await saveImageFromUrl({ dirSaveName: coverDirectory, imageUrl: imageCover });
        }

        withTransaction(() => this.repository.updateMediaWithDetails({ mediaData }));
    }

    bulkInsertSeasonalUserMedia(rows: (TvDefinition["repository"]["tables"]["listTable"]["$inferInsert"] & { seasons: TvSeasonState[] })[]) {
        return this.repository.bulkInsertUserMedia(rows);
    }

    getUserSeasons(userId: number, mediaId: number) {
        return this.repository.getUserSeasons(userId, mediaId);
    }

    updateRatingHandler(currentState: TvList, payload: UpdateUserMedia["payload"]): [TvList, LogPayload] {
        const seasons = this.repository.getUserSeasons(currentState.userId, currentState.mediaId);

        if (payload.seasonRating) {
            const change = payload.seasonRating;
            const target = seasons.find(s => s.season === change.season);

            if (!target) {
                throw new FormattedError("Invalid season number");
            }

            if (target.episodes === null && change.rating !== null) {
                throw new FormattedError("This season is no longer available. You can clear its rating.");
            }

            this.repository.updateSeasonState(currentState.id, change.season, { rating: change.rating });
        }
        else {
            for (const season of seasons) {
                if (season.episodes !== null || payload.rating === null) {
                    this.repository.updateSeasonState(currentState.id, season.season, { rating: payload.rating! });
                }
            }
        }

        const { rating } = getTvSeasonTotals(this.repository.getUserSeasons(currentState.userId, currentState.mediaId));

        return [{ ...currentState, rating }, null];
    }

    updateRedoHandler(currentState: TvList, payload: RedoTvPayload): [TvList, LogPayload] {
        const seasons = this.repository.getUserSeasons(currentState.userId, currentState.mediaId);

        const oldTotals = getTvSeasonTotals(seasons);
        for (const change of payload.seasonRedos) {
            const target = seasons.find(s => s.season === change.season);

            if (!target) {
                throw new FormattedError("Invalid season number");
            }

            if (target.episodes === null && change.redo !== 0) {
                throw new FormattedError("This season is no longer available. You can clear its rewatches.");
            }

            this.repository.updateSeasonState(currentState.id, change.season, { redo: change.redo });
        }

        const totals = getTvSeasonTotals(this.repository.getUserSeasons(currentState.userId, currentState.mediaId));

        return [
            {
                ...currentState,
                redo: totals.redo,
                total: currentState.total + totals.redoEpisodes - oldTotals.redoEpisodes
            },
            {
                newValue: totals.redo,
                oldValue: oldTotals.redo,
            }
        ];
    }

    updateStatusHandler(currentState: TvList, payload: StatusPayload, media: TvType): [TvList, LogPayload] {
        const newState = { ...currentState, status: payload.status };
        const specialStatuses: Status[] = [Status.RANDOM, Status.PLAN_TO_WATCH];

        const epsPerSeason = this.repository.getMediaEpsPerSeason(media.id);
        const logPayload = { oldValue: currentState.status, newValue: payload.status };

        if (specialStatuses.includes(currentState.status) && !specialStatuses.includes(newState.status)) {
            newState.currentEpisode = 1;
        }

        if (payload.status === Status.COMPLETED) {
            const sumEpisodesTv = epsPerSeason.reduce((a, b) => a + b.episodes, 0);
            const sumOldRedoEps = getTvSeasonTotals(this.repository.getUserSeasons(currentState.userId, media.id)).redoEpisodes;

            newState.total = sumEpisodesTv + sumOldRedoEps;
            newState.currentSeason = epsPerSeason.at(-1)!.season;
            newState.currentEpisode = epsPerSeason.at(-1)!.episodes;
        }
        else if (specialStatuses.includes(payload.status)) {
            newState.total = 0;
            newState.currentSeason = 1;
            newState.currentEpisode = 0;

            this.repository.resetSeasonRedos(currentState.id);
            newState.redo = 0;
        }

        return [newState, logPayload];
    }

    updateEpsSeasonsHandler(currentState: TvList, payload: EpsSeasonPayload, media: TvType): [TvList, LogPayload] {
        const seasons = this.repository.getMediaEpsPerSeason(media.id);
        const seasonNumber = payload.currentSeason ?? currentState.currentSeason;

        const season = seasons.find(s => s.season === seasonNumber);
        if (!season) throw new FormattedError("Invalid season number");

        const episode = payload.currentSeason !== undefined ? 1 : payload.currentEpisode!;
        if (episode > season.episodes) throw new FormattedError("Invalid episode");

        const watched = seasons.filter(s => s.season < seasonNumber).reduce((sum, s) => sum + s.episodes, 0) + episode;
        const { redoEpisodes } = getTvSeasonTotals(this.repository.getUserSeasons(currentState.userId, media.id));

        return [
            {
                ...currentState,
                currentEpisode: episode,
                currentSeason: seasonNumber,
                total: watched + redoEpisodes,
            },
            {
                newValue: [seasonNumber, episode],
                oldValue: [currentState.currentSeason, currentState.currentEpisode],
            }
        ];
    }
}
