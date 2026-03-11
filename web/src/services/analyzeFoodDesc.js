import { supabase } from "./supabase";    


export default async function analyzeFoodImage(description) {

  const { data, error } = await supabase.functions.invoke("analyze-food-desc", {
    body: {
      description: description
    },
  });

  if (error) throw error;
  if (data.error) throw new Error(data.error);
console.log(data);
  return data;
}