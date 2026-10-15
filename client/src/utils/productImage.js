/**
 * StoreFlow Product Image Matching Utility (Client)
 * Automatically matches product keywords and categories to local vector illustrations
 * and resolves absolute image URLs from the API origin
 */

export const PRODUCT_IMAGE_MAP = [
  { keywords: ['oil', 'sunflower', 'mustard', 'refined', 'ghee'], file: '/product-images/sunflower-oil.svg' },
  { keywords: ['salt'], file: '/product-images/salt.svg' },
  { keywords: ['sugar'], file: '/product-images/sugar.svg' },
  { keywords: ['rice', 'basmati', 'paddy', 'biryani'], file: '/product-images/rice.svg' },
  { keywords: ['dal', 'toor', 'chana', 'moong', 'urad', 'pulse', 'lentil'], file: '/product-images/toor-dal.svg' },
  { keywords: ['atta', 'flour', 'maida', 'wheat', 'sooji', 'rava'], file: '/product-images/atta.svg' },
  { keywords: ['milk', 'dairy', 'toned'], file: '/product-images/milk.svg' },
  { keywords: ['curd', 'dahi', 'yogurt', 'yoghurt'], file: '/product-images/curd.svg' },
  { keywords: ['butter', 'makhan'], file: '/product-images/butter.svg' },
  { keywords: ['cheese', 'paneer'], file: '/product-images/cheese.svg' },
  { keywords: ['bread', 'loaf', 'bun', 'toast', 'bakery'], file: '/product-images/bread.svg' },
  { keywords: ['egg', 'eggs'], file: '/product-images/eggs.svg' },
  { keywords: ['biscuit', 'cookie', 'cookies', 'parle', 'oreo'], file: '/product-images/biscuits.svg' },
  { keywords: ['noodle', 'noodles', 'maggi', 'ramen', 'pasta', 'macaroni'], file: '/product-images/noodles.svg' },
  { keywords: ['tea', 'chai'], file: '/product-images/tea.svg' },
  { keywords: ['coffee', 'nescafe', 'bru'], file: '/product-images/coffee.svg' },
  { keywords: ['chip', 'chips', 'wafer', 'snack', 'snacks', 'lays', 'kurkure', 'namkeen'], file: '/product-images/chips.svg' },
  { keywords: ['cola', 'soda', 'coke', 'pepsi', 'sprite', 'fizz'], file: '/product-images/cola.svg' },
  { keywords: ['water', 'mineral water', 'aquafina', 'bisleri'], file: '/product-images/water.svg' },
  { keywords: ['juice', 'nectar', 'maaza', 'slice', 'frooti'], file: '/product-images/juice.svg' },
  { keywords: ['handwash', 'hand wash', 'sanitizer', 'dettol'], file: '/product-images/handwash.svg' },
  { keywords: ['soap', 'bath soap', 'lux', 'dove', 'lifebuoy', 'pears'], file: '/product-images/soap.svg' },
  { keywords: ['shampoo', 'conditioner', 'clinic plus', 'head & shoulders', 'sunsilk'], file: '/product-images/shampoo.svg' },
  { keywords: ['toothpaste', 'paste', 'colgate', 'close up', 'pepsodent', 'brush'], file: '/product-images/toothpaste.svg' },
  { keywords: ['detergent', 'surf', 'washing powder', 'rin', 'ariel', 'tide', 'wheel'], file: '/product-images/detergent.svg' },
];

export const CATEGORY_IMAGE_MAP = {
  dairy: '/product-images/milk.svg',
  bakery: '/product-images/bread.svg',
  snacks: '/product-images/chips.svg',
  beverages: '/product-images/tea.svg',
  'personal care': '/product-images/handwash.svg',
  household: '/product-images/detergent.svg',
  grocery: '/product-images/rice.svg',
};

export const GENERIC_FALLBACK_IMAGE = '/product-images/generic-grocery.svg';

/**
 * Returns suggested local SVG illustration path based on product name and category
 */
export function getSuggestedProductImage(name = '', category = '') {
  const cleanName = (name || '').toLowerCase().trim();
  const cleanCategory = (category || '').toLowerCase().trim();

  // 1. Match on lowercase product name first
  for (const item of PRODUCT_IMAGE_MAP) {
    if (item.keywords.some((kw) => cleanName.includes(kw))) {
      return item.file;
    }
  }

  // 2. Match by category
  if (cleanCategory && CATEGORY_IMAGE_MAP[cleanCategory]) {
    return CATEGORY_IMAGE_MAP[cleanCategory];
  }

  // 3. Generic fallback
  return GENERIC_FALLBACK_IMAGE;
}

/**
 * Returns API origin from VITE_API_URL (removes trailing /api)
 */
export function getApiOrigin() {
  const apiUrl = import.meta.env.VITE_API_URL || '';
  if (apiUrl) {
    return apiUrl.replace(/\/api\/?$/, '');
  }
  // In development, fall back to localhost:5090
  if (import.meta.env.DEV) {
    return 'http://localhost:5090';
  }
  return '';
}

/**
 * Resolves full usable image URL for any product object
 */
export function resolveProductImage(product) {
  if (!product) return GENERIC_FALLBACK_IMAGE;
  const img = product.imageUrl || product.image;

  if (img && typeof img === 'string' && img.trim().length > 0) {
    if (img.startsWith('http://') || img.startsWith('https://') || img.startsWith('/product-images/')) {
      return img;
    }
    // Stored in MongoDB (/api/images/...) or legacy upload (/uploads/...)
    if (img.startsWith('/api/images/') || img.startsWith('/uploads/')) {
      const origin = getApiOrigin();
      return `${origin}${img}`;
    }
    return img;
  }

  return getSuggestedProductImage(product.name, product.category);
}
