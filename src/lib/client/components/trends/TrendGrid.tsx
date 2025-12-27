import {TrendingUp} from "lucide-react";
import {TrendsMedia} from "@/lib/types/provider.types";
import {TrendCard} from "@/lib/client/components/trends/TrendCard";
import {EmptyState} from "@/lib/client/components/user-profile/EmptyState";


export const TrendGrid = ({ data }: { data: TrendsMedia[] }) => {
    if (data.length === 0) {
        return (
            <EmptyState
                icon={TrendingUp}
                className="py-12"
                message="No trending data available right now."
            />
        );
    }

    return (
        <>
            <div className="text-sm font-medium text-muted-foreground mb-4">
                Showing {data.length} Results
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                {data.map((media) =>
                    <TrendCard
                        media={media}
                        key={`${media.mediaType}-${media.apiId}`}
                    />
                )}
            </div>
        </>
    );
};