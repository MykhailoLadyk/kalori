// App will have all context providers. will also have all the pages and currentPage state. navbar always visible at the bottom
import { useState } from "react";
import "./App.css";
function App() {
  const [currentPage, setCurrentPage] = useState("home");
  const pages = {};
  return <h1>Kalori</h1>;
}

export default App;
