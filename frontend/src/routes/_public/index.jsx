import {useState} from "react";
import {mail} from "@/utils/constants.js";
import homeImage from "@/images/home1.jpg";
import {Separator} from "@/components/ui/separator";
import {createFileRoute} from "@tanstack/react-router";
import {PageTitle} from "@/components/app/base/PageTitle";
import {LoginForm} from "@/components/homepage/LoginForm";
import {RegisterForm} from "@/components/homepage/RegisterForm";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {FaBootstrap, FaCode, FaComment, FaDollarSign, FaGithub, FaHeart, FaSmile} from "react-icons/fa";


// noinspection JSCheckFunctionSignatures,JSUnusedGlobalSymbols
export const Route = createFileRoute("/_public/")({
    component: HomePage,
});


function HomePage() {
    const [activeTab, setActiveTab] = useState("login");

    const onTabChange = (newTab) => {
        setActiveTab(newTab);
    };

    return (
        <PageTitle title="HomePage" onlyHelmet>
            <div className="relative bg-cover h-[800px] w-[99.7vw] left-[calc(-50vw+50%)]" style={{backgroundImage: `url(${homeImage})`}}/>
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
                <div className="grid md:grid-cols-3 items-center gap-y-10">
                    <div className="p-2">
                        <div className="flex flex-col">
                            <div className="flex items-center">
                                <FaBootstrap size={35} className="mr-5"/>
                                <div className="text-lg font-bold">Responsive</div>
                            </div>
                            <p className="ml-14">
                                Fully responsive created with Shadcn/ui.
                                Supports PC, tablets, mobile, and TV.
                            </p>
                        </div>
                    </div>
                    <div className="p-2">
                        <div className="flex flex-col">
                            <div className="flex items-center">
                                <FaGithub size={35} className="mr-5"/>
                                <div className="text-lg font-bold">Open Source</div>
                            </div>
                            <p className="ml-14">
                                Totally open source, made with&nbsp;
                                <a href="https://flask.palletsprojects.com/" target="_blank" rel="noreferrer">Flask </a>
                                and <a href="https://react.dev" target="_blank" rel="noreferrer"> React</a>.
                                You can find the source code on&nbsp;
                                <a href="https://www.github.com/Crossoufire/MyLists" target="_blank"
                                   rel="noreferrer">Github</a>.
                            </p>
                        </div>
                    </div>
                    <div className="p-2">
                        <div className="flex flex-col">
                            <div className="flex items-center">
                                <FaDollarSign size={35} className="mr-5"/>
                                <div className="text-lg font-bold">No ads & 100% free</div>
                            </div>
                            <p className="ml-14">
                                You will not find any ads, we don't do that here.
                                You only need to create an account to access all the content.
                            </p>
                        </div>
                    </div>
                    <div className="p-2">
                        <div className="flex flex-col">
                            <div className="flex items-center">
                                <FaComment size={35} className="mr-5"/>
                                <div className="text-lg font-bold">Found a bug?</div>
                            </div>
                            <p className="ml-14">
                                You can contact us by e-mail at:
                                <a href={`mailto:${mail}`}> {mail}</a>
                            </p>
                        </div>
                    </div>
                    <div className="p-2">
                        <div className="flex flex-col">
                            <div className="flex items-center">
                                <FaSmile size={35} className="mr-5"/>
                                <div className="text-lg font-bold flex items-center">
                                    Made by me with <FaHeart size={15}/>
                                </div>
                            </div>
                            <p className="ml-14">
                                Fully responsive created with Tailwind CSS.
                                Supports PC, tablets, mobile, and TV.
                            </p>
                        </div>
                    </div>
                    <div className="p-2">
                        <div className="flex flex-col">
                            <div className="flex items-center">
                                <FaCode size={35} className="mr-5"/>
                                <div className="text-lg font-bold">New features coming</div>
                            </div>
                            <p className="ml-14">
                                I have still ideas, just not enough time. Stay tuned!
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </PageTitle>
    );
}