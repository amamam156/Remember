import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 国家数据字典 (仅保留 ISO2, 名称和坐标)
const COUNTRIES_DATA = [
  { iso2: 'CN', name: '中国', latitude: 35.8617, longitude: 104.1954 },
  { iso2: 'US', name: 'United States', latitude: 37.0902, longitude: -95.7129 },
  { iso2: 'AU', name: 'Australia', latitude: -25.2744, longitude: 133.7751 },
  { iso2: 'AT', name: 'Austria', latitude: 47.5162, longitude: 14.5501 },
  { iso2: 'BR', name: 'Brazil', latitude: -14.235, longitude: -51.9253 },
  { iso2: 'KH', name: 'Cambodia', latitude: 12.5657, longitude: 104.991 },
  { iso2: 'CM', name: 'Cameroon', latitude: 7.3697, longitude: 12.3547 },
  { iso2: 'CA', name: 'Canada', latitude: 56.1304, longitude: -106.3468 },
  { iso2: 'CV', name: 'Cape Verde', latitude: 15.1201, longitude: -23.6052 },
  { iso2: 'CO', name: 'Colombia', latitude: 4.5709, longitude: -74.2973 },
  { iso2: 'DK', name: 'Denmark', latitude: 56.2639, longitude: 9.5018 },
  { iso2: 'FR', name: 'France', latitude: 46.2276, longitude: 2.2137 },
  { iso2: 'DE', name: 'Germany', latitude: 51.1657, longitude: 10.4515 },
  { iso2: 'GR', name: 'Greece', latitude: 39.0742, longitude: 21.8243 },
  { iso2: 'HN', name: 'Honduras', latitude: 15.2, longitude: -86.2419 },
  { iso2: 'HK', name: 'Hong Kong', latitude: 22.3193, longitude: 114.1694 },
  { iso2: 'IN', name: 'India', latitude: 20.5937, longitude: 78.9629 },
  { iso2: 'ID', name: 'Indonesia', latitude: -0.7893, longitude: 113.9213 },
  { iso2: 'IL', name: 'Israel', latitude: 31.0461, longitude: 34.8516 },
  { iso2: 'IT', name: 'Italy', latitude: 41.8719, longitude: 12.5674 },
  { iso2: 'JP', name: 'Japan', latitude: 36.2048, longitude: 138.2529 },
  { iso2: 'KE', name: 'Kenya', latitude: -0.0236, longitude: 37.9062 },
  { iso2: 'MX', name: 'Mexico', latitude: 23.6345, longitude: -102.5528 },
  { iso2: 'MD', name: 'Moldova', latitude: 47.4116, longitude: 28.3699 },
  { iso2: 'NL', name: 'Netherlands', latitude: 52.1326, longitude: 5.2913 },
  { iso2: 'NZ', name: 'New Zealand', latitude: -40.9006, longitude: 174.886 },
  { iso2: 'NG', name: 'Nigeria', latitude: 9.082, longitude: 8.6753 },
  { iso2: 'PK', name: 'Pakistan', latitude: 30.3753, longitude: 69.3451 },
  { iso2: 'PR', name: 'Puerto Rico', latitude: 18.2208, longitude: -66.5901 },
  { iso2: 'RO', name: 'Romania', latitude: 45.9432, longitude: 24.9668 },
  { iso2: 'SA', name: 'Saudi Arabia', latitude: 23.8859, longitude: 45.0792 },
  { iso2: 'KR', name: 'South Korea', latitude: 35.9078, longitude: 127.7669 },
  { iso2: 'ES', name: 'Spain', latitude: 40.4637, longitude: -3.7492 },
  { iso2: 'LK', name: 'Sri Lanka', latitude: 7.8731, longitude: 80.7718 },
  { iso2: 'SE', name: 'Sweden', latitude: 60.1282, longitude: 18.6435 },
  { iso2: 'TW', name: 'Taiwan', latitude: 23.6978, longitude: 120.9605 },
  { iso2: 'TZ', name: 'Tanzania', latitude: -6.369, longitude: 34.8888 },
  { iso2: 'TH', name: 'Thailand', latitude: 15.87, longitude: 100.9925 },
  { iso2: 'TN', name: 'Tunisia', latitude: 33.8869, longitude: 9.5375 },
  { iso2: 'AE', name: 'United Arab Emirates', latitude: 23.4241, longitude: 53.8478 },
  { iso2: 'UA', name: 'Ukraine', latitude: 48.3794, longitude: 31.1656 },
  { iso2: 'UZ', name: 'Uzbekistan', latitude: 41.3775, longitude: 64.5853 },
  { iso2: 'VN', name: 'Vietnam', latitude: 14.0583, longitude: 108.2772 },
  { iso2: 'ZW', name: 'Zimbabwe', latitude: -19.0154, longitude: 29.1549 },
  { iso2: 'GB', name: 'United Kingdom', latitude: 55.3781, longitude: -3.436 },
  { iso2: 'SG', name: 'Singapore', latitude: 1.3521, longitude: 103.8198 },
];

// 中国省份/直辖市数据 (移除 Code，使用名称作为 ID)
const CHINA_ADMIN1_DATA = [
  { name: '北京', latitude: 39.9042, longitude: 116.4074 },
  { name: '上海', latitude: 31.2304, longitude: 121.4737 },
  { name: '天津', latitude: 39.1336, longitude: 117.2054 },
  { name: '重庆', latitude: 29.5637, longitude: 106.5504 },
  { name: '广东', latitude: 23.3670, longitude: 113.5235 },
  { name: '浙江', latitude: 29.1832, longitude: 120.0934 },
  { name: '江苏', latitude: 32.9735, longitude: 119.7905 },
  { name: '山东', latitude: 36.3427, longitude: 118.1498 },
  { name: '四川', latitude: 30.6175, longitude: 102.7103 },
  { name: '湖北', latitude: 31.2317, longitude: 112.2723 },
  { name: '福建', latitude: 26.0745, longitude: 117.8296 },
  { name: '湖南', latitude: 27.6073, longitude: 111.7081 },
  { name: '安徽', latitude: 31.8257, longitude: 117.2215 },
  { name: '辽宁', latitude: 41.2970, longitude: 122.6033 },
  { name: '吉林', latitude: 43.7001, longitude: 125.3235 },
  { name: '黑龙江', latitude: 47.7662, longitude: 127.3524 },
  { name: '河北', latitude: 38.0423, longitude: 114.5147 },
  { name: '河南', latitude: 33.8737, longitude: 113.6684 },
  { name: '江西', latitude: 27.6828, longitude: 115.8576 },
  { name: '山西', latitude: 37.6621, longitude: 112.4497 },
  { name: '陕西', latitude: 35.1917, longitude: 108.8701 },
  { name: '广西', latitude: 23.8298, longitude: 108.7882 },
  { name: '内蒙古', latitude: 44.0936, longitude: 113.9448 },
  { name: '云南', latitude: 24.8801, longitude: 102.8329 },
  { name: '贵州', latitude: 26.8305, longitude: 106.7348 },
  { name: '新疆', latitude: 41.7701, longitude: 86.1678 },
  { name: '甘肃', latitude: 35.7476, longitude: 104.3536 },
  { name: '青海', latitude: 35.6831, longitude: 95.9392 },
  { name: '西藏', latitude: 31.2558, longitude: 88.6653 },
  { name: '宁夏', latitude: 37.5312, longitude: 106.2335 },
  { name: '海南', latitude: 19.1959, longitude: 109.7447 },
  { name: '香港', latitude: 22.3193, longitude: 114.1694 },
  { name: '澳门', latitude: 22.1987, longitude: 113.5439 },
  { name: '台湾', latitude: 23.6978, longitude: 120.9605 },
];

// 美国州数据
const USA_ADMIN1_DATA = [
  { name: 'Alabama', latitude: 32.3182, longitude: -86.9023 },
  { name: 'Alaska', latitude: 63.5888, longitude: -154.4931 },
  { name: 'Arizona', latitude: 34.0489, longitude: -111.0937 },
  { name: 'Arkansas', latitude: 35.2010, longitude: -91.8318 },
  { name: 'California', latitude: 36.7783, longitude: -119.4179 },
  { name: 'Colorado', latitude: 39.5501, longitude: -105.7821 },
  { name: 'Connecticut', latitude: 41.6032, longitude: -73.0877 },
  { name: 'Delaware', latitude: 38.9108, longitude: -75.5277 },
  { name: 'Florida', latitude: 27.6648, longitude: -81.5158 },
  { name: 'Georgia', latitude: 32.1574, longitude: -82.9071 },
  { name: 'Hawaii', latitude: 19.8987, longitude: -155.6659 },
  { name: 'Idaho', latitude: 44.0682, longitude: -114.7420 },
  { name: 'Illinois', latitude: 40.6331, longitude: -89.3985 },
  { name: 'Indiana', latitude: 40.5512, longitude: -85.6024 },
  { name: 'Iowa', latitude: 41.8780, longitude: -93.0977 },
  { name: 'Kansas', latitude: 39.0119, longitude: -98.4842 },
  { name: 'Kentucky', latitude: 37.8393, longitude: -84.2700 },
  { name: 'Louisiana', latitude: 31.2448, longitude: -92.1450 },
  { name: 'Maine', latitude: 45.2538, longitude: -69.4455 },
  { name: 'Maryland', latitude: 39.0458, longitude: -76.6413 },
  { name: 'Massachusetts', latitude: 42.4072, longitude: -71.3824 },
  { name: 'Michigan', latitude: 44.3148, longitude: -85.6024 },
  { name: 'Minnesota', latitude: 46.7296, longitude: -94.6859 },
  { name: 'Mississippi', latitude: 32.3547, longitude: -89.3985 },
  { name: 'Missouri', latitude: 37.9643, longitude: -91.8318 },
  { name: 'Montana', latitude: 46.8797, longitude: -110.3626 },
  { name: 'Nebraska', latitude: 41.4925, longitude: -99.9018 },
  { name: 'Nevada', latitude: 38.8026, longitude: -116.4194 },
  { name: 'New Hampshire', latitude: 43.1939, longitude: -71.5724 },
  { name: 'New Jersey', latitude: 40.0583, longitude: -74.4057 },
  { name: 'New Mexico', latitude: 34.9727, longitude: -105.0324 },
  { name: 'New York', latitude: 43.2994, longitude: -74.2179 },
  { name: 'North Carolina', latitude: 35.7596, longitude: -79.0193 },
  { name: 'North Dakota', latitude: 47.5515, longitude: -101.0020 },
  { name: 'Ohio', latitude: 40.4173, longitude: -82.9071 },
  { name: 'Oklahoma', latitude: 35.0078, longitude: -97.0929 },
  { name: 'Oregon', latitude: 43.8041, longitude: -120.5542 },
  { name: 'Pennsylvania', latitude: 41.2033, longitude: -77.1945 },
  { name: 'Rhode Island', latitude: 41.5801, longitude: -71.4774 },
  { name: 'South Carolina', latitude: 33.8361, longitude: -81.1637 },
  { name: 'South Dakota', latitude: 43.9695, longitude: -99.9018 },
  { name: 'Tennessee', latitude: 35.5175, longitude: -86.5804 },
  { name: 'Texas', latitude: 31.9686, longitude: -99.9018 },
  { name: 'Utah', latitude: 39.3210, longitude: -111.0937 },
  { name: 'Vermont', latitude: 44.5588, longitude: -72.5778 },
  { name: 'Virginia', latitude: 37.4316, longitude: -78.6569 },
  { name: 'Washington', latitude: 47.7511, longitude: -120.7401 },
  { name: 'West Virginia', latitude: 38.5976, longitude: -80.4549 },
  { name: 'Wisconsin', latitude: 43.7844, longitude: -88.7879 },
  { name: 'Wyoming', latitude: 43.0760, longitude: -107.2903 },
];

// 城市数据 (按省份名称分组)
const CITIES_BY_ADMIN1: Record<string, Array<{ name: string; isMunicipality?: boolean; latitude?: number; longitude?: number }>> = {
  '北京': [{ name: '北京', isMunicipality: true, latitude: 39.9042, longitude: 116.4074 }],
  '上海': [{ name: '上海', isMunicipality: true, latitude: 31.2304, longitude: 121.4737 }],
  '天津': [{ name: '天津', isMunicipality: true, latitude: 39.1336, longitude: 117.2054 }],
  '重庆': [{ name: '重庆', isMunicipality: true, latitude: 29.5637, longitude: 106.5504 }],
  '广东': [
    { name: '广州', latitude: 23.1291, longitude: 113.2644 },
    { name: '深圳', latitude: 22.5431, longitude: 114.0579 },
    { name: '珠海', latitude: 22.2707, longitude: 113.5767 },
    { name: '佛山', latitude: 23.0215, longitude: 113.1227 },
    { name: '东莞', latitude: 23.0205, longitude: 113.7518 },
    { name: '中山', latitude: 22.5176, longitude: 113.3928 },
    { name: '江门', latitude: 22.5787, longitude: 113.0819 },
    { name: '惠州', latitude: 23.1118, longitude: 114.4161 },
    { name: '汕头', latitude: 23.3540, longitude: 116.6815 }
  ],
  '浙江': [
    { name: '杭州', latitude: 30.2741, longitude: 120.1551 },
    { name: '宁波', latitude: 29.8683, longitude: 121.5440 },
    { name: '温州', latitude: 27.9943, longitude: 120.6994 },
    { name: '嘉兴', latitude: 30.7461, longitude: 120.7555 },
    { name: '湖州', latitude: 30.8943, longitude: 120.0868 },
    { name: '绍兴', latitude: 29.9958, longitude: 120.5861 },
    { name: '金华', latitude: 29.0791, longitude: 119.6472 },
    { name: '舟山', latitude: 29.9855, longitude: 122.2072 },
    { name: '台州', latitude: 28.6564, longitude: 121.4208 }
  ],
  '江苏': [
    { name: '南京', latitude: 32.0415, longitude: 118.7674 },
    { name: '苏州', latitude: 31.2989, longitude: 120.5853 },
    { name: '无锡', latitude: 31.4912, longitude: 120.3119 },
    { name: '常州', latitude: 31.7835, longitude: 119.9737 },
    { name: '南通', latitude: 31.9802, longitude: 120.8943 },
    { name: '扬州', latitude: 32.3942, longitude: 119.4129 },
    { name: '镇江', latitude: 32.1895, longitude: 119.4258 },
    { name: '泰州', latitude: 32.4555, longitude: 119.9231 },
    { name: '徐州', latitude: 34.2048, longitude: 117.2848 }
  ],
  '山东': [
    { name: '济南', latitude: 36.6512, longitude: 117.0009 },
    { name: '青岛', latitude: 36.0671, longitude: 120.3826 },
    { name: '烟台', latitude: 37.3999, longitude: 121.2664 }
  ],
  '四川': [
    { name: '成都', latitude: 30.5728, longitude: 104.0668 },
    { name: '绵阳', latitude: 31.4674, longitude: 104.6791 }
  ],
  '湖北': [
    { name: '武汉', latitude: 30.5928, longitude: 114.3055 },
    { name: '宜昌', latitude: 30.6985, longitude: 111.2908 }
  ],
  '湖南': [
    { name: '长沙', latitude: 28.2282, longitude: 112.9388 }
  ],
  '福建': [
    { name: '福州', latitude: 26.0745, longitude: 119.2965 },
    { name: '厦门', latitude: 24.4798, longitude: 118.0894 },
    { name: '泉州', latitude: 24.8741, longitude: 118.6757 }
  ],
  '安徽': [
    { name: '合肥', latitude: 31.8206, longitude: 117.2272 }
  ],
  '辽宁': [
    { name: '沈阳', latitude: 41.6772, longitude: 123.4631 },
    { name: '大连', latitude: 38.9140, longitude: 121.6147 }
  ],
  '陕西': [
    { name: '西安', latitude: 34.3416, longitude: 108.9398 }
  ],
  '云南': [
    { name: '昆明', latitude: 24.8797, longitude: 102.8332 }
  ],
  '广西': [
    { name: '南宁', latitude: 22.8170, longitude: 108.3665 },
    { name: '桂林', latitude: 25.2345, longitude: 110.1798 }
  ],
  '海南': [
    { name: '海口', latitude: 20.0174, longitude: 110.3492 },
    { name: '三亚', latitude: 18.2528, longitude: 109.5119 }
  ],
  '黑龙江': [{ name: '哈尔滨', latitude: 45.7569, longitude: 126.6424 }],
  '吉林': [{ name: '长春', latitude: 43.8171, longitude: 125.3235 }],
  '河北': [{ name: '石家庄', latitude: 38.0423, longitude: 114.5147 }],
  '河南': [{ name: '郑州', latitude: 34.7466, longitude: 113.6253 }],
  '江西': [{ name: '南昌', latitude: 28.6820, longitude: 115.8579 }],
  '山西': [{ name: '太原', latitude: 37.8706, longitude: 112.5489 }],
  '甘肃': [{ name: '兰州', latitude: 36.0611, longitude: 103.8343 }],
  '新疆': [{ name: '乌鲁木齐', latitude: 43.8256, longitude: 87.6168 }],
  '内蒙古': [{ name: '呼和浩特', latitude: 40.8423, longitude: 111.7519 }],
  '贵州': [{ name: '贵阳', latitude: 26.5783, longitude: 106.7139 }],
  '宁夏': [{ name: '银川', latitude: 38.4872, longitude: 106.2309 }],
  '青海': [{ name: '西宁', latitude: 36.6209, longitude: 101.7782 }],
  '西藏': [{ name: '拉萨', latitude: 29.6441, longitude: 91.1145 }],
  '香港': [{ name: '香港', isMunicipality: true, latitude: 22.3193, longitude: 114.1694 }],
  '澳门': [{ name: '澳门', isMunicipality: true, latitude: 22.1987, longitude: 113.5439 }],
  '台湾': [{ name: '台北', latitude: 25.0330, longitude: 121.5654 }],
  'Washington': [
    { name: 'Seattle', latitude: 47.6062, longitude: -122.3321 },
    { name: 'Mukilteo', latitude: 47.9445, longitude: -122.3046 }
  ],
  'New York': [{ name: 'New York City', latitude: 40.7128, longitude: -74.0060 }],
  'California': [
    { name: 'Los Angeles', latitude: 34.0522, longitude: -118.2437 },
    { name: 'San Francisco', latitude: 37.7749, longitude: -122.4194 }
  ]
};

// 国际城市数据 (按 ISO2 分组)
const INTERNATIONAL_CITIES: Record<string, Array<{ name: string; admin1Name: string; latitude?: number; longitude?: number }>> = {
  'JP': [{ name: 'Tokyo', admin1Name: 'Tokyo', latitude: 35.6895, longitude: 139.6917 }],
  'KR': [{ name: 'Seoul', admin1Name: 'Seoul', latitude: 37.5665, longitude: 126.9780 }],
  'GB': [{ name: 'London', admin1Name: 'England', latitude: 51.5074, longitude: -0.1276 }],
  'FR': [{ name: 'Paris', admin1Name: 'Île-de-France', latitude: 48.8566, longitude: 2.3522 }],
  'DE': [{ name: 'Berlin', admin1Name: 'Berlin', latitude: 52.5200, longitude: 13.4050 }],
  'IT': [{ name: 'Rome', admin1Name: 'Lazio', latitude: 41.9028, longitude: 12.4964 }],
  'ES': [{ name: 'Madrid', admin1Name: 'Madrid', latitude: 40.4168, longitude: -3.7038 }],
  'CA': [{ name: 'Toronto', admin1Name: 'Ontario', latitude: 43.6532, longitude: -79.3832 }],
  'AU': [{ name: 'Sydney', admin1Name: 'New South Wales', latitude: -33.8688, longitude: 151.2093 }],
  'SG': [{ name: 'Singapore', admin1Name: 'Singapore', latitude: 1.3521, longitude: 103.8198 }],
  'TH': [{ name: 'Bangkok', admin1Name: 'Bangkok', latitude: 13.7563, longitude: 100.5018 }]
};

// 默认标签数据
const DEFAULT_TAGS = [
  'Together', 'Everyday', 'Milestones', 'Travel'
];

async function main() {
  console.log('🌱 开始极简版种子数据同步...');

  // 0. 标签
  console.log('  - 同步并清理标签数据...');
  
  // 先删除不在列表中的标签
  await prisma.tag.deleteMany({
    where: {
      name: { notIn: DEFAULT_TAGS }
    }
  });

  for (const name of DEFAULT_TAGS) {
    await prisma.tag.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // 1. 国家
  const countryMap: Record<string, any> = {};
  for (const c of COUNTRIES_DATA) {
    const record = await prisma.country.upsert({
      where: { iso2: c.iso2 },
      update: { name: c.name, latitude: c.latitude, longitude: c.longitude },
      create: { iso2: c.iso2, name: c.name, latitude: c.latitude, longitude: c.longitude },
    });
    countryMap[c.iso2] = record;
  }

  // 2. 中国省份
  const china = countryMap['CN'];
  const admin1Map: Record<string, any> = {};
  for (const a of CHINA_ADMIN1_DATA) {
    const record = await prisma.admin1.upsert({
      where: { countryId_name: { countryId: china.id, name: a.name } },
      update: { latitude: a.latitude, longitude: a.longitude },
      create: { countryId: china.id, name: a.name, latitude: a.latitude, longitude: a.longitude },
    });
    admin1Map[`CN-${a.name}`] = record;
  }

  // 3. 美国州
  const usa = countryMap['US'];
  for (const a of USA_ADMIN1_DATA) {
    const record = await prisma.admin1.upsert({
      where: { countryId_name: { countryId: usa.id, name: a.name } },
      update: { latitude: a.latitude, longitude: a.longitude },
      create: { countryId: usa.id, name: a.name, latitude: a.latitude, longitude: a.longitude },
    });
    admin1Map[`US-${a.name}`] = record;
  }

  // 4. 城市 (批量)
  for (const [admin1Name, cities] of Object.entries(CITIES_BY_ADMIN1)) {
    const isChina = admin1Name.match(/[\u4e00-\u9fa5]/);
    const countryId = isChina ? china.id : usa.id;
    const admin1 = admin1Map[isChina ? `CN-${admin1Name}` : `US-${admin1Name}`];
    
    for (const city of cities) {
      await prisma.city.upsert({
        where: { city_unique_key: { countryId, admin1Id: admin1?.id || null, name: city.name } },
        update: { isMunicipality: !!city.isMunicipality, latitude: city.latitude, longitude: city.longitude },
        create: { countryId, admin1Id: admin1?.id || null, name: city.name, isMunicipality: !!city.isMunicipality, latitude: city.latitude, longitude: city.longitude },
      });
    }
  }

  // 5. 国际
  for (const [iso2, cities] of Object.entries(INTERNATIONAL_CITIES)) {
    const country = countryMap[iso2];
    if (!country) continue;
    for (const cityData of cities) {
      const admin1 = await prisma.admin1.upsert({
        where: { countryId_name: { countryId: country.id, name: cityData.admin1Name } },
        update: { name: cityData.admin1Name },
        create: { countryId: country.id, name: cityData.admin1Name },
      });
      await prisma.city.upsert({
        where: { city_unique_key: { countryId: country.id, admin1Id: admin1.id, name: cityData.name } },
        update: { latitude: cityData.latitude, longitude: cityData.longitude },
        create: { countryId: country.id, admin1Id: admin1.id, name: cityData.name, latitude: cityData.latitude, longitude: cityData.longitude },
      });
    }
  }

  console.log('✅ 极简版种子数据同步完成！');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
