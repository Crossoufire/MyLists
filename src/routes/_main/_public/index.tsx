import {Button} from "@/lib/client/components/ui/button";
import {createFileRoute, Link} from "@tanstack/react-router";
import {PageTitle} from "@/lib/client/components/general/PageTitle";
import {Card, CardContent, CardHeader, CardTitle} from "@/lib/client/components/ui/card";
import {ArrowRight, Bug, Clock, Code, Heart, Monitor, Play, Shield, Sparkles, Users,} from "lucide-react";


export const Route = createFileRoute("/_main/_public/")({
    component: HomePage,
})


const features = [
    {
        icon: <Monitor className="size-6"/>,
        title: "Fully Responsive",
        description:
            "Perfect experience across all devices - desktop, tablet, mobile, and even TV interfaces.",
    },
    {
        icon: <Code className="size-6"/>,
        title: "Open Source",
        description: "Completely open source built with modern technologies. Contribute on GitHub and help improve the platform.",
    },
    {
        icon: <Shield className="size-6"/>,
        title: "100% Free",
        description: "No ads, no premium tiers, no hidden costs. Just create an account and access everything for free.",
    },
    {
        icon: <Bug className="size-6"/>,
        title: "Community Support",
        description: "Found an issue? Have suggestions? We're here to help and constantly improving based on feedback.",
    },
    {
        icon: <Heart className="size-6 text-red-600"/>,
        title: "Passion Project",
        description: "Made by one person, I hope you will like it. If you have any suggestions, do not hesitate to contact me.",
    },
    {
        icon: <Sparkles className="size-6"/>,
        title: "Always Evolving",
        description: "Regular updates with new features, improvements, and integrations. Stay tuned!",
    },
];


function HomePage() {
    return (
        <PageTitle title="HomePage" onlyHelmet>
            <section className="relative flex flex-col items-center justify-center bg-cover h-[600px] w-[99.7vw] left-[calc(-50vw+50%)] max-sm:h-[350px]">
                <div className="absolute inset-0 bg-gradient-to-br from-background via-background/90 to-background/80">
                    <div className="absolute inset-0 opacity-20">
                        <div className="grid grid-cols-8 gap-1 h-full">
                            {Array.from({ length: 32 }).map((_, i) =>
                                <div
                                    key={i}
                                    style={{ animationDelay: `${i * Math.random()}s` }}
                                    className="bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg float-animation"
                                />
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex flex-col items-center gap-2 relative z-10 text-center space-y-8 px-4">
                    <h1 className="text-4xl md:text-6xl font-bold text-balance">Welcome to MyLists</h1>
                    <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto text-balance">
                        Manage lists, track time spent, and follow other enthusiasts in one beautiful platform
                    </p>
                    <Link to="/profile/$username" params={{ username: "DemoProfile" }}>
                        <Button size="lg" className="gap-2" variant="emeraldy">
                            Demo Profile <ArrowRight/>
                        </Button>
                    </Link>
                </div>
            </section>

            <section className="container mx-auto px-6 py-12">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">
                        Everything You Need
                    </h2>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
                        Powerful features designed for media enthusiasts who want to track, organize, and share their journey
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    <Card className="group hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 border-border/50 hover:border-primary/30">
                        <CardHeader className="text-center pb-4">
                            <div className="size-15 bg-accent rounded-xl flex items-center justify-center mx-auto mb-4 transition-transform">
                                <Play className="size-8 text-primary"/>
                            </div>
                            <CardTitle className="text-xl">Manage Your Lists</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center leading-relaxed">
                            Support for TV shows, Anime, Movies, Games, Books, and Manga. Get a comprehensive overview of all your
                            media in one organized place.
                        </CardContent>
                    </Card>
                    <Card className="group hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 border-border/50 hover:border-primary/30">
                        <CardHeader className="text-center pb-4">
                            <div className="size-15 bg-accent rounded-xl flex items-center justify-center mx-auto mb-4 transition-transform">
                                <Clock className="size-8 text-primary"/>
                            </div>
                            <CardTitle className="text-xl">Track Your Time</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center leading-relaxed">
                            Monitor time spent, level up your profile, rate content, and climb the Hall of Fame leaderboard with
                            detailed analytics.
                        </CardContent>
                    </Card>
                    <Card className="group hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 border-border/50 hover:border-primary/30">
                        <CardHeader className="text-center pb-4">
                            <div className="size-15 bg-accent rounded-xl flex items-center justify-center mx-auto mb-4 transition-transform">
                                <Users className="size-8 text-primary"/>
                            </div>
                            <CardTitle className="text-xl">Connect & Follow</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center leading-relaxed">
                            Follow friends, discover what they're watching, get personalized recommendations, and stay updated with
                            their activity.
                        </CardContent>
                    </Card>
                </div>
            </section>

            <section className="container mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">Why Choose MyLists?</h2>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
                        Built with modern technology and user experience in mind
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
                    {features.map((feature, idx) =>
                        <div key={idx} className="flex items-start gap-4 p-6 rounded-xl hover:bg-card transition-colors">
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                {feature.icon}
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </PageTitle>
    );
}
