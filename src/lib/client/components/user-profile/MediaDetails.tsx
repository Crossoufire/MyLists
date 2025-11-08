import {capitalize} from "@/lib/utils/functions";
import {useIsMobile} from "@/lib/client/hooks/use-mobile";
import {useCollapse} from "@/lib/client/hooks/use-collapse";
import {MediaStats} from "@/lib/client/components/user-profile/MediaStats";
import {PerMediaSummaryType, UserDataType} from "@/lib/types/query.options.types";
import {MediaAndUserIcon} from "@/lib/client/components/media/base/MediaAndUserIcon";
import {Card, CardContent, CardHeader, CardTitle} from "@/lib/client/components/ui/card";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/lib/client/components/ui/tabs";


interface MediaDetailsProps {
    userData: UserDataType;
    mediaData: PerMediaSummaryType;
}


export const MediaDetails = ({ mediaData, userData }: MediaDetailsProps) => {
    const isMobile = useIsMobile();
    const { caret, toggleCollapse, contentClasses } = useCollapse();

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    <div className="flex gap-2">
                        {caret}
                        <div role="button" onClick={toggleCollapse}>
                            Summary
                        </div>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className={contentClasses}>
                <Tabs defaultValue="series">
                    <TabsList className="grid grid-flow-col auto-cols-fr w-full mb-2">
                        {mediaData.map((mt) =>
                            <TabsTrigger key={mt.mediaType} value={mt.mediaType}>
                                {!isMobile &&
                                    <MediaAndUserIcon
                                        className="mr-1"
                                        type={mt.mediaType}
                                    />
                                }
                                {capitalize(mt.mediaType)}
                            </TabsTrigger>
                        )}
                    </TabsList>
                    {mediaData.map((media) =>
                        <TabsContent key={media.mediaType} value={media.mediaType}>
                            <MediaStats
                                media={media}
                                user={userData}
                            />
                        </TabsContent>
                    )}
                </Tabs>
            </CardContent>
        </Card>
    );
};
