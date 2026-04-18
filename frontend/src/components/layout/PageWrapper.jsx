export default function PageWrapper({ children }) {
    return (
        <div className="page-bg relative overflow-x-hidden min-h-screen flex flex-col">
            {/* Background elements */}
            <div className="fixed inset-0 z-0 pointer-events-none w-screen h-screen">
                <div className="absolute inset-0 mesh-bg-light" />
                <div className="absolute inset-0 mesh-bg-dark" />
            </div>
            
            {/* Main Content */}
            <div className="relative z-10 flex-1 flex flex-col">
                {children}
            </div>
        </div>
    );
}
