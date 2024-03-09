import {Link} from "react-router-dom";
import {ErrorPage} from "@/pages/ErrorPage";
import {useFetchData} from "@/hooks/FetchDataHook";
import {PageTitle} from "@/components/app/PageTitle";
import {Loading} from "@/components/primitives/Loading";


const BorderCalculus = ({ border }) => {
	if (8 * border.level < 320) {
		return (
			<div className="text-center text-lg">
				Lvl {8*(-1+border.level)} - Lvl {-1+8*(border.level)}
			</div>
		)
	}

	return <div className="text-center text-lg">Lvl {8*(-1+border.level)} +</div>
};


export const ProfileLevelsPage = () => {
	const { apiData, loading, error } = useFetchData("/levels/profile_borders");

	if (error) return <ErrorPage {...error}/>;
	if (loading) return <Loading/>;

	return (
		<PageTitle title="Profile borders" subtitle="Understanding the Profile Levels Borders System">
			<ul className="mt-3 text-lg list-disc ml-10">
				<li>Borders created by <Link to={"/profile/Psy"}>Psy</Link> using Freepik images.</li>
				<li>40 borders. New border every 8 levels.</li>
				<li>New border until level 312.</li>
				<li>Level = ((((400+ 80 * <u>totalTime</u>) ** (1/2)) - 20) / 40).</li>
			</ul>
			<div className="mt-8 gap-4 mb-5 grid grid-cols-12">
				{apiData.map((border, idx) =>
					<div className="col-span-6 md:col-span-4 lg:col-span-3 xl:col-span-2">
						<div className="bg-card h-100 rounded-md flex flex-col justify-center items-center p-2">
							<img
								src={border.image}
								className="w-44 h-44"
								alt={border.name}
							/>
							<BorderCalculus
								border={border}
							/>
						</div>
					</div>
				)}
			</div>
		</PageTitle>
	);
};
