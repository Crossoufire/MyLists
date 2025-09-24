import React from "react";
import {mail} from "@/lib/utils/helpers";
import {Link} from "@tanstack/react-router";
import {ArrowLeft, Home} from "lucide-react";
import {Button} from "@/lib/client/components/ui/button";
import {Card, CardContent} from "@/lib/client/components/ui/card";


interface ErrorComponentProps {
    text: string;
    title: string;
    footerText: string;
    icon: React.ReactNode;
}


export const ErrorComponent = ({ title, icon, text, footerText }: ErrorComponentProps) => {
    return (
        <div className="flex items-center justify-center p-4 mt-12">
            <Card className="w-full max-w-md">
                <CardContent>
                    <div className="text-center space-y-6">
                        <div className="space-y-6">
                            <h2 className="flex justify-center gap-2 text-3xl font-semibold text-gray-100">
                                {icon} {title}
                            </h2>
                            <p className="text-gray-300 leading-relaxed">
                                {text}
                            </p>
                        </div>
                        <div className="flex justify-center items-center">
                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex items-center gap-2"
                                    onClick={() => window.history.back()}
                                >
                                    <ArrowLeft className="w-4 h-4"/> Go Back
                                </Button>
                                <Button asChild className="flex items-center gap-2">
                                    <Link to="/">
                                        <Home className="w-4 h-4"/> Home
                                    </Link>
                                </Button>
                            </div>
                        </div>
                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-sm text-gray-400 dark:text-gray-400">
                                {footerText}{" "}
                                <a href={`mailto:${mail}`} className="text-primary hover:underline">Contact us</a>
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
