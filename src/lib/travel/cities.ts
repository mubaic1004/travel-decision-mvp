// City metadata: includes Shanghai (origin) + all 50 destinations.
// Used for both origin and destination resolution + procedural route synthesis.
//
// Tier: 1 = international hub (高频干线), 2 = major (热门), 3 = secondary (二三线)
// lat/lng: approximate city coordinates, used for great-circle distance.
// regionType: domestic = China mainland; everything else (including HK/MO/TW) treated as
// "international" for pricing purposes (matches existing behavior in pricing-rules.json).

export interface CityMeta {
  code: string;
  name: string;
  countryCode: string;
  regionType: "domestic" | "international";
  tier: 1 | 2 | 3;
  lat: number;
  lng: number;
  airports: string[];
  aliases: string[];
  hotelKey: string;
}

export const CITIES: CityMeta[] = [
  // China mainland — origins + destinations
  { code: "SHA", name: "Shanghai", countryCode: "CN", regionType: "domestic", tier: 1, lat: 31.23, lng: 121.47, airports: ["SHA", "PVG"], aliases: ["shanghai", "上海", "上海虹桥", "上海浦东"], hotelKey: "SHA" },
  { code: "BJS", name: "Beijing", countryCode: "CN", regionType: "domestic", tier: 1, lat: 39.90, lng: 116.41, airports: ["PEK", "PKX"], aliases: ["beijing", "北京"], hotelKey: "BJS" },
  { code: "CAN", name: "Guangzhou", countryCode: "CN", regionType: "domestic", tier: 1, lat: 23.13, lng: 113.26, airports: ["CAN"], aliases: ["guangzhou", "广州"], hotelKey: "CAN" },
  { code: "SZX", name: "Shenzhen", countryCode: "CN", regionType: "domestic", tier: 1, lat: 22.54, lng: 114.06, airports: ["SZX"], aliases: ["shenzhen", "深圳"], hotelKey: "SZX" },
  { code: "CTU", name: "Chengdu", countryCode: "CN", regionType: "domestic", tier: 2, lat: 30.67, lng: 104.07, airports: ["CTU", "TFU"], aliases: ["chengdu", "成都"], hotelKey: "CTU" },
  { code: "XIY", name: "Xi'an", countryCode: "CN", regionType: "domestic", tier: 2, lat: 34.34, lng: 108.94, airports: ["XIY"], aliases: ["xi'an", "xian", "西安"], hotelKey: "XIY" },
  { code: "CKG", name: "Chongqing", countryCode: "CN", regionType: "domestic", tier: 2, lat: 29.56, lng: 106.55, airports: ["CKG"], aliases: ["chongqing", "重庆"], hotelKey: "CKG" },
  { code: "KMG", name: "Kunming", countryCode: "CN", regionType: "domestic", tier: 2, lat: 25.04, lng: 102.72, airports: ["KMG"], aliases: ["kunming", "昆明"], hotelKey: "KMG" },
  { code: "SYX", name: "Sanya", countryCode: "CN", regionType: "domestic", tier: 2, lat: 18.25, lng: 109.51, airports: ["SYX"], aliases: ["sanya", "三亚"], hotelKey: "SYX" },
  { code: "DYG", name: "Zhangjiajie", countryCode: "CN", regionType: "domestic", tier: 3, lat: 29.13, lng: 110.48, airports: ["DYG"], aliases: ["zhangjiajie", "张家界"], hotelKey: "DYG" },
  { code: "XMN", name: "Xiamen", countryCode: "CN", regionType: "domestic", tier: 2, lat: 24.48, lng: 118.09, airports: ["XMN"], aliases: ["xiamen", "厦门"], hotelKey: "XMN" },
  { code: "HRB", name: "Harbin", countryCode: "CN", regionType: "domestic", tier: 2, lat: 45.75, lng: 126.64, airports: ["HRB"], aliases: ["harbin", "哈尔滨"], hotelKey: "HRB" },
  { code: "HGH", name: "Hangzhou", countryCode: "CN", regionType: "domestic", tier: 2, lat: 30.27, lng: 120.16, airports: ["HGH"], aliases: ["hangzhou", "杭州"], hotelKey: "HGH" },
  { code: "NKG", name: "Nanjing", countryCode: "CN", regionType: "domestic", tier: 2, lat: 32.06, lng: 118.80, airports: ["NKG"], aliases: ["nanjing", "南京"], hotelKey: "NKG" },
  { code: "WUH", name: "Wuhan", countryCode: "CN", regionType: "domestic", tier: 2, lat: 30.59, lng: 114.31, airports: ["WUH"], aliases: ["wuhan", "武汉"], hotelKey: "WUH" },
  { code: "CSX", name: "Changsha", countryCode: "CN", regionType: "domestic", tier: 2, lat: 28.23, lng: 112.94, airports: ["CSX"], aliases: ["changsha", "长沙"], hotelKey: "CSX" },
  { code: "TAO", name: "Qingdao", countryCode: "CN", regionType: "domestic", tier: 2, lat: 36.07, lng: 120.38, airports: ["TAO"], aliases: ["qingdao", "青岛"], hotelKey: "TAO" },
  { code: "TSN", name: "Tianjin", countryCode: "CN", regionType: "domestic", tier: 2, lat: 39.13, lng: 117.20, airports: ["TSN"], aliases: ["tianjin", "天津"], hotelKey: "TSN" },
  { code: "DLC", name: "Dalian", countryCode: "CN", regionType: "domestic", tier: 2, lat: 38.91, lng: 121.61, airports: ["DLC"], aliases: ["dalian", "大连"], hotelKey: "DLC" },
  { code: "SHE", name: "Shenyang", countryCode: "CN", regionType: "domestic", tier: 3, lat: 41.81, lng: 123.43, airports: ["SHE"], aliases: ["shenyang", "沈阳"], hotelKey: "SHE" },
  { code: "HAK", name: "Haikou", countryCode: "CN", regionType: "domestic", tier: 3, lat: 20.04, lng: 110.32, airports: ["HAK"], aliases: ["haikou", "海口"], hotelKey: "HAK" },
  { code: "KWL", name: "Guilin", countryCode: "CN", regionType: "domestic", tier: 3, lat: 25.27, lng: 110.29, airports: ["KWL"], aliases: ["guilin", "桂林"], hotelKey: "KWL" },
  { code: "LJG", name: "Lijiang", countryCode: "CN", regionType: "domestic", tier: 3, lat: 26.86, lng: 100.23, airports: ["LJG"], aliases: ["lijiang", "丽江"], hotelKey: "LJG" },
  { code: "LXA", name: "Lhasa", countryCode: "CN", regionType: "domestic", tier: 3, lat: 29.65, lng: 91.13, airports: ["LXA"], aliases: ["lhasa", "拉萨"], hotelKey: "LXA" },
  { code: "URC", name: "Urumqi", countryCode: "CN", regionType: "domestic", tier: 3, lat: 43.83, lng: 87.62, airports: ["URC"], aliases: ["urumqi", "乌鲁木齐"], hotelKey: "URC" },

  // Greater China — international pricing for SAR/Taiwan flights
  { code: "HKG", name: "Hong Kong", countryCode: "HK", regionType: "international", tier: 1, lat: 22.31, lng: 114.17, airports: ["HKG"], aliases: ["hong kong", "hongkong", "香港"], hotelKey: "HKG" },
  { code: "MFM", name: "Macau", countryCode: "MO", regionType: "international", tier: 3, lat: 22.15, lng: 113.59, airports: ["MFM"], aliases: ["macau", "macao", "澳门"], hotelKey: "MFM" },
  { code: "TPE", name: "Taipei", countryCode: "TW", regionType: "international", tier: 1, lat: 25.04, lng: 121.50, airports: ["TPE", "TSA"], aliases: ["taipei", "台北", "台湾", "taiwan"], hotelKey: "TPE" },

  // Japan
  { code: "TYO", name: "Tokyo", countryCode: "JP", regionType: "international", tier: 1, lat: 35.68, lng: 139.69, airports: ["NRT", "HND"], aliases: ["tokyo", "东京"], hotelKey: "TYO" },
  { code: "OSA", name: "Osaka", countryCode: "JP", regionType: "international", tier: 2, lat: 34.69, lng: 135.50, airports: ["KIX", "ITM"], aliases: ["osaka", "大阪"], hotelKey: "OSA" },
  { code: "FUK", name: "Fukuoka", countryCode: "JP", regionType: "international", tier: 2, lat: 33.59, lng: 130.40, airports: ["FUK"], aliases: ["fukuoka", "福冈"], hotelKey: "FUK" },
  { code: "SPK", name: "Sapporo", countryCode: "JP", regionType: "international", tier: 2, lat: 43.06, lng: 141.35, airports: ["CTS"], aliases: ["sapporo", "札幌"], hotelKey: "SPK" },
  { code: "OKA", name: "Okinawa", countryCode: "JP", regionType: "international", tier: 3, lat: 26.21, lng: 127.68, airports: ["OKA"], aliases: ["okinawa", "冲绳", "那霸", "naha"], hotelKey: "OKA" },

  // Korea
  { code: "ICN", name: "Seoul", countryCode: "KR", regionType: "international", tier: 1, lat: 37.57, lng: 126.98, airports: ["ICN", "GMP"], aliases: ["seoul", "首尔"], hotelKey: "ICN" },
  { code: "PUS", name: "Busan", countryCode: "KR", regionType: "international", tier: 3, lat: 35.18, lng: 129.07, airports: ["PUS"], aliases: ["busan", "釜山"], hotelKey: "PUS" },

  // Southeast Asia
  { code: "BKK", name: "Bangkok", countryCode: "TH", regionType: "international", tier: 1, lat: 13.76, lng: 100.50, airports: ["BKK", "DMK"], aliases: ["bangkok", "曼谷"], hotelKey: "BKK" },
  { code: "HAN", name: "Hanoi", countryCode: "VN", regionType: "international", tier: 2, lat: 21.03, lng: 105.85, airports: ["HAN"], aliases: ["hanoi", "河内"], hotelKey: "HAN" },
  { code: "SGN", name: "Ho Chi Minh", countryCode: "VN", regionType: "international", tier: 2, lat: 10.82, lng: 106.66, airports: ["SGN"], aliases: ["ho chi minh", "saigon", "胡志明", "西贡"], hotelKey: "SGN" },
  { code: "CNX", name: "Chiang Mai", countryCode: "TH", regionType: "international", tier: 3, lat: 18.79, lng: 98.99, airports: ["CNX"], aliases: ["chiang mai", "清迈"], hotelKey: "CNX" },
  { code: "HKT", name: "Phuket", countryCode: "TH", regionType: "international", tier: 2, lat: 7.88, lng: 98.40, airports: ["HKT"], aliases: ["phuket", "普吉", "普吉岛"], hotelKey: "HKT" },
  { code: "SIN", name: "Singapore", countryCode: "SG", regionType: "international", tier: 1, lat: 1.35, lng: 103.82, airports: ["SIN"], aliases: ["singapore", "新加坡"], hotelKey: "SIN" },
  { code: "KUL", name: "Kuala Lumpur", countryCode: "MY", regionType: "international", tier: 2, lat: 3.14, lng: 101.69, airports: ["KUL"], aliases: ["kuala lumpur", "吉隆坡"], hotelKey: "KUL" },
  { code: "DPS", name: "Bali", countryCode: "ID", regionType: "international", tier: 2, lat: -8.67, lng: 115.21, airports: ["DPS"], aliases: ["bali", "denpasar", "巴厘", "巴厘岛"], hotelKey: "DPS" },
  { code: "MNL", name: "Manila", countryCode: "PH", regionType: "international", tier: 2, lat: 14.60, lng: 120.98, airports: ["MNL"], aliases: ["manila", "马尼拉"], hotelKey: "MNL" },
  { code: "MLE", name: "Maldives", countryCode: "MV", regionType: "international", tier: 3, lat: 4.18, lng: 73.51, airports: ["MLE"], aliases: ["maldives", "male", "马尔代夫", "马累"], hotelKey: "MLE" },

  // Middle East / Europe / Americas / Oceania (long haul)
  { code: "DXB", name: "Dubai", countryCode: "AE", regionType: "international", tier: 1, lat: 25.25, lng: 55.36, airports: ["DXB"], aliases: ["dubai", "迪拜"], hotelKey: "DXB" },
  { code: "LHR", name: "London", countryCode: "GB", regionType: "international", tier: 1, lat: 51.50, lng: -0.13, airports: ["LHR", "LGW", "STN"], aliases: ["london", "伦敦"], hotelKey: "LHR" },
  { code: "CDG", name: "Paris", countryCode: "FR", regionType: "international", tier: 1, lat: 48.86, lng: 2.35, airports: ["CDG", "ORY"], aliases: ["paris", "巴黎"], hotelKey: "CDG" },
  { code: "LAX", name: "Los Angeles", countryCode: "US", regionType: "international", tier: 1, lat: 34.05, lng: -118.24, airports: ["LAX"], aliases: ["los angeles", "洛杉矶"], hotelKey: "LAX" },
  { code: "NYC", name: "New York", countryCode: "US", regionType: "international", tier: 1, lat: 40.71, lng: -74.01, airports: ["JFK", "EWR", "LGA"], aliases: ["new york", "纽约"], hotelKey: "NYC" },
  { code: "SYD", name: "Sydney", countryCode: "AU", regionType: "international", tier: 1, lat: -33.87, lng: 151.21, airports: ["SYD"], aliases: ["sydney", "悉尼"], hotelKey: "SYD" },
];

const cityByCode = new Map<string, CityMeta>();
const cityByAlias = new Map<string, CityMeta>();

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

for (const city of CITIES) {
  cityByCode.set(city.code, city);
  cityByAlias.set(normalize(city.code), city);
  cityByAlias.set(normalize(city.name), city);
  for (const airport of city.airports) {
    cityByAlias.set(normalize(airport), city);
  }
  for (const alias of city.aliases) {
    cityByAlias.set(normalize(alias), city);
  }
}

export function getCityByCode(code: string): CityMeta | null {
  return cityByCode.get(code) ?? null;
}

export function resolveCity(input: string): CityMeta | null {
  if (!input) return null;
  return cityByAlias.get(normalize(input)) ?? null;
}

// Great-circle distance in kilometers (Haversine).
export function distanceKm(a: CityMeta, b: CityMeta): number {
  const R = 6371;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}
