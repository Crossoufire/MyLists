import {Button} from "@/lib/components/ui/button";


interface EditGenresSelectorProps {
    genresList: string[];
    selectedGenres: string[];
    setSelectedGenres: (genres: string[]) => void;
}


export function EditGenresSelector({ genresList, selectedGenres, setSelectedGenres }: EditGenresSelectorProps) {
    const toggleGenre = (ev: any, genre: string) => {
        ev.preventDefault();

        if (selectedGenres.includes(genre)) {
            setSelectedGenres(selectedGenres.filter(l => l !== genre));
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
                    key={genre} variant={selectedGenres.includes(genre) ? "default" : "outline"}
                    onClick={(ev) => toggleGenre(ev, genre)} className="text-sm rounded-full px-3"
                >
                    {genre}
                </Button>
            )}
        </div>
    );
}