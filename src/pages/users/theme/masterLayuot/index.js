import React, { memo } from "react";
import Header from "../header";
import Footer from "../footer";

const MasterLayout = ({ children, ...props }) => {
    return (
        <div className="master-layout" {...props}   >
            <Header />
            <main className="user-main-content">{children}</main>
            <Footer />
        </div>
    );
};

export default memo(MasterLayout);
