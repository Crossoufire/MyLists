import {LuSparkles} from "react-icons/lu";
import {Badge} from "@/components/ui/badge";
import {PageTitle} from "@/components/app/PageTitle";
import {Card, CardContent} from "@/components/ui/card";
import {createLazyFileRoute} from "@tanstack/react-router";


// noinspection JSCheckFunctionSignatures,JSUnusedGlobalSymbols
export const Route = createLazyFileRoute("/_universal/features")({
    component: FeatureShowcase,
});


function FeatureShowcase() {
    const features = [
        {
            name: "Updates in /lists",
            description: "You can now update everything about a media directly from the /list page.",
            isNew: true,
        },
        {
            name: "Achievements system",
            description: "Each media type has now achievements, with 4 levels of difficulty.",
            isNew: true,
        },
        {
            name: "Moviedle game",
            description: "A Wordle-like game where you guess the movie from a pixelated cover.",
            isNew: true,
        },
        {
            name: "Privacy Mode",
            description: "Adjust your privacy settings to control who can view your profile, lists, stats, and media updates.",
            isNew: true,
        },
        {
            name: "Media Update Removal",
            description: "Add the possibility to delete your media updates.",
            isNew: true,
        },
        {
            name: "CSV Export",
            description: "Download your media list as a CSV file.",
            isNew: true,
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
                                        <LuSparkles className="w-3 h-3 mr-1"/> New
                                    </Badge>
                                }
                            </div>
                            <p className="text-muted-foreground">{feature.description}</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </PageTitle>
    );
}