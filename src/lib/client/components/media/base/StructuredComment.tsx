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


const bulletRegex = /^\s*[-*•]\s+(.+)$/;


const renderBlock = (lines: string[], blockIndex: number) => {
    const isBulletList = lines.every((line) => !line.trim() || bulletRegex.test(line));

    if (isBulletList) {
        return (
            <ul className="list-disc space-y-1 pl-5 not-first:mt-3">
                {lines
                    .map((line) => line.match(bulletRegex)?.[1]?.trim())
                    .filter(Boolean)
                    .map((line, lineIndex) =>
                        <li key={`${blockIndex}-${lineIndex}`} className="pl-0.5">
                            {line}
                        </li>
                    )}
            </ul>
        );
    }

    return (
        <p className="whitespace-pre-wrap not-first:mt-3">
            {lines.join("\n")}
        </p>
    );
};
