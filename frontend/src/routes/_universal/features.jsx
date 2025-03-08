import {Sparkles} from "lucide-react";
import {Badge} from "@/components/ui/badge";
import {PageTitle} from "@/components/app/PageTitle";
import {Card, CardContent} from "@/components/ui/card";
import {createFileRoute} from "@tanstack/react-router";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";


// noinspection JSCheckFunctionSignatures
export const Route = createFileRoute("/_universal/features")({
    component: FeatureShowcase,
});


function FeatureShowcase() {
    const features = [
        {
            name: "New Re-watch System TV!",
            description: "You can now add re-watch information per season, instead of per Series/Anime.",
            isNew: true,
            popover:
                "Your rewatch data for Series and Anime has been redistributed to the individual seasons. " +
                "Previously, if you had rewatched a series 5 times, it was counted as 5 rewatches for all seasons. " +
                "You can now adjust the rewatch count for each season independently!",
        },
        {
            name: "New Manga List!",
            description: "You can now add manga to your list! (Need to be activated in settings)",
            isNew: true,
        },
        {
            name: "New Global Stats Page",
            description: "The global stats page has been revamped, with a new 'Overall' section more stats.",
            isNew: true,
        },
        {
            name: "Cropping Pictures",
            description: "You can now crop your profile picture and back picture (on upload).",
            isNew: true,
        },
        {
            name: "New HoF Ranking system/UI",
            description: "The HoF page has been revamped.",
            isNew: true,
        },
        {
            name: "Updates in /lists",
            description: "You can now update everything about a media directly from the /list page.",
            isNew: true,
        },
        {
            name: "Achievements system",
            description: "Each media type has now achievements, with 4 levels of difficulty.",
        },
        {
            name: "Moviedle game",
            description: "A Wordle-like game where you guess the movie from a pixelated cover.",
        },
        {
            name: "Privacy Mode",
            description: "Adjust your privacy settings to control who can view your profile, lists, stats, and media updates.",
        },
        {
            name: "Media Update Removal",
            description: "Add the possibility to delete your media updates.",
        },
        {
            name: "CSV Export",
            description: "Download your media list as a CSV file.",
        },
        {
            name: "Game Platform",
            description: "Specify the platform on which you played the game.",
        },
        {
            name: "Advanced Media List Filtering",
            description: "Refine your lists with a new expanded set of filter options.",
        },
        {
            name: "Table View",
            description: "Switch to a table layout for your media lists.",
        },
        {
            name: "Enhanced Stats Dashboard",
            description: "Access detailed stats for each media list via 'Detailed Stats' in your profile.",
        },
        {
            name: "User Stats Comparison",
            description: "Compare your stats with other users on the stats page.",
        },
        {
            name: "Custom Media Labels",
            description: "Create and apply custom labels to organize your media lists.",
        },
        {
            name: "User Updates",
            description: "Follow other users' to receive their updates on your profile page.",
        },
        {
            name: "Social Connections",
            description: "Follow users and view their network of followers and follows.",
        },
        {
            name: "Upcoming Releases",
            description: "Track upcoming releases for your favorite series, anime, movies, and games.",
        },
        {
            name: "Release Reminders",
            description: "Get notified 7 days before new episodes, movies, or games drop.",
        }
    ];

    return (
        <PageTitle title="Features" subtitle="Discover What's New and Improved">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                {features.map((feature, idx) =>
                    <Card key={idx}>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold">{feature.name}</h2>
                                {feature.isNew &&
                                    <Badge variant="secondary" className="bg-gradient-to-r from-blue-600 to-violet-600">
                                        <Sparkles className="w-3 h-3 mr-1"/> New
                                    </Badge>
                                }
                            </div>
                            <p className="text-muted-foreground">
                                {feature.description} &nbsp;
                                {feature.popover &&
                                    <Popover>
                                        <PopoverTrigger>
                                            <div className="hover:underline font-semibold text-cyan-600">More Info</div>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-72">
                                            {feature.popover}
                                        </PopoverContent>
                                    </Popover>
                                }
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </PageTitle>
    );
}