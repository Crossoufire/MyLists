import {Award} from "lucide-react";
import {cn} from "@/lib/utils/helpers";
import {Button} from "@/lib/components/ui/button";
import {Progress} from "@/lib/components/ui/progress";
import {capitalize, diffColors} from "@/lib/utils/functions";
import {achievementOptions} from "@/lib/react-query/query-options/query-options";
import {Popover, PopoverContent, PopoverTrigger} from "@/lib/components/ui/popover";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/lib/components/ui/table";


interface TierDetailsProps {
    achievement: Awaited<ReturnType<NonNullable<ReturnType<typeof achievementOptions>["queryFn"]>>>["result"][0];
}


export const TiersDetails = ({ achievement }: TierDetailsProps) => {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                    View Tiers
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full" align="center">
                <h3 className="font-semibold mb-2">{achievement.name} Tiers</h3>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tier</TableHead>
                            <TableHead>Progress</TableHead>
                            <TableHead>Rarity</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {achievement.tiers.map(tier => {
                            const iconColorClass = diffColors(tier.difficulty);
                            return (
                                <TableRow key={tier.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <Award className={cn("w-4 h-4", iconColorClass)}/>
                                            {capitalize(tier.difficulty)}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center space-x-2">
                                            <Progress value={tier.progress} className="w-24 h-2"/>
                                            <span className="text-xs">
                                                {tier.count}/{tier.criteria.count}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-end">{tier.rarity.toFixed(1)}%</TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </PopoverContent>
        </Popover>
    );
};
