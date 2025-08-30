import {useCallback, useState} from "react";
import Cropper, {Area} from "react-easy-crop";
import {Input} from "@/lib/components/ui/input";
import {Button} from "@/lib/components/ui/button";
import {MutedText} from "@/lib/components/general/MutedText";
import {FormDescription} from "@/lib/components/ui/form";


interface ImageCropperProps {
    aspect: number;
    fileName: string;
    resultClassName?: string;
    cropShape: "round" | "rect";
    onCropApplied: (file: File) => void;
}


interface CropState {
    zoom: number;
    open: boolean;
    imageSrc: string;
    showResult: boolean;
    croppedImage: Blob | null;
    crop: { x: number; y: number };
    croppedAreaPixels: Area | null;
}


export const ImageCropper = ({ aspect, fileName, resultClassName = "", cropShape, onCropApplied }: ImageCropperProps) => {
    const [state, setState] = useState<CropState>({
        zoom: 1,
        open: true,
        imageSrc: "",
        showResult: false,
        croppedImage: null,
        crop: { x: 0, y: 0 },
        croppedAreaPixels: null,
    });

    const getCroppedImg = async (imageSrc: string, crop: Area) => {
        const image = await createImage(imageSrc);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = crop.width;
        canvas.height = crop.height;

        if (!ctx) throw new Error("Could not get canvas context");

        ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);

        return new Promise<Blob>((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                }
                else {
                    reject(new Error("Canvas is empty"));
                }
            }, "image/jpeg");
        });
    };

    const createImage = (url: string) => {
        return new Promise((resolve, reject) => {
            const image = new window.Image();
            image.addEventListener("load", () => resolve(image));
            image.addEventListener("error", reject);
            image.src = url;
        }) as Promise<HTMLImageElement>;
    };

    const onFileChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
        const file = ev.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => setState((prev) => ({
                ...prev,
                open: true,
                showResult: false,
                imageSrc: reader.result as string,
            }));
            reader.readAsDataURL(file);
        }
    };

    const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
        setState((prev) => ({ ...prev, croppedAreaPixels }));
    }, []);

    const handleApplyCrop = async (ev: React.MouseEvent<HTMLButtonElement>) => {
        ev.preventDefault();
        if (!state.croppedAreaPixels) return;

        const croppedImage = await getCroppedImg(state.imageSrc, state.croppedAreaPixels);
        const croppedFile = new File([croppedImage], `${fileName}.jpg`, { type: "image/jpeg" });
        onCropApplied(croppedFile);
        setState((prev) => ({ ...prev, open: false, showResult: true, croppedImage }));
    };

    const handleEditCrop = () => {
        setState((prev) => ({ ...prev, open: true, showResult: false }));
    };

    return (
        <div>
            <Input
                type="file"
                accept="image/*"
                onChange={onFileChange}
                className="file:text-muted-foreground cursor-pointer"
            />
            <FormDescription>Choose an image to crop and resize.</FormDescription>
            {(state.imageSrc && state.open) &&
                <div className="space-y-4 mt-6 bg-card rounded-lg p-3">
                    <div>
                        <div>Crop Profile Image</div>
                        <MutedText className="not-italic">Resize your profile image to fit your needs.</MutedText>
                    </div>
                    <div className="relative h-[250px] w-full">
                        <Cropper
                            aspect={aspect}
                            zoom={state.zoom}
                            crop={state.crop}
                            cropShape={cropShape}
                            image={state.imageSrc}
                            onCropComplete={onCropComplete}
                            onCropChange={(crop) => setState((prev) => ({ ...prev, crop }))}
                            onZoomChange={(zoom) => setState((prev) => ({ ...prev, zoom }))}
                        />
                    </div>
                    <Button onClick={handleApplyCrop}>Apply Crop</Button>
                </div>
            }
            {(state.showResult && state.croppedImage) &&
                <div className="space-y-4 mt-4 bg-card rounded-lg p-3 h-min-[250px]">
                    <MutedText className="not-italic">Selected Image</MutedText>
                    <img
                        alt={fileName}
                        className={resultClassName}
                        src={URL.createObjectURL(state.croppedImage)}
                    />
                    <Button onClick={handleEditCrop}>Edit Crop</Button>
                </div>
            }
        </div>
    );
};
