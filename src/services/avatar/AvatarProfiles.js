/**
 * AvatarProfiles.js — AI主播形象预设库 v1.0
 * 
 * 4套主播形象：2女2男，各有不同的外观配色和语音
 */

const AVATAR_PROFILES = [
  {
    id: 'xiaorui',
    name: '小瑞',
    gender: 'female',
    style: 'warm',
    description: '温柔亲切女声，适合翡翠珠宝慢直播',
    voice: 'zh-CN-XiaoxiaoNeural',
    voiceLabel: '晓晓 - 温柔女声',
    // 外观参数 (给VRMRenderer用)
    appearance: {
      skinTone: '#f5e6d3',
      hairColor: '#2d1b3d',
      hairStyle: 'long',      // 长发
      outfitColor: '#6c3fa0',
      outfitAccent: '#a78bfa',
      lipColor: '#e74c3c',
      eyeColor: '#2d1b4e',
      blushColor: '#ff7675',
      bodyType: 'slim',
      accessories: 'earrings',
    },
    // 说话风格标签
    tags: ['温柔', '亲切', '慢直播', '珠宝'],
    avatar: '👩‍🦰',
  },
  {
    id: 'xiaoqing',
    name: '小青',
    gender: 'female',
    style: 'lively',
    description: '活泼元气女声，适合快节奏带货秒杀',
    voice: 'zh-CN-XiaoyiNeural',
    voiceLabel: '晓伊 - 活泼女声',
    appearance: {
      skinTone: '#fce4d6',
      hairColor: '#1a1a2e',
      hairStyle: 'short',     // 短发
      outfitColor: '#10b981',
      outfitAccent: '#34d399',
      lipColor: '#f472b6',
      eyeColor: '#1e3a5f',
      blushColor: '#fda4af',
      bodyType: 'slim',
      accessories: 'necklace',
    },
    tags: ['活泼', '元气', '带货', '秒杀'],
    avatar: '👩‍🦱',
  },
  {
    id: 'xiaoyun',
    name: '小云',
    gender: 'male',
    style: 'magnetic',
    description: '磁性低沉男声，适合高端翡翠鉴赏',
    voice: 'zh-CN-YunxiNeural',
    voiceLabel: '云希 - 磁性男声',
    appearance: {
      skinTone: '#e8d5c4',
      hairColor: '#0f0f1a',
      hairStyle: 'short',     // 短发
      outfitColor: '#1e3a5f',
      outfitAccent: '#3b82f6',
      lipColor: '#c0392b',
      eyeColor: '#1a1a2e',
      blushColor: 'transparent',
      bodyType: 'broad',
      accessories: 'watch',
    },
    tags: ['磁性', '低沉', '高端', '鉴赏'],
    avatar: '👨‍🦱',
  },
  {
    id: 'xiaowang',
    name: '小王',
    gender: 'male',
    style: 'professional',
    description: '专业干练男声，适合行业知识科普',
    voice: 'zh-CN-YunyangNeural',
    voiceLabel: '云扬 - 专业男声',
    appearance: {
      skinTone: '#f0dcc8',
      hairColor: '#1a1520',
      hairStyle: 'short',
      outfitColor: '#374151',
      outfitAccent: '#6b7280',
      lipColor: '#c0392b',
      eyeColor: '#1e293b',
      blushColor: 'transparent',
      bodyType: 'broad',
      accessories: 'glasses',
    },
    tags: ['专业', '干练', '科普', '干货'],
    avatar: '👨‍💼',
  },
];

/**
 * 根据ID获取主播形象
 */
function getProfile(profileId) {
  return AVATAR_PROFILES.find(p => p.id === profileId) || AVATAR_PROFILES[0];
}

/**
 * 获取所有形象列表（精简，给前端选择器用）
 */
function getProfileList() {
  return AVATAR_PROFILES.map(p => ({
    id: p.id,
    name: p.name,
    gender: p.gender,
    style: p.style,
    description: p.description,
    voice: p.voice,
    voiceLabel: p.voiceLabel,
    tags: p.tags,
    avatar: p.avatar,
  }));
}

/**
 * 随机选择一个形象
 */
function randomProfile(gender) {
  const pool = gender 
    ? AVATAR_PROFILES.filter(p => p.gender === gender)
    : AVATAR_PROFILES;
  return pool[Math.floor(Math.random() * pool.length)];
}

export {
  AVATAR_PROFILES,
  getProfile,
  getProfileList,
  randomProfile,
};
