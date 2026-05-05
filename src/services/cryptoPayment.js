/**
 * 加密货币收款模块 — USDT 多链支付
 * 
 * 支持链：
 *   Ethereum (ERC-20)  |  BSC (BEP-20)  |  Polygon
 * 
 * 使用 ethers.js v6，私钥从环境变量 PRIVATE_KEY 读取
 * 
 * 付款匹配策略：
 *   同一钱包地址收所有链的 USDT → 按金额 + 时间窗口匹配订单
 */

import { ethers } from 'ethers';

// ======== USDT 合约地址（各链统一 6 位精度） ========
const USDT_CONTRACTS = {
  ethereum: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  bsc:      '0x55d398326f99059fF775485246999027B3197955',
  polygon:  '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
};

// ======== RPC 节点 ========
const RPC_URLS = {
  ethereum: process.env.ETH_RPC_URL || (
    process.env.INFURA_PROJECT_ID
      ? `https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`
      : 'https://eth.llamarpc.com'
  ),
  bsc:      process.env.BSC_RPC_URL || 'https://bsc-dataseed1.binance.org',
  polygon:  process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
};

// ======== USDT ERC-20 最小 ABI ========
const USDT_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function transfer(address, uint256) returns (bool)',
  'function symbol() view returns (string)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
];

// ======== 单例 ========
let _wallet = null;
let _address = null;

/**
 * 获取/初始化钱包实例
 * 私钥 → 地址（所有 EVM 链共用同一地址）
 */
function getWallet() {
  if (_wallet) return _wallet;

  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('未配置 PRIVATE_KEY 环境变量，无法初始化加密钱包');
  }

  // ethers v6: 私钥直接创建钱包（不需 Provider）
  _wallet = new ethers.Wallet(privateKey);
  _address = _wallet.address;
  console.log('[Crypto] 钱包已初始化:', _address);
  return _wallet;
}

/** 获取收款地址 */
export function getWalletAddress() {
  if (_address) return _address;
  return getWallet().address;
}

/**
 * 获取指定链的 Provider（只读，不需要钱包签名）
 */
function getProvider(chain) {
  const rpc = RPC_URLS[chain];
  if (!rpc) throw new Error(`不支持的链: ${chain}`);
  return new ethers.JsonRpcProvider(rpc);
}

/**
 * 获取 USDT 合约实例（只读）
 */
function getUSDTContract(chain) {
  const addr = USDT_CONTRACTS[chain];
  if (!addr) throw new Error(`链 ${chain} 没有配置 USDT 合约`);
  const provider = getProvider(chain);
  return new ethers.Contract(addr, USDT_ABI, provider);
}

// ======== 公共 API ========

/** 可用链列表 */
export const SUPPORTED_CHAINS = [
  { id: 'bsc',      name: 'BSC (BEP-20)',  symbol: 'USDT', network: 'BSC' },
  { id: 'ethereum', name: 'Ethereum (ERC-20)', symbol: 'USDT', network: 'Ethereum' },
  { id: 'polygon',  name: 'Polygon',       symbol: 'USDT', network: 'Polygon' },
];

/**
 * 查询钱包 USDT 余额（指定链）
 * @returns {string} 人类可读余额（如 "1234.56"）
 */
export async function getUSDTBalance(chain = 'bsc') {
  try {
    const contract = getUSDTContract(chain);
    const address = getWalletAddress();
    const decimals = await contract.decimals();    // USDT 通常 = 6
    const raw = await contract.balanceOf(address);
    return ethers.formatUnits(raw, decimals);
  } catch (err) {
    console.error(`[Crypto] 查询 ${chain} USDT 余额失败:`, err.message);
    return '0';
  }
}

/**
 * 查询钱包各链余额汇总
 */
export async function getAllBalances() {
  const results = {};
  for (const chain of SUPPORTED_CHAINS) {
    results[chain.id] = await getUSDTBalance(chain.id);
  }
  return results;
}

/**
 * 检查是否有匹配的入账交易
 * 
 * 策略：扫描钱包的 USDT Transfer 事件，按金额+时间窗口匹配订单
 * 
 * @param {number} expectedAmountUSDT — 期望金额（USDT，如 199）
 * @param {Date}   since             — 订单创建时间
 * @param {string} chain             — 指定链（默认 'bsc'）
 * @returns {{ matched: boolean, txHash?: string, amount?: string, from?: string }}
 */
export async function checkPayment(expectedAmountUSDT, since, chain = 'bsc') {
  try {
    const contract = getUSDTContract(chain);
    const address = getWalletAddress();
    const decimals = await contract.decimals();  // 通常 6

    // 把期望金额转成链上精度
    const expectedWei = ethers.parseUnits(String(expectedAmountUSDT), decimals);

    // 查 Transfer 事件：to = 我们的地址
    const filter = contract.filters.Transfer(null, address);
    const fromBlock = -5000; // 最近 5000 个区块（BSC ~ 15 秒/块 ≈ 20 小时）
    const events = await contract.queryFilter(filter, fromBlock, 'latest');

    // 按时间过滤、金额匹配
    const sinceTs = Math.floor(since.getTime() / 1000);

    for (const ev of events) {
      // ethers v6: ev.args 直接是参数数组
      const to = ev.args[1];  // Transfer(from, to, value)
      const value = ev.args[2];

      if (to.toLowerCase() !== address.toLowerCase()) continue;

      // 获取区块时间戳
      const block = await ev.getBlock();
      const blockTs = block.timestamp;

      if (blockTs < sinceTs) continue; // 早于订单创建时间

      // 金额匹配（允许 ±1 USDT 容差，应对手续费等）
      const diff = value - expectedWei;
      const tolerance = ethers.parseUnits('1', decimals);
      if (diff < -tolerance || diff > tolerance) continue;

      return {
        matched: true,
        txHash: ev.transactionHash,
        amount: ethers.formatUnits(value, decimals),
        from: ev.args[0],
        chain,
        blockTimestamp: new Date(blockTs * 1000).toISOString(),
      };
    }

    return { matched: false };
  } catch (err) {
    console.error(`[Crypto] 检查 ${chain} 支付失败:`, err.message);
    return { matched: false, error: err.message };
  }
}

/**
 * 跨所有链检查支付
 * 返回第一个匹配到的链
 */
export async function checkPaymentAllChains(expectedAmountUSDT, since) {
  for (const chain of SUPPORTED_CHAINS) {
    const result = await checkPayment(expectedAmountUSDT, since, chain.id);
    if (result.matched) return result;
  }
  return { matched: false };
}

/**
 * 健康检查：验证 PRIVATE_KEY 可用且至少一个链能连通
 */
export async function healthCheck() {
  const issues = [];
  
  try {
    getWallet();
  } catch (e) {
    issues.push('PRIVATE_KEY 未配置');
  }

  let connectedChain = null;
  for (const chain of ['bsc', 'ethereum', 'polygon']) {
    try {
      const provider = getProvider(chain);
      await provider.getBlockNumber();
      connectedChain = chain;
      break;
    } catch (_) { /* 尝试下一个链 */ }
  }

  if (!connectedChain) {
    issues.push('所有链 RPC 均无法连接');
  }

  return {
    ok: issues.length === 0,
    wallet: getWalletAddress(),
    connectedChain,
    issues,
  };
}

// ======== 汇率模块 ========

let _cachedRate = null;
let _rateExpiry = 0;
const RATE_CACHE_TTL = 10 * 60 * 1000; // 10分钟

/**
 * 获取 USD/CNY 实时汇率
 * @returns {number} 1 USD = ? CNY
 */
async function fetchExchangeRate() {
  // CoinGecko (USDT 1:1 USD 锚定)
  try {
    const resp = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=cny', {
      headers: { 'Accept': 'application/json' }
    });
    if (resp.ok) {
      const data = await resp.json();
      if (data.tether?.cny) {
        console.log('[Crypto] CoinGecko 汇率:', data.tether.cny);
        return data.tether.cny;
      }
    }
  } catch (_) { /* fallback */ }

  // 备用: ExchangeRate-API
  try {
    const resp = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    if (resp.ok) {
      const data = await resp.json();
      if (data.rates?.CNY) {
        console.log('[Crypto] ExchangeRate-API 汇率:', data.rates.CNY);
        return data.rates.CNY;
      }
    }
  } catch (_) { /* fallback */ }

  // 硬编码兜底
  console.warn('[Crypto] 汇率API均失败，使用兜底汇率 7.2');
  return 7.2;
}

/**
 * 获取缓存的 USD/CNY 汇率
 */
export async function getExchangeRate() {
  const now = Date.now();
  if (_cachedRate && now < _rateExpiry) {
    return _cachedRate;
  }
  _cachedRate = await fetchExchangeRate();
  _rateExpiry = now + RATE_CACHE_TTL;
  return _cachedRate;
}

/**
 * 人民币 → USDT 换算
 * @param {number} cnyAmount — 人民币金额（元）
 * @returns {number} USDT 金额
 */
export async function cnyToUsdt(cnyAmount) {
  const rate = await getExchangeRate();
  return Math.round((cnyAmount / rate) * 100) / 100;
}

/**
 * USDT → 人民币换算
 * @param {number} usdtAmount — USDT 金额
 * @returns {number} 人民币金额（元）
 */
export async function usdtToCny(usdtAmount) {
  const rate = await getExchangeRate();
  return Math.round(usdtAmount * rate * 100) / 100;
}
