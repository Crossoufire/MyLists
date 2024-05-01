import React from "react";
import {HomePage} from "@/pages/HomePage";
import {InfoPage} from "@/pages/InfoPage";
import {AdminPage} from "@/pages/AdminPage";
import {ErrorPage} from "@/pages/ErrorPage";
import {StatsPage} from "@/pages/StatsPage";
import {AboutPage} from "@/pages/AboutPage";
import {TrendsPage} from "@/pages/TrendsPage";
import {ProfilePage} from "@/pages/ProfilePage";
import {SettingsPage} from "@/pages/SettingsPage";
import {MediaEditPage} from "@/pages/MediaEditPage";
import {MediaListPage} from "@/pages/MediaListPage";
import {ApiProvider} from "@/providers/ApiProvider";
import {HallOfFamePage} from "@/pages/HallOfFamePage";
import {ComingNextPage} from "@/pages/ComingNextPage";
import {MainLayout} from "@/components/app/MainLayout";
import {MediaLevelsPage} from "@/pages/MediaLevelsPage";
import {GlobalStatsPage} from "@/pages/GlobalStatsPage";
import {ThemeProvider} from "@/providers/ThemeProvider";
import {PublicRoute} from "@/components/app/PublicRoute";
import {MediaDetailsPage} from "@/pages/MediaDetailsPage";
import {PrivateRoute} from "@/components/app/PrivateRoute";
import {PrivacyPolicyPage} from "@/pages/PrivacyPolicyPage";
import {RegisterTokenPage} from "@/pages/RegisterTokenPage";
import {ResetPasswordPage} from "@/pages/ResetPasswordPage";
import {ProfileLevelsPage} from "@/pages/ProfileLevelsPage";
import {AdminDashboardPage} from "@/pages/AdminDashboardPage";
import {ForgotPasswordPage} from "@/pages/ForgotPasswordPage";
import {OAuth2CallbackPage} from "@/pages/OAuth2CallbackPage";
import {createBrowserRouter, createRoutesFromElements, Route, RouterProvider} from "react-router-dom";
import "./index.css";


const router = createBrowserRouter(
	createRoutesFromElements(
		<Route element={<MainLayout/>}>
			<Route path="/about" element={<AboutPage/>}/>
			<Route path="/privacy_policy" element={<PrivacyPolicyPage/>}/>
			<Route path="/levels/media_levels" element={<MediaLevelsPage/>}/>
			<Route path="/levels/profile_levels" element={<ProfileLevelsPage/>}/>

			<Route element={<PublicRoute/>}>
				<Route path="/" element={<HomePage/>}/>
				<Route path="/register_token" element={<RegisterTokenPage/>}/>
				<Route path="/forgot_password" element={<ForgotPasswordPage/>}/>
				<Route path="/reset_password" element={<ResetPasswordPage/>}/>
				<Route path="/oauth2/:provider/callback" element={<OAuth2CallbackPage/>}/>
			</Route>

			<Route element={<PrivateRoute/>}>
				<Route path="/hall_of_fame" element={<HallOfFamePage/>}/>
				<Route path="/global_stats" element={<GlobalStatsPage/>}/>
				<Route path="/trends" element={<TrendsPage/>}/>
				<Route path="/details/:mediaType/:mediaId" element={<MediaDetailsPage/>}/>
				<Route path="/details/form/:mediaType/:mediaId" element={<MediaEditPage/>}/>
				<Route path="/details/:mediaType/:job/:info" element={<InfoPage/>}/>
				<Route path="/profile/:username" element={<ProfilePage/>}/>
				<Route path="/profile/:username/:extension?" element={<ProfilePage/>}/>
				<Route path="/stats/:mediaType/:username" element={<StatsPage/>}/>
				<Route path="/list/:mediaType/:username" element={<MediaListPage/>}/>
				<Route path="/list/:mediaType/:username/:extension?" element={<MediaListPage/>}/>
				<Route path="/coming_next" element={<ComingNextPage/>}/>
				<Route path="/settings" element={<SettingsPage/>}/>
				<Route path="/admin" element={<AdminPage/>}/>
				<Route path="/admin/dashboard" element={<AdminDashboardPage/>}/>
			</Route>

			<Route path="*" element={<ErrorPage/>}/>
		</Route>
	)
);


export const App = () => {
	return (
		<ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
			<ApiProvider>
				<RouterProvider router={router}/>
			</ApiProvider>
		</ThemeProvider>
	);
};
