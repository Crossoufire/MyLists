import {mail} from "@/lib/utils/helpers";
import {Coffee, Mail} from "lucide-react";
import {Link} from "@tanstack/react-router";
import {Button} from "@/lib/client/components/ui/button";
import {Separator} from "@/lib/client/components/ui/separator";


export const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="w-full p-3 pb-3 border-t border-t-neutral-700 bg-background mt-16">
            <div className="grid md:grid-cols-12 mx-auto gap-4 md:max-w-7xl text-center md:text-left mb-4">
                <div className="md:col-span-6 flex flex-col gap-y-1">
                    <div className="text-xl flex gap-x-2 font-bold items-center justify-center md:justify-start">
                        <img width={16} alt="favicon" className="mt-0.5" src="/favicon.ico"/>
                        MyLists.info
                    </div>
                    <p className="md:w-[85%]">
                        Create your media lists, see how much time you spent, follow your friends and compare with them.
                        Add favorites, comments, re-watch and gain levels to get to the top of the Hall of Fame.
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 max-sm:justify-center">
                        <a href={`mailto:${mail}`}>
                            <Button variant="outline" size="sm" className="flex items-center gap-2">
                                <Mail/> Contact us
                            </Button>
                        </a>
                        <a href="https://www.buymeacoffee.com/crossoufire" rel="noreferrer" target="_blank">
                            <Button size="sm" className="flex items-center gap-2">
                                <Coffee/> Buy Me A Coffee
                            </Button>
                        </a>
                    </div>

                </div>
                <div className="md:col-span-3 flex flex-col gap-y-1">
                    <div className="font-bold text-xl">Powered by</div>
                    <ul>
                        <li><a href="https://tanstack.com/start/" rel="noreferrer" target="_blank">Tanstack Start</a></li>
                        <li><a href="https://reactjs.org/" rel="noreferrer" target="_blank">React</a></li>
                        <li><a href="https://www.themoviedb.org/" rel="noreferrer" target="_blank">TMDB</a></li>
                        <li><a href="https://www.igdb.com/" rel="noreferrer" target="_blank">IGDB</a></li>
                        <li><a href="https://books.google.com/" rel="noreferrer" target="_blank">Google Books</a></li>
                    </ul>
                </div>
                <div className="md:col-span-3 flex flex-col gap-y-1">
                    <div className="font-bold text-xl">Information</div>
                    <ul>
                        <li><a href="https://github.com/Crossoufire/MyLists" rel="noreferrer" target="_blank">GitHub</a></li>
                        <li><a href="https://github.com/Crossoufire/MyLists/releases" rel="noreferrer" target="_blank">Changelog</a>
                        </li>
                        <li><Link to="/about">About</Link></li>
                        <li><Link to="/privacy-policy">Privacy Policy</Link></li>
                        <li><Link to="/features">Features</Link></li>
                    </ul>
                </div>
            </div>
            <Separator className="my-3"/>
            <div className="text-center">© 2019-{currentYear} - MyLists.info</div>
        </footer>
    );
};
