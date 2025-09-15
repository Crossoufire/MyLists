import {capitalize} from "@/lib/utils/functions";
import {useIsMobile} from "@/lib/hooks/use-mobile";
import {useCollapse} from "@/lib/hooks/use-collapse";
import {MediaStats} from "@/lib/components/user-profile/MediaStats";
import {MediaAndUserIcon} from "@/lib/components/media/base/MediaAndUserIcon";
import {PerMediaSummaryType, UserDataType} from "@/lib/types/query.options.types";
import {Card, CardContent, CardHeader, CardTitle} from "@/lib/components/ui/card";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/lib/components/ui/tabs";


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
