import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button, Container, Spinner, Alert, Row, Col, Form, Modal } from 'react-bootstrap';
import './checkinPage.css';
import useTicket from '../../services/ticket';
import HistoryTable from './HistoryTable';
import StationService from '../../services/stationService';

const CheckinPage = () => {
  const { ticketId } = useParams();
  const [ticket, setTicket] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [reloadTrigger, setReloadTrigger] = useState(0);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');
  const { getTicketById, checkInTicket, checkOutTicket } = useTicket();
  const [stations, setStations] = useState([]);
  const [selectedStationId, setSelectedStationId] = useState('');

  const fetchStations = async () => {
    try {
    const response = await StationService.getAllStations()
    setStations(response.data);
    console.log("stations checkin page:", response.data);
  } catch (error) {
    console.error('Failed to fetch stations:', error);
  }
  }

  useEffect(() => {
    setLoading(true);
    setError(null);
    // Fetch stations
    fetchStations();
    setTimeout(() => {
      if (ticketId) {
        fetchTicket();
      } else {
        setError('Không tìm thấy mã vé.');
      }
      setLoading(false);
    }, 600);
  }, []);

  const fetchTicket = async () => {
    const ticket = await getTicketById(ticketId);
    console.log("ticket checkin page:", ticket);
    setTicket(ticket);
  };

  const handleAction = async (type) => {
    setActionLoading(true);
    setActionError(null);
    setSuccessMsg(null);
    setTimeout(async () => {
      if (!ticket) {
        setErrorModalMessage('Không có thông tin vé.');
        setShowErrorModal(true);
        setActionLoading(false);
        return;
      }
      if (!selectedStationId) {
        setErrorModalMessage('Vui lòng chọn ga.');
        setShowErrorModal(true);
        setActionLoading(false);
        return;
      }
      try {
        const actionMap = {
          checkin: {
            fn: checkInTicket,
            successMsg: 'Check-in thành công!'
          },
          checkout: {
            fn: checkOutTicket,
            successMsg: 'Check-out thành công!'
          }
        };
        const action = actionMap[type];
        if (!action) throw new Error('Hành động không hợp lệ.');
        const response = await action.fn({ ticketId: +ticketId, stationId: +selectedStationId });
        if (response && response.status && response.status !== 200) {
          const errorMessage = response.message || 'Có lỗi xảy ra khi thực hiện thao tác.';
          setErrorModalMessage(errorMessage);
          setShowErrorModal(true);
        } else {
          setSuccessMsg(action.successMsg);
          // Reload ticket data and trigger history reload
          await fetchTicket();
          setReloadTrigger(prev => prev + 1);
        }
      } catch (error) {
        const apiMsg = error?.response?.data?.message || error?.message || 'Có lỗi xảy ra khi thực hiện thao tác.';
        setErrorModalMessage(apiMsg);
        setShowErrorModal(true);
        setSuccessMsg(null);
        console.error('Error:', error);
      }
      setActionLoading(false);
    }, 600);
  };

  if (loading) {
    return (
      <Container className="text-center py-5 checkin-container">
        <Spinner animation="border" />
        <p>Đang tải thông tin vé...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5 checkin-container">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container className="py-5 checkin-container">
      <Row className="g-4 checkin-row-equal align-items-start">
        {/* Left Column - Check-in Card */}
        <Col lg={5} md={12}>
          <div className="checkin-card">
            <h2 className="mb-4 text-center checkin-title">Check-in Vé</h2>
            <div className="ticket-info-card">
              <div className="ticket-info-header">
                <div className="ticket-id-badge">#{ticketId}</div>
                <span className={`status-badge status-${ticket.ticketStatus === "EXPIRED" ? 'expired' : ticket.ticketStatus === "CANCELLED" ? 'cancelled' : (ticket.isCheckIn ? 'checked-in' : 'available')}`}>
                  {ticket.ticketStatus === "EXPIRED" ? 'Hết hạn' : ticket.ticketStatus === "CANCELLED" ? 'Đã hủy' : (ticket.isCheckIn ? 'Đã check-in' : 'Chưa check-in')}
                </span>
              </div>
              
              <div className="ticket-info-grid">
                <div className="info-item">
                  <div className="info-label">Ngày mua</div>
                  <div className="info-value">{new Date(ticket.purchaseTime).toLocaleString()}</div>
                </div>
                
                
                {ticket.departureStation && (
                  <div className="info-item">
                    <div className="info-label">Ga đi</div>
                    <div className="info-value">{ticket.departureStation}</div>
                  </div>
                )}
                
                {ticket.arrivalStation && (
                  <div className="info-item">
                    <div className="info-label">Ga đến</div>
                    <div className="info-value">{ticket.arrivalStation}</div>
                  </div>
                )}
                
                {ticket.routeName && (
                  <div className="info-item">
                    <div className="info-label">Tuyến</div>
                    <div className="info-value">{ticket.routeName}</div>
                  </div>
                )}
                
                <div className="info-item">
                  <div className="info-label">Loại vé</div>
                  <div className="info-value">{ticket.ticketName}</div>
                </div>
              </div>
            </div>
            
            <div className="station-select-container">
              <Form.Label>Chọn ga</Form.Label>
              <Form.Select
                value={selectedStationId}
                onChange={e => setSelectedStationId(e.target.value)}
                disabled={stations.length === 0}
              >
                <option value="">Chọn ga...</option>
                {stations.map(station => (
                  <option key={station.stationId} value={station.stationId}>
                    {station.stationName}
                  </option>
                ))}
              </Form.Select>
            </div>
            {successMsg && <Alert variant="success">{successMsg}</Alert>}
            <div className="d-flex justify-content-center gap-4 checkin-btn-group">

              {/* Kiểm tra vé hết hạn hoặc đã hủy trước tiên */}
              {(ticket.ticketStatus === "EXPIRED" || ticket.ticketStatus === "CANCELLED") && (
                <Button
                  className="checkin-btn"
                  size="lg"
                  variant="danger"
                  disabled={true}
                >
                  {ticket.ticketStatus === "EXPIRED" ? 'Vé đã hết hạn' : 'Vé đã hủy'}
                </Button>
              )}

              {/* Chỉ hiển thị các nút khác khi vé chưa hết hạn và chưa hủy */}
              {ticket.ticketStatus !== "EXPIRED" && ticket.ticketStatus !== "CANCELLED" && (
                <>
                  {ticket.isCheckIn === false && (
                    <Button
                      className="checkin-btn"
                      size="lg"
                      variant="success"
                      onClick={() => handleAction('checkin')}
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <>
                          <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> Đang check-in...
                        </>
                      ) : 'Check-in'}
                    </Button>
                  )}

                  {ticket.isCheckIn === true && (
                    <Button
                      className="checkin-btn"
                      size="lg"
                      variant="warning"
                      onClick={() => handleAction('checkout')}
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <>
                          <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> Đang check-out...
                        </>
                      ) : 'Check-out'}
                    </Button>
                  )}
                </>
              )}
              
            </div>
          </div>
        </Col>

        {/* Right Column - History Table */}
        <Col lg={7} md={12}>
          <HistoryTable ticketId={ticketId} reloadTrigger={reloadTrigger} />
        </Col>
      </Row>

      {/* Error Modal */}
      <Modal show={showErrorModal} onHide={() => setShowErrorModal(false)} centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="text-danger">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            Lỗi
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-4">
          <div className="text-center">
            <div className="mb-3">
              <i className="bi bi-x-circle-fill text-danger" style={{ fontSize: '3rem' }}></i>
            </div>
            <p className="mb-0">{errorModalMessage}</p>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0 justify-content-center">
          <Button 
            variant="secondary" 
            onClick={() => setShowErrorModal(false)}
            className="px-4"
          >
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default CheckinPage; 