import { useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import useAuthStore from "../../stores/Authstore";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import NotificationCenter from "../notifications/NotificationCenter";

function AppLayout() {
    const { token } = useAuthStore();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="page-bg">
            {/* Fixed Navbar */}
            <Navbar 
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                onOpenNotifications={() => setIsNotificationsOpen(true)}
            />

            {/* Slide-out Sidebar */}
            <Sidebar 
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            {/* Page Content - with top padding for fixed navbar */}
            <main style={{ 
                padding: "96px 24px 24px 24px", 
                maxWidth: "100%",
                overflow: "hidden",
            }}>
                <Outlet />
            </main>

            {/* Notification Side Panel */}
            <NotificationCenter 
                isOpen={isNotificationsOpen}
                onClose={() => setIsNotificationsOpen(false)}
            />
        </div>
    );
}

export default AppLayout;