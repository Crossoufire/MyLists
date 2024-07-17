import {useState} from "react";
import {userClient} from "@/api/MyApiClient";
import {Button} from "@/components/ui/button";
import {fetcher} from "@/lib/fetcherLoader.jsx";
import {Separator} from "@/components/ui/separator";
import {PageTitle} from "@/components/app/base/PageTitle.jsx";
import {useApiUpdater} from "@/hooks/UserUpdaterHook";
import {createFileRoute, Link} from "@tanstack/react-router";
import {FollowCard} from "@/components/media/general/FollowCard";
import {SimilarMedia} from "@/components/media/general/SimilarMedia";
import {RefreshMedia} from "@/components/media/general/RefreshMedia";
import {UserListDetails} from "@/components/media/general/UserListDetails";
import {MediaDataDetails} from "@/components/media/general/MediaDataDetails";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";


// noinspection JSCheckFunctionSignatures
export const Route = createFileRoute("/_private/details/$mediaType/$mediaId")({
	component: MediaDetailsWrapper,
	loaderDeps: ({ search: { external } }) => ({ external }),
	loader: async ({ params, deps }) => {
		return await fetcher(`/details/${params.mediaType}/${params.mediaId}`, { external: deps.external });
	},
});


function MediaDetailsPage() {
	const data = Route.useLoaderData();
	const { mediaType } = Route.useParams();
	const currentUser = userClient.currentUser;
	const [apiData, setApiData] = useState(data);
	const { refresh } = useApiUpdater(apiData.media.id, mediaType);

	const mutateData = async () => {
		const data = await fetcher(`/details/${mediaType}/${apiData.media.id}`);
		setApiData(data);
	};

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
								mutateData={mutateData}
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
								setApiData={setApiData}
								mediaType={mediaType}
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
						<Link to={`/details/form/${mediaType}/${apiData.media.id}`}>
							<Button variant="warning">Edit Media</Button>
						</Link>
					</div>
				}
			</div>
		</PageTitle>
	);
}


function MediaDetailsWrapper() {
	const { mediaType, mediaId } = Route.useParams();
	return <MediaDetailsPage key={`${mediaType}-${mediaId}`}/>;
}
