import PublicLayout from "../components/layouts/(public)/PublicLayout";

import Home from "../app/(public)/Home/Home";
import Login from "../app/(public)/Auth/Login";
import Me from "../app/(user)/Me/Me";

const routes = [
  {
    path: "/",
    element: <PublicLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: "login", element: <Login /> },
      { path: "me", element: <Me /> },
    ],
  }
];

export default routes;