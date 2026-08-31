// Using Unsplash Source for realistic automotive photos
export const makes = [
  {
    make: 'Toyota',
    inStock: true,
    models: [
      { model: 'Camry', from: 2007, to: 2024, parts: '1,200+', image: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=800&q=80' },
      { model: 'Corolla', from: 2009, to: 2024, parts: '1,050+', image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80' },
      { model: 'Hilux', from: 2011, to: 2024, parts: '980+', image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80' },
      { model: 'Highlander', from: 2010, to: 2024, parts: '640+', image: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=800&q=80' },
      { model: 'RAV4', from: 2013, to: 2024, parts: '710+', image: 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&w=800&q=80' },
    ],
  },
  {
    make: 'Honda',
    inStock: false,
    models: [
      { model: 'Accord', from: 2008, to: 2024, image: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=800&q=80' },
      { model: 'Civic', from: 2010, to: 2024, image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=800&q=80' },
      { model: 'CR-V', from: 2012, to: 2024, image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80' },
    ],
  },
  {
    make: 'Hyundai',
    inStock: false,
    models: [
      { model: 'Elantra', from: 2011, to: 2024, image: 'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?auto=format&fit=crop&w=800&q=80' },
      { model: 'Tucson', from: 2012, to: 2024, image: 'https://images.unsplash.com/photo-1619682817481-e994891cd1f5?auto=format&fit=crop&w=800&q=80' },
      { model: 'Sonata', from: 2010, to: 2023, image: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80' },
    ],
  },
  {
    make: 'Nissan',
    inStock: false,
    models: [
      { model: 'Altima', from: 2010, to: 2024, image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=800&q=80' },
      { model: 'Sentra', from: 2012, to: 2024, image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80' },
      { model: 'Pathfinder', from: 2013, to: 2024, image: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=800&q=80' },
    ],
  },
  {
    make: 'Kia',
    inStock: false,
    models: [
      { model: 'Rio', from: 2012, to: 2024, image: 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&w=800&q=80' },
      { model: 'Sportage', from: 2011, to: 2024, image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=800&q=80' },
      { model: 'Cerato', from: 2013, to: 2023, image: 'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?auto=format&fit=crop&w=800&q=80' },
    ],
  },
  {
    make: 'Mercedes-Benz',
    inStock: false,
    models: [
      { model: 'C-Class', from: 2008, to: 2024, image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=800&q=80' },
      { model: 'E-Class', from: 2009, to: 2024, image: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80' },
      { model: 'GLE', from: 2015, to: 2024, image: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=800&q=80' },
    ],
  },
]

export function findMake(makeName) {
  return makes.find((m) => m.make === makeName)
}
