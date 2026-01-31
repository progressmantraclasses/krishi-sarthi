// utils/constants.ts
export const SOIL_TYPES = [
  { id: 'clay', name: 'Clay Soil', nameHi: 'चिकनी मिट्टी', namePa: 'ਚਿੱਕੜ ਮਿੱਟੀ' },
  { id: 'sandy', name: 'Sandy Soil', nameHi: 'बलुई मिट्टी', namePa: 'ਰੇਤਲੀ ਮਿੱਟੀ' },
  { id: 'loamy', name: 'Loamy Soil', nameHi: 'दोमट मिट्टी', namePa: 'ਮਿਸ਼ਰਿਤ ਮਿੱਟੀ' },
  { id: 'black', name: 'Black Soil', nameHi: 'काली मिट्टी', namePa: 'ਕਾਲੀ ਮਿੱਟੀ' },
  { id: 'red', name: 'Red Soil', nameHi: 'लाल मिट्टी', namePa: 'ਲਾਲ ਮਿੱਟੀ' }
];

export const CROP_SEASONS = {
  kharif: {
    months: [6, 7, 8, 9, 10], // June to October
    name: 'Kharif',
    nameHi: 'खरीफ',
    namePa: 'ਖਰੀਫ'
  },
  rabi: {
    months: [11, 12, 1, 2, 3, 4], // November to April
    name: 'Rabi',
    nameHi: 'रबी',
    namePa: 'ਰਬੀ'
  },
  zaid: {
    months: [4, 5, 6], // April to June
    name: 'Zaid',
    nameHi: 'जायद',
    namePa: 'ਜ਼ਾਇਦ'
  }
};

export const REGIONAL_CROPS = {
  delhi: {
    kharif: ['Rice', 'Maize', 'Cotton', 'Sugarcane'],
    rabi: ['Wheat', 'Barley', 'Mustard', 'Gram'],
    zaid: ['Fodder', 'Watermelon', 'Cucumber']
  },
  punjab: {
    kharif: ['Rice', 'Maize', 'Cotton', 'Sugarcane'],
    rabi: ['Wheat', 'Barley', 'Mustard', 'Potato'],
    zaid: ['Fodder', 'Watermelon', 'Cucumber']
  },
  'uttar pradesh': {
    kharif: ['Rice', 'Sugarcane', 'Cotton', 'Maize'],
    rabi: ['Wheat', 'Barley', 'Mustard', 'Peas'],
    zaid: ['Fodder', 'Watermelon', 'Cucumber']
  }
};