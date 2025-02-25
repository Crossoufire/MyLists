import {toast} from "sonner";
import {Button} from "@/components/ui/button";
import {useEffect, useRef, useState} from "react";
import {useRedoTvMutation} from "@/api/mutations";
import {Separator} from "@/components/ui/separator";
import {MinusCircle, Pencil, PlusCircle} from "lucide-react";
import {Credenza, CredenzaClose, CredenzaContent, CredenzaDescription, CredenzaFooter, CredenzaHeader, CredenzaTitle} from "@/components/ui/credenza";


export const TvRedoSystem = ({ initRedoList, mediaId, mediaType }) => {
    const credRef = useRef();
    const [open, setOpen] = useState(false);
    const [seasons, setSeasons] = useState(initRedoList);
    const totalRedo = seasons.reduce((a, b) => a + b, 0);
    const updateRedoTv = useRedoTvMutation(mediaType, mediaId);

    useEffect(() => {
        setSeasons(initRedoList);
    }, [initRedoList]);

    const updateSeason = (idx, value) => {
        setSeasons((prevSeasons) => prevSeasons.map((s, i) => (i === idx ? Math.max(0, s + value) : s)));
    };

    const updateAllSeasons = (value) => {
        setSeasons((prevSeasons) => prevSeasons.map((s) => Math.max(0, s + value)));
    };

    const onUpdate = () => {
        updateRedoTv.mutate({ payload: seasons }, {
            onError: () => toast.error("An error occurred"),
            onSuccess: () => {
                toast.success("Seasons re-watched updated!");
                credRef?.current?.click();
            },
        });
    };

    return (
        <>
            <div className="w-[130px] text-start flex items-center justify-between">
                <div className="ml-1.5 text-sm">{totalRedo} Seasons</div>
                <Pencil role="button" className="w-4 h-4 text-gray-400" onClick={() => setOpen(true)}/>
            </div>
            <Credenza open={open} onOpenChange={setOpen}>
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
                            {seasons.map((season, idx) => (
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
                        <Button type="submit" className="w-full" onClick={onUpdate} disabled={updateRedoTv.isPending}>
                            Update
                        </Button>
                    </CredenzaFooter>
                </CredenzaContent>
            </Credenza>
        </>
    );
};
