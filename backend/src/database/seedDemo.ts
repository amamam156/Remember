import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const demoPassword = process.env.REMEMBER_DEMO_PASSWORD || 'remember-demo';
const demos = [
  { date: '2026-08-22', title: 'Lanterns after midnight', story: 'One more snack, one more lantern-lit street, and no reason to hurry home.', city: 'Tokyo', lat: 35.6762, lng: 139.6503, images: ['/demo/memories/tokyo-night-portrait.png', '/demo/memories/tokyo-night.png', '/demo/memories/rainy-cafe.png', '/demo/memories/mountain-camp.png', '/demo/memories/spring-picnic.png'], tags: ['Travel', 'Milestones'] },
  { date: '2026-07-09', title: 'Autumn light on the Seine', story: 'A long walk, a tiny camera, and the city turning gold.', city: 'Paris', lat: 48.8566, lng: 2.3522, images: ['/demo/memories/paris-autumn.png'], tags: ['Travel', 'Together'] },
  { date: '2026-06-21', title: 'Laughing in the waterfall mist', story: 'We were soaked before we reached the viewpoint—and loved every minute.', city: 'Reykjavík', lat: 64.1466, lng: -21.9426, images: ['/demo/memories/iceland-waterfall.png'], tags: ['Travel'] },
  { date: '2026-06-18', title: 'Colors of the medina', story: 'A morning of tiled courtyards, spice baskets, and happy detours.', city: 'Marrakech', lat: 31.6295, lng: -7.9811, images: ['/demo/memories/marrakech-market.png'], tags: ['Travel', 'Everyday'] },
  { date: '2026-06-15', title: 'Stars above the ridge', story: 'The sky outside the tent was brighter than our plans.', city: 'Seattle', lat: 47.6062, lng: -122.3321, images: ['/demo/memories/mountain-camp.png'], tags: ['Travel', 'Milestones'] },
  { date: '2026-05-26', title: 'The rainy-day café', story: 'A little place we found while waiting out the rain.', city: 'Seattle', lat: 47.6097, lng: -122.3331, images: ['/demo/memories/rainy-cafe.png'], tags: ['Everyday'] },
  { date: '2026-04-18', title: 'Golden hour by the sea', story: 'An orange evening that needed no filter.', city: 'Los Angeles', lat: 34.0195, lng: -118.4912, images: ['/demo/memories/sunset-beach.png'], tags: ['Travel', 'Together'] },
  { date: '2026-03-30', title: 'Spring picnic', story: 'Strawberries, sandwiches, and one napkin carried away by the wind.', city: 'San Francisco', lat: 37.7694, lng: -122.4862, images: ['/demo/memories/spring-picnic.png'], tags: ['Everyday', 'Together'] },
  { date: '2026-02-14', title: 'A last-minute drive to the coast', story: 'The best route was the one we chose at three in the afternoon.', city: 'Los Angeles', lat: 33.985, lng: -118.4695, images: ['/demo/memories/sunset-beach.png'], tags: ['Milestones', 'Travel'] },
  { date: '2026-01-25', title: 'The window seat', story: 'Rain made one cup of coffee feel wonderfully slow.', city: 'Seattle', lat: 47.6038, lng: -122.3301, images: ['/demo/memories/rainy-cafe.png'], tags: ['Everyday'] },
  { date: '2025-12-28', title: 'Winter camp', story: 'Remember the firelight—and the hesitation before leaving home.', city: 'Seattle', lat: 47.7511, lng: -121.8, images: ['/demo/memories/mountain-camp.png'], tags: ['Travel'] },
  { date: '2025-10-12', title: 'Lunch in the park', story: 'An ordinary day made special by paying attention.', city: 'San Francisco', lat: 37.768, lng: -122.482, images: ['/demo/memories/spring-picnic.png'], tags: ['Together'] },
];

async function ensureDemoCity(iso2: string, countryName: string, cityName: string, latitude: number, longitude: number) {
  const country = await prisma.country.upsert({ where: { iso2 }, update: {}, create: { iso2, name: countryName, latitude, longitude } });
  const admin1 = await prisma.admin1.upsert({ where: { countryId_name: { countryId: country.id, name: cityName } }, update: {}, create: { countryId: country.id, name: cityName, latitude, longitude } });
  return prisma.city.upsert({ where: { city_unique_key: { countryId: country.id, admin1Id: admin1.id, name: cityName } }, update: {}, create: { countryId: country.id, admin1Id: admin1.id, name: cityName, latitude, longitude } });
}

async function main() {
  const password = await bcrypt.hash(demoPassword, 10);
  const user = await prisma.user.upsert({ where: { username: 'demo' }, update: { name: 'Demo Traveler', password }, create: { name: 'Demo Traveler', username: 'demo', password } });
  await ensureDemoCity('IS', 'Iceland', 'Reykjavík', 64.1466, -21.9426);
  await ensureDemoCity('MA', 'Morocco', 'Marrakech', 31.6295, -7.9811);
  await prisma.memory.deleteMany({ where: { createdById: user.id } });
  for (const demo of demos) {
    const city = await prisma.city.findFirst({ where: { name: demo.city }, include: { country: true, admin1: true } });
    if (!city) throw new Error(`Missing city data: ${demo.city}. Run npm run db:seed first.`);
    const tags = await prisma.tag.findMany({ where: { name: { in: demo.tags } } });
    await prisma.memory.create({ data: { createdById: user.id, happenedAt: demo.date, title: demo.title, topic: demo.story, locationTxt: demo.city, countryId: city.countryId, admin1Id: city.admin1Id, cityId: city.id, imageUrl: demo.images[0], latitude: demo.lat, longitude: demo.lng, images: { create: demo.images.map((imageUrl, order) => ({ imageUrl, thumbnailUrl: imageUrl, order })) }, memoryTags: { create: tags.map(tag => ({ tagId: tag.id })) } } });
  }
  console.log(`✅ Created ${demos.length} illustrated demo memories.`);
  console.log(`🔐 Demo password: ${demoPassword}`);
}
main().catch(error => { console.error(error); process.exit(1); }).finally(async () => prisma.$disconnect());
