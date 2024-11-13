import {LuAward} from "react-icons/lu";
import {Button} from "@/components/ui/button";
import {Progress} from "@/components/ui/progress";
import {capitalize, diffColors} from "@/utils/functions";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";


export const TiersDetails = ({ achievement }) => {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="w-full mt-3">View Tiers</Button>
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
                            const userData = achievement.user_data.find(data => data.tier_id === tier.id);
                            return (
                                <TableRow key={tier.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <LuAward className={`w-4 h-4 ${diffColors(tier.difficulty)}`}/>
                                            {capitalize(tier.difficulty)}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center space-x-2">
                                            <Progress value={userData?.progress} className="w-24 h-2"/>
                                            <span className="text-xs">
                                                {userData ? `${userData.count}/${tier.criteria.count}` : `0/${tier.criteria.count}`}
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
