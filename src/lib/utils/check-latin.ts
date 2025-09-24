export const isLatin1 = (str: string) => {
    for (let i = 0; i < str.length; i++) {
        const charCode = str.charCodeAt(i);
        if (charCode < 0 || charCode > 255) return false;
    }
    return true;
}
