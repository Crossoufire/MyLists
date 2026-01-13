import {createFileRoute} from "@tanstack/react-router";
import {Bell, Calendar, CalendarDays, ChevronDown, Clock, Gamepad2, Monitor, MousePointer2, Popcorn} from "lucide-react";
import {
    OnboardingContainer,
    OnboardingDemoBox,
    OnboardingFeatureCard,
    OnboardingGrid,
    OnboardingNote,
    OnboardingSection,
    OnboardingSubSection
} from "@/lib/client/components/onboarding/OnBoardingShared";


export const Route = createFileRoute("/_main/_private/walkthrough/_layout/coming-next")({
    component: ComingNextOnboarding,
});


function ComingNextOnboarding() {
    return (
        <OnboardingContainer>
            <OnboardingSection
                title="Coming Next"
                icon={CalendarDays}
                description={
                    <>
                        Stay ahead of the curve. The <span className="text-primary font-semibold">Coming Next</span> page
                        aggregates all upcoming releases for the media types you track, so you never miss a premiere.
                    </>
                }
            />

            <OnboardingSubSection
                icon={MousePointer2}
                title="Where to find it"
                description={<>Access your release calendar directly from the navbar under the <b>MyMedia</b> menu.</>}
            >
                <OnboardingDemoBox className="flex-col gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-background border rounded-md text-sm font-medium">
                        MyMedia
                        <ChevronDown className="size-3 opacity-70"/>
                    </div>

                    <div className="w-56 border rounded-lg bg-popover shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 pb-1">
                        <div className="p-2 text-[10px] uppercase tracking-wide text-muted-foreground font-bold">
                            Tracking Lists
                        </div>
                        <div className="px-2 pb-2 space-y-1 opacity-40">
                            <div className="flex items-center gap-2 p-2 text-sm rounded-md">
                                <Popcorn className="size-4"/> Movies List
                            </div>
                            <div className="flex items-center gap-2 p-2 text-sm rounded-md">
                                <Monitor className="size-4"/> Series List
                            </div>
                        </div>
                        <div className="border-t border-border my-1"/>
                        <div className="p-1">
                            <div className="flex items-center gap-2 p-2 text-sm rounded-md bg-app-accent/20 text-app-accent font-bold ring-1 ring-app-accent/30">
                                <Calendar className="size-4"/>
                                Coming Next
                                <div className="ml-auto bg-app-accent text-black text-[9px] px-1 rounded">CLICK</div>
                            </div>
                        </div>
                    </div>
                </OnboardingDemoBox>
            </OnboardingSubSection>

            <OnboardingSubSection
                title="What's inside?"
                description="The page provides a chronological view of upcoming air dates and releases."
            >
                <OnboardingNote title="Note: Contextual Viewing">
                    The releases shown are filtered based on the <strong>Media Types</strong> you have enabled in your settings.
                    If you enable "Games" in your settings, game releases will automatically start appearing in your Coming Next feed!
                </OnboardingNote>

                <OnboardingGrid>
                    <OnboardingFeatureCard
                        icon={Calendar}
                        title="Release Dates"
                        description="View exact dates for movie theater releases, game launches, and series airing dates."
                    />
                    <OnboardingFeatureCard
                        icon={Clock}
                        title="Episode Countdowns"
                        description="For Series and Anime, see how many days or hours remain until the next episode airs."
                    />
                    <OnboardingFeatureCard
                        icon={Gamepad2}
                        title="Platform Sync"
                        description="Release data is automatically pulled from their respective providers."
                    />
                    <OnboardingFeatureCard
                        icon={Bell}
                        title="Notifications"
                        description="Receive a notification 7 days in advance when media you track are about to be released."
                    />
                </OnboardingGrid>
            </OnboardingSubSection>
        </OnboardingContainer>
    );
}
