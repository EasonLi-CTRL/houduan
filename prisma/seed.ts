import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const productData = [
  { name: '霍尔茨T型静音门', category: '木门', model: 'HET-JY01', priceRange: '1680-2280元/扇', description: '德国T型门结构，45dB隔音，环保E0级板材，标配静音锁具', imageUrl: '' },
  { name: '霍尔茨环保复合门', category: '木门', model: 'HET-HB02', priceRange: '1280-1680元/扇', description: '实木复合工艺，环保水性漆，多种颜色可选，性价比之选', imageUrl: '' },
  { name: '霍尔茨实木复合门', category: '木门', model: 'HET-SM03', priceRange: '2280-3280元/扇', description: '进口实木单板贴面，实木复合结构，质感出众，经久耐用', imageUrl: '' },
  { name: '霍尔茨现代简约门', category: '木门', model: 'HET-JD04', priceRange: '1480-1980元/扇', description: '极简设计风格，平板造型+线性装饰，适合现代家装风格', imageUrl: '' },
  { name: '霍尔茨轻奢鎏金门', category: '木门', model: 'HET-QS05', priceRange: '2680-3680元/扇', description: '轻奢风格设计，金属线条装饰，开放漆工艺，彰显品质生活', imageUrl: '' },
  { name: '霍尔茨推拉门', category: '木门', model: 'HET-TL06', priceRange: '1880-2580元/扇', description: '极窄边框设计，静音滑轮，适用于阳台、厨房等空间', imageUrl: '' },
];

async function main() {
  console.log('Clearing business data...');
  await prisma.referral.deleteMany();
  await prisma.followUp.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.community.deleteMany();

  console.log('Creating test user...');
  const hashedPassword = await bcrypt.hash('123456', 10);
  await prisma.user.upsert({
    where: { phone: '13800000000' },
    update: { password: hashedPassword, storeName: '霍尔茨木门石家庄店' },
    create: { phone: '13800000000', password: hashedPassword, storeName: '霍尔茨木门石家庄店' },
  });
  console.log('Test user ready: 13800000000 / 123456');

  console.log('Creating products...');
  await prisma.product.deleteMany();
  for (const pd of productData) {
    await prisma.product.create({ data: pd });
  }
  console.log(`Created ${productData.length} products`);

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });