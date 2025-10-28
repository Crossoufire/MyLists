import {MediaTitle} from "@/lib/client/components/media/base/MediaTitle";


interface SynopsisProps {
    synopsis: string | null | undefined;
    tagLine?: string | null | undefined;
}


export const Synopsis = ({ synopsis, tagLine }: SynopsisProps) => (
    <div>
        <MediaTitle>Synopsis</MediaTitle>
        <div className="text-base">
            {synopsis ? <p>{synopsis}</p> : <div className="text-muted-foreground italic">No synopsis to display</div>}
        </div>
        {tagLine && <blockquote className="text-muted-foreground italic mt-3">&mdash; {tagLine}</blockquote>}
    </div>
);
