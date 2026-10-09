import './NavBar.css';

type NavBarProps = {
    activePage: string;
    onNavigate: (page: string) => void;
};

function NavBar({ activePage, onNavigate }: NavBarProps) {
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: '▦' },
        { id: 'drivers', label: 'Driver Portal', icon: '♙' },
        { id: 'tracking', label: 'Track Shipment', icon: '◎' },
    ];

    return (
        <aside className= "sidebar" >
        <div className="brand" >
            <div className="brand-icon" > LF </div>
                < div >
                <h2>LogiFleet </h2>
                < span > DELIVERY MANAGEMENT </span>
                    </div>
                    </div>

                    < div className = "nav-section-label" > WORKSPACE </div>

                        < nav className = "nav-menu" >
                        {
                            menuItems.map((item) => (
                                <button
        key= { item.id }
        className = {`nav-item ${activePage === item.id ? 'active' : ''}`}
    onClick = {() => onNavigate(item.id)
}
      >
    <span className="nav-icon" > { item.icon } </span>
        < span > { item.label } </span>
        </button>
    ))}
</nav>

    < div className = "sidebar-footer" >
        <div className="status-dot" />
            <div>
            <strong>System Online </strong>
                < span > Fleet services </span>
                    </div>
                    </div>
                    </aside>

);
}

export default NavBar;