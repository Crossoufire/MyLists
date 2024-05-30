import * as Menu from "@/components/ui/menubar";
import {DotsVerticalIcon} from "@radix-ui/react-icons";


export const EditMediaList = (props) => {
    const {isCurrent, status, allStatus, handleStatus, removeMedia, addOtherList} = props;

    const handleMenuRemove = () => {
        const confirm = window.confirm("Are you sure you want to delete this media?");
        if (!confirm) return;
        removeMedia();
    };

    const handleMenuStatus = (ev) => handleStatus(ev.target.textContent);

    const handleMenuAdd = (ev) => addOtherList(ev.target.textContent);

    return (
        <Menu.Menubar>
            <Menu.MenubarMenu>
                <Menu.MenubarTrigger>
                    <DotsVerticalIcon className="h-5 w-5 hover:opacity-70"/>
                </Menu.MenubarTrigger>
                <Menu.MenubarContent align="end" >
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
