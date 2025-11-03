import {Badge} from "@/lib/client/components/ui/badge";
import {createFileRoute} from "@tanstack/react-router";
import {AlertCircle, CheckCircle2, XCircle} from "lucide-react";
import {PageTitle} from "@/lib/client/components/general/PageTitle";
// import {getUserUploads} from "@/lib/server/functions/user-settings";
import {ProcessResult} from "@/lib/server/domain/tasks/tasks.service";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/lib/client/components/ui/tabs"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/lib/client/components/ui/card"


// const uploadsOptions = (taskId: string) => queryOptions({
//     queryKey: ["uploads", taskId],
//     queryFn: () => getUserUploads({ data: { taskId } }),
// });


export const Route = createFileRoute("/_main/_private/settings/uploads/$taskId")({
    // loader: ({ context: { queryClient }, params: { taskId } }) => queryClient.ensureQueryData(uploadsOptions(taskId)),
    component: () => <></>,
});


// eslint-disable-next-line @typescript-eslint/no-unused-vars
function UserUploadsPage() {
    // const { taskId } = Route.useParams();
    // const csvResult = useSuspenseQuery(uploadsOptions(taskId)).data;

    return (
        <PageTitle title="Result of Upload" subtitle="Review the status of your imported movies">
            {/*{!csvResult ?*/}
            {/*    <MutedText>Failed to parse your upload</MutedText>*/}
            {/*    :*/}
            {/*    <UploadResults data={csvResult}/>*/}
            {/*}*/}
        </PageTitle>
    );
}


export function UploadResults({ data }: { data: ProcessResult }) {
    const addedItems = data.items.filter((item) => item.status === "success")
    const skippedItems = data.items.filter((item) => item.status === "skipped")
    const notFoundItems = data.items.filter((item) => item.status === "notFound")

    return (
        <Tabs defaultValue="skipped" className="mt-2">
            <TabsList>
                <TabsTrigger value="added" className="px-4">
                    <CheckCircle2 className="size-4"/>
                    <span>Added To Your List ({addedItems.length})</span>
                </TabsTrigger>
                <TabsTrigger value="skipped" className="px-4">
                    <AlertCircle className="size-4"/>
                    <span>Already In Your List ({skippedItems.length})</span>
                </TabsTrigger>
                <TabsTrigger value="notFound" className="px-4">
                    <XCircle className="size-4"/>
                    <span>Not Found ({notFoundItems.length})</span>
                </TabsTrigger>
            </TabsList>
            <TabsContent value="added" className="mt-4">
                {addedItems.length === 0 ?
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4"/>
                            <p className="text-muted-foreground text-center">
                                No movies were added
                            </p>
                        </CardContent>
                    </Card>
                    :
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {addedItems.map((item, idx) =>
                            <Card key={idx} className="border-success/20 bg-card">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <CardTitle className="text-base leading-relaxed text-pretty">
                                            {item.metadata.name}
                                        </CardTitle>
                                        <Badge className="bg-success text-success-foreground shrink-0">
                                            Added
                                        </Badge>
                                    </div>
                                    <CardDescription>
                                        {new Date(item.metadata.releaseDate).getFullYear()}
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                        )}
                    </div>
                }
            </TabsContent>
            <TabsContent value="skipped" className="mt-6">
                {skippedItems.length === 0 ?
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4"/>
                            <p className="text-muted-foreground text-center">
                                No movies were already in your list
                            </p>
                        </CardContent>
                    </Card>
                    :
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {skippedItems.map((item, idx) =>
                            <Card key={idx} className="border-warning/20 bg-card">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <CardTitle className="text-base leading-relaxed text-pretty">
                                            {item.metadata.name}
                                        </CardTitle>
                                        <Badge className="bg-warning text-warning-foreground shrink-0">
                                            Skipped
                                        </Badge>
                                    </div>
                                    <CardDescription>
                                        {new Date(item.metadata.releaseDate).getFullYear()}
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                        )}
                    </div>
                }
            </TabsContent>
            <TabsContent value="notFound" className="mt-6">
                {notFoundItems.length === 0 ?
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <XCircle className="h-12 w-12 text-muted-foreground mb-4"/>
                            <p className="text-muted-foreground text-center">All movies were found</p>
                        </CardContent>
                    </Card>
                    :
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {notFoundItems.map((item, index) =>
                            <Card key={index} className="border-destructive/20 bg-card">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <CardTitle className="text-base leading-relaxed text-pretty">
                                            {item.metadata.name}
                                        </CardTitle>
                                        <Badge variant="destructive" className="shrink-0">
                                            Not Found
                                        </Badge>
                                    </div>
                                    <CardDescription>
                                        {new Date(item.metadata.releaseDate).getFullYear()}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">{item.reason}</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                }
            </TabsContent>
        </Tabs>
    );
}
