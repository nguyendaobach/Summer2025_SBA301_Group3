import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import SideNav from '../../components/dashboard/layout/SideNav';
import { Outlet } from 'react-router-dom';
import Header from '../../components/dashboard/header/Header';

const DashboardLayout = () => {
    return (
        <Container fluid className="p-0">
            <Row>
                <Col xs={0} md={3} lg={2} className="p-0">
                    <SideNav />
                </Col>
                <Col xs={12} md={9} lg={10} className="p-4" style={{ minHeight: '100vh', background: '#f8f9fa' }}>
                    <Header />
                    <Outlet />
                </Col>
            </Row>
        </Container>
    );
};

export default DashboardLayout;
