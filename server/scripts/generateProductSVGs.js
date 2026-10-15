const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '..', '..', 'client', 'public', 'product-images');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Helper to construct a clean SVG with shadow, gradient, item illustration and typography
function createSVG({
  id,
  title,
  subtitle,
  bgGradStart,
  bgGradEnd,
  accentColor,
  itemPaths,
  shadowWidth = 180,
  shadowY = 345,
}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <radialGradient id="shadow-${id}" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#0B1B3A" stop-opacity="0.22" />
      <stop offset="60%" stop-color="#0B1B3A" stop-opacity="0.08" />
      <stop offset="100%" stop-color="#0B1B3A" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="bg-${id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bgGradStart}" />
      <stop offset="100%" stop-color="${bgGradEnd}" />
    </linearGradient>
    <linearGradient id="accent-${id}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${accentColor}" />
      <stop offset="100%" stop-color="${accentColor}" stop-opacity="0.8" />
    </linearGradient>
  </defs>

  <!-- Ambient Backdrop -->
  <rect width="400" height="400" rx="32" fill="#F8FAFC" />
  <circle cx="200" cy="180" r="140" fill="url(#bg-${id})" opacity="0.35" />

  <!-- Ground Ambient Shadow -->
  <ellipse cx="200" cy="${shadowY}" rx="${shadowWidth}" ry="18" fill="url(#shadow-${id})" />

  <!-- Product Graphics -->
  <g id="artwork-${id}">
    ${itemPaths}
  </g>

  <!-- Label Badge -->
  <g transform="translate(200, 325)">
    <rect x="-90" y="-18" width="180" height="36" rx="10" fill="#FFFFFF" stroke="#E5EAF1" stroke-width="1.5" filter="drop-shadow(0 2px 4px rgba(11,27,58,0.06))" />
    <text x="0" y="0" text-anchor="middle" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-weight="800" font-size="12" fill="#0B1B3A" letter-spacing="0.5">
      ${title.toUpperCase()}
    </text>
    <text x="0" y="11" text-anchor="middle" font-family="'Inter', system-ui, sans-serif" font-weight="600" font-size="8" fill="#55607A">
      ${subtitle.toUpperCase()}
    </text>
  </g>
</svg>`;
}

const svgs = [
  // 1. Sunflower Oil
  {
    filename: 'sunflower-oil.svg',
    svg: createSVG({
      id: 'oil',
      title: 'Sunflower Oil',
      subtitle: 'Refined Pure Cooking Oil',
      bgGradStart: '#FEF08A',
      bgGradEnd: '#FDE047',
      accentColor: '#EAB308',
      shadowWidth: 70,
      itemPaths: `
        <!-- Cap -->
        <rect x="186" y="55" width="28" height="22" rx="4" fill="#EAB308" stroke="#CA8A04" stroke-width="2" />
        <line x1="186" y1="62" x2="214" y2="62" stroke="#FEF08A" stroke-width="2" />
        <!-- Bottle Neck -->
        <path d="M190 77 L210 77 L214 110 L186 110 Z" fill="#FEF9C3" stroke="#FACC15" stroke-width="2" />
        <!-- Bottle Body -->
        <rect x="155" y="110" width="90" height="185" rx="22" fill="#FACC15" stroke="#EAB308" stroke-width="3" />
        <rect x="162" y="116" width="76" height="173" rx="16" fill="#FDE047" opacity="0.9" />
        <!-- Oil Highlights -->
        <path d="M168 130 Q170 200 168 270" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" opacity="0.6" />
        <!-- Label on bottle -->
        <rect x="165" y="160" width="70" height="85" rx="8" fill="#FFFFFF" stroke="#CA8A04" stroke-width="1.5" />
        <circle cx="200" cy="190" r="16" fill="#F59E0B" />
        <polygon points="200,178 204,188 214,188 206,194 209,204 200,198 191,204 194,194 186,188 196,188" fill="#FEF08A" />
        <text x="200" y="222" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="8" fill="#0B1B3A">100% PURE</text>
        <text x="200" y="233" text-anchor="middle" font-family="'Inter', sans-serif" font-weight="700" font-size="7" fill="#CA8A04">SUNFLOWER</text>
      `
    })
  },

  // 2. Salt
  {
    filename: 'salt.svg',
    svg: createSVG({
      id: 'salt',
      title: 'Table Salt',
      subtitle: 'Iodized Pure Crystals',
      bgGradStart: '#BAE6FD',
      bgGradEnd: '#7DD3FC',
      accentColor: '#0284C7',
      shadowWidth: 80,
      itemPaths: `
        <!-- Salt Pouch -->
        <path d="M145 95 L255 95 L265 295 L135 295 Z" fill="#0284C7" stroke="#0369A1" stroke-width="3" />
        <!-- White top diagonal banner -->
        <path d="M145 95 L255 95 L258 170 L142 195 Z" fill="#FFFFFF" />
        <path d="M142 195 L258 170 L260 190 L140 215 Z" fill="#38BDF8" />
        <!-- Salt Shaker Icon -->
        <circle cx="200" cy="140" r="22" fill="#E0F2FE" />
        <path d="M192 135 Q200 125 208 135 L206 150 Q200 152 194 150 Z" fill="#0284C7" />
        <!-- Crystals illustration -->
        <circle cx="196" cy="245" r="3" fill="#FFFFFF" opacity="0.9" />
        <circle cx="204" cy="242" r="2.5" fill="#FFFFFF" opacity="0.9" />
        <circle cx="200" cy="250" r="2" fill="#FFFFFF" opacity="0.9" />
        <text x="200" y="275" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="10" fill="#FFFFFF" letter-spacing="1">IODIZED</text>
      `
    })
  },

  // 3. Sugar
  {
    filename: 'sugar.svg',
    svg: createSVG({
      id: 'sugar',
      title: 'Refined Sugar',
      subtitle: 'Pure Cane Crystals',
      bgGradStart: '#A7F3D0',
      bgGradEnd: '#6EE7B7',
      accentColor: '#059669',
      shadowWidth: 85,
      itemPaths: `
        <!-- Sugar Bag -->
        <path d="M140 100 Q200 90 260 100 L270 295 Q200 300 130 295 Z" fill="#FFFFFF" stroke="#059669" stroke-width="3" />
        <!-- Turquoise Header -->
        <path d="M140 100 Q200 90 260 100 L263 150 Q200 145 137 150 Z" fill="#10B981" />
        <!-- Sugar Cane/Crystals graphic -->
        <rect x="180" y="180" width="40" height="40" rx="6" transform="rotate(45 200 200)" fill="#D1FAE5" stroke="#10B981" stroke-width="2" />
        <circle cx="200" cy="200" r="8" fill="#10B981" />
        <text x="200" y="245" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="11" fill="#065F46">SULFUR FREE</text>
        <text x="200" y="260" text-anchor="middle" font-family="'Inter', sans-serif" font-weight="700" font-size="8" fill="#10B981">PURE CRYSTALS</text>
      `
    })
  },

  // 4. Rice
  {
    filename: 'rice.svg',
    svg: createSVG({
      id: 'rice',
      title: 'Basmati Rice',
      subtitle: 'Long Grain Premium Bag',
      bgGradStart: '#FDE68A',
      bgGradEnd: '#F59E0B',
      accentColor: '#B45309',
      shadowWidth: 90,
      itemPaths: `
        <!-- Burlap / Cloth Bag -->
        <path d="M135 110 Q200 95 265 110 L275 295 Q200 305 125 295 Z" fill="#FDF6E2" stroke="#B45309" stroke-width="3" />
        <!-- Stitched Top -->
        <path d="M130 110 Q200 100 270 110" stroke="#78350F" stroke-width="4" stroke-dasharray="6,4" />
        <!-- Maroon Banner -->
        <path d="M133 160 L267 160 L269 220 L131 220 Z" fill="#991B1B" />
        <!-- Golden Rice Ears -->
        <path d="M190 265 Q200 235 210 265" stroke="#D97706" stroke-width="3" fill="none" />
        <circle cx="200" cy="245" r="4" fill="#F59E0B" />
        <circle cx="196" cy="252" r="3.5" fill="#F59E0B" />
        <circle cx="204" cy="252" r="3.5" fill="#F59E0B" />
        <text x="200" y="188" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="12" fill="#FEF3C7">ROYAL BASMATI</text>
        <text x="200" y="205" text-anchor="middle" font-family="'Inter', sans-serif" font-weight="700" font-size="8" fill="#FFFFFF">AGED EXTRA LONG</text>
      `
    })
  },

  // 5. Toor Dal
  {
    filename: 'toor-dal.svg',
    svg: createSVG({
      id: 'dal',
      title: 'Toor Dal',
      subtitle: 'Unpolished Pulses',
      bgGradStart: '#FED7AA',
      bgGradEnd: '#FB923C',
      accentColor: '#EA580C',
      shadowWidth: 80,
      itemPaths: `
        <!-- Dal Pack -->
        <rect x="135" y="95" width="130" height="200" rx="14" fill="#FFEDD5" stroke="#EA580C" stroke-width="3" />
        <!-- Orange Top -->
        <rect x="135" y="95" width="130" height="50" rx="14" fill="#EA580C" />
        <!-- Clear Window showing yellow lentils -->
        <rect x="155" y="165" width="90" height="90" rx="12" fill="#FEF08A" stroke="#CA8A04" stroke-width="2" />
        <!-- Lentil dots -->
        <circle cx="175" cy="185" r="6" fill="#FACC15" stroke="#EAB308" />
        <circle cx="200" cy="180" r="6.5" fill="#EAB308" stroke="#CA8A04" />
        <circle cx="225" cy="187" r="6" fill="#FACC15" stroke="#EAB308" />
        <circle cx="170" cy="210" r="6.5" fill="#F59E0B" stroke="#D97706" />
        <circle cx="195" cy="212" r="7" fill="#FACC15" stroke="#EAB308" />
        <circle cx="220" cy="208" r="6.5" fill="#EAB308" stroke="#CA8A04" />
        <circle cx="185" cy="235" r="6" fill="#EAB308" stroke="#CA8A04" />
        <circle cx="210" cy="238" r="6.5" fill="#FACC15" stroke="#EAB308" />
        <text x="200" y="125" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="11" fill="#FFFFFF">NATURAL TOOR</text>
        <text x="200" y="137" text-anchor="middle" font-family="'Inter', sans-serif" font-weight="700" font-size="8" fill="#FFEDD5">UNPOLISHED</text>
      `
    })
  },

  // 6. Atta
  {
    filename: 'atta.svg',
    svg: createSVG({
      id: 'atta',
      title: 'Chakki Atta',
      subtitle: '100% Whole Wheat Flour',
      bgGradStart: '#E2E8F0',
      bgGradEnd: '#CBD5E1',
      accentColor: '#854D0E',
      shadowWidth: 85,
      itemPaths: `
        <!-- Sack Body -->
        <path d="M140 100 Q200 90 260 100 L270 295 Q200 305 130 295 Z" fill="#F5EBE1" stroke="#854D0E" stroke-width="3" />
        <!-- Brown wheat header -->
        <path d="M140 100 Q200 90 260 100 L265 145 Q200 140 135 145 Z" fill="#854D0E" />
        <!-- Wheat stalk graphic -->
        <path d="M200 250 L200 170" stroke="#CA8A04" stroke-width="3" />
        <ellipse cx="193" cy="180" rx="8" ry="4" transform="rotate(-30 193 180)" fill="#EAB308" />
        <ellipse cx="207" cy="180" rx="8" ry="4" transform="rotate(30 207 180)" fill="#EAB308" />
        <ellipse cx="193" cy="195" rx="8" ry="4" transform="rotate(-30 193 195)" fill="#EAB308" />
        <ellipse cx="207" cy="195" rx="8" ry="4" transform="rotate(30 207 195)" fill="#EAB308" />
        <ellipse cx="193" cy="210" rx="8" ry="4" transform="rotate(-30 193 210)" fill="#EAB308" />
        <ellipse cx="207" cy="210" rx="8" ry="4" transform="rotate(30 207 210)" fill="#EAB308" />
        <text x="200" y="125" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="11" fill="#FFFFFF">CHAKKI FRESH</text>
        <text x="200" y="275" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="9" fill="#854D0E">WHOLE WHEAT</text>
      `
    })
  },

  // 7. Milk
  {
    filename: 'milk.svg',
    svg: createSVG({
      id: 'milk',
      title: 'Fresh Milk',
      subtitle: 'Pasteurized Homogenized',
      bgGradStart: '#BFDBFE',
      bgGradEnd: '#60A5FA',
      accentColor: '#1D4ED8',
      shadowWidth: 75,
      itemPaths: `
        <!-- Milk Pouch Pillow Pack -->
        <path d="M140 100 Q200 95 260 100 Q270 200 260 295 Q200 300 140 295 Q130 200 140 100 Z" fill="#FFFFFF" stroke="#2563EB" stroke-width="3" />
        <!-- Blue Curve Wave -->
        <path d="M135 170 Q200 140 265 180 L260 295 Q200 300 140 295 Z" fill="#2563EB" />
        <!-- Milk Splash Droplet -->
        <path d="M200 120 C190 135 185 145 185 155 A15 15 0 0 0 215 155 C215 145 210 135 200 120 Z" fill="#93C5FD" stroke="#1D4ED8" stroke-width="1.5" />
        <text x="200" y="235" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="12" fill="#FFFFFF">TONED MILK</text>
        <text x="200" y="252" text-anchor="middle" font-family="'Inter', sans-serif" font-weight="700" font-size="8" fill="#DBEAFE">RICH IN CALCIUM</text>
      `
    })
  },

  // 8. Curd
  {
    filename: 'curd.svg',
    svg: createSVG({
      id: 'curd',
      title: 'Natural Curd',
      subtitle: 'Creamy Dahi Cup',
      bgGradStart: '#BBF7D0',
      bgGradEnd: '#4ADE80',
      accentColor: '#15803D',
      shadowWidth: 80,
      itemPaths: `
        <!-- Foil Lid -->
        <ellipse cx="200" cy="130" rx="75" ry="16" fill="#22C55E" stroke="#15803D" stroke-width="2.5" />
        <!-- Cup Body -->
        <path d="M130 130 L150 285 Q200 295 250 285 L270 130 Z" fill="#FFFFFF" stroke="#15803D" stroke-width="3" />
        <!-- Green banner on cup -->
        <path d="M137 185 L263 185 L258 235 L142 235 Z" fill="#16A34A" />
        <circle cx="200" cy="210" r="16" fill="#FFFFFF" />
        <path d="M193 210 Q200 200 207 210" stroke="#15803D" stroke-width="2.5" fill="none" />
        <text x="200" y="260" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="10" fill="#0B1B3A">THICK & CREAMY</text>
      `
    })
  },

  // 9. Butter
  {
    filename: 'butter.svg',
    svg: createSVG({
      id: 'butter',
      title: 'Pure Butter',
      subtitle: 'Pasteurized Salted Block',
      bgGradStart: '#FEF08A',
      bgGradEnd: '#FACC15',
      accentColor: '#CA8A04',
      shadowWidth: 95,
      itemPaths: `
        <!-- Butter Foil Block -->
        <polygon points="120,180 180,130 280,130 220,180" fill="#FDE047" stroke="#CA8A04" stroke-width="2.5" />
        <polygon points="120,180 220,180 220,270 120,270" fill="#FACC15" stroke="#CA8A04" stroke-width="2.5" />
        <polygon points="220,180 280,130 280,220 220,270" fill="#EAB308" stroke="#CA8A04" stroke-width="2.5" />
        <!-- Paper Wrapper Ribbon -->
        <rect x="145" y="180" width="50" height="90" fill="#BE123C" />
        <text x="170" y="230" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="9" fill="#FFFFFF">BUTTER</text>
      `
    })
  },

  // 10. Cheese
  {
    filename: 'cheese.svg',
    svg: createSVG({
      id: 'cheese',
      title: 'Cheddar Cheese',
      subtitle: 'Classic Dairy Wedge',
      bgGradStart: '#FED7AA',
      bgGradEnd: '#F97316',
      accentColor: '#C2410C',
      shadowWidth: 90,
      itemPaths: `
        <!-- Wedge Top -->
        <polygon points="120,220 280,140 280,180 120,260" fill="#FB923C" stroke="#EA580C" stroke-width="2.5" />
        <polygon points="120,220 280,140 210,130 120,220" fill="#FED7AA" stroke="#EA580C" stroke-width="2" />
        <!-- Wedge Front -->
        <polygon points="120,220 120,260 280,180 280,140" fill="#F97316" stroke="#C2410C" stroke-width="2.5" />
        <!-- Cheese Holes / Eyes -->
        <circle cx="160" cy="235" r="9" fill="#EA580C" />
        <circle cx="210" cy="210" r="12" fill="#EA580C" />
        <circle cx="250" cy="170" r="8" fill="#EA580C" />
        <circle cx="180" cy="180" r="7" fill="#FDBA74" />
      `
    })
  },

  // 11. Bread
  {
    filename: 'bread.svg',
    svg: createSVG({
      id: 'bread',
      title: 'Sliced Bread',
      subtitle: 'Soft Sandwich Loaf',
      bgGradStart: '#FED7AA',
      bgGradEnd: '#D97706',
      accentColor: '#92400E',
      shadowWidth: 100,
      itemPaths: `
        <!-- Loaf Body (Bag) -->
        <rect x="110" y="145" width="180" height="120" rx="20" fill="#FEF3C7" stroke="#B45309" stroke-width="3" />
        <!-- Crust Slices -->
        <path d="M125 150 Q150 130 175 150 L175 255 Q150 265 125 255 Z" fill="#D97706" stroke="#92400E" stroke-width="2" />
        <path d="M155 150 Q180 130 205 150 L205 255 Q180 265 155 255 Z" fill="#F59E0B" stroke="#92400E" stroke-width="2" />
        <path d="M185 150 Q210 130 235 150 L235 255 Q210 265 185 255 Z" fill="#D97706" stroke="#92400E" stroke-width="2" />
        <!-- Front Label -->
        <rect x="220" y="165" width="60" height="80" rx="8" fill="#1D4ED8" />
        <text x="250" y="200" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="9" fill="#FFFFFF">SANDWICH</text>
        <text x="250" y="214" text-anchor="middle" font-family="'Inter', sans-serif" font-weight="700" font-size="7" fill="#93C5FD">BREAD</text>
      `
    })
  },

  // 12. Eggs
  {
    filename: 'eggs.svg',
    svg: createSVG({
      id: 'eggs',
      title: 'Farm Eggs',
      subtitle: 'Nutritious Grade A Tray',
      bgGradStart: '#FED7AA',
      bgGradEnd: '#FDBA74',
      accentColor: '#C2410C',
      shadowWidth: 100,
      itemPaths: `
        <!-- Carton Base -->
        <path d="M110 220 L130 280 L270 280 L290 220 Z" fill="#E2E8F0" stroke="#64748B" stroke-width="2.5" />
        <!-- 6 Brown Eggs -->
        <ellipse cx="145" cy="205" rx="16" ry="24" fill="#FDBA74" stroke="#EA580C" stroke-width="2" />
        <ellipse cx="180" cy="195" rx="16" ry="24" fill="#FED7AA" stroke="#EA580C" stroke-width="2" />
        <ellipse cx="215" cy="195" rx="16" ry="24" fill="#FDBA74" stroke="#EA580C" stroke-width="2" />
        <ellipse cx="250" cy="205" rx="16" ry="24" fill="#FED7AA" stroke="#EA580C" stroke-width="2" />
        <!-- Front Label on tray -->
        <rect x="150" y="240" width="100" height="25" rx="6" fill="#15803D" />
        <text x="200" y="256" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="9" fill="#FFFFFF">FARM FRESH 6s</text>
      `
    })
  },

  // 13. Biscuits
  {
    filename: 'biscuits.svg',
    svg: createSVG({
      id: 'biscuits',
      title: 'Tea Biscuits',
      subtitle: 'Crisp Golden Cookies',
      bgGradStart: '#FECDD3',
      bgGradEnd: '#F43F5E',
      accentColor: '#BE123C',
      shadowWidth: 90,
      itemPaths: `
        <!-- Roll Wrapper -->
        <rect x="110" y="150" width="180" height="85" rx="20" fill="#E11D48" stroke="#9F1239" stroke-width="3" />
        <!-- Golden Biscuit illustration overlapping -->
        <circle cx="200" cy="192" r="32" fill="#FDE047" stroke="#CA8A04" stroke-width="3" />
        <!-- Biscuit dots -->
        <circle cx="185" cy="180" r="2.5" fill="#B45309" />
        <circle cx="200" cy="180" r="2.5" fill="#B45309" />
        <circle cx="215" cy="180" r="2.5" fill="#B45309" />
        <circle cx="185" cy="195" r="2.5" fill="#B45309" />
        <circle cx="200" cy="195" r="2.5" fill="#B45309" />
        <circle cx="215" cy="195" r="2.5" fill="#B45309" />
        <circle cx="200" cy="208" r="2.5" fill="#B45309" />
        <text x="200" y="135" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="11" fill="#BE123C">GLUCOSE</text>
      `
    })
  },

  // 14. Noodles
  {
    filename: 'noodles.svg',
    svg: createSVG({
      id: 'noodles',
      title: 'Instant Noodles',
      subtitle: '2-Minute Masala Pack',
      bgGradStart: '#FEF08A',
      bgGradEnd: '#FACC15',
      accentColor: '#DC2626',
      shadowWidth: 85,
      itemPaths: `
        <!-- Noodle Pouch -->
        <path d="M130 110 L270 110 L260 285 L140 285 Z" fill="#FACC15" stroke="#B45309" stroke-width="3" />
        <!-- Red Brand Ribbon -->
        <path d="M130 110 L270 110 L268 165 L132 165 Z" fill="#DC2626" />
        <text x="200" y="142" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-weight="900" font-size="16" fill="#FEF08A" font-style="italic">MASALA</text>
        <!-- Noodle Bowl graphic -->
        <path d="M165 210 Q200 245 235 210 Z" fill="#B91C1C" stroke="#7F1D1D" stroke-width="2" />
        <path d="M170 205 Q180 195 190 205 Q200 195 210 205 Q220 195 230 205" stroke="#FEF08A" stroke-width="3" fill="none" />
        <!-- Steam lines -->
        <path d="M190 190 Q185 180 190 170" stroke="#EA580C" stroke-width="2" fill="none" />
        <path d="M205 190 Q210 180 205 170" stroke="#EA580C" stroke-width="2" fill="none" />
      `
    })
  },

  // 15. Tea
  {
    filename: 'tea.svg',
    svg: createSVG({
      id: 'tea',
      title: 'Premium Tea',
      subtitle: 'Rich Assam CTC Leaves',
      bgGradStart: '#BBF7D0',
      bgGradEnd: '#16A34A',
      accentColor: '#14532D',
      shadowWidth: 80,
      itemPaths: `
        <!-- Tea Box -->
        <rect x="140" y="100" width="120" height="190" rx="10" fill="#15803D" stroke="#14532D" stroke-width="3" />
        <!-- Gold Trim -->
        <rect x="145" y="105" width="110" height="180" rx="8" fill="#166534" stroke="#FACC15" stroke-width="2" />
        <!-- Golden Tea Leaf Icon -->
        <circle cx="200" cy="170" r="30" fill="#FACC15" />
        <path d="M190 180 C190 155 210 155 215 155 C215 175 195 185 190 180 Z" fill="#15803D" />
        <text x="200" y="235" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="12" fill="#FEF08A">GOLD TEA</text>
        <text x="200" y="250" text-anchor="middle" font-family="'Inter', sans-serif" font-weight="700" font-size="8" fill="#FFFFFF">NATURAL AROMA</text>
      `
    })
  },

  // 16. Coffee
  {
    filename: 'coffee.svg',
    svg: createSVG({
      id: 'coffee',
      title: 'Classic Coffee',
      subtitle: 'Rich Roasted Granules',
      bgGradStart: '#D7CCC8',
      bgGradEnd: '#8D6E63',
      accentColor: '#4E342E',
      shadowWidth: 75,
      itemPaths: `
        <!-- Cap -->
        <rect x="160" y="90" width="80" height="25" rx="6" fill="#3E2723" stroke="#1B0000" stroke-width="2" />
        <!-- Glass Jar -->
        <path d="M150 115 L250 115 L255 285 L145 285 Z" fill="#5D4037" stroke="#3E2723" stroke-width="3" />
        <!-- Label on Jar -->
        <rect x="155" y="160" width="90" height="95" rx="8" fill="#D7CCC8" stroke="#3E2723" stroke-width="1.5" />
        <ellipse cx="200" cy="195" rx="14" ry="9" transform="rotate(-30 200 195)" fill="#3E2723" />
        <path d="M192 195 Q200 190 208 195" stroke="#D7CCC8" stroke-width="1.5" fill="none" />
        <text x="200" y="228" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="10" fill="#3E2723">INSTANT</text>
        <text x="200" y="242" text-anchor="middle" font-family="'Inter', sans-serif" font-weight="700" font-size="7" fill="#5D4037">100% COFFEE</text>
      `
    })
  },

  // 17. Chips
  {
    filename: 'chips.svg',
    svg: createSVG({
      id: 'chips',
      title: 'Potato Chips',
      subtitle: 'Crispy Salted Snack',
      bgGradStart: '#FED7AA',
      bgGradEnd: '#EA580C',
      accentColor: '#C2410C',
      shadowWidth: 85,
      itemPaths: `
        <!-- Chip Bag -->
        <path d="M135 95 L265 95 L275 295 L125 295 Z" fill="#DC2626" stroke="#991B1B" stroke-width="3" />
        <!-- Diagonal Burst -->
        <polygon points="125,200 275,170 275,295 125,295" fill="#FACC15" />
        <!-- Golden Chip -->
        <ellipse cx="200" cy="225" rx="28" ry="16" transform="rotate(-15 200 225)" fill="#FDE047" stroke="#CA8A04" stroke-width="2" />
        <text x="200" y="145" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-weight="900" font-size="14" fill="#FFFFFF" letter-spacing="1">CRUNCH</text>
        <text x="200" y="160" text-anchor="middle" font-family="'Inter', sans-serif" font-weight="700" font-size="8" fill="#FEE2E2">CLASSIC SALTED</text>
      `
    })
  },

  // 18. Cola
  {
    filename: 'cola.svg',
    svg: createSVG({
      id: 'cola',
      title: 'Sparkling Cola',
      subtitle: 'Chilled Refreshment',
      bgGradStart: '#FCA5A5',
      bgGradEnd: '#DC2626',
      accentColor: '#7F1D1D',
      shadowWidth: 65,
      itemPaths: `
        <!-- Crown Cap -->
        <rect x="188" y="70" width="24" height="12" rx="2" fill="#E2E8F0" stroke="#475569" stroke-width="2" />
        <!-- Bottle Neck -->
        <path d="M192 82 L208 82 L212 130 L188 130 Z" fill="#7F1D1D" stroke="#450A0A" stroke-width="2" />
        <!-- Curved Glass Body -->
        <path d="M188 130 C165 160 160 200 165 240 C165 270 175 290 200 290 C225 290 235 270 235 240 C240 200 235 160 212 130 Z" fill="#991B1B" stroke="#450A0A" stroke-width="3" />
        <!-- Red Label -->
        <rect x="165" y="195" width="70" height="45" rx="6" fill="#DC2626" stroke="#FFFFFF" stroke-width="1.5" />
        <!-- White dynamic wave -->
        <path d="M165 218 Q200 205 235 218" stroke="#FFFFFF" stroke-width="3" fill="none" />
        <text x="200" y="210" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-weight="900" font-size="10" fill="#FFFFFF" font-style="italic">COLA</text>
      `
    })
  },

  // 19. Water
  {
    filename: 'water.svg',
    svg: createSVG({
      id: 'water',
      title: 'Spring Water',
      subtitle: 'Pure Mineral Hydration',
      bgGradStart: '#BAE6FD',
      bgGradEnd: '#38BDF8',
      accentColor: '#0284C7',
      shadowWidth: 65,
      itemPaths: `
        <!-- Blue Cap -->
        <rect x="187" y="65" width="26" height="16" rx="3" fill="#0284C7" stroke="#0369A1" stroke-width="2" />
        <!-- Bottle Neck & Body -->
        <path d="M190 81 L210 81 L218 120 L220 285 L180 285 L182 120 Z" fill="#E0F2FE" stroke="#38BDF8" stroke-width="2.5" />
        <!-- Ribbed texture lines -->
        <line x1="183" y1="140" x2="217" y2="140" stroke="#7DD3FC" stroke-width="2" />
        <line x1="182" y1="155" x2="218" y2="155" stroke="#7DD3FC" stroke-width="2" />
        <line x1="181" y1="245" x2="219" y2="245" stroke="#7DD3FC" stroke-width="2" />
        <line x1="181" y1="260" x2="219" y2="260" stroke="#7DD3FC" stroke-width="2" />
        <!-- Label with mountain/wave -->
        <rect x="178" y="175" width="44" height="55" rx="4" fill="#0284C7" />
        <polygon points="200,185 212,205 188,205" fill="#FFFFFF" />
        <text x="200" y="220" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="7" fill="#FFFFFF">MINERAL</text>
      `
    })
  },

  // 20. Juice
  {
    filename: 'juice.svg',
    svg: createSVG({
      id: 'juice',
      title: 'Fruit Juice',
      subtitle: '100% Real Orange Nectar',
      bgGradStart: '#FED7AA',
      bgGradEnd: '#FB923C',
      accentColor: '#EA580C',
      shadowWidth: 75,
      itemPaths: `
        <!-- Screw Cap -->
        <rect x="170" y="70" width="22" height="14" rx="3" fill="#EA580C" />
        <!-- Slanted Top Carton -->
        <polygon points="150,110 200,85 250,110 250,285 150,285" fill="#F97316" stroke="#C2410C" stroke-width="3" />
        <polygon points="150,110 200,85 250,110" fill="#FB923C" />
        <!-- Orange slice illustration -->
        <circle cx="200" cy="195" r="26" fill="#FDE047" stroke="#EA580C" stroke-width="3" />
        <circle cx="200" cy="195" r="20" fill="#FB923C" />
        <line x1="200" y1="175" x2="200" y2="215" stroke="#FFFFFF" stroke-width="2" />
        <line x1="180" y1="195" x2="220" y2="195" stroke="#FFFFFF" stroke-width="2" />
        <text x="200" y="245" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="11" fill="#FFFFFF">ORANGE</text>
        <text x="200" y="258" text-anchor="middle" font-family="'Inter', sans-serif" font-weight="700" font-size="7" fill="#FFEDD5">100% JUICE</text>
      `
    })
  },

  // 21. Handwash
  {
    filename: 'handwash.svg',
    svg: createSVG({
      id: 'handwash',
      title: 'Liquid Handwash',
      subtitle: 'Antibacterial Germ Shield',
      bgGradStart: '#CCFBF1',
      bgGradEnd: '#2DD4BF',
      accentColor: '#0F766E',
      shadowWidth: 75,
      itemPaths: `
        <!-- Pump Head -->
        <path d="M195 65 L225 65 L225 75 L205 75 L205 85 L195 85 Z" fill="#0D9488" stroke="#115E59" stroke-width="2" />
        <rect x="195" y="85" width="10" height="20" fill="#E2E8F0" />
        <rect x="185" y="105" width="30" height="15" rx="3" fill="#0D9488" />
        <!-- Bottle Body -->
        <rect x="150" y="120" width="100" height="165" rx="26" fill="#14B8A6" stroke="#0F766E" stroke-width="3" />
        <!-- Front Label -->
        <rect x="160" y="160" width="80" height="90" rx="10" fill="#FFFFFF" stroke="#0F766E" stroke-width="1.5" />
        <!-- Cross / Shield Icon -->
        <circle cx="200" cy="190" r="15" fill="#EF4444" />
        <rect x="197" y="181" width="6" height="18" fill="#FFFFFF" />
        <rect x="191" y="187" width="18" height="6" fill="#FFFFFF" />
        <text x="200" y="225" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="9" fill="#0B1B3A">GERM SHIELD</text>
        <text x="200" y="238" text-anchor="middle" font-family="'Inter', sans-serif" font-weight="700" font-size="7" fill="#0D9488">MOISTURIZING</text>
      `
    })
  },

  // 22. Soap
  {
    filename: 'soap.svg',
    svg: createSVG({
      id: 'soap',
      title: 'Beauty Soap',
      subtitle: 'Gentle Cleansing Bar',
      bgGradStart: '#FCE7F3',
      bgGradEnd: '#F472B6',
      accentColor: '#BE185D',
      shadowWidth: 85,
      itemPaths: `
        <!-- Soap Box behind -->
        <rect x="160" y="110" width="115" height="150" rx="12" fill="#DB2777" stroke="#9D174D" stroke-width="2.5" />
        <rect x="170" y="125" width="95" height="40" rx="6" fill="#FDF2F8" />
        <text x="217" y="150" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="10" fill="#BE185D">BEAUTY BAR</text>
        <!-- Soap Bar front overlapping -->
        <rect x="125" y="170" width="110" height="75" rx="22" fill="#F472B6" stroke="#BE185D" stroke-width="3" />
        <ellipse cx="180" cy="207" rx="35" ry="16" fill="#FBCFE8" />
        <text x="180" y="212" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="11" fill="#9D174D" font-style="italic">Soft Care</text>
      `
    })
  },

  // 23. Shampoo
  {
    filename: 'shampoo.svg',
    svg: createSVG({
      id: 'shampoo',
      title: 'Hair Shampoo',
      subtitle: 'Smooth & Silky Formula',
      bgGradStart: '#E9D5FF',
      bgGradEnd: '#A855F7',
      accentColor: '#7E22CE',
      shadowWidth: 65,
      itemPaths: `
        <!-- Flip Cap -->
        <path d="M185 65 L215 65 L218 85 L182 85 Z" fill="#6B21A8" stroke="#581C87" stroke-width="2" />
        <!-- Tall Squeeze Bottle -->
        <path d="M182 85 C160 115 155 180 160 285 L240 285 C245 180 240 115 218 85 Z" fill="#9333EA" stroke="#6B21A8" stroke-width="3" />
        <!-- Curving shimmer wave -->
        <path d="M165 140 Q180 220 235 260" stroke="#E9D5FF" stroke-width="4" fill="none" opacity="0.6" stroke-linecap="round" />
        <!-- Label -->
        <rect x="170" y="170" width="60" height="75" rx="8" fill="#FFFFFF" />
        <circle cx="200" cy="195" r="12" fill="#7E22CE" />
        <text x="200" y="222" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="8" fill="#0B1B3A">NOURISH</text>
        <text x="200" y="233" text-anchor="middle" font-family="'Inter', sans-serif" font-weight="700" font-size="6.5" fill="#6B21A8">WITH KERATIN</text>
      `
    })
  },

  // 24. Toothpaste
  {
    filename: 'toothpaste.svg',
    svg: createSVG({
      id: 'toothpaste',
      title: 'Mint Toothpaste',
      subtitle: 'Total Cavity Protection',
      bgGradStart: '#BAE6FD',
      bgGradEnd: '#38BDF8',
      accentColor: '#0369A1',
      shadowWidth: 80,
      itemPaths: `
        <!-- White Screw Cap -->
        <rect x="110" y="220" width="22" height="30" rx="4" fill="#FFFFFF" stroke="#0284C7" stroke-width="2" />
        <!-- Tube Body -->
        <polygon points="132,225 285,150 285,260 132,245" fill="#0284C7" stroke="#0369A1" stroke-width="3" />
        <!-- Red & White wave -->
        <path d="M140 230 Q210 190 285 200 L285 240 Q210 230 140 242 Z" fill="#EF4444" />
        <path d="M140 234 Q210 196 285 208 L285 218 Q210 206 140 238 Z" fill="#FFFFFF" />
        <text x="220" y="180" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-weight="900" font-size="12" fill="#FFFFFF">FRESH MINT</text>
      `
    })
  },

  // 25. Detergent
  {
    filename: 'detergent.svg',
    svg: createSVG({
      id: 'detergent',
      title: 'Washing Powder',
      subtitle: 'Tough Stain Removal',
      bgGradStart: '#C7D2FE',
      bgGradEnd: '#6366F1',
      accentColor: '#4338CA',
      shadowWidth: 85,
      itemPaths: `
        <!-- Detergent Pack -->
        <path d="M135 95 L265 95 L275 295 L125 295 Z" fill="#4F46E5" stroke="#3730A3" stroke-width="3" />
        <!-- Bright Yellow Sparkle Burst -->
        <polygon points="200,140 210,165 235,165 215,180 222,205 200,190 178,205 185,180 165,165 190,165" fill="#FACC15" />
        <circle cx="200" cy="175" r="10" fill="#FFFFFF" />
        <!-- Bright Green Sweep -->
        <path d="M127 230 Q200 210 273 245 L275 295 L125 295 Z" fill="#10B981" />
        <text x="200" y="270" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-weight="900" font-size="14" fill="#FFFFFF" letter-spacing="1">SURF WASH</text>
      `
    })
  },

  // 26. Generic Grocery (Fallback)
  {
    filename: 'generic-grocery.svg',
    svg: createSVG({
      id: 'generic',
      title: 'Store Grocery',
      subtitle: 'Fresh Supermarket Goods',
      bgGradStart: '#E2E8F0',
      bgGradEnd: '#94A3B8',
      accentColor: '#0FA38F',
      shadowWidth: 90,
      itemPaths: `
        <!-- Brown Kraft Paper Bag -->
        <path d="M130 140 L270 140 L260 295 L140 295 Z" fill="#D4A373" stroke="#A9714B" stroke-width="3" />
        <polygon points="130,140 140,165 160,165 150,140" fill="#CCD5AE" />
        <!-- Green Apple Peeking -->
        <circle cx="170" cy="130" r="22" fill="#22C55E" stroke="#15803D" stroke-width="2" />
        <path d="M170 110 Q175 100 180 102" stroke="#78350F" stroke-width="2.5" fill="none" />
        <!-- Bread Baguette Peeking -->
        <polygon points="215,70 235,70 250,150 230,150" fill="#EAB308" stroke="#CA8A04" stroke-width="2" />
        <!-- Carrot Peeking -->
        <polygon points="190,105 205,105 198,145" fill="#F97316" />
        <path d="M197 105 L195 90 M197 105 L200 90" stroke="#16A34A" stroke-width="2" />
        <!-- StoreFlow Logo Icon on Bag -->
        <circle cx="200" cy="225" r="24" fill="#FFFFFF" stroke="#A9714B" stroke-width="1.5" />
        <path d="M190 225 L200 215 L210 225 L200 235 Z" fill="#0FA38F" />
        <text x="200" y="270" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="11" fill="#432818">SUPERMARKET</text>
      `
    })
  }
];

let createdCount = 0;
for (const item of svgs) {
  const filePath = path.join(targetDir, item.filename);
  fs.writeFileSync(filePath, item.svg, 'utf8');
  createdCount++;
}

console.log(`✅ Successfully generated ${createdCount} realistic product SVG illustrations in ${targetDir}`);
