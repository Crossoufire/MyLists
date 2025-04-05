import {capitalize} from "@/lib/utils/functions";
import {useCollapse} from "@/lib/hooks/use-collapse";
import {Separator} from "@/lib/components/ui/separator";
import {profileOptions} from "@/lib/react-query/query-options";
import {Card, CardContent, CardHeader, CardTitle} from "@/lib/components/ui/card";


interface ProfileMiscInfoProps {
    userData: Awaited<ReturnType<NonNullable<ReturnType<typeof profileOptions>["queryFn"]>>>["userData"];
}


export const ProfileMiscInfo = ({ userData }: ProfileMiscInfoProps) => {
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
                            <div>{userData.profileViews}</div>
                        </div>
                        {userData.userMediaSettings.filter(s => s.active).map(setting =>
                            <div key={setting.mediaType} className="flex justify-between">
                                <div>{`${capitalize(setting.mediaType)}List`} views</div>
                                <div>{setting.views}</div>
                            </div>,
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
