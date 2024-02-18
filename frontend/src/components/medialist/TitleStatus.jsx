
export const TitleStatus = ({ status, total, title = null }) => (
    <div className="font-medium text-xl">
        {title ? title.toUpperCase() : status.toUpperCase()}
        {(total !== 0) ? ` (${total})` : ""}
    </div>
);
