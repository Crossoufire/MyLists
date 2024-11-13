import {capitalize} from "@/utils/functions";
import {useCollapse} from "@/hooks/CollapseHook";
import {Separator} from "@/components/ui/separator";
import {MediaStats} from "@/components/profile/MediaStats";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";


export const MediaDetails = ({ mediaData, userData }) => {
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
                            <TabsTrigger key={mt.media_type} className="md:text-lg" value={mt.media_type}>
                                {capitalize(mt.media_type)}
                            </TabsTrigger>
                        )}
                    </TabsList>
                    {mediaData.map(mt =>
                        <TabsContent key={mt.media_type} value={mt.media_type}>
                            <MediaStats
                                media={mt}
                                user={userData}
                            />
                        </TabsContent>
                    )}
                </Tabs>
            </CardContent>
        </Card>
    );
};
