import {useState} from "react";
import {useAuth} from "@/lib/client/hooks/use-auth";
import {createFileRoute} from "@tanstack/react-router";
import {MediaType, PrivacyType} from "@/lib/utils/enums";
import {Button} from "@/lib/client/components/ui/button";
import {PageTitle} from "@/lib/client/components/general/PageTitle";
import {MainThemeIcon} from "@/lib/client/components/general/MainIcons";
import {CollectionEditor} from "@/lib/client/components/collections/CollectionEditor";
import {useCreateCollectionMutation} from "@/lib/client/react-query/query-mutations/collections.mutations";


export const Route = createFileRoute("/_main/_private/collections/create")({
    component: CollectionCreatePage,
});


function CollectionCreatePage() {
    const { currentUser } = useAuth();
    const navigate = Route.useNavigate();
    const createMutation = useCreateCollectionMutation();
    const [mediaType, setMediaType] = useState<MediaType | null>(null);
    const [step, setStep] = useState<"mediaType" | "editor">("mediaType");
    const activeTypes = currentUser?.settings.filter((s) => s.active).map((s) => s.mediaType) ?? [];

    // TODO: Check zod error from createMutation (desc max 400 for example)
    
    const handleSelectMediaType = (mediaType: MediaType) => {
        setMediaType(mediaType);
        setStep("editor");
    };

    const handleSubmit = async (payload: {
        title: string;
        ordered: boolean;
        privacy: PrivacyType;
        description?: string | null;
        items: { mediaId: number; annotation?: string | null }[];
    }) => {
        if (!mediaType) return;

        const result = await createMutation.mutateAsync({ data: { mediaType, ...payload, } });
        await navigate({ to: "/collections/$collectionId", params: { collectionId: result.id } });
    };

    return (
        <PageTitle title="Create a Collection" subtitle="Build a curated list with notes and ranking.">
            {step === "mediaType" &&
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="font-semibold">
                                1. Choose a media type
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Collections are made of a single media type.
                            </p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                            Step 1 of 2
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {activeTypes.map((mediaType) =>
                            <button
                                key={mediaType}
                                onClick={() => handleSelectMediaType(mediaType)}
                                className="rounded-md border bg-card/70 py-1.5 px-3 text-left transition-all hover:border-app-accent/60"
                            >
                                <div className="flex items-center gap-2">
                                    <MainThemeIcon type={mediaType} size={14}/>
                                    <div className="text-sm font-semibold capitalize">
                                        {mediaType}
                                    </div>
                                </div>
                            </button>
                        )}
                    </div>
                </div>
            }

            {step === "editor" && mediaType &&
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <Button variant="outline" onClick={() => setStep("mediaType")}>
                                Change media type
                            </Button>
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Step 2 of 2
                        </div>
                    </div>
                    <CollectionEditor
                        mediaType={mediaType}
                        onSubmit={handleSubmit}
                        submitLabel="Create Collection"
                        isSubmitting={createMutation.isPending}
                    />
                </div>
            }
        </PageTitle>
    );
}
