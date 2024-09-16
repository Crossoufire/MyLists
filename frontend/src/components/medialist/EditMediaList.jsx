import * as Menu from "@/components/ui/menubar";


export const EditMediaList = ({ children, isCurrent, status, allStatus, updateStatus, removeMedia, addOtherList }) => {
    const handleMenuRemove = () => {
        if (!window.confirm("Are you sure you want to delete this media?")) return;
        removeMedia.mutate();
    };

    const handleMenuAdd = (ev) => {
        addOtherList.mutate({ payload: ev.target.textContent });
    };

    const handleMenuStatus = (ev) => {
        updateStatus.mutate({ payload: ev.target.textContent });
    };

    return (
        <Menu.Menubar>
            <Menu.MenubarMenu>
                <Menu.MenubarTrigger>
                    {children}
                </Menu.MenubarTrigger>
                <Menu.MenubarContent align="end">
                    <div className="text-center mt-1 mb-2 text-neutral-400 text-sm">Edit media</div>
                    {isCurrent &&
                        <>
                            <Menu.MenubarSub>
                                <Menu.MenubarSubTrigger>Change Status</Menu.MenubarSubTrigger>
                                <Menu.MenubarSubContent>
                                    {allStatus.map(st =>
                                        <Menu.MenubarItem key={st} onSelect={handleMenuStatus} disabled={st === status}>
                                            {st}
                                        </Menu.MenubarItem>
                                    )}
                                </Menu.MenubarSubContent>
                            </Menu.MenubarSub>
                            <Menu.MenubarSeparator/>
                            <Menu.MenubarItem onSelect={handleMenuRemove}>Delete media</Menu.MenubarItem>
                        </>
                    }
                    {!isCurrent &&
                        <Menu.MenubarSub>
                            <Menu.MenubarSubTrigger>Add to your list</Menu.MenubarSubTrigger>
                            <Menu.MenubarSubContent>
                                {allStatus.map(st =>
                                    <Menu.MenubarItem key={st} onSelect={handleMenuAdd}>
                                        {st}
                                    </Menu.MenubarItem>
                                )}
                            </Menu.MenubarSubContent>
                        </Menu.MenubarSub>
                    }
                </Menu.MenubarContent>
            </Menu.MenubarMenu>
        </Menu.Menubar>
    );
};
