import {capitalize} from "@/lib/utils";
import {useCollapse} from "@/hooks/CollapseHook";
import {Separator} from "@/components/ui/separator";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";


export const ProfileViewsInfo = ({ userData }) => {
    const { isOpen, caret, toggleCollapse } = useCollapse();

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    <div className="p-1 flex gap-2 items-center">
                        {caret} <div role="button" onClick={toggleCollapse}>Information</div>
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
                                <div>{userData.profile_views}</div>
                            </div>
                            {userData.settings.map(setting =>
                                <div key={setting.media_type} className="flex justify-between">
                                    <div>{`${capitalize(setting.media_type)}List`} views</div>
                                    <div>{setting.views}</div>
                                </div>
                            )}
                        </div>
                    </div>
                }
            </CardContent>
        </Card>
    );
};
