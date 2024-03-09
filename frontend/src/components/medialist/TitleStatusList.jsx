
export const TitleStatusList = ({ status, total, title = null }) => {
    return (
        <div className="font-medium text-xl">
            {title ? title.toUpperCase() : status.toUpperCase()}
            {(total !== 0) ? ` (${total})` : ""}
        </div>
    );
}
