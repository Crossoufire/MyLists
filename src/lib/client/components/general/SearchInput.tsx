import {Search} from "lucide-react";
import React, {useEffect, useState} from "react";
import {Input} from "@/lib/client/components/ui/input";
import {useDebounceCallback} from "@/lib/client/hooks/use-debounce";


interface SearchInputProps {
    value: string;
    delay?: number;
    className: string;
    placeholder: string;
    onChange: (value: string) => void;
}


export const SearchInput = ({ value, onChange, placeholder, className, delay = 400 }: SearchInputProps) => {
    const [localValue, setLocalValue] = useState(value);

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    const handleInputChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
        const val = ev.target.value;
        setLocalValue(val);

        if (val === "") {
            onChange("");
        }
    };

    useDebounceCallback(localValue, delay, () => onChange(localValue));

    return (
        <div className="relative">
            <Search size={16} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"/>
            <Input
                type="search"
                value={localValue}
                placeholder={placeholder}
                onChange={handleInputChange}
                className={`pl-8 text-sm ${className}`}
            />
        </div>
    );
};
