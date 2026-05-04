import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import useAuthStore from "../stores/Authstore";
import { 
    Users, 
    BookOpen, 
    Plus, 
    Trash2, 
    TrendingUp, 
    Shield, 
    Activity, 
    Search, 
    Filter,
    ChevronRight,
    UserPlus,
    X,
    BarChart3,
    PieChart,
    ArrowUpRight,
    FileText,
    Download,
    Server,
    Clock,
    AlertCircle,
    CheckCircle,
    RefreshCw
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import PageWrapper from "../components/layout/PageWrapper";
import Navbar from "../components/layout/Navbar";
import toast from "react-hot-toast";

function AdminDashboard() {
    const { token } = useAuthStore();
    const [activeTab, setActiveTab] = useState("overview");
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalCourses: 0,
        totalQuizzes: 0,
        completedAttempts: 0
    });
    const [courseAnalytics, setCourseAnalytics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [isAddUserOpen, setIsAddUserOpen] = useState(false);
    const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "student" });
    
    // Logs tab state
    const [logs, setLogs] = useState([]);
    const [logsLoading, setLogsLoading] = useState(false);
    const [logsTotal, setLogsTotal] = useState(0);
    const [logPage, setLogPage] = useState(1);
    const [logActionFilter, setLogActionFilter] = useState("");
    const [logDateFrom, setLogDateFrom] = useState("");
    const [logDateTo, setLogDateTo] = useState("");
    const [logStats, setLogStats] = useState(null);
    const [autoRefreshLogs, setAutoRefreshLogs] = useState(false);
    const [lastLogTimestamp, setLastLogTimestamp] = useState(null);
    const [systemHealth, setSystemHealth] = useState(null);
    const [healthLoading, setHealthLoading] = useState(false);
    
    // Refs for ALL values accessed inside interval callback (avoids stale closures)
    const autoRefreshRef = useRef(false);
    const activeTabRef = useRef("overview");
    const lastLogTimestampRef = useRef(null);
    const tokenRef = useRef(null);
    const logPageRef = useRef(1);
    const logActionFilterRef = useRef("");
    const logDateFromRef = useRef("");
    const logDateToRef = useRef("");

    // Keep refs in sync with state
    useEffect(() => { autoRefreshRef.current = autoRefreshLogs; }, [autoRefreshLogs]);
    useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);
    useEffect(() => { lastLogTimestampRef.current = lastLogTimestamp; }, [lastLogTimestamp]);
    useEffect(() => { tokenRef.current = token; }, [token]);
    useEffect(() => { logPageRef.current = logPage; }, [logPage]);
    useEffect(() => { logActionFilterRef.current = logActionFilter; }, [logActionFilter]);
    useEffect(() => { logDateFromRef.current = logDateFrom; }, [logDateFrom]);
    useEffect(() => { logDateToRef.current = logDateTo; }, [logDateTo]);

    useEffect(() => {
        const fetchData = async () => {
            if (!token) return;
            setLoading(true);
            try {
                const [statsRes, usersRes, analyticsRes, healthRes] = await Promise.all([
                    axios.get("/api/admin/stats", { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get("/api/admin/users", { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get("/api/admin/analytics", { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get("/api/admin/system-health", { headers: { Authorization: `Bearer ${token}` } })
                ]);
                setStats(statsRes.data.stats);
                setUsers(usersRes.data.users);
                setCourseAnalytics(analyticsRes.data.courseAnalytics);
                setSystemHealth(healthRes.data);
            } catch (err) {
                console.error("Admin data fetch error:", err);
                toast.error("Failed to load dashboard data");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [token]);

    const handleDeleteUser = async (userId, name) => {
        if (!window.confirm(`Are you sure you want to delete user "${name}"? This action is permanent and will delete all their associated data.`)) return;
        
        try {
            await axios.delete(`/api/admin/users/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
            setUsers(users.filter(u => u._id !== userId));
            toast.success("User deleted successfully");
        } catch (err) {
            toast.error("Failed to delete user");
        }
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post("/api/admin/users", newUser, { headers: { Authorization: `Bearer ${token}` } });
            setUsers([res.data.user, ...users]);
            setIsAddUserOpen(false);
            setNewUser({ name: "", email: "", password: "", role: "student" });
            toast.success("User created successfully");
        } catch (err) {
            toast.error(err.response?.data?.errMsg || "Failed to create user");
        }
    };

    const fetchLogs = async () => {
        setLogsLoading(true);
        try {
            const params = new URLSearchParams();
            params.append("page", logPageRef.current);
            params.append("limit", "20");
            if (logActionFilterRef.current) params.append("action", logActionFilterRef.current);
            if (logDateFromRef.current) params.append("startDate", logDateFromRef.current);
            if (logDateToRef.current) params.append("endDate", logDateToRef.current);
            
            const res = await axios.get(`/api/admin/logs?${params}`, { headers: { Authorization: `Bearer ${token}` } });
            setLogs(res.data.logs);
            setLogsTotal(res.data.total);
        } catch (err) {
            console.error("Failed to fetch logs:", err);
            toast.error("Failed to fetch logs");
        } finally {
            setLogsLoading(false);
        }
    };

    const fetchLogStats = async () => {
        try {
            const res = await axios.get("/api/admin/logs/stats?days=30", { headers: { Authorization: `Bearer ${token}` } });
            setLogStats(res.data);
        } catch (err) {
            console.error("Failed to fetch log stats:", err);
        }
    };

    // Poll for new data only — uses refs for all params to avoid stale closures
    const pollForNewLogs = useCallback(async () => {
        try {
            const currentToken = tokenRef.current;
            if (!currentToken) return;

            const timestampRes = await axios.get("/api/admin/logs/latest", {
                headers: { Authorization: `Bearer ${currentToken}` },
            });
            const latestTimestamp = timestampRes.data.latestTimestamp;

            if (!latestTimestamp || latestTimestamp === lastLogTimestampRef.current) {
                return; // No new data
            }

            // New data available — fetch it
            setLastLogTimestamp(latestTimestamp);

            // Build params from refs (all params accessed via refs)
            const params = new URLSearchParams();
            params.append("page", logPageRef.current);
            params.append("limit", "20");
            if (logActionFilterRef.current) params.append("action", logActionFilterRef.current);
            if (logDateFromRef.current) params.append("startDate", logDateFromRef.current);
            if (logDateToRef.current) params.append("endDate", logDateToRef.current);

            const [logsRes, statsRes] = await Promise.all([
                axios.get(`/api/admin/logs?${params}`, {
                    headers: { Authorization: `Bearer ${currentToken}` },
                }),
                axios.get("/api/admin/logs/stats?days=30", {
                    headers: { Authorization: `Bearer ${currentToken}` },
                }),
            ]);
            setLogs(logsRes.data.logs);
            setLogsTotal(logsRes.data.total);
            setLogStats(statsRes.data);
        } catch (err) {
            console.error("Poll error:", err);
        }
    }, []); // No dependencies needed - all values come from refs

    const fetchSystemHealth = async () => {
        setHealthLoading(true);
        try {
            const res = await axios.get("/api/admin/system-health", { headers: { Authorization: `Bearer ${token}` } });
            setSystemHealth(res.data);
        } catch (err) {
            console.error("Failed to fetch system health:", err);
            toast.error("Failed to fetch system health");
        } finally {
            setHealthLoading(false);
        }
    };

    const exportLogs = async () => {
        if (!logDateFrom || !logDateTo) {
            toast.error("Please select date range for export");
            return;
        }
        try {
            const res = await axios.get(`/api/admin/logs/export?startDate=${logDateFrom}&endDate=${logDateTo}`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: "blob",
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `activity-logs-${logDateFrom}-${logDateTo}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success("Logs exported successfully");
        } catch (err) {
            toast.error("Failed to export logs");
        }
    };

    useEffect(() => {
        if (activeTab === "logs") {
            fetchLogs();
            fetchLogStats();
            fetchSystemHealth();
            // Initialize latest timestamp tracking
            (async () => {
                try {
                    const timestampRes = await axios.get("/api/admin/logs/latest", { headers: { Authorization: `Bearer ${token}` } });
                    setLastLogTimestamp(timestampRes.data.latestTimestamp);
                } catch (err) {
                    console.error("Failed to get initial timestamp:", err);
                }
            })();
        }
    }, [activeTab, token]);

    // Auto-refresh logs — uses refs for stable interval lifecycle
    useEffect(() => {
        if (!autoRefreshRef.current || activeTabRef.current !== "logs") {
            return;
        }

        const interval = setInterval(() => {
            pollForNewLogs();
        }, 5000);

        return () => clearInterval(interval);
    }, [autoRefreshLogs, activeTab, pollForNewLogs]);

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             u.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === "all" || u.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    if (loading) {
        return (
            <PageWrapper>
                <Navbar />
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <span className="loading loading-spinner loading-lg text-blue-600"></span>
                    <p className="mt-4 text-slate-500 font-medium">Initializing Management Portal...</p>
                </div>
            </PageWrapper>
        );
    }

    return (
        <PageWrapper>
            <Navbar />
            <main className="max-w-7xl mx-auto px-6 py-8 w-full animate-in fade-in duration-500">
                
                {/* Header Area */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-sm mb-1 uppercase tracking-wider">
                            <Shield className="w-4 h-4" />
                            Admin Control Portal
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                            System Management
                        </h1>
                    </div>
                    <div className="flex gap-2 bg-slate-200/50 dark:bg-base-300/50 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700/50">
                        {[
                            { id: "overview", label: "Overview", icon: BarChart3 },
                            { id: "users", label: "Users", icon: Users },
                            { id: "analytics", label: "Analytics", icon: TrendingUp },
                            { id: "logs", label: "Logs", icon: FileText },
                        ].map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                onClick={() => setActiveTab(id)}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all duration-300 ${
                                    activeTab === id
                                        ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-md scale-105"
                                        : "text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700/50"
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {activeTab === "overview" && (
                    <div className="space-y-8">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { label: "Total Users", value: stats.totalUsers, icon: Users, color: "blue" },
                                { label: "Total Courses", value: stats.totalCourses, icon: BookOpen, color: "emerald" },
                                { label: "Total Quizzes", value: stats.totalQuizzes, icon: Activity, color: "amber" },
                                { label: "Quizzes Solved", value: stats.completedAttempts, icon: PieChart, color: "purple" },
                            ].map((stat, i) => (
                                <div key={i} className={`glass-panel border-l-4 border-l-${stat.color}-500 p-6 relative overflow-hidden group`}>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={`p-3 bg-${stat.color}-500/10 rounded-2xl group-hover:scale-110 transition-transform`}>
                                            <stat.icon className={`w-6 h-6 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                                        </div>
                                        <ArrowUpRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                                    </div>
                                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">{stat.label}</h3>
                                    <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">{stat.value}</div>
                                </div>
                            ))}
                        </div>

                        {/* Recent Activity / Secondary Stats */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="glass-panel p-6">
                                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-blue-500" />
                                    Platform Pulse
                                </h3>
                                <div className="space-y-4">
                                    <div className="p-4 bg-slate-50 dark:bg-base-300/50 rounded-2xl flex items-center justify-between">
                                        <span className="text-slate-600 dark:text-slate-400 font-medium">Average Student Performance</span>
                                        <span className="font-bold text-emerald-500">76.4%</span>
                                    </div>
                                    <div className="p-4 bg-slate-50 dark:bg-base-300/50 rounded-2xl flex items-center justify-between">
                                        <span className="text-slate-600 dark:text-slate-400 font-medium">Participation Rate</span>
                                        <span className="font-bold text-blue-500">88%</span>
                                    </div>
                                    <div className="p-4 bg-slate-50 dark:bg-base-300/50 rounded-2xl flex items-center justify-between">
                                        <span className="text-slate-600 dark:text-slate-400 font-medium">New Signs (30d)</span>
                                        <span className="font-bold text-purple-500">+12</span>
                                    </div>
                                </div>
                            </div>
                            <div className="glass-panel p-6 flex flex-col justify-center items-center text-center space-y-4 bg-gradient-to-br from-blue-600/5 to-purple-600/5">
                                {systemHealth ? (
                                    <>
                                        <div className={`w-20 h-20 rounded-full flex items-center justify-center ${systemHealth.health.status === "healthy" ? "bg-emerald-100 dark:bg-emerald-900/40" : "bg-amber-100 dark:bg-amber-900/40"}`}>
                                            {systemHealth.health.status === "healthy" ? (
                                                <CheckCircle className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                                            ) : (
                                                <AlertCircle className="w-10 h-10 text-amber-600 dark:text-amber-400" />
                                            )}
                                        </div>
                                        <h4 className="text-xl font-black">
                                            System Status: {systemHealth.health.status === "healthy" ? "Operational" : "Degraded"}
                                        </h4>
                                        <p className="text-slate-500 dark:text-slate-400 max-w-sm">
                                            {systemHealth.health.status === "healthy" 
                                                ? `All core services are operational. ${systemHealth.health.errorsLast24h} errors in last 24h.`
                                                : `High error count detected (${systemHealth.health.errorsLast24h} in last 24h). Check logs.`
                                            }
                                        </p>
                                        <div className="w-full mt-4">
                                            <ResponsiveContainer width="100%" height={120}>
                                                <LineChart data={systemHealth.activityTrend || []}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                                                    <YAxis tick={{ fontSize: 10 }} />
                                                    <Tooltip />
                                                    <Line type="monotone" dataKey="logs" stroke="#3b82f6" strokeWidth={2} dot={false} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center">
                                            <Shield className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <h4 className="text-xl font-black">Loading...</h4>
                                        <p className="text-slate-500 dark:text-slate-400 max-w-sm">Fetching system status...</p>
                                    </>
                                )}
                                <button onClick={() => setActiveTab("users")} className="btn btn-primary rounded-xl px-12 mt-4 shadow-lg shadow-blue-500/30"> Manage Users </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "users" && (
                    <div className="space-y-6">
                        {/* Search and Action Bar */}
                        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between glass-panel p-4">
                            <div className="flex flex-1 gap-4 w-full">
                                <div className="relative flex-1">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input 
                                        type="text" 
                                        placeholder="Search by name or email..." 
                                        className="input input-bordered w-full pl-12 bg-white/50 dark:bg-base-300/50 rounded-xl focus:ring-2 focus:ring-blue-500/50"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="relative min-w-[200px]">
                                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <select 
                                        className="select select-bordered w-full pl-10 bg-white/50 dark:bg-base-300/50 rounded-xl"
                                        value={roleFilter}
                                        onChange={(e) => setRoleFilter(e.target.value)}
                                    >
                                        <option value="all">All Roles</option>
                                        <option value="student">Students</option>
                                        <option value="teacher">Teachers</option>
                                        <option value="admin">Admins</option>
                                    </select>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsAddUserOpen(true)}
                                className="btn btn-primary rounded-xl px-6 w-full lg:w-auto"
                            >
                                <UserPlus className="w-5 h-5 mr-2" />
                                Add User
                            </button>
                        </div>

                        {/* Users Table */}
                        <div className="glass-panel overflow-hidden border border-slate-200 dark:border-slate-700/50">
                            <div className="overflow-x-auto">
                                <table className="table w-full">
                                    <thead className="bg-slate-50 dark:bg-base-300 text-slate-500 uppercase text-[11px] font-black tracking-widest border-b border-slate-100 dark:border-slate-800">
                                        <tr>
                                            <th className="px-6 py-4">User</th>
                                            <th className="px-6 py-4">Role</th>
                                            <th className="px-6 py-4">Joined Date</th>
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {filteredUsers.map((user) => (
                                            <tr key={user._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center font-black text-blue-600">
                                                            {user.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-slate-900 dark:text-white">{user.name}</div>
                                                            <div className="text-xs text-slate-500">{user.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`badge badge-sm py-3 px-3 border-none font-bold uppercase text-[10px] ${
                                                        user.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                                                        user.role === 'teacher' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                        'bg-slate-100 text-slate-700 dark:bg-slate-700/50 dark:text-slate-400'
                                                    }`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-500">
                                                    {new Date(user.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                                                </td>
                                                <td className="px-6 py-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={() => handleDeleteUser(user._id, user.name)}
                                                        className="btn btn-ghost btn-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                                                        disabled={user.role === 'admin'}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "analytics" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {courseAnalytics.map((course) => (
                            <div key={course.id} className="glass-panel overflow-hidden group hover:scale-[1.01] transition-all">
                                <div className="h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">{course.title}</h3>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                                                <Users className="w-3.5 h-3.5" />
                                                {course.teacher}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{course.avgScore}%</div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase">Avg Score</div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 border-t border-slate-100 dark:border-slate-800 pt-5 mt-4">
                                        <div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Students</div>
                                            <div className="font-bold text-slate-900 dark:text-white">{course.studentCount}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Quizzes</div>
                                            <div className="font-bold text-slate-900 dark:text-white">{course.quizCount}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Attempts</div>
                                            <div className="font-bold text-slate-900 dark:text-white">{course.participation}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            {activeTab === "logs" && (
                    <div className="space-y-6">
                        {/* System Health Panel */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 glass-panel p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                        <Server className="w-5 h-5 text-blue-500" />
                                        System Health
                                    </h3>
                                    <button onClick={fetchSystemHealth} className="btn btn-ghost btn-sm btn-circle">
                                        <RefreshCw className={`w-4 h-4 ${healthLoading ? "animate-spin" : ""}`} />
                                    </button>
                                </div>
                                {healthLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <span className="loading loading-spinner loading-md text-blue-500"></span>
                                    </div>
                                ) : systemHealth ? (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="p-4 bg-slate-50 dark:bg-base-300/50 rounded-xl">
                                            <div className="text-xs text-slate-500 mb-1">Status</div>
                                            <div className={`font-bold ${systemHealth.health.status === "healthy" ? "text-emerald-500" : "text-amber-500"} flex items-center gap-1`}>
                                                {systemHealth.health.status === "healthy" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                                {systemHealth.health.status === "healthy" ? "Healthy" : "Warning"}
                                            </div>
                                        </div>
                                        <div className="p-4 bg-slate-50 dark:bg-base-300/50 rounded-xl">
                                            <div className="text-xs text-slate-500 mb-1">Uptime</div>
                                            <div className="font-bold text-slate-900 dark:text-white">{systemHealth.system.uptime}</div>
                                        </div>
                                        <div className="p-4 bg-slate-50 dark:bg-base-300/50 rounded-xl">
                                            <div className="text-xs text-slate-500 mb-1">Memory (Heap)</div>
                                            <div className="font-bold text-slate-900 dark:text-white">{systemHealth.system.memory.heapUsed} / {systemHealth.system.memory.heapTotal}</div>
                                        </div>
                                        <div className="p-4 bg-slate-50 dark:bg-base-300/50 rounded-xl">
                                            <div className="text-xs text-slate-500 mb-1">CPU Load (1m)</div>
                                            <div className="font-bold text-slate-900 dark:text-white">{systemHealth.system.cpuLoad["1min"]}</div>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-slate-500">Loading system health...</p>
                                )}
                            </div>
                            
                            {/* Log Stats */}
                            <div className="glass-panel p-6">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-purple-500" />
                                    Activity (30d)
                                </h3>
                                {logStats ? (
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-slate-500">Total Events</span>
                                            <span className="font-bold text-slate-900 dark:text-white">{logStats.totalLogs}</span>
                                        </div>
                                        {Object.entries(logStats.actionCounts).slice(0, 5).map(([action, count]) => (
                                            <div key={action} className="flex justify-between items-center">
                                                <span className="text-xs text-slate-500 capitalize">{action.replace(/_/g, " ")}</span>
                                                <span className="font-bold text-slate-900 dark:text-white">{count}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-slate-500 text-sm">Loading stats...</p>
                                )}
                            </div>
                        </div>
                        
                        {/* Filters */}
                        <div className="glass-panel p-4">
                            <div className="flex flex-wrap gap-4 items-center">
                                <div className="flex-1 min-w-[200px]">
                                    <select 
                                        className="select select-bordered w-full bg-white/50 dark:bg-base-300/50 rounded-xl"
                                        value={logActionFilter}
                                        onChange={(e) => { setLogActionFilter(e.target.value); setLogPage(1); }}
                                    >
                                        <option value="">All Actions</option>
                                        <option value="user_login">User Login</option>
                                        <option value="user_logout">User Logout</option>
                                        <option value="user_created">User Created</option>
                                        <option value="quiz_created">Quiz Created</option>
                                        <option value="quiz_published">Quiz Published</option>
                                        <option value="quiz_submitted">Quiz Submitted</option>
                                        <option value="quiz_graded">Quiz Graded</option>
                                        <option value="course_created">Course Created</option>
                                        <option value="course_enrolled">Course Enrolled</option>
                                    </select>
                                </div>
                                <div className="flex gap-2 items-center">
                                    <input 
                                        type="date" 
                                        className="input input-bordered bg-white/50 dark:bg-base-300/50 rounded-xl"
                                        value={logDateFrom}
                                        onChange={(e) => { setLogDateFrom(e.target.value); setLogPage(1); }}
                                    />
                                    <span className="text-slate-500">to</span>
                                    <input 
                                        type="date" 
                                        className="input input-bordered bg-white/50 dark:bg-base-300/50 rounded-xl"
                                        value={logDateTo}
                                        onChange={(e) => { setLogDateTo(e.target.value); setLogPage(1); }}
                                    />
                                </div>
                                <button 
                                    onClick={exportLogs}
                                    className="btn btn-outline border-slate-200 dark:border-slate-700 rounded-xl"
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Export CSV
                                </button>
                                <button 
                                    onClick={() => setAutoRefreshLogs(!autoRefreshLogs)}
                                    className={`btn rounded-xl ${autoRefreshLogs ? "btn-primary" : "btn-outline border-slate-200 dark:border-slate-700"}`}
                                >
                                    <RefreshCw className={`w-4 h-4 mr-2 ${autoRefreshLogs ? "animate-spin" : ""}`} />
                                    {autoRefreshLogs ? "Auto-refresh On" : "Auto-refresh Off"}
                                </button>
                            </div>
                        </div>
                        
                        {/* Logs Table */}
                        <div className="glass-panel overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="table w-full">
                                    <thead className="bg-slate-50 dark:bg-base-300 text-slate-500 uppercase text-[11px] font-black tracking-widest">
                                        <tr>
                                            <th className="px-4 py-3">Timestamp</th>
                                            <th className="px-4 py-3">User</th>
                                            <th className="px-4 py-3">Action</th>
                                            <th className="px-4 py-3">Details</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {logsLoading ? (
                                            <tr>
                                                <td colSpan="4" className="px-4 py-8 text-center">
                                                    <span className="loading loading-spinner loading-md text-blue-500"></span>
                                                </td>
                                            </tr>
                                        ) : logs.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" className="px-4 py-8 text-center text-slate-500">
                                                    No activity logs found
                                                </td>
                                            </tr>
                                        ) : (
                                            logs.map((log) => (
                                                <tr key={log._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                                                            <Clock className="w-3.5 h-3.5" />
                                                            {new Date(log.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {log.user ? (
                                                            <span className="text-sm font-medium text-slate-900 dark:text-white">
                                                                {log.user.name}
                                                            </span>
                                                        ) : (
                                                            <span className="text-sm text-slate-400">System</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="badge badge-sm bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-none capitalize">
                                                            {log.action.replace(/_/g, " ")}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 max-w-md truncate">
                                                        {log.details}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            
                            {/* Pagination */}
                            {logsTotal > 20 && (
                                <div className="flex justify-center items-center gap-2 p-4 border-t border-slate-100 dark:border-slate-800">
                                    <button 
                                        onClick={() => setLogPage(p => Math.max(1, p - 1))}
                                        disabled={logPage === 1}
                                        className="btn btn-sm btn-outline"
                                    >
                                        Previous
                                    </button>
                                    <span className="text-sm text-slate-500">
                                        Page {logPage} of {Math.ceil(logsTotal / 20)}
                                    </span>
                                    <button 
                                        onClick={() => setLogPage(p => p + 1)}
                                        disabled={logPage >= Math.ceil(logsTotal / 20)}
                                        className="btn btn-sm btn-outline"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Add User Modal */}
            {isAddUserOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="glass-panel w-full max-w-md p-8 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Create New Account</h2>
                            <button onClick={() => setIsAddUserOpen(false)} className="btn btn-ghost btn-circle btn-sm">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleAddUser} className="space-y-4">
                            <div className="form-control">
                                <label className="label-text font-bold mb-1 block">Full Name</label>
                                <input 
                                    type="text" 
                                    className="input input-bordered w-full rounded-xl"
                                    required
                                    value={newUser.name}
                                    onChange={e => setNewUser({...newUser, name: e.target.value})}
                                />
                            </div>
                            <div className="form-control">
                                <label className="label-text font-bold mb-1 block">Email Address</label>
                                <input 
                                    type="email" 
                                    className="input input-bordered w-full rounded-xl"
                                    required
                                    value={newUser.email}
                                    onChange={e => setNewUser({...newUser, email: e.target.value})}
                                />
                            </div>
                            <div className="form-control">
                                <label className="label-text font-bold mb-1 block">Initial Password</label>
                                <input 
                                    type="password" 
                                    className="input input-bordered w-full rounded-xl"
                                    required
                                    minLength={6}
                                    value={newUser.password}
                                    onChange={e => setNewUser({...newUser, password: e.target.value})}
                                />
                            </div>
                            <div className="form-control">
                                <label className="label-text font-bold mb-1 block">Role</label>
                                <div className="grid grid-cols-2 gap-2 mt-1">
                                    {['student', 'teacher'].map(role => (
                                        <button
                                            key={role}
                                            type="button"
                                            onClick={() => setNewUser({...newUser, role})}
                                            className={`p-3 rounded-xl border-2 transition-all font-bold capitalize ${
                                                newUser.role === role 
                                                ? 'border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-900/20' 
                                                : 'border-slate-100 bg-slate-50 text-slate-400 dark:bg-slate-800 dark:border-slate-700'
                                            }`}
                                        >
                                            {role}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <button type="submit" className="btn btn-primary w-full rounded-xl h-12 mt-6"> Create Account </button>
                        </form>
                    </div>
                </div>
            )}
            </main>
        </PageWrapper>
    );
}

export default AdminDashboard;
