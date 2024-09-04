import {useState} from "react";
import {Button} from "@/components/ui/button";
import * as Dia from "@/components/ui/dialog";
import {useUser} from "@/providers/UserProvider";
import {useModalMutation} from "@/utils/mutations";
import {Separator} from "@/components/ui/separator";


const newUpdateData = [
    {
        title: "New List UI",
        info: "All lists UI have been updated and refreshed to be more usable"
    },
    {
        title: "New Stats UI",
        info: "A new stats page is available for each user to see detailed information on each activated media lists. " +
            "To access it, in your profile page, on the series for example click on the 'Details Stats' link."
    },
    {
        title: "Compare Stats with others",
        info: "On the stats page you can compare some stats with another user easily!"
    },
    {
        title: "New Labels System",
        info: "You can now create and manage labels to the media you added in your lists."
    },
];


export const UpdatesModal = () => {
    const {currentUser} = useUser();
    const modalUpdate = useModalMutation();
    const [isOpen, setIsOpen] = useState(currentUser.show_update_modal);

    const doNotShowModalAgain = () => {
        modalUpdate.mutate();
        setIsOpen(false);
    };

    return (
        <Dia.Dialog open={isOpen} onOpenChange={() => setIsOpen(false)}>
            <Dia.DialogContent className="sm:max-w-[600px]">
                <div className="grid gap-6 p-6">
                    <div className="space-y-2">
                        <Dia.DialogTitle className="text-2xl font-bold">
                            New Features
                        </Dia.DialogTitle>
                        <Dia.DialogDescription className="text-muted-foreground">
                            Check out what's new in our latest update.
                        </Dia.DialogDescription>
                        <Separator/>
                    </div>
                    <div className="grid gap-4">
                        {newUpdateData.map((news, idx) =>
                            <div key={idx} className="flex items-start gap-4">
                                <CheckIcon className="mt-1 h-5 w-5 flex-shrink-0 text-primary"/>
                                <div>
                                    <h4 className="font-medium">{news.title}</h4>
                                    <p className="text-muted-foreground">{news.info}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <Dia.DialogFooter>
                    <Button onClick={doNotShowModalAgain}>
                        Hide Until Next Update
                    </Button>
                </Dia.DialogFooter>
            </Dia.DialogContent>
        </Dia.Dialog>
    );
};


const CheckIcon = (props) => {
    return (
        <svg
            width="24"
            height="24"
            fill="none"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            xmlns="http://www.w3.org/2000/svg"
            {...props}
        >
            <path d="M20 6 9 17l-5-5"/>
        </svg>
    )
};