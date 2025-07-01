import {Button} from "@/lib/components/ui/button";
import {useEffect, useRef, useState} from "react";
import {Separator} from "@/lib/components/ui/separator";
import {MinusCircle, Pencil, PlusCircle} from "lucide-react";
import {useUpdateUserMediaMutation} from "@/lib/react-query/query-mutations/user-media.mutations";
import {Credenza, CredenzaClose, CredenzaContent, CredenzaDescription, CredenzaFooter, CredenzaHeader, CredenzaTitle} from "@/lib/components/ui/credenza";


interface UpdateRedoTvProps {
    redoValues: number[];
    onUpdateMutation: ReturnType<typeof useUpdateUserMediaMutation>;
}


export const UpdateRedoTv = ({ onUpdateMutation, redoValues }: UpdateRedoTvProps) => {
    const [open, setOpen] = useState(false);
    const [draftRedo, setDraftRedo] = useState(redoValues);
    const credRef = useRef<HTMLDivElement | null>(null);
    const totalRedo = redoValues.reduce((a, b) => a + b, 0);

    useEffect(() => {
        setDraftRedo(redoValues);
    }, [redoValues]);

    const onOpenChange = (open: boolean) => {
        setOpen(open);
        setDraftRedo([...redoValues]);
    };

    const updateSeason = (idx: number, value: number) => {
        setDraftRedo((prevSeasons) => prevSeasons.map((s, i) => (i === idx ? Math.max(0, s + value) : s)));
    };

    const updateAllSeasons = (value: number) => {
        setDraftRedo((prevSeasons) => prevSeasons.map((s) => Math.max(0, s + value)));
    };

    const onUpdateRedoValues = () => {
        setOpen(false);
        onUpdateMutation.mutate({ payload: { redo2: draftRedo } });
    };

    return (
        <>
            <div className="w-[130px] text-start flex items-center justify-between">
                <div className="ml-1.5 text-sm">{totalRedo} Seas.</div>
                <Pencil
                    role="button"
                    onClick={() => setOpen(true)}
                    className={"w-4 h-4 text-gray-400"}
                />
            </div>
            <Credenza open={open} onOpenChange={onOpenChange}>
                {/*//@ts-expect-error*/}
                <CredenzaClose ref={credRef} className="absolute"/>
                <CredenzaContent>
                    <CredenzaHeader>
                        <CredenzaTitle>Re-watched Seasons Manager</CredenzaTitle>
                        <CredenzaDescription>Manage your re-watched seasons</CredenzaDescription>
                    </CredenzaHeader>
                    <div className="mt-2 ">
                        <div className="flex justify-between items-center p-2 px-3">
                            <span className="font-semibold">All Seasons</span>
                            <div className="flex items-center">
                                <Button variant="ghost" size="icon" onClick={() => updateAllSeasons(-1)} className="mr-2">
                                    <MinusCircle className="h-5 w-5"/>
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => updateAllSeasons(1)}>
                                    <PlusCircle className="h-5 w-5"/>
                                </Button>
                            </div>
                        </div>
                        <Separator className="mt-1 mb-5"/>
                        <div className="overflow-y-auto max-h-[350px]">
                            {draftRedo.map((season, idx) => (
                                <div key={idx} className="flex justify-between items-center p-2 px-3">
                                    <div className="flex items-center gap-6">
                                        <div className="font-semibold">
                                            Season {idx + 1}:
                                        </div>
                                        <div>{season}x</div>
                                    </div>
                                    <div className="flex items-center">
                                        <Button variant="ghost" size="icon" onClick={() => updateSeason(idx, -1)} className="mr-2">
                                            <MinusCircle className="h-5 w-5"/>
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => updateSeason(idx, 1)}>
                                            <PlusCircle className="h-5 w-5"/>
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <CredenzaFooter className="mt-5">
                        <Button type="submit" className="w-full" onClick={onUpdateRedoValues} disabled={onUpdateMutation.isPending}>
                            Update
                        </Button>
                    </CredenzaFooter>
                </CredenzaContent>
            </Credenza>
        </>
    );
};
