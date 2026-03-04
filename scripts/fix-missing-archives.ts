import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../game/src/assets/data');

// 从REF-001检查结果中提取的缺失档案ID
const missingArchives = [
  { id: "No.TRASH_DIVER_REGRET", title: "拾荒者遗憾", category: "HOMELESS" },
  { id: "No.C01_CLIMATE_APARTHEID", title: "气候种族隔离", category: "COMMON" },
  { id: "No.C02_INFRASTRUCTURE_FAILURE", title: "基础设施崩溃", category: "COMMON" },
  { id: "No.C03_PYROCAPITALISM", title: "火焰资本主义", category: "COMMON" },
  { id: "No.C04_FOOD_SYSTEM", title: "食品系统", category: "COMMON" },
  { id: "No.C05_HEALTHCARE_FOR_PROFIT", title: "营利性医疗", category: "COMMON" },
  { id: "No.C06_PUBLIC_HEALTH_CUTS", title: "公共卫生削减", category: "COMMON" },
  { id: "No.C07_CRIME_AND_POVERTY", title: "犯罪与贫困", category: "COMMON" },
  { id: "No.C08_JUSTICE_GAP", title: "正义鸿沟", category: "COMMON" },
  { id: "No.C09_DATA_SURVEILLANCE", title: "数据监控", category: "COMMON" },
  { id: "No.C10_PLANNED_OBSOLESCENCE", title: "计划性淘汰", category: "COMMON" },
  { id: "No.C11_DIGITAL_DIVIDE", title: "数字鸿沟", category: "COMMON" },
  { id: "No.C12_SURVEILLANCE_CAPITALISM", title: "监控资本主义", category: "COMMON" },
  { id: "No.C13_CREDIT_APARTHEID", title: "信用种族隔离", category: "COMMON" },
  { id: "No.C14_POVERTY_TAX", title: "贫困税", category: "COMMON" },
  { id: "No.C15_DEBT_PEONAGE", title: "债务奴役", category: "COMMON" },
  { id: "No.C16_DEATH_INDUSTRIAL_COMPLEX", title: "死亡工业复合体", category: "COMMON" },
  { id: "No.C17_INTERGENERATIONAL_WEALTH", title: "代际财富", category: "COMMON" },
  { id: "No.C18_MARRIAGE_AS_CONTRACT", title: "婚姻作为契约", category: "COMMON" },
  { id: "No.C19_LOTTERY_AS_TAX", title: "彩票作为税收", category: "COMMON" },
  { id: "No.C20_GAMBLING_INDUSTRIAL_COMPLEX", title: "赌博工业复合体", category: "COMMON" },
  { id: "No.C21_TAX_COMPLEXITY_WEAPON", title: "税收复杂性武器", category: "COMMON" },
];

async function main() {
  const archivesPath = path.join(DATA_DIR, 'archives.json');
  const archives = JSON.parse(fs.readFileSync(archivesPath, 'utf-8'));
  
  console.log(`当前档案数: ${archives.length}`);
  
  // 获取现有档案ID
  const existingIds = new Set(archives.map((a: any) => a.id));
  
  // 添加缺失的档案
  let addedCount = 0;
  for (const archive of missingArchives) {
    if (!existingIds.has(archive.id)) {
      archives.push({
        id: archive.id,
        title: archive.title,
        image: `/assets/archives/placeholder.png`,
        flavorText: `【待补充】${archive.title}的相关档案资料。`,
        _comment: "AUTO_GENERATED: 由验证脚本自动添加，请补充完整内容"
      });
      addedCount++;
      console.log(`✅ 添加: ${archive.id}`);
    } else {
      console.log(`⏭️  已存在: ${archive.id}`);
    }
  }
  
  // 写回文件
  fs.writeFileSync(archivesPath, JSON.stringify(archives, null, 2), 'utf-8');
  
  console.log(`\n📊 完成: 添加了 ${addedCount} 个缺失档案`);
  console.log(`📁 总档案数: ${archives.length}`);
}

main().catch(console.error);
