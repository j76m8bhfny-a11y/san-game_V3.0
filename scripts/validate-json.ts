#!/usr/bin/env ts-node
/**
 * JSON数据完整性检查脚本
 * 按照最终方案执行所有模块检查
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==================== 类型定义 ====================

type Severity = 'CRITICAL' | 'ERROR' | 'WARNING';

interface Issue {
  code: string;
  severity: Severity;
  file: string;
  path?: string;
  message: string;
  expected?: string;
  actual: string;
  suggestion: string;
}

interface ValidationReport {
  summary: {
    totalFiles: number;
    totalChecks: number;
    passed: number;
    failed: number;
    errors: number;
    warnings: number;
  };
  critical: Issue[];
  errors: Issue[];
  warnings: Issue[];
  byCategory: Record<string, { passed: number; failed: number }>;
}

interface LoadedData {
  events: Map<string, { file: string; data: any; dir: string }>;
  eventsOld: any[];
  items: any[];
  jobs: any[];
  archives: any[];
  classes: any[];
  housing: any[];
  vehicles: any[];
  bills: any[];
  loans: any[];
  diseases: any[];
  hospitalServices: any[];
  endings: any[];
}

// ==================== 颜色输出工具 ====================

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// ==================== 数据加载器 ====================

const DATA_DIR = path.join(__dirname, '../game/src/assets/data');
const EVENTS_DIR = path.join(DATA_DIR, 'events');

async function loadAllData(): Promise<LoadedData> {
  const data: LoadedData = {
    events: new Map(),
    eventsOld: [],
    items: [],
    jobs: [],
    archives: [],
    classes: [],
    housing: [],
    vehicles: [],
    bills: [],
    loans: [],
    diseases: [],
    hospitalServices: [],
    endings: [],
  };

  // 加载单个JSON文件
  const loadJson = (filePath: string): any => {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (e) {
      return null;
    }
  };

  // 加载事件目录
  const eventCategories = ['homeless', 'worker', 'middle', 'capitalist', 'common'];
  for (const cat of eventCategories) {
    const catDir = path.join(EVENTS_DIR, cat);
    if (!fs.existsSync(catDir)) continue;
    
    const files = fs.readdirSync(catDir).filter(f => f.endsWith('.json'));
    for (const file of files) {
      const filePath = path.join(catDir, file);
      const eventData = loadJson(filePath);
      if (eventData && eventData.id) {
        data.events.set(eventData.id, { file: `events/${cat}/${file}`, data: eventData, dir: cat });
      }
    }
  }

  // 加载旧版events.json
  const eventsOldPath = path.join(DATA_DIR, 'events.json');
  if (fs.existsSync(eventsOldPath)) {
    const oldEvents = loadJson(eventsOldPath);
    if (Array.isArray(oldEvents)) {
      data.eventsOld = oldEvents;
    }
  }

  // 加载其他数据文件
  data.items = loadJson(path.join(DATA_DIR, 'items.json')) || [];
  data.jobs = loadJson(path.join(DATA_DIR, 'jobs.json')) || [];
  data.archives = loadJson(path.join(DATA_DIR, 'archives.json')) || [];
  data.classes = loadJson(path.join(DATA_DIR, 'classes.json')) || [];
  data.housing = loadJson(path.join(DATA_DIR, 'housing.json')) || [];
  data.vehicles = loadJson(path.join(DATA_DIR, 'vehicles.json')) || [];
  data.bills = loadJson(path.join(DATA_DIR, 'bills.json')) || [];
  data.loans = loadJson(path.join(DATA_DIR, 'loans.json')) || [];
  data.diseases = loadJson(path.join(DATA_DIR, 'diseases.json')) || [];
  data.hospitalServices = loadJson(path.join(DATA_DIR, 'hospital_services.json')) || [];
  data.endings = loadJson(path.join(DATA_DIR, 'endings.json')) || [];

  return data;
}

// ==================== 验证器 ====================

class Validator {
  issues: Issue[] = [];
  data: LoadedData;
  totalChecks = 0;
  passedChecks = 0;

  constructor(data: LoadedData) {
    this.data = data;
  }

  addIssue(issue: Issue) {
    this.issues.push(issue);
  }

  // ========== 模块 1: 引用完整性 (REF) ==========

  // REF-001: 事件→档案引用检查
  checkRef001_Archives() {
    log('\n📋 检查 REF-001: 事件→档案引用...', 'cyan');
    const archiveIds = new Set(this.data.archives.map(a => a.id));
    
    for (const [eventId, eventInfo] of this.data.events) {
      const { data: eventData, file } = eventInfo;
      if (!eventData.options) continue;

      for (const [optionKey, option] of Object.entries(eventData.options)) {
        const opt = option as any;
        if (opt.archiveId) {
          this.totalChecks++;
          if (!archiveIds.has(opt.archiveId)) {
            this.addIssue({
              code: 'REF-001',
              severity: 'CRITICAL',
              file,
              path: `options.${optionKey}.archiveId`,
              message: `选项${optionKey}引用的档案不存在`,
              expected: `存在于archives.json中的ID`,
              actual: opt.archiveId,
              suggestion: `在archives.json中添加档案 "${opt.archiveId}" 或修正引用`,
            });
          } else {
            this.passedChecks++;
          }
        }
      }
    }
  }

  // REF-002: 事件→关联事件检查
  checkRef002_RelatedEvents() {
    log('📋 检查 REF-002: 关联事件引用...', 'cyan');
    const eventIds = new Set(this.data.events.keys());

    for (const [eventId, eventInfo] of this.data.events) {
      const { data: eventData, file } = eventInfo;
      if (!eventData.metadata?.relatedEvents) continue;

      for (const relatedId of eventData.metadata.relatedEvents) {
        this.totalChecks++;
        if (!eventIds.has(relatedId)) {
          this.addIssue({
            code: 'REF-002',
            severity: 'ERROR',
            file,
            path: 'metadata.relatedEvents',
            message: `关联事件不存在`,
            expected: `存在于events/目录下的文件`,
            actual: relatedId,
            suggestion: `移除无效关联或创建事件`,
          });
        } else {
          this.passedChecks++;
        }
      }
    }
  }

  // REF-003: 物品→事件触发检查
  checkRef003_ItemEventTriggers() {
    log('📋 检查 REF-003: 物品事件触发引用...', 'cyan');
    const eventIds = new Set(this.data.events.keys());

    for (const item of this.data.items) {
      if (!item.id || item._comment) continue;
      
      if (item.activeEffect?.type === 'TRIGGER_EVENT' && item.activeEffect.params?.eventId) {
        this.totalChecks++;
        const eventId = item.activeEffect.params.eventId;
        if (!eventIds.has(eventId)) {
          this.addIssue({
            code: 'REF-003',
            severity: 'CRITICAL',
            file: 'items.json',
            path: `item.${item.id}.activeEffect.params.eventId`,
            message: `物品触发的事件不存在`,
            expected: `存在于events/目录下的文件`,
            actual: eventId,
            suggestion: `创建事件或修改物品配置`,
          });
        } else {
          this.passedChecks++;
        }
      }
    }
  }

  // REF-004: 物品→Buff检查
  checkRef004_ItemBuffs() {
    log('📋 检查 REF-004: 物品Buff引用...', 'cyan');
    const validBuffs = new Set([
      'buff_addiction_alcohol', 'buff_bleeding_stop', 'buff_fatigue_suppress',
      'buff_toxic_buildup', 'buff_painkiller', 'buff_anxiety_block',
      'buff_class_illusion', 'buff_synthetic_youth', 'buff_immune_disease',
    ]);

    for (const item of this.data.items) {
      if (!item.id || item._comment) continue;
      
      if (item.activeEffect?.type === 'APPLY_BUFF' && item.activeEffect.params?.buffId) {
        this.totalChecks++;
        const buffId = item.activeEffect.params.buffId;
        if (!validBuffs.has(buffId)) {
          this.addIssue({
            code: 'REF-004',
            severity: 'WARNING',
            file: 'items.json',
            path: `item.${item.id}.activeEffect.params.buffId`,
            message: `物品引用的Buff未在已知列表中`,
            expected: `已知Buff ID`,
            actual: buffId,
            suggestion: `确认Buff "${buffId}" 是否已在系统中定义`,
          });
        } else {
          this.passedChecks++;
        }
      }
    }
  }

  // REF-007: 工作→阶层检查
  checkRef007_JobClasses() {
    log('📋 检查 REF-007: 工作→阶层引用...', 'cyan');
    const classIds = new Set(this.data.classes.map(c => c.id));

    for (const job of this.data.jobs) {
      if (!job.id) continue;
      
      this.totalChecks++;
      const requiredClass = job.requiredClass;
      if (requiredClass && !classIds.has(requiredClass)) {
        this.addIssue({
          code: 'REF-007',
          severity: 'CRITICAL',
          file: 'jobs.json',
          path: `job.${job.id}.requiredClass`,
          message: `工作要求的阶层不存在`,
          expected: `classes.json中的有效阶层ID`,
          actual: requiredClass,
          suggestion: `修正为classes.json中有效的阶层ID`,
        });
      } else {
        this.passedChecks++;
      }
    }
  }

  // ========== 模块 2: 唯一性 (UNIQ) ==========

  checkUniq001_GlobalIdUniqueness() {
    log('\n📋 检查 UNIQ-001: 全局ID唯一性...', 'cyan');
    
    // 检查events目录内重复
    const eventIds = new Map<string, string[]>();
    for (const [id, info] of this.data.events) {
      if (!eventIds.has(id)) eventIds.set(id, []);
      eventIds.get(id)!.push(info.file);
    }

    for (const [id, files] of eventIds) {
      this.totalChecks++;
      if (files.length > 1) {
        this.addIssue({
          code: 'UNIQ-001',
          severity: 'CRITICAL',
          file: files.join(', '),
          message: `事件ID重复`,
          expected: `唯一的事件ID`,
          actual: `${files.length}个文件使用相同ID: ${id}`,
          suggestion: `删除重复定义，确保唯一`,
        });
      } else {
        this.passedChecks++;
      }
    }

    // 检查events目录与events.json重复
    for (const oldEvent of this.data.eventsOld) {
      if (!oldEvent.id) continue;
      this.totalChecks++;
      if (this.data.events.has(oldEvent.id)) {
        this.addIssue({
          code: 'UNIQ-001',
          severity: 'ERROR',
          file: 'events.json (旧版)',
          message: `旧版events.json中的事件ID与events/目录重复`,
          expected: `唯一的ID`,
          actual: oldEvent.id,
          suggestion: `确认主版本后删除旧版`,
        });
      } else {
        this.passedChecks++;
      }
    }

    // 检查items.json内重复
    const itemIds = new Map<string, number>();
    for (const item of this.data.items) {
      if (!item.id || item._comment) continue;
      itemIds.set(item.id, (itemIds.get(item.id) || 0) + 1);
    }
    for (const [id, count] of itemIds) {
      this.totalChecks++;
      if (count > 1) {
        this.addIssue({
          code: 'UNIQ-001',
          severity: 'CRITICAL',
          file: 'items.json',
          message: `物品ID重复`,
          expected: `唯一的物品ID`,
          actual: `${count}个物品使用相同ID: ${id}`,
          suggestion: `删除重复的物品定义`,
        });
      } else {
        this.passedChecks++;
      }
    }

    // 检查jobs.json内重复
    const jobIds = new Map<string, number>();
    for (const job of this.data.jobs) {
      if (!job.id) continue;
      jobIds.set(job.id, (jobIds.get(job.id) || 0) + 1);
    }
    for (const [id, count] of jobIds) {
      this.totalChecks++;
      if (count > 1) {
        this.addIssue({
          code: 'UNIQ-001',
          severity: 'CRITICAL',
          file: 'jobs.json',
          message: `工作ID重复`,
          expected: `唯一的工作ID`,
          actual: `${count}个工作使用相同ID: ${id}`,
          suggestion: `删除重复的工作定义`,
        });
      } else {
        this.passedChecks++;
      }
    }
  }

  // ========== 模块 3: 结构完整性 (STRUCT) ==========

  checkStruct001_FilenameMatchesId() {
    log('\n📋 检查 STRUCT-001: 文件名=id...', 'cyan');
    
    for (const [id, info] of this.data.events) {
      this.totalChecks++;
      const filename = path.basename(info.file, '.json');
      if (filename !== id) {
        this.addIssue({
          code: 'STRUCT-001',
          severity: 'CRITICAL',
          file: info.file,
          message: `文件名与id字段不匹配`,
          expected: `文件名应为 "${id}.json"`,
          actual: `文件名为 "${filename}.json"，id为 "${id}"`,
          suggestion: `统一文件名和文件内id`,
        });
      } else {
        this.passedChecks++;
      }
    }
  }

  checkStruct002_DirectoryMatchesCategory() {
    log('📋 检查 STRUCT-002: 目录=category...', 'cyan');
    
    const dirToCategory: Record<string, string> = {
      'homeless': 'HOMELESS',
      'worker': 'WORKER',
      'middle': 'MIDDLE',
      'capitalist': 'CAPITALIST',
      'common': 'COMMON',
    };

    for (const [id, info] of this.data.events) {
      this.totalChecks++;
      const expectedCategory = dirToCategory[info.dir];
      const actualCategory = info.data.category;
      
      if (expectedCategory && actualCategory !== expectedCategory) {
        this.addIssue({
          code: 'STRUCT-002',
          severity: 'CRITICAL',
          file: info.file,
          path: 'category',
          message: `category字段与所在目录不匹配`,
          expected: `"${expectedCategory}" (匹配目录 events/${info.dir}/)`,
          actual: `"${actualCategory}"`,
          suggestion: `移动文件到正确目录或修正category`,
        });
      } else {
        this.passedChecks++;
      }
    }
  }

  checkStruct003_RequiredFields() {
    log('📋 检查 STRUCT-003: 事件v3必需字段...', 'cyan');
    
    const requiredRootFields = ['$schema', 'id', 'title', 'category', 'text', 'conditions', 'options', 'metadata'];
    const requiredConditionFields = ['requiredClass', 'weight'];
    const requiredOptionFields = ['label', 'roast', 'effects'];
    const requiredEffectTypes = ['hp', 'gold', 'insight', 'insightGain'];
    const requiredMetadataFields = ['author', 'version', 'createdAt', 'updatedAt'];

    for (const [id, info] of this.data.events) {
      const { data, file } = info;
      
      // 检查根级必需字段
      for (const field of requiredRootFields) {
        this.totalChecks++;
        if (!(field in data)) {
          this.addIssue({
            code: 'STRUCT-003',
            severity: 'CRITICAL',
            file,
            path: field,
            message: `缺少必需字段`,
            expected: `包含 "${field}"`,
            actual: '字段缺失',
            suggestion: `补充缺失字段`,
          });
        } else {
          this.passedChecks++;
        }
      }

      // 检查conditions必需字段
      if (data.conditions) {
        for (const field of requiredConditionFields) {
          this.totalChecks++;
          if (!(field in data.conditions)) {
            this.addIssue({
              code: 'STRUCT-003',
              severity: 'CRITICAL',
              file,
              path: `conditions.${field}`,
              message: `conditions缺少必需字段`,
              expected: `包含 "${field}"`,
              actual: '字段缺失',
              suggestion: `在conditions中添加 "${field}" 字段`,
            });
          } else {
            this.passedChecks++;
          }
        }
      }

      // 检查options必需字段
      if (data.options) {
        // 必须包含A和B
        this.totalChecks++;
        if (!data.options.A || !data.options.B) {
          this.addIssue({
            code: 'STRUCT-003',
            severity: 'CRITICAL',
            file,
            path: 'options',
            message: `options缺少必需选项`,
            expected: '包含选项A和B',
            actual: `A: ${data.options.A ? '存在' : '缺失'}, B: ${data.options.B ? '存在' : '缺失'}`,
            suggestion: '确保options包含A和B选项',
          });
        } else {
          this.passedChecks++;
        }

        // 检查每个选项的必需字段
        for (const [optKey, opt] of Object.entries(data.options)) {
          const option = opt as any;
          for (const field of requiredOptionFields) {
            this.totalChecks++;
            if (!(field in option)) {
              this.addIssue({
                code: 'STRUCT-003',
                severity: 'CRITICAL',
                file,
                path: `options.${optKey}.${field}`,
                message: `选项${optKey}缺少必需字段`,
                expected: `包含 "${field}"`,
                actual: '字段缺失',
                suggestion: `补充缺失字段`,
              });
            } else {
              this.passedChecks++;
            }
          }

          // 检查effects必需字段
          if (option.effects) {
            this.totalChecks++;
            if (!('scaling' in option.effects)) {
              this.addIssue({
                code: 'STRUCT-003',
                severity: 'CRITICAL',
                file,
                path: `options.${optKey}.effects.scaling`,
                message: `effects缺少scaling字段`,
                expected: '包含scaling字段',
                actual: '字段缺失',
                suggestion: '添加effects.scaling字段',
              });
            } else {
              this.passedChecks++;
            }

            // 检查至少有一个效果字段
            this.totalChecks++;
            const hasEffect = requiredEffectTypes.some(et => et in option.effects);
            if (!hasEffect) {
              this.addIssue({
                code: 'STRUCT-003',
                severity: 'CRITICAL',
                file,
                path: `options.${optKey}.effects`,
                message: `effects缺少至少一个效果字段`,
                expected: `其中之一: ${requiredEffectTypes.join(', ')}`,
                actual: '无效果字段',
                suggestion: '添加至少一个效果字段',
              });
            } else {
              this.passedChecks++;
            }
          }
        }
      }

      // 检查metadata必需字段
      if (data.metadata) {
        for (const field of requiredMetadataFields) {
          this.totalChecks++;
          if (!(field in data.metadata)) {
            this.addIssue({
              code: 'STRUCT-003',
              severity: 'CRITICAL',
              file,
              path: `metadata.${field}`,
              message: `metadata缺少必需字段`,
              expected: `包含 "${field}"`,
              actual: '字段缺失',
              suggestion: `补充缺失字段`,
            });
          } else {
            this.passedChecks++;
          }
        }
      }
    }
  }

  checkStruct004_ConditionalFields() {
    log('📋 检查 STRUCT-004: 条件字段检查...', 'cyan');
    
    for (const [id, info] of this.data.events) {
      const { data, file } = info;
      if (!data.options) continue;

      for (const [optKey, opt] of Object.entries(data.options)) {
        const option = opt as any;
        
        // 检查isGlitched=true时的必需字段
        if (option.isGlitched === true) {
          this.totalChecks++;
          if (!option.glitchEffect) {
            this.addIssue({
              code: 'STRUCT-004',
              severity: 'ERROR',
              file,
              path: `options.${optKey}.glitchEffect`,
              message: `isGlitched=true但缺少glitchEffect`,
              expected: '包含glitchEffect字段',
              actual: '字段缺失',
              suggestion: '补充glitchEffect/sanLock字段',
            });
          } else {
            this.passedChecks++;
          }

          this.totalChecks++;
          if (!option.sanLock && option.sanLock !== 0) {
            this.addIssue({
              code: 'STRUCT-004',
              severity: 'ERROR',
              file,
              path: `options.${optKey}.sanLock`,
              message: `isGlitched=true但缺少sanLock`,
              expected: '包含sanLock字段',
              actual: '字段缺失',
              suggestion: '补充glitchEffect/sanLock字段',
            });
          } else {
            this.passedChecks++;
          }
        }
      }
    }
  }

  // ========== 模块 4: 命名规范 (NAMING) ==========

  checkNaming001_EventIdFormat() {
    log('\n📋 检查 NAMING-001: 事件ID命名规范...', 'cyan');
    const pattern = /^EVT_[HWMC][0-9]{2}_[A-Z_]+$/;
    
    for (const [id, info] of this.data.events) {
      // common类别使用不同的格式 EVT_C01_XXX
      if (info.data.category === 'COMMON') continue;
      
      this.totalChecks++;
      if (!pattern.test(id)) {
        this.addIssue({
          code: 'NAMING-001',
          severity: 'ERROR',
          file: info.file,
          path: 'id',
          message: `事件ID不符合命名规范`,
          expected: '格式: EVT_{H|W|M|C}{序号}_{描述}',
          actual: id,
          suggestion: `按规范重命名`,
        });
      } else {
        this.passedChecks++;
      }
    }
  }

  checkNaming003_ArchiveIdFormat() {
    log('📋 检查 NAMING-003: 档案ID命名规范...', 'cyan');
    const pattern = /^No\.[0-9]{2}_[A-Z_]+$/;
    
    for (const archive of this.data.archives) {
      if (!archive.id) continue;
      this.totalChecks++;
      
      if (!pattern.test(archive.id)) {
        this.addIssue({
          code: 'NAMING-003',
          severity: 'ERROR',
          file: 'archives.json',
          path: `archive.${archive.id}.id`,
          message: `档案ID不符合命名规范`,
          expected: '格式: No.{序号}_{描述}',
          actual: archive.id,
          suggestion: `按规范重命名`,
        });
      } else {
        this.passedChecks++;
      }
    }
  }

  checkNaming004_ItemIdFormat() {
    log('📋 检查 NAMING-004: 物品ID命名规范...', 'cyan');
    const pattern = /^(FOOD|MEDICAL|ITEM|DRUG|GEAR|I[0-9]{2}|D[0-9]{2}|BOOK_|SUIT_|KEY_|CAR_)[A-Z_0-9]*$/;
    
    for (const item of this.data.items) {
      if (!item.id || item._comment) continue;
      this.totalChecks++;
      
      if (!pattern.test(item.id)) {
        this.addIssue({
          code: 'NAMING-004',
          severity: 'WARNING',
          file: 'items.json',
          path: `item.${item.id}.id`,
          message: `物品ID不符合推荐命名规范`,
          expected: '格式: {类别}_{描述}',
          actual: item.id,
          suggestion: `考虑按规范重命名（兼容旧数据可忽略）`,
        });
      } else {
        this.passedChecks++;
      }
    }
  }

  checkNaming005_JobIdFormat() {
    log('📋 检查 NAMING-005: 工作ID命名规范...', 'cyan');
    const pattern = /^JOB_[A-Z_]+$/;
    
    for (const job of this.data.jobs) {
      if (!job.id) continue;
      this.totalChecks++;
      
      if (!pattern.test(job.id)) {
        this.addIssue({
          code: 'NAMING-005',
          severity: 'WARNING',
          file: 'jobs.json',
          path: `job.${job.id}.id`,
          message: `工作ID不符合命名规范`,
          expected: '格式: JOB_{描述}',
          actual: job.id,
          suggestion: `按规范重命名`,
        });
      } else {
        this.passedChecks++;
      }
    }
  }

  // ========== 模块 5: 数据格式 (FMT) ==========

  checkFmt001_RequiredClassFormat() {
    log('\n📋 检查 FMT-001: requiredClass字段格式一致性...', 'cyan');
    
    // 检查bills.json使用数组格式
    for (const bill of this.data.bills) {
      if (!bill.requiredClass) continue;
      this.totalChecks++;
      
      if (!Array.isArray(bill.requiredClass)) {
        this.addIssue({
          code: 'FMT-001',
          severity: 'WARNING',
          file: 'bills.json',
          path: `bill.${bill.id || 'unknown'}.requiredClass`,
          message: `bills.json中requiredClass建议使用数组格式`,
          expected: '数组格式，如 ["HOMELESS"]',
          actual: `字符串: "${bill.requiredClass}"`,
          suggestion: '统一为数组或字符串格式',
        });
      } else {
        this.passedChecks++;
      }
    }
  }

  checkFmt002_ScalingGoldFormat() {
    log('📋 检查 FMT-002: scaling与gold数值格式匹配...', 'cyan');
    
    for (const [id, info] of this.data.events) {
      const { data, file } = info;
      if (!data.options) continue;

      for (const [optKey, opt] of Object.entries(data.options)) {
        const option = opt as any;
        if (!option.effects) continue;
        
        const { scaling, gold } = option.effects;
        if (gold === undefined) continue;
        
        this.totalChecks++;
        
        if (scaling === 'INCOME') {
          // INCOME模式下gold应该是小数
          if (Math.abs(gold) > 1 && Number.isInteger(gold)) {
            this.addIssue({
              code: 'FMT-002',
              severity: 'WARNING',
              file,
              path: `options.${optKey}.effects.gold`,
              message: `scaling=INCOME但gold为整数，可能应该是百分比`,
              expected: '小数格式，如 -0.15 (表示-15%)',
              actual: `整数: ${gold}`,
              suggestion: '调整数值格式',
            });
          } else {
            this.passedChecks++;
          }
        } else if (scaling === 'LEVERAGE' || scaling === 'FIXED') {
          // LEVERAGE/FIXED模式下gold应该是整数
          if (!Number.isInteger(gold)) {
            this.addIssue({
              code: 'FMT-002',
              severity: 'WARNING',
              file,
              path: `options.${optKey}.effects.gold`,
              message: `scaling=${scaling}但gold为小数，可能格式不匹配`,
              expected: '整数格式',
              actual: `小数: ${gold}`,
              suggestion: '调整数值格式',
            });
          } else {
            this.passedChecks++;
          }
        } else {
          this.passedChecks++;
        }
      }
    }
  }

  // ========== 模块 6: 系统字段 (SYS) ==========

  checkSys001_PointsType() {
    log('\n📋 检查 SYS-001: points类型有效性...', 'cyan');
    const validPointTypes = new Set(['old', 'wolf', 'red']);
    
    for (const item of this.data.items) {
      if (!item.id || item._comment || !item.effects?.points) continue;
      
      for (const pointType of Object.keys(item.effects.points)) {
        this.totalChecks++;
        if (!validPointTypes.has(pointType)) {
          this.addIssue({
            code: 'SYS-001',
            severity: 'WARNING',
            file: 'items.json',
            path: `item.${item.id}.effects.points`,
            message: `points类型未在系统定义中`,
            expected: `已知类型: ${Array.from(validPointTypes).join(', ')}`,
            actual: pointType,
            suggestion: '确认该points类型是否已在系统中定义',
          });
        } else {
          this.passedChecks++;
        }
      }
    }
  }

  checkSys003_IdeologyEnum() {
    log('📋 检查 SYS-003: ideology枚举值...', 'cyan');
    const validIdeologies = new Set([
      '新自由主义/奋斗逼',
      '犬儒主义/摆烂',
      '消费主义/岁静',
      '激进左翼/觉醒',
    ]);
    
    for (const [id, info] of this.data.events) {
      const { data, file } = info;
      if (!data.ideology) continue;
      
      this.totalChecks++;
      if (!validIdeologies.has(data.ideology)) {
        this.addIssue({
          code: 'SYS-003',
          severity: 'WARNING',
          file,
          path: 'ideology',
          message: `ideology值不在预定义枚举中`,
          expected: `其中之一: ${Array.from(validIdeologies).join(', ')}`,
          actual: data.ideology,
          suggestion: '使用预定义的ideology值',
        });
      } else {
        this.passedChecks++;
      }
    }
  }

  // ========== 模块 7: 逻辑范围 (RNG) ==========

  checkRng001_ThresholdOrder() {
    log('\n📋 检查 RNG-001: thresholdMin/Max顺序...', 'cyan');
    
    for (const cls of this.data.classes) {
      this.totalChecks++;
      if (cls.thresholdMin >= cls.thresholdMax) {
        this.addIssue({
          code: 'RNG-001',
          severity: 'ERROR',
          file: 'classes.json',
          path: `class.${cls.id}.threshold`,
          message: `thresholdMin必须小于thresholdMax`,
          expected: `thresholdMin < thresholdMax`,
          actual: `${cls.thresholdMin} >= ${cls.thresholdMax}`,
          suggestion: '调整数值设计',
        });
      } else {
        this.passedChecks++;
      }
    }
  }

  checkRng003_SanRange() {
    log('📋 检查 RNG-003: minSan/maxSan范围...', 'cyan');
    
    for (const [id, info] of this.data.events) {
      const { data, file } = info;
      if (!data.conditions) continue;
      
      const { minSan, maxSan } = data.conditions;
      
      if (minSan !== undefined) {
        this.totalChecks++;
        if (minSan < 0 || minSan > 100) {
          this.addIssue({
            code: 'RNG-003',
            severity: 'ERROR',
            file,
            path: 'conditions.minSan',
            message: `minSan超出有效范围`,
            expected: '0 <= minSan <= 100',
            actual: minSan.toString(),
            suggestion: '调整数值范围',
          });
        } else {
          this.passedChecks++;
        }
      }
      
      if (maxSan !== undefined) {
        this.totalChecks++;
        if (maxSan < 0 || maxSan > 100) {
          this.addIssue({
            code: 'RNG-003',
            severity: 'ERROR',
            file,
            path: 'conditions.maxSan',
            message: `maxSan超出有效范围`,
            expected: '0 <= maxSan <= 100',
            actual: maxSan.toString(),
            suggestion: '调整数值范围',
          });
        } else {
          this.passedChecks++;
        }
      }
    }
  }

  checkRng004_WeightRange() {
    log('📋 检查 RNG-004: weight正整数范围...', 'cyan');
    
    for (const [id, info] of this.data.events) {
      const { data, file } = info;
      if (!data.conditions?.weight !== undefined) continue;
      
      const weight = data.conditions.weight;
      this.totalChecks++;
      
      if (weight <= 0) {
        this.addIssue({
          code: 'RNG-004',
          severity: 'ERROR',
          file,
          path: 'conditions.weight',
          message: `weight必须是正整数`,
          expected: 'weight > 0',
          actual: weight.toString(),
          suggestion: '调整数值',
        });
      } else if (weight > 50) {
        this.addIssue({
          code: 'RNG-004',
          severity: 'WARNING',
          file,
          path: 'conditions.weight',
          message: `weight值超过50，可能影响事件分布`,
          expected: '1-50范围内',
          actual: weight.toString(),
          suggestion: '调整数值设计',
        });
      } else {
        this.passedChecks++;
      }
    }
  }

  checkRng005_PriceRange() {
    log('📋 检查 RNG-005: 物品price范围...', 'cyan');
    
    for (const item of this.data.items) {
      if (!item.id || item._comment) continue;
      if (item.price === undefined) continue;
      
      this.totalChecks++;
      
      if (item.price < 0) {
        this.addIssue({
          code: 'RNG-005',
          severity: 'ERROR',
          file: 'items.json',
          path: `item.${item.id}.price`,
          message: `物品price不能为负数`,
          expected: 'price >= 0',
          actual: item.price.toString(),
          suggestion: '调整数值',
        });
      } else if (item.price > 10000) {
        this.addIssue({
          code: 'RNG-005',
          severity: 'WARNING',
          file: 'items.json',
          path: `item.${item.id}.price`,
          message: `物品price超过10000，可能异常`,
          expected: '合理范围内的价格',
          actual: item.price.toString(),
          suggestion: '确认价格设计',
        });
      } else {
        this.passedChecks++;
      }
    }
  }

  checkRng006_BaseSalary() {
    log('📋 检查 RNG-006: 工作baseSalary范围...', 'cyan');
    
    for (const job of this.data.jobs) {
      if (!job.id || job.baseSalary === undefined) continue;
      
      this.totalChecks++;
      
      if (job.baseSalary <= 0) {
        this.addIssue({
          code: 'RNG-006',
          severity: 'ERROR',
          file: 'jobs.json',
          path: `job.${job.id}.baseSalary`,
          message: `工作baseSalary必须为正数`,
          expected: 'baseSalary > 0',
          actual: job.baseSalary.toString(),
          suggestion: '调整数值',
        });
      } else if (job.baseSalary > 20000) {
        this.addIssue({
          code: 'RNG-006',
          severity: 'WARNING',
          file: 'jobs.json',
          path: `job.${job.id}.baseSalary`,
          message: `工作baseSalary超过20000/周，可能异常`,
          expected: '合理范围内的薪资',
          actual: job.baseSalary.toString(),
          suggestion: '确认薪资设计',
        });
      } else {
        this.passedChecks++;
      }
    }
  }

  checkRng007_CostRange() {
    log('📋 检查 RNG-007: hpCost/insightCost范围...', 'cyan');
    
    for (const job of this.data.jobs) {
      if (!job.id) continue;
      
      if (job.hpCost !== undefined) {
        this.totalChecks++;
        if (job.hpCost < 0) {
          this.addIssue({
            code: 'RNG-007',
            severity: 'ERROR',
            file: 'jobs.json',
            path: `job.${job.id}.hpCost`,
            message: `hpCost不能为负数`,
            expected: 'hpCost >= 0',
            actual: job.hpCost.toString(),
            suggestion: '调整数值',
          });
        } else if (job.hpCost > 60) {
          this.addIssue({
            code: 'RNG-007',
            severity: 'WARNING',
            file: 'jobs.json',
            path: `job.${job.id}.hpCost`,
            message: `hpCost超过60，可能影响游戏平衡`,
            expected: '合理范围内的值',
            actual: job.hpCost.toString(),
            suggestion: '确认数值设计',
          });
        } else {
          this.passedChecks++;
        }
      }
      
      if (job.insightCost !== undefined) {
        this.totalChecks++;
        if (job.insightCost < 0) {
          this.addIssue({
            code: 'RNG-007',
            severity: 'ERROR',
            file: 'jobs.json',
            path: `job.${job.id}.insightCost`,
            message: `insightCost不能为负数`,
            expected: 'insightCost >= 0',
            actual: job.insightCost.toString(),
            suggestion: '调整数值',
          });
        } else if (job.insightCost > 60) {
          this.addIssue({
            code: 'RNG-007',
            severity: 'WARNING',
            file: 'jobs.json',
            path: `job.${job.id}.insightCost`,
            message: `insightCost超过60，可能影响游戏平衡`,
            expected: '合理范围内的值',
            actual: job.insightCost.toString(),
            suggestion: '确认数值设计',
          });
        } else {
          this.passedChecks++;
        }
      }
    }
  }
}

// ==================== 报告生成器 ====================

function generateReport(validator: Validator): ValidationReport {
  const critical = validator.issues.filter(i => i.severity === 'CRITICAL');
  const errors = validator.issues.filter(i => i.severity === 'ERROR');
  const warnings = validator.issues.filter(i => i.severity === 'WARNING');

  return {
    summary: {
      totalFiles: validator.data.events.size + 10, // 粗略估计
      totalChecks: validator.totalChecks,
      passed: validator.passedChecks,
      failed: validator.issues.length,
      errors: critical.length + errors.length,
      warnings: warnings.length,
    },
    critical,
    errors,
    warnings,
    byCategory: {
      REF: { 
        passed: validator.passedChecks, 
        failed: validator.issues.filter(i => i.code.startsWith('REF')).length 
      },
      UNIQ: { 
        passed: 0, 
        failed: validator.issues.filter(i => i.code.startsWith('UNIQ')).length 
      },
      STRUCT: { 
        passed: 0, 
        failed: validator.issues.filter(i => i.code.startsWith('STRUCT')).length 
      },
      NAMING: { 
        passed: 0, 
        failed: validator.issues.filter(i => i.code.startsWith('NAMING')).length 
      },
      FMT: { 
        passed: 0, 
        failed: validator.issues.filter(i => i.code.startsWith('FMT')).length 
      },
      SYS: { 
        passed: 0, 
        failed: validator.issues.filter(i => i.code.startsWith('SYS')).length 
      },
      RNG: { 
        passed: 0, 
        failed: validator.issues.filter(i => i.code.startsWith('RNG')).length 
      },
    },
  };
}

function printReport(report: ValidationReport) {
  console.log('\n' + '='.repeat(80));
  log('                    JSON数据完整性检查报告', 'cyan');
  console.log('='.repeat(80));

  // 摘要
  console.log('\n📊 检查摘要:');
  console.log(`   检查文件数: ${report.summary.totalFiles}`);
  console.log(`   检查项目数: ${report.summary.totalChecks}`);
  console.log(`   通过: ${colors.green}${report.summary.passed}${colors.reset}`);
  console.log(`   失败: ${colors.red}${report.summary.failed}${colors.reset}`);
  console.log(`   严重错误(P0): ${colors.red}${report.critical.length}${colors.reset}`);
  console.log(`   错误(P1): ${colors.yellow}${report.errors.length}${colors.reset}`);
  console.log(`   警告(P2): ${colors.yellow}${report.summary.warnings}${colors.reset}`);

  // 按类别统计
  console.log('\n📁 按类别统计:');
  for (const [cat, stats] of Object.entries(report.byCategory)) {
    if (stats.failed > 0) {
      console.log(`   ${cat}: ${colors.red}${stats.failed} 问题${colors.reset}`);
    }
  }

  // 严重错误
  if (report.critical.length > 0) {
    console.log('\n' + '🔴'.repeat(40));
    log('                     P0 - 严重错误 (必须修复)', 'red');
    console.log('🔴'.repeat(40));
    
    // 按错误代码分组
    const byCode: Record<string, Issue[]> = {};
    for (const issue of report.critical) {
      if (!byCode[issue.code]) byCode[issue.code] = [];
      byCode[issue.code].push(issue);
    }
    
    for (const [code, issues] of Object.entries(byCode)) {
      console.log(`\n   [${code}] - ${issues.length}个问题`);
      for (const issue of issues) {
        console.log(`   ❌ ${issue.file}${issue.path ? ` → ${issue.path}` : ''}`);
        console.log(`      ${issue.message}`);
        console.log(`      实际: ${issue.actual}`);
        console.log(`      建议: ${colors.cyan}${issue.suggestion}${colors.reset}`);
      }
    }
  }

  // 错误
  if (report.errors.length > 0) {
    console.log('\n' + '🟡'.repeat(40));
    log('                     P1 - 错误 (应该修复)', 'yellow');
    console.log('🟡'.repeat(40));
    
    const byCode: Record<string, Issue[]> = {};
    for (const issue of report.errors) {
      if (!byCode[issue.code]) byCode[issue.code] = [];
      byCode[issue.code].push(issue);
    }
    
    for (const [code, issues] of Object.entries(byCode)) {
      console.log(`\n   [${code}] - ${issues.length}个问题`);
      for (const issue of issues) {
        console.log(`   ⚠️  ${issue.file}${issue.path ? ` → ${issue.path}` : ''}`);
        console.log(`      ${issue.message}`);
        console.log(`      建议: ${colors.cyan}${issue.suggestion}${colors.reset}`);
      }
    }
  }

  // 警告
  if (report.warnings.length > 0) {
    console.log('\n' + '🟢'.repeat(40));
    log('                     P2 - 警告 (建议优化)', 'green');
    console.log('🟢'.repeat(40));
    
    const byCode: Record<string, Issue[]> = {};
    for (const issue of report.warnings) {
      if (!byCode[issue.code]) byCode[issue.code] = [];
      byCode[issue.code].push(issue);
    }
    
    for (const [code, issues] of Object.entries(byCode)) {
      console.log(`\n   [${code}] - ${issues.length}个问题`);
      for (const issue of issues.slice(0, 5)) { // 只显示前5个
        console.log(`   ℹ️  ${issue.file}${issue.path ? ` → ${issue.path}` : ''}`);
        console.log(`      ${issue.message}`);
      }
      if (issues.length > 5) {
        console.log(`   ... 还有 ${issues.length - 5} 个类似问题`);
      }
    }
  }

  // 最终结果
  console.log('\n' + '='.repeat(80));
  if (report.critical.length === 0 && report.errors.length === 0) {
    log('✅ 所有检查通过！数据完整性良好。', 'green');
  } else if (report.critical.length === 0) {
    log('⚠️  检查完成，存在一些问题建议修复。', 'yellow');
  } else {
    log('❌ 检查失败！存在严重问题必须修复。', 'red');
  }
  console.log('='.repeat(80));
}

// ==================== 主函数 ====================

async function main() {
  log('\n🔍 开始JSON数据完整性检查...', 'cyan');
  log(`数据目录: ${DATA_DIR}\n`, 'gray');

  try {
    const data = await loadAllData();
    
    log(`加载完成:`, 'green');
    log(`  - events/目录: ${data.events.size} 个事件`, 'gray');
    log(`  - events.json(旧版): ${data.eventsOld.length} 个事件`, 'gray');
    log(`  - items.json: ${data.items.filter(i => i.id && !i._comment).length} 个物品`, 'gray');
    log(`  - jobs.json: ${data.jobs.length} 个工作`, 'gray');
    log(`  - archives.json: ${data.archives.length} 个档案`, 'gray');
    log(`  - classes.json: ${data.classes.length} 个阶层`, 'gray');

    const validator = new Validator(data);

    // 执行所有检查
    validator.checkRef001_Archives();
    validator.checkRef002_RelatedEvents();
    validator.checkRef003_ItemEventTriggers();
    validator.checkRef004_ItemBuffs();
    validator.checkRef007_JobClasses();
    
    validator.checkUniq001_GlobalIdUniqueness();
    
    validator.checkStruct001_FilenameMatchesId();
    validator.checkStruct002_DirectoryMatchesCategory();
    validator.checkStruct003_RequiredFields();
    validator.checkStruct004_ConditionalFields();
    
    validator.checkNaming001_EventIdFormat();
    validator.checkNaming003_ArchiveIdFormat();
    validator.checkNaming004_ItemIdFormat();
    validator.checkNaming005_JobIdFormat();
    
    validator.checkFmt001_RequiredClassFormat();
    validator.checkFmt002_ScalingGoldFormat();
    
    validator.checkSys001_PointsType();
    validator.checkSys003_IdeologyEnum();
    
    validator.checkRng001_ThresholdOrder();
    validator.checkRng003_SanRange();
    validator.checkRng004_WeightRange();
    validator.checkRng005_PriceRange();
    validator.checkRng006_BaseSalary();
    validator.checkRng007_CostRange();

    const report = generateReport(validator);
    printReport(report);

    // 有P0错误则退出码非零
    if (report.critical.length > 0) {
      process.exit(1);
    }
    process.exit(0);
    
  } catch (error) {
    log(`\n❌ 检查过程出错: ${error}`, 'red');
    process.exit(1);
  }
}

main();
