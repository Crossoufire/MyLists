import {capitalize} from "@/utils/functions";
import {useCollapse} from "@/hooks/useCollapse";
import {Separator} from "@/components/ui/separator";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";


export const ProfileMiscInfo = ({ userData }) => {
    const { caret, toggleCollapse, contentClasses } = useCollapse();

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
            <CardContent className={contentClasses}>
                <div className="w-[90%]">
                    <div className="flex flex-col ml-6">
                        <div className="flex justify-between">
                            <div>Profile views</div>
                            <div>{userData.profile_views}</div>
                        </div>
                        {userData.settings.filter(s => s.active).map(setting =>
                            <div key={setting.media_type} className="flex justify-between">
                                <div>{`${capitalize(setting.media_type)}List`} views</div>
                                <div>{setting.views}</div>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
