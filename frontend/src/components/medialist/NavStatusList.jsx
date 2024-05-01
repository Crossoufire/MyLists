import {capitalize} from "@/lib/utils";
import {Button} from "@/components/ui/button";
import {Tabs, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Link} from "react-router-dom";


export const NavStatusList = ({ allStatus, activeStatus, mediaType, username, updateStatus }) => {
    const handleStatus = (newStatus) => {
        if (activeStatus === newStatus) {
            return;
        }
        updateStatus(newStatus);
    }

    return (
        <div className="flex items-center justify-between gap-4 mt-8">
            <Tabs value={activeStatus} className="w-full bg-card rounded-md" onValueChange={handleStatus}>
                <TabsList className="flex flex-wrap sm:justify-evenly h-full">
                    {allStatus.map(status =>
                        <TabsTrigger key={status} className="text-base" value={status}>
                            {status.toUpperCase()}
                        </TabsTrigger>
                    )}
                </TabsList>
            </Tabs>
            <Link to={`/stats/${mediaType}/${username}`}>
                <Button variant="secondary" className="h-10">
                    {capitalize(mediaType)} Stats
                </Button>
            </Link>
        </div>
    );
};
