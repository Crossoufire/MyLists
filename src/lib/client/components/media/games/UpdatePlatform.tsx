import {useState} from "react";
import {cn} from "@/lib/utils/helpers";
import {Check, ChevronDown} from "lucide-react";
import {Button} from "@/lib/client/components/ui/button";
import {GamesPlatformsEnum, UpdateType} from "@/lib/utils/enums";
import {Popover, PopoverContent, PopoverTrigger} from "@/lib/client/components/ui/popover";
import {useUpdateUserMediaMutation} from "@/lib/client/react-query/query-mutations/user-media.mutations";
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList} from "@/lib/client/components/ui/command";


interface UpdatePlatformProps {
    platform: GamesPlatformsEnum | null;
    updatePlatform: ReturnType<typeof useUpdateUserMediaMutation>;
}


export const UpdatePlatform = ({ platform, updatePlatform }: UpdatePlatformProps) => {
    const handleSelect = (platform: GamesPlatformsEnum) => {
        updatePlatform.mutate({ payload: { platform: platform, type: UpdateType.PLATFORM } });
    };

    return (
        <div className="flex justify-between items-center">
            <div>Platform</div>
            <PlatformComboBox
                resetValue={platform}
                callback={handleSelect}
                isPending={updatePlatform.isPending}
            />
        </div>
    );
};


const PlatformComboBox = ({ resetValue = "", callback, isPending }: any) => {
    const [open, setOpen] = useState(false);
    const allPlatforms = Object.values(GamesPlatformsEnum).map(p => ({ value: p, label: p }));
    const displayedLabel = allPlatforms.find((pt) => pt.value === resetValue)?.label || "-";

    const onSelect = (currentValue: GamesPlatformsEnum) => {
        setOpen(false);
        if (resetValue !== currentValue) {
            callback(currentValue);
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    role="combobox"
                    variant="ghost"
                    aria-expanded={open}
                    disabled={isPending}
                    className="w-[130px] justify-between has-[>svg]:px-0 font-normal hover:bg-transparent"
                >
                    {displayedLabel}
                    <ChevronDown className="size-4 opacity-30"/>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[160px] p-0">
                <Command className="overflow-y-auto max-h-[270px]">
                    <CommandInput placeholder="Search..." className="h-9"/>
                    <CommandList>
                        <CommandEmpty>No results</CommandEmpty>
                        <CommandGroup>
                            {allPlatforms.map(pt =>
                                <CommandItem key={pt.value} value={pt.value} onSelect={() => onSelect(pt.value)}>
                                    {pt.label}
                                    <Check className={cn("ml-auto size-4", resetValue === pt.value ? "opacity-100" : "opacity-0")}/>
                                </CommandItem>
                            )}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};
