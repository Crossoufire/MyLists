import {Tailwind} from "@react-email/tailwind";
import {Body, Container, Head, Heading, Hr, Html, Preview, Section, Text} from "@react-email/components";


interface ErrorEmailProps {
    brand?: string;
    ctx: {
        message: string;
        errorName: string;
        timestamp: string;
        errorMessage: string;
        stack: string | undefined;
    }
}


export const ErrorEmail = ({ ctx, brand = "MyLists" }: ErrorEmailProps) => {
    if (ctx === undefined) {
        ctx = {
            stack: undefined,
            errorName: "Unknown",
            message: "No context provided",
            timestamp: new Date().toISOString(),
            errorMessage: "No error message provided",
        }
    }

    const niceTime = new Date(ctx.timestamp).toLocaleString("fr", {
        month: "long",
        day: "numeric",
        weekday: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZoneName: "short",
    })

    return (
        <Html>
            <Head/>
            <Preview>{brand} - An Error Occurred - {ctx.errorName}</Preview>
            <Tailwind>
                <Body className="bg-gray-50 font-sans">
                    <Container className="mx-auto py-8 px-4 max-w-2xl">
                        <Section className="bg-gray-700 p-6 rounded-t-lg">
                            <Heading className="text-gray-300 text-2xl font-bold m-0 flex items-center">
                                Application Error Alert
                            </Heading>
                            <Text className="text-gray-300 mt-2 mb-0">
                                An error has occurred in the application.
                            </Text>
                        </Section>
                        <Section className="bg-white p-6 border-l-4 border-r border-b border-gray-200 rounded-b-lg">
                            <div className="mb-6">
                                <Heading className="text-lg font-semibold mb-0 border-b border-gray-200 pb-2">
                                    Error Summary
                                </Heading>
                                <div className="bg-red-100 border text-red-800 mt-0 rounded-lg p-4">
                                    <Text className="font-medium mt-0 mb-0">
                                        <strong>Error Type:</strong> {ctx.errorName}
                                    </Text>
                                    <Text className="mb-0 mt-1">
                                        <strong> Timestamp:</strong> {niceTime}
                                    </Text>
                                    <Text className="mb-0 mt-1">
                                        <strong>Message:</strong> {ctx.errorMessage}
                                    </Text>
                                </div>
                            </div>
                            <div className="mb-6">
                                <Heading className="text-lg font-semibold text-gray-900 mb-0 border-b border-gray-200 pb-2">
                                    Context
                                </Heading>
                                <Text className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800 my-0">
                                    {ctx.message}
                                </Text>
                            </div>
                            <div className="mb-6">
                                <Heading className="text-lg font-semibold text-gray-900 mb-0 border-b border-gray-200 pb-2">
                                    Stack Trace
                                </Heading>
                                <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto">
                                    <pre className="font-mono text-xs whitespace-pre-wrap break-words m-0">
                                        {ctx.stack}
                                    </pre>
                                </div>
                            </div>
                            <Hr className="border-gray-200 mt-6"/>
                            <Section>
                                <Text className="text-sm text-gray-600 mb-0">
                                    This is an automated error notification from your app monitoring system.
                                </Text>
                                <Text className="text-xs text-gray-500 mt-1 mb-0">
                                    Please investigate this error to ensure system stability.
                                </Text>
                            </Section>
                        </Section>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};


export default ErrorEmail;
