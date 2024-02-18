import {Tabs, TabsList, TabsTrigger} from "@/components/ui/tabs";


export const NavigationStatus = ({ allStatus, activeStatus, updateStatus }) => {
    const handleStatus = (val) => {
        if (activeStatus === val) {
            return;
        }
        updateStatus(val);
    }

    return (
        <Tabs value={activeStatus} className="bg-card mt-8 rounded-md" onValueChange={handleStatus}>
            <TabsList className="flex flex-wrap sm:justify-evenly h-full">
                {allStatus.map(status =>
                    <TabsTrigger className="text-base" value={status}>
                        {status.toUpperCase()}
                    </TabsTrigger>
                )}
            </TabsList>
        </Tabs>
    );
};
