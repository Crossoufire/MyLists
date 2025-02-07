import {Mail} from "lucide-react";
import {mail} from "@/utils/constants";
import {Link} from "@tanstack/react-router";
import {Separator} from "@/components/ui/separator";


export const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="w-full p-2 border-t border-t-neutral-700 bg-background mt-20">
            <div className="grid md:grid-cols-12 mx-auto gap-4 md:max-w-screen-xl text-center md:text-left">
                <div className="md:col-span-6 flex flex-col gap-y-1">
                    <div className="text-xl flex gap-x-2 font-bold items-center justify-center md:justify-start">
                        <img src="/favicon.ico" width={16} alt="favicon"/> MyLists.info
                    </div>
                    <p className="md:w-[85%]">
                        Create your media lists, see how much time you spent, follow your friends and compare with them.
                        Add favorites, comments, re-watch and gain levels to get to the top of the Hall of Fame.
                    </p>
                    <div className="flex gap-4 mt-2">
                        <a href={`mailto:${mail}`}
                           className="mt-2 flex gap-2 items-center font-bold justify-center md:justify-start">
                            <Mail className="w-5 h-5"/> Contact us
                        </a>
                        <a href="https://www.buymeacoffee.com/crossoufire" rel="noreferrer" target="_blank">
                            <img
                                alt="Buy Me A Coffee"
                                src="https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png"
                            />
                        </a>
                    </div>

                </div>
                <div className="md:col-span-3 flex flex-col gap-y-1">
                    <div className="font-bold text-xl">Powered by</div>
                    <ul>
                        <li><a href="https://flask.palletsprojects.com/" rel="noreferrer" target="_blank">Flask</a></li>
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
            <Separator className="mt-3"/>
            <div className="text-center">© 2019-{currentYear} Copyright: MyLists.info</div>
        </footer>
    );
};
