import {FaCircleCheck} from "react-icons/fa6";


export const CommonCorner = ({ isCommon }) => {
    return (
        <>
            <div className="absolute top-0 right-0 border-solid border-t-0 border-r-[55px] border-b-[55px] border-l-0
            border-[transparent_#030712] opacity-70 rounded-tr-md"/>
            {isCommon && <FaCircleCheck className="absolute top-2 right-2" color="green"/>}
        </>
    );
};
