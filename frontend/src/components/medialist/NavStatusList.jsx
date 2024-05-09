import {Button} from "@/components/ui/button";
import {Link, useParams} from "@tanstack/react-router";
import {Tabs, TabsList, TabsTrigger} from "@/components/ui/tabs";


export const NavStatusList = ({ allStatus, activeStatus, updateStatus }) => {
    const { mediaType, username } = useParams({ strict: false });

    const handleStatus = (newStatus) => {
        if (activeStatus === newStatus) {
            return;
        }
        updateStatus(newStatus);
    };

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
                    Detailed Stats
                </Button>
            </Link>
        </div>
    );
};
