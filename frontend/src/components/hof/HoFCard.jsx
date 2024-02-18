import {cn} from "@/lib/utils";
import {Link} from "react-router-dom";
import {Badge} from "@/components/ui/badge";
import {useUser} from "@/providers/UserProvider";
import {Card, CardContent} from "@/components/ui/card";


export const HoFCard = ({ item }) => {
    const { currentUser } = useUser();

    return (
        <Card key={item.username} className={cn("p-2 mb-5 bg-card", currentUser?.id === item.id && "bg-teal-950")}>
            <CardContent className="p-0">
                <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-3 md:col-span-1">
                        <div className="flex items-center justify-center text-lg h-full font-medium">
                            #{item.rank}
                        </div>
                    </div>
                    <div className="col-span-9 md:col-span-4">
                        <div className="relative">
                            <img
                                src={item.profile_image}
                                className="z-10 absolute top-[53px] left-[46px] rounded-full h-[70px] w-[70px]"
                                alt="profile-image"
                            />
                            <img
                                src={item.profile_border}
                                className="w-[162px] h-[162px]"
                                alt="frame-image"
                            />
                            <Badge variant="passive" className="z-20 absolute bottom-[17px] left-[59px]">
                                {item.profile_level}
                            </Badge>
                            <h6 className="block absolute font-medium left-[165px] bottom-[58px] text-center">
                                <Link to={`/profile/${item.username}`} className="hover:underline hover:underline-offset-2">
                                    {item.username}
                                </Link>
                            </h6>
                        </div>
                    </div>
                    <div className="col-span-12 md:col-span-7">
                        <div className="grid grid-cols-5 text-center items-center font-medium h-full">
                            <div className="flex flex-col justify-evenly items-center h-full">
                                <div>Series</div>
                                <Link to={`/list/series/${item.username}`}>
                                    <div className="mb-1"><img src={item.series_image} alt="series-grade"/></div>
                                    <div>{item.series_level}</div>
                                </Link>
                            </div>
                            <div className="flex flex-col justify-evenly items-center h-full">
                                <div>Anime</div>
                                {item.add_anime ?
                                    <Link to={`/list/anime/${item.username}`}>
                                        <div className="mb-1"><img src={item.anime_image} alt="anime-grade"/></div>
                                        <div>{item.anime_level}</div>
                                    </Link>
                                    :
                                    <div className="flex content-center items-center h-[68px]">Disabled</div>
                                }
                            </div>
                            <div className="flex flex-col justify-evenly items-center h-full">
                                <div>Movies</div>
                                <Link to={`/list/movies/${item.username}`}>
                                    <div className="mb-1"><img src={item.movies_image} alt="movies-grade"/></div>
                                    <div>{item.movies_level}</div>
                                </Link>
                            </div>
                            <div className="flex flex-col justify-evenly items-center h-full">
                                <div>Books</div>
                                {item.add_books ?
                                    <Link to={`/list/books/${item.username}`}>
                                        <div className="mb-1"><img src={item.books_image} alt="books-grade"/></div>
                                        <div>{item.books_level}</div>
                                    </Link>
                                    :
                                    <div className="flex content-center items-center h-[68px]">Disabled</div>
                                }
                            </div>
                            <div className="flex flex-col justify-evenly items-center h-full">
                                <div>Games</div>
                                {item.add_games ?
                                    <Link to={`/list/games/${item.username}`}>
                                        <div className="mb-1"><img src={item.games_image} alt="games-grade"/></div>
                                        <div>{item.games_level}</div>
                                    </Link>
                                    :
                                    <div className="flex content-center items-center h-[68px]">Disabled</div>
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
};