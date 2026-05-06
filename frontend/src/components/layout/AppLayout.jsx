import { Outlet, Navigate } from "react-router-dom";
import useAuthStore from "../../stores/Authstore";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

function AppLayout() {
    const { token } = useAuthStore();

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-base-100">
            {/* Full-width Top Navbar */}
            <Navbar />

            <div className="flex flex-1 overflow-hidden">
                {/* Collapsible Sidebar below Navbar */}
                <Sidebar />

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}

export default AppLayout;