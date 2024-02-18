import {FaLongArrowAltRight} from "react-icons/fa";


export const Payload = ({ payload }) => (
    <div className="flex flex-row gap-2 items-center">
        {payload.length === 2 ?
            <>{payload[0]} <FaLongArrowAltRight size={16}/> {payload[1]}</>
            :
            payload[0]
        }
    </div>
);