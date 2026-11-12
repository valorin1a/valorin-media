// Illustrated figures for the 9:16 "shorts" engine (added 6 Nov 2026).
// All flat, stylised drawings. None is photorealistic.
//   owner    – generic business owner (not a real person)
//   adviser  – generic finance lead (not a real person)
// Every figure has a mouth (class "mouth", opened from the voice envelope) and eyes (class "eyes", blink).

// founderSvg removed 12 Nov 2026: owner decision, the founder appears only as his real photo.

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

module.exports = { genericSvg };
