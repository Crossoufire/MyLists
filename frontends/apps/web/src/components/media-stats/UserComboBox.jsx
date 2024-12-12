import {cn} from "@/utils/functions";
import {useEffect, useState} from "react";
import {Button} from "@/components/ui/button";
import {Check, ChevronsUpDown} from "lucide-react";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList} from "@/components/ui/command";


export const UserComboBox = ({ placeholder, resetValue = "", dataList, callback, isConnected }) => {
    const [value, setValue] = useState(resetValue);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        setValue(resetValue);
    }, [resetValue]);

    const onSelect = async (currentValue) => {
        setOpen(false);
        setValue(currentValue === value ? "" : currentValue);
        await callback(currentValue);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button role="combobox" variant="outline" className="w-[200px] justify-between" aria-expanded={open}>
                    {value ? dataList.find(user => user.value === value)?.label : placeholder}
                    <ChevronsUpDown className="h-3 w-3 opacity-80"/>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
                {isConnected ?
                    <Command className="overflow-y-auto max-h-[270px]">
                        <CommandInput placeholder="Search user..." className="h-9"/>
                        <CommandList>
                            <CommandEmpty>No user found.</CommandEmpty>
                            <CommandGroup>
                                {dataList.map(user =>
                                    <CommandItem key={user.value} value={user.value} onSelect={() => onSelect(user.value)}>
                                        {user.label}
                                        <Check className={cn("ml-auto h-4 w-4", value === user.value ? "opacity-100" : "opacity-0")}/>
                                    </CommandItem>
                                )}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                    :
                    <Command className="overflow-y-auto max-h-[270px]">
                        <CommandEmpty>You need to be logged-in to compare.</CommandEmpty>
                    </Command>
                }
            </PopoverContent>
        </Popover>
    );
};
