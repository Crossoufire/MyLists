import {cn} from "@/lib/utils";
import {useEffect, useState} from "react";
import {Button} from "@/components/ui/button";
import * as Com from "@/components/ui/command";
import {CaretSortIcon, CheckIcon} from "@radix-ui/react-icons";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";


export const UserComboBox = ({ placeholder, resetValue = "", dataList, callback }) => {
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
                    <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50"/>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
                <Com.Command className="overflow-y-auto max-h-[270px]">
                    <Com.CommandInput placeholder="Search user..." className="h-9"/>
                    <Com.CommandList>
                        <Com.CommandEmpty>No user found.</Com.CommandEmpty>
                        <Com.CommandGroup>
                            {dataList.map(user =>
                                <Com.CommandItem key={user.value} value={user.value} onSelect={() => onSelect(user.value)}>
                                    {user.label}
                                    <CheckIcon
                                        className={cn("ml-auto h-4 w-4",
                                            value === user.value ? "opacity-100" : "opacity-0")}
                                    />
                                </Com.CommandItem>
                            )}
                        </Com.CommandGroup>
                    </Com.CommandList>
                </Com.Command>
            </PopoverContent>
        </Popover>
    )
};
