import { useState, useEffect } from "react"
import { format } from "date-fns"
import axiosInstance from "../../config/axios"
import { useNavigate } from 'react-router-dom';
import useTicket from "../../services/ticket";
import {
    Container,
    Row,
    Col,
    Card,
    Button,
    Badge,
    Form,
    InputGroup,
    Modal,
    Tab,
    Tabs,
    Spinner,
    Pagination,
    OverlayTrigger,
    Tooltip,
} from "react-bootstrap"
import {
    BsCalendar,
    BsClock,
    BsCreditCard,
    BsDownload,
    BsGeoAlt,
    BsShare,
    BsTag,
    BsTicket, BsX,
    BsSearch,
    BsArrowRight,
    BsCheck,
    BsExclamationCircle,
    BsFilter,
    BsSortDown,
    BsQrCode,
    BsInfoCircle,
    BsClockHistory,
} from "react-icons/bs"
import { FaTrain } from "react-icons/fa"
import HistoryTable from "../../components/checkin/HistoryTable"

export default function UserTickets() {
    const [bookings, setBookings] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedBooking, setSelectedBooking] = useState(null)
    const [showModal, setShowModal] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [filterStatus, setFilterStatus] = useState("all")
    const [filterTicketType, setFilterTicketType] = useState("all")
    const [sortBy, setSortBy] = useState("date-desc")
    const [currentPage, setCurrentPage] = useState(1)
    const [activeTab, setActiveTab] = useState("info")
    const bookingsPerPage = 5
    const [error, setError] = useState(null)
    const navigate = useNavigate();
    const { getTicketHistory } = useTicket();
    useEffect(() => {
        const fetchBookings = async () => {
            setLoading(true)
            try {
                const response = await axiosInstance.get('/account/ticket')
                if (response.data && response.data.status === 200) {
                    const bookingData = response.data.data || []
                    console.log('Fetched bookings:', bookingData)
                    setBookings(bookingData)
                } else {
                    console.error('Failed to fetch bookings:', response)
                    setError('Failed to fetch booking data')
                }
            } catch (error) {
                console.error('Error fetching bookings:', error)
                setError('Error fetching booking data: ' + (error.message || 'Unknown error'))
            } finally {
                setLoading(false)
            }
        }
        fetchBookings()
    }, [])

    const handleViewBookingDetails = (booking) => {
        setSelectedBooking(booking)
        console.log(booking)
        setShowModal(true)
        setActiveTab("info")
    }

    const handleCloseModal = () => {
        setShowModal(false)
        setSelectedBooking(null)
    }

    const formatDate = (dateString) => {
        return format(new Date(dateString), "dd/MM/yyyy")
    }

    const formatDateTime = (dateString) => {
        return format(new Date(dateString), "dd/MM/yyyy HH:mm")
    }

    const formatPrice = (price) => {
        if (!price && price !== 0) return "N/A"
        return new Intl.NumberFormat("vi-VN").format(price) + " ₫"
    }

    const isMonthlyPass = (ticketName) => {
        return ticketName && (
            ticketName.toLowerCase().includes('tháng') ||
            ticketName.toLowerCase().includes('monthly') ||
            ticketName.toLowerCase().includes('pass')
        )
    }

    const getTicketTypeIcon = (ticketName) => {
        if (isMonthlyPass(ticketName)) {
            return <BsCalendar size={16} className="text-info" />
        }
        return <BsTicket size={16} className="text-danger" />
    }

    const getTicketTypeBadge = (ticketName) => {
        if (isMonthlyPass(ticketName)) {
            return (
                <Badge bg="info" className="rounded-pill">
                    <BsCalendar size={12} className="me-1" />
                    Vé tháng
                </Badge>
            )
        }
        return (
            <Badge bg="secondary" className="rounded-pill">
                <BsTicket size={12} className="me-1" />
                Vé lẻ
            </Badge>
        )
    }

    const getStatusBadge = (status) => {
        const statusConfig = {
            UNUSED: { variant: "success", icon: BsCheck, text: "Chưa sử dụng" },
            ACTIVE: { variant: "success", icon: BsCheck, text: "Đang sử dụng" },
            USED: { variant: "secondary", icon: BsCheck, text: "Đã sử dụng" },
            EXPIRED: { variant: "warning", icon: BsClock, text: "Hết hạn" },
            CANCELLED: { variant: "danger", icon: BsX, text: "Đã hủy" },
        }

        const config = statusConfig[status] || { variant: "secondary", icon: BsExclamationCircle, text: "Không xác định" }
        const IconComponent = config.icon

        return (
            <Badge bg={config.variant} className="d-flex align-items-center gap-1 px-3 py-2 text-white border-0">
                <IconComponent size={14} />
                {config.text}
            </Badge>
        )
    }

    const filteredBookings = bookings
        .filter((booking) => {
            const searchLower = searchQuery.toLowerCase()
            const matchesSearch =
                (booking.departureStation?.stationName || '').toLowerCase().includes(searchLower) ||
                (booking.arrivalStation?.stationName || '').toLowerCase().includes(searchLower) ||
                (booking.route?.routeName || '').toLowerCase().includes(searchLower) ||
                (booking.ticketName || '').toLowerCase().includes(searchLower)

            // Filter by ticket status if needed
            const hasMatchingTicketStatus = filterStatus === "all" ||
                booking.tickets?.some(ticket => ticket.status === filterStatus)

            // Filter by ticket type
            const matchesTicketType = filterTicketType === "all" ||
                (filterTicketType === "monthly" && isMonthlyPass(booking.ticketName)) ||
                (filterTicketType === "single" && !isMonthlyPass(booking.ticketName))

            return matchesSearch && hasMatchingTicketStatus && matchesTicketType
        })
        .sort((a, b) => {
            switch (sortBy) {
                case "date-desc":
                    return new Date(b.purchaseTime) - new Date(a.purchaseTime)
                case "date-asc":
                    return new Date(a.purchaseTime) - new Date(b.purchaseTime)
                case "price-desc":
                    return b.newPrice - a.newPrice
                case "price-asc":
                    return a.newPrice - b.newPrice
                default:
                    return 0
            }
        })

    const indexOfLastBooking = currentPage * bookingsPerPage
    const indexOfFirstBooking = indexOfLastBooking - bookingsPerPage
    const currentBookings = filteredBookings.slice(indexOfFirstBooking, indexOfLastBooking)
    const totalPages = Math.ceil(filteredBookings.length / bookingsPerPage)

    if (error) {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    padding: "2rem 0",
                }}
            >
                <Container>
                    <div className="text-center py-5">
                        <Card className="shadow-sm border" style={{ borderRadius: "10px", maxWidth: "600px", margin: "0 auto" }}>
                            <Card.Body className="p-5">
                                <div className="mb-4">
                                    <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3 bg-light" style={{
                                        width: "80px",
                                        height: "80px",
                                    }}
                                    >
                                        <BsExclamationCircle size={40} className="text-danger" />
                                    </div>
                                </div>
                                <h5 className="text-dark mb-3 fw-bold">Đã xảy ra lỗi</h5>
                                <p className="text-muted mb-4">{error}</p>
                                <Button
                                    variant="outline-danger"
                                    className="rounded-pill px-4 py-2"
                                    onClick={() => window.location.reload()}
                                >
                                    Thử lại
                                </Button>
                            </Card.Body>
                        </Card>
                    </div>
                </Container>
            </div>
        )
    }

    if (loading) {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    padding: "2rem 0",
                }}
            >
                <Container>
                    <div className="text-center py-5">
                        <Card className="shadow-sm border" style={{ borderRadius: "10px", maxWidth: "400px", margin: "0 auto" }}>
                            <Card.Body className="p-5">
                                <div className="mb-4">
                                    <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3 bg-light" style={{
                                        width: "80px",
                                        height: "80px",
                                    }}
                                    >
                                        <Spinner animation="border" variant="danger" style={{ width: "2.5rem", height: "2.5rem" }} />
                                    </div>
                                </div>
                                <h5 className="text-dark mb-3 fw-bold">Đang tải danh sách vé...</h5>
                                <p className="text-muted mb-0">Vui lòng chờ trong giây lát</p>
                            </Card.Body>
                        </Card>
                    </div>
                </Container>
            </div>
        )
    } return (
        <div
            style={{
                minHeight: "100vh",
                padding: "2rem 0",
                background: "#fafafa"
            }}
        >
            <Container>
                {/* Header */}
                <div className="text-center mb-5">
                    <Card className="shadow-sm border" style={{ borderRadius: "12px", maxWidth: "600px", margin: "0 auto" }}>
                        <Card.Body className="p-4">
                            <div className="mb-4">
                                <div
                                    className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3 bg-light" style={{
                                        width: "70px",
                                        height: "70px",
                                    }}
                                >
                                    <BsTicket size={28} className="text-danger" />
                                </div>
                            </div>
                            <h1 className="fw-bold mb-3" style={{ color: "#dc3545" }}>Vé đã đặt</h1>
                            <p className="text-muted mb-0">Quản lý và xem thông tin vé bạn đã đặt</p>
                        </Card.Body>
                    </Card>
                </div>                {/* Search and Filter */}
                <Card className="shadow-sm border mb-4" style={{ borderRadius: "12px" }}>
                    <Card.Body className="p-3">
                        <Row className="g-3">
                            <Col lg={4}>
                                <InputGroup>
                                    <InputGroup.Text className="bg-light border">
                                        <BsSearch size={16} className="text-danger" />
                                    </InputGroup.Text>
                                    <Form.Control
                                        type="text"
                                        placeholder="Tìm kiếm vé theo ga, tuyến..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="border"
                                    />
                                </InputGroup>
                            </Col>
                            <Col lg={2}>
                                <InputGroup>
                                    <InputGroup.Text className="bg-light border">
                                        <BsTicket size={16} className="text-danger" />
                                    </InputGroup.Text>
                                    <Form.Select
                                        value={filterTicketType}
                                        onChange={(e) => setFilterTicketType(e.target.value)}
                                        className="border"
                                    >
                                        <option value="all">Tất cả loại vé</option>
                                        <option value="single">Vé lẻ</option>
                                        <option value="monthly">Vé tháng</option>
                                    </Form.Select>
                                </InputGroup>
                            </Col>
                            <Col lg={3}>
                                <InputGroup>
                                    <InputGroup.Text className="bg-light border">
                                        <BsFilter size={16} className="text-danger" />
                                    </InputGroup.Text>
                                    <Form.Select
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                        className="border"
                                    >
                                        <option value="all">Tất cả trạng thái</option>
                                        <option value="UNUSED">Chưa sử dụng</option>
                                        <option value="ACTIVE">Đang sử dụng</option>
                                        <option value="EXPIRED">Hết hạn</option>
                                        <option value="CANCELLED">Đã hủy</option>
                                    </Form.Select>
                                </InputGroup>
                            </Col>
                            <Col lg={3}>
                                <InputGroup>
                                    <InputGroup.Text className="bg-light border">
                                        <BsSortDown size={16} className="text-danger" />
                                    </InputGroup.Text>
                                    <Form.Select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="border"
                                    >
                                        <option value="date-desc">Mới nhất</option>
                                        <option value="date-asc">Cũ nhất</option>
                                        <option value="price-desc">Giá cao nhất</option>
                                        <option value="price-asc">Giá thấp nhất</option>
                                    </Form.Select>
                                </InputGroup>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>                {/* Booking List */}
                {currentBookings.length === 0 ? (
                    <Card className="shadow-sm border" style={{ borderRadius: "12px" }}>
                        <Card.Body className="text-center py-5">
                            <div
                                className="d-inline-flex align-items-center justify-content-center rounded-circle mb-4 bg-light"
                                style={{
                                    width: "90px",
                                    height: "90px",
                                }}
                            >
                                <BsTicket size={40} className="text-danger" />
                            </div>
                            <h5 className="mb-3 fw-bold">Không tìm thấy đơn đặt vé nào</h5>
                            <p className="text-muted mb-4">
                                {searchQuery || filterStatus !== "all" || filterTicketType !== "all"
                                    ? "Không có đơn đặt vé nào phù hợp với bộ lọc của bạn"
                                    : "Bạn chưa đặt vé nào"}
                            </p>
                            {(searchQuery || filterStatus !== "all" || filterTicketType !== "all") && (<Button
                                variant="outline-dark"
                                className="rounded-pill px-4 py-2"
                                onClick={() => {
                                    setSearchQuery("")
                                    setFilterStatus("all")
                                    setFilterTicketType("all")
                                }}
                            >
                                Xóa bộ lọc
                            </Button>
                            )}
                        </Card.Body>
                    </Card>
                ) : (<div className="d-flex flex-column gap-4">
                    {currentBookings.map((booking) => (
                        <Card
                            key={booking.bookingId}
                            className="shadow-sm border"
                            style={{
                                borderRadius: "12px",
                                transition: "all 0.2s ease",
                                transform: "translateY(0)",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = "translateY(-3px)"
                                e.currentTarget.style.boxShadow = "0 10px 20px rgba(0,0,0,0.08)"
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "translateY(0)"
                                e.currentTarget.style.boxShadow = ""
                            }}
                        >
                            <Row className="g-0">
                                <Col lg={9}>
                                    <Card.Body className="p-4">
                                        {/* Header */}
                                        <div className="d-flex justify-content-between align-items-start mb-4">
                                            <div className="d-flex align-items-center">
                                                <div
                                                    className={`rounded-circle p-2 me-3 ${isMonthlyPass(booking.ticketName) ? 'bg-info bg-opacity-10' : 'bg-light'}`}
                                                >
                                                    {isMonthlyPass(booking.ticketName) ?
                                                        <BsCalendar size={16} className="text-info" /> :
                                                        <FaTrain size={16} className="text-danger" />
                                                    }
                                                </div>
                                                <div>
                                                    <div className="d-flex align-items-center gap-2 mb-1">
                                                        <small className="fw-bold text-dark">
                                                            {booking.route?.routeName}
                                                        </small>
                                                        {getTicketTypeBadge(booking.ticketName)}
                                                    </div>
                                                    <div className="text-muted small">Booking #{booking.bookingId.toString().padStart(6, "0")}</div>
                                                    <div className="text-muted small">{booking.numberOfPassengers} hành khách</div>
                                                </div>
                                            </div>
                                            <div className="d-flex gap-2 flex-wrap">
                                                {booking.tickets?.map((ticket, index) => (
                                                    <div key={ticket.ticketId} className="text-center">
                                                        <small className="text-muted d-block">Vé {index + 1}</small>
                                                        {getStatusBadge(ticket.status)}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Route */}
                                        <div className="mb-4">
                                            <h4 className="d-flex align-items-center gap-3 mb-2 fw-bold">
                                                <span>{booking.departureStation?.stationName || 'N/A'}</span>
                                                <div
                                                    className="rounded-circle p-1 bg-light"
                                                >
                                                    <BsArrowRight size={16} className="text-danger" />
                                                </div>
                                                <span>{booking.arrivalStation?.stationName || 'N/A'}</span>
                                            </h4>
                                            <div className="d-flex align-items-center text-muted">
                                                {isMonthlyPass(booking.ticketName) ?
                                                    <BsCalendar size={20} className="me-2 text-info" /> :
                                                    <BsCalendar size={20} className="me-2" />
                                                }
                                                <small className="fw-medium">
                                                    {booking.purchaseTime ? formatDateTime(booking.purchaseTime) : 'N/A'} •
                                                    <span style={{
                                                        fontSize: 14,
                                                        color: isMonthlyPass(booking.ticketName) ? '#0dcaf0' : '#dc3545',
                                                        marginLeft: '8px'
                                                    }}>
                                                        {booking.ticketName}
                                                    </span>
                                                    {isMonthlyPass(booking.ticketName) && (
                                                        <span className="badge bg-info bg-opacity-25 text-info ms-2 rounded-pill">
                                                            Vé tháng
                                                        </span>
                                                    )}
                                                </small>
                                            </div>
                                        </div>

                                        {/* Station Details */}
                                        <Row className="mb-4">
                                            <Col md={6}>
                                                <div
                                                    className="d-flex align-items-start p-3 rounded-3 bg-light"
                                                >
                                                    <div className="rounded-circle p-2 me-3 bg-danger">
                                                        <BsGeoAlt size={16} className="text-white" />
                                                    </div>
                                                    <div>
                                                        <small className="fw-bold text-dark">
                                                            Ga đi
                                                        </small>
                                                        <div className="fw-bold">{booking.departureStation?.stationName || 'N/A'}</div>
                                                        <small className="text-muted">{booking.departureStation?.stationLocation || 'Không có thông tin'}</small>
                                                    </div>
                                                </div>
                                            </Col>
                                            <Col md={6}>
                                                <div
                                                    className="d-flex align-items-start p-3 rounded-3 bg-light"
                                                >
                                                    <div className="rounded-circle p-2 me-3 bg-danger">
                                                        <BsGeoAlt size={16} className="text-white" />
                                                    </div>
                                                    <div>
                                                        <small className="fw-bold text-dark">
                                                            Ga đến
                                                        </small>
                                                        <div className="fw-bold">{booking.arrivalStation?.stationName || 'N/A'}</div>
                                                        <small className="text-muted">{booking.arrivalStation?.stationLocation || 'Không có thông tin'}</small>
                                                    </div>
                                                </div>
                                            </Col>
                                        </Row>

                                        {/* Price and Action */}
                                        <div className="d-flex justify-content-between align-items-center">
                                            <div className="d-flex align-items-center">
                                                <div className="rounded-circle p-2 me-3 bg-danger">
                                                    <BsTag size={16} className="text-white" />
                                                </div>
                                                <div>
                                                    <div className="h4 fw-bold mb-0 text-danger">
                                                        {formatPrice(booking.newPrice)}
                                                    </div>
                                                    {booking.oldPrice !== booking.newPrice && (
                                                        <Badge bg="light" text="dark" className="rounded-pill border">
                                                            Giảm giá từ {formatPrice(booking.oldPrice)}
                                                        </Badge>
                                                    )}
                                                    {booking.promotionCode && (
                                                        <Badge bg="success" className="rounded-pill ms-2">
                                                            Mã: {booking.promotionCode}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="d-flex gap-2">
                                                {booking.urlCheckout && (
                                                    <Button
                                                        variant="outline-danger"
                                                        className="rounded-pill px-3 py-2 fw-bold"
                                                        onClick={() => window.open(booking.urlCheckout, '_blank')}
                                                    >
                                                        Thanh toán
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="outline-dark"
                                                    className="rounded-pill px-4 py-2 fw-bold"
                                                    onClick={() => handleViewBookingDetails(booking)}
                                                >
                                                    Chi tiết
                                                </Button>
                                            </div>
                                        </div>
                                    </Card.Body>
                                </Col>

                                {/* QR Code Section - only show if tickets are active */}
                                {booking.tickets?.some(ticket => ticket.status === "UNUSED" || ticket.status === "ACTIVE") && (
                                    <Col lg={3}>
                                        <div
                                            className={`h-100 d-flex flex-column justify-content-center align-items-center p-4 ${isMonthlyPass(booking.ticketName) ? 'bg-info bg-opacity-10' : 'bg-light'
                                                }`}
                                            style={{
                                                borderRadius: "0 12px 12px 0",
                                            }}
                                        >
                                            <div className={`bg-white rounded-3 p-3 mb-3 border ${isMonthlyPass(booking.ticketName) ? 'border-info' : ''
                                                }`}>
                                                {isMonthlyPass(booking.ticketName) ?
                                                    <BsCalendar size={60} className="text-info" /> :
                                                    <BsQrCode size={60} className="text-danger" />
                                                }
                                            </div>
                                            <div className="text-center">
                                                <small className={`fw-medium ${isMonthlyPass(booking.ticketName) ? 'text-info' : 'text-danger'
                                                    }`}>
                                                    {isMonthlyPass(booking.ticketName) ? 'Vé tháng' : 'Mã đặt vé'}
                                                </small>
                                                <div className="fw-bold font-monospace text-dark">#{booking.bookingId.toString().padStart(6, "0")}</div>
                                                <small className="text-muted">
                                                    {booking.tickets?.length || 0} vé • {isMonthlyPass(booking.ticketName) ? 'Monthly Pass' : 'Single Trip'}
                                                </small>
                                            </div>
                                        </div>
                                    </Col>
                                )}
                            </Row>
                        </Card>
                    ))}
                </div>
                )}                {/* Pagination */}
                {filteredBookings.length > 0 && totalPages > 1 && (
                    <Card className="shadow-sm border mt-4" style={{ borderRadius: "12px" }}>
                        <Card.Body>
                            <Row className="align-items-center">
                                <Col>
                                    <small className="text-muted fw-medium">
                                        Hiển thị {indexOfFirstBooking + 1}-{Math.min(indexOfLastBooking, filteredBookings.length)} trong{" "}
                                        <span className="fw-bold text-dark">
                                            {filteredBookings.length}
                                        </span>{" "}
                                        đơn đặt vé
                                    </small>
                                </Col>
                                <Col xs="auto">
                                    <Pagination className="mb-0">
                                        <Pagination.Prev
                                            disabled={currentPage === 1}
                                            onClick={() => setCurrentPage(currentPage - 1)}
                                            className="rounded-pill me-2"
                                        />
                                        <Pagination.Item
                                            active
                                            className="rounded-pill mx-2"
                                        >
                                            {currentPage} / {totalPages}
                                        </Pagination.Item>
                                        <Pagination.Next
                                            disabled={currentPage === totalPages}
                                            onClick={() => setCurrentPage(currentPage + 1)}
                                            className="rounded-pill ms-2"
                                        />
                                    </Pagination>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>)}

                {/* Modal */}
                <Modal show={showModal} onHide={handleCloseModal} size="lg" centered>
                    <div className="border" style={{ borderRadius: "8px" }}>
                        <Modal.Header className="border-bottom pb-3" style={{ borderRadius: "8px 8px 0 0" }}>
                            <Modal.Title className="d-flex align-items-center w-100">
                                <div className="rounded-circle p-2 me-3 bg-light">
                                    <BsTicket className="text-danger" size={20} />
                                </div>
                                <div>
                                    <h5 className="mb-0 text-dark">
                                        Chi tiết đơn đặt vé #{selectedBooking?.bookingId.toString().padStart(6, "0")}
                                    </h5>
                                    <small className="text-muted">{selectedBooking?.route?.routeName}</small>
                                </div>
                            </Modal.Title>
                            <Button variant="outline-dark" className="border-0 rounded-circle p-2" onClick={handleCloseModal}>
                                <BsX size={20} />
                            </Button>
                        </Modal.Header>
                        <Modal.Body className="p-4">
                            {selectedBooking && (
                                <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-4" fill>
                                    <Tab
                                        eventKey="info"
                                        title={
                                            <span className="d-flex align-items-center">
                                                <BsInfoCircle size={16} className="me-2" />
                                                Thông tin đặt vé
                                            </span>
                                        }
                                    >
                                        <div className="py-3">
                                            {/* Booking Status */}
                                            <Card className="border mb-4" style={{ backgroundColor: "#f8f9fa", borderRadius: "8px" }}>
                                                <Card.Body className="p-4">
                                                    <Row className="align-items-center">
                                                        <Col>
                                                            <small className="text-muted fw-bold">Thông tin đặt vé</small>
                                                            <div className="mt-2">
                                                                <div className="d-flex align-items-center gap-2 mb-2">
                                                                    <div className="fw-bold text-dark">Booking #{selectedBooking.bookingId}</div>
                                                                    {getTicketTypeBadge(selectedBooking.ticketName)}
                                                                </div>
                                                                <small className="text-muted">{selectedBooking.numberOfPassengers} hành khách</small>
                                                                {isMonthlyPass(selectedBooking.ticketName) && (
                                                                    <div className="mt-1">
                                                                        <span className="badge bg-info bg-opacity-25 text-info rounded-pill">
                                                                            <BsCalendar size={12} className="me-1" />
                                                                            Vé tháng - Sử dụng không giới hạn
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </Col>
                                                        <Col xs="auto" className="text-end">
                                                            <small className="text-muted fw-bold">Ngày đặt</small>
                                                            <div className="fw-bold text-dark mt-1">
                                                                {formatDateTime(selectedBooking.purchaseTime)}
                                                            </div>
                                                        </Col>
                                                    </Row>
                                                </Card.Body>
                                            </Card>

                                            {/* Route Information */}
                                            <div className="mb-4">
                                                <h6 className="d-flex align-items-center mb-3 text-dark">
                                                    <div className="rounded-circle p-2 me-3 bg-light">
                                                        <FaTrain className="text-danger" size={20} />
                                                    </div>
                                                    Thông tin hành trình
                                                </h6>
                                                <Card className="border" style={{ backgroundColor: "#f8f9fa", borderRadius: "8px" }}>
                                                    <Card.Body className="p-4">
                                                        <div className="text-center mb-4">
                                                            <small className="fw-bold text-danger">
                                                                Tuyến
                                                            </small>
                                                            <div className="h5 fw-bold text-dark mb-1">{selectedBooking.route?.routeName}</div>
                                                            <small className="text-muted">{selectedBooking.ticketName}</small>
                                                            {selectedBooking.route?.distance && (
                                                                <small className="text-muted d-block">Khoảng cách: {selectedBooking.route.distance} km</small>
                                                            )}
                                                        </div>
                                                        <div className="d-flex align-items-center justify-content-between">
                                                            <div className="text-center">
                                                                <div
                                                                    className="rounded-circle p-3 mb-2 mx-auto d-inline-block bg-light"
                                                                >
                                                                    <BsGeoAlt className="text-danger" size={20} />
                                                                </div>
                                                                <small className="fw-bold text-dark">
                                                                    Ga đi
                                                                </small>
                                                                <div className="fw-bold text-dark">{selectedBooking.departureStation?.stationName || 'N/A'}</div>
                                                                <small className="text-muted">{selectedBooking.departureStation?.stationLocation || 'Không có thông tin'}</small>
                                                            </div>
                                                            <div
                                                                className="rounded-circle p-2 bg-light"
                                                            >
                                                                <BsArrowRight className="text-danger" size={20} />
                                                            </div>
                                                            <div className="text-center">
                                                                <div
                                                                    className="rounded-circle p-3 mb-2 mx-auto d-inline-block bg-light"
                                                                >
                                                                    <BsGeoAlt className="text-danger" size={20} />
                                                                </div>
                                                                <small className="fw-bold text-dark">
                                                                    Ga đến
                                                                </small>
                                                                <div className="fw-bold text-dark">{selectedBooking.arrivalStation?.stationName || 'N/A'}</div>
                                                                <small className="text-muted">{selectedBooking.arrivalStation?.stationLocation || 'Không có thông tin'}</small>
                                                            </div>
                                                        </div>
                                                    </Card.Body>
                                                </Card>
                                            </div>

                                            {/* Tickets List */}
                                            <div className="mb-4">
                                                <h6 className="d-flex align-items-center mb-3 text-dark">
                                                    <div className="rounded-circle p-2 me-3 bg-light">
                                                        <BsTicket className="text-danger" size={16} />
                                                    </div>
                                                    Danh sách vé ({selectedBooking.tickets?.length || 0} vé)
                                                </h6>
                                                <div className="d-flex flex-column gap-3">
                                                    {selectedBooking.tickets?.map((ticket, index) => (
                                                        <Card key={ticket.ticketId} className="border" style={{ backgroundColor: "#f8f9fa", borderRadius: "8px" }}>
                                                            <Card.Body className="p-3">
                                                                <Row className="align-items-center">
                                                                    <Col>
                                                                        <div className="fw-bold text-dark">Vé #{index + 1}</div>
                                                                        <small className="text-muted">ID: {ticket.ticketId}</small>
                                                                        {ticket.ticketCode && (
                                                                            <div><small className="text-muted">Mã: {ticket.ticketCode}</small></div>
                                                                        )}
                                                                    </Col>
                                                                    <Col xs="auto">
                                                                        {getStatusBadge(ticket.status)}
                                                                    </Col>
                                                                    <Col xs="auto">
                                                                        {(ticket.status === "UNUSED" || ticket.status === "ACTIVE") && (
                                                                            <Button
                                                                                size="sm"
                                                                                variant="outline-danger"
                                                                                onClick={() => navigate(`/checkin/${ticket.ticketId}`)}
                                                                            >
                                                                                Check-in
                                                                            </Button>
                                                                        )}
                                                                    </Col>
                                                                </Row>
                                                                {(ticket.validFrom || ticket.validTo) && (
                                                                    <div className="mt-2">
                                                                        <small className="text-muted">
                                                                            Hiệu lực: {ticket.validFrom ? formatDateTime(ticket.validFrom) : 'N/A'} - {ticket.validTo ? formatDateTime(ticket.validTo) : 'N/A'}
                                                                        </small>
                                                                    </div>
                                                                )}
                                                            </Card.Body>
                                                        </Card>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Payment Details */}
                                            <Row>
                                                <Col md={6}>
                                                    <Card
                                                        className="border h-100"
                                                        style={{ backgroundColor: "#f8f9fa", borderRadius: "8px" }}
                                                    >
                                                        <Card.Body className="p-4">
                                                            <h6 className="d-flex align-items-center mb-3 text-dark">
                                                                <div className="rounded-circle p-2 me-3 bg-light">
                                                                    <BsCreditCard className="text-danger" size={16} />
                                                                </div>
                                                                Thông tin thanh toán
                                                            </h6>
                                                            <div className="d-flex justify-content-between mb-2">
                                                                <small className="text-muted fw-medium">Tổng tiền:</small>
                                                                <span className="fw-bold text-danger">
                                                                    {formatPrice(selectedBooking.newPrice)}
                                                                </span>
                                                            </div>
                                                            {selectedBooking.oldPrice !== selectedBooking.newPrice && (
                                                                <div className="d-flex justify-content-between mb-2">
                                                                    <small className="text-muted fw-medium">Giá gốc:</small>
                                                                    <span className="text-decoration-line-through text-muted">
                                                                        {formatPrice(selectedBooking.oldPrice)}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {selectedBooking.promotionCode && (
                                                                <div className="d-flex justify-content-between">
                                                                    <small className="text-muted fw-medium">Mã giảm giá:</small>
                                                                    <Badge bg="success" className="rounded-pill">
                                                                        {selectedBooking.promotionCode}
                                                                    </Badge>
                                                                </div>
                                                            )}
                                                            {selectedBooking.payOrderCode && (
                                                                <div className="d-flex justify-content-between mt-2">
                                                                    <small className="text-muted fw-medium">Mã đơn hàng:</small>
                                                                    <small className="fw-bold text-dark">{selectedBooking.payOrderCode}</small>
                                                                </div>
                                                            )}
                                                        </Card.Body>
                                                    </Card>
                                                </Col>
                                                <Col md={6}>
                                                    <Card
                                                        className="border h-100"
                                                        style={{ backgroundColor: "#f8f9fa", borderRadius: "8px" }}
                                                    >
                                                        <Card.Body className="p-4">
                                                            <h6 className="d-flex align-items-center mb-3 text-dark">
                                                                <div className="rounded-circle p-2 me-3 bg-light">
                                                                    <BsCalendar className="text-danger" size={16} />
                                                                </div>
                                                                Thông tin bổ sung
                                                            </h6>
                                                            <div className="d-flex justify-content-between mb-2">
                                                                <small className="text-muted fw-medium">Khách hàng:</small>
                                                                <span className="fw-bold text-dark">{selectedBooking.userName}</span>
                                                            </div>
                                                            <div className="d-flex justify-content-between mb-2">
                                                                <small className="text-muted fw-medium">Loại vé:</small>
                                                                <span className="fw-bold text-dark">{selectedBooking.ticketName}</span>
                                                            </div>
                                                            <div className="d-flex justify-content-between">
                                                                <small className="text-muted fw-medium">Số hành khách:</small>
                                                                <span className="fw-bold text-dark">{selectedBooking.numberOfPassengers}</span>
                                                            </div>
                                                        </Card.Body>
                                                    </Card>
                                                </Col>
                                            </Row>
                                        </div>
                                    </Tab>
                                    <Tab
                                        eventKey="qr"
                                        title={
                                            <span className="d-flex align-items-center">
                                                <BsQrCode size={16} className="me-2" />
                                                QR Check-in
                                            </span>
                                        }
                                    >
                                        <div className="py-3">
                                            <h6 className="text-center text-dark mb-4">Danh sách vé có thể check-in</h6>
                                            <div className="d-flex flex-column gap-3">
                                                {selectedBooking.tickets?.filter(ticket => ticket.status === "UNUSED" || ticket.status === "ACTIVE").map((ticket, index) => (
                                                    <Card key={ticket.ticketId} className="border" style={{ backgroundColor: "#f8f9fa", borderRadius: "8px" }}>
                                                        <Card.Body className="p-4">
                                                            <Row className="align-items-center">
                                                                <Col xs={3} className="text-center">
                                                                    <div
                                                                        className="d-inline-block p-3 rounded-3 border bg-white cursor-pointer"
                                                                        onClick={() => navigate(`/checkin/${ticket.ticketId}`)}
                                                                        style={{ cursor: 'pointer' }}
                                                                    >
                                                                        <BsQrCode size={40} className="text-danger" />
                                                                    </div>
                                                                    <div className="mt-2">
                                                                        <small className="text-danger fw-medium d-block">QR Code</small>
                                                                        <small className="font-monospace text-dark">{ticket.ticketCode || `#${ticket.ticketId}`}</small>
                                                                    </div>
                                                                </Col>
                                                                <Col>
                                                                    <div className="mb-2">
                                                                        <div className="fw-bold text-dark">Vé #{index + 1}</div>
                                                                        <small className="text-muted">ID: {ticket.ticketId}</small>
                                                                    </div>
                                                                    {getStatusBadge(ticket.status)}
                                                                    {(ticket.validFrom || ticket.validTo) && (
                                                                        <div className="mt-2">
                                                                            <small className="text-muted">
                                                                                Hiệu lực: {ticket.validFrom ? formatDateTime(ticket.validFrom) : 'N/A'} - {ticket.validTo ? formatDateTime(ticket.validTo) : 'N/A'}
                                                                            </small>
                                                                        </div>
                                                                    )}
                                                                </Col>
                                                                <Col xs="auto">
                                                                    <Button
                                                                        variant="danger"
                                                                        className="rounded-pill px-4 py-2 fw-bold"
                                                                        onClick={() => navigate(`/checkin/${ticket.ticketId}`)}
                                                                    >
                                                                        Check-in
                                                                    </Button>
                                                                </Col>
                                                            </Row>
                                                        </Card.Body>
                                                    </Card>
                                                ))}
                                                {selectedBooking.tickets?.filter(ticket => ticket.status === "UNUSED" || ticket.status === "ACTIVE").length === 0 && (
                                                    <div className="text-center py-5">
                                                        <div className="text-muted">
                                                            <BsExclamationCircle size={40} className="mb-3 d-block mx-auto" />
                                                            <p>Không có vé nào có thể check-in</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </Tab>
                                    <Tab
                                        eventKey="history"
                                        title={
                                            <span className="d-flex align-items-center">
                                                <BsClockHistory size={16} className="me-2" />
                                                Lịch sử vé
                                            </span>
                                        }
                                    >
                                        <div className="py-3">
                                            <div className="d-flex flex-column gap-3">
                                                {selectedBooking.tickets?.map((ticket, index) => (
                                                    <Card key={ticket.ticketId} className="border" style={{ backgroundColor: "#f8f9fa", borderRadius: "8px" }}>
                                                        <Card.Body className="p-3">
                                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                                <div>
                                                                    <div className="fw-bold text-dark">Vé #{index + 1}</div>
                                                                    <small className="text-muted">ID: {ticket.ticketId}</small>
                                                                </div>
                                                                {getStatusBadge(ticket.status)}
                                                            </div>
                                                            <HistoryTable ticketId={ticket.ticketId} />
                                                        </Card.Body>
                                                    </Card>
                                                ))}
                                            </div>
                                        </div>
                                    </Tab>
                                </Tabs>
                            )}
                        </Modal.Body>
                    </div>
                </Modal>
            </Container>
        </div>
    )
}
