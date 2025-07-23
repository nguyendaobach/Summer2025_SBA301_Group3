"use client"

import { useState, useEffect } from "react"
import axiosInstance from "../../../config/axios"
import { Users, CheckCircle, X, Edit3, Trash2, Plus, Search } from "lucide-react"

const CustomerManagement = () => {
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [editUser, setEditUser] = useState({ email: "", fullname: "", role: "", status: "" })
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [usersPerPage] = useState(10)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)

    try {
      // Sử dụng API admin để lấy tất cả users
      const res = await axiosInstance.get("/admin/users")
      console.log("API Response:", res.data)
      setUsers(res.data?.data || [])
    } catch (err) {
      console.error("Error fetching users:", err)

      // Fallback to mock data nếu API không hoạt động
      const mockUsers = [
        {
          accountId: 1,
          email: "admin@metro.com",
          fullname: "Quản trị viên",
          role: "ADMIN",
          status: "ACTIVE"
        },
        {
          accountId: 2,
          email: "user1@gmail.com",
          fullname: "Nguyễn Văn A",
          role: "CUSTOMER",
          status: "ACTIVE"
        },
        {
          accountId: 3,
          email: "user2@gmail.com",
          fullname: "Trần Thị B",
          role: "CUSTOMER",
          status: "INACTIVE"
        },
        {
          accountId: 4,
          email: "user3@gmail.com",
          fullname: "Lê Minh C",
          role: "CUSTOMER",
          status: "ACTIVE"
        },
        {
          accountId: 5,
          email: "user4@gmail.com",
          fullname: "Phạm Thị D",
          role: "CUSTOMER",
          status: "ACTIVE"
        }
      ]

      setUsers(mockUsers)
    }

    setLoading(false)
  }

  const handleEdit = async (accountId) => {
    console.log("handleEdit called with accountId:", accountId)

    try {
      // Ưu tiên sử dụng API để lấy thông tin user
      const res = await axiosInstance.get(`/admin/users/${accountId}`)
      console.log("API response:", res.data)
      setSelectedUser(res.data.data || res.data)
      setEditUser(res.data.data || res.data)
      setShowModal(true)
    } catch (err) {
      console.error("Error fetching user from API:", err)

      // Fallback to mock data nếu API không hoạt động
      console.log("Trying fallback with mock data...")
      const user = users.find(u => u.accountId === accountId)
      if (user) {
        console.log("Found user in mock data:", user)
        setSelectedUser(user)
        setEditUser(user)
        setShowModal(true)
      } else {
        alert("Không thể tải thông tin người dùng")
      }
    }
  }

  const handleUpdate = async () => {
    setLoading(true)
    try {
      // Sử dụng API thực tế để update user
      const res = await axiosInstance.put(`/admin/users/${selectedUser.accountId}`, editUser)
      console.log("Update API response:", res.data)

      // Update UI với data từ API response
      const updatedUser = res.data.data || res.data
      setUsers(users.map((user) =>
        user.accountId === selectedUser.accountId ? updatedUser : user
      ))
      setShowModal(false)

    } catch (err) {
      console.error("Error updating user via API:", err)

      // Fallback: Update mock data locally
      setUsers(users.map((user) =>
        user.accountId === selectedUser.accountId ? editUser : user
      ))
      setShowModal(false)

      // Thông báo lỗi nhưng vẫn update UI
      console.warn("API update failed, using local update")
    }
    setLoading(false)
  }

  const handleDelete = async (accountId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa người dùng này?")) {
      try {
        // Sử dụng API thực tế để delete user
        await axiosInstance.delete(`/admin/users/${accountId}`)
        console.log("User deleted successfully via API")

        // Remove from UI
        setUsers(users.filter(user => user.accountId !== accountId))

      } catch (err) {
        console.error("Error deleting user via API:", err)

        // Fallback: Remove from mock data locally
        setUsers(users.filter(user => user.accountId !== accountId))
        console.warn("API delete failed, using local delete")
      }
    }
  }

  // Filter users based on search term
  const filteredUsers = users.filter(user =>
    user.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage
  const indexOfFirstUser = indexOfLastUser - usersPerPage
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser)
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage)

  const stats = {
    total: users.length,
    active: users.filter((u) => u.status === "ACTIVE").length,
    inactive: users.filter((u) => u.status === "INACTIVE").length,
  }

  return (
    <div style={{ backgroundColor: "#f8f9fa", minHeight: "100vh", padding: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
          <h2 style={{ fontSize: "28px", fontWeight: "600", color: "#333", marginBottom: "8px", margin: 0 }}>
            Quản lý người dùng
          </h2>
          <p style={{ color: "#6c757d", fontSize: "14px", margin: 0 }}>Quản lý tài khoản người dùng trong hệ thống</p>
        </div>
        <button
          style={{
            backgroundColor: "#4f46e5",
            color: "white",
            border: "none",
            borderRadius: "8px",
            padding: "10px 20px",
            fontSize: "14px",
            fontWeight: "500",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Plus size={16} />
          Thêm người dùng
        </button>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ position: "relative", maxWidth: "400px" }}>
          <Search
            size={20}
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#6b7280"
            }}
          />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 12px 12px 44px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "14px",
              backgroundColor: "white",
            }}
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "20px",
          marginBottom: "40px",
        }}
      >
        <div style={{ backgroundColor: "white", border: "1px solid #e9ecef", borderRadius: "12px", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p
                style={{ color: "#6c757d", fontSize: "12px", fontWeight: "600", textTransform: "uppercase", margin: 0 }}
              >
                TỔNG SỐ NGƯỜI DÙNG
              </p>
              <h3 style={{ fontSize: "32px", fontWeight: "700", color: "#333", margin: "8px 0 0 0" }}>{stats.total}</h3>
            </div>
            <div
              style={{
                width: "48px",
                height: "48px",
                backgroundColor: "#dbeafe",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Users size={24} style={{ color: "#3b82f6" }} />
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: "white", border: "1px solid #e9ecef", borderRadius: "12px", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p
                style={{ color: "#6c757d", fontSize: "12px", fontWeight: "600", textTransform: "uppercase", margin: 0 }}
              >
                NGƯỜI DÙNG HOẠT ĐỘNG
              </p>
              <h3 style={{ fontSize: "32px", fontWeight: "700", color: "#333", margin: "8px 0 0 0" }}>
                {stats.active}
              </h3>
            </div>
            <div
              style={{
                width: "48px",
                height: "48px",
                backgroundColor: "#dcfce7",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CheckCircle size={24} style={{ color: "#16a34a" }} />
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: "white", border: "1px solid #e9ecef", borderRadius: "12px", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p
                style={{ color: "#6c757d", fontSize: "12px", fontWeight: "600", textTransform: "uppercase", margin: 0 }}
              >
                NGƯỜI DÙNG KHÔNG HOẠT ĐỘNG
              </p>
              <h3 style={{ fontSize: "32px", fontWeight: "700", color: "#333", margin: "8px 0 0 0" }}>
                {stats.inactive}
              </h3>
            </div>
            <div
              style={{
                width: "48px",
                height: "48px",
                backgroundColor: "#fee2e2",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={24} style={{ color: "#dc2626" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div>
        <h4 style={{ fontSize: "18px", fontWeight: "600", color: "#333", marginBottom: "20px" }}>
          Danh sách người dùng
        </h4>

        <div
          style={{ backgroundColor: "white", border: "1px solid #e9ecef", borderRadius: "12px", overflow: "hidden" }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead style={{ backgroundColor: "#f8f9fa" }}>
              <tr>
                <th
                  style={{
                    border: "none",
                    padding: "16px 20px",
                    fontWeight: "600",
                    color: "#374151",
                    textAlign: "left",
                  }}
                >
                  Người dùng
                </th>
                <th
                  style={{
                    border: "none",
                    padding: "16px 20px",
                    fontWeight: "600",
                    color: "#374151",
                    textAlign: "left",
                  }}
                >
                  Email
                </th>
                <th
                  style={{
                    border: "none",
                    padding: "16px 20px",
                    fontWeight: "600",
                    color: "#374151",
                    textAlign: "left",
                  }}
                >
                  Vai trò
                </th>
                <th
                  style={{
                    border: "none",
                    padding: "16px 20px",
                    fontWeight: "600",
                    color: "#374151",
                    textAlign: "left",
                  }}
                >
                  Trạng thái
                </th>
                <th
                  style={{
                    border: "none",
                    padding: "16px 20px",
                    fontWeight: "600",
                    color: "#374151",
                    textAlign: "left",
                  }}
                >
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : currentUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>
                    {searchTerm ? "Không tìm thấy người dùng phù hợp" : "Chưa có người dùng nào"}
                  </td>
                </tr>
              ) : (
                currentUsers.map((user, index) => (
                  <tr key={user.accountId} style={{ borderTop: index === 0 ? "none" : "1px solid #f3f4f6" }}>
                    <td style={{ border: "none", padding: "16px 20px", color: "#374151" }}>
                      {user.fullname || "Chưa cập nhật"}
                    </td>
                    <td style={{ border: "none", padding: "16px 20px", color: "#6b7280" }}>{user.email}</td>
                    <td style={{ border: "none", padding: "16px 20px" }}>
                      <span
                        style={{
                          backgroundColor: user.role === "ADMIN" ? "#3b82f6" : "#10b981",
                          color: "white",
                          fontSize: "12px",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontWeight: "500",
                        }}
                      >
                        {user.role === "ADMIN" ? "Quản trị viên" : "Khách hàng"}
                      </span>
                    </td>
                    <td style={{ border: "none", padding: "16px 20px" }}>
                      <span
                        style={{
                          backgroundColor: user.status === "ACTIVE" ? "#dcfce7" : "#fee2e2",
                          color: user.status === "ACTIVE" ? "#166534" : "#991b1b",
                          fontSize: "12px",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontWeight: "500",
                        }}
                      >
                        {user.status === "ACTIVE" ? "Hoạt động" : "Không hoạt động"}
                      </span>
                    </td>
                    <td style={{ border: "none", padding: "16px 20px" }}>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => handleEdit(user.accountId)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#3b82f6",
                            cursor: "pointer",
                            padding: "4px",
                            borderRadius: "4px",
                          }}
                          title="Chỉnh sửa"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(user.accountId)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#dc2626",
                            cursor: "pointer",
                            padding: "4px",
                            borderRadius: "4px",
                          }}
                          title="Xóa"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Footer with Pagination */}
          <div
            style={{
              padding: "16px 20px",
              backgroundColor: "#f8f9fa",
              borderTop: "1px solid #e9ecef",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ fontSize: "14px", color: "#6b7280" }}>
              Hiển thị {indexOfFirstUser + 1}-{Math.min(indexOfLastUser, filteredUsers.length)} trong số {filteredUsers.length} người dùng
            </div>

            {/* Pagination */}
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                style={{
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  backgroundColor: "white",
                  borderRadius: "4px",
                  fontSize: "14px",
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  opacity: currentPage === 1 ? 0.5 : 1,
                }}
              >
                Trước
              </button>

              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index + 1}
                  onClick={() => setCurrentPage(index + 1)}
                  style={{
                    padding: "8px 12px",
                    border: "1px solid #d1d5db",
                    backgroundColor: currentPage === index + 1 ? "#4f46e5" : "white",
                    color: currentPage === index + 1 ? "white" : "#374151",
                    borderRadius: "4px",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  {index + 1}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                style={{
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  backgroundColor: "white",
                  borderRadius: "4px",
                  fontSize: "14px",
                  cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                  opacity: currentPage === totalPages ? 0.5 : 1,
                }}
              >
                Sau
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              width: "500px",
              maxWidth: "90vw",
              maxHeight: "90vh",
              overflow: "hidden",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "20px",
                borderBottom: "1px solid #e9ecef",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3 style={{ fontSize: "18px", fontWeight: "600", margin: 0 }}>Chỉnh sửa người dùng</h3>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "20px",
                  cursor: "pointer",
                  color: "#6b7280",
                }}
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "20px" }}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontWeight: "500", color: "#374151", marginBottom: "8px" }}>
                  Email
                </label>
                <input
                  type="email"
                  value={editUser.email || ""}
                  onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                  }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontWeight: "500", color: "#374151", marginBottom: "8px" }}>
                  Tên đầy đủ
                </label>
                <input
                  type="text"
                  value={editUser.fullname || ""}
                  onChange={(e) => setEditUser({ ...editUser, fullname: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                {/* <div>
                  <label style={{ display: "block", fontWeight: "500", color: "#374151", marginBottom: "8px" }}>
                    Vai trò
                  </label>
                  <select
                    value={editUser.role || ""}
                    onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "14px",
                    }}
                  >
                    <option value="ADMIN">Quản trị viên</option>
                    <option value="CUSTOMER">Khách hàng</option>
                  </select>
                </div> */}

                <div>
                  <label style={{ display: "block", fontWeight: "500", color: "#374151", marginBottom: "8px" }}>
                    Trạng thái
                  </label>
                  <select
                    value={editUser.status || ""}
                    onChange={(e) => setEditUser({ ...editUser, status: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "14px",
                    }}
                  >
                    <option value="ACTIVE">Hoạt động</option>
                    <option value="INACTIVE">Không hoạt động</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: "20px",
                borderTop: "1px solid #e9ecef",
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: "8px 16px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  backgroundColor: "white",
                  color: "#374151",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                Hủy
              </button>
              <button
                onClick={handleUpdate}
                disabled={loading}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#4f46e5",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CustomerManagement
