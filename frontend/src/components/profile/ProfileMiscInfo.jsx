import {useCollapse} from "@/hooks/CollapseHook";
import {Separator} from "@/components/ui/separator";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {capitalize} from "@/utils/functions.jsx";


export const ProfileMiscInfo = ({ user, mediaData }) => {
    const { isOpen, caret, toggleCollapse } = useCollapse();

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    <div className="p-1 flex gap-2 items-center">
                        {caret}
                        <div role="button" onClick={toggleCollapse}>
                            Information
                        </div>
                    </div>
                </CardTitle>
                <Separator/>
            </CardHeader>
            <CardContent>
                {isOpen &&
                    <div className="w-[90%]">
                        <div className="flex flex-col ml-6">
                            <div className="flex justify-between">
                                <div>Profile views</div>
                                <div>{user.profile_views}</div>
                            </div>
                            {mediaData.map(data =>
                                <div key={data.media_type} className="flex justify-between">
                                    <div>{`${capitalize(data.media_type)}List`} views</div>
                                    <div>{user.settings[`${data.media_type}`].views}</div>
                                </div>
                            )}
                        </div>
                    </div>
                }
            </CardContent>
        </Card>
    );
};
