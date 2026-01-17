import React from "react";
import {Link} from "@tanstack/react-router";
import {Button} from "@/lib/client/components/ui/button";


export const FeaturesWalkthrough = () => {
    return (
        <div className="flex flex-col h-fit max-w-125 gap-5 rounded-xl bg-popover/50 border p-6">
            <div>
                <h3 className="text-base font-bold">
                    Feature Walkthrough
                </h3>
                <p className="text-sm mt-1 max-w-xl">
                    New to the platform? Replay the tutorial to learn how
                    to navigate the app and use our main features.
                </p>
            </div>

            <Button variant="default" className="w-fit mx-auto" asChild>
                <Link to="/walkthrough/search-media">
                    Start Tutorial
                </Link>
            </Button>
        </div>
    );
};