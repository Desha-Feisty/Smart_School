import { useOutletContext } from "react-router-dom";
import { AdminOverviewContent } from "./AdminLayout";

function AdminOverview() {
    const context = useOutletContext() || {};
    
    return (
        <AdminOverviewContent 
            stats={context.stats || {}}
            systemHealth={context.systemHealth}
            healthLoading={context.healthLoading}
            fetchSystemHealth={context.fetchSystemHealth}
        />
    );
}

export default AdminOverview;