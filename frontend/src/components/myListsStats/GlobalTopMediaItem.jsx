import {Fragment} from "react";
import {Separator} from "@/components/ui/separator";


export const GlobalTopMediaItem = ({ title, dataToMap }) => (
    <div className="bg-card p-3 rounded-md">
        {title &&
            <>
                <div className="text-base font-medium">{title}</div>
                <Separator/>
            </>
        }
        <div className="grid grid-cols-12 gap-y-3">
            {dataToMap.map(media =>
                <Fragment key={media.info}>
                    <div className="col-span-3">
                        <div className="text-center">{media.quantity}</div>
                    </div>
                    <div className="col-span-9">
                        <div className="line-clamp-1" title={media.info}>
                            {media.info}
                        </div>
                    </div>
                </Fragment>
            )}
        </div>
    </div>
);
