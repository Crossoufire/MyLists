import {notFound} from "@tanstack/react-router";
import {saveImageFromUrl} from "@/lib/server/core/images/image-saver";
import {LogPayload} from "@/lib/types/user-updates.types";
import {MediaType, Status, UpdateType} from "@/lib/utils/enums";
import {withTransaction} from "@/lib/server/database/async-storage";
import {BaseService} from "@/lib/server/domain/media/base/base.service";
import {RedoPayload, StatusPayload} from "@/lib/types/user-media.types";
import {Movie, MoviesList} from "@/lib/server/domain/media/movies/movies.types";
import {MoviesRepository} from "@/lib/server/domain/media/movies/movies.repository";
import type {EditMediaDetailsPayloadByType} from "@/lib/schemas/media-details.schema";
import {MovieServerDefinition, moviesServerDefinition} from "@/lib/media-definitions/movies/movies.definition.server";
import {pick} from "@/lib/utils/arrays-objects";


export class MoviesService extends BaseService<MovieServerDefinition, MoviesRepository> {
    constructor(repository: MoviesRepository, definition: MovieServerDefinition = moviesServerDefinition) {
        super(repository, definition);

        this.updateHandlers = {
            ...this.updateHandlers,
            [UpdateType.REDO]: this.updateRedoHandler.bind(this),
            [UpdateType.STATUS]: this.updateStatusHandler.bind(this),
        }
    }

    async lockOldMovies() {
        return this.repository.lockOldMovies();
    }

    async findByTitleAndYear(title: string, year: number) {
        return this.repository.findByTitleAndYear(title, year);
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

    async updateMediaEditableFields(mediaId: number, payload: EditMediaDetailsPayloadByType[typeof MediaType.MOVIES]) {
        const { coverDirectory } = this.identity;
        payload = this.editPayloadSchema.parse(payload);

        const media = this.repository.findById(mediaId);
        if (!media) throw notFound();

        const { imageCover, ...fields } = payload;
        const mediaData: Partial<Movie> & Pick<Movie, "apiId"> = { ...fields, apiId: media.apiId };

        if (imageCover) {
            mediaData.imageCover = await saveImageFromUrl({ dirSaveName: coverDirectory, imageUrl: imageCover });
        }

        withTransaction(() => this.repository.updateMediaWithDetails({ mediaData }));
    }

    updateStatusHandler(currentState: MoviesList, payload: StatusPayload, _media: Movie): [MoviesList, LogPayload] {
        const newState = { ...currentState, status: payload.status };
        const logPayload = { oldValue: currentState.status, newValue: payload.status };

        newState.redo = 0;
        if (payload.status === Status.COMPLETED) {
            newState.total = 1;
        }
        else {
            newState.total = 0;
        }

        return [newState, logPayload];
    };

    updateRedoHandler(currentState: MoviesList, payload: RedoPayload, _media: Movie): [MoviesList, LogPayload] {
        const newState = { ...currentState, redo: payload.redo };
        const logPayload = { oldValue: currentState.redo, newValue: payload.redo };

        newState.total = payload.redo + 1;

        return [newState, logPayload];
    };
}
