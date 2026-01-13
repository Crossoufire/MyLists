import {JSX} from "react";
import {mail} from "@/lib/utils/helpers";
import {ApiProviderType} from "@/lib/utils/enums";
import {createFileRoute, Link} from "@tanstack/react-router";
import {PageTitle} from "@/lib/client/components/general/PageTitle";
import {Popover, PopoverContent, PopoverTrigger} from "@/lib/client/components/ui/popover";
import {
    Activity,
    BarChart3,
    BellRing,
    BookOpen,
    Calendar,
    ChevronDown,
    Code2,
    Crop,
    Edit3,
    ExternalLink,
    FileSpreadsheet,
    Filter,
    Gamepad2,
    GraduationCap,
    LayoutList,
    LineChart,
    LucideIcon,
    Monitor,
    Repeat,
    Search,
    Share2,
    Shield,
    Tag,
    Trash2,
    Trophy,
    Users
} from "lucide-react";


export const Route = createFileRoute("/_main/_universal/features")({
    component: FeaturesPage,
});


type FeatureData = {
    name: string,
    icon: LucideIcon,
    details?: JSX.Element,
    description: JSX.Element | string,
    category: "New" | "Personalization" | "Analytics" | "Management" | "Social" | "Gaming" | "Media" | "Notifications" | "Other" | "Technical",
}


const FEATURES_DATA: FeatureData[] = [
    {
        icon: GraduationCap,
        category: "New",
        name: "New Walkthrough Tutorial",
        description: (
            <span>
                New here? Follow this walkthrough to learn how to use MyLists.info, add media, and get the most out it {" "}
                <Link to="/walkthrough/profile" className="inline-flex gap-1 items-center text-app-accent font-medium hover:text-app-accent/80">
                    here <ExternalLink className="size-3"/>
                </Link>.
            </span>
        )
    },
    {
        icon: Code2,
        category: "New",
        name: "New Backend Language",
        description: (
            <span>
                MyLists is now powered by TypeScript. While this improves long-term stability, bugs are expected during the transition. If you spot one, please <a
                className="text-app-accent font-medium hover:text-app-accent/80" href={`mailto:${mail}`}>contact me</a>.
            </span>
        )
    },
    {
        icon: Search,
        category: "New",
        name: "Search using !bangs",
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
        category: "New",
        name: "Season-based Re-watch",
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
        category: "New",
        name: "New Manga List",
        description: "Manga is officially supported! Enable it in your settings to start tracking your reading."
    },
    {
        icon: Crop,
        name: "Image Cropping",
        category: "Personalization",
        description: "No more stretched images. Crop your profile picture and back cover directly during upload."
    },
    {
        icon: BarChart3,
        category: "Analytics",
        name: "New Global Stats Page",
        description: "Revamped overview with a new 'Overall' section containing aggregated metrics.",
    },
    {
        icon: LineChart,
        category: "Analytics",
        name: "Enhanced Stats Dashboard",
        description: "Drill down into specific media lists via 'Advanced Stats' on your profile."
    },
    {
        icon: Trophy,
        category: "Analytics",
        name: "HoF Ranking System",
        description: "The Hall of Fame page has been redesigned with a new ranking algorithm."
    },
    {
        icon: Edit3,
        category: "Management",
        name: "Updates in /lists",
        description: "Edit everything about a media entry directly from your main list view."
    },
    {
        icon: Filter,
        category: "Management",
        name: "Advanced Filtering",
        description: "Refine your library with an expanded set of granular filter options."
    },
    {
        icon: LayoutList,
        name: "Table View",
        category: "Management",
        description: "Switch between Grid view and a data-dense Table layout for your lists."
    },
    {
        icon: Tag,
        name: "Custom Labels",
        category: "Personalization",
        description: "Create and apply custom tags to organize your media your way."
    },
    {
        name: "CSV Export",
        icon: FileSpreadsheet,
        category: "Management",
        description: "Data liberation: Download your entire media list as a CSV file."
    },
    {
        icon: Trash2,
        category: "Management",
        name: "Media Update Removal",
        description: "Made a mistake? You can now delete erroneous media history updates."
    },
    {
        icon: Gamepad2,
        category: "Gaming",
        name: "Game Platform",
        description: "Specify exactly which console or platform (PC, PS5, Switch) you played on."
    },
    {
        icon: Monitor,
        category: "Gaming",
        name: "Moviedle Game",
        description: "A Wordle-like mini-game: guess the movie from a pixelated poster."
    },
    {
        icon: Trophy,
        category: "Gaming",
        name: "Achievements System",
        description: "Earn badges with 4 difficulty levels based on your viewing habits."
    },
    {
        icon: Shield,
        name: "Privacy Mode",
        category: "Personalization",
        description: "Fine-tune visibility for your profile, lists, stats, and updates."
    },
    {
        icon: Activity,
        category: "Social",
        name: "User Updates",
        description: "Follow friends to populate your personalized activity feed."
    },
    {
        icon: Share2,
        category: "Social",
        name: "Social Connections",
        description: "View follower/following networks and discover new users."
    },
    {
        icon: Calendar,
        category: "Notifications",
        name: "Upcoming Releases",
        description: "Track release dates for your ongoing series, movies, and games."
    },
    {
        icon: BellRing,
        category: "Notifications",
        name: "Release Reminders",
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

    return (
        <PageTitle title="What's New in MyLists" subtitle="Discover the latest features and what's new and Improved">
            <div className="space-y-15 mb-20">
                {activeCategories.map((category) =>
                    <section key={category}>
                        <SectionHeader
                            title={category}
                            icon={category === "Analytics" ? BarChart3
                                : category === "Management" ? Edit3
                                    : category === "Social" ? Users
                                        : category === "Gaming" ? Gamepad2
                                            : category === "Notifications" ? BellRing
                                                : category === "New" ? Activity : Search
                            }
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
