import {Button} from "@/lib/components/ui/button";


interface EditGenresSelectorProps {
    genresList: { name: string }[];
    selectedGenres: { name: string }[];
    setSelectedGenres: (genres: { name: string }[]) => void;
}


export function EditGenresSelector({ genresList, selectedGenres, setSelectedGenres }: EditGenresSelectorProps) {
    const toggleGenre = (ev: any, genre: { name: string }) => {
        ev.preventDefault();

        if (selectedGenres.includes(genre)) {
            setSelectedGenres(selectedGenres.filter((g) => g.name !== genre.name));
        }
        else {
            if (selectedGenres.length >= 5) return;
            setSelectedGenres([...selectedGenres, genre]);
        }
    };

    return (
        <div className="flex flex-wrap items-center justify-start gap-2">
            {genresList.map((genre) =>
                <Button
                    key={genre.name} variant={selectedGenres.includes(genre) ? "default" : "outline"}
                    onClick={(ev) => toggleGenre(ev, genre)} className="text-sm rounded-full px-3"
                >
                    {genre.name}
                </Button>
            )}
        </div>
    );
}