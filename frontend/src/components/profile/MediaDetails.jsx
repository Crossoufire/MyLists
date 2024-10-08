import {Card, CardContent} from "@/components/ui/card";
import {MediaStats} from "@/components/profile/MediaStats";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {capitalize} from "@/utils/functions.jsx";


export const MediaDetails = ({ mediaData, userData }) => (
    <Card className="p-1">
        <CardContent className="p-0">
            <Tabs defaultValue="series" className="p-0">
                <TabsList className="grid grid-flow-col auto-cols-fr">
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
