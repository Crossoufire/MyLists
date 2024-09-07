import errorImage from "@/images/error.jpg";


export const ErrorComponent = ({ error }) => {
    let { status, message, description } = error;
    if (status === undefined) {
        status = 404;
        message = "Page not found";
        description = "Sorry the requested page was not found";
    }

    return (
        <div className="flex flex-col mt-8">
            <h2 className="text-4xl mt-3 font-semibold">{status} - {message}</h2>
            <h4 className="text-xl mt-4">{description}</h4>
            <div className="flex items-center justify-center mt-14">
                <img
                    alt="error"
                    src={errorImage || ""}
                    className="w-[300px] h-[300px]"
                />
            </div>
        </div>
    );
};
