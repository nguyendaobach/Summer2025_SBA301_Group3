import React, { useState } from 'react';
import { Container, Row, Col, Card, Tabs, Tab } from 'react-bootstrap';
import './ticketSearchTool.css'; // file CSS bổ sung
import SingleTripForm from './SingleTripForm';
import TravelPassForm from './TravelPassForm';

const TicketSearchTool = () => {
  const eventKey = sessionStorage.getItem('eventKey');
  const [activeKey, setActiveKey] = useState(eventKey || 'singletrip');

  const handleTabSelect = (key) => {
    setActiveKey(key);
    sessionStorage.setItem('eventKey', key);
  };

  return (
    <div className="hero-container">
      <div className="content-wrapper">
        <Container fluid className="h-100">
          <Row className="h-100 align-items-center">
            {/* Nội dung bên trái */}
            <Col md={6} className="text-white ps-5">
              <h1 className="display-5 fw-bold">CHÀO MỪNG ĐẾN</h1>
              <h1 className="display-4 fw-bolder">HCMC METRO</h1>
              <p className="lead">
                Chúng tôi tiết kiệm thời gian của bạn khi mua vé, <br />
                check-in và trong suốt hành trình
              </p>
            </Col>

            {/* Form bên phải */}
            <Col md={5} className="offset-md-1">
              <Card className="p-4 form-card">
                <Tabs defaultActiveKey={activeKey} id="justify-tab-example" className="mb-3" onSelect={handleTabSelect}>
                  <Tab eventKey="singletrip" title="Vé một chiều" >
                    <SingleTripForm />
                  </Tab>
                  <Tab eventKey="travelpass" title="Vé tháng">
                    <TravelPassForm />
                  </Tab>
                </Tabs>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </div>
  );
};

export default TicketSearchTool;

