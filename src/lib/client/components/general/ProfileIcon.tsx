import {cn} from "@/lib/utils/helpers";
import {Avatar, AvatarFallback, AvatarImage} from "@/lib/client/components/ui/avatar";


interface ProfileIconProps {
    className?: string;
    fallbackSize?: string;
    user: {
        name: string,
        image: string | null,
    };
}


export const ProfileIcon = ({ user, className, fallbackSize }: ProfileIconProps) => {
    return (
        <Avatar className={cn("rounded-full border-black bg-gray-900", className)}>
            <AvatarImage src={user.image ?? ""} alt={user.name}/>
            <AvatarFallback className={cn("text-3xl font-medium tracking-wide bg-gray-800", fallbackSize)}>
                {user.name.charAt(0).toUpperCase() + user.name.charAt(1).toUpperCase()}
            </AvatarFallback>
        </Avatar>
    );
};
