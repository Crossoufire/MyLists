import {useMemo} from "react";
import * as Drop from "@/components/ui/dropdown-menu";
import {LuCheckCircle2, LuMoreHorizontal} from "react-icons/lu";
import {RedoListDrop} from "@/components/medialist/RedoListDrop";
import {TablePagination} from "@/components/app/TablePagination";
import {Link, useParams, useSearch} from "@tanstack/react-router";
import {EditMediaList} from "@/components/medialist/EditMediaList";
import {SuppMediaInfo} from "@/components/medialist/SuppMediaInfo";
import {CommentPopover} from "@/components/medialist/CommentPopover";
import {RatingListDrop} from "@/components/medialist/RatingListDrop";
import {ManageFavorite} from "@/components/media/general/ManageFavorite";
import {flexRender, getCoreRowModel, useReactTable} from "@tanstack/react-table";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {useAddMediaToUserList, useRemoveMediaFromList, useUpdateUserMediaList} from "@/utils/mutations";


export const MediaTable = ({ apiData, isCurrent, onChangePage }) => {
    const filters = useSearch({ strict: false });
    const { mediaType, username } = useParams({ strict: false });
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
                    <Link to={`/details/${mediaType}/${row.original.media_id}`}>
                        <div className="flex justify-between items-center">
                            {row.original.media_name}
                            {!isCurrent && row.original.common && <LuCheckCircle2 className="h-4 w-4 text-green-500"/>}
                        </div>
                    </Link>
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
                        isCurrent={isCurrent}
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
                                        {!header.isPlaceholder &&
                                            flexRender(header.column.columnDef.header, header.getContext())
                                        }
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
                                )
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
    const handleStatus = async (status) => {
        await updateStatus.mutateAsync({payload: status});
    };

    const onStatusChange = (oldData, variables) => {
        const newData = {...oldData};
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

    const updateStatus = useUpdateUserMediaList("update_status", mediaType, row.original.media_id, username, filters, onStatusChange);

    return (
        <>
            {isCurrent ?
                <Drop.DropdownMenu>
                    <Drop.DropdownMenuTrigger disabled={updateStatus.isPending}>
                        <>{row.original.status}</>
                    </Drop.DropdownMenuTrigger>
                    <Drop.DropdownMenuContent align="end">
                        {row.original.all_status.map(status =>
                            <Drop.DropdownMenuItem key={status} value={status} onClick={(ev) => handleStatus(ev.target.textContent)}
                                                   disabled={row.original.status === status}>
                                {status}
                            </Drop.DropdownMenuItem>
                        )}
                    </Drop.DropdownMenuContent>
                </Drop.DropdownMenu>
                :
                row.original.status
            }
        </>
    );
};

const RatingCell = ({ row, isCurrent, username, mediaType, filters }) => {
    const onRatingChange = (oldData, variables) => {
        const newData = { ...oldData };
        newData.media_data = newData.media_data.map(m => {
            if (m.media_id === row.original.media_id) {
                return { ...m, rating: { ...m.rating, value: variables.payload } };
            }
            return m;
        });
        return newData;
    };

    const updateRating = useUpdateUserMediaList("update_rating", mediaType, row.original.media_id, username, filters, onRatingChange);

    return (
        <RatingListDrop
            isCurrent={isCurrent}
            updateRating={updateRating}
            rating={row.original.rating}
        />
    );
};

const FavoriteCell = ({ row, isCurrent, username, mediaType, filters }) => {
    const onFavoriteChange = (oldData, variables) => {
        const newData = { ...oldData };
        newData.media_data = newData.media_data.map(m => {
            if (m.media_id === row.original.media_id) {
                return { ...m, favorite: variables.payload };
            }
            return m;
        });
        return newData;
    };

    const updateFavorite = useUpdateUserMediaList("update_favorite", mediaType, row.original.media_id, username, filters, onFavoriteChange);

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

    const onRedoChange = (oldData, variables) => {
        const newData = {...oldData};
        newData.media_data = newData.media_data.map(m => {
            if (m.media_id === row.original.media_id) {
                return { ...m, redo: variables.payload };
            }
            return m;
        });
        return newData;
    };

    const updateRedo = useUpdateUserMediaList("update_redo", mediaType, row.original.media_id, username, filters, onRedoChange);

    return (
        <RedoListDrop
            isCurrent={isCurrent}
            updateRedo={updateRedo}
            redo={row.original.redo}
        />
    );
};

const CommentCell = ({ row, isCurrent, username, mediaType, filters }) => {
    const onCommentChange = (oldData, variables) => {
        const newData = {...oldData};
        newData.media_data = newData.media_data.map(m => {
            if (m.media_id === row.original.media_id) {
                return { ...m, comment: variables.payload };
            }
            return m;
        });
        return newData;
    };

    const updateComment = useUpdateUserMediaList("update_comment", mediaType, row.original.media_id, username, filters, onCommentChange);

    return (
        <CommentPopover
            isCurrent={isCurrent}
            key={row.original.media_id}
            updateComment={updateComment}
            content={row.original.comment}
        />
    );
};

const SuppMediaInfoCell = ({ row, isCurrent }) => {
    return (
        <div className="flex items-center justify-between h-[20px]">
            <SuppMediaInfo
                media={row.original}
                isCurrent={isCurrent}
            />
        </div>
    );
};

const ActionsCell = ({ row, isCurrent, username, mediaType, filters }) => {
    if (!isCurrent && (isCurrent || row.original.common)) return;

    const onStatusChange = (oldData, variables) => {
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

    const updateStatus = useUpdateUserMediaList("update_status", mediaType, row.original.media_id, username, filters, onStatusChange);
    const handleRemoveMedia = async () => {
        await removeMediaFromList.mutateAsync();
    };
    const handleStatus = async (status) => {
        await updateStatus.mutateAsync({ payload: status });
    };
    const handleAddOtherList = async (status) => {
        await addOtherList.mutate({ payload: status });
    };

    const addOtherList = useAddMediaToUserList(mediaType, row.original.media_id, username, filters);
    const removeMediaFromList = useRemoveMediaFromList(mediaType, row.original.media_id, username, filters);

    return (
        <EditMediaList
            isCurrent={isCurrent}
            updateStatus={handleStatus}
            status={row.original.status}
            removeMedia={handleRemoveMedia}
            addOtherList={handleAddOtherList}
            allStatus={row.original.all_status}
        >
            <LuMoreHorizontal className="h-4 w-4"/>
        </EditMediaList>
    );
};
