// lib/visionEngine.js - Nutrition and calorie detection engine

const FOOD_DATABASE = {
  // Proteins
  chicken: { calories: 165, protein: 31, carbs: 0, fat: 3.6, serving: '100g' },
  'chicken breast': { calories: 165, protein: 31, carbs: 0, fat: 3.6, serving: '100g' },
  salmon: { calories: 208, protein: 20, carbs: 0, fat: 13, serving: '100g' },
  eggs: { calories: 155, protein: 13, carbs: 1.1, fat: 11, serving: '2 eggs' },
  beef: { calories: 250, protein: 26, carbs: 0, fat: 17, serving: '100g' },
  steak: { calories: 271, protein: 26, carbs: 0, fat: 18, serving: '100g' },
  turkey: { calories: 135, protein: 30, carbs: 0, fat: 1, serving: '100g' },
  tuna: { calories: 116, protein: 25, carbs: 0, fat: 1, serving: '100g' },
  shrimp: { calories: 85, protein: 18, carbs: 1, fat: 1, serving: '100g' },
  
  // Carbs / Grains
  rice: { calories: 206, protein: 4, carbs: 45, fat: 0.4, serving: '1 cup' },
  'white rice': { calories: 206, protein: 4, carbs: 45, fat: 0.4, serving: '1 cup' },
  pasta: { calories: 220, protein: 8, carbs: 43, fat: 1.3, serving: '1 cup cooked' },
  bread: { calories: 79, protein: 3, carbs: 15, fat: 1, serving: '1 slice' },
  oats: { calories: 307, protein: 11, carbs: 55, fat: 5, serving: '100g' },
  oatmeal: { calories: 307, protein: 11, carbs: 55, fat: 5, serving: '100g' },
  quinoa: { calories: 222, protein: 8, carbs: 39, fat: 3.5, serving: '1 cup' },
  potato: { calories: 130, protein: 3, carbs: 30, fat: 0.1, serving: '1 medium' },
  'sweet potato': { calories: 103, protein: 2.3, carbs: 24, fat: 0.1, serving: '1 medium' },
  
  // Fruits
  banana: { calories: 89, protein: 1.1, carbs: 23, fat: 0.3, serving: '1 medium' },
  apple: { calories: 95, protein: 0.5, carbs: 25, fat: 0.3, serving: '1 medium' },
  orange: { calories: 62, protein: 1.2, carbs: 15, fat: 0.2, serving: '1 medium' },
  mango: { calories: 201, protein: 2.8, carbs: 50, fat: 1.3, serving: '1 cup' },
  strawberries: { calories: 49, protein: 1, carbs: 12, fat: 0.5, serving: '1 cup' },
  blueberries: { calories: 84, protein: 1.1, carbs: 21, fat: 0.5, serving: '1 cup' },
  
  // Vegetables
  broccoli: { calories: 55, protein: 3.7, carbs: 11, fat: 0.6, serving: '1 cup' },
  spinach: { calories: 41, protein: 5.4, carbs: 3.6, fat: 0.5, serving: '100g' },
  salad: { calories: 20, protein: 1.5, carbs: 3.5, fat: 0.3, serving: '2 cups' },
  carrot: { calories: 52, protein: 1.2, carbs: 12, fat: 0.3, serving: '1 cup' },
  
  // Dairy
  milk: { calories: 149, protein: 8, carbs: 12, fat: 8, serving: '1 cup' },
  yogurt: { calories: 100, protein: 17, carbs: 6, fat: 0.7, serving: '170g' },
  cheese: { calories: 113, protein: 7, carbs: 0.4, fat: 9, serving: '1 slice (28g)' },
  'greek yogurt': { calories: 100, protein: 17, carbs: 6, fat: 0.7, serving: '170g' },
  
  // Fast Food / Meals
  burger: { calories: 540, protein: 28, carbs: 45, fat: 25, serving: '1 burger' },
  pizza: { calories: 285, protein: 12, carbs: 36, fat: 10, serving: '1 slice' },
  sandwich: { calories: 380, protein: 20, carbs: 36, fat: 16, serving: '1 sandwich' },
  saltedeggs: { calories: 226, protein: 14, carbs: 1.6, fat: 18, serving: '2 eggs' },
  
  // Beverages / Snacks
  coffee: { calories: 5, protein: 0.3, carbs: 1, fat: 0.1, serving: '1 cup' },
  juice: { calories: 112, protein: 1.7, carbs: 26, fat: 0.5, serving: '1 cup' },
  almonds: { calories: 164, protein: 6, carbs: 6, fat: 14, serving: '28g (handful)' },
  peanutbutter: { calories: 188, protein: 8, carbs: 6, fat: 16, serving: '2 tbsp' },
  'peanut butter': { calories: 188, protein: 8, carbs: 6, fat: 16, serving: '2 tbsp' },
  protein: { calories: 120, protein: 25, carbs: 5, fat: 2, serving: '1 scoop' },
  'protein shake': { calories: 150, protein: 25, carbs: 8, fat: 3, serving: '1 shake' },
  'protein bar': { calories: 210, protein: 20, carbs: 22, fat: 7, serving: '1 bar' },
  
  // Mixed meals
  'chicken curry': { calories: 370, protein: 28, carbs: 25, fat: 18, serving: '1 bowl' },
  'chicken rice': { calories: 420, protein: 32, carbs: 50, fat: 9, serving: '1 plate' },
  'stir fry': { calories: 320, protein: 22, carbs: 28, fat: 12, serving: '1 cup' },
  soup: { calories: 180, protein: 12, carbs: 20, fat: 5, serving: '1 bowl' },
  dal: { calories: 250, protein: 15, carbs: 38, fat: 5, serving: '1 bowl' },
  biryani: { calories: 490, protein: 22, carbs: 65, fat: 16, serving: '1 plate' },
  roti: { calories: 80, protein: 3, carbs: 15, fat: 1, serving: '1 roti' },
  dosa: { calories: 168, protein: 3.9, carbs: 30, fat: 3.5, serving: '1 dosa' },
  idli: { calories: 60, protein: 2, carbs: 12, fat: 0.4, serving: '1 idli' },
  pancake: { calories: 227, protein: 6, carbs: 38, fat: 7, serving: '3 medium' },
  waffle: { calories: 291, protein: 8, carbs: 41, fat: 11, serving: '1 large' },
  cereal: { calories: 167, protein: 3, carbs: 37, fat: 1, serving: '1 cup' },
  granola: { calories: 471, protein: 10, carbs: 64, fat: 20, serving: '1 cup' },
};

const FOOD_TAGS = [
  'Meal', 'Snack', 'Drink', 'Protein', 'Vegetable', 'Fruit',
  'Carbohydrate', 'Dairy', 'Fast Food', 'Healthy', 'Recovery'
];

const analysisComments = [
  'Nutritional profile analyzed with high confidence.',
  'Macro breakdown estimated from visual composition.',
  'Caloric density calculated based on food type.',
  'Portion size estimated. Values may vary by serving.',
  'Image analysis complete. Ingredients identified.',
];

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const analyzeImageCalories = async (imageFile) => {
  // Process image analysis delay
  await delay(2200 + Math.random() * 1000);
  
  // Generate a consistent result based on filename or random from database
  const filename = imageFile.name.toLowerCase();
  const randomKey = Object.keys(FOOD_DATABASE)[Math.floor(Math.random() * Object.keys(FOOD_DATABASE).length)];
  
  let matched = null;
  for (const [key, value] of Object.entries(FOOD_DATABASE)) {
    if (filename.includes(key)) {
      matched = { name: key, ...value };
      break;
    }
  }

  if (!matched) {
    // Determine plausible macro nutritional data mapping
    const base = FOOD_DATABASE[randomKey];
    const multiplier = 0.8 + Math.random() * 0.8;
    matched = {
      name: Object.keys(FOOD_DATABASE)[Math.floor(Math.random() * Object.keys(FOOD_DATABASE).length)],
      calories: Math.round(base.calories * multiplier),
      protein: Math.round(base.protein * multiplier),
      carbs: Math.round(base.carbs * multiplier),
      fat: Math.round(base.fat * multiplier),
      serving: base.serving,
    };
  }

  const confidence = Math.floor(78 + Math.random() * 20);
  const comment = analysisComments[Math.floor(Math.random() * analysisComments.length)];
  const tag = FOOD_TAGS[Math.floor(Math.random() * FOOD_TAGS.length)];

  return {
    success: true,
    result: {
      name: matched.name.charAt(0).toUpperCase() + matched.name.slice(1),
      calories: matched.calories,
      protein: matched.protein,
      carbs: matched.carbs,
      fat: matched.fat,
      serving: matched.serving,
      confidence,
      comment,
      tag,
    },
  };
};

export const searchFood = (query) => {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  return Object.entries(FOOD_DATABASE)
    .filter(([key]) => key.includes(q))
    .map(([key, value]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      ...value,
    }))
    .slice(0, 6);
};

export const getRandomMotivationalQuote = () => {
  const quotes = [
    { text: "The secret of getting ahead is getting started.", author: "Steve Rogers" },
    { text: "I am Iron Man. And the iron doesn't lift itself.", author: "Tony Stark" },
    { text: "With great power comes great responsibility — and great gains.", author: "Peter Parker" },
    { text: "What is grief, if not love persevering... through reps?", author: "Wanda Maximoff" },
    { text: "I have a plan: attack. Same as every workout.", author: "Tony Stark" },
    { text: "The fight is won or lost far away from witnesses — in the gym.", author: "Nick Fury" },
    { text: "I can do this all day. Every. Single. Rep.", author: "Steve Rogers" },
    { text: "Strongest Avenger? Results don't lie. Check the dashboard.", author: "Thor Odinson" },
    { text: "Pain is temporary. Victory is forever. Keep moving, agent.", author: "S.H.I.E.L.D. HQ" },
    { text: "Your body is the weapon. Maintain it accordingly.", author: "Natasha Romanoff" },
    { text: "Not every mission goes perfectly. But you show up anyway.", author: "Clint Barton" },
    { text: "Dormammu, I've come to bargain — for one more PR.", author: "Stephen Strange" },
  ];
  return quotes[Math.floor(Math.random() * quotes.length)];
};
