import {JSX} from "react";
import {ApiProviderType} from "@/lib/utils/enums";
import {createFileRoute} from "@tanstack/react-router";
import {BlockLink} from "@/lib/client/components/general/BlockLink";
import {PageTitle} from "@/lib/client/components/general/PageTitle";
import {Popover, PopoverContent, PopoverTrigger} from "@/lib/client/components/ui/popover";
import {
    Activity,
    BarChart3,
    BellRing,
    BookOpen,
    Calendar,
    CheckCheck,
    ChevronDown,
    Crop,
    Edit3,
    FileSpreadsheet,
    Filter,
    Gamepad2,
    GraduationCap,
    LayoutList,
    LineChart,
    ListOrdered,
    Lock,
    LucideIcon,
    Monitor,
    Repeat,
    Search,
    Share2,
    Shield,
    Tags,
    Trash2,
    Trophy,
    Users,
    Zap
} from "lucide-react";


export const Route = createFileRoute("/_main/_universal/features")({
    component: FeaturesPage,
});


function FeaturesPage() {
    const groupedFeatures = FEATURES_DATA.reduce((acc, feature) => {
        const cat = feature.category;
        if (!acc[cat]) {
            acc[cat] = [];
        }
        acc[cat]!.push(feature);
        return acc;
    }, {} as Partial<Record<FeatureData["category"], FeatureData[]>>);

    const activeCategories = (Object.keys(groupedFeatures) as FeatureData["category"][]).sort((a, b) => {
        if (a === "New") return -1;
        if (b === "New") return 1;
        return a.localeCompare(b);
    });

    const getCategoryIcon = (category: FeatureData["category"]) => {
        switch (category) {
            case "New":
                return Activity;
            case "Library & Management":
                return LayoutList;
            case "Stats & Insights":
                return BarChart3;
            case "Social & Notifications":
                return Users;
            case "Customization":
                return Edit3;
            case "Gamification":
                return Gamepad2;
            default:
                return Search;
        }
    };

    return (
        <PageTitle title="What's New in MyLists" subtitle="Discover the latest features and what's new and Improved">
            <div className="space-y-15 mb-20">
                {activeCategories.map((category) =>
                    <section key={category}>
                        <SectionHeader
                            title={category}
                            icon={getCategoryIcon(category)}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {groupedFeatures[category]?.map((feature, idx) =>
                                <FeatureCard
                                    feature={feature}
                                    key={`${category}-${idx}`}
                                />
                            )}
                        </div>
                    </section>
                )}
            </div>
        </PageTitle>
    );
}


type FeatureData = {
    name: string,
    icon: LucideIcon,
    details?: JSX.Element,
    description: JSX.Element | string,
    category: "New" | "Library & Management" | "Stats & Insights" | "Social & Notifications" | "Customization" | "Gamification";
}


const FEATURES_DATA: FeatureData[] = [
    {
        icon: ListOrdered,
        category: "New",
        name: "New (real) Collections System",
        description: (
            <span>
                Create, and rank collections of media. Keep your collections private for organization,
                or publish them to the Community page to share with others.
                (The previous `Collection` system is now called `Tags`).
            </span>
        )
    },
    {
        icon: CheckCheck,
        category: "New",
        name: "Features Voting!",
        description: (
            <span>
                Have a great idea? Tell me about it! You can now request new features and vote on what should get built next{" "}
                <BlockLink to="/features-vote" className="inline-flex gap-1 items-center text-app-accent font-medium hover:text-app-accent/80">
                    here
                </BlockLink> or by clicking on the bulb in the bottom right.
            </span>
        )
    },
    {
        icon: Zap,
        category: "New",
        name: "Monthly Activity",
        description: (
            <span>
                Track your progress in real-time. View a detailed breakdown of what
                you've spent time on during the month. Your activity can be found
                in the <b>'MyMedia'</b> dropdown.
            </span>
        )
    },
    {
        icon: Lock,
        category: "New",
        name: "Private Accounts",
        description: (
            <span>
                Only approved followers can see your profile, lists, and updates.
                Accept followers request in the new notifications 'Social' tab.
                Go to the settings to update your privacy settings.
            </span>
        )
    },
    {
        icon: Tags,
        category: "New",
        name: "Labels become Tags",
        description: (
            <span>
                Labels have a fresh new look and are now called 'tags'.
                Check out the new design on your lists page.
                The tags management modal has also been updated.
            </span>
        )
    },
    {
        icon: GraduationCap,
        category: "New",
        name: "New Walkthrough Tutorial",
        description: (
            <span>
                New here? Follow this walkthrough to learn how to use MyLists.info, add media, and get the most out it {" "}
                <BlockLink to="/walkthrough/search-media" className="inline-flex gap-1 items-center text-app-accent font-medium hover:text-app-accent/80">
                    here
                </BlockLink>.
            </span>
        )
    },
    {
        icon: Search,
        name: "Search using !bangs",
        category: "Library & Management",
        description: "Power user? You can now search MyLists Media and Users directly via URL parameters using custom bangs.",
        details: (
            <div className="space-y-4 text-sm mt-2">
                <div className="p-3 bg-popover rounded border">
                    <div className="font-semibold mb-1">
                        URL Pattern
                    </div>
                    <div className="font-mono text-xs text-muted-foreground break-all">
                        https://mylists.info/search?q=<span className="text-emerald-400">term</span>&apiProvider=<span className="text-orange-400">provider</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                    <div>
                        <div className="font-semibold mb-2">
                            Providers
                        </div>
                        <ul className="space-y-1 text-xs text-slate-400 font-mono">
                            <li><span className="text-blue-400">{ApiProviderType.TMDB}</span> - Series, Anime, Movies</li>
                            <li><span className="text-blue-400">{ApiProviderType.IGDB}</span> - Games</li>
                            <li><span className="text-blue-400">{ApiProviderType.BOOKS}</span> - Books</li>
                            <li><span className="text-blue-400">{ApiProviderType.MANGA}</span> - Manga</li>
                            <li><span className="text-blue-400">{ApiProviderType.USERS}</span> - Users</li>
                        </ul>
                    </div>
                    <div>
                        <div className="font-semibold mb-2">
                            Example
                        </div>
                        <div className="p-2 bg-popover border rounded text-xs font-mono text-muted-foreground break-all">
                            ...?q=<span className="text-emerald-400">interstellar</span>&apiProvider=<span className="text-orange-400">tmdb</span>
                        </div>
                    </div>
                </div>
            </div>
        )
    },
    {
        icon: Repeat,
        name: "Season-based Re-watch",
        category: "Library & Management",
        description: "Granular control: add re-watch information per individual season instead of the entire show.",
        details: (
            <div className="mt-2 space-y-4 text-sm">
                <div className="rounded border bg-popover p-3">
                    <div className="mb-1 font-semibold">
                        Data Redistribution
                    </div>
                    <div className="leading-relaxed text-muted-foreground">
                        Your rewatch data for <span className="text-series font-medium">Series</span> and{" "}
                        <span className="text-anime font-medium">Anime</span> has been moved to a{" "}
                        <span className="font-medium">per-season</span> basis.
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <div className="mb-2 font-semibold">
                            Old System
                        </div>
                        <div className="rounded bg-popover p-2 font-mono text-xs text-muted-foreground border">
                            <div className="flex justify-between">
                                <span>Series Global:</span>
                                <span className="text-red-400">5x</span>
                            </div>
                            <div className="mt-1 opacity-70">
                                (Applied to S1, S2, and S3 etc...)
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="mb-2 font-semibold">
                            New System
                        </div>
                        <div className="rounded bg-popover p-2 font-mono text-xs text-muted-foreground border">
                            <div className="flex justify-between">
                                <span>Season 1:</span>
                                <span>3x</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Season 2:</span>
                                <span>2x</span>
                            </div>
                        </div>
                    </div>
                </div>

                <p className="text-xs text-muted-foreground">
                    * All existing data was automatically migrated to match your previous totals.
                </p>
            </div>
        )
    },
    {
        icon: BookOpen,
        name: "New Manga List",
        category: "Library & Management",
        description: "Manga is officially supported! Enable it in your settings to start tracking your reading."
    },
    {
        icon: Crop,
        name: "Image Cropping",
        category: "Customization",
        description: "No more stretched images. Crop your profile picture and back cover directly during upload."
    },
    {
        icon: BarChart3,
        category: "Stats & Insights",
        name: "New Global Stats Page",
        description: "Revamped overview with a new 'Overall' section containing aggregated metrics.",
    },
    {
        icon: LineChart,
        category: "Stats & Insights",
        name: "Enhanced Stats Dashboard",
        description: "Drill down into specific media lists via 'Advanced Stats' on your profile."
    },
    {
        icon: Trophy,
        name: "HoF Ranking System",
        category: "Stats & Insights",
        description: "The Hall of Fame page has been redesigned with a new ranking algorithm."
    },
    {
        icon: Edit3,
        name: "Updates in /lists",
        category: "Library & Management",
        description: "Edit everything about a media entry directly from your main list view."
    },
    {
        icon: Filter,
        name: "Advanced Filtering",
        category: "Library & Management",
        description: "Refine your library with an expanded set of granular filter options."
    },
    {
        icon: LayoutList,
        name: "Table View",
        category: "Library & Management",
        description: "Switch between Grid view and a data-dense Table layout for your lists."
    },
    {
        icon: Tags,
        name: "Custom Tags",
        category: "Customization",
        description: "Create and apply custom tags to organize your media list your way."
    },
    {
        name: "CSV Export",
        icon: FileSpreadsheet,
        category: "Library & Management",
        description: "Data liberation: Download your entire media list as a CSV file."
    },
    {
        icon: Trash2,
        name: "Media Update Removal",
        category: "Library & Management",
        description: "Made a mistake? You can now delete erroneous media history updates."
    },
    {
        icon: Gamepad2,
        name: "Game Platform",
        category: "Library & Management",
        description: "Specify exactly which console or platform (PC, PS5, Switch) you played on."
    },
    {
        icon: Monitor,
        name: "Moviedle Game",
        category: "Gamification",
        description: "A Wordle-like mini-game: guess the movie from a pixelated poster."
    },
    {
        icon: Trophy,
        category: "Gamification",
        name: "Achievements System",
        description: "Earn badges with 4 difficulty levels based on your viewing habits."
    },
    {
        icon: Shield,
        name: "Privacy Mode",
        category: "Customization",
        description: "Fine-tune visibility for your profile, lists, stats, and updates."
    },
    {
        icon: Activity,
        name: "User Updates",
        category: "Social & Notifications",
        description: "Follow friends to populate your personalized activity feed."
    },
    {
        icon: Share2,
        name: "Social Connections",
        category: "Social & Notifications",
        description: "View follower/following networks and discover new users."
    },
    {
        icon: Calendar,
        name: "Upcoming Releases",
        category: "Social & Notifications",
        description: "Track release dates for your ongoing series, movies, and games."
    },
    {
        icon: BellRing,
        name: "Release Reminders",
        category: "Social & Notifications",
        description: "Get notified 7 days before new episodes or game drops."
    },
];


const FeatureCard = ({ feature }: { feature: FeatureData }) => {
    const Icon = feature.icon;

    return (
        <div className="relative overflow-hidden rounded-xl border transition-all duration-300 flex flex-col bg-background">
            {feature.category === "New" &&
                <div className="absolute top-0 right-0">
                    <div className="bg-app-accent text-black text-[10px] font-bold px-3 py-1 rounded-bl-lg">
                        NEW
                    </div>
                </div>
            }

            <div className="p-5 flex-1">
                <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg shrink-0 bg-app-accent/20 text-primary">
                        <Icon className="size-6"/>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg mb-2">
                            {feature.name}
                        </h3>
                        <div className="text-sm text-muted-foreground leading-relaxed">
                            {feature.description}
                        </div>
                    </div>
                </div>
            </div>

            {feature.details &&
                <Popover>
                    <PopoverTrigger asChild>
                        <button className="w-full py-2 bg-popover border-t text-xs font-medium text-app-accent
                        transition-colors flex items-center justify-center gap-1 hover:bg-popover/50">
                            Learn More
                            <ChevronDown className="size-3"/>
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-(--radix-popover-trigger-width) p-4 text-sm shadow-xl">
                        <div className="space-y-2">
                            <h4 className="font-bold flex items-center gap-2">
                                <Icon className="size-4 text-app-accent"/>
                                {feature.name}
                            </h4>
                            <div className="pt-2 border-t text-muted-foreground leading-relaxed">
                                {feature.details}
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            }
        </div>
    );
};


interface SectionHeaderProps {
    title: string,
    icon: LucideIcon,
}


const SectionHeader = ({ title, icon: Icon }: SectionHeaderProps) => (
    <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
            <Icon className="size-4 text-app-accent"/>
            <h2 className="text-lg font-bold text-primary tracking-wide">
                {title}
            </h2>
        </div>
        <div className="h-1 w-30 bg-linear-to-r from-app-accent to-transparent rounded-full mb-2"/>
    </div>
);
