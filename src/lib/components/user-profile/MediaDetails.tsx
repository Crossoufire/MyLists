import {capitalize} from "@/lib/utils/functions";
import {useCollapse} from "@/lib/hooks/use-collapse";
import {Separator} from "@/lib/components/ui/separator";
import {MediaStats} from "@/lib/components/user-profile/MediaStats";
import {Card, CardContent, CardHeader, CardTitle} from "@/lib/components/ui/card";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/lib/components/ui/tabs";

import {PerMediaSummaryType, UserDataType} from "@/lib/types/query.options.types";


interface MediaDetailsProps {
    userData: UserDataType;
    mediaData: PerMediaSummaryType;
}


export const MediaDetails = ({ mediaData, userData }: MediaDetailsProps) => {
    const { caret, toggleCollapse, contentClasses } = useCollapse();

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    <div className="p-1 flex gap-2 items-center">
                        {caret}
                        <div role="button" onClick={toggleCollapse}>
                            Summary
                        </div>
                    </div>
                </CardTitle>
                <Separator/>
            </CardHeader>
            <CardContent className={contentClasses}>
                <Tabs defaultValue="series">
                    <TabsList className="grid grid-flow-col auto-cols-fr p-0">
                        {mediaData.map(mt =>
                            <TabsTrigger key={mt.mediaType} className="md:text-lg" value={mt.mediaType}>
                                {capitalize(mt.mediaType)}
                            </TabsTrigger>
                        )}
                    </TabsList>
                    {mediaData.map(media =>
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
