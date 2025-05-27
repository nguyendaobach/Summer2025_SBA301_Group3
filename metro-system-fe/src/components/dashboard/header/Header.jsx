import React, { useState } from 'react';
import { Navbar, Container, Form, FormControl, Nav, Dropdown, Image } from 'react-bootstrap';

const user = {
  name: "Sofia Rivers",
  email: "sofia.rivers@devias.io",
  avatar: "https://randomuser.me/api/portraits/women/44.jpg" // Thay bằng avatar của bạn
};

const Header = () => {
  return (
    <Navbar bg="light" expand="lg"  className="border-bottom" style={{ minHeight: 60 }}>
      <Container fluid>
        <Form className="d-flex flex-grow-1 me-3">
          <FormControl
            type="search"
            placeholder="Search"
            className="me-2"
            aria-label="Search"
            style={{ background: "#f5f5f5" }}
          />
        </Form>
        <Nav className="align-items-center">
          <Nav.Link>
            <i className="bi bi-people" style={{ fontSize: 20 }}></i>
          </Nav.Link>
          <Nav.Link>
            <i className="bi bi-bell" style={{ fontSize: 20 }}></i>
          </Nav.Link>
          <Dropdown align="end">
            <Dropdown.Toggle as="span" style={{ cursor: "pointer" }}>
              <Image src={user.avatar} roundedCircle width={40} height={40} />
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <div className="px-3 py-2">
                <div className="fw-bold">{user.name}</div>
                <div className="text-muted" style={{ fontSize: 13 }}>{user.email}</div>
              </div>
              <Dropdown.Divider />
              <Dropdown.Item>Settings</Dropdown.Item>
              <Dropdown.Item>Profile</Dropdown.Item>
              <Dropdown.Item>Sign out</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </Nav>
      </Container>
    </Navbar>
  );
}
export default Header;