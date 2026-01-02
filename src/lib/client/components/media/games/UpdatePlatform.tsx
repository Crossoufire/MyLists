import {GamesPlatformsEnum, UpdateType} from "@/lib/utils/enums";
import {useUpdateUserMediaMutation} from "@/lib/client/react-query/query-mutations/user-media.mutations";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/lib/client/components/ui/select";


interface UpdatePlatformProps {
    platform: GamesPlatformsEnum | null;
    updatePlatform: ReturnType<typeof useUpdateUserMediaMutation>;
}


export const UpdatePlatform = ({ platform, updatePlatform }: UpdatePlatformProps) => {
    const allPlatforms = ["-", ...Object.values(GamesPlatformsEnum)];

    const handleSelect = (value: string) => {
        const valueToSend = value === "-" ? null : value as GamesPlatformsEnum;
        updatePlatform.mutate({ payload: { platform: valueToSend, type: UpdateType.PLATFORM } });
    };

    return (
        <div className="flex justify-between items-center">
            <div>Platform</div>
            <Select value={platform?.toString() ?? "-"} onValueChange={handleSelect} disabled={updatePlatform.isPending}>
                <SelectTrigger size="sm" className="w-34">
                    <SelectValue/>
                </SelectTrigger>
                <SelectContent className="max-h-73 overflow-y-auto scrollbar-thin">
                    {allPlatforms?.map((plat) =>
                        <SelectItem key={plat} value={plat}>
                            {plat}
                        </SelectItem>
                    )}
                </SelectContent>
            </Select>
        </div>
    );
};
