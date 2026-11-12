// Illustrated figures for the 9:16 "shorts" engine (added 6 Nov 2026).
// All flat, stylised drawings. None is photorealistic.
//   founder  – illustrated avatar based on marketing/reference/founder-headshot.jpg
//              (Muhammad Imran, ACMA, Founder & MD; use permitted by the owner, 6 Nov 2026,
//              file 14 decision 11a). Not a likeness to present as a photo.
//   owner    – generic business owner (not a real person)
//   adviser  – generic finance lead (not a real person)
// Every figure has a mouth (class "mouth", opened from the voice envelope) and eyes (class "eyes", blink).

function founderSvg(size = 520, id = 'f') {
  const skin = '#C68E6C', skinS = '#A97253', hair = '#1F1A1A', suit = '#1B2747', suitS = '#121B33', shirt = '#FFFFFF', tie = '#2E3F9E';
  return `<svg class="fig" data-fig="${id}" width="${size}" height="${size}" viewBox="0 0 520 520">
  <defs><clipPath id="clip-${id}"><circle cx="260" cy="260" r="256"/></clipPath></defs>
  <g clip-path="url(#clip-${id})">
  <circle cx="260" cy="260" r="256" fill="#EFE6D4"/>
  <circle cx="260" cy="230" r="190" fill="#E6DAC2"/>
  <g class="bob">
  <!-- suit and shoulders -->
  <path d="M40 520 C50 410 120 370 200 352 L260 420 L320 352 C400 370 470 410 480 520 Z" fill="${suit}"/>
  <path d="M200 352 L240 520 L182 520 L150 380 Z" fill="${suitS}"/><path d="M320 352 L280 520 L338 520 L370 380 Z" fill="${suitS}"/>
  <path d="M212 340 L260 420 L308 340 L300 330 L260 372 L220 330 Z" fill="${shirt}"/>
  <path d="M248 372 L272 372 L280 520 L240 520 Z" fill="${tie}"/>
  <path d="M246 360 L274 360 L268 384 L252 384 Z" fill="#26358A"/>
  <g fill="#E8E2D0" opacity=".85"><circle cx="256" cy="405" r="2.5"/><circle cx="264" cy="430" r="2.5"/><circle cx="254" cy="455" r="2.5"/><circle cx="266" cy="480" r="2.5"/></g>
  <!-- neck -->
  <path d="M222 300 L222 342 Q260 372 298 342 L298 300 Z" fill="${skinS}"/>
  <!-- ears -->
  <ellipse cx="160" cy="214" rx="18" ry="32" fill="${skinS}"/><ellipse cx="360" cy="214" rx="18" ry="32" fill="${skinS}"/>
  <!-- face -->
  <path d="M164 170 Q164 92 260 88 Q356 92 356 170 L354 236 Q346 316 260 330 Q174 316 166 236 Z" fill="${skin}"/>
  <!-- hair: short, high hairline -->
  <path d="M162 200 Q150 104 208 74 Q260 58 312 74 Q370 104 358 200 L350 198 Q350 152 336 132 Q318 112 298 118 Q282 106 260 108 Q238 106 222 118 Q202 112 184 132 Q170 152 170 198 Z" fill="${hair}"/>
  <path d="M222 118 Q260 98 298 118" fill="none" stroke="${hair}" stroke-width="3" opacity=".5"/>
  <!-- brows -->
  <path d="M196 168 Q218 156 242 166" fill="none" stroke="${hair}" stroke-width="9" stroke-linecap="round"/>
  <path d="M278 166 Q302 156 324 168" fill="none" stroke="${hair}" stroke-width="9" stroke-linecap="round"/>
  <!-- eyes -->
  <g class="eyes" style="transform-box:fill-box;transform-origin:center">
    <ellipse cx="220" cy="194" rx="14" ry="8.5" fill="#fff"/><circle cx="220" cy="194" r="7.5" fill="#3A2418"/>
    <ellipse cx="300" cy="194" rx="14" ry="8.5" fill="#fff"/><circle cx="300" cy="194" r="7.5" fill="#3A2418"/>
  </g>
  <!-- nose -->
  <path d="M258 200 Q252 240 244 252 Q258 262 276 252" fill="none" stroke="${skinS}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
  <!-- mouth -->
  <path d="M232 284 Q260 292 288 284" fill="none" stroke="#7A3F33" stroke-width="5" stroke-linecap="round"/>
  <ellipse class="mouth" cx="260" cy="288" rx="18" ry="1" fill="#5A2A24"/>
  </g></g>
  <circle cx="260" cy="260" r="254" fill="none" stroke="#B29A74" stroke-width="6"/>
  </svg>`;
}

function genericSvg(kind, size = 300, id = 'g') {
  const o = kind === 'owner'
    ? { skin: '#E0B08E', skinS: '#C9946F', hair: '#3B2A22', top: '#0F6E68', topS: '#0B5752', bg: '#E4EFEC', ring: '#0F6E68', bun: true }
    : { skin: '#B98463', skinS: '#9E6C4F', hair: '#2B2420', top: '#13283D', topS: '#0E1F31', bg: '#EFE6D4', ring: '#B29A74', bun: false };
  const hair = o.bun
    ? `<circle cx="260" cy="70" r="40" fill="${o.hair}"/><path d="M162 200 Q150 90 260 80 Q370 90 358 200 Q340 130 260 124 Q180 130 162 200 Z" fill="${o.hair}"/>`
    : `<path d="M162 186 Q156 86 260 80 Q364 86 358 186 Q346 120 300 116 Q260 104 220 116 Q174 120 162 186 Z" fill="${o.hair}"/>`;
  return `<svg class="fig" data-fig="${id}" width="${size}" height="${size}" viewBox="0 0 520 520">
  <defs><clipPath id="clip-${id}"><circle cx="260" cy="260" r="256"/></clipPath></defs>
  <g clip-path="url(#clip-${id})"><circle cx="260" cy="260" r="256" fill="${o.bg}"/>
  <g class="bob">
  <path d="M50 520 C60 410 130 368 210 352 L260 400 L310 352 C390 368 460 410 470 520 Z" fill="${o.top}"/>
  <path d="M214 340 L260 400 L306 340 Z" fill="#fff"/>
  <path d="M224 300 L224 342 Q260 366 296 342 L296 300 Z" fill="${o.skinS}"/>
  <ellipse cx="162" cy="214" rx="17" ry="30" fill="${o.skinS}"/><ellipse cx="358" cy="214" rx="17" ry="30" fill="${o.skinS}"/>
  <path d="M166 170 Q166 96 260 92 Q354 96 354 170 L352 236 Q344 312 260 326 Q176 312 168 236 Z" fill="${o.skin}"/>
  ${hair}
  <path d="M198 170 Q218 160 240 168" fill="none" stroke="${o.hair}" stroke-width="8" stroke-linecap="round"/>
  <path d="M280 168 Q302 160 322 170" fill="none" stroke="${o.hair}" stroke-width="8" stroke-linecap="round"/>
  <g class="eyes" style="transform-box:fill-box;transform-origin:center">
    <circle cx="220" cy="196" r="9" fill="#2B2420"/><circle cx="300" cy="196" r="9" fill="#2B2420"/></g>
  <path d="M258 206 Q254 236 248 246 Q260 254 274 246" fill="none" stroke="${o.skinS}" stroke-width="6" stroke-linecap="round"/>
  <path d="M234 280 Q260 290 286 280" fill="none" stroke="#7A3F33" stroke-width="5" stroke-linecap="round"/>
  <ellipse class="mouth" cx="260" cy="284" rx="17" ry="1" fill="#5A2A24"/>
  </g></g>
  <circle cx="260" cy="260" r="254" fill="none" stroke="${o.ring}" stroke-width="8"/>
  </svg>`;
}

module.exports = { founderSvg, genericSvg };
