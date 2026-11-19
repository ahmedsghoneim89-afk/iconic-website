/* ==========================================================================
   00 — core: utilities, MOTION tokens, i18n, data layer, analytics gate
   ========================================================================== */
const SERVER = window.__ICONIC__ || null;   /* set by the production server; absent in the prototype */
const doc = document, root = doc.documentElement;
const $ = (s, r = doc) => r.querySelector(s);
const $$ = (s, r = doc) => Array.from(r.querySelectorAll(s));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const damp = (a, b, lambda, dt) => lerp(a, b, 1 - Math.exp(-lambda * dt));
const mqReduced = matchMedia('(prefers-reduced-motion: reduce)');
const mqCoarse = matchMedia('(pointer: coarse)');
const mqFine = matchMedia('(hover: hover) and (pointer: fine)');
const mqMobile = matchMedia('(max-width: 900px)');
const hasGSAP = () => typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
const hasTHREE = () => typeof window.THREE !== 'undefined';

/* --- Motion tokens: the single source for every duration, easing, delay, stagger, spring and camera timing --- */
const MOTION = {
  duration: { instant: 0.12, fast: 0.28, base: 0.6, slow: 1.1, cinematic: 1.8 },
  ease: { standard: 'power2.out', emphasized: 'expo.out', inOut: 'power3.inOut', soft: 'sine.inOut' },
  css: { standard: 'cubic-bezier(.22,.61,.36,1)', out: 'cubic-bezier(.16,1,.3,1)' },
  delay: { short: 0.08, base: 0.2, long: 0.5 },
  stagger: { tight: 0.03, base: 0.07, loose: 0.14 },
  spring: { follow: 9, camera: 5.5, parallax: 3.5, gyro: 4 }, // damping rates used by damp()
  reveal: { distance: 28 },
  camera: { flyTo: 2.2, flyEase: 'power3.inOut', fovKick: 5, parallaxDeg: 2.4, gyroMaxDeg: 6, maxYaw: 0.62, maxPitch: 0.22, autoRotateSpeed: 0.22 },
  intro: { total: 4.7 }
};
(function applyMotionTokens() {
  const s = root.style, d = MOTION.duration;
  s.setProperty('--dur-fast', d.fast + 's'); s.setProperty('--dur-base', d.base + 's'); s.setProperty('--dur-slow', d.slow + 's');
  s.setProperty('--ease-std', MOTION.css.standard); s.setProperty('--ease-out', MOTION.css.out);
})();

/* --- Regions ICONIC works in (supplied by ICONIC). The first four skyline points map to these, in this order. --- */
const REGIONS = [
  { id: 'alexandria', en: 'Alexandria', ar: 'الإسكندرية' },
  { id: 'north-coast', en: 'North Coast', ar: 'الساحل الشمالي' },
  { id: 'cairo', en: 'Cairo', ar: 'القاهرة' },
  { id: 'red-sea', en: 'Red Sea', ar: 'البحر الأحمر' }
];
const regionName = (id) => { const r = REGIONS.find((x) => x.id === id); return r ? r[App.lang] : ''; };
/* Property type and purpose are stored as stable keys and shown in the visitor's language. */
const TYPES = [['residential', { en: 'Residential', ar: 'سكني' }], ['commercial', { en: 'Commercial', ar: 'تجاري' }], ['administrative', { en: 'Administrative', ar: 'إداري' }], ['medical', { en: 'Medical', ar: 'طبي' }], ['land', { en: 'Land', ar: 'أرض' }]];
const PURPOSES = [['sale', { en: 'For sale', ar: 'للبيع' }], ['rent', { en: 'For rent', ar: 'للإيجار' }]];
const keyLabel = (list, k) => { const f = list.find((x) => x[0] === k); return f ? f[1][App.lang] : (k || ''); };
const typeLabel = (k) => keyLabel(TYPES, k), purposeLabel = (k) => keyLabel(PURPOSES, k);

/* --- Approved company data. Nothing here is invented: every field is empty until ICONIC supplies it. --- */
const DATA = {
  company: { whatsapp: null /* e.g. '2012…' digits only */, phone: null, email: null, address: null, hours: null, social: {} },
  /* Brand pillars on the story section: [{en,ar}]. Empty means the shipped eight. */
  pillars: [],
  /* Sections the company has switched off in the dashboard */
  layout: { teams: true, about: true },
  /* Property schema: { id, title, type, purpose, region:<region id>, location, project, agent:<agent id>, price, currency, beds, baths, area, description, images:[url], model3d:null } */
  properties: [],
  /* Sales teams: one per region. Team schema: { id, region:<region id>, name:{en,ar} }
     Agent schema: { id, team:<team id>, name:{en,ar}|'text', role:{en,ar}|'text', photo:'https://…', phone:'+20…', whatsapp:'20…' (digits, country code), email }
     An agent's units are the properties whose `agent` equals the agent's id. */
  teams: [],
  agents: [],
  /* Skyline hotspot content, by slot index 1..4 (slot 0 is the brand tower): { label, text, href } */
  hotspots: {},
  formEndpoint: null /* POST URL for the production form handler */
};
/* Layout-review samples. Only ever shown when the visitor presses a "Preview" button. Nothing here is a real listing, person or number. */
const SAMPLE = [
  { id: 'sample-a', title: 'Sample listing A', type: 'residential', purpose: 'sale', region: 'alexandria', agent: 'sample-agent-1', location: 'Sample location', price: null, beds: 3, baths: 2, area: '180 m²', description: 'Layout preview only. This is not a real listing.' },
  { id: 'sample-b', title: 'Sample listing B', type: 'commercial', purpose: 'rent', region: 'alexandria', agent: 'sample-agent-1', location: 'Sample location', price: null, beds: null, baths: 2, area: '320 m²', description: 'Layout preview only. This is not a real listing.' },
  { id: 'sample-c', title: 'Sample listing C', type: 'residential', purpose: 'rent', region: 'north-coast', agent: 'sample-agent-3', location: 'Sample location', price: null, beds: 4, baths: 3, area: '260 m²', description: 'Layout preview only. This is not a real listing.' },
  { id: 'sample-d', title: 'Sample listing D', type: 'commercial', purpose: 'sale', region: 'cairo', agent: 'sample-agent-5', location: 'Sample location', price: null, beds: null, baths: 1, area: '140 m²', description: 'Layout preview only. This is not a real listing.' },
  { id: 'sample-e', title: 'Sample listing E', type: 'residential', purpose: 'sale', region: 'cairo', agent: 'sample-agent-6', location: 'Sample location', price: null, beds: 2, baths: 2, area: '120 m²', description: 'Layout preview only. This is not a real listing.' },
  { id: 'sample-f', title: 'Sample listing F', type: 'residential', purpose: 'sale', region: 'red-sea', agent: 'sample-agent-7', location: 'Sample location', price: null, beds: 1, baths: 1, area: '75 m²', description: 'Layout preview only. This is not a real listing.' }
];
const SAMPLE_TEAMS = REGIONS.map((r) => ({ id: 'sample-team-' + r.id, region: r.id, name: { en: r.en + ' team', ar: 'فريق ' + r.ar } }));
const AR_DIGITS = ['١', '٢', '٣', '٤', '٥', '٦', '٧', '٨'];
const SAMPLE_AGENTS = REGIONS.flatMap((r, ri) => [0, 1].map((k) => {
  const n = ri * 2 + k + 1;
  return { id: 'sample-agent-' + n, team: 'sample-team-' + r.id, name: { en: 'Sample agent ' + n, ar: 'وكيل تجريبي ' + AR_DIGITS[n - 1] }, role: k === 0 ? { en: 'Team lead', ar: 'قائد الفريق' } : { en: 'Sales agent', ar: 'مسؤول مبيعات' }, photo: null, phone: null, whatsapp: null, email: null };
}));

/* --- i18n (English + Arabic RTL). Arabic copy is a first draft and needs native review. --- */
const I18N = {
  en: {
    'skip.content': 'Skip to content',
    'nav.properties': 'Properties', 'nav.skyline': 'Skyline', 'nav.about': 'About', 'nav.contact': 'Contact', 'nav.menu': 'Menu', 'nav.close': 'Close',
    'cta.viewing': 'Request a viewing', 'cta.inquiry': 'Send an inquiry',
    'lang.label': 'العربية', 'lang.aria': 'Switch to Arabic',
    'intro.skip': 'Skip intro',
    'hero.title': 'Beyond the ordinary.',
    'hero.support': 'Exceptional properties and investment insight, matched to what you are looking for.',
    'hero.explore': 'Explore the skyline', 'hero.scroll': 'Scroll',
    'sky.title': 'Discover the skyline',
    'sky.hint.pointer': 'Drag to steer. Scroll to move forward. Select a marker to fly there.',
    'sky.hint.touch': 'Swipe sideways to steer. Scroll to move forward. Tap a marker to fly there.',
    'sky.hint.static': 'Select a point below to learn more.',
    'sky.recenter': 'Recenter view', 'sky.rotate': 'Auto-rotate', 'sky.gyro': 'Tilt with device',
    'sky.gyro.denied': 'Motion sensors are not available here.', 'sky.gyro.on': 'Tilt control is on.', 'sky.list': 'Skyline points',
    'hs.brand.title': 'The ICONIC landmark',
    'hs.brand.text': 'The emblem from the ICONIC logo, set as the landmark at the end of the avenue.',
    'hs.brand.cta': 'About ICONIC',
    'hs.slot.title': 'Skyline point {n}',
    'hs.slot.text': 'Not linked yet. Once approved content is connected, this point opens a real listing or area.',
    'hs.back': 'Back to the avenue',
    'props.title': 'Property discovery',
    'props.lede': 'Units across Alexandria, the North Coast, Cairo and the Red Sea, each handled by a named ICONIC agent.',
    'props.empty.title': 'No listings published yet',
    'props.empty.body': 'Once listings are approved, they appear here with filters for type, purpose and location.',
    'props.preview': 'Preview the card layout', 'props.preview.off': 'Hide the preview',
    'props.preview.note': 'Sample cards for layout review only. These are not real listings.',
    'props.filter.all': 'All', 'props.filter.type': 'Type', 'props.filter.purpose': 'Purpose', 'props.count': '{n} shown',
    'prop.open': 'View details', 'prop.price.none': 'Price on request',
    'prop.beds': 'Bedrooms', 'prop.baths': 'Bathrooms', 'prop.area': 'Area', 'prop.type': 'Type', 'prop.purpose': 'Purpose', 'prop.location': 'Location',
    'prop.close': 'Close details', 'unit.sqm': 'm²', 'foot.admin': 'Admin dashboard', 'prop.project': 'Project', 'prop.sample': 'Sample listing, not a real property.',
    'story.title': 'What ICONIC stands for',
    'story.lede': 'One identity, carried through every page, conversation and property we present.',
    'story.1': 'Curated selection', 'story.2': 'Timeless luxury', 'story.3': 'Confidence', 'story.4': 'Prestige',
    'story.5': 'Sophistication', 'story.6': 'Exclusivity', 'story.7': 'Investment intelligence', 'story.8': 'Modern innovation',
    'conv.title': 'Your next chapter starts here.', 'conv.lede': 'Tell us what you are looking for.',
    'form.title': 'Inquiry or viewing', 'form.interest': 'I would like to',
    'form.interest.inquiry': 'Send an inquiry', 'form.interest.viewing': 'Request a viewing',
    'form.name': 'Full name', 'form.phone': 'Phone', 'form.email': 'Email', 'form.message': 'Message',
    'form.consent': 'I agree to be contacted about this request.',
    'form.submit.inquiry': 'Send inquiry', 'form.submit.viewing': 'Request viewing',
    'form.err.name': 'Enter your full name.', 'form.err.contact': 'Enter a phone number or an email address.',
    'form.err.email': 'Enter a valid email address, for example name@example.com.',
    'form.err.phone': 'Enter a valid phone number using digits, spaces, + or -.',
    'form.err.consent': 'Tick the box so we know we may contact you.',
    'form.err.wait': 'Wait a few seconds before sending again.',
    'form.proto': 'Prototype mode: your details passed validation but were not sent, because no form endpoint is connected yet.',
    'form.sent': 'Thank you. Your request has been sent.', 'form.fail': 'Your request could not be sent. Try again or use another contact option.', 'form.sending': 'Sending…',
    'foot.rights': 'ICONIC Real Estate', 'foot.replay': 'Replay intro',
    'contact.whatsapp': 'WhatsApp', 'contact.call': 'Call', 'contact.email': 'Email',
    'mobile.viewing': 'Request viewing', 'mobile.inquiry': 'Inquire',
    'nav.teams': 'Teams',
    'teams.title': 'Sales teams',
    'teams.lede': 'One team for each region. Meet the agents, see the units they handle and contact them directly.',
    'teams.region': 'Region', 'teams.all': 'All regions',
    'teams.empty.title': 'No sales teams published yet',
    'teams.empty.body': 'Once the sales teams are added, they appear here by region with agent photos, their units and contact details.',
    'teams.preview': 'Preview the team layout', 'teams.preview.off': 'Hide the preview',
    'teams.preview.note': 'Sample teams and agents for layout review only. These are not real people.',
    'team.agents.one': '{n} agent', 'team.agents.other': '{n} agents',
    'team.units.one': '{n} unit', 'team.units.other': '{n} units',
    'agent.units.none': 'No units linked yet', 'agent.units.view': 'View units',
    'agent.photo': 'Photo of {name}',
    'agent.soon': 'Contact details appear once the agent is added.',
    'agent.wa.generic': 'Hello {name}, I found you on the ICONIC website.',
    'agent.wa.unit': 'Hello {name}, I would like to ask about {ref}.',
    'detail.agent': 'Handled by',
    'props.filter.region': 'Region',
    'props.agentfilter': 'Showing units handled by {name}', 'props.agentfilter.clear': 'Show all units',
    'hs.region.text': 'Properties and the sales team for {region}.',
    'hs.region.props': 'Properties in {region}', 'hs.region.team': 'Meet the {region} team',
    'chap.teams': 'Teams',
    'chap.city': 'City', 'chap.skyline': 'Skyline', 'chap.properties': 'Properties', 'chap.story': 'Story', 'chap.contact': 'Contact',
    'meta.title': 'ICONIC Real Estate — Property brokerage across Egypt',
    'meta.desc': 'ICONIC Real Estate is a property brokerage working across Egypt. Browse units in Alexandria, the North Coast, Cairo and the Red Sea and request a viewing.',
    'cursor.drag': 'Drag',
    'contact.address': 'Address', 'contact.hours': 'Working hours', 'contact.follow': 'Follow us',
    'pg.home': 'Home', 'home.regions': 'Browse properties by region', 'pg.all': 'All properties', 'pg.menu': 'Menu', 'pg.props.title': 'Properties',
    'pg.props.lede': 'Browse the units we handle. Open a unit for photos, details and the agent who handles it.',
    'pg.region.title': 'Properties in {region}', 'pg.region.lede': 'Units handled by the {region} sales team. Open a unit for details, or contact the team directly.',
    'pg.region.empty': 'No units are published for {region} yet.', 'pg.region.team': 'The {region} team', 'pg.region.count': '{n} units',
    'pg.prop.gallery': 'Photos', 'pg.prop.specs': 'Details', 'pg.prop.about': 'About this unit', 'pg.prop.ask': 'Ask about this unit', 'pg.prop.back': 'All properties', 'pg.prop.related': 'More in {region}', 'prop.ref': 'Reference',
    'pg.404.title': 'Page not found', 'pg.404.body': 'The page you are looking for does not exist or has moved.', 'pg.404.cta': 'Back to the home page'
  },
  ar: {
    'skip.content': 'انتقل إلى المحتوى',
    'nav.properties': 'العقارات', 'nav.skyline': 'الأفق', 'nav.about': 'عن ICONIC', 'nav.contact': 'تواصل معنا', 'nav.menu': 'القائمة', 'nav.close': 'إغلاق',
    'cta.viewing': 'اطلب معاينة', 'cta.inquiry': 'أرسل استفسارًا',
    'lang.label': 'English', 'lang.aria': 'التبديل إلى الإنجليزية',
    'intro.skip': 'تخطَّ المقدمة',
    'hero.title': 'ما بعد المألوف.',
    'hero.support': 'عقارات استثنائية ورؤية استثمارية، تُقدَّم بما يناسب ما تبحث عنه.',
    'hero.explore': 'استكشف الأفق', 'hero.scroll': 'مرّر للأسفل',
    'sky.title': 'اكتشف الأفق',
    'sky.hint.pointer': 'اسحب للتوجيه. مرّر للتقدّم. اختر علامة للتوجّه إليها.',
    'sky.hint.touch': 'اسحب جانبيًا للتوجيه. مرّر للتقدّم. المس علامة للتوجّه إليها.',
    'sky.hint.static': 'اختر نقطة أدناه لمعرفة المزيد.',
    'sky.recenter': 'إعادة ضبط الزاوية', 'sky.rotate': 'دوران تلقائي', 'sky.gyro': 'إمالة مع الجهاز',
    'sky.gyro.denied': 'مستشعرات الحركة غير متاحة هنا.', 'sky.gyro.on': 'تم تفعيل التحكم بالإمالة.', 'sky.list': 'نقاط الأفق',
    'hs.brand.title': 'معلم ICONIC',
    'hs.brand.text': 'شعار ICONIC مُجسَّدًا كمَعلَم في نهاية الجادة.',
    'hs.brand.cta': 'عن ICONIC',
    'hs.slot.title': 'نقطة الأفق {n}',
    'hs.slot.text': 'لم تُربط بعد. عند ربط المحتوى المعتمد، ستفتح هذه النقطة عقارًا معروضًا أو منطقة حقيقية.',
    'hs.back': 'العودة إلى الجادة',
    'props.title': 'استكشاف العقارات',
    'props.lede': 'وحدات في الإسكندرية والساحل الشمالي والقاهرة والبحر الأحمر، ويتولى كل وحدة وكيل محدد من ICONIC.',
    'props.empty.title': 'لا توجد عقارات منشورة بعد',
    'props.empty.body': 'عند اعتماد العقارات المعروضة ستظهر هنا مع مرشّحات للنوع والغرض والموقع.',
    'props.preview': 'معاينة تخطيط البطاقات', 'props.preview.off': 'إخفاء المعاينة',
    'props.preview.note': 'بطاقات تجريبية لمراجعة التصميم فقط، وليست عقارات حقيقية.',
    'props.filter.all': 'الكل', 'props.filter.type': 'النوع', 'props.filter.purpose': 'الغرض', 'props.count': 'المعروض: {n}',
    'prop.open': 'عرض التفاصيل', 'prop.price.none': 'السعر عند الطلب',
    'prop.beds': 'غرف النوم', 'prop.baths': 'الحمامات', 'prop.area': 'المساحة', 'prop.type': 'النوع', 'prop.purpose': 'الغرض', 'prop.location': 'الموقع',
    'prop.close': 'إغلاق التفاصيل', 'unit.sqm': 'م²', 'foot.admin': 'لوحة الإدارة', 'prop.project': 'المشروع', 'prop.sample': 'عقار تجريبي وليس عقارًا حقيقيًا.',
    'story.title': 'ما تقوم عليه ICONIC',
    'story.lede': 'هوية واحدة تحملها كل صفحة وكل محادثة وكل عقار نعرضه.',
    'story.1': 'انتقاء دقيق', 'story.2': 'فخامة خالدة', 'story.3': 'الثقة', 'story.4': 'المكانة',
    'story.5': 'الرقيّ', 'story.6': 'التفرّد', 'story.7': 'الذكاء الاستثماري', 'story.8': 'الابتكار العصري',
    'conv.title': 'فصلك القادم يبدأ هنا.', 'conv.lede': 'أخبرنا بما تبحث عنه.',
    'form.title': 'استفسار أو معاينة', 'form.interest': 'أرغب في',
    'form.interest.inquiry': 'إرسال استفسار', 'form.interest.viewing': 'طلب معاينة',
    'form.name': 'الاسم الكامل', 'form.phone': 'الهاتف', 'form.email': 'البريد الإلكتروني', 'form.message': 'الرسالة',
    'form.consent': 'أوافق على التواصل معي بخصوص هذا الطلب.',
    'form.submit.inquiry': 'إرسال الاستفسار', 'form.submit.viewing': 'طلب المعاينة',
    'form.err.name': 'أدخل اسمك الكامل.', 'form.err.contact': 'أدخل رقم هاتف أو بريدًا إلكترونيًا.',
    'form.err.email': 'أدخل بريدًا إلكترونيًا صحيحًا، مثل name@example.com.',
    'form.err.phone': 'أدخل رقم هاتف صحيحًا باستخدام الأرقام والمسافات و+ و-.',
    'form.err.consent': 'حدّد المربع لنتمكن من التواصل معك.',
    'form.err.wait': 'انتظر بضع ثوانٍ قبل الإرسال مرة أخرى.',
    'form.proto': 'وضع النموذج الأولي: اجتازت بياناتك التحقق لكنها لم تُرسل، لأنه لم يُربط أي مسار لاستقبال النموذج بعد.',
    'form.sent': 'شكرًا لك. تم إرسال طلبك.', 'form.fail': 'تعذّر إرسال طلبك. حاول مرة أخرى أو استخدم وسيلة تواصل أخرى.', 'form.sending': 'جارٍ الإرسال…',
    'foot.rights': 'ICONIC Real Estate', 'foot.replay': 'إعادة تشغيل المقدمة',
    'contact.whatsapp': 'واتساب', 'contact.call': 'اتصال', 'contact.email': 'بريد إلكتروني',
    'mobile.viewing': 'اطلب معاينة', 'mobile.inquiry': 'استفسر',
    'nav.teams': 'الفرق',
    'teams.title': 'فرق المبيعات',
    'teams.lede': 'فريق لكل منطقة. تعرّف على الوكلاء، وشاهد الوحدات التي يتولونها، وتواصل معهم مباشرة.',
    'teams.region': 'المنطقة', 'teams.all': 'كل المناطق',
    'teams.empty.title': 'لا توجد فرق مبيعات منشورة بعد',
    'teams.empty.body': 'عند إضافة فرق المبيعات ستظهر هنا حسب المنطقة مع صور الوكلاء ووحداتهم وبيانات التواصل.',
    'teams.preview': 'معاينة تخطيط الفرق', 'teams.preview.off': 'إخفاء المعاينة',
    'teams.preview.note': 'فرق ووكلاء تجريبيون لمراجعة التصميم فقط، وليسوا أشخاصًا حقيقيين.',
    'team.agents.one': 'وكيل واحد', 'team.agents.two': 'وكيلان', 'team.agents.few': '{n} وكلاء', 'team.agents.many': '{n} وكيلًا', 'team.agents.other': '{n} وكيل',
    'team.units.one': 'وحدة واحدة', 'team.units.two': 'وحدتان', 'team.units.few': '{n} وحدات', 'team.units.many': '{n} وحدة', 'team.units.other': '{n} وحدة',
    'agent.units.none': 'لا توجد وحدات مرتبطة بعد', 'agent.units.view': 'عرض الوحدات',
    'agent.photo': 'صورة {name}',
    'agent.soon': 'تظهر بيانات التواصل عند إضافة الوكيل.',
    'agent.wa.generic': 'مرحبًا {name}، وجدت بياناتك على موقع ICONIC.',
    'agent.wa.unit': 'مرحبًا {name}، أودّ الاستفسار عن {ref}.',
    'detail.agent': 'يتولاها',
    'props.filter.region': 'المنطقة',
    'props.agentfilter': 'المعروض: الوحدات التي يتولاها {name}', 'props.agentfilter.clear': 'عرض كل الوحدات',
    'hs.region.text': 'عقارات وفريق المبيعات في {region}.',
    'hs.region.props': 'العقارات في {region}', 'hs.region.team': 'تعرّف على فريق {region}',
    'chap.teams': 'الفرق',
    'chap.city': 'المدينة', 'chap.skyline': 'الأفق', 'chap.properties': 'العقارات', 'chap.story': 'القصة', 'chap.contact': 'التواصل',
    'meta.title': 'ICONIC Real Estate — وساطة عقارية في مصر',
    'meta.desc': 'ICONIC Real Estate شركة وساطة عقارية تعمل في أنحاء مصر. تصفّح الوحدات في الإسكندرية والساحل الشمالي والقاهرة والبحر الأحمر، واطلب معاينة.',
    'cursor.drag': 'اسحب',
    'contact.address': 'العنوان', 'contact.hours': 'ساعات العمل', 'contact.follow': 'تابعنا',
    'pg.home': 'الرئيسية', 'home.regions': 'تصفّح العقارات حسب المنطقة', 'pg.all': 'كل العقارات', 'pg.menu': 'القائمة', 'pg.props.title': 'العقارات',
    'pg.props.lede': 'تصفّح الوحدات التي نتولاها. افتح أي وحدة لتشاهد صورها وتفاصيلها والوكيل المسؤول عنها.',
    'pg.region.title': 'عقارات {region}', 'pg.region.lede': 'وحدات يتولاها فريق مبيعات {region}. افتح أي وحدة لتفاصيلها، أو تواصل مع الفريق مباشرة.',
    'pg.region.empty': 'لا توجد وحدات منشورة في {region} حاليًا.', 'pg.region.team': 'فريق {region}', 'pg.region.count': '{n} وحدة',
    'pg.prop.gallery': 'الصور', 'pg.prop.specs': 'التفاصيل', 'pg.prop.about': 'عن هذه الوحدة', 'pg.prop.ask': 'اسأل عن هذه الوحدة', 'pg.prop.back': 'كل العقارات', 'pg.prop.related': 'المزيد في {region}', 'prop.ref': 'الرقم المرجعي',
    'pg.404.title': 'الصفحة غير موجودة', 'pg.404.body': 'الصفحة التي تبحث عنها غير موجودة أو تم نقلها.', 'pg.404.cta': 'العودة إلى الصفحة الرئيسية'
  }
};
/* the shipped copy, kept so the dashboard can show defaults and restore them */
const I18N_BASE = JSON.parse(JSON.stringify(I18N));
const App = { lang: (SERVER && SERVER.lang) || 'en', reduced: mqReduced.matches, previewOn: false, filters: { type: null, purpose: null, region: null, agent: null }, teamsPreview: false, teamRegion: null, selected: -1, stageActive: false, introRunning: false };
const t = (key, vars) => {
  let s = (I18N[App.lang] && I18N[App.lang][key]) || I18N.en[key] || key;
  if (vars) for (const k in vars) s = s.replace('{' + k + '}', vars[k]);
  return s;
};

const plural = (base, n) => {
  let cat = 'other'; try { cat = new Intl.PluralRules(App.lang === 'ar' ? 'ar' : 'en').select(n); } catch (e) { /* keep 'other' */ }
  return t(I18N[App.lang][base + '.' + cat] ? base + '.' + cat : base + '.other', { n: fmtNum(n) });
};
/* a name or label may be plain text or { en, ar } */
const L = (v) => (v && typeof v === 'object') ? (v[App.lang] || v.en || v.ar || '') : (v == null ? '' : String(v));
/* a link a hotspot may use: an in-page anchor or an https address */
const safeHref = (u) => (typeof u === 'string' && (/^#[\w-]+$/.test(u.trim()) || /^https:\/\/\S+$/i.test(u.trim()))) ? u.trim() : '';

/* --- Analytics: nothing leaves the page unless consent is granted by the site's consent layer. --- */
window.ICONIC = window.ICONIC || { consent: false };
function track(name, params) {
  if (!window.ICONIC.consent) return;
  const evt = Object.assign({ event: name }, params || {});
  (window.dataLayer = window.dataLayer || []).push(evt);
  doc.dispatchEvent(new CustomEvent('iconic:track', { detail: evt }));
}
