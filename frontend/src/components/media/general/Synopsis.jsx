import {MediaTitle} from "@/components/media/general/MediaTitle";


export const Synopsis = ({ synopsis, tagLine }) => (
    <div>
        <MediaTitle>Synopsis</MediaTitle>
        <div className="text-base">
            {!synopsis ?
                <div className="text-muted-foreground italic">No synopsis to display</div>
                :
                <p>{synopsis}</p>
            }
        </div>
        {tagLine && <blockquote className="text-muted-foreground italic mt-3">&mdash; {tagLine}</blockquote>}
    </div>
);
