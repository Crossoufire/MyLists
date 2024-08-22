import {capitalize} from "@/lib/utils";
import {Card, CardContent} from "@/components/ui/card";
import {MediaStats} from "@/components/profile/MediaStats";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";


export const MediaDetails = ({ mediaData, userData }) => {
    return (
        <Card className="p-1">
            <CardContent className="p-0">
                <Tabs defaultValue="series" className="p-0">
                    <TabsList className="grid grid-flow-col auto-cols-fr">
                        {mediaData.map(md =>
                            <TabsTrigger key={md.media_type} className="md:text-lg" value={md.media_type}>
                                {capitalize(md.media_type)}
                            </TabsTrigger>
                        )}
                    </TabsList>
                    {mediaData.map(md =>
                        <TabsContent key={md.media_type} value={md.media_type}>
                            <MediaStats
                                media={md}
                                user={userData}
                            />
                        </TabsContent>
                    )}
                </Tabs>
            </CardContent>
        </Card>
    );
};
