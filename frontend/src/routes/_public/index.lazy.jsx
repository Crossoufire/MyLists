import {toast} from "sonner";
import {useEffect, useState} from "react";
import homeImage from "@/images/home1.jpg";
import {Separator} from "@/components/ui/separator";
import {PageTitle} from "@/components/app/base/PageTitle";
import {LoginForm} from "@/components/homepage/LoginForm";
import {createLazyFileRoute} from "@tanstack/react-router";
import {RegisterForm} from "@/components/homepage/RegisterForm";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {LuDollarSign, LuHeart, LuMessageCircle, LuMonitorSmartphone, LuPackageOpen, LuSparkles} from "react-icons/lu";


// noinspection JSCheckFunctionSignatures,JSUnusedGlobalSymbols
export const Route = createLazyFileRoute("/_public/")({
    component: HomePage,
});


function HomePage() {
    const search = Route.useSearch();
    const [activeTab, setActiveTab] = useState("login");

    useEffect(() => {
        if (search.message) {
            toast.warning(search.message);
        }
    }, [search]);

    const onTabChange = (newTab) => {
        setActiveTab(newTab);
    };

    return (
        <PageTitle title="HomePage" onlyHelmet>
            <div className="relative bg-cover h-[800px] w-[99.7vw] left-[calc(-50vw+50%)]" style={{ backgroundImage: `url(${homeImage})` }}/>
            <div className="absolute w-1/2 top-32 left-1/4 flex flex-col items-center">
                <div className="text-4xl md:text-7xl text-center font-semibold mb-14">Welcome to MyLists</div>
                <Tabs value={activeTab} onValueChange={onTabChange} className="w-[320px]">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="login">Login</TabsTrigger>
                        <TabsTrigger value="register">Register</TabsTrigger>
                    </TabsList>
                    <TabsContent value="login">
                        <LoginForm/>
                    </TabsContent>
                    <TabsContent value="register">
                        <RegisterForm onTabChange={onTabChange}/>
                    </TabsContent>
                </Tabs>
            </div>
            <section className="mt-6">
                <div className="grid md:grid-cols-3 items-center gap-6">
                    <Card className="h-full">
                        <CardHeader className="px-4">
                            <CardTitle>Create your lists</CardTitle>
                            <Separator/>
                        </CardHeader>
                        <CardContent>
                            Currently, we support TV shows/series, anime, movies, games and books list.
                            Get an overall view in one place!
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Check your time spent</CardTitle>
                            <Separator/>
                        </CardHeader>
                        <CardContent>
                            See how much time you have spent, level up, add score or feels to each media,
                            and get on top of the Hall of Fame!
                        </CardContent>
                    </Card>
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle>Follows people</CardTitle>
                            <Separator/>
                        </CardHeader>
                        <CardContent>
                            See what your follows watched, read or played, get recommendations,
                            and stay updated!
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


export default function FeatureCards() {
    const features = [
        {
            icon: <LuMonitorSmartphone size={25}/>,
            title: "Responsive",
            description: "Fully responsive created with Shadcn/UI. Supports PC, tablets, mobile, and TV."
        },
        {
            icon: <LuPackageOpen size={25}/>,
            title: "Open Source",
            description: "Totally open source, made using Flask and React. You can find the source code on my Github page."
        },
        {
            icon: <LuDollarSign size={25}/>,
            title: "No ads - 100% free",
            description: "You will not find any ads, we don't do that here. You only need to create an account to access all the content."
        },
        {
            icon: <LuMessageCircle size={25}/>,
            title: "Found a bug?",
            description: "You can contact me by mail at: contact.us.at.mylists@gmail.com"
        },
        {
            icon: <LuHeart size={25}/>,
            title: "Made by me with ❤️",
            description: "I hope you will like it. If you have any suggestions, do not hesitate to contact me."
        },
        {
            icon: <LuSparkles size={25}/>,
            title: "New features coming",
            description: "I still have ideas, just not enough time. Stay tuned!"
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
            {features.map((feature, idx) => (
                <div key={idx} className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                        {feature.icon}
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                        <p className="text-gray-300">{feature.description}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}