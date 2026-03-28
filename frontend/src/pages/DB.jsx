import { Navigate } from "react-router-dom";

/** @deprecated `/manage` 로 통합됨 */
const DB = () => <Navigate to="/manage" replace />;

export default DB;
