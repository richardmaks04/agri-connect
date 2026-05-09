require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/database');
const Content = require('./models/Content');
const Question = require('./models/Question');
const User = require('./models/User');

// ─── Sample Users (for seeding author references) ────────────────────────────
const SEED_USERS = [
  { name: 'Dr. Adebayo Ogundimu',     role: 'expert',    email: 'adebayo@agriconnect.ng' },
  { name: 'Dr. Fatima Suleiman',      role: 'expert',    email: 'fatima@agriconnect.ng' },
  { name: 'Engr. Chukwuemeka Eze',    role: 'extension', email: 'chukwuemeka@agriconnect.ng' },
  { name: 'Mrs. Ngozi Okonkwo',       role: 'expert',    email: 'ngozi@agriconnect.ng' },
  { name: 'Prof. Ibrahim Musa',       role: 'expert',    email: 'ibrahim@agriconnect.ng' },
  { name: 'Alhaji Sani Abdullahi',    role: 'farmer',    email: 'sani@agriconnect.ng' },
  { name: 'Mrs. Chioma Nwosu',        role: 'farmer',    email: 'chioma@agriconnect.ng' },
  { name: 'Mr. Tunde Akintola',       role: 'farmer',    email: 'tunde@agriconnect.ng' },
  { name: 'Miss Aisha Bello',         role: 'farmer',    email: 'aisha@agriconnect.ng' },
  { name: 'Mr. Emeka Obi',            role: 'extension', email: 'emeka@agriconnect.ng' },
];

// ─── 10 Articles ─────────────────────────────────────────────────────────────
const ARTICLES = [
  {
    title: 'Best Practices for Maize Cultivation in Southwest Nigeria',
    summary: 'A complete guide to planting, fertilizing, and harvesting maize for maximum yield in the southwest region.',
    content: `<h2>Introduction</h2>
<p>Maize (Zea mays) is one of the most important cereal crops in Nigeria, serving as both a staple food and a key source of income for millions of smallholder farmers. The southwest zone, with its bimodal rainfall pattern, offers two cropping seasons per year, making it highly productive for maize cultivation.</p>
<h2>Soil Preparation</h2>
<p>Ensure your soil pH is between 5.8 and 7.0 for optimal growth. Conduct a soil test before planting to identify deficiencies. Apply 2–3 tonnes of well-decomposed farmyard manure per hectare and incorporate it into the soil 2 weeks before planting.</p>
<h2>Variety Selection</h2>
<p>Use improved varieties such as SAMMAZ 15, SAMMAZ 29, or ACRC 99 SUWAN-1-SR, which are drought-tolerant and high-yielding. Certified seed from registered agro-input dealers ensures better germination rates above 85%.</p>
<h2>Planting</h2>
<p>Plant at the onset of the main rains (March–April for the first season). Space rows 75 cm apart with 25 cm between plants, giving a population of approximately 53,000 plants per hectare. Sow 2 seeds per hole at 3–4 cm depth and thin to 1 plant after 2 weeks.</p>
<h2>Fertilizer Application</h2>
<p>Apply NPK 15:15:15 at 200 kg/ha at planting. Top-dress with urea (46% N) at 100 kg/ha when the crop is knee-high (3–4 weeks after planting). A second urea top-dressing at tasseling improves grain fill significantly.</p>
<h2>Pest and Disease Management</h2>
<p>The Fall Armyworm (Spodoptera frugiperda) is currently the most destructive pest of maize in Nigeria. Scout your field weekly and apply recommended pesticides (e.g., emamectin benzoate) at the first sign of infestation. Streak virus, spread by leafhoppers, is best managed by planting resistant varieties.</p>
<h2>Harvesting</h2>
<p>Harvest when husks are dry and brown, and grain moisture content is below 20%. Sun-dry to 13% moisture before storage to prevent mould and aflatoxin contamination.</p>`,
    contentType: 'article',
    authorIndex: 0,
    specs: ['cereal_crops'],
    topics: ['planting', 'fertilization', 'harvesting', 'pest_management'],
    difficulty: 'beginner',
    regions: ['southwest', 'all'],
    seasons: ['wet_season'],
    tags: ['maize', 'cereal', 'southwest', 'beginner', 'fertilizer'],
  },
  {
    title: 'Poultry Disease Prevention: Vaccination Schedule for Broilers',
    summary: 'Learn the essential vaccination timeline to keep your broiler flock healthy and productive from day-old to market weight.',
    content: `<h2>Why Vaccination Matters</h2>
<p>Disease outbreaks are the leading cause of economic loss in poultry farming in Nigeria. A single Newcastle Disease (ND) outbreak can wipe out an entire flock within days. Proper vaccination is the most cost-effective insurance you can buy as a poultry farmer.</p>
<h2>Day 1: Marek's Disease Vaccine</h2>
<p>Administer the Marek's Disease vaccine in the hatchery on day 1. If you purchase day-old chicks, confirm with your supplier that this has been done. Marek's causes paralysis and tumours and has no treatment once contracted.</p>
<h2>Day 7–10: Newcastle Disease (ND) + Infectious Bronchitis (IB)</h2>
<p>Use the La Sota or Clone 30 ND vaccine via eye drop or drinking water. Simultaneously administer IB H120 strain. Withdraw water 1 hour before vaccinating and ensure drinkers are clean of chlorine residue, which kills live vaccines.</p>
<h2>Day 14: Gumboro (Infectious Bursal Disease)</h2>
<p>IBD (Gumboro) destroys the bursa of Fabricius, crippling the immune system. Use a mild intermediate strain via drinking water. A second dose may be given at day 21 in high-challenge areas.</p>
<h2>Day 21: Newcastle Disease Booster</h2>
<p>Give a booster ND vaccination. By this age, maternal antibodies have declined and birds are more susceptible. This booster is critical for flocks raised beyond 6 weeks.</p>
<h2>Day 28: Fowl Pox</h2>
<p>Wing-web stab method only. Check the vaccination site at day 35 — a small scab confirms a successful take. Fowl pox causes scabs on unfeathered skin and dramatically reduces growth rate.</p>
<h2>Biosecurity Reminder</h2>
<p>No vaccination programme compensates for poor biosecurity. Maintain an all-in all-out system, use footbaths at entry points, limit visitor access, and source chicks from reputable hatcheries with good health records.</p>`,
    contentType: 'guide',
    authorIndex: 1,
    specs: ['poultry'],
    topics: ['vaccination', 'feeding'],
    difficulty: 'intermediate',
    regions: ['all'],
    seasons: ['all'],
    tags: ['poultry', 'broiler', 'vaccination', 'disease prevention', 'newcastle'],
  },
  {
    title: 'Catfish Pond Management: Water Quality Essentials',
    summary: 'How to monitor and maintain ideal water conditions for profitable catfish production in earthen and concrete ponds.',
    content: `<h2>Why Water Quality Determines Your Profit</h2>
<p>In catfish farming, water is the air your fish breathe. Poor water quality causes stress, suppresses immunity, stunts growth, and ultimately kills your fish. Understanding and managing key parameters is non-negotiable for profitable production.</p>
<h2>Dissolved Oxygen (DO)</h2>
<p>DO should remain above 5 mg/L at all times. Catfish can tolerate lower levels briefly but chronic low DO causes chronic stress and poor feed conversion. Run aerators at night when algae consume oxygen rather than produce it. Investigate immediately if fish are seen gasping at the surface — this is an emergency.</p>
<h2>pH</h2>
<p>Optimal pH for catfish is 6.5–8.5. Test twice daily (morning and evening) as photosynthesis by algae raises pH during the day and respiration lowers it at night. Apply agricultural lime (CaCO₃) at 100–200 kg/ha to raise pH in acidic ponds.</p>
<h2>Temperature</h2>
<p>Catfish grow best at 26–30°C. Growth slows below 20°C and ceases below 15°C. In northern Nigeria, production may slow significantly between December and February. Shade structures over small ponds can reduce temperature fluctuations.</p>
<h2>Ammonia</h2>
<p>Total ammonia nitrogen (TAN) above 2 mg/L is toxic. Ammonia accumulates from fish waste and uneaten feed. Never overfeed — remove uneaten feed after 30 minutes. Partial water changes (20–30%) help dilute ammonia build-up in intensive systems.</p>
<h2>Managing Algae Blooms</h2>
<p>Moderate green water (Secchi disk reading 30–40 cm) is healthy and indicates a productive phytoplankton bloom. However, a sudden crash of dense algae blooms causes catastrophic DO depletion. A whitish-brown colour and fishy smell indicate a bloom crash — perform a 30% water change immediately and run aerators continuously.</p>
<h2>Record Keeping</h2>
<p>Keep a daily log of water parameters, feeding rates, and fish behaviour. Patterns in your records will help you anticipate problems before they become disasters.</p>`,
    contentType: 'article',
    authorIndex: 2,
    specs: ['fisheries'],
    topics: ['water_quality', 'pond_management'],
    difficulty: 'intermediate',
    regions: ['all'],
    seasons: ['all'],
    tags: ['catfish', 'fisheries', 'water quality', 'pond management', 'aquaculture'],
  },
  {
    title: 'Growing Tomatoes in the Dry Season: Irrigation and Profit Strategy',
    summary: 'Practical irrigation strategies to grow profitable tomatoes year-round and capture the high dry-season market prices.',
    content: `<h2>The Dry Season Opportunity</h2>
<p>Tomato prices in Nigeria are highest between November and February, when supply from rainfed farms collapses. A well-managed dry-season tomato farm can earn 3–5 times the revenue of a wet-season farm on the same land. The key investment is irrigation.</p>
<h2>Variety Selection</h2>
<p>Use heat-tolerant, firm-fruited varieties for the dry season. Recommended varieties include Tropimech, UC82B, Roma VF, and Petomech. These have better shelf life — critical when roads are poor and market access is irregular.</p>
<h2>Nursery Management</h2>
<p>Raise seedlings in a shaded nursery for 4–5 weeks. Use a well-drained nursery mix of topsoil, sand, and compost (1:1:1). Water twice daily and harden seedlings by reducing shade in the last week before transplanting.</p>
<h2>Drip Irrigation</h2>
<p>Drip irrigation reduces water usage by up to 60% compared to flood irrigation and virtually eliminates leaf-wetting diseases like early blight. Initial setup cost is higher, but the water savings and yield improvement pay back the investment within one season for most farmers.</p>
<h2>Mulching</h2>
<p>Apply dry grass, rice straw, or black plastic mulch immediately after transplanting. Mulch reduces soil temperature by 3–5°C, suppresses weeds, and retains soil moisture, reducing irrigation frequency by 30–40%.</p>
<h2>Fertilization</h2>
<p>Apply NPK 15:15:15 at transplanting, then switch to a high-potassium fertilizer (e.g., NPK 12:12:17+2) from flowering onwards. Potassium improves fruit quality, firmness, and shelf life. Calcium deficiency causes blossom end rot — apply calcium nitrate foliar spray weekly from fruit set.</p>
<h2>Disease Management</h2>
<p>Early and late blight are the most common fungal diseases. Apply copper-based fungicides preventatively every 7–10 days from 3 weeks after transplanting. Bacterial wilt has no cure — remove and burn affected plants immediately and avoid replanting tomatoes in that spot for at least 2 seasons.</p>`,
    contentType: 'guide',
    authorIndex: 3,
    specs: ['horticulture'],
    topics: ['planting', 'soil_health', 'pest_management'],
    difficulty: 'beginner',
    regions: ['all'],
    seasons: ['dry_season'],
    tags: ['tomatoes', 'horticulture', 'irrigation', 'dry season', 'profit'],
  },
  {
    title: 'Soybean Farming: Boosting Yield with Rhizobium Inoculation',
    summary: 'How to use biological nitrogen fixation to cut fertilizer costs by up to 40% and improve soybean yield.',
    content: `<h2>What is Rhizobium?</h2>
<p>Rhizobium japonicum is a soil bacterium that forms a symbiotic relationship with soybean roots, creating nodules in which atmospheric nitrogen (N₂) is converted to ammonium (NH₄⁺) — a form plants can absorb and use for growth. A well-nodulated soybean crop can fix 100–300 kg of nitrogen per hectare per season, dramatically reducing or eliminating the need for expensive nitrogen fertilizers.</p>
<h2>Why Nigerian Soils Often Need Inoculation</h2>
<p>Many Nigerian soils, particularly those that have not previously grown soybeans, lack adequate populations of the correct Rhizobium strain. Without inoculation, nodulation is poor or absent, and the crop must depend entirely on soil nitrogen, resulting in low yields.</p>
<h2>How to Inoculate</h2>
<p>Purchase fresh, certified Rhizobium inoculant from a reputable agro-dealer. Mix the inoculant with a small amount of sugar solution to make a slurry, then coat the seeds evenly. Plant immediately — do not leave inoculated seeds in direct sunlight for more than 15 minutes, as UV radiation kills the bacteria. Inoculant has a shelf life and must be stored below 25°C.</p>
<h2>Checking for Successful Nodulation</h2>
<p>At 4–5 weeks after planting, uproot one plant and inspect the roots. Healthy, active nodules are pink or red inside when cut open. White or brown nodules indicate inactive fixation. If nodulation is poor, apply a small amount of nitrogen fertilizer (30 kg N/ha) as a rescue application.</p>
<h2>Expected Yield Benefits</h2>
<p>Properly inoculated soybeans consistently yield 20–35% more than uninoculated crops. On plots with no prior soybean history, the yield advantage can be even higher. TGx 1448-2E and TGx 1835-10E are recommended high-yielding varieties for Nigeria that respond well to inoculation.</p>
<h2>Rotation Benefits</h2>
<p>Soybeans fix residual nitrogen that benefits the following crop. A maize crop planted after soybeans typically requires 40–60 kg/ha less nitrogen fertilizer to achieve the same yield as maize after a non-legume crop.</p>`,
    contentType: 'article',
    authorIndex: 4,
    specs: ['legumes'],
    topics: ['planting', 'soil_health', 'fertilization'],
    difficulty: 'intermediate',
    regions: ['all'],
    seasons: ['wet_season'],
    tags: ['soybean', 'legumes', 'nitrogen fixation', 'rhizobium', 'fertilizer'],
  },
  {
    title: 'Layer Poultry Farming: Maximising Egg Production',
    summary: 'A practical guide to nutrition, lighting, and flock management for consistent high egg production from your layer birds.',
    content: `<h2>Choosing the Right Breed</h2>
<p>The most popular commercial layer breeds in Nigeria are Isa Brown, Shaver Brown, and Lohmann Brown. These hybrids reliably produce 300–320 eggs per bird per year under good management. Avoid local breeds for commercial egg production — their laying rates are too low to be economical at scale.</p>
<h2>Nutrition is Everything</h2>
<p>Layers require a diet with 16–18% crude protein and 3.5–4.5% calcium (for eggshell formation). Feed approximately 110–120 g per bird per day. Calcium deficiency is the most common nutritional error — thin-shelled or shell-less eggs are the first sign. Offer oyster shell or ground limestone free-choice at all times as a calcium supplement.</p>
<h2>Lighting Programme</h2>
<p>Egg production is triggered by day length. Layers need at least 16 hours of light per day to maintain peak production. In Nigeria, natural day length varies from about 11.5 to 12.5 hours — always below the 16-hour threshold. Supplemental lighting (even low-wattage bulbs at 10 watts per 10 m² of floor space) is essential and typically increases production by 15–25%.</p>
<h2>Water</h2>
<p>Clean, cool water must be available at all times. A layer drinks 180–250 ml of water per day — twice as much in hot weather. Water deprivation for even 6–8 hours causes a measurable drop in egg production that may take 3–4 weeks to fully recover.</p>
<h2>Flock Health Indicators</h2>
<p>Monitor your flock daily. Healthy layers are active, alert, and vocal. Warning signs include pale combs, droopy posture, reduced feed intake, diarrhoea, or a sudden drop in egg production. Investigate any unexplained 5%+ drop in daily egg count immediately.</p>
<h2>Record Keeping</h2>
<p>Record daily egg collection, feed consumption, water intake, mortality, and any treatments given. Calculate your hen-day production percentage weekly. Target above 75% for the first year. Records help you identify problems early and make better management decisions.</p>`,
    contentType: 'article',
    authorIndex: 1,
    specs: ['poultry'],
    topics: ['feeding', 'vaccination'],
    difficulty: 'beginner',
    regions: ['all'],
    seasons: ['all'],
    tags: ['layers', 'eggs', 'poultry', 'nutrition', 'lighting'],
  },
  {
    title: 'Soil Health: Understanding and Improving Your Farm Soil',
    summary: 'How to read your soil, interpret soil test results, and build long-term fertility for sustainable crop production.',
    content: `<h2>Why Soil Health Matters</h2>
<p>Healthy soil is the foundation of every successful farm. Beyond chemical fertility, soil health encompasses biological activity (earthworms, bacteria, fungi), physical structure (aeration, water holding capacity), and chemical balance (pH, nutrient availability). A crop grown in healthy soil produces more with fewer inputs.</p>
<h2>Getting a Soil Test</h2>
<p>Soil testing is the single most cost-effective investment a farmer can make. In Nigeria, soil testing services are available through the National Root Crops Research Institute (NRCRI), state agricultural development programmes (ADPs), and several private laboratories. Collect soil samples at 0–20 cm depth from at least 10 random spots in your field, mix thoroughly, and submit 500 g for analysis.</p>
<h2>Understanding pH</h2>
<p>Soil pH controls the availability of almost every plant nutrient. Most crops grow best at pH 6.0–7.0. Below pH 5.5, aluminium and manganese become toxic and phosphorus becomes unavailable. Apply agricultural lime (calcium carbonate) to raise pH — typical rates are 1–3 tonnes per hectare, incorporated 3 months before planting.</p>
<h2>Organic Matter</h2>
<p>Organic matter feeds soil microbes, improves water retention, and slowly releases nutrients. Nigerian soils typically have very low organic matter (below 1.5%) due to high temperatures that accelerate decomposition and the removal of crop residues. Target above 2% by incorporating compost, green manures, or crop residues every season.</p>
<h2>Cover Cropping</h2>
<p>Mucuna (velvet bean), lablab, and cowpea are excellent cover crops for Nigerian conditions. They protect soil from erosion, suppress weeds, and fix nitrogen. Slash and incorporate as green manure 3–4 weeks before planting your main crop.</p>
<h2>Avoiding Compaction</h2>
<p>Soil compaction reduces root penetration and water infiltration. Minimise tillage, avoid working wet soil, and use controlled traffic zones for machinery. A simple penetrometer test — or even pushing a metal rod into the soil by hand — can detect a hardpan layer that may be limiting your yields.</p>`,
    contentType: 'article',
    authorIndex: 4,
    specs: ['cereal_crops', 'legumes', 'horticulture'],
    topics: ['soil_health', 'fertilization'],
    difficulty: 'intermediate',
    regions: ['all'],
    seasons: ['all'],
    tags: ['soil health', 'pH', 'organic matter', 'soil test', 'compost'],
  },
  {
    title: 'Tilapia Farming in Cages: A Beginner\'s Guide',
    summary: 'How to set up and manage a profitable cage tilapia operation on a river, reservoir, or large pond.',
    content: `<h2>Why Cage Culture?</h2>
<p>Cage fish farming allows farmers to produce fish intensively in a limited water body without the land requirements of earthen pond farming. Cages can be set up on rivers, reservoirs, and large ponds, and stocking densities can be 5–10 times higher than earthen ponds, dramatically increasing production per unit area.</p>
<h2>Cage Design and Construction</h2>
<p>A standard starter cage is 3 m × 3 m × 2 m (18 m³). Frames are typically constructed from galvanised iron pipes or hardwood, with knotless polyethylene netting of 12–25 mm mesh size depending on fish size. Floating drums or polystyrene blocks provide buoyancy. Always moor cages securely — a lost cage means total loss of fish.</p>
<h2>Site Selection</h2>
<p>Choose sites with gentle water flow (0.1–0.3 m/s) to provide oxygen and flush waste. Avoid areas with excessive water hyacinth, fluctuating water levels, strong winds, or heavy boat traffic. Water depth below the cage should be at least 1.5 m.</p>
<h2>Stocking</h2>
<p>Stock Nile tilapia (Oreochromis niloticus) at 100–150 fingerlings per m³ for beginner operations. Use all-male monosex fingerlings to prevent reproduction and energy wasted on eggs and fry. Purchase from a reputable hatchery and acclimatise fingerlings slowly to cage water before releasing.</p>
<h2>Feeding</h2>
<p>Feed a complete extruded floating pellet with 28–32% crude protein. Feed 3 times daily at 3–5% of body weight, adjusting weekly as fish grow. Floating pellets allow you to observe feeding behaviour — if fish are not taking feed within 10 minutes, reduce ration immediately. Overfeeding is the most common mistake in cage culture and pollutes the water body.</p>
<h2>Harvesting</h2>
<p>Tilapia reach market weight (300–500 g) in 5–7 months at water temperatures above 25°C. Harvest at night or in the early morning when temperatures are coolest to reduce handling stress and mortality. Grade fish before sale to achieve better market prices.</p>`,
    contentType: 'guide',
    authorIndex: 2,
    specs: ['fisheries'],
    topics: ['pond_management', 'feeding'],
    difficulty: 'beginner',
    regions: ['all'],
    seasons: ['all'],
    tags: ['tilapia', 'cage farming', 'fisheries', 'aquaculture', 'beginner'],
  },
  {
    title: 'Cowpea Production: A High-Value Crop for the Dry Season',
    summary: 'How to grow cowpea profitably in the dry season using simple irrigation and integrated pest management.',
    content: `<h2>Cowpea: Nigeria\'s Protein Crop</h2>
<p>Nigeria is the world's largest producer and consumer of cowpea (Vigna unguiculata), accounting for over 60% of global production. Cowpea is a vital source of affordable protein for millions of Nigerians and commands strong market prices, particularly in the dry season when fresh vegetable cowpea (drum) fetches premium prices in urban markets.</p>
<h2>Variety Selection</h2>
<p>IITA has developed a wide range of improved cowpea varieties adapted to Nigerian conditions. IT97K-499-35 and IT98K-205-8 are widely grown for grain. For fresh vegetable cowpea production, Oloyin and Drum are preferred in the southwest. Ife Brown is a popular variety in the southeast.</p>
<h2>Planting</h2>
<p>Plant at 60 × 20 cm spacing for grain, or 60 × 30 cm for vegetable types to allow better air circulation. Inoculate with cowpea-compatible Rhizobium bradyrhizobium for improved nitrogen fixation. Avoid heavy nitrogen fertilizer — it suppresses nodulation. Apply only phosphorus (single superphosphate at 200 kg/ha) at planting.</p>
<h2>Insect Pest Management</h2>
<p>Cowpea is attacked by numerous insect pests — thrips, aphids, pod borers, and bruchids in storage are the most economically important. The IITA-recommended spraying calendar (3 sprays at flowering, pod development, and grain filling) using a mixture of synthetic pyrethroid and dimethoate effectively controls most pod pests.</p>
<h2>Storage</h2>
<p>Cowpea grain is highly susceptible to bruchid (weevil) damage in storage. Sun-dry to below 11% moisture content. Store in hermetically sealed bags (e.g., Purdue Improved Crop Storage — PICS bags) to prevent oxygen from reaching grain-feeding insects. PICS bags can keep cowpea pest-free for 6–12 months without any insecticide.</p>`,
    contentType: 'article',
    authorIndex: 4,
    specs: ['legumes'],
    topics: ['planting', 'pest_management', 'storage'],
    difficulty: 'beginner',
    regions: ['all'],
    seasons: ['dry_season', 'wet_season'],
    tags: ['cowpea', 'legumes', 'storage', 'pest management', 'protein'],
  },
  {
    title: 'Pepper Farming: From Nursery to Market for Scotch Bonnet and Tatashe',
    summary: 'A step-by-step guide to producing high-yielding Scotch bonnet (rodo) and bell pepper (tatashe) for local and export markets.',
    content: `<h2>Market Overview</h2>
<p>Fresh pepper is one of the most traded agricultural commodities in Nigerian markets. Scotch bonnet (Capsicum chinense, locally called rodo or atarodo) and bell pepper (tatashe) are in demand year-round. Export opportunities to Nigerians in the diaspora through agricultural export aggregators are also growing rapidly.</p>
<h2>Nursery Stage (4–6 Weeks)</h2>
<p>Fill trays or nursery beds with a sterilised growing mix (soil:sand:compost in 2:1:1 ratio). Sow seeds 0.5 cm deep and water gently twice daily. Germination occurs in 7–14 days. Shade the nursery to reduce temperature. Harden seedlings before transplanting by gradually reducing shade over the final week.</p>
<h2>Field Preparation and Transplanting</h2>
<p>Pepper does best in well-drained loamy soil with pH 6.0–7.0. Make raised beds 1 m wide to improve drainage and ease of weeding. Transplant 4–6 week old seedlings at 50 × 50 cm spacing in the evening or on a cloudy day to reduce transplant shock. Water immediately after transplanting.</p>
<h2>Irrigation</h2>
<p>Pepper is highly sensitive to both drought and waterlogging. Drip irrigation maintains consistent soil moisture and is strongly recommended. Water requirement is approximately 5–7 mm/day during fruiting. Fluctuating moisture levels cause blossom drop and blossom end rot.</p>
<h2>Fertilization</h2>
<p>Base fertilizer: NPK 15:15:15 at 400 kg/ha incorporated into beds before transplanting. Top-dress with calcium ammonium nitrate (CAN) at 150 kg/ha at 6 and 10 weeks after transplanting. Apply potassium sulphate foliar spray during fruit development for improved quality.</p>
<h2>Disease and Pest Management</h2>
<p>Phytophthora blight is the most serious disease of pepper in Nigeria, causing sudden wilting and death. Plant on well-drained beds, avoid overhead irrigation, and apply metalaxyl-based fungicide preventatively. Fruit flies (Bactrocera species) damage ripening fruit — use protein bait traps and harvest frequently to minimise losses.</p>
<h2>Harvesting and Post-Harvest</h2>
<p>Harvest Scotch bonnet at full red colour for maximum market price. Bell pepper can be harvested green or red. Use clean clippers and handle gently to avoid bruising. Pack in ventilated crates and move to market quickly — fresh pepper has a shelf life of only 3–7 days at ambient temperature.</p>`,
    contentType: 'guide',
    authorIndex: 3,
    specs: ['horticulture'],
    topics: ['planting', 'harvesting', 'market', 'pest_management'],
    difficulty: 'intermediate',
    regions: ['all'],
    seasons: ['dry_season', 'wet_season'],
    tags: ['pepper', 'scotch bonnet', 'tatashe', 'horticulture', 'export'],
  },
];

// ─── 10 Community Questions (with multiple answers each) ─────────────────────
const QUESTIONS = [
  {
    title: 'My maize leaves are turning yellow from the bottom up — what is causing this?',
    content: 'I planted SAMMAZ 15 maize 4 weeks ago. The lower leaves started turning yellow at the tips and it is now spreading upwards. The soil was not tested before planting but I applied NPK 15:15:15 at planting. What could be the problem and how do I fix it?',
    specialization: 'cereal_crops',
    authorIndex: 5,
    tags: ['maize', 'yellowing', 'nutrient deficiency'],
    status: 'resolved',
    answers: [
      {
        authorIndex: 0,
        isExpert: true,
        accepted: true,
        content: 'The yellowing pattern you describe — starting from lower (older) leaves and moving upward — is a classic sign of nitrogen deficiency. Nitrogen is a mobile nutrient, so when the plant is deficient, it relocates nitrogen from older leaves to newer growth, causing the lower leaves to yellow and die. Apply urea (46% N) as a top dressing at 100–150 kg/ha as soon as possible. Broadcast around plants, not directly on the stem, and water in if rainfall is not expected within 48 hours. You should see improvement within 7–10 days. In future seasons, conduct a soil test to know your exact nitrogen status before planting.',
        helpful: 18,
      },
      {
        authorIndex: 9,
        isExpert: true,
        accepted: false,
        content: 'Your extension officer is correct. In addition to the urea top dressing, check your plant population. If plants are too dense (less than 60 cm between rows), inter-plant competition for nitrogen is more severe. Also verify that your soil pH is not below 5.5 — acidic soils lock up nitrogen even when it is present. A simple soil pH test kit from any agro-dealer can help you check this quickly.',
        helpful: 7,
      },
    ],
  },
  {
    title: 'What is the best way to prevent Newcastle Disease in my poultry farm?',
    content: 'I lost 200 birds to what the vet said was Newcastle Disease last year. I want to set up a proper prevention programme this year. I have 500 broilers currently 2 weeks old. What vaccination schedule should I follow and are there other biosecurity measures I need?',
    specialization: 'poultry',
    authorIndex: 6,
    tags: ['poultry', 'newcastle disease', 'vaccination', 'biosecurity'],
    status: 'answered',
    answers: [
      {
        authorIndex: 1,
        isExpert: true,
        accepted: false,
        content: 'For your 2-week-old broilers, start immediately with the La Sota Newcastle Disease vaccine via drinking water. Withhold water for 1–2 hours before vaccination so birds are thirsty and drink eagerly. Give a booster at week 4. For future flocks, begin ND vaccination at day 7. Beyond vaccination, strict biosecurity is essential: limit access to your farm, disinfect footwear at entry, implement all-in all-out stocking, and never mix birds of different ages. Clean and disinfect thoroughly between flocks and leave the house empty for at least 2 weeks.',
        helpful: 22,
      },
      {
        authorIndex: 5,
        isExpert: false,
        accepted: false,
        content: 'I had the same problem two years ago. What helped me most was sourcing day-old chicks from a reputable hatchery that vaccinates against Marek\'s disease and provides a health certificate. I also stopped allowing visitors into my poultry house. Since doing these things and following a proper vaccination schedule, I have not had another Newcastle outbreak.',
        helpful: 9,
      },
    ],
  },
  {
    title: 'How much capital do I need to start a catfish farm with 1000 fish?',
    content: 'I want to start a small catfish farm. My uncle has land with space for 2 concrete ponds. I am targeting 1000 fish to start. Can someone give me a realistic breakdown of startup costs and expected profit? I am in Ogun State.',
    specialization: 'fisheries',
    authorIndex: 7,
    tags: ['catfish', 'startup cost', 'capital', 'Ogun', 'business plan'],
    status: 'answered',
    answers: [
      {
        authorIndex: 2,
        isExpert: true,
        accepted: false,
        content: 'For a 1000-fish starter operation in Ogun State, here is a rough cost breakdown: Pond construction (2 concrete ponds 3×4×1.2m): ₦150,000–₦200,000. Fingerlings (1000 at ₦80 each): ₦80,000. Feed for 6 months (approximately 800–1000 kg): ₦280,000–₦350,000. Juveniles and management costs: ₦30,000. Total startup: approximately ₦540,000–₦660,000. Expected revenue: 1000 fish × 70% survival × 1.2 kg average × ₦1,400/kg = approximately ₦1,176,000. Net profit first cycle: roughly ₦500,000–₦600,000. Note: feed cost is your biggest variable — buy directly from millers in bulk to reduce cost.',
        helpful: 31,
      },
      {
        authorIndex: 9,
        isExpert: true,
        accepted: false,
        content: 'Good estimate above. I want to add that you should factor in borehole or reliable water supply if you are not near a river or stream. In Ogun State, water scarcity is a common challenge for small fish farmers. Also, build in a contingency of 15–20% of your total budget for unexpected costs like disease treatment, water pump repair, or feed price increases. First-time fish farmers often underestimate these.',
        helpful: 14,
      },
    ],
  },
  {
    title: 'Can I grow tomatoes and pepper together in the same bed?',
    content: 'I have a small garden of about 0.25 hectares and want to grow both tomatoes and pepper to maximise my income. Is it a good idea to intercrop them or should I separate them? What are the advantages and disadvantages?',
    specialization: 'horticulture',
    authorIndex: 8,
    tags: ['tomatoes', 'pepper', 'intercropping', 'horticulture'],
    status: 'resolved',
    answers: [
      {
        authorIndex: 3,
        isExpert: true,
        accepted: true,
        content: 'Growing tomato and pepper together is generally not recommended, for several important reasons. Both crops belong to the Solanaceae family and share the same pests and diseases — particularly Phytophthora blight, bacterial wilt, and the tomato fruit worm (Helicoverpa armigera). Growing them together concentrates pest and disease pressure and makes outbreaks harder to manage. They also have similar but not identical nutrient requirements, which creates competition. My recommendation: grow them in separate blocks so that if disease hits one crop, it does not immediately spread to the other. You can still grow both on your 0.25 ha — just allocate separate areas.',
        helpful: 16,
      },
      {
        authorIndex: 6,
        isExpert: false,
        accepted: false,
        content: 'I tried this once and the pepper plants were heavily shaded by the tomato once the tomatoes got tall. My pepper yield was very poor because of the shade. The expert advice above is correct — keep them separated.',
        helpful: 8,
      },
    ],
  },
  {
    title: 'What is the best soybean variety for Kaduna State and where can I buy certified seed?',
    content: 'I am planning to plant soybeans for the first time this season on 2 hectares in Kaduna South. I have heard TGx varieties are good but I am not sure which one to buy or where to get genuine certified seed. Please advise.',
    specialization: 'legumes',
    authorIndex: 5,
    tags: ['soybean', 'Kaduna', 'certified seed', 'variety'],
    status: 'answered',
    answers: [
      {
        authorIndex: 4,
        isExpert: true,
        accepted: false,
        content: 'For Kaduna South, TGx 1448-2E and TGx 1835-10E are excellent choices — both are high-yielding (1.5–2.5 tonnes/ha under good management), early-maturing (85–95 days), and resistant to soybean rust. For certified seed, contact the following sources: (1) Seed Entrepreneurs Association of Nigeria (SEEDAN) — they maintain a directory of certified seed producers by state. (2) IITA Ibadan and Zaria stations sell breeder and foundation seed. (3) Several commercial agro-dealers in Kaduna main market now stock TGx varieties — insist on seeing the seed certification tag before buying. Do not buy uncertified or "recycled" seed — germination rates are usually poor and you lose the genetic advantage of the improved variety.',
        helpful: 25,
      },
    ],
  },
  {
    title: 'My broiler chickens are growing unevenly — some are much bigger than others. What is wrong?',
    content: 'I have 300 broilers that are 4 weeks old. About 30% of them are noticeably smaller than the rest and seem to eat less. The mortality has been normal (about 3%) but the size variation is worrying me. Could this be a feed problem or a disease?',
    specialization: 'poultry',
    authorIndex: 7,
    tags: ['broiler', 'uneven growth', 'poultry management'],
    status: 'answered',
    answers: [
      {
        authorIndex: 1,
        isExpert: true,
        accepted: false,
        content: 'Uneven growth (high coefficient of variation, or CV) in broilers typically has several possible causes: (1) Infectious Bursal Disease (Gumboro) — IBD damages the immune system and causes growth suppression in affected birds. If you did not vaccinate against Gumboro at day 14, this is the most likely cause. (2) Coccidiosis — check droppings for blood or mucus. (3) Feeder and drinker space — if you have insufficient feeders, dominant birds monopolise feed and smaller birds are excluded. The rule is 2.5 cm of feeder space per bird minimum. (4) Chronic low-grade respiratory infection. My recommendation: isolate the runts, check for coccidiosis, review your vaccination records, and ensure adequate feeder space. Sorting and culling runts at 3–4 weeks is also standard practice in commercial broiler production.',
        helpful: 19,
      },
      {
        authorIndex: 8,
        isExpert: false,
        accepted: false,
        content: 'I experienced the same thing and in my case it was the feed. I had switched to a cheaper brand to save money and the feed quality was inconsistent. When I went back to my original trusted brand, the flock evened out by week 6. Make sure your feed is fresh and from a reputable manufacturer.',
        helpful: 11,
      },
    ],
  },
  {
    title: 'How do I control weeds in my rice farm without herbicide?',
    content: 'I grow upland rice on 1 hectare in Benue State. Weeding is my biggest cost — I spend almost ₦40,000 per acre on manual weeding per season and it still is not done on time. Are there effective ways to reduce this cost without relying entirely on herbicides, which I find expensive and hard to find genuine ones?',
    specialization: 'cereal_crops',
    authorIndex: 6,
    tags: ['rice', 'weed control', 'upland rice', 'Benue'],
    status: 'answered',
    answers: [
      {
        authorIndex: 0,
        isExpert: true,
        accepted: false,
        content: 'Weed control in upland rice is indeed one of the biggest cost drivers. Here are practical strategies: (1) Land preparation — thorough ploughing and harrowing 2 weeks before planting allows the first flush of weeds to germinate, which you then destroy with a light harrowing just before sowing. This "stale seedbed" technique significantly reduces early weed pressure. (2) Close spacing — planting FARO 44 or NERICA varieties at 20×20 cm gives the rice canopy a competitive advantage over weeds. (3) Early weeding — the first 3–4 weeks are the critical weed competition period. Even one timely weeding at 3 weeks gives far better results than two late weedings. (4) Mulching — applying rice straw mulch suppresses weeds and retains moisture. On your 1 hectare, combining the stale seedbed with one targeted early weeding should reduce your weed labour cost by at least 40–50%.',
        helpful: 28,
      },
    ],
  },
  {
    title: 'Is it possible to do fish farming in tanks inside a room if I do not have land?',
    content: 'I live in Lagos and do not have access to land for ponds. I have a spare room in my house. I have been reading about recirculating aquaculture systems (RAS) but do not understand if it is feasible for small scale in Nigeria. Can I start with catfish in indoor tanks?',
    specialization: 'fisheries',
    authorIndex: 8,
    tags: ['RAS', 'indoor fish farming', 'Lagos', 'catfish', 'urban farming'],
    status: 'answered',
    answers: [
      {
        authorIndex: 2,
        isExpert: true,
        accepted: false,
        content: 'Yes, indoor tank catfish production is entirely feasible in Lagos. Many urban farmers in Lagos, Abuja, and Port Harcourt are doing this profitably. Here is what you need for a basic setup: (1) Circular fibreglass or plastic tanks — 5,000 L tanks work well, 2–3 tanks to start. (2) A biofilter — the most important and most overlooked component. A properly cycled biofilter colonised with nitrifying bacteria converts toxic ammonia to nitrate. Without it, your fish will die within days. (3) A water pump to circulate water through the biofilter. (4) Aeration — air stones or an air blower. For a 5,000 L tank you can stock approximately 200–250 catfish fingerlings. Key challenges in Lagos: electricity for pumps (budget for a small generator or inverter backup), and sourcing quality catfish feed. I recommend starting with 1 tank as a learning exercise before scaling up.',
        helpful: 34,
      },
      {
        authorIndex: 9,
        isExpert: true,
        accepted: false,
        content: 'Excellent advice above. I would add that "cycling" the biofilter before adding fish is critical and takes 4–6 weeks. Do not rush this step. Join the Aquaculture Farmers Association of Nigeria (AFAN) Lagos chapter — they have members doing RAS in Lagos who can mentor you and help you avoid costly beginner mistakes.',
        helpful: 15,
      },
    ],
  },
  {
    title: 'When is the best time to plant groundnut in Kano State?',
    content: 'I am a first time farmer in Kano. I have 1.5 hectares and want to plant groundnut this season. When is the right time to plant in Kano and what variety should I use? I have heard some farmers say May and others say June.',
    specialization: 'legumes',
    authorIndex: 7,
    tags: ['groundnut', 'Kano', 'planting date', 'variety'],
    status: 'resolved',
    answers: [
      {
        authorIndex: 4,
        isExpert: true,
        accepted: true,
        content: 'In Kano State, groundnut planting should begin with the first reliable rains — typically between late May and mid-June. Planting too early on dry soil is wasteful, but planting too late shortens the growing season and exposes your crop to the risk of early dry spells at the end of the rains. The optimal planting window in Kano is 1st–30th June. For variety, SAMNUT 24 (Virginia type) is the most popular and widely available in Kano, offering good yield potential of 1.5–2.0 tonnes/ha and rosette virus resistance. SAMNUT 22 is another good option. Space your rows 60 cm apart with 15 cm between plants. Do not delay planting beyond July 15 — late-planted groundnut in Kano consistently underperforms.',
        helpful: 22,
      },
      {
        authorIndex: 5,
        isExpert: false,
        accepted: false,
        content: 'I am also in Kano and plant groundnut every year. From my experience, the expert\'s advice is correct — June is the safest month. I have tried planting in late May when the first rains came early, and the seeds rotted in the soil when dry weather returned for 2 weeks. June planting after the rains have settled has always given me better results.',
        helpful: 12,
      },
    ],
  },
  {
    title: 'My cowpea plants are wilting even though the soil has water. What is wrong?',
    content: 'I planted cowpea 5 weeks ago in Rivers State. The plants looked healthy until last week. Now some plants are wilting during the day even though the soil is moist. The wilted plants do not recover at night. When I pulled one up, the roots looked brown and rotten. What is causing this and is there a cure?',
    specialization: 'legumes',
    authorIndex: 8,
    tags: ['cowpea', 'wilting', 'root rot', 'Rivers State'],
    status: 'resolved',
    answers: [
      {
        authorIndex: 4,
        isExpert: true,
        accepted: true,
        content: 'The symptoms you describe — wilting in moist soil, failure to recover at night, and brown rotten roots — are the hallmark signs of Pythium or Fusarium root rot, or possibly bacterial wilt caused by Ralstonia solanacearum. Unfortunately, once a plant reaches this stage, there is no cure. Remove and destroy all wilted plants immediately — do not compost them. For the remaining healthy plants, improve drainage around them if the field has waterlogging. Drench the soil around healthy plants with a metalaxyl-based fungicide to slow the spread of Pythium. Do not replant cowpea or any legume in the same spot this season. In future seasons, improve drainage before planting, use raised beds in high-rainfall areas like Rivers State, and treat seed with thiram fungicide before planting.',
        helpful: 20,
      },
      {
        authorIndex: 9,
        isExpert: true,
        accepted: false,
        content: 'This is an important lesson about site selection for cowpea in the south. Rivers State has high rainfall and the soils in many areas have poor drainage. Cowpea is particularly susceptible to root rot diseases in waterlogged conditions. Raised beds (at least 20–30 cm high) are not optional in many parts of Rivers State — they are essential for cowpea survival.',
        helpful: 11,
      },
    ],
  },
];

// ─── Seed Function ────────────────────────────────────────────────────────────
const seed = async () => {
  await connectDB();
  console.log('\n🌾 Starting Agri-Connect database seed...\n');

  // ── 1. Create or find seed users ──────────────────────────────────────────
  console.log('👤 Creating seed users...');
  const createdUsers = [];
  for (const u of SEED_USERS) {
    let user = await User.findOne({ email: u.email });
    if (!user) {
      user = await User.create({
        email: u.email,
        passwordHash: '$2b$10$placeholder_not_for_login',
        role: u.role,
        profile: { fullName: u.name },
        isActive: true,
      });
      console.log(`  ✅ Created user: ${u.name} (${u.role})`);
    } else {
      console.log(`  ⏩ Found existing user: ${u.name}`);
    }
    createdUsers.push(user);
  }

  // ── 2. Seed articles ──────────────────────────────────────────────────────
  console.log('\n📰 Seeding articles...');
  await Content.deleteMany({ 'author.name': { $in: SEED_USERS.map(u => u.name) } });
  for (const a of ARTICLES) {
    const author = createdUsers[a.authorIndex];
    await Content.create({
      title: a.title,
      summary: a.summary,
      content: a.content,
      contentType: a.contentType,
      author: {
        userId: author._id,
        name: author.profile.fullName,
        role: author.role,
      },
      metadata: {
        farmingSpecializations: a.specs,
        topics: a.topics,
        difficulty: a.difficulty,
        regions: a.regions,
        seasons: a.seasons,
      },
      tags: a.tags,
      status: 'published',
      publishedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // random date in last 30 days
      statistics: {
        views: Math.floor(Math.random() * 300) + 20,
        likes: Math.floor(Math.random() * 80) + 5,
        saves: Math.floor(Math.random() * 40) + 2,
      },
    });
    console.log(`  ✅ Created article: "${a.title.substring(0, 60)}..."`);
  }

  // ── 3. Seed community questions ───────────────────────────────────────────
  console.log('\n💬 Seeding community questions...');
  await Question.deleteMany({ authorName: { $in: SEED_USERS.map(u => u.name) } });
  for (const q of QUESTIONS) {
    const questionAuthor = createdUsers[q.authorIndex];
    const answers = q.answers.map(a => ({
      author: createdUsers[a.authorIndex]._id,
      authorName: createdUsers[a.authorIndex].profile.fullName,
      authorRole: createdUsers[a.authorIndex].role,
      isExpert: a.isExpert,
      content: a.content,
      accepted: a.accepted || false,
      helpful: a.helpful || 0,
      helpfulVoters: [],
      createdAt: new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000),
    }));

    await Question.create({
      title: q.title,
      content: q.content,
      specialization: q.specialization,
      tags: q.tags,
      author: questionAuthor._id,
      authorName: questionAuthor.profile.fullName,
      status: q.status,
      answers,
      views: Math.floor(Math.random() * 200) + 10,
      createdAt: new Date(Date.now() - Math.random() * 25 * 24 * 60 * 60 * 1000),
    });
    console.log(`  ✅ Created question: "${q.title.substring(0, 60)}..."`);
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  const articleCount  = await Content.countDocuments({ status: 'published' });
  const questionCount = await Question.countDocuments();
  const answerCount   = (await Question.aggregate([{ $project: { count: { $size: '$answers' } } }, { $group: { _id: null, total: { $sum: '$count' } } }]))[0]?.total || 0;

  console.log('\n✅ Seed complete!');
  console.log(`   📰 Published articles : ${articleCount}`);
  console.log(`   ❓ Questions           : ${questionCount}`);
  console.log(`   💬 Answers             : ${answerCount}`);
  console.log(`   👤 Seed users          : ${createdUsers.length}\n`);

  process.exit(0);
};

seed().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
