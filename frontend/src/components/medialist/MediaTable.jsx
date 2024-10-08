import {useMemo} from "react";
import {useAuth} from "@/hooks/AuthHook";
import {BlockLink} from "@/components/app/BlockLink";
import {LuCheckCircle2, LuMoreHorizontal} from "react-icons/lu";
import {RedoListDrop} from "@/components/medialist/RedoListDrop";
import {TablePagination} from "@/components/app/TablePagination";
import {RatingComponent} from "@/components/app/RatingComponent";
import {userMediaMutations} from "@/api/mutations/mediaMutations";
import {EditMediaList} from "@/components/medialist/EditMediaList";
import {SuppMediaInfo} from "@/components/medialist/SuppMediaInfo";
import {CommentPopover} from "@/components/medialist/CommentPopover";
import {Route} from "@/routes/_private/list/$mediaType/$username/route";
import {ManageFavorite} from "@/components/media/general/ManageFavorite";
import {flexRender, getCoreRowModel, useReactTable} from "@tanstack/react-table";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "@/components/ui/dropdown-menu";


export const MediaTable = ({ apiData, isCurrent, onChangePage }) => {
    const filters = Route.useSearch();
    const { mediaType, username } = Route.useParams();
    const paginationState = { pageIndex: filters?.page ? filters.page - 1 : 0, pageSize: 25 };

    const onPaginationChange = (paginateFunc) => {
        onChangePage(paginateFunc(paginationState));
    };

    let listColumns = useMemo(() => [
        {
            accessorKey: "media_name",
            header: "Name",
            cell: ({ row }) => {
                return (
                    <BlockLink to={`/details/${mediaType}/${row.original.media_id}`}>
                        <div className="flex justify-between items-center">
                            {row.original.media_name}
                            {!isCurrent && row.original.common && <LuCheckCircle2 className="h-4 w-4 text-green-500"/>}
                        </div>
                    </BlockLink>
                );
            },
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                return (
                    <StatusCell
                        row={row}
                        filters={filters}
                        username={username}
                        isCurrent={isCurrent}
                        mediaType={mediaType}
                    />
                );
            },
        },
        {
            accessorKey: "suppInfo",
            header: "--",
            cell: ({ row }) => {
                return (
                    <SuppMediaInfoCell
                        row={row}
                        filters={filters}
                        username={username}
                        isCurrent={isCurrent}
                        mediaType={mediaType}
                    />
                );
            },
        },
        {
            accessorKey: "rating",
            header: "Rating",
            cell: ({ row }) => {
                return (
                    <RatingCell
                        row={row}
                        filters={filters}
                        username={username}
                        isCurrent={isCurrent}
                        mediaType={mediaType}
                    />
                );
            },
        },
        {
            accessorKey: "redo",
            header: "Redo",
            cell: ({ row }) => {
                return (
                    <RedoCell
                        row={row}
                        filters={filters}
                        username={username}
                        isCurrent={isCurrent}
                        mediaType={mediaType}
                    />
                );
            },
        },
        {
            accessorKey: "favorite",
            header: "Favorite",
            cell: ({ row }) => {
                return (
                    <FavoriteCell
                        row={row}
                        filters={filters}
                        username={username}
                        isCurrent={isCurrent}
                        mediaType={mediaType}
                    />
                );
            },
        },
        {
            accessorKey: "comment",
            header: "Comment",
            cell: ({ row }) => {
                return (
                    <CommentCell
                        row={row}
                        filters={filters}
                        username={username}
                        isCurrent={isCurrent}
                        mediaType={mediaType}
                    />
                );
            },
        },
        {
            id: "action",
            cell: ({ row }) => {
                return (
                    <ActionsCell
                        row={row}
                        filters={filters}
                        username={username}
                        mediaType={mediaType}
                        isCurrent={isCurrent}
                    />
                );
            },
        },
    ], []);

    if (mediaType === "series" || mediaType === "anime") {
        listColumns[2].header = "Progress";
    }
    else if (mediaType === "movies") {
        listColumns = listColumns.filter(item => item.accessorKey !== "suppInfo");
    }
    else if (mediaType === "games") {
        listColumns[2].header = "Playtime";
        listColumns = listColumns.filter(item => item.accessorKey !== "redo");
    }
    else if (mediaType === "books") {
        listColumns[2].header = "Pages";
    }

    const table = useReactTable({
        columns: listColumns,
        manualFiltering: true,
        manualPagination: true,
        data: apiData.media_data ?? [],
        getCoreRowModel: getCoreRowModel(),
        onPaginationChange: onPaginationChange,
        rowCount: apiData?.pagination.total ?? 0,
        state: { pagination: paginationState },
    });

    return (
        <>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map(headerGroup =>
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map(header =>
                                    <TableHead key={header.id}>
                                        {!header.isPlaceholder && flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                )}
                            </TableRow>
                        )}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ?
                            table.getRowModel().rows.map(row => {
                                return (
                                    <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                                        {row.getVisibleCells().map(cell =>
                                            <TableCell key={cell.id}>
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        )}
                                    </TableRow>
                                );
                            })
                            :
                            <TableRow>
                                <TableCell colSpan={listColumns.length} className="h-24 text-center">
                                    No results.
                                </TableCell>
                            </TableRow>
                        }
                    </TableBody>
                </Table>
            </div>
            <div className="mt-3">
                <TablePagination table={table}/>
            </div>
        </>
    );
};


const StatusCell = ({ row, isCurrent, username, mediaType, filters }) => {
    const { updateStatusFunc } = userMediaMutations(mediaType, row.original.media_id, ["userList", mediaType, username, filters]);
    const updateStatus = updateStatusFunc(onStatusSuccess);

    const handleStatus = (status) => {
        updateStatus.mutate({ payload: status });
    };

    function onStatusSuccess(oldData, variables) {
        const newData = { ...oldData };
        const status = variables.payload;
        const searchStatuses = filters?.status;

        if (searchStatuses) {
            if (!searchStatuses.includes(status)) {
                newData.media_data = newData.media_data.filter(m => m.media_id !== row.original.media_id);
                return newData;
            }
        }
        if (status === "Completed" && (mediaType === "series" || mediaType === "anime")) {
            newData.media_data = newData.media_data.map(m => {
                if (m.media_id === row.original.media_id) {
                    return {
                        ...m,
                        current_season: row.original.eps_per_season.length,
                        last_episode_watched: row.original.eps_per_season[row.original.eps_per_season.length - 1],
                    };
                }
                return m;
            });
        }
        if (status === "Completed" && mediaType === "books") {
            newData.media_data = newData.media_data.map(m => {
                if (m.media_id === row.original.media_id) {
                    return { ...m, actual_page: row.original.total_pages };
                }
                return m;
            });
        }
        newData.media_data = newData.media_data.map(m => {
            if (m.media_id === row.original.media_id) {
                return { ...m, status: status, redo: 0 };
            }
            return m;
        });
        return newData;
    }

    return (
        <>
            {isCurrent ?
                <DropdownMenu>
                    <DropdownMenuTrigger disabled={updateStatus.isPending}>
                        <>{row.original.status}</>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {row.original.all_status.map(status =>
                            <DropdownMenuItem key={status} value={status} disabled={row.original.status === status}
                                              onClick={(ev) => handleStatus(ev.target.textContent)}>
                                {status}
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
                :
                row.original.status
            }
        </>
    );
};

const RatingCell = ({ row, isCurrent, username, mediaType, filters }) => {
    const { updateRating } = userMediaMutations(mediaType, row.original.media_id, ["userList", mediaType, username, filters]);

    return (
        <RatingComponent
            inline={true}
            isEditable={isCurrent}
            onUpdate={updateRating}
            rating={row.original.rating}
        />
    );
};

const FavoriteCell = ({ row, isCurrent, username, mediaType, filters }) => {
    const { updateFavorite } = userMediaMutations(mediaType, row.original.media_id, ["userList", mediaType, username, filters]);

    return (
        <div className="text-center">
            <ManageFavorite
                isCurrent={isCurrent}
                updateFavorite={updateFavorite}
                isFavorite={row.original.favorite}
            />
        </div>
    );
};

const RedoCell = ({ row, isCurrent, username, mediaType, filters }) => {
    if (row.original.status !== "Completed") return;

    const { updateRedo } = userMediaMutations(mediaType, row.original.media_id, ["userList", mediaType, username, filters]);

    return (
        <RedoListDrop
            isCurrent={isCurrent}
            updateRedo={updateRedo}
            redo={row.original.redo}
        />
    );
};

const CommentCell = ({ row, isCurrent, username, mediaType, filters }) => {
    const { updateComment } = userMediaMutations(mediaType, row.original.media_id, ["userList", mediaType, username, filters]);

    return (
        <CommentPopover
            isCurrent={isCurrent}
            key={row.original.media_id}
            updateComment={updateComment}
            content={row.original.comment}
        />
    );
};

const SuppMediaInfoCell = ({ row, isCurrent, mediaType, filters, username }) => {
    return (
        <div className="flex items-center justify-between h-[20px]">
            <SuppMediaInfo
                isCurrent={isCurrent}
                userMedia={row.original}
                queryKey={["userList", mediaType, username, filters]}
            />
        </div>
    );
};

const ActionsCell = ({ row, isCurrent, username, mediaType, filters }) => {
    const { currentUser } = useAuth();
    if (!currentUser) return;
    if (!isCurrent && (isCurrent || row.original.common)) return;

    const { removeFromList, addToList, updateStatusFunc } = userMediaMutations(
        mediaType, row.original.media_id, ["userList", mediaType, username, filters]
    );

    const onStatusSuccess = (oldData, variables) => {
        const newData = { ...oldData };
        const status = variables.payload;
        const searchStatuses = filters?.status;

        if (searchStatuses) {
            if (!searchStatuses.includes(status)) {
                newData.media_data = newData.media_data.filter(m => m.media_id !== row.original.media_id);
                return newData;
            }
        }

        if (status === "Completed" && (mediaType === "series" || mediaType === "anime")) {
            newData.media_data = newData.media_data.map(m => {
                if (m.media_id === row.original.media_id) {
                    return {
                        ...m,
                        current_season: row.original.eps_per_season.length,
                        last_episode_watched: row.original.eps_per_season[row.original.eps_per_season.length - 1],
                    };
                }
                return m;
            });
        }
        if (status === "Completed" && mediaType === "books") {
            newData.media_data = newData.media_data.map(m => {
                if (m.media_id === row.original.media_id) {
                    return { ...m, actual_page: row.original.total_pages };
                }
                return m;
            });
        }
        newData.media_data = newData.media_data.map(m => {
            if (m.media_id === row.original.media_id) {
                return { ...m, status: status, redo: 0 };
            }
            return m;
        });
        return newData;
    };

    return (
        <EditMediaList
            isCurrent={isCurrent}
            addOtherList={addToList}
            status={row.original.status}
            removeMedia={removeFromList}
            allStatus={row.original.all_status}
            updateStatus={updateStatusFunc(onStatusSuccess)}
        >
            <LuMoreHorizontal className="h-4 w-4"/>
        </EditMediaList>
    );
};
