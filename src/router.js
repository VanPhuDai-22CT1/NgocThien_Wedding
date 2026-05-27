import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ROUTERS } from "./utils/router";
import { getAuthItem } from "utils/authStorage";
import MasterLayout from "./pages/users/theme/masterLayuot";

// ===== USER =====
import Homepage from "./pages/users/trangchu";
import DangNhap from "./pages/users/dangnhap";
import DangKy from "./pages/users/dangky";
import QuenMatKhau from "./pages/users/quenmatkhau";
import DatLaiMatKhau from "./pages/users/datlaimatkhau";
import ProductsPage from "./pages/users/sanpham";
import ProductDetailPage from "./pages/users/chitietsanpham";
import GioHang from "./pages/users/giohang";
import TrangThongTin from "./pages/users/trangthongtin";
import GioiThieu from "./pages/users/gioithieu";
import DatHang from "./pages/users/dathang";
import DonHang from "./pages/users/donhang";
import ThongBao from "./pages/users/thongbao";
import ThanhToan from "./pages/users/thanhtoan";
import HoaDon from "./pages/users/hoadon";
import CoderProfilePage from "./pages/users/hosocode";

// ===== ADMIN =====
import Dashboard from "./pages/admin/dashboard";
import OrderManagement from "./pages/admin/qldonhang";
import UserList from "./pages/admin/qlnguoidung";
import ProductManagement from "./pages/admin/qlsanpham";
import HomeImageManagement from "./pages/admin/qlhinhanh";
import QLHoatDong from "./pages/admin/QLHoatDong";
import Notification from "./pages/admin/thongbaoad";
import AdminChat from "./pages/admin/adminchat";
import WorkScheduleManagement from "./pages/admin/lichlamviec";
import Statistics from "./pages/admin/thongke";

const UserWheelScrollBridge = ({ children }) => {
  useEffect(() => {
    const handleWheel = (e) => {
      if (e.ctrlKey) return;

      const deltaY =
        e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;

      e.preventDefault();
      window.scrollBy({ top: deltaY, behavior: "auto" });
    };

    window.addEventListener("wheel", handleWheel, {
      passive: false,
      capture: true,
    });

    return () => {
      window.removeEventListener("wheel", handleWheel, {
        capture: true,
      });
    };
  }, []);

  return <>{children}</>;
};

const isAdminHost = typeof window !== "undefined" && window.location.port === "3001";
const userOrigin = process.env.REACT_APP_USER_URL || "http://localhost:3000";
const adminOrigin = process.env.REACT_APP_ADMIN_URL || "http://localhost:3001";

const UserLanding = () => {
  const role = getAuthItem("role");

  useEffect(() => {
    if (role === "admin") {
      window.location.replace(`${adminOrigin}/`);
    }
  }, [role]);

  if (role === "admin") {
    return null;
  }

  return <Homepage />;
};

const AdminLanding = () => {
  const role = getAuthItem("role");

  useEffect(() => {
    if (role && role !== "admin") {
      window.location.replace(`${userOrigin}/`);
    }
  }, [role]);

  if (role && role !== "admin") {
    return null;
  }

  return role === "admin" ? <Dashboard /> : <DangNhap />;
};

const RouterCustom = () => {
  const userRouters = [
    { path: ROUTERS.USER.HOME, element: <UserLanding /> },
    { path: ROUTERS.USER.LOGIN, element: <DangNhap /> },
    { path: ROUTERS.USER.Register, element: <DangKy /> },
    { path: ROUTERS.USER.FORGOT, element: <QuenMatKhau /> },
    { path: ROUTERS.USER.RESET, element: <DatLaiMatKhau /> },
    { path: ROUTERS.USER.ProductsPage, element: <ProductsPage /> },
    { path: "/chitietsanpham/:id", element: <ProductDetailPage /> },
    { path: ROUTERS.USER.PROFILE, element: <GioHang /> },
    { path: ROUTERS.USER.CustomerInfo, element: <TrangThongTin /> },
    { path: ROUTERS.USER.FreshVeggiesShop, element: <GioiThieu /> },
    { path: ROUTERS.USER.OrderPage, element: <DatHang /> },
    { path: ROUTERS.USER.Payment, element: <ThanhToan /> },

    // 🔥 HÓA ĐƠN (không dùng layout)
    { path: "/hoadon/:id", element: <HoaDon />, noLayout: true },

    { path: ROUTERS.USER.OrderDetail, element: <DonHang /> },
    { path: ROUTERS.USER.Notification, element: <ThongBao /> },
  ];

  const adminRouters = [
    { path: "/", element: <AdminLanding /> },
    { path: ROUTERS.USER.LOGIN, element: <DangNhap /> },
    { path: ROUTERS.ADMIN.Dashboard, element: <Dashboard /> },
    { path: ROUTERS.ADMIN.OrderManagement, element: <OrderManagement /> },
    { path: ROUTERS.ADMIN.UserList, element: <UserList /> },
    { path: ROUTERS.ADMIN.ProductManagement, element: <ProductManagement /> },
    { path: ROUTERS.ADMIN.HomeImageManagement, element: <HomeImageManagement /> },
    { path: ROUTERS.ADMIN.WorkSchedule, element: <WorkScheduleManagement /> },
    { path: ROUTERS.ADMIN.Activity, element: <QLHoatDong /> },
    { path: ROUTERS.ADMIN.ChatManagement, element: <AdminChat /> },
    { path: ROUTERS.ADMIN.Statistics, element: <Statistics /> },
    { path: ROUTERS.ADMIN.CoderProfile, element: <CoderProfilePage /> },
    { path: "/chatadmin", element: <AdminChat /> },
    { path: "/notification", element: <Notification /> },
  ];

  const activeRouters = isAdminHost ? adminRouters : userRouters;

  const renderRouteElement = (item) => {
    if (isAdminHost) {
      return item.element;
    }

    return item.noLayout ||
      item.path === ROUTERS.USER.LOGIN ||
      item.path === ROUTERS.USER.Register ||
      item.path === ROUTERS.USER.FORGOT ||
      item.path === ROUTERS.USER.RESET
      ? item.element
      : <MasterLayout>{item.element}</MasterLayout>;
  };

  return (
    <Routes>
      {activeRouters.map((item, index) => (
        <Route
          key={index}
          path={item.path}
          element={
            isAdminHost ? (
              item.element
            ) : (
              <UserWheelScrollBridge>
                {renderRouteElement(item)}
              </UserWheelScrollBridge>
            )
          }
        />
      ))}

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default RouterCustom;