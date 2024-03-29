import {toast} from "sonner";
import {useState} from "react";
import {useParams} from "react-router-dom";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {FaPen, FaTrash} from "react-icons/fa";
import {useApi} from "@/providers/ApiProvider";
import {Tooltip} from "@/components/ui/tooltip";
import {Return} from "@/components/primitives/Return";
import {Loading} from "@/components/primitives/Loading";
import {MediaCard} from "@/components/reused/MediaCard";
import {Popover, PopoverAnchor, PopoverContent, PopoverTrigger} from "@/components/ui/popover";


const ShowMediaWithLabel = ({ labelsMedia }) => {
    const { mediaType } = useParams();

    return (
        <>
            {labelsMedia.map(media =>
                <div key={media.id} className="col-span-6 sm:col-span-3 lg:col-span-2">
                    <MediaCard
                        media={media}
                        mediaType={mediaType}
                        botRounded={true}
                    />
                </div>
            )}
        </>
    );
};

const ShowAllLabels = ({ initLabelsList, mediaType, isCurrent, updateLabel }) => {
    const api = useApi();
    const [newLabelName, setNewLabelName] = useState("");
    const [selectedLabel, setSelectedLabel] = useState("");
    const [labelsList, setLabelsList] = useState(initLabelsList);

    const deleteLabel = async (label) => {
        const confirm = window.confirm("Do you really want to delete this label?");

        if (confirm) {
            const response = await api.post("/delete_label", {
                label: label,
                media_type: mediaType,
            });

            if (!response.ok) {
                return toast.error(response.body.description);
            }

            toast.success(response.body.message);
            setLabelsList(labelsList.filter(x => x !== label));
        }
    };

    const renameLabel = async () => {
        if (newLabelName < 1 || selectedLabel === newLabelName) {
            return;
        }

        const response = await api.post("/rename_label", {
            media_type: mediaType,
            old_label_name: selectedLabel,
            new_label_name: newLabelName,
        });

        if (!response.ok) {
            return toast.error(response.body.description);
        }

        toast.success(response.body.message);
        setLabelsList(labelsList.map(x => (x === selectedLabel ? newLabelName : x)));
        setSelectedLabel("");
    }


    return (
        <>
            {labelsList.map((label, idx) =>
                <>
                    <div key={`${label}-${idx}`} className="col-span-6 sm:col-span-3 lg:col-span-2">
                        <div className="relative flex justify-center items-center p-2 w-[200px] h-[300px] rounded-md bg-card">
                            <button className="text-xl mb-2" onClick={() => updateLabel(label)}>
                                {label}
                            </button>
                            {isCurrent &&
                                <>
                                    <Popover>
                                        <PopoverTrigger>
                                            <Tooltip text="Rename label">
                                                <button className="absolute top-2 left-2 opacity-50 hover:opacity-100">
                                                    <FaPen size={16} onClick={() => setSelectedLabel(label)}/>
                                                </button>
                                            </Tooltip>
                                        </PopoverTrigger>
                                        <PopoverAnchor className="absolute top-8 left-0"/>
                                        <PopoverContent align="start" className="w-[200px]">
                                            <div className="text-base font-medium mb-2">Rename label</div>
                                            <Input
                                                defaultValue={selectedLabel}
                                                onChange={(ev) => setNewLabelName(ev.target.value)}
                                                onKeyPress={(ev) => ev.key === "Enter" && renameLabel()}
                                            />
                                            <Button variant="secondary" size="sm" className="mt-3" onClick={renameLabel}>
                                                Rename
                                            </Button>
                                        </PopoverContent>
                                    </Popover>
                                    <Tooltip text="Delete label">
                                        <button className="absolute top-2 right-2 opacity-50 hover:opacity-100">
                                            <FaTrash size={16} onClick={() => deleteLabel(label)}/>
                                        </button>
                                    </Tooltip>
                                </>
                            }
                        </div>
                    </div>
                </>
            )}
        </>
    );
}


export const MediaListLabels = ({ mediaData, isCurrent, updateLabel, loading }) => {
    const { mediaType, username } = useParams();

    return (
        <>
            {mediaData.labels_media.length > 0 &&
                <Return value="to labels" to={`/list/${mediaType}/${username}?status=Labels`}/>
            }
            <div className="mt-3 grid grid-cols-12 lg:gap-4 mb-5">
                {loading ?
                    <Loading forPage={false}/>
                    :
                    mediaData.labels_media.length > 0 ?
                        <ShowMediaWithLabel
                            labelsMedia={mediaData.labels_media}
                        />
                        :
                        <ShowAllLabels
                            mediaType={mediaType}
                            initLabelsList={mediaData.labels}
                            isCurrent={isCurrent}
                            updateLabel={updateLabel}
                        />
                }
            </div>
        </>
    );
};
