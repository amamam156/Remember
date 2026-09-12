import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const demoPassword = process.env.REMEMBER_DEMO_PASSWORD || 'remember-demo';
const demos = [
  ['2026-06-15', 'Stars above the ridge', 'The sky outside the tent was brighter than our plans.', 'Seattle', '/demo/memories/mountain-camp.png', 47.6062, -122.3321, ['Travel', 'Milestones']],
  ['2026-05-26', 'The rainy-day café', 'A little place we found while waiting out the rain.', 'Seattle', '/demo/memories/rainy-cafe.png', 47.6097, -122.3331, ['Everyday']],
  ['2026-04-18', 'Golden hour by the sea', 'An orange evening that needed no filter.', 'Los Angeles', '/demo/memories/sunset-beach.png', 34.0195, -118.4912, ['Travel', 'Together']],
  ['2026-03-30', 'Spring picnic', 'Strawberries, sandwiches, and one napkin carried away by the wind.', 'San Francisco', '/demo/memories/spring-picnic.png', 37.7694, -122.4862, ['Everyday', 'Together']],
  ['2026-02-14', 'A last-minute drive to the coast', 'The best route was the one we chose at three in the afternoon.', 'Los Angeles', '/demo/memories/sunset-beach.png', 33.985, -118.4695, ['Milestones', 'Travel']],
  ['2026-01-25', 'The window seat', 'Rain made one cup of coffee feel wonderfully slow.', 'Seattle', '/demo/memories/rainy-cafe.png', 47.6038, -122.3301, ['Everyday']],
  ['2025-12-28', 'Winter camp', 'Remember the firelight—and the hesitation before leaving home.', 'Seattle', '/demo/memories/mountain-camp.png', 47.7511, -121.8, ['Travel']],
  ['2025-10-12', 'Lunch in the park', 'An ordinary day made special by paying attention.', 'San Francisco', '/demo/memories/spring-picnic.png', 37.768, -122.482, ['Together']],
] as const;

async function main() {
  const password = await bcrypt.hash(demoPassword, 10);
  const user = await prisma.user.upsert({ where: { username: 'demo' }, update: { name: 'Demo Traveler', password }, create: { name: 'Demo Traveler', username: 'demo', password } });
  await prisma.memory.deleteMany({ where: { createdById: user.id } });
  for (const [happenedAt, title, topic, cityName, imageUrl, latitude, longitude, tagNames] of demos) {
    const city = await prisma.city.findFirst({ where: { name: cityName }, include: { country: true, admin1: true } });
    if (!city) throw new Error(`Missing city data: ${cityName}. Run npm run db:seed first.`);
    const tags = await prisma.tag.findMany({ where: { name: { in: [...tagNames] } } });
    await prisma.memory.create({ data: { createdById: user.id, happenedAt, title, topic, locationTxt: cityName, countryId: city.countryId, admin1Id: city.admin1Id, cityId: city.id, imageUrl, latitude, longitude, images: { create: [{ imageUrl, thumbnailUrl: imageUrl, order: 0 }] }, memoryTags: { create: tags.map(tag => ({ tagId: tag.id })) } } });
  }
  console.log(`✅ Created ${demos.length} illustrated demo memories.`);
  console.log(`🔐 Demo password: ${demoPassword}`);
}
main().catch(error => { console.error(error); process.exit(1); }).finally(async () => prisma.$disconnect());
