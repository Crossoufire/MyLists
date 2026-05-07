import {Fragment} from "react";


interface StructuredCommentProps {
    content: string;
    className?: string;
}


export const StructuredComment = ({ content, className }: StructuredCommentProps) => {
    const blocks = content
        .replace(/\r\n/g, "\n")
        .split(/\n{2,}/)
        .map((block) => block.split("\n"))
        .filter((lines) => lines.some((line) => line.trim().length > 0));

    return (
        <div className={className}>
            {blocks.map((lines, blockIndex) =>
                <Fragment key={blockIndex}>
                    {renderBlock(lines, blockIndex)}
                </Fragment>
            )}
        </div>
    );
};


const bulletRegex = /^\s*[-*•–—]\s+(.+)$/;


const renderBlock = (lines: string[], blockIndex: number) => {
    const segments: Array<{ type: "list" | "paragraph"; lines: string[] }> = [];

    for (const line of lines) {
        if (!line.trim()) continue;

        const type = bulletRegex.test(line) ? "list" : "paragraph";
        const previousSegment = segments.at(-1);

        if (previousSegment?.type === type) {
            previousSegment.lines.push(line);
        } else {
            segments.push({ type, lines: [line] });
        }
    }

    return (
        <>
            {segments.map((segment, segmentIndex) =>
                segment.type === "list" ? (
                    <ul key={segmentIndex} className="list-disc space-y-1 pl-5 not-first:mt-3">
                        {segment.lines
                            .map((line) => line.match(bulletRegex)?.[1]?.trim())
                            .filter(Boolean)
                            .map((line, lineIndex) =>
                                <li key={`${blockIndex}-${segmentIndex}-${lineIndex}`} className="pl-0.5">
                                    {line}
                                </li>
                            )}
                    </ul>
                ) : (
                    <p key={segmentIndex} className="whitespace-pre-wrap not-first:mt-3">
                        {segment.lines.join("\n")}
                    </p>
                )
            )}
        </>
    );
};
