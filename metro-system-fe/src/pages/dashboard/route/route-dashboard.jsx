import { useState, useEffect } from "react"
import RouteService from "../../../services/routeService"
import StationService from "../../../services/stationService"
import TicketRuleService from "../../../services/ticketRuleService"
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';

const AdminRouteManager = () => {
  const [routes, setRoutes] = useState([])
  const [editRoute, setEditRoute] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [selectedRoutes, setSelectedRoutes] = useState([])
  const [activeTab, setActiveTab] = useState('details') // 'details' or 'stations'
  const [currentRouteStations, setCurrentRouteStations] = useState([])
  const [currentRouteId, setCurrentRouteId] = useState(null)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState(null)
  const [stations, setStations] = useState([]) // Will be replaced by API call
  const [ticketRules, setTicketRules] = useState([]) // For dropdown selection
  const [useApiMode, setUseApiMode] = useState(true) // Toggle between API and local mode

  // Load initial data
  useEffect(() => {
    loadRoutes()
    loadStations()
    loadTicketRules()
  }, [])
  const loadRoutes = async () => {
    try {
      setLoading(true)
      setApiError(null)
      const response = await RouteService.getAllRoutes()
      if (response.data.routes && Array.isArray(response.data.routes)) {
        const transformedRoutes = response.data.routes.map(route =>
          RouteService.transformFromApiFormat(route)
        )
        setRoutes(transformedRoutes)
      } else {
        setRoutes([])
      }
    } catch (error) {
      console.error('Error loading routes:', error)
      setApiError(`API Error: ${error.message}. Using fallback data.`)
      // Use fallback data from data file when API is not available
      setRoutes(initialRoutes || [])
    } finally {
      setLoading(false)
    }
  }

  const loadStations = async () => {
    try {
      const response = await StationService.getAllStations()
      if (response.data && Array.isArray(response.data)) {
        setStations(response.data)
      }
    } catch (error) {
      console.error('Error loading stations:', error)
      // Use fallback data from data file
      setStations(availableStations)
    }
  }

  const loadTicketRules = async () => {
    try {
      const response = await TicketRuleService.getAllTicketRules()
      if (response.data.ticketRules && Array.isArray(response.data.ticketRules)) {
        setTicketRules(response.data.ticketRules)
      }
    } catch (error) {
      console.error('Error loading ticket rules:', error)
      // Set default ticket rule
      // setTicketRules([{ ruleId: 1, ruleName: 'Standard Rate', basePrice: 15000 }])
      setTicketRules(null)
    }
  }

  const validateForm = async () => {
    const newErrors = {}

    // Validate route name
    if (!editRoute.routeName?.trim()) {
      newErrors.routeName = "Route name cannot be empty"
    } else if (editRoute.routeName.trim().length < 3) {
      newErrors.routeName = "Route name must be at least 3 characters long"
    } else if (editRoute.routeName.trim().length > 50) {
      newErrors.routeName = "Route name cannot exceed 50 characters"
    } else {
      // Check for duplicate route name using API
      // try {
      //   // const nameExists = await RouteService.checkRouteNameExists(editRoute.routeName.trim())
      //   const isEditingExisting = editRoute.routeId && routes.find(r => r.routeId === editRoute.routeId)?.routeName === editRoute.routeName.trim()

      //   if (isEditingExisting) {
      //     newErrors.routeName = "Route name already exists"
      //   }
      // } catch (error) {
      //   console.warn('Could not check route name uniqueness:', error)
      //   // Fall back to local check
      //   const isDuplicateName = routes.some(route =>
      //     route.routeId !== editRoute.routeId &&
      //     route.routeName.toLowerCase().trim() === editRoute.routeName?.toLowerCase().trim()
      //   )
      //   if (isDuplicateName) {
      //     newErrors.routeName = "Route name already exists"
      //   }
      // }
      const isDuplicateName = routes.some(route =>
        route.routeId !== editRoute.routeId &&
        route.routeName.toLowerCase().trim() === editRoute.routeName?.toLowerCase().trim()
      )
      if (isDuplicateName) {
        newErrors.routeName = "Route name already exists"
      }
    }

    // Validate routeDescription
    if (!editRoute.routeDescription?.trim()) {
      newErrors.routeDescription = "Description cannot be empty"
    } else if (editRoute.routeDescription.trim().length < 10) {
      newErrors.routeDescription = "Description must be at least 10 characters long"
    } else if (editRoute.routeDescription.trim().length > 500) {
      newErrors.routeDescription = "Description cannot exceed 500 characters"
    }

    // Validate total distance
    // if (editRoute?.routeId) {
    //   if (!editRoute.totalDistance || editRoute.totalDistance <= 0) {
    //     newErrors.totalDistance = "Total distance must be greater than 0"
    //   }
    // }

    // Validate estimated time
    if (!editRoute.estimatedDuration || editRoute.estimatedDuration <= 0) {
      newErrors.estimatedDuration = "Estimated time must be greater than 0"
    } else if (editRoute.estimatedDuration > 600) {
      newErrors.estimatedDuration = "Estimated time cannot exceed 600 minutes"
    }

    // Validate operating hours
    if (!editRoute.operatingHours?.trim()) {
      newErrors.operatingHours = "Operating hours cannot be empty"
    } else {
      const timePattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]\s*-\s*([01]?[0-9]|2[0-3]):[0-5][0-9]$/
      if (!timePattern.test(editRoute.operatingHours.trim())) {
        newErrors.operatingHours = "Operating hours must be in HH:MM - HH:MM format (e.g., 05:00 - 23:00)"
      }
    }

    // Validate frequencyMinutes
    if (!editRoute.frequencyMinutes || editRoute.frequencyMinutes <= 0) {
      newErrors.frequencyMinutes = "Frequency must be greater than 0"
    } else if (editRoute.frequencyMinutes > 60) {
      newErrors.frequencyMinutes = "Frequency cannot exceed 60 minutes"
    }

    // Validate ticketRule
    if (!editRoute.ruleId) {
      newErrors.ruleId = "Please create pricing rules before creating the train route"
    }

    // Validate stations - required for all routes (new and existing)
    if (currentRouteStations.length < 2) {
      newErrors.stations = "A route must have at least 2 stations"
    }

    for (let i = 0; i < currentRouteStations.length - 1; i++) {
      if (currentRouteStations[i].stationId === currentRouteStations[i + 1].stationId) {
        newErrors.stations = "Two same stations must not next to each other"
      }
    }

    // Validate total distance - calculate from stations
    const totalDistance = currentRouteStations.reduce((sum, station) => sum + (station.distanceToNext || 0), 0)
    if (totalDistance <= 0) {
      newErrors.totalDistance = "Total distance must be greater than 0. Please set distance between stations."
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleEditOrAdd = (route = null) => {
    setLoading(false)
    const newRoute = route
      ? { ...route, stations: [...route.stations] }
      : {
        routeName: "",
        routeDescription: "",
        status: "ACTIVE",
        color: "#007bff",
        totalDistance: 0,
        estimatedDuration: 45,
        operatingHours: "05:00 - 23:00",
        frequencyMinutes: 5,
        ruleId: ticketRules.length > 0 ? ticketRules[0].ruleId : null,
        stations: []
      }

    setEditRoute(newRoute)
    setCurrentRouteStations(route ? [...route.stations] : [])
    setCurrentRouteId(route ? route.routeId : null)
    setActiveTab('details') // Always start with details tab
    setErrors({}) // Clear previous errors
    setShowModal(true)
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      setApiError(null)
      const isValid = await validateForm()
      if (!isValid) {
        setLoading(false)
        return // Don't save if validation fails
      }

      // Calculate total distance from stations
      const totalDistance = currentRouteStations.reduce((sum, station) => sum + (station.distanceToNext || 0), 0)

      // Prepare route data with calculated total distance
      const routeData = {
        routeName: editRoute.routeName?.trim(),
        routeDescription: editRoute.routeDescription?.trim(),
        estimatedDuration: parseInt(editRoute.estimatedDuration),
        frequencyMinutes: parseInt(editRoute.frequencyMinutes),
        operatingHours: editRoute.operatingHours?.trim(),
        status: editRoute.status,
        color: editRoute.color,
        ruleId: parseInt(editRoute.ruleId),
        totalDistance: totalDistance
      }

      if (editRoute.routeId) {
        // Update existing route
        const response = await RouteService.updateRoute(editRoute.routeId, routeData)
        if (response) {
          // Always update stations as they are required
          await RouteService.updateRouteStations(editRoute.routeId, currentRouteStations)
          // Reload routes to get updated data
          await loadRoutes()
        }
      } else {
        // Create new route
        const response = await RouteService.createRoute(routeData)
        if (response && response.data.routeId) {
          // Always add stations as they are required
          await RouteService.addStationsToRoute(response.data.routeId, currentRouteStations)
          // Reload routes to get updated data
          await loadRoutes()
        }
      }
      setShowModal(false)
      setEditRoute(null)
      setCurrentRouteStations([])
      setCurrentRouteId(null)
      setActiveTab('details')
      setErrors({}) // Clear errors after successful save
    } catch (error) {
      console.error('Error saving route:', error)
      setApiError(error.message)
    } finally {
      setLoading(false)
    }
  }
  const handleToggleStatus = async (routeId, currentStatus) => {
    try {
      setLoading(true)
      setApiError(null)

      // const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE"
      const route = routes.find(r => r.routeId === routeId)

      if (!route) {
        throw new Error('Route not found')
      }

      if (currentStatus === "ACTIVE") {
        await RouteService.deactivateRoute(routeId)
      } else if (currentStatus === "INACTIVE") {
        await RouteService.activateRoute(routeId)
      }

      setApiError(null)
      await loadRoutes()
      // Update route with new status
      // const updatedRouteData = {
      //   ...route,
      //   status: newStatus
      // }

      // const response = await RouteService.updateRoute(routeId, updatedRouteData)

      // if (response) {
      //   // Update local state
      //   setRoutes(prevRoutes =>
      //     prevRoutes.map(r =>
      //       r.routeId === routeId
      //         ? { ...r, status: newStatus }
      //         : r
      //     )
      //   )

      //   // Show success message
      //   setApiError(null)
      //   console.log(`Route ${newStatus.toLowerCase()} successfully`)
      // }
    } catch (error) {
      console.error('Error toggling route status:', error)
      setApiError(`Failed to ${currentStatus === "ACTIVE" ? "deactivate" : "activate"} route: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setEditRoute({ ...editRoute, [name]: value })
    setErrors({})

    // Clear error for this field when user starts typing
    // if (errors[name]) {
    //   setErrors({ ...errors, [name]: '' })
    // }
  }

  const toggleRouteSelection = (routeId) => {
    setSelectedRoutes((prev) =>
      prev.includes(routeId) ? prev.filter((id) => id !== routeId) : [...prev, routeId],
    )
  }

  const toggleAllRoutes = () => {
    setSelectedRoutes(selectedRoutes.length === routes.length ? [] : routes.map((route) => route.routeId))
  }

  const handleManageStations = (route) => {
    setEditRoute({ ...route })
    setCurrentRouteId(route.routeId)
    setCurrentRouteStations([...route.stations])
    setActiveTab('stations')
    setErrors({})
    setShowModal(true)
  }
  const addStationToRoute = () => {
    const newOrder = currentRouteStations.length + 1
    setCurrentRouteStations([
      ...currentRouteStations,
      { stationId: stations[0]?.stationId || 1, order: newOrder, distanceToNext: 0 }
    ])
    setErrors({})
  }

  const removeStationFromRoute = (index) => {
    const newStations = currentRouteStations.filter((_, i) => i !== index)
    // Update orders
    const updatedStations = newStations.map((station, i) => ({
      ...station,
      order: i + 1
    }))
    setCurrentRouteStations(updatedStations)
    setErrors({})
  }
  const updateStationInRoute = (index, field, value) => {
    const updated = [...currentRouteStations]
    if (field === 'stationId') {
      updated[index] = { ...updated[index], stationId: parseInt(value) }
    } else if (field === 'distanceToNext') {
      updated[index] = { ...updated[index], distanceToNext: parseFloat(value) || 0 }
    }
    setCurrentRouteStations(updated)
    setErrors({})
  }

  const moveStation = (index, direction) => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === currentRouteStations.length - 1)) {
      return
    }

    const newStations = [...currentRouteStations];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    // Swap stations
    [newStations[index], newStations[targetIndex]] = [newStations[targetIndex], newStations[index]];    // Update orders
    newStations.forEach((station, i) => {
      station.order = i + 1
    })

    setCurrentRouteStations(newStations)
  }

  const saveStations = async () => {
    // Update the edit route with current stations for validation
    setEditRoute(prev => ({ ...prev, stations: currentRouteStations }))

    if (currentRouteId && currentRouteStations.length > 0) {
      try {
        setLoading(true)
        setApiError(null)
        await RouteService.updateRouteStations(currentRouteId, currentRouteStations)
        await loadRoutes() // Reload routes to get updated data
      } catch (error) {
        console.error('Error saving stations:', error)
        setApiError(error.message)
      } finally {
        setLoading(false)
      }
    }
  }

  const stationLookup = stations.reduce((acc, station) => {
    acc[station.stationId] = station.stationName;
    return acc;
  }, {});

  const getStationNameById = (stationId) => {
    return stationLookup[stationId] || 'Unknown Station';
  }

  const activeRoutes = routes.filter((r) => r.status === "ACTIVE").length
  const inactiveRoutes = routes.filter((r) => r.status === "INACTIVE").length

  const isValidRoute = () => {
    // Check if at least 2 stations
    if (currentRouteStations.length < 2) {
      return false;
    }

    // Check if total distance is greater than 0
    const totalDistance = currentRouteStations.reduce((sum, station) => sum + (station.distanceToNext || 0), 0);
    if (totalDistance <= 0) {
      return false;
    }

    // Check if any two consecutive stations are the same
    for (let i = 0; i < currentRouteStations.length - 1; i++) {
      if (currentRouteStations[i].stationId === currentRouteStations[i + 1].stationId) {
        return false;
      }
    }

    return true;
  }

  return (
    <div className="route-manager">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h3 mb-1 text-dark fw-bold">Route Management</h2>
          <p className="text-muted mb-0">Manage your metro routes and their station configurations</p>
        </div>
        <button
          onClick={() => handleEditOrAdd()}
          className="btn btn-primary d-flex align-items-center gap-2 px-4 py-2 shadow-sm"
          style={{ borderRadius: "8px" }}
        >
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
          </svg>
          Add Route        </button>
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Loading routes...</p>
        </div>
      )}

      {/* Error Alert */}
      {apiError && (
        <div className="alert alert-danger alert-dismissible fade show mb-4" role="alert">
          <div className="d-flex align-items-center">
            <svg width="16" height="16" fill="currentColor" className="text-danger me-2" viewBox="0 0 16 16">
              <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
            </svg>
            <span><strong>Error:</strong> {apiError}</span>
          </div>
          <button
            type="button"
            className="btn-close"
            onClick={() => setApiError(null)}
            aria-label="Close"
          ></button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: "12px" }}>
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1 small text-uppercase fw-medium">Total Routes</p>
                  <h3 className="mb-0 fw-bold text-dark">{routes.length}</h3>
                </div>
                <div className="bg-primary bg-opacity-10 p-3 rounded-3">
                  <svg width="24" height="24" fill="currentColor" className="text-primary" viewBox="0 0 16 16">
                    <path d="M2.5 3A1.5 1.5 0 0 0 1 4.5v.793c.026.009.051.02.076.032L7.674 8.51c.206.1.446.1.652 0l6.598-3.185A.755.755 0 0 1 15 5.293V4.5A1.5 1.5 0 0 0 13.5 3h-11Z" />
                    <path d="M15 6.954 8.978 9.86a2.25 2.25 0 0 1-1.956 0L1 6.954V11.5A1.5 1.5 0 0 0 2.5 13h11a1.5 1.5 0 0 0 1.5-1.5V6.954Z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: "12px" }}>
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1 small text-uppercase fw-medium">Active Routes</p>
                  <h3 className="mb-0 fw-bold text-success">{activeRoutes}</h3>
                </div>
                <div className="bg-success bg-opacity-10 p-3 rounded-3">
                  <svg width="24" height="24" fill="currentColor" className="text-success" viewBox="0 0 16 16">
                    <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* <div className="col-md-3 mb-3">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: "12px" }}>
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1 small text-uppercase fw-medium">Planning Routes</p>
                  <h3 className="mb-0 fw-bold text-warning">{planningRoutes}</h3>
                </div>
                <div className="bg-warning bg-opacity-10 p-3 rounded-3">
                  <svg width="24" height="24" fill="currentColor" className="text-warning" viewBox="0 0 16 16">
                    <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div> */}

        <div className="col-md-3 mb-3">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: "12px" }}>
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1 small text-uppercase fw-medium">Inactive Routes</p>
                  <h3 className="mb-0 fw-bold text-danger">{inactiveRoutes}</h3>
                </div>
                <div className="bg-danger bg-opacity-10 p-3 rounded-3">
                  <svg width="24" height="24" fill="currentColor" className="text-danger" viewBox="0 0 16 16">
                    <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Routes Table */}
      <div className="card border-0 shadow-sm" style={{ borderRadius: "12px" }}>
        <div className="card-header bg-white border-0 p-4" style={{ borderRadius: "12px 12px 0 0" }}>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0 fw-semibold">Routes List</h5>
            {selectedRoutes.length > 0 && (
              <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill">
                {selectedRoutes.length} selected
              </span>
            )}
          </div>
        </div>

        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="border-0 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedRoutes.length === routes.length && routes.length > 0}
                      onChange={toggleAllRoutes}
                      className="form-check-input"
                    />
                  </th>
                  <th className="border-0 px-4 py-3 fw-semibold text-dark">Route</th>
                  <th className="border-0 px-4 py-3 fw-semibold text-dark">Stations</th>
                  <th className="border-0 px-4 py-3 fw-semibold text-dark">Distance</th>
                  <th className="border-0 px-4 py-3 fw-semibold text-dark">Time</th>
                  <th className="border-0 px-4 py-3 fw-semibold text-dark">Status</th>
                  <th className="border-0 px-4 py-3 fw-semibold text-dark text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {routes.map((route) => (
                  <tr key={route.routeId}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedRoutes.includes(route.routeId)}
                        onChange={() => toggleRouteSelection(route.routeId)}
                        className="form-check-input"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="d-flex align-items-center">
                        <div
                          className="rounded-circle me-3"
                          style={{
                            width: "12px",
                            height: "12px",
                            backgroundColor: route.color,
                          }}
                        ></div>
                        <div style={{ flex: 1 }}>
                          <div className="fw-semibold text-dark">{route.routeName}</div>
                          <div className="text-muted small">{route.routeDescription}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge bg-secondary bg-opacity-10 text-secondary px-3 py-1 rounded-pill">
                        {route.stations.length} stations
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-muted">{route.totalDistance} km</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-muted">{route.estimatedDuration} min</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`badge px-3 py-1 rounded-pill ${route.status === "ACTIVE"
                          ? "bg-success bg-opacity-10 text-success"
                          : "bg-danger bg-opacity-10 text-danger"
                          }`}
                      >
                        {route.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-end">
                      <div className="d-flex justify-content-end gap-2">
                        {/* <button
                          onClick={() => handleManageStations(route)}
                          className="btn btn-sm btn-outline-info border-0"
                          title="Manage stations"
                        >
                          <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" />
                          </svg>
                        </button> */}
                        <button
                          onClick={() => handleEditOrAdd(route)}
                          className="btn btn-sm btn-outline-primary border-0"
                          title="Edit route"
                        >
                          <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708L10.5 8.207l-3-3L12.146.146zM11.207 9l-3-3L2.5 11.707V14.5a.5.5 0 0 0 .5.5h2.793L11.207 9z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleToggleStatus(route.routeId, route.status)}
                          className={`btn btn-sm border-0 ${route.status === "ACTIVE"
                            ? "btn-outline-warning"
                            : "btn-outline-success"
                            }`}
                          title={route.status === "ACTIVE" ? "Deactivate route" : "Activate route"}
                        >
                          {route.status === "ACTIVE" ? (
                            <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                              <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
                              <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" />
                            </svg>
                          ) : (
                            <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                              <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-4 py-3 border-top bg-light d-flex justify-content-between align-items-center">
            <small className="text-muted">
              Showing 1-{routes.length} of {routes.length} routes
            </small>
            <small className="text-muted">Rows per page: 5</small>
          </div>
        </div>
      </div>
      {/* Combined Edit/Add Route and Station Management Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "12px" }}>
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">
                  {editRoute?.routeId ? "Edit Route" : "Add New Route"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowModal(false)
                    setEditRoute(null)
                    setCurrentRouteStations([])
                    setCurrentRouteId(null)
                    setActiveTab('details')
                    setErrors({})
                  }}
                ></button>
              </div>

              {/* Tab Navigation */}
              <div className="px-4">
                <ul className="nav nav-tabs border-0">
                  <li className="nav-item">
                    <button
                      className={`nav-link ${activeTab === 'details' ? 'active' : ''} border-0 fw-semibold`}
                      onClick={() => setActiveTab('details')}
                      style={{
                        borderRadius: "8px 8px 0 0",
                        backgroundColor: activeTab === 'details' ? '#f8f9fa' : 'transparent'
                      }}
                    >
                      <svg width="16" height="16" fill="currentColor" className="me-2" viewBox="0 0 16 16">
                        <path d="M1 2.828c.885-.37 2.154-.769 3.388-.893 1.33-.134 2.458.063 3.112.752v9.746c-.935-.53-2.12-.603-3.213-.493-1.18.12-2.37.461-3.287.811V2.828zm7.5-.141c.654-.689 1.782-.886 3.112-.752 1.234.124 2.503.523 3.388.893v9.923c-.918-.35-2.107-.692-3.287-.81-1.094-.111-2.278-.039-3.213.492V2.687zM8 1.783C7.015.936 5.587.81 4.287.94c-1.514.153-3.042.672-3.994 1.105A.5.5 0 0 0 0 2.5v11a.5.5 0 0 0 .707.455c.882-.4 2.303-.881 3.68-1.02 1.409-.142 2.59.087 3.223.877a.5.5 0 0 0 .78 0c.633-.79 1.814-1.019 3.222-.877 1.378.139 2.8.62 3.681 1.02A.5.5 0 0 0 16 13.5v-11a.5.5 0 0 0-.293-.455c-.952-.433-2.48-.952-3.994-1.105C10.413.809 8.985.936 8 1.783z" />
                      </svg>
                      Route Details
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link ${activeTab === 'stations' ? 'active' : ''} border-0 fw-semibold`}
                      onClick={() => setActiveTab('stations')}
                      style={{
                        borderRadius: "8px 8px 0 0",
                        backgroundColor: activeTab === 'stations' ? '#f8f9fa' : 'transparent'
                      }}
                    >
                      <svg width="16" height="16" fill="currentColor" className="me-2" viewBox="0 0 16 16">
                        <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" />
                      </svg>
                      Stations ({currentRouteStations.length})
                      {!editRoute?.routeId && currentRouteStations.length < 2 && (
                        <span className="badge bg-danger ms-1">!</span>
                      )}
                    </button>
                  </li>
                </ul>
              </div>
              {/* Error Alert */}
              {Object.keys(errors).length > 0 && (
                <div className="alert alert-danger mx-4 mb-0" role="alert">
                  <div className="d-flex align-items-center">
                    <svg width="16" height="16" fill="currentColor" className="text-danger me-2" viewBox="0 0 16 16">
                      <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
                    </svg>
                    <span className="fw-semibold">Please fix these {Object.keys(errors).length} errors:</span>
                  </div>
                  <ul className="mb-0 mt-2">
                    {Object.entries(errors).map(([field, message]) => (
                      <li key={field}>{message}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="modal-body p-4" style={{ backgroundColor: '#f8f9fa' }}>
                {/* Route Details Tab */}
                {activeTab === 'details' && (
                  <div className="bg-white p-4 rounded-3 shadow-sm">
                    <h6 className="mb-3 fw-bold text-dark">Route Information</h6>
                    <div className="row g-3">
                      <div className="col-md-6" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                        <label className="form-label fw-semibold text-dark">Route Name</label>
                        <input
                          type="text"
                          name="routeName"
                          value={editRoute?.routeName || ""}
                          onChange={handleInputChange}
                          placeholder="Enter route name"
                          className={`form-control ${errors.routeName ? 'is-invalid' : ''}`}
                          style={{ borderRadius: "8px", border: "1px solid #ced4da" }}
                        />
                        {errors.routeName && <div className="invalid-feedback d-block">{errors.routeName}</div>}
                      </div>
                      <div className="col-md-6" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                        <label style={{ alignSelf: "start" }} className="form-label fw-semibold text-dark">Color</label>
                        <input
                          type="color"
                          name="color"
                          value={editRoute?.color || "#007bff"}
                          onChange={handleInputChange}
                          className="form-control form-control-color"
                          style={{ borderRadius: "8px", display: "inline-block", width: "100%" }}
                        />
                      </div>
                      <div className="col-12" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                        <label className="form-label fw-semibold text-dark">Description</label>
                        <textarea
                          name="routeDescription"
                          value={editRoute?.routeDescription || ""}
                          onChange={handleInputChange}
                          placeholder="Enter route description"
                          className={`form-control ${errors.routeDescription ? 'is-invalid' : ''}`}
                          rows="3"
                          style={{ borderRadius: "8px", border: "1px solid #ced4da" }}
                        />
                        {errors.routeDescription && <div className="invalid-feedback d-block">{errors.routeDescription}</div>}
                      </div>

                      {/* {editRoute?.routeId && (
                        <div className="col-md-6" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                          <label className="form-label fw-semibold text-dark">Total Distance (km)</label>
                          <input
                            type="number"
                            name="totalDistance"
                            value={editRoute?.totalDistance || ""}
                            onChange={handleInputChange}
                            placeholder="0.0"
                            step="0.1"
                            className={`form-control ${errors.totalDistance ? 'is-invalid' : ''}`}
                            style={{ borderRadius: "8px", border: "1px solid #ced4da" }}
                          />
                          {errors.totalDistance && <div className="invalid-feedback d-block">{errors.totalDistance}</div>}
                        </div>
                      )} */}

                      <div className="col-md-6" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                        <label className="form-label fw-semibold text-dark">Estimated Time (minutes)</label>
                        <input
                          type="number"
                          name="estimatedDuration"
                          value={editRoute?.estimatedDuration || ""}
                          onChange={handleInputChange}
                          placeholder="0"
                          min="1"
                          className={`form-control ${errors.estimatedDuration ? 'is-invalid' : ''}`}
                          style={{ borderRadius: "8px", border: "1px solid #ced4da" }}
                        />
                        {errors.estimatedDuration && <div className="invalid-feedback d-block">{errors.estimatedDuration}</div>}
                      </div>
                      <div className="col-md-6" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                        <label className="form-label fw-semibold text-dark">Operating Hours</label>
                        <input
                          type="text"
                          name="operatingHours"
                          value={editRoute?.operatingHours || ""}
                          onChange={handleInputChange}
                          placeholder="05:00 - 23:00"
                          className={`form-control ${errors.operatingHours ? 'is-invalid' : ''}`}
                          style={{ borderRadius: "8px", border: "1px solid #ced4da" }}
                        />
                        {errors.operatingHours && <div className="invalid-feedback d-block">{errors.operatingHours}</div>}
                      </div>
                      <div className="col-md-6" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                        <label className="form-label fw-semibold text-dark">Frequency Minutes</label>
                        <input
                          type="number"
                          name="frequencyMinutes"
                          value={editRoute?.frequencyMinutes || ""}
                          onChange={handleInputChange}
                          placeholder="0"
                          min="1"
                          className={`form-control ${errors.frequencyMinutes ? 'is-invalid' : ''}`}
                          style={{ borderRadius: "8px", border: "1px solid #ced4da" }}
                        />
                        {errors.frequencyMinutes && <div className="invalid-feedback d-block">{errors.frequencyMinutes}</div>}
                      </div>
                      <div className="col-md-6" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                        <label className="form-label fw-semibold text-dark">Ticket Rule</label>
                        <select
                          name="ruleId"
                          value={editRoute?.ruleId || (ticketRules.length > 0 ? ticketRules[0].ruleId : 1)}
                          onChange={handleInputChange}
                          className="form-select"
                          style={{ borderRadius: "8px", border: "1px solid #ced4da" }}
                        >
                          {ticketRules.map(rule => (
                            <option key={rule.ruleId} value={rule.ruleId}>
                              {rule.ruleName} ({rule.basePrice?.toLocaleString()} VND)
                            </option>
                          ))}
                          {ticketRules.length === 0 && (
                            <option value={null}>--No available ticket rule yet--</option>
                          )}
                        </select>
                        {errors.ruleId && <div className="invalid-feedback d-block">{errors.ruleId}</div>}
                      </div>
                      {/* <div className="col-md-6" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                        <label className="form-label fw-semibold text-dark">Status</label>
                        <select
                          name="status"
                          value={editRoute?.status || "ACTIVE"}
                          onChange={handleInputChange}
                          className="form-select"
                          style={{ borderRadius: "8px", border: "1px solid #ced4da" }}
                        >
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="INACTIVE">INACTIVE</option>
                        </select>
                      </div> */}
                    </div>
                  </div>
                )}

                {/* Stations Tab */}
                {activeTab === 'stations' && (
                  <div className="bg-white p-4 rounded-3 shadow-sm">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="mb-0 fw-bold text-dark">Route Stations</h6>
                      <button
                        onClick={addStationToRoute}
                        className="btn btn-sm btn-primary"
                        style={{ borderRadius: "6px" }}
                      >
                        <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16" className="me-1">
                          <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
                        </svg>
                        Add Station
                      </button>
                    </div>

                    {!editRoute?.routeId && (
                      <div className="alert alert-info mb-3">
                        <div className="d-flex align-items-center">
                          <svg width="16" height="16" fill="currentColor" className="me-2" viewBox="0 0 16 16">
                            <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
                          </svg>
                          <strong>New Route:</strong> You must add at least 2 stations to create a new route.
                        </div>
                      </div>
                    )}

                    <div className="table-responsive">
                      <table className="table table-bordered">
                        <thead className="table-light">
                          <tr>
                            <th>Order</th>
                            <th>Station</th>
                            <th>Distance to Next (km)</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {console.log("Current Route Stations:", currentRouteStations)}
                          {currentRouteStations.map((routeStation, index) => (
                            <tr key={index}>
                              <td className="text-center fw-bold">{routeStation.order}</td>
                              <td>
                                <select
                                  value={routeStation.stationId}
                                  onChange={(e) => updateStationInRoute(index, 'stationId', e.target.value)}
                                  className="form-select form-select-sm"
                                >
                                  {stations.map(station => (
                                    <option key={station.stationId} value={station.stationId}>
                                      {station.stationName}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td>
                                <input
                                  type="number"
                                  value={index === currentRouteStations.length - 1 ? 0 : routeStation.distanceToNext === 0 ? null : routeStation.distanceToNext}
                                  onChange={(e) => updateStationInRoute(index, 'distanceToNext', e.target.value)}
                                  className="form-control form-control-sm"
                                  step="0.1"
                                  min="0"
                                  disabled={index === currentRouteStations.length - 1}
                                  placeholder={index === currentRouteStations.length - 1 ? "End point" : "0.0"}
                                />
                              </td>
                              <td>
                                <div className="d-flex gap-1">
                                  <button
                                    onClick={() => moveStation(index, 'up')}
                                    disabled={index === 0 || index === currentRouteStations.length - 1}
                                    className="btn btn-sm btn-outline-secondary"
                                    title="Move up"
                                  >
                                    <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                                      <path d="M8 12a.5.5 0 0 0 .5-.5V5.707l2.146 2.147a.5.5 0 0 0 .708-.708l-3-3a.5.5 0 0 0-.708 0l-3 3a.5.5 0 1 0 .708.708L7.5 5.707V11.5a.5.5 0 0 0 .5.5z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => moveStation(index, 'down')}
                                    disabled={index === currentRouteStations.length - 1 || index === currentRouteStations.length - 2}
                                    className="btn btn-sm btn-outline-secondary"
                                    title="Move down"
                                  >
                                    <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                                      <path d="M8 4a.5.5 0 0 0-.5.5v5.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V4.5A.5.5 0 0 0 8 4z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => removeStationFromRoute(index)}
                                    className="btn btn-sm btn-outline-danger"
                                    title="Remove station"
                                  >
                                    <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                                      <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {currentRouteStations.length === 0 && (
                            <tr>
                              <td colSpan="4" className="text-center text-muted py-4">
                                No stations added yet. Click "Add Station" to start building your route.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {currentRouteStations.length > 0 && (
                      <div className="mt-3 p-3 bg-light rounded">
                        <h6 className="mb-2">Route Summary</h6>
                        <div className="row">
                          <div className="col-md-4">
                            <small className="text-muted">Total Stations:</small>
                            <div className="fw-semibold">{currentRouteStations.length}</div>
                          </div>
                          <div className="col-md-4">
                            <small className="text-muted">Total Distance:</small>
                            <div className="fw-semibold">
                              {currentRouteStations.reduce((sum, station) => sum + station.distanceToNext, 0).toFixed(1)} km
                            </div>
                          </div>
                          <div className="col-md-4">
                            <small className="text-muted">Status:</small>
                            <div className={`fw-semibold ${isValidRoute() ? 'text-success' : 'text-danger'}`}>
                              {isValidRoute() ? '✓ Valid Route' : '⚠ Invalid Route'}
                            </div>
                          </div>
                        </div>
                        <div className="mt-2">
                          <small className="text-muted">Route Path:</small>
                          <div className="small">
                            {currentRouteStations.map((routeStation, index) => (
                              <span key={index}>
                                {getStationNameById(routeStation.stationId)}
                                {index < currentRouteStations.length - 1 && ' → '}
                              </span>
                            ))}
                          </div>
                        </div>
                        {errors.stations && <div className="invalid-feedback d-block mt-2">{errors.stations}</div>}
                        {errors.totalDistance && <div className="invalid-feedback d-block mt-1">{errors.totalDistance}</div>}
                      </div>
                    )}

                    {/* Show validation messages when no stations */}
                    {currentRouteStations.length === 0 && (
                      <div className="mt-3 p-3 bg-light rounded">
                        <div className="text-center text-muted">
                          <p className="mb-1">No stations added yet</p>
                          <small>A route must have at least 2 stations to be valid</small>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="modal-footer border-0 pt-0">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowModal(false)
                    setEditRoute(null)
                    setCurrentRouteStations([])
                    setCurrentRouteId(null)
                    setActiveTab('details')
                    setErrors({})
                  }}
                  style={{ borderRadius: "8px" }}
                >
                  Cancel
                </button>
                {/* <button
                  type="button"
                  className={`btn btn-primary ${Object.keys(errors).length > 0 ? 'disabled' : ''}`}
                  onClick={handleSave}
                  disabled={Object.keys(errors).length > 0}
                  style={{ borderRadius: "8px" }}
                >
                  {editRoute?.routeId ? "Save Route & Stations" : "Create Route & Stations"}
                </button> */}
                <Button
                  variant="primary"
                  onClick={handleSave}
                  disabled={Object.keys(errors).length > 0 || loading}
                  style={{ borderRadius: "8px" }}
                >
                  {
                    loading ? (
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"s
                      />
                    ) : ""
                  }

                  <span className={loading ? "visually-hidden" : ""}>
                    {editRoute?.routeId ? "Save Route & Stations" : "Create Route & Stations"}
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminRouteManager
