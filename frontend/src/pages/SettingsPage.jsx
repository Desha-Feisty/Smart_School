import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../stores/Authstore";
import axios from "axios";
import toast from "react-hot-toast";
import PageWrapper from "../components/layout/PageWrapper";
import {
    User,
    Lock,
    Bell,
    Palette,
    Shield,
    Save,
    Eye,
    EyeOff,
} from "lucide-react";

function SettingsPage() {
    const { token, user, role, setUser } = useAuthStore();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState("profile");
    const [isLoading, setIsLoading] = useState(false);

    // Profile state
    const [profileData, setProfileData] = useState({
        name: user?.name || "",
        email: user?.email || "",
    });

    // Password state
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [showPassword, setShowPassword] = useState(false);

    // Notification preferences
    const [notifications, setNotifications] = useState({
        emailQuizResults: true,
        emailCourseUpdates: true,
        pushNewGrades: true,
        pushNewMessages: true,
    });

    useEffect(() => {
        if (!token) {
            navigate("/login");
        }
    }, [token, navigate]);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await axios.put(
                "/api/users/profile",
                { name: profileData.name },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setUser(res.data.user);
            toast.success("Profile updated successfully");
        } catch (err) {
            toast.error(err.response?.data?.errMsg || "Failed to update profile");
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error("New passwords do not match");
            return;
        }
        if (passwordData.newPassword.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }
        setIsLoading(true);
        try {
            await axios.put(
                "/api/users/password",
                {
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("Password changed successfully");
            setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
        } catch (err) {
            toast.error(err.response?.data?.errMsg || "Failed to change password");
        } finally {
            setIsLoading(false);
        }
    };

    const tabs = [
        { id: "profile", label: "Profile", icon: User },
        { id: "password", label: "Password", icon: Lock },
        { id: "notifications", label: "Notifications", icon: Bell },
    ];

    return (
        <PageWrapper>
            <main className="max-w-4xl mx-auto px-6 py-8 animate-in fade-in duration-500 w-full relative z-10">
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        Settings
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">
                        Manage your account preferences
                    </p>
                </div>

                <div className="flex flex-col md:flex-row gap-6">
                    {/* Sidebar Tabs */}
                    <div className="md:w-64 shrink-0">
                        <div className="glass-panel rounded-2xl p-2">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                                        activeTab === tab.id
                                            ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50"
                                    }`}
                                >
                                    <tab.icon className="w-5 h-5" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1">
                        <div className="glass-panel rounded-2xl p-6">
                            {activeTab === "profile" && (
                                <form onSubmit={handleProfileUpdate}>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                        <User className="w-5 h-5 text-blue-500" />
                                        Profile Information
                                    </h2>
                                    <div className="space-y-4">
                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text font-bold">Full Name</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="input input-bordered rounded-xl bg-slate-100 dark:bg-slate-800"
                                                value={profileData.name}
                                                disabled
                                            />
                                            <label className="label">
                                                <span className="label-text-alt text-slate-500">
                                                    Contact your administrator to change your name
                                                </span>
                                            </label>
                                        </div>
                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text font-bold">Email Address</span>
                                            </label>
                                            <input
                                                type="email"
                                                className="input input-bordered rounded-xl bg-slate-100 dark:bg-slate-800"
                                                value={profileData.email}
                                                disabled
                                            />
                                            <label className="label">
                                                <span className="label-text-alt text-slate-500">
                                                    Email cannot be changed
                                                </span>
                                            </label>
                                        </div>
                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text font-bold">Role</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="input input-bordered rounded-xl bg-slate-100 dark:bg-slate-800 capitalize"
                                                value={role}
                                                disabled
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="btn btn-primary rounded-xl mt-6"
                                    >
                                        <Save className="w-5 h-5 mr-2" />
                                        {isLoading ? "Saving..." : "Save Changes"}
                                    </button>
                                </form>
                            )}

                            {activeTab === "password" && (
                                <form onSubmit={handlePasswordChange}>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                        <Lock className="w-5 h-5 text-blue-500" />
                                        Change Password
                                    </h2>
                                    <div className="space-y-4">
                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text font-bold">Current Password</span>
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    className="input input-bordered rounded-xl w-full pr-10"
                                                    value={passwordData.currentPassword}
                                                    onChange={(e) =>
                                                        setPasswordData({ ...passwordData, currentPassword: e.target.value })
                                                    }
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                                >
                                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text font-bold">New Password</span>
                                            </label>
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                className="input input-bordered rounded-xl"
                                                value={passwordData.newPassword}
                                                onChange={(e) =>
                                                    setPasswordData({ ...passwordData, newPassword: e.target.value })
                                                }
                                                required
                                                minLength={6}
                                            />
                                        </div>
                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text font-bold">Confirm New Password</span>
                                            </label>
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                className="input input-bordered rounded-xl"
                                                value={passwordData.confirmPassword}
                                                onChange={(e) =>
                                                    setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                                                }
                                                required
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="btn btn-primary rounded-xl mt-6"
                                    >
                                        <Lock className="w-5 h-5 mr-2" />
                                        {isLoading ? "Changing..." : "Change Password"}
                                    </button>
                                </form>
                            )}

                            {activeTab === "notifications" && (
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                        <Bell className="w-5 h-5 text-blue-500" />
                                        Notification Preferences
                                    </h2>
                                    <div className="space-y-4">
                                        {[
                                            { key: "emailQuizResults", label: "Email Quiz Results", desc: "Receive email when quiz is graded" },
                                            { key: "emailCourseUpdates", label: "Course Updates", desc: "Get notified about course changes" },
                                            { key: "pushNewGrades", label: "Grade Notifications", desc: "Push notifications for new grades" },
                                            { key: "pushNewMessages", label: "Message Notifications", desc: "Push notifications for new messages" },
                                        ].map((item) => (
                                            <div key={item.key} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-base-300/50 rounded-xl">
                                                <div>
                                                    <p className="font-medium text-slate-900 dark:text-white">{item.label}</p>
                                                    <p className="text-sm text-slate-500">{item.desc}</p>
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    className="toggle toggle-primary"
                                                    checked={notifications[item.key]}
                                                    onChange={(e) =>
                                                        setNotifications({ ...notifications, [item.key]: e.target.checked })
                                                    }
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        className="btn btn-primary rounded-xl mt-6"
                                        onClick={() => toast.success("Preferences saved")}
                                    >
                                        <Save className="w-5 h-5 mr-2" />
                                        Save Preferences
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </PageWrapper>
    );
}

export default SettingsPage;