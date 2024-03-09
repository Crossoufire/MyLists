import {capitalize, cn} from "@/lib/utils";
import {Link} from "react-router-dom";
import {Badge} from "@/components/ui/badge";
import {useUser} from "@/providers/UserProvider";
import {Skeleton} from "@/components/ui/skeleton";
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
                            <ListItem item={item} mediaType="series"/>
                            <ListItem item={item} mediaType="anime"/>
                            <ListItem item={item} mediaType="movies"/>
                            <ListItem item={item} mediaType="books"/>
                            <ListItem item={item} mediaType="games"/>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
};


const ListItem = ({ item, mediaType }) => {
    const checkDisabled = item.hasOwnProperty(`add_${mediaType}`) ? item[`add_${mediaType}`] === true : true;

    return (
        <div className="flex flex-col justify-evenly items-center h-full">
            <div>{capitalize(mediaType)}</div>
            {checkDisabled ?
                <Link to={`/list/${mediaType}/${item.username}`}>
                    <div className="mb-1"><img src={item[`${mediaType}_image`]} alt={`${mediaType}-grade`} /></div>
                    <div>{item[`${mediaType}_level`]}</div>
                </Link>
                :
                <div className="flex content-center items-center h-[68px]">Disabled</div>
            }
        </div>
    );
};


HoFCard.Skeleton = function SkeletonHoFCard() {
    return <Skeleton className="p-2 mb-5 bg-card md:h-[178px] h-[282px]"/>;
};
