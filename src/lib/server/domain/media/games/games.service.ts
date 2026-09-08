import {notFound} from "@tanstack/react-router";
import {saveImageFromUrl} from "@/lib/server/core/images/image-saver";
import {LogPayload} from "@/lib/types/user-updates.types";
import {MediaType, Status, UpdateType} from "@/lib/utils/enums";
import {withTransaction} from "@/lib/server/database/async-storage";
import {BaseService} from "@/lib/server/domain/media/base/base.service";
import {Game, GamesList} from "@/lib/server/domain/media/games/games.types";
import {PlaytimePayload, StatusPayload} from "@/lib/types/user-media.types";
import {GamesRepository} from "@/lib/server/domain/media/games/games.repository";
import type {EditMediaDetailsPayloadByType} from "@/lib/schemas/media-details.schema";
import {gamesServerDefinition, GamesServerDefinition} from "@/lib/media-definitions/games/games.definition.server";
import {pick} from "@/lib/utils/arrays-objects";


export class GamesService extends BaseService<GamesServerDefinition, GamesRepository> {
    constructor(repository: GamesRepository, definition: GamesServerDefinition = gamesServerDefinition) {
        super(repository, definition);

        this.updateHandlers = {
            ...this.updateHandlers,
            [UpdateType.STATUS]: this.updateStatusHandler.bind(this),
            [UpdateType.PLAYTIME]: this.updatePlaytimeHandler.bind(this),
            [UpdateType.PLATFORM]: this.createSimpleUpdateHandler("platform"),
        };
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

    async getCompatiblePlatforms(mediaId: number) {
        const media = this.repository.findById(mediaId);
        if (!media) throw notFound();

        return this.repository.getCompatiblePlatforms(mediaId);
    }

    async updateMediaEditableFields(mediaId: number, payload: EditMediaDetailsPayloadByType[typeof MediaType.GAMES]) {
        const { coverDirectory } = this.identity;
        payload = this.editPayloadSchema.parse(payload);

        const media = this.repository.findById(mediaId);
        if (!media) throw notFound();

        const { imageCover, ...fields } = payload;
        const mediaData: Partial<Game> & Pick<Game, "apiId"> = { ...fields, apiId: media.apiId };

        if (imageCover) {
            mediaData.imageCover = await saveImageFromUrl({ dirSaveName: coverDirectory, imageUrl: imageCover });
        }

        withTransaction(() => this.repository.updateMediaWithDetails({ mediaData }));
    }

    updateStatusHandler(currentState: GamesList, payload: StatusPayload, _media: Game): [GamesList, LogPayload] {
        const newState = { ...currentState, status: payload.status };
        const logPayload = { oldValue: currentState.status, newValue: payload.status };

        if (payload.status === Status.PLAN_TO_PLAY) {
            newState.playtime = 0;
        }

        return [newState, logPayload];
    };

    updatePlaytimeHandler(currentState: GamesList, payload: PlaytimePayload, _media: Game): [GamesList, LogPayload] {
        const newState = { ...currentState, playtime: payload.playtime };
        const logPayload = { oldValue: currentState.playtime, newValue: payload.playtime };

        return [newState, logPayload];
    };
}
