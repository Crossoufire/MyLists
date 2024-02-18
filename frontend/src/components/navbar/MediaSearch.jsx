import {Link} from "react-router-dom";
import {capitalize} from "@/lib/utils";
import {useSheet} from "@/providers/SheetProvider.jsx";


export const MediaSearch = ({ apiId, name, mediaType, thumbnail, date, resetSearch }) => {
    const { setSheetOpen } = useSheet();
    const imageHeight = mediaType !== "User" ? 96 : 64;
    const url = mediaType !== "User" ? `/details/${mediaType}/${apiId}?search=True` : `/profile/${name}`;

    const handleLinkClick = () => {
        resetSearch();
        setSheetOpen(false);
    }

    return (
        <Link to={url} onClick={handleLinkClick}>
            <div className="flex border-b gap-x-4 p-3 items-center w-full min-h-6 hover:bg-neutral-900">
                <img
                    src={thumbnail}
                    height={imageHeight}
                    className="w-16 rounded-sm"
                    alt={name}
                />
                <div>
                    <div className="font-semibold mb-2">{name}</div>
                    <div className="text-neutral-300">{capitalize(mediaType)}</div>
                    <div className="text-muted-foreground text-sm">{date}</div>
                </div>
            </div>
        </Link>
    );
};
