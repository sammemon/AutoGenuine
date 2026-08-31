export const vehicleData = {
  Toyota: {
    Camry: { from: 2007, to: 2024 },
    Corolla: { from: 2009, to: 2024 },
    Hilux: { from: 2011, to: 2024 },
    Highlander: { from: 2010, to: 2024 },
    RAV4: { from: 2013, to: 2024 },
  },
  Honda: {
    Accord: { from: 2008, to: 2024 },
    Civic: { from: 2010, to: 2024 },
    'CR-V': { from: 2012, to: 2024 },
  },
  Hyundai: {
    Elantra: { from: 2011, to: 2024 },
    Tucson: { from: 2012, to: 2024 },
    Sonata: { from: 2010, to: 2023 },
  },
  Nissan: {
    Altima: { from: 2010, to: 2024 },
    Sentra: { from: 2012, to: 2024 },
    Pathfinder: { from: 2013, to: 2024 },
  },
  Kia: {
    Rio: { from: 2012, to: 2024 },
    Sportage: { from: 2011, to: 2024 },
    Cerato: { from: 2013, to: 2023 },
  },
  'Mercedes-Benz': {
    'C-Class': { from: 2008, to: 2024 },
    'E-Class': { from: 2009, to: 2024 },
    GLE: { from: 2015, to: 2024 },
  },
}

export function getModels(make) {
  return make && vehicleData[make] ? Object.keys(vehicleData[make]) : []
}

export function getYears(make, model) {
  if (!make || !model || !vehicleData[make]?.[model]) return []
  const { from, to } = vehicleData[make][model]
  const years = []
  for (let y = to; y >= from; y--) years.push(y)
  return years
}
