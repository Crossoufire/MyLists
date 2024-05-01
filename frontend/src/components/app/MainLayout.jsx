import {SWRConfig} from "swr";
import {Outlet} from "react-router-dom";
import {Footer} from "@/components/app/Footer";
import {Toaster} from "@/components/ui/sonner";
import {Navbar} from "@/components/navbar/Navbar";
import {UserProvider} from "@/providers/UserProvider";
import {SheetProvider} from "@/providers/SheetProvider";


export const MainLayout = () => {
	return (
		<UserProvider>
			<SWRConfig value={{ revalidateOnFocus: false, revalidateOnReconnect: false }}>
				<Toaster position="top-center" richColors/>
				<SheetProvider><Navbar/></SheetProvider>
				<main className="md:max-w-screen-xl container">
					<Outlet/>
				</main>
				<Footer/>
			</SWRConfig>
		</UserProvider>
	);
}
