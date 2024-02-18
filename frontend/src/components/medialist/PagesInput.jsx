import {useState} from "react";
import {Input} from "@/components/ui/input";
import {useLoading} from "@/hooks/LoadingHook";


export const PagesInput = ({ isCurrent, initPage, totalPages, updatePage }) => {
    const [page, setPage] = useState(initPage);
    const [isLoading, handleLoading] = useLoading();

    const handlePage = (ev) => setPage(ev.target.value);

    const handleUpdatePage = async (ev) => {
        const newValue = ev.target.value;
        const response = await handleLoading(updatePage, newValue);
        if (response) {
            setPage(newValue);
        }
    }

    return (
        <div className="flex justify-center items-center h-[32px] w-full opacity-90 bg-gray-900 border
        border-x-black border-b-black rounded-bl-md rounded-br border-t-transparent">
            {isCurrent ?
                <Input
                    value={page}
                    onBlur={handleUpdatePage}
                    onChange={handlePage}
                    className="w-[50px] border-none cursor-pointer"
                    disabled={isLoading}
                />
                :
                <>{page} </>
            }
            / {totalPages}
        </div>
    )
};
