import {Link} from "react-router-dom";
import {ErrorPage} from "@/pages/ErrorPage";
import {useFetchData} from "@/hooks/FetchDataHook";
import {Separator} from "@/components/ui/separator";
import {Return} from "@/components/primitives/Return";
import {Loading} from "@/components/primitives/Loading";
import {PageTitle} from "@/components/app/PageTitle.jsx";
import {capitalize} from "@/lib/utils.jsx";


export const FollowsFollowers = ({ username, extension }) => {
    const { apiData, loading, error } = useFetchData(`/profile/${username}/${extension}`)

    if (error) return <ErrorPage error={error}/>;
    if (loading) return <Loading addStyle={"text-center"}/>;

    return (
        <PageTitle title={capitalize(extension)}>
            <Return className="mb-6"
                to={`/profile/${username}`}
                value="to profile"
            />
            <div className="flex justify-start flex-wrap gap-11">
                {apiData.follows.map(user =>
                    <Link key={user.id} to={`/profile/${user.username}`}>
                        <div className="flex items-center flex-col">
                            <img
                                src={user.profile_image}
                                className="h-20 w-20 bg-neutral-600 rounded-full"
                                alt="profile-picture"
                            />
                            <div className="mt-2 font-medium">
                                {user.username}
                            </div>
                        </div>
                    </Link>
                )}
            </div>
        </PageTitle>
    )
};
