import PublicLayout from "../components/layouts/(public)/PublicLayout";

import Home from "../app/(public)/Home/Home";

const routes = [
  {
    path: "/",
    element: <PublicLayout />,
    children: [
      { index: true, element: <Home /> },

    ],
  }
];

export default routes;