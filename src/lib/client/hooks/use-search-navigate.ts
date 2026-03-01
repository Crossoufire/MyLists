import {useEffect, useState} from "react";
import {useNavigate} from "@tanstack/react-router";
import type {NavigateOptions} from "@tanstack/router-core";
import {useDebounceCallback} from "@/lib/client/hooks/use-debounce";


type BaseSearchParams = {
    page?: number;
    search?: string;
}


type UseSearchInputProps = {
    search: string;
    delay?: number;
    options?: NavigateOptions;
}


export const useSearchNavigate = <T extends BaseSearchParams>({ search, delay = 400, options = {} }: UseSearchInputProps) => {
    const navigate = useNavigate();
    const [localSearch, setLocalSearch] = useState(search);

    useEffect(() => {
        setLocalSearch(search);
    }, [search]);

    const handleInputChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = ev.target.value;
        setLocalSearch(inputValue);

        if (inputValue === "") {
            updateFilters({ search: "", page: 1 } as Partial<T>);
        }
    };

    const updateFilters = (updater: Partial<T>) => {
        void navigate({ search: (prev) => ({ ...prev, ...updater }), replace: true, ...options });
    };

    useDebounceCallback(localSearch, delay, () => {
        if (localSearch !== search && localSearch !== "") {
            updateFilters({ search: localSearch, page: 1 } as Partial<T>);
        }
    });

    return { localSearch, handleInputChange, updateFilters };
};
