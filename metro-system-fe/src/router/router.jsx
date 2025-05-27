import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import Home from "../pages/home/home";
import TicketSearchOverview from "../components/ticket-search/TicketSearchOverview";

import PassengerPage from "../pages/passenger/passenger-page";
import DashboardLayout from "../pages/dashboard/dashboard-layout";
import CustomerDashboard from "../pages/dashboard/customer/customer-dashboard";
const router = createBrowserRouter([
    {
        path: "/",
        element: <App/>,
        children: [
            {
                index: true,
                element: <Home/>
            },
            {
                path: "tickets",
                element: <TicketSearchOverview/>
            },
            {
                path: "passenger",
                element: <PassengerPage/>
            }
        ]
    },
    {
        path: "/dashboard",
        element: <DashboardLayout/>,
        children: [
            {
                path: "customers",
                element: <CustomerDashboard/>
            }
        ]
    }
])
export default router;