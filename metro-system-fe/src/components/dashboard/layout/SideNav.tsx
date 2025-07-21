import React from 'react';
import { Nav } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import { House, People, Gear, Person, ExclamationTriangle, Puzzle } from 'react-bootstrap-icons';
import 'bootstrap/dist/css/bootstrap.min.css';

const navItems = [
  { to: '', icon: <House className="me-2" />, label: 'Overview' },
  { to: 'customers', icon: <People className="me-2" />, label: 'Quản lí tài khoản' },
  { to: 'stations', icon: <Gear className="me-2" />, label: 'Quản lí trạm' },
  { to: 'routes', icon: <Person className="me-2" />, label: 'Quản lí tuyến đường' },
  { to: 'ticket-rule', icon: <ExclamationTriangle className="me-2" />, label: 'Quản lí quy định vé' },
  { to: 'trains', icon: <Gear className="me-2" />, label: 'Quản lí tàu' },
  { to: 'promotions', icon: <Puzzle className="me-2" />, label: 'Quản lí khuyến mãi' },
  { to: 'ticket-type', icon: <ExclamationTriangle className="me-2" />, label: 'Quản lí loại vé' },
];

const SideNav = () => {
  return (
    <div style={{ minWidth: 250, background: '#fff', height: '100vh', boxShadow: '2px 0 8px rgba(0,0,0,0.03)' }} className="d-flex flex-column p-3">
      <div className="mb-4 fw-bold fs-4 text-dark" style={{ letterSpacing: 1 }}>
        Admin Panel
      </div>
      <Nav className="flex-column w-100">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `d-flex align-items-center mb-2 nav-link px-3 py-2 rounded fw-medium ${isActive ? 'active-link' : 'text-dark'}`
            }
            style={{ textDecoration: 'none', fontSize: 16 }}
            end
          >
            {item.icon} {item.label}
          </NavLink>
        ))}
      </Nav>
      <style>{`
        .active-link {
          background: #4f46e5;
          color: #fff !important;
        }
        .nav-link:hover:not(.active-link) {
          background: #f0f0f0;
          color: #222 !important;
        }
      `}</style>
    </div>
  );
};

export default SideNav;
