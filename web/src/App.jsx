import { useState } from "react";
import "./App.css";
import { searchFoods, scaleNutrients } from "./services/getUSDA";
import analyzeFood from "./services/analyzeFood";
import analyzeFoodDesc from "./services/analyzeFoodDesc";
function App() {
  const [foodImage, setFoodImage] = useState(null);
  const [foodInput, setFoodInput] = useState("");
  async function food(input) {
    const foods = await searchFoods(input);
    console.log(
      foods,
      "Search results:",
      scaleNutrients(foods[0].nutrients, foods[0].servingSize, 150),
    );
  }
  return (
    <>
      <h1>Kalori</h1>
      <div className="card">
        <input
          type="text"
          placeholder="give food name"
          value={foodInput}
          onChange={(e) => {
            setFoodInput(e.target.value);
          }}
        />
        <input
          type="file"
          accept="image/*"
          placeholder="give food name"
          onChange={(e) => {
            const file = e.target.files[0];
            if (!file) return;
            setFoodImage(file);
          }}
        />
        <button onClick={() => analyzeFood(foodImage)}>Photo analyze</button>
        <button onClick={() => analyzeFoodDesc(foodInput)}>Desc analyze</button>
        <button onClick={() => food(foodInput)}>OpenFood Facts</button>
      </div>
    </>
  );
}

export default App;
