import {MediaType} from "@/lib/utils/enums";
import {MediaDetails} from "@/lib/types/query.options.types";
import {MediaComponent} from "@/lib/client/components/media/base/MediaComponent";


interface MediaHeroProps {
    media: MediaDetails;
    mediaType: MediaType;
}


export function MediaHero({ media, mediaType }: MediaHeroProps) {
    const backdropStyle = {
        filter: "blur(20px)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundImage: `linear-gradient(to bottom, rgba(15, 15, 15, 0.7), rgba(15, 15, 15, 1)), url(${media.imageCover})`,
    };

    return (
        <div className="relative flex items-end overflow-hidden left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen h-[50vh] md:h-[50vh]">
            <div style={backdropStyle} className="absolute inset-0 z-0"/>
            <div className="relative max-w-7xl mx-auto w-full px-8 max-sm:px-2">
                <div className="flex flex-row items-end gap-10 container mx-auto px-4 pb-12">
                    <div className="hidden md:block w-48 lg:w-60 shrink-0 rounded-lg overflow-hidden shadow-2xl border">
                        <img
                            alt={media.name}
                            src={media.imageCover}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="flex-1 w-full space-y-4">
                        <div className="flex flex-wrap gap-2 mb-2">
                            <MediaComponent
                                media={media}
                                name="overTitle"
                                mediaType={mediaType}
                            />
                        </div>
                        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-primary drop-shadow-lg">
                            {media.name}
                        </h1>
                        <div className="flex items-center flex-wrap gap-y-2 gap-x-6 text-sm text-primary font-medium">
                            <MediaComponent
                                media={media}
                                name="underTitle"
                                mediaType={mediaType}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
