import { Navbar, Container, Button, Nav } from 'react-bootstrap';
import { FaHome } from 'react-icons/fa';
import { Link, NavLink } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';


const navItems = [
    { to: 'tickets', label: 'Tickets' },
    { to: 'stations', label: 'Stations' },
    { to: 'routes', label: 'Routes' },
  ];

const Header = () => {
    return (
        <Navbar bg="dark" variant="dark" expand="lg" className="py-3">
            <Container>
                <Link to="/" className="text-decoration-none text-white fw-bold">
                    <FaHome className="me-2" />
                    Metro Ticket System
                </Link>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        {navItems.map((item) => (
                            <NavLink 
                                key={item.to}
                                to={item.to} 
                                className={({ isActive }) => 
                                    `nav-link ${isActive ? 'text-primary' : 'text-white'} mx-2` 
                                }
                            >
                                {item.label}
                            </NavLink>
                        ))}
                    </Nav>
                    <div className="ms-auto">
                        <Button variant="outline-light" className="me-2">Login</Button>
                        <Button variant="primary">Sign Up</Button>
                    </div>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}

export default Header;