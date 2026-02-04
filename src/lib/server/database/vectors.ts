import {eq, inArray} from "drizzle-orm";
import {sqlite} from "@/lib/server/database/db";
import {movies} from "@/lib/server/database/schema";
import {getDbClient} from "@/lib/server/database/async-storage";
import {FeatureExtractionPipeline, pipeline} from "@xenova/transformers";


const VECTOR_DIMENSIONS = 384;

export function initVectorTable() {
    sqlite.run(`
        CREATE VIRTUAL TABLE IF NOT EXISTS movie_vectors USING vec0(
            movie_id INTEGER PRIMARY KEY,
            embedding FLOAT[${VECTOR_DIMENSIONS}]
        );
    `);

    console.log("Vector table initialized");
}


export function insertMovieVector(movieId: number, embedding: number[]) {
    const stmt = sqlite.prepare(`
        INSERT OR REPLACE INTO movie_vectors (movie_id, embedding)
        VALUES (?, vec_f32(?))
    `);

    const vector = new Float32Array(embedding);
    stmt.run(movieId, vector);
}


export function getMovieVector(movieId: number) {
    const result = sqlite.prepare(`
        SELECT vec_to_json(embedding) as embedding
        FROM movie_vectors
        WHERE movie_id = ?
    `).get(movieId) as { embedding: string } | undefined;

    if (!result) return null;
    return JSON.parse(result.embedding);
}


export async function getVectorSimilarMovies(movieId: number, excludeIds: number[], limit?: number): Promise<{ mediaCover: any, mediaId: number, mediaName: string }[]> {
    const movieVector = getMovieVector(movieId);
    console.log({ movieVector });

    if (!movieVector) return [];

    const results = searchSimilarMovies(movieVector, limit, [movieId, ...excludeIds]);

    if (results.length === 0) return [];

    const movieIds = results.map((r) => r.movieId);

    return getDbClient()
        .select({
            mediaId: movies.id,
            mediaName: movies.name,
            mediaCover: movies.imageCover,
        })
        .from(movies)
        .where(inArray(movies.id, movieIds));
}


export function searchSimilarMovies(queryEmbedding: number[], limit: number = 10, excludeMovieIds: number[] = []) {
    const vector = new Float32Array(queryEmbedding);

    const exclusionClause = excludeMovieIds.length > 0 ? `AND movie_id NOT IN (${excludeMovieIds.join(",")})` : "";

    const results = sqlite.prepare(`
        SELECT
          movie_id as movieId,
          1 - vec_distance_cosine(embedding, vec_f32(?)) as similarity
        FROM movie_vectors
        WHERE 1=1 ${exclusionClause}
        ORDER BY similarity DESC
        LIMIT ?
  `).all(vector, limit) as Array<{ movieId: number; similarity: number }>;

    return results;
}


export function searchSimilarMoviesWithThreshold(
    queryEmbedding: number[],
    minSimilarity: number = 0.6,
    limit: number = 24,
    excludeMovieIds: number[] = []
): Array<{ movieId: number; similarity: number }> {
    const results = searchSimilarMovies(queryEmbedding, limit * 2, excludeMovieIds);
    return results.filter(r => r.similarity >= minSimilarity).slice(0, limit);
}


let embeddingPipeline: FeatureExtractionPipeline | null = null;
let pipelinePromise: Promise<FeatureExtractionPipeline> | null = null;


async function getEmbeddingPipeline() {
    if (embeddingPipeline) return embeddingPipeline;

    if (!pipelinePromise) {
        pipelinePromise = pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2")
            .then((pipe) => {
                embeddingPipeline = pipe;
                console.log("Embedding model loaded and cached");
                return pipe;
            });
    }

    return pipelinePromise;
}


export async function generateEmbedding(text: string) {
    const pipe = await getEmbeddingPipeline();
    const output = await pipe(text, { pooling: "mean", normalize: true });
    return Array.from(output.data);
}


interface MovieForEmbedding {
    id: number;
    name: string;
    synopsis: string | null;
    director: string | null;
}


export function buildEmbeddingText(movie: MovieForEmbedding) {
    const parts: string[] = [];

    parts.push(`Title: ${movie.name}`);
    parts.push(`Director: ${movie.director}`);

    if (movie.synopsis) {
        const truncatedSynopsis = movie.synopsis.slice(0, 500);
        parts.push(`Synopsis: ${truncatedSynopsis}`);
    }

    return parts.join(". ");
}


export async function generateAllMovieVectors() {
    initVectorTable();

    const allMovies = await getDbClient()
        .select({
            id: movies.id,
            name: movies.name,
            synopsis: movies.synopsis,
            director: movies.directorName,
        })
        .from(movies);

    console.log(`Generating vectors for ${allMovies.length} movies...`);

    let processed = 0;
    for (const movie of allMovies) {
        const embeddingText = buildEmbeddingText(movie);
        const embedding = await generateEmbedding(embeddingText);

        insertMovieVector(movie.id, embedding);

        await getDbClient()
            .update(movies)
            .set({ embeddingText })
            .where(eq(movies.id, movie.id));

        processed += 1;
        if (processed % 100 === 0) {
            console.log(`Processed ${processed}/${allMovies.length} movies`);
        }
    }

    console.log("All vectors generated!");
}
