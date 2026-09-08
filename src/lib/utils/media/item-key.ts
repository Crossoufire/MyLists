export const toItemKey = (item: { mediaId: number; mediaType: string }) => {
    return `${item.mediaType}-${item.mediaId}`;
};
