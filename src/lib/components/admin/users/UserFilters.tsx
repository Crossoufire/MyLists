import {useState} from "react";
import {Filter, Search, X} from "lucide-react";
import {Badge} from "@/lib/components/ui/badge";
import {Input} from "@/lib/components/ui/input";
import {Button} from "@/lib/components/ui/button";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/lib/components/ui/select";
import {Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger} from "@/lib/components/ui/sheet";


export function UserFilters() {
    const [search, setSearch] = useState("")
    const [filters, setFilters] = useState<{
        status: string | null
        privacy: string | null
        activity: string | null
    }>({
        status: null,
        privacy: null,
        activity: null,
    })

    const activeFiltersCount = Object.values(filters).filter(Boolean).length

    const clearFilters = () => {
        setFilters({
            status: null,
            privacy: null,
            activity: null,
        })
    }

    const removeFilter = (key: keyof typeof filters) => {
        setFilters({
            ...filters,
            [key]: null,
        })
    }

    return (
        <div className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex w-full max-w-sm items-center space-x-2">
                <div className="relative w-full">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"/>
                    <Input
                        type="search"
                        placeholder="Search users..."
                        className="w-full pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    {search && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setSearch("")}
                        >
                            <X className="h-4 w-4"/>
                            <span className="sr-only">Clear search</span>
                        </Button>
                    )}
                </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
                {filters.status && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                        Status: {filters.status}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 text-muted-foreground hover:text-foreground"
                            onClick={() => removeFilter("status")}
                        >
                            <X className="h-3 w-3"/>
                            <span className="sr-only">Remove status filter</span>
                        </Button>
                    </Badge>
                )}
                {filters.privacy && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                        Privacy: {filters.privacy}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 text-muted-foreground hover:text-foreground"
                            onClick={() => removeFilter("privacy")}
                        >
                            <X className="h-3 w-3"/>
                            <span className="sr-only">Remove privacy filter</span>
                        </Button>
                    </Badge>
                )}
                {filters.activity && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                        Activity: {filters.activity}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 text-muted-foreground hover:text-foreground"
                            onClick={() => removeFilter("activity")}
                        >
                            <X className="h-3 w-3"/>
                            <span className="sr-only">Remove activity filter</span>
                        </Button>
                    </Badge>
                )}
                {activeFiltersCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                        Clear all
                    </Button>
                )}
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="sm" className="ml-auto flex gap-1">
                            <Filter className="h-4 w-4"/>
                            <span>Filter</span>
                            {activeFiltersCount > 0 && <Badge className="ml-1 rounded-full px-1">{activeFiltersCount}</Badge>}
                        </Button>
                    </SheetTrigger>
                    <SheetContent>
                        <SheetHeader>
                            <SheetTitle>Filter Users</SheetTitle>
                            <SheetDescription>Apply filters to narrow down the user list.</SheetDescription>
                        </SheetHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <label htmlFor="status">Status</label>
                                <Select
                                    value={filters.status || ""}
                                    onValueChange={(value) => setFilters({ ...filters, status: value || null })}
                                >
                                    <SelectTrigger id="status">
                                        <SelectValue placeholder="Select status"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <label htmlFor="privacy">Privacy</label>
                                <Select
                                    value={filters.privacy || ""}
                                    onValueChange={(value) => setFilters({ ...filters, privacy: value || null })}
                                >
                                    <SelectTrigger id="privacy">
                                        <SelectValue placeholder="Select privacy"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="public">Public</SelectItem>
                                        <SelectItem value="restricted">Restricted</SelectItem>
                                        <SelectItem value="private">Private</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <label htmlFor="activity">Last Active</label>
                                <Select
                                    value={filters.activity || ""}
                                    onValueChange={(value) => setFilters({ ...filters, activity: value || null })}
                                >
                                    <SelectTrigger id="activity">
                                        <SelectValue placeholder="Select time period"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all_time">All time</SelectItem>
                                        <SelectItem value="today">Today</SelectItem>
                                        <SelectItem value="week">This week</SelectItem>
                                        <SelectItem value="month">This month</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-between">
                            <Button variant="outline" onClick={clearFilters}>
                                Reset
                            </Button>
                            <Button>Apply Filters</Button>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </div>
    )
}
