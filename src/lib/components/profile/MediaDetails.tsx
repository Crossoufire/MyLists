import {capitalize} from "@/lib/utils/functions";
import {useCollapse} from "@/lib/hooks/use-collapse";
import {Separator} from "@/lib/components/ui/separator";
import {MediaStats} from "@/lib/components/profile/MediaStats";
import {profileOptions} from "@/lib/react-query/query-options";
import {Card, CardContent, CardHeader, CardTitle} from "@/lib/components/ui/card";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/lib/components/ui/tabs";


interface MediaDetailsProps {
    userData: Awaited<ReturnType<NonNullable<ReturnType<typeof profileOptions>["queryFn"]>>>["userData"];
    mediaData: Awaited<ReturnType<NonNullable<ReturnType<typeof profileOptions>["queryFn"]>>>["perMediaSummary"];
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
