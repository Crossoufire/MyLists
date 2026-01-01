export const computeLevel = (totalTime: number) => {
    return (Math.sqrt(400 + 80 * totalTime) - 20) / 40;
}
