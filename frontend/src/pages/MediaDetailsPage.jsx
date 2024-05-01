import {ErrorPage} from "@/pages/ErrorPage";
import {Button} from "@/components/ui/button";
import {useUser} from "@/providers/UserProvider";
import {useFetchData} from "@/hooks/FetchDataHook";
import {Separator} from "@/components/ui/separator";
import {PageTitle} from "@/components/app/PageTitle";
import {useApiUpdater} from "@/hooks/UserUpdaterHook";
import {Loading} from "@/components/app/base/Loading";
import {FollowCard} from "@/components/media/general/FollowCard";
import {RefreshMedia} from "@/components/media/general/RefreshMedia";
import {SimilarMedia} from "@/components/media/general/SimilarMedia";
import {UserListDetails} from "@/components/media/general/UserListDetails";
import {MediaDataDetails} from "@/components/media/general/MediaDataDetails";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Link, useNavigate, useParams, useSearchParams} from "react-router-dom";


export const MediaDetailsPage = () => {
	const { currentUser } = useUser();
	const navigate = useNavigate();
	const { mediaId, mediaType } = useParams();
	const [searchParams] = useSearchParams();
	const { refresh } = useApiUpdater(mediaId, mediaType);
	const { apiData, loading, error, mutate } = useFetchData(`/details/${mediaType}/${mediaId}`,
		{...Object.fromEntries(searchParams)});

	if (error) return <ErrorPage {...error}/>;
	if (loading) return <Loading/>;
	if (apiData.redirect) return navigate(`/details/${mediaType}/${apiData.media.id}`, { replace: true });

	return (
		<PageTitle title={apiData.media.name} onlyHelmet>
			<div className="max-w-[1000px] mx-auto">
				<div>
					<h3 className="text-2xl font-semibold flex justify-between items-center mt-8">
						<div className="flex items-center gap-4">
							{apiData.media.name}
						</div>
						{(currentUser.role !== "user" && mediaType !== "books") &&
							<RefreshMedia
								updateRefresh={refresh}
								mutateData={mutate}
								lastApiUpdate={apiData.media.last_api_update}
							/>
						}
					</h3>
					<Separator/>
				</div>
				<div className="grid grid-cols-12 gap-y-10">
					<div className="col-span-12 md:col-span-5 lg:col-span-4">
						<div className="flex flex-col items-center sm:items-start gap-4">
							<img
								src={apiData.media.media_cover}
								className="w-[300px] h-[450px] rounded-md"
								alt="media-cover"
							/>
							<UserListDetails
								apiData={apiData}
								mediaType={mediaType}
								mutateData={mutate}
							/>
						</div>
					</div>
					<div className="col-span-12 md:col-span-7 lg:col-span-8">
						<Tabs defaultValue="mediaDetails">
							<TabsList className="grid grid-cols-2">
								<TabsTrigger value="mediaDetails">Media Details</TabsTrigger>
								<TabsTrigger value="follows">Your Follows ({apiData.follows_data.length})</TabsTrigger>
							</TabsList>
							<TabsContent value="mediaDetails">
								<MediaDataDetails
									mediaData={apiData.media}
									mediaType={mediaType}
								/>
								<SimilarMedia
									mediaType={mediaType}
									similarMedia={apiData.similar_media}
								/>
							</TabsContent>
							<TabsContent value="follows">
								{apiData.follows_data.length !== 0 &&
									<div className="mb-10 mt-6">
										<div className="grid grid-cols-12 gap-4">
											{apiData.follows_data.map(follow =>
												<div key={follow.id} className="col-span-12 md:col-span-6 lg:col-span-6">
													<FollowCard
														key={follow.username}
														follow={follow}
														mediaType={mediaType}
													/>
												</div>
											)}
										</div>
									</div>
								}
							</TabsContent>
						</Tabs>
					</div>
				</div>
				{(mediaType === "books" || currentUser.role !== "user") &&
					<div className="flex justify-end mt-12">
						<Link to={`/details/form/${mediaType}/${mediaId}`}>
							<Button variant="warning">Edit Media</Button>
						</Link>
					</div>
				}
			</div>
		</PageTitle>
	);
};
