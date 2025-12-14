import {MediaType} from "@/lib/utils/enums";
import {createFileRoute} from "@tanstack/react-router";
import {StatCardBuilder} from "@/lib/client/components/social-card/StatCardBuilder";


export const Route = createFileRoute("/_main/_private/social-card/$mediaType")({
    params: {
        parse: (params) => {
            return {
                mediaType: params.mediaType as MediaType,
            }
        }
    },
    component: MediaStatCard,
});


function MediaStatCard() {
    const { mediaType } = Route.useParams();

    return (
        <StatCardBuilder
            mediaType={mediaType}
        />
    );
}
