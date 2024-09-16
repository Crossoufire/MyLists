// noinspection JSDeprecatedSymbols

import * as React from "react";
import {useEffect} from "react";
import {LuX} from "react-icons/lu";
import {cn} from "@/utils/functions.jsx";
import {Badge} from "@/components/ui/badge";
import {Command as CommandPrimitive} from "cmdk";
import {Command, CommandEmpty, CommandGroup, CommandItem, CommandList,} from "@/components/ui/command";


export function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = React.useState(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay || 500);

        return () => {
            clearTimeout(timer);
        };
    }, [value, delay]);

    return debouncedValue;
}


function transToGroupOption(options, groupBy) {
    if (options.length === 0) {
        return {};
    }
    if (!groupBy) {
        return {
            '': options,
        };
    }

    const groupOption = {};
    options.forEach((option) => {
        const key = (option[groupBy]) || '';
        if (!groupOption[key]) {
            groupOption[key] = [];
        }
        groupOption[key].push(option);
    });
    return groupOption;
}


function removePickedOption(groupOption, picked) {
    const cloneOption = JSON.parse(JSON.stringify(groupOption));

    for (const [key, value] of Object.entries(cloneOption)) {
        cloneOption[key] = value.filter((val) => !picked.find((p) => p.value === val.value));
    }
    return cloneOption;
}


const MultipleSelector = React.forwardRef(
    (
        {
            value,
            onChange,
            placeholder,
            defaultOptions: arrayDefaultOptions = [],
            options: arrayOptions,
            delay,
            onSearch,
            loadingIndicator,
            emptyIndicator,
            maxSelected = Number.MAX_SAFE_INTEGER,
            onMaxSelected,
            hidePlaceholderWhenSelected,
            disabled,
            groupBy,
            className,
            badgeClassName,
            selectFirstItem = true,
            creatable = false,
            triggerSearchOnFocus = false,
            commandProps,
            inputProps,
        },
        ref,
    ) => {
        const inputRef = React.useRef(null);
        const [open, setOpen] = React.useState(false);
        const [isLoading, setIsLoading] = React.useState(false);

        const [selected, setSelected] = React.useState(value || []);
        const [options, setOptions] = React.useState(
            transToGroupOption(arrayDefaultOptions, groupBy),
        );
        const [inputValue, setInputValue] = React.useState('');
        const debouncedSearchTerm = useDebounce(inputValue, delay || 500);

        React.useImperativeHandle(
            ref,
            () => ({
                selectedValue: [...selected],
                input: inputRef.current,
            }),
            [selected],
        );

        const handleUnselect = React.useCallback(
            (option) => {
                const newOptions = selected.filter((s) => s.value !== option.value);
                setSelected(newOptions);
                onChange?.(newOptions);
            },
            [selected],
        );

        const handleKeyDown = React.useCallback(
            (e) => {
                const input = inputRef.current;
                if (input) {
                    if (e.key === 'Delete' || e.key === 'Backspace') {
                        if (input.value === '' && selected.length > 0) {
                            handleUnselect(selected[selected.length - 1]);
                        }
                    }
                    // This is not a default behaviour of the <input /> field
                    if (e.key === 'Escape') {
                        input.blur();
                    }
                }
            },
            [selected],
        );

        useEffect(() => {
            if (value) {
                setSelected(value);
            }
        }, [value]);

        useEffect(() => {
            /** If `onSearch` is provided, do not trigger options updated. */
            if (!arrayOptions || onSearch) {
                return;
            }
            const newOption = transToGroupOption(arrayOptions || [], groupBy);
            if (JSON.stringify(newOption) !== JSON.stringify(options)) {
                setOptions(newOption);
            }
        }, [arrayDefaultOptions, arrayOptions, groupBy, onSearch, options]);

        useEffect(() => {
            const doSearch = async () => {
                setIsLoading(true);
                const res = await onSearch?.(debouncedSearchTerm);
                setOptions(transToGroupOption(res || [], groupBy));
                setIsLoading(false);
            };

            const exec = async () => {
                if (!onSearch || !open) return;

                if (triggerSearchOnFocus) {
                    await doSearch();
                }

                if (debouncedSearchTerm) {
                    await doSearch();
                }
            };

            void exec();
        }, [debouncedSearchTerm, open]);

        const CreatableItem = () => {
            if (!creatable) return undefined;

            const Item = (
                <CommandItem
                    value={inputValue}
                    className="cursor-pointer"
                    onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                    onSelect={(value) => {
                        if (selected.length >= maxSelected) {
                            onMaxSelected?.(selected.length);
                            return;
                        }
                        setInputValue('');
                        const newOptions = [...selected, { value, label: value }];
                        setSelected(newOptions);
                        onChange?.(newOptions);
                    }}
                >{`Create "${inputValue}"`}</CommandItem>
            );

            // For normal creatable
            if (!onSearch && inputValue.length > 0) {
                return Item;
            }

            // For async search creatable. avoid showing creatable item before loading at first.
            if (onSearch && debouncedSearchTerm.length > 0 && !isLoading) {
                return Item;
            }

            return undefined;
        };

        const EmptyItem = React.useCallback(() => {
            if (!emptyIndicator) return undefined;

            // For async search that showing emptyIndicator
            if (onSearch && !creatable && Object.keys(options).length === 0) {
                return (
                    <CommandItem value="-" disabled>
                        {emptyIndicator}
                    </CommandItem>
                );
            }

            return <CommandEmpty>{emptyIndicator}</CommandEmpty>;
        }, [creatable, emptyIndicator, onSearch, options]);

        const selectables = React.useMemo(
            () => removePickedOption(options, selected),
                [options, selected],
        );

        /** Avoid Creatable Selector freezing or lagging when paste a long string. */
        const commandFilter = React.useCallback(() => {
            if (commandProps?.filter) {
                return commandProps.filter;
            }

            if (creatable) {
                return (value, search) => {
                    return value.toLowerCase().includes(search.toLowerCase()) ? 1 : -1;
                };
            }
            // Using default filter in `cmdk`. We don't have to provide it.
            return undefined;
        }, [creatable, commandProps?.filter]);

        return (
            <Command
                {...commandProps}
                onKeyDown={(e) => {
                    handleKeyDown(e);
                    commandProps?.onKeyDown?.(e);
                }}
                className={cn("overflow-visible bg-transparent", commandProps?.className)}
                shouldFilter={commandProps?.shouldFilter === undefined ? !onSearch : commandProps.shouldFilter}
                filter={commandFilter()}
            >
                <div
                    className={cn('group rounded-md border border-input px-2 py-2 text-sm ring-offset-background ' +
                        'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
                        className,
                    )}
                >
                    <div className="flex flex-wrap gap-1">
                        {selected.map((option) => {
                            return (
                                <Badge
                                    key={option.value}
                                    className={cn(
                                        'data-[disabled]:bg-muted-foreground data-[disabled]:text-muted data-[disabled]:hover:bg-muted-foreground',
                                        'data-[fixed]:bg-muted-foreground data-[fixed]:text-muted data-[fixed]:hover:bg-muted-foreground',
                                        badgeClassName,
                                    )}
                                    data-fixed={option.fixed}
                                    data-disabled={disabled}
                                >
                                    {option.label}
                                    <button
                                        className={cn(
                                            'ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2',
                                            (disabled || option.fixed) && 'hidden',
                                        )}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                handleUnselect(option);
                                            }
                                        }}
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                        }}
                                        onClick={() => handleUnselect(option)}
                                    >
                                        <LuX className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                    </button>
                                </Badge>
                            );
                        })}
                        {/* Avoid having the "Search" Icon */}
                        <CommandPrimitive.Input
                            {...inputProps}
                            ref={inputRef}
                            value={inputValue}
                            disabled={disabled}
                            onValueChange={(value) => {
                                setInputValue(value);
                                inputProps?.onValueChange?.(value);
                            }}
                            onBlur={(event) => {
                                setOpen(false);
                                inputProps?.onBlur?.(event);
                            }}
                            onFocus={(event) => {
                                setOpen(true);
                                triggerSearchOnFocus && onSearch?.(debouncedSearchTerm);
                                inputProps?.onFocus?.(event);
                            }}
                            placeholder={hidePlaceholderWhenSelected && selected.length !== 0 ? '' : placeholder}
                            className={cn("ml-2 flex-1 bg-transparent outline-none placeholder:text-muted-foreground cursor-pointer",
                                inputProps?.className,
                            )}
                        />
                    </div>
                </div>
                <div className="relative mt-2">
                    {open && (
                        <CommandList className="absolute top-0 z-10 w-full rounded-md border bg-popover
                        text-popover-foreground shadow-md outline-none animate-in">
                            {isLoading ?
                                <>{loadingIndicator}</>
                                :
                                <>
                                    {EmptyItem()}
                                    {CreatableItem()}
                                    {!selectFirstItem && <CommandItem value="-" className="hidden" />}
                                    {Object.entries(selectables).map(([key, dropdowns]) => (
                                        <CommandGroup key={key} heading={key} className="h-full overflow-auto">
                                            <>
                                                {dropdowns.map((option) => {
                                                    return (
                                                        <CommandItem
                                                            key={option.value}
                                                            value={option.value}
                                                            disabled={option.disable}
                                                            onMouseDown={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                            }}
                                                            onSelect={() => {
                                                                if (selected.length >= maxSelected) {
                                                                    onMaxSelected?.(selected.length);
                                                                    return;
                                                                }
                                                                setInputValue('');
                                                                const newOptions = [...selected, option];
                                                                setSelected(newOptions);
                                                                onChange?.(newOptions);
                                                            }}
                                                            className={cn('cursor-pointer', option.disable && 'cursor-default text-muted-foreground',)}
                                                        >
                                                            {option.label}
                                                        </CommandItem>
                                                    );
                                                })}
                                            </>
                                        </CommandGroup>
                                    ))}
                                </>
                            }
                        </CommandList>
                    )}
                </div>
            </Command>
        );
    },
);
MultipleSelector.displayName = 'MultipleSelector';


export default MultipleSelector;
