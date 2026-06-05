'use strict';
const fs    = require('fs');
const path  = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const DIR = path.join(__dirname, '../uploads');
if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });

// 每件藏品的配色和汉字图标
const CFG = {
   1:{bg:'#2a1a08',fg:'#c8a050',icon:'鼎',sub:'青铜礼器'},
   2:{bg:'#1a2808',fg:'#b8a040',icon:'尊',sub:'青铜礼器'},
   3:{bg:'#0d0d18',fg:'#c8c868',icon:'劍',sub:'青铜兵器'},
   4:{bg:'#180808',fg:'#d4a040',icon:'爐',sub:'青铜熏炉'},
   5:{bg:'#1a1508',fg:'#b0a038',icon:'觚',sub:'青铜酒器'},
   6:{bg:'#0a1205',fg:'#a09030',icon:'鐘',sub:'青铜乐器'},
   7:{bg:'#080d12',fg:'#9090a8',icon:'鏡',sub:'青铜镜'},
   8:{bg:'#08100a',fg:'#c8a840',icon:'馬',sub:'铜奔马'},
   9:{bg:'#120808',fg:'#b09030',icon:'爵',sub:'青铜酒器'},
  10:{bg:'#180d04',fg:'#d4b050',icon:'爐',sub:'鎏金熏炉'},
  11:{bg:'#2a1505',fg:'#d4a030',icon:'駝',sub:'唐三彩'},
  12:{bg:'#051828',fg:'#7ab8d0',icon:'碗',sub:'汝窑天青'},
  13:{bg:'#051020',fg:'#4090c8',icon:'罐',sub:'元青花'},
  14:{bg:'#180a20',fg:'#c878b0',icon:'杯',sub:'斗彩'},
  15:{bg:'#201008',fg:'#e0a870',icon:'碗',sub:'粉彩'},
  16:{bg:'#101018',fg:'#e0d8c8',icon:'碗',sub:'定窑白釉'},
  17:{bg:'#081808',fg:'#50a870',icon:'壺',sub:'越窑青釉'},
  18:{bg:'#081520',fg:'#7abac0',icon:'瓶',sub:'龙泉梅瓶'},
  19:{bg:'#100818',fg:'#d090d8',icon:'碗',sub:'珐琅彩'},
  20:{bg:'#181208',fg:'#908060',icon:'倉',sub:'汉代陶器'},
  21:{bg:'#081828',fg:'#5090c8',icon:'壺',sub:'青花执壶'},
  22:{bg:'#180820',fg:'#c050a0',icon:'盆',sub:'钧窑紫釉'},
  23:{bg:'#201005',fg:'#d4a030',icon:'馬',sub:'唐三彩马'},
  24:{bg:'#0d1508',fg:'#709060',icon:'罐',sub:'原始青瓷'},
  25:{bg:'#201010',fg:'#e07080',icon:'瓶',sub:'粉彩花鸟'},
  26:{bg:'#100d05',fg:'#c8a870',icon:'畫',sub:'山水摹本'},
  27:{bg:'#150a05',fg:'#d0a060',icon:'畫',sub:'明代立轴'},
  28:{bg:'#0d0d05',fg:'#b8b860',icon:'竹',sub:'竹石立轴'},
  29:{bg:'#0a0a0a',fg:'#c0b880',icon:'書',sub:'行书长卷'},
  30:{bg:'#0d0a08',fg:'#c8b878',icon:'書',sub:'楷书册页'},
  31:{bg:'#080808',fg:'#b0b070',icon:'山',sub:'山水册页'},
  32:{bg:'#0a0a0d',fg:'#c0b8d0',icon:'書',sub:'小楷摹本'},
  33:{bg:'#050505',fg:'#a8c8a8',icon:'蝦',sub:'水墨立轴'},
  34:{bg:'#080808',fg:'#a0b8c0',icon:'釣',sub:'山水摹本'},
  35:{bg:'#081208',fg:'#88c870',icon:'琮',sub:'良渚玉琮'},
  36:{bg:'#050d05',fg:'#80c068',icon:'玉',sub:'玉鸟形佩'},
  37:{bg:'#0a1008',fg:'#a8c888',icon:'玉',sub:'玉衣片'},
  38:{bg:'#100d08',fg:'#f0e8d0',icon:'飛',sub:'白玉飞天'},
  39:{bg:'#081008',fg:'#88b888',icon:'盞',sub:'青玉莲花'},
  40:{bg:'#0d0d08',fg:'#f0ecd8',icon:'玉',sub:'白玉山子'},
  41:{bg:'#050f08',fg:'#50d880',icon:'翠',sub:'翡翠摆件'},
  42:{bg:'#081008',fg:'#90c870',icon:'璧',sub:'新石器玉璧'},
  43:{bg:'#200505',fg:'#e0c060',icon:'錦',sub:'蜀锦'},
  44:{bg:'#180520',fg:'#f0d060',icon:'錦',sub:'云锦'},
  45:{bg:'#051828',fg:'#c8d8f0',icon:'繡',sub:'苏绣屏风'},
  46:{bg:'#150203',fg:'#e83030',icon:'漆',sub:'剔红漆器'},
  47:{bg:'#150305',fg:'#d04040',icon:'盤',sub:'螺钿漆器'},
  48:{bg:'#180a04',fg:'#c07838',icon:'雕',sub:'徽州木雕'},
  49:{bg:'#100505',fg:'#f0c840',icon:'觀',sub:'漆线雕'},
  50:{bg:'#08080f',fg:'#d0d0f0',icon:'冠',sub:'苗族银饰'},
};

function makeSVG(name, era, c) {
  const lines = Array.from({length:10}, function(_,i) {
    return '<line x1="'+i*56+'" y1="0" x2="'+(i*56-340)+'" y2="340" stroke="'+c.fg+'" stroke-width="0.5" opacity="0.12"/>';
  }).join('');

  return '<?xml version="1.0" encoding="UTF-8"?>'
    + '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 340" width="520" height="340">'
    + '<rect width="520" height="340" fill="'+c.bg+'"/>'
    + '<g>'+lines+'</g>'
    + '<rect x="16" y="16" width="488" height="308" fill="none" stroke="'+c.fg+'" stroke-width="1.5" opacity="0.35" rx="4"/>'
    + '<rect x="22" y="22" width="476" height="296" fill="none" stroke="'+c.fg+'" stroke-width="0.6" opacity="0.2" rx="3"/>'
    + '<text x="260" y="180" font-family="serif" font-size="140" fill="'+c.fg+'" opacity="0.13" text-anchor="middle" dominant-baseline="central">'+c.icon+'</text>'
    + '<text x="260" y="178" font-family="serif" font-size="138" fill="'+c.fg+'" opacity="0.3" text-anchor="middle" dominant-baseline="central">'+c.icon+'</text>'
    + '<rect x="170" y="50" width="180" height="32" rx="15" fill="'+c.fg+'" opacity="0.12"/>'
    + '<text x="260" y="72" font-family="serif" font-size="14" fill="'+c.fg+'" opacity="0.75" text-anchor="middle">'+c.sub+' · '+(era||'')+'</text>'
    + '<rect x="0" y="245" width="520" height="95" fill="'+c.bg+'" opacity="0.75"/>'
    + '<text x="260" y="287" font-family="serif" font-size="21" fill="'+c.fg+'" font-weight="bold" text-anchor="middle">'+name+'</text>'
    + '<text x="260" y="315" font-family="serif" font-size="12" fill="'+c.fg+'" opacity="0.55" text-anchor="middle">· 非遗博物馆藏 ·</text>'
    + '</svg>';
}

const ERA_CTX = {
  '商代':'商代（约公元前1600—前1046年）是中国青铜文明的鼎盛期，兽面纹礼器象征沟通天地的神圣力量。',
  '西周':'西周（约公元前1046—前771年）以礼乐制度立国，凤鸟纹铜器彰显王室典雅风尚。',
  '春秋':'春秋时期（公元前770—前476年），错金银技术令青铜器焕发华丽新风貌。',
  '战国':'战国时期（公元前475—前221年），铜镜制作极盛，兼具实用与审美。',
  '西汉':'西汉（公元前206—公元25年）国力强盛，鎏金铜器光华耀目，承载汉人对神仙境界的向往。',
  '东汉':'东汉（25—220年）铜奔马等造型将写实与想象完美融合，体现汉代工匠创造精神。',
  '唐代':'唐代（618—907年）三彩陶以绚丽釉彩记录了大唐盛世的繁华与开放。',
  '北宋':'北宋（960—1127年）汝窑以天青釉被誉为"天下宋瓷，汝窑为魁"。',
  '南宋':'南宋（1127—1279年）龙泉窑粉青釉温润如玉，梅瓶成为南宋美学的绝佳诠释。',
  '元代':'元代（1271—1368年）景德镇青花瓷走向世界，成为中国陶瓷史上的里程碑。',
  '明代':'明代（1368—1644年）斗彩、青花等工艺不断革新，缔造了中国瓷器史上的经典。',
  '清代':'清代（1644—1912年）粉彩、珐琅彩工艺精益求精，展现皇家至高品味。',
  '近代':'近代中国画大师在继承文人传统的同时勇于创新，彰显东方艺术的生命力。',
  '良渚文化':'良渚文化（约公元前3300—前2300年）精美玉器是中华文明"多元一体"的重要源头。',
  '红山文化':'红山文化（约公元前4700—前2900年）以玉龙、玉璧著称，展现先民对玉石的深厚崇拜。',
  '现代摹本':'高水准临摹作品忠实再现原作笔墨精髓，是书画学习与研究的重要范本。',
  '清末民初':'清末民初手工艺集清代工艺之大成，在动荡变迁中延续中华文明的工艺基因。',
  '清末':'清末能工巧匠将精湛技艺代代相传，留下弥足珍贵的文化遗产。',
};
function eraCtx(era) {
  if (!era) return '';
  for (const k of Object.keys(ERA_CTX)) { if (era.includes(k)) return ERA_CTX[k]; }
  return era + '，是中华文明历史长河中的重要篇章，其工艺与审美对后世影响深远。';
}

async function main() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST||'localhost',
    port: Number(process.env.DB_PORT)||3306,
    user: process.env.DB_USER||'root',
    password: process.env.DB_PASSWORD||'',
    database: process.env.DB_NAME||'museum_db',
  });

  // 确保 story 列存在
  const [cols] = await db.query(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME='artifacts' AND COLUMN_NAME='story'",
    [process.env.DB_NAME||'museum_db']
  );
  if (!cols.length) await db.query('ALTER TABLE artifacts ADD COLUMN story MEDIUMTEXT DEFAULT NULL AFTER description');

  const [rows] = await db.query(
    'SELECT a.*, h.name AS hall_name FROM artifacts a LEFT JOIN halls h ON a.current_hall_id=h.hall_id ORDER BY artifact_id'
  );

  for (const a of rows) {
    const id  = a.artifact_id;
    const cfg = CFG[id] || {bg:'#1a1008',fg:'#c8a050',icon:'藏',sub:'馆藏文物'};

    fs.writeFileSync(path.join(DIR, 'artifact_'+id+'.svg'), makeSVG(a.name, a.era, cfg), 'utf8');
    const imgPath = '/uploads/artifact_'+id+'.svg';

    const val = a.appraised_value ? '¥'+Number(a.appraised_value).toLocaleString() : '待定';
    const story = '<p><img src="'+imgPath+'" alt="'+a.name+'" style="width:100%;max-width:560px;height:auto;border-radius:8px;border:1px solid #ede3d0;margin-bottom:16px;display:block"></p>'
      +'<h3>文物概述</h3><p>'+(a.description||'暂无简介。')+'</p>'
      +'<h3>时代背景</h3><p>'+eraCtx(a.era)+'</p>'
      +'<h3>工艺与材质</h3><p>本件藏品以<strong>'+(a.material||'传统材料')+'</strong>制成'
      +(a.dimensions?'，尺寸为 '+a.dimensions:'')
      +(a.weight?'，重约 '+a.weight+' kg':'')
      +'，保存状况<strong>'+(a.condition_status||'良好')+'</strong>。</p>'
      +'<h3>馆藏价值</h3><p>本件藏品'+(a.acquisition_method==='捐赠'?'由热心人士捐赠，':'经博物馆征集入藏，')
      +'现存于'+(a.hall_name||'馆内')+'，估值约 <strong>'+val+'</strong>，具有极高的历史与艺术价值。</p>';

    if (a.image_url) {
      await db.query('UPDATE artifacts SET story=? WHERE artifact_id=?', [story, id]);
    } else {
      await db.query('UPDATE artifacts SET story=?,image_url=? WHERE artifact_id=?', [story, imgPath, id]);
    }
    process.stdout.write('['+id+'] '+a.name+'\n');
  }

  await db.end();
  console.log('\n完成：共处理 '+rows.length+' 件藏品');
}

main().catch(e => { console.error(e.message); process.exit(1); });
