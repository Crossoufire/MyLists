import {capitalize} from "@/lib/utils/functions";
import {useCollapse} from "@/lib/client/hooks/use-collapse";
import {UserDataType} from "@/lib/types/query.options.types";
import {Card, CardContent, CardHeader, CardTitle} from "@/lib/client/components/ui/card";


interface ProfileMiscInfoProps {
    userData: UserDataType;
}


export const ProfileMiscInfo = ({ userData }: ProfileMiscInfoProps) => {
    const { caret, toggleCollapse, contentClasses } = useCollapse();

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    <div className="flex gap-2">
                        {caret}
                        <div role="button" onClick={toggleCollapse}>
                            Information
                        </div>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className={contentClasses}>
                <div className="w-[90%]">
                    <div className="flex flex-col ml-6">
                        <div className="flex justify-between">
                            <div>Profile views</div>
                            <div>{userData.profileViews}</div>
                        </div>
                        {userData.userMediaSettings.filter((s) => s.active).map((setting) =>
                            <div key={setting.mediaType} className="flex justify-between">
                                <div>{`${capitalize(setting.mediaType)}List`} views</div>
                                <div>{setting.views}</div>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
