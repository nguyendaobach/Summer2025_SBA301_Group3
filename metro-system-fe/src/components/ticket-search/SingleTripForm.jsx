import { useState, useEffect, useContext } from 'react';
import { Form, InputGroup, Button, Accordion, Row, Col, Spinner, Modal } from 'react-bootstrap';
import { ArrowDownUp, Plus, Dash } from 'react-bootstrap-icons';
import './ticketSearchTool.css';
import { useNavigate, useLocation } from 'react-router-dom';
import StationService from '../../services/stationService';
import { TicketContext } from '../../pages/layout/TicketLayout';
import axiosInstance from '../../config/axios';

const SingleTripForm = ({ initialData, onSearch }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [showLoginModal, setShowLoginModal] = useState(false);
    
    // Check if we're on the tickets page and if context is available
    const isOnTicketsPage = location.pathname === '/tickets';
    const context = isOnTicketsPage ? useContext(TicketContext) : null;

    const initialForm = () => {
        const savedFormData = sessionStorage.getItem('ticketFormData');
        if (savedFormData) {
            try {
                return JSON.parse(savedFormData);
            } catch (error) {
                console.error('Error parsing saved form data:', error);
            }
        }
        return initialData || {
            fromStationId: '',
            fromStation: '',
            toStationId: '',
            toStation: '',
            ticketTypeId: '',
            numberOfTickets: 1,
        };
    };
    
    const [singleForm, setSingleForm] = useState(initialForm());

    // Update form when context changes (for tickets page)
    useEffect(() => {
        if (context?.singleForm && isOnTicketsPage) {
            setSingleForm(prev => ({
                ...prev,
                ...context.singleForm
            }));
        }
    }, [context?.singleForm, isOnTicketsPage]);

    const [stations, setStations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchAvailableTicketTypes = async () => {
        try {
            const response = await axiosInstance.get('/ticket-types/limit');
            // Set the first ticket type as default if available
            setSingleForm(prev => ({
                ...prev,
                ticketTypeId: response.data.data.ticketTypeId,
            }));
                
            
        } catch (error) {
            console.error('Error fetching available ticket types:', error);
        }
    };

    useEffect(() => {
        fetchAvailableTicketTypes();
        console.log("singleForm:", singleForm);
    }, []);

    // Fetch stations from API on component mount
    useEffect(() => {
        const fetchStations = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await StationService.getAllStations();
                
                if (response.data && Array.isArray(response.data)) {
                    setStations(response.data);
                } else {
                    throw new Error('Invalid station data format');
                }
            } catch (err) {
                console.error('Failed to fetch stations:', err);
                console.warn('Using fallback station data');
                
                // Use fallback static data with proper format conversion
                const fallbackStations = availableStations.map(station => ({
                    stationId: station.id,
                    stationName: station.name,
                    stationLocation: station.location,
                    address: `Station ${station.id} Address`,
                    openTime: "05:00",
                    closeTime: "23:00"
                }));
                
                setStations(fallbackStations);
                setError('Sử dụng dữ liệu ga offline. Một số tính năng có thể bị hạn chế.');
            } finally {
                setLoading(false);
            }
        };

        fetchStations();
    }, []);

    const handleRetryLoadStations = () => {
        const fetchStations = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await StationService.getAllStations();
                
                if (response.data && Array.isArray(response.data)) {
                    setStations(response.data);
                } else {
                    throw new Error('Invalid station data format');
                }
            } catch (err) {
                console.error('Failed to fetch stations:', err);
                setError('Không thể tải dữ liệu ga từ máy chủ. Sử dụng dữ liệu offline.');
                
                // Use fallback static data
                const fallbackStations = availableStations.map(station => ({
                    stationId: station.id,
                    stationName: station.name,
                    stationLocation: station.location,
                    address: `Station ${station.id} Address`,
                    openTime: "05:00",
                    closeTime: "23:00"
                }));
                
                setStations(fallbackStations);
            } finally {
                setLoading(false);
            }
        };

        fetchStations();
    };

    const updateForm = (newFormData) => {
        setSingleForm(newFormData);
        
        // Update context if on tickets page
        if (isOnTicketsPage && context?.setSingleForm) {
            context.setSingleForm(newFormData);
        }
    };

    const handleSwapStations = () => {
        const newForm = {
            ...singleForm,
            fromStationId: singleForm.toStationId,
            fromStation: singleForm.toStation,
            toStationId: singleForm.fromStationId,
            toStation: singleForm.fromStation
        };
        
        updateForm(newForm);
    };

    const handleSearch = () => {
        // Check if user is logged in
        const token = localStorage.getItem('token');
        if (!token) {
            // Show login modal if not logged in
            setShowLoginModal(true);
            return;
        }

        // Validate form before navigation/search
        if (!singleForm.fromStationId || !singleForm.toStationId) {
            setError('Vui lòng chọn cả ga đi và ga đến');
            return;
        }
        
        if (singleForm.fromStationId === singleForm.toStationId) {
            setError('Ga đi và ga đến không thể giống nhau');
            return;
        }

        // Clear any previous errors
        setError(null);
        
        // Clear saved form data from session storage since search is successful
        sessionStorage.removeItem('ticketFormData');
        sessionStorage.removeItem('eventKey');
        
        if (isOnTicketsPage) {
            // If we're on the tickets page, update context and trigger search
            if (context?.setSingleForm) {
                context.setSingleForm(singleForm);
            }
            // Use context's search handler if available
            if (context?.onFormSearch) {
                context.onFormSearch(singleForm);
            } else if (onSearch) {
                // Fallback to onSearch prop
                onSearch(singleForm);
            }
        } else {
            // If we're on home page, navigate to ticket layout with form data
            navigate('/tickets', { 
                state: { 
                    singleForm: singleForm 
                }
            });
        }
    };

    const handleLoginRedirect = () => {
        sessionStorage.setItem('ticketFormData', JSON.stringify(singleForm));
        sessionStorage.setItem('eventKey', 'singletrip');
        setShowLoginModal(false);
        navigate('/login');
    };

    return (
        <>
            <Form>
            {/* Error Message */}
            {error && (
                <div className="alert alert-warning mb-3 d-flex justify-content-between align-items-center" role="alert">
                    <span>{error}</span>
                    {error.includes('Không thể tải') && (
                        <Button variant="outline-primary" size="sm" onClick={handleRetryLoadStations}>
                            Thử lại
                        </Button>
                    )}
                </div>
            )}
            
            <Row>
                <Col md={8}>
                    {/* Chọn tuyến */}
                    <Form.Group className="mb-3">
                        <Form.Label>Tuyến</Form.Label>
                        <InputGroup>
                            <Form.Select
                                value={singleForm.fromStationId}
                                onChange={(e) => {
                                    const selectedOption = e.target.options[e.target.selectedIndex];
                                    updateForm({ 
                                        ...singleForm, 
                                        fromStationId: e.target.value, 
                                        fromStation: selectedOption.text 
                                    });
                                    // Clear error when user makes a selection
                                    if (error) setError(null);
                                }}
                                disabled={loading}
                            >
                                <option value="">
                                    {loading ? 'Đang tải ga...' : 'Chọn ga đi'}
                                </option>
                                {stations.map((station) => (
                                    <option key={station.stationId} value={station.stationId}>
                                        {station.stationName}
                                    </option>
                                ))}
                            </Form.Select>

                            <Button 
                                variant="outline-secondary" 
                                onClick={handleSwapStations}
                                disabled={loading || !singleForm.fromStationId || !singleForm.toStationId}
                                title="Đổi ga"
                            >
                                <ArrowDownUp />
                            </Button>

                            <Form.Select
                                value={singleForm.toStationId}
                                onChange={(e) => {
                                    const selectedOption = e.target.options[e.target.selectedIndex];
                                    updateForm({ 
                                        ...singleForm, 
                                        toStationId: e.target.value, 
                                        toStation: selectedOption.text 
                                    });
                                    // Clear error when user makes a selection
                                    if (error) setError(null);
                                }}
                                disabled={loading}
                            >
                                <option value="">
                                    {loading ? 'Đang tải ga...' : 'Chọn ga đến'}
                                </option>
                                {stations.map((station) => (
                                    <option key={station.stationId} value={station.stationId}>
                                        {station.stationName}
                                    </option>
                                ))}
                            </Form.Select>
                        </InputGroup>
                        
                        {/* Thông tin số lượng ga */}
                        {!loading && stations.length > 0 && (
                            <Form.Text className="text-muted">
                                {stations.length} ga có sẵn
                            </Form.Text>
                        )}
                        
                        {/* Chỉ báo tải */}
                        {loading && (
                            <Form.Text className="text-muted d-flex align-items-center mt-1">
                                <Spinner animation="border" size="sm" className="me-2" />
                                Đang tải ga...
                            </Form.Text>
                        )}
                    </Form.Group>

                    {/* Số lượng vé */}
                    <Form.Group className="mb-3">
                        <Accordion>
                            <Accordion.Item eventKey="0">
                                <Accordion.Header>
                                    <div>
                                        Số lượng vé
                                        <div className="text-muted small">
                                            {singleForm.numberOfTickets} {singleForm.numberOfTickets === 1 ? 'vé' : 'vé'}
                                        </div>
                                    </div>
                                </Accordion.Header>
                                <Accordion.Body>
                                    <div className="passenger-selector">
                                        <div className="d-flex justify-content-between align-items-center">
                                            <div>
                                                <div className="fw-bold">Vé</div>
                                                <div className="text-muted small">Tối đa 10 vé mỗi lần mua</div>
                                            </div>
                                            <div className="d-flex align-items-center">
                                                <Button
                                                    variant="outline-secondary"
                                                    size="sm"
                                                    onClick={() => updateForm({ ...singleForm, numberOfTickets: Math.max(1, singleForm.numberOfTickets - 1) })}
                                                >
                                                    <Dash />
                                                </Button>
                                                <span className="mx-3 fw-bold">{singleForm.numberOfTickets}</span>
                                                <Button
                                                    variant="outline-secondary"
                                                    size="sm"
                                                    onClick={() => updateForm({ ...singleForm, numberOfTickets: Math.min(10, singleForm.numberOfTickets + 1) })}
                                                >
                                                    <Plus />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </Accordion.Body>
                            </Accordion.Item>
                        </Accordion>
                    </Form.Group>
                </Col>

                <Col md={4} className="d-flex align-items-center">
                    <Button 
                        variant="danger" 
                        size="lg" 
                        className="w-100"
                        disabled={
                            loading || 
                            !singleForm.fromStationId || 
                            !singleForm.toStationId || 
                            singleForm.fromStationId === singleForm.toStationId
                        }
                        onClick={handleSearch}
                    >
                        {loading ? (
                            <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                LOADING...
                            </>
                        ) : (
                            'TÌM VÉ'
                        )}
                    </Button>
                </Col>
            </Row>
        </Form>

        {/* Login Modal */}
        <Modal
            show={showLoginModal}
            onHide={() => setShowLoginModal(false)}
            centered
            className="custom-modal"
        >
            <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title className="text-danger fw-bold">Yêu cầu đăng nhập</Modal.Title>
            </Modal.Header>
            <Modal.Body className="text-center py-4">
                <div className="mb-3">
                    <i className="bi bi-person-circle text-danger" style={{ fontSize: '3rem' }}></i>
                </div>
                <p className="mb-0 fs-5">Vui lòng đăng nhập để tiếp tục tìm vé.</p>
                <p className="text-muted small mt-2">Bạn cần đăng nhập để xem và mua vé.</p>
            </Modal.Body>
            <Modal.Footer className="border-0 pt-0">
                <Button
                    variant="outline-secondary"
                    onClick={() => setShowLoginModal(false)}
                    className="px-4"
                >
                    Hủy
                </Button>
                <Button
                    variant="danger"
                    onClick={handleLoginRedirect}
                    className="px-4"
                    style={{
                        backgroundColor: '#dc3545',
                        borderColor: '#dc3545',
                        boxShadow: '0 2px 4px rgba(220, 53, 69, 0.2)'
                    }}
                >
                    Đi đến đăng nhập
                </Button>
            </Modal.Footer>
        </Modal>
        </>
    );
};

export default SingleTripForm;