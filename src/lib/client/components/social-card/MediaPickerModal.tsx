import {useState} from "react";
import {ApiProviderType, MediaType} from "@/lib/utils/enums";
import {useQuery} from "@tanstack/react-query";
import {Search, Loader2, Film} from "lucide-react";
import {Input} from "@/lib/client/components/ui/input";
import {useDebounce} from "@/lib/client/hooks/use-debounce";
import {FeaturedMediaData} from "@/lib/client/social-card/types";
import {MutedText} from "@/lib/client/components/general/MutedText";
import {navSearchOptions} from "@/lib/client/react-query/query-options/query-options";
import {getAccentClasses, MEDIA_CONFIGS} from "@/lib/client/social-card/media.config";
import {Dialog, DialogContent, DialogHeader, DialogTitle} from "@/lib/client/components/ui/dialog";


interface MediaPickerModalProps {
    open: boolean;
    onClose: () => void;
    mediaType: MediaType;
    onSelect: (media: FeaturedMediaData) => void;
}


export function MediaPickerModal({ mediaType, open, onSelect, onClose }: MediaPickerModalProps) {
    const accent = getAccentClasses(mediaType);
    const mediaConfig = MEDIA_CONFIGS[mediaType];
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 350);
    const { data: results, isLoading } = useQuery(navSearchOptions(debouncedSearch, 1, ApiProviderType.TMDB));

    const handleSelect = (media: FeaturedMediaData) => {
        onSelect(media);
        onClose();
        setSearch("");
    };

    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen) {
            onClose();
            setSearch("");
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        Select a {mediaConfig.terminology.singular}
                    </DialogTitle>
                </DialogHeader>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400"/>
                    <Input
                        value={search}
                        className="pl-10"
                        onChange={(ev) => setSearch(ev.target.value)}
                        placeholder={`Search ${mediaConfig.terminology.plural}...`}
                    />
                </div>
                <div className="mt-4 max-h-[300px] space-y-2 overflow-y-auto">
                    {isLoading ?
                        <div className="flex justify-center py-8">
                            <Loader2 className={`size-6 animate-spin ${accent.text}`}/>
                        </div>
                        : results?.data.length === 0 ?
                            <MutedText>No {mediaConfig.terminology.plural} found</MutedText>
                            :
                            results?.data.map((item) =>
                                <button
                                    key={item.id}
                                    onClick={() => handleSelect({ mediaId: item.id as number, name: item.name, mediaCover: item.image })}
                                    className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-gray-700"
                                >
                                    <img
                                        alt={item.name}
                                        src={item.image}
                                        className="w-[188px] h-[258px]"
                                    />
                                    <span className="truncate font-medium">
                                        {item.name}
                                    </span>
                                </button>
                            )
                    }
                </div>
            </DialogContent>
        </Dialog>
    );
}
