import homeImage from "@/lib/images/home1.jpg"
import {Button} from "@/lib/components/ui/button";
import {PageTitle} from "@/lib/components/PageTitle";
import {Separator} from "@/lib/components/ui/separator";
import {createFileRoute, Link} from "@tanstack/react-router";
import {Card, CardContent, CardHeader, CardTitle} from "@/lib/components/ui/card";
import {ArrowRight, DollarSign, Heart, MessageCircle, MonitorSmartphone, PackageOpen, Sparkles,} from "lucide-react";


export const Route = createFileRoute("/")({
    component: HomePage,
})


function HomePage() {
    return (
        <PageTitle title="HomePage" onlyHelmet>
            <div
                className="relative flex flex-col items-center justify-center bg-cover h-[600px] w-[99.7vw] left-[calc(-50vw+50%)] max-sm:h-[350px]"
                style={{ backgroundImage: `url(${homeImage})` }}
            >
                <div className="text-7xl text-center font-semibold max-sm:text-5xl">
                    Welcome to MyLists
                </div>
                <div className="mt-8">
                    <Button>
                        {/*//@ts-ignore*/}
                        <Link to="/profile/DemoProfile" className="flex items-center gap-2">
                            Demo Profile <ArrowRight/>
                        </Link>
                    </Button>
                </div>
            </div>
            <section className="mt-6">
                <div className="grid md:grid-cols-3 items-center gap-6">
                    <Card className="h-full">
                        <CardHeader className="px-4">
                            <CardTitle>Create your lists</CardTitle>
                            <Separator/>
                        </CardHeader>
                        <CardContent>
                            Currently, we support TV shows/series, anime, movies, games and
                            books list. Get an overall view in one place!
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Check your time spent</CardTitle>
                            <Separator/>
                        </CardHeader>
                        <CardContent>
                            See how much time you have spent, level up, add score or feels to
                            each media, and get on top of the Hall of Fame!
                        </CardContent>
                    </Card>
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle>Follows people</CardTitle>
                            <Separator/>
                        </CardHeader>
                        <CardContent>
                            See what your follows watched, read or played, get
                            recommendations, and stay updated!
                        </CardContent>
                    </Card>
                </div>
            </section>
            <section className="mt-6">
                <FeatureCards/>
            </section>
        </PageTitle>
    );
}


function FeatureCards() {
    const features = [
        {
            icon: <MonitorSmartphone size={25}/>,
            title: "Responsive",
            description:
                "Fully responsive created with Shadcn/UI. Supports PC, tablets, mobile, and TV.",
        },
        {
            icon: <PackageOpen size={25}/>,
            title: "Open Source",
            description:
                "Totally open source, made using Flask and React. You can find the source code on my Github page.",
        },
        {
            icon: <DollarSign size={25}/>,
            title: "No ads - 100% free",
            description:
                "You will not find any ads, we don't do that here. You only need to create an account to access all the content.",
        },
        {
            icon: <MessageCircle size={25}/>,
            title: "Found a bug?",
            description:
                "You can contact me by mail at: contact.us.at.mylists@gmail.com",
        },
        {
            icon: <Heart size={25}/>,
            title: "Made by me with ❤️",
            description:
                "I hope you will like it. If you have any suggestions, do not hesitate to contact me.",
        },
        {
            icon: <Sparkles size={25}/>,
            title: "New features coming",
            description: "I still have ideas, just not enough time. Stay tuned!",
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
            {features.map((feature, idx) => (
                <div key={idx} className="flex items-start space-x-4">
                    <div className="flex-shrink-0">{feature.icon}</div>
                    <div>
                        <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                        <p className="text-gray-300">{feature.description}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}
