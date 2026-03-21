import { supabase } from "./supabase";

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const base64 = reader.result.split(",")[1];
      resolve(base64);
    };

    reader.onerror = () => reject(new Error("Failed to read image file"));

    reader.readAsDataURL(file);
  });
}

export default async function analyzeFoodImage(imageFile) {
  const imageBase64 = await fileToBase64(imageFile);

  const { data, error } = await supabase.functions.invoke("analyze-food", {
    body: {
      imageBase64,
      mimeType: imageFile.type,
    },
  });

  if (error) throw error;
  if (data.error) throw new Error(data.error);
  console.log(data);
  return data;
}
