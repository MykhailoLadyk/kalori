import { supabase } from "./supabase";    


// converts a File object to base64 string
// FileReader is callback based so we wrap it in a Promise
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      // reader.result looks like:
      // "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAA..."
      //                         ↑ we only want this part
      const base64 = reader.result.split(",")[1];
      resolve(base64);
    };

    reader.onerror = () => reject(new Error("Failed to read image file"));

    reader.readAsDataURL(file);
  });
}

export default async function analyzeFoodImage(imageFile) {

  // convert file to base64 before sending
  const imageBase64 = await fileToBase64(imageFile);

  const { data, error } = await supabase.functions.invoke("analyze-food", {
    body: {
      imageBase64,
      mimeType: imageFile.type,   // "image/jpeg", "image/png", "image/webp"
    },
  });

  if (error) throw error;
  if (data.error) throw new Error(data.error);
console.log(data);
  return data;
}