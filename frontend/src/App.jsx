import {SWRConfig} from "swr";
import {HomePage} from "@/pages/HomePage";
import {InfoPage} from "@/pages/InfoPage";
import {AdminPage} from "@/pages/AdminPage";
import {ErrorPage} from "@/pages/ErrorPage";
import {AboutPage} from "@/pages/AboutPage";
import {TrendsPage} from "@/pages/TrendsPage";
import {Toaster} from "@/components/ui/sonner";
import {Footer} from "@/components/app/Footer";
import {ProfilePage} from "@/pages/ProfilePage";
import {Content} from "@/components/app/Content";
import {Navbar} from "@/components/navbar/Navbar";
import {SettingsPage} from "@/pages/SettingsPage";
import {MediaEditPage} from "@/pages/MediaEditPage";
import {MediaListPage} from "@/pages/MediaListPage";
import {ApiProvider} from "@/providers/ApiProvider";
import {HallOfFamePage} from "@/pages/HallOfFamePage";
import {ComingNextPage} from "@/pages/ComingNextPage";
import {UserProvider} from "@/providers/UserProvider";
import {GlobalStatsPage} from "@/pages/GlobalStatsPage";
import {MediaLevelsPage} from "@/pages/MediaLevelsPage";
import {ThemeProvider} from "@/providers/ThemeProvider";
import {PublicRoute} from "@/components/app/PublicRoute";
import {MediaDetailsPage} from "@/pages/MediaDetailsPage";
import {PrivacyPolicyPage} from "@/pages/PrivacyPolicyPage";
import {RegisterTokenPage} from "@/pages/RegisterTokenPage";
import {ResetPasswordPage} from "@/pages/ResetPasswordPage";
import {SheetProvider} from "@/providers/SheetProvider.jsx";
import {ProfileLevelsPage} from "@/pages/ProfileLevelsPage";
import {PrivateRoute, } from "@/components/app/PrivateRoute";
import {BrowserRouter, Route, Routes} from "react-router-dom";
import {AdminDashboardPage} from "@/pages/AdminDashboardPage";
import {ForgotPasswordPage} from "@/pages/ForgotPasswordPage";
import "./index.css";
import {OAuth2CallbackPage} from "@/pages/OAuth2CallbackPage.jsx";


export const App = () => {
	return (
		<ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
			<BrowserRouter>
				<ApiProvider>
					<UserProvider>
						<SWRConfig value={{ revalidateOnFocus: false, revalidateOnReconnect: false }}>
							<Toaster position="top-center" richColors/>
							<SheetProvider><Navbar/></SheetProvider>
							<Content>
								<Routes>
									<Route path="/about" element={<AboutPage/>}/>
									<Route path="/privacy_policy" element={<PrivacyPolicyPage/>}/>
									<Route path="/levels/media_levels" element={<MediaLevelsPage/>}/>
									<Route path="/levels/profile_levels" element={<ProfileLevelsPage/>}/>
									<Route path="/" element={<PublicRoute><HomePage/></PublicRoute>}/>
									<Route path="/register_token" element={<PublicRoute><RegisterTokenPage/></PublicRoute>}/>
									<Route path="/forgot_password" element={<PublicRoute><ForgotPasswordPage/></PublicRoute>}/>
									<Route path="/reset_password" element={<PublicRoute><ResetPasswordPage/></PublicRoute>}/>
									<Route path="/oauth2/:provider/callback" element={<PublicRoute><OAuth2CallbackPage/></PublicRoute>}/>
									<Route path="*" element={<PrivateRoute><PrivateRoutes/></PrivateRoute>}/>
								</Routes>
							</Content>
							<Footer/>
						</SWRConfig>
					</UserProvider>
				</ApiProvider>
			</BrowserRouter>
		</ThemeProvider>
	);
};


const PrivateRoutes = () => {
	return (
		<Routes>
			<Route path="/admin" element={<AdminPage/>}/>
			<Route path="/admin/dashboard" element={<AdminDashboardPage/>}/>

			<Route path="/profile/:username" element={<ProfilePage/>}/>
			<Route path="/profile/:username/:extension?" element={<ProfilePage/>}/>
			<Route path="/list/:mediaType/:username?" element={<MediaListPage/>}/>
			<Route path="/hall_of_fame" element={<HallOfFamePage/>}/>
			<Route path="/global_stats" element={<GlobalStatsPage/>}/>

			<Route path="/trends" element={<TrendsPage/>}/>
			<Route path="/coming_next" element={<ComingNextPage/>}/>
			<Route path="/settings" element={<SettingsPage/>}/>

			<Route path="/details/:mediaType/:mediaId" element={<MediaDetailsPage/>}/>
			<Route path="/details/form/:mediaType/:mediaId" element={<MediaEditPage/>}/>
			<Route path="/details/:mediaType/:job/:info" element={<InfoPage/>}/>

			<Route path="*" element={<ErrorPage/>}/>
		</Routes>
	);
}
