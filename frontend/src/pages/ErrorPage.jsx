import errorImage from "@/images/error.jpg";


export const ErrorPage = ({ status, message, description }) => {
    if (status === undefined) {
        status = 404;
        message = "Page not found";
        description = "Sorry the requested page was not found";
    }

    return (
        <div className="flex flex-col items-center text-center mt-8">
            <h2 className="text-4xl mt-3 font-semibold">{status} - {message}</h2>
            <h4 className="text-xl mt-4">{description}</h4>
            <div className="justify-center mt-10">
                <img
                    src={errorImage || ""}
                    height={300}
                    width={300}
                    alt="error"
                />
            </div>
        </div>
    );
};
