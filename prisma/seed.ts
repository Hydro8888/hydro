import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const sources = [
  // === Global (8) ===
  { sourceName: 'Reuters', sourceType: 'RSS', country: 'global', language: 'en', baseUrl: 'https://www.reuters.com', feedUrl: 'https://www.reutersagency.com/feed/?best-topics=all&post_type=best' },
  { sourceName: 'AP News', sourceType: 'RSS', country: 'global', language: 'en', baseUrl: 'https://apnews.com', feedUrl: 'https://apnews.com/index.rss' },
  { sourceName: 'BBC World', sourceType: 'RSS', country: 'global', language: 'en', baseUrl: 'https://www.bbc.com', feedUrl: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
  { sourceName: 'The Guardian', sourceType: 'RSS', country: 'global', language: 'en', baseUrl: 'https://www.theguardian.com', feedUrl: 'https://www.theguardian.com/world/rss' },
  { sourceName: 'Al Jazeera', sourceType: 'RSS', country: 'global', language: 'en', baseUrl: 'https://www.aljazeera.com', feedUrl: 'https://www.aljazeera.com/xml/rss/all.xml' },
  { sourceName: 'Bloomberg', sourceType: 'RSS', country: 'global', language: 'en', baseUrl: 'https://www.bloomberg.com', feedUrl: 'https://feeds.bloomberg.com/markets/news.rss' },
  { sourceName: 'Euronews', sourceType: 'RSS', country: 'global', language: 'en', baseUrl: 'https://www.euronews.com', feedUrl: 'https://www.euronews.com/rss' },
  { sourceName: 'France 24', sourceType: 'RSS', country: 'global', language: 'en', baseUrl: 'https://www.france24.com', feedUrl: 'https://www.france24.com/en/rss' },

  // === US (8) ===
  { sourceName: 'CNN', sourceType: 'RSS', country: 'us', language: 'en', baseUrl: 'https://edition.cnn.com', feedUrl: 'http://rss.cnn.com/rss/edition.rss' },
  { sourceName: 'New York Times', sourceType: 'RSS', country: 'us', language: 'en', baseUrl: 'https://www.nytimes.com', feedUrl: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml' },
  { sourceName: 'Fox News', sourceType: 'RSS', country: 'us', language: 'en', baseUrl: 'https://www.foxnews.com', feedUrl: 'https://moxie.foxnews.com/google-publisher/latest.xml' },
  { sourceName: 'Washington Post', sourceType: 'RSS', country: 'us', language: 'en', baseUrl: 'https://www.washingtonpost.com', feedUrl: 'https://feeds.washingtonpost.com/rss/world' },
  { sourceName: 'CNBC', sourceType: 'RSS', country: 'us', language: 'en', baseUrl: 'https://www.cnbc.com', feedUrl: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114' },
  { sourceName: 'USA Today', sourceType: 'RSS', country: 'us', language: 'en', baseUrl: 'https://www.usatoday.com', feedUrl: 'https://www.usatoday.com/rss/' },
  { sourceName: 'NPR', sourceType: 'RSS', country: 'us', language: 'en', baseUrl: 'https://www.npr.org', feedUrl: 'https://feeds.npr.org/1001/rss.xml' },
  { sourceName: 'ABC News', sourceType: 'RSS', country: 'us', language: 'en', baseUrl: 'https://abcnews.go.com', feedUrl: 'https://abcnews.go.com/abcnews/topstories' },

  // === Japan (7) ===
  { sourceName: 'NHK World', sourceType: 'RSS', country: 'japan', language: 'en', baseUrl: 'https://www3.nhk.or.jp/nhkworld', feedUrl: 'https://www3.nhk.or.jp/nhkworld/en/news/list.xml' },
  { sourceName: 'Japan Times', sourceType: 'RSS', country: 'japan', language: 'en', baseUrl: 'https://www.japantimes.co.jp', feedUrl: 'https://www.japantimes.co.jp/feed/' },
  { sourceName: 'Nikkei Asia', sourceType: 'RSS', country: 'japan', language: 'en', baseUrl: 'https://asia.nikkei.com', feedUrl: 'https://asia.nikkei.com/rss/feed' },
  { sourceName: 'Mainichi', sourceType: 'RSS', country: 'japan', language: 'en', baseUrl: 'https://mainichi.jp/english', feedUrl: 'https://mainichi.jp/english/rss/etc/mainichi.xml' },
  { sourceName: 'Kyodo News', sourceType: 'RSS', country: 'japan', language: 'en', baseUrl: 'https://english.kyodonews.net', feedUrl: 'https://english.kyodonews.net/rss/news.xml' },
  { sourceName: 'Nippon.com', sourceType: 'RSS', country: 'japan', language: 'en', baseUrl: 'https://www.nippon.com', feedUrl: 'https://www.nippon.com/en/rss/all.rss' },
  { sourceName: 'Japan Today', sourceType: 'RSS', country: 'japan', language: 'en', baseUrl: 'https://japantoday.com', feedUrl: 'https://japantoday.com/feed' },

  // === China (7) ===
  { sourceName: 'Xinhua', sourceType: 'RSS', country: 'china', language: 'en', baseUrl: 'https://english.news.cn', feedUrl: 'https://english.news.cn/rss/mainpage.xml' },
  { sourceName: 'China Daily', sourceType: 'RSS', country: 'china', language: 'en', baseUrl: 'https://www.chinadaily.com.cn', feedUrl: 'https://www.chinadaily.com.cn/rss/world_rss.xml' },
  { sourceName: 'CGTN', sourceType: 'RSS', country: 'china', language: 'en', baseUrl: 'https://www.cgtn.com', feedUrl: 'https://www.cgtn.com/subscribe/rss/section/world.xml' },
  { sourceName: "People's Daily", sourceType: 'RSS', country: 'china', language: 'en', baseUrl: 'http://en.people.cn', feedUrl: 'http://en.people.cn/rss/90000.xml' },
  { sourceName: 'Global Times', sourceType: 'RSS', country: 'china', language: 'en', baseUrl: 'https://www.globaltimes.cn', feedUrl: 'https://www.globaltimes.cn/rss/outbrain.xml' },
  { sourceName: 'SCMP', sourceType: 'RSS', country: 'china', language: 'en', baseUrl: 'https://www.scmp.com', feedUrl: 'https://www.scmp.com/rss/91/feed' },
  { sourceName: 'Sixth Tone', sourceType: 'RSS', country: 'china', language: 'en', baseUrl: 'https://www.sixthtone.com', feedUrl: 'https://www.sixthtone.com/rss' },
];

async function main() {
  console.log('Seeding sources...');

  for (const source of sources) {
    await prisma.source.upsert({
      where: { id: sources.indexOf(source) + 1 },
      update: source,
      create: source,
    });
  }

  console.log(`Seeded ${sources.length} sources.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
