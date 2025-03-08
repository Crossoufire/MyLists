import {Link} from "@tanstack/react-router";
import {Button} from "@/components/ui/button";
import {Annoyed, CircleAlert} from "lucide-react";


export const ErrorComponent = ({ statusCode = 404, message = "Looks like you're lost" }) => {
    if (statusCode === 401) {
        message = "You need to be logged-in to access this page";
    }

    if (statusCode === 500) {
        return (
            <div className="flex items-center justify-center mt-16">
                <div className="text-center px-4">
                    <h1 className="text-3xl sm:text-5xl font-bold mb-4">
                        Oops! Our Bad!
                    </h1>
                    <p className="text-xl sm:text-2xl text-muted-foreground">
                        Something went wrong on our end.
                    </p>
                    <p className="text-xl sm:text-2xl mb-8 text-muted-foreground">
                        Sorry, We will try to fix it as soon as possible.
                    </p>
                    <div className="mb-8">
                        <Annoyed className="h-24 w-24 sm:h-40 sm:w-40 mx-auto text-primary"/>
                    </div>
                    <Button asChild>
                        <Link to="/">Take Me Home</Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center mt-16">
            <div className="text-center px-4">
                <h1 className="text-4xl sm:text-6xl font-bold mb-4">
                    Oops! <span className="text-primary">{statusCode}</span>
                </h1>
                <p className="text-xl sm:text-2xl mb-8 text-muted-foreground">
                    {statusCode === 404 ? "Sorry but this page does not exist :/" : message}
                </p>
                <div className="mb-8">
                    <CircleAlert className="h-24 w-24 sm:h-40 sm:w-40 mx-auto text-primary"/>
                </div>
                <Button asChild>
                    <Link to="/">Take Me Home</Link>
                </Button>
            </div>
        </div>
    );
};
