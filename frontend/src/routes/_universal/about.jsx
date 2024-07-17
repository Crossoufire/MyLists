import {mail} from "@/lib/constants";
import {PageTitle} from "@/components/app/base/PageTitle.jsx";
import {createFileRoute} from "@tanstack/react-router";


// noinspection JSCheckFunctionSignatures,JSUnusedGlobalSymbols
export const Route = createFileRoute("/_universal/about")({
  component: AboutPage,
});


function AboutPage() {
	return (
		<PageTitle title="About">
			<h4 className="text-xl font-semibold mb-1 mt-6">MyLists.info</h4>
			<p>
				I'm only one person (french) maintaining this website. It is just a project on my free time to know
				where I'm on TV shows, movies, games or books for me and my friends. If you have any constructive
				remarks, find any bugs or want to be involved in the evolution of MyLists.info, please do not hesitate
				and&nbsp; <a className="text-blue-600" href={`mailto:${mail}`}>contact me</a>.
			</p>

			<h5 className="mt-7 text-xl font-semibold mb-1">Flask</h5>
			<p>
				MyLists.info is powered server side by
				<a className="text-blue-600" href="https://palletsprojects.com/"> Flask</a>.
				The license of Flask can be found&nbsp;
				<a className="text-blue-600" href="https://flask.palletsprojects.com/en/latest/license/">here</a>.
			</p>

			<h5 className="mt-7 text-xl font-semibold mb-1">React</h5>
			<p>
				MyLists.info is powered front side by
				<a className="text-blue-600" href="https://react.dev/"> React</a>.
				The license of react can be found&nbsp;
				<a className="text-blue-600" href="https://github.com/facebook/react/blob/main/LICENSE">here</a>.
			</p>

			<h5 className="mt-7 text-xl font-semibold mb-1">Shadcn-UI</h5>
			<p className="text-justify">
				MyLists.info uses <a className="text-blue-600" href="https://ui.shadcn.com/">Shadcn/ui</a>.
				The license can be found&nbsp;
				<a className="text-blue-600" href="https://github.com/shadcn-ui/ui/blob/main/LICENSE.md">here</a>.
			</p>

			<h5 className="mt-7 text-xl font-semibold mb-1">TMDB API</h5>
			<p>
				MyLists.info uses the <a className="text-blue-600" href="https://www.themoviedb.org/"> TMDB </a>
				API but is not endorsed or certified by TMDB. Here is the link to the
				<a className="text-blue-600" href="https://www.themoviedb.org/documentation/api"> TMDb API</a>.
			</p>

			<h5 className="mt-7 text-xl font-semibold mb-1">IGDB API</h5>
			<p>
				MyLists.info uses the <a className="text-blue-600" href="https://www.igdb.com/"> IGDB </a>
				API but is not endorsed or certified by IGDB. Here is the link to the
				<a className="text-blue-600" href="https://api-docs.igdb.com/"> IGDB API</a>.
			</p>

			<h5 className="mt-7 text-xl font-semibold mb-1">Google Books API</h5>
			<p>
				MyLists.info uses the <a className="text-blue-600" href="https://books.google.com/"> Google
				Books </a>
				API but is not endorsed or certified by Google.
				Here is the link to the
				<a className="text-blue-600" href="https://developers.google.com/books/"> Google Books API</a>.
			</p>

			<h5 className="mt-7 text-xl font-semibold mb-1">FreePik</h5>
			<p>
				The Logo was taken on FreePik and created by&nbsp;
				<a className="text-blue-600" href="https://fr.freepik.com/vecteurs-libre/logo-degrade-colore-initial-vecteur-m_28762027.htm#query=blue%20M%20logo%20png&position=3&from_view=search&track=ais&uuid=911d0224-be46-42ed-8f5d-bce057504422">
					logturnal
				</a>
			</p>
		</PageTitle>
	);
}