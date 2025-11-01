/**
 * IEClub 负载测试脚本
 * 
 * 使用方法:
 * node scripts/load-test.js --target http://localhost:3000 --users 100 --duration 60
 * 
 * 参数:
 * --target: 目标服务器地址
 * --users: 并发用户数
 * --duration: 测试持续时间（秒）
 * --rampup: 用户增长时间（秒）
 */

const axios = require('axios');
const { performance } = require('perf_hooks');

// ========================================
// 配置
// ========================================
const config = {
  target: process.argv.find(arg => arg.startsWith('--target'))?.split('=')[1] || 'http://localhost:3000',
  users: parseInt(process.argv.find(arg => arg.startsWith('--users'))?.split('=')[1] || '50'),
  duration: parseInt(process.argv.find(arg => arg.startsWith('--duration'))?.split('=')[1] || '60'),
  rampup: parseInt(process.argv.find(arg => arg.startsWith('--rampup'))?.split('=')[1] || '10'),
};

// ========================================
// 测试场景
// ========================================
const scenarios = [
  {
    name: '获取话题列表',
    weight: 30,
    async execute(client) {
      return await client.get('/api/posts?page=1&limit=20');
    }
  },
  {
    name: '获取话题详情',
    weight: 25,
    async execute(client) {
      const postId = Math.floor(Math.random() * 100) + 1;
      return await client.get(`/api/posts/${postId}`);
    }
  },
  {
    name: '获取用户列表',
    weight: 20,
    async execute(client) {
      return await client.get('/api/users?page=1&limit=20');
    }
  },
  {
    name: '搜索',
    weight: 15,
    async execute(client) {
      const keywords = ['Python', 'JavaScript', 'AI', '机器学习', '数据分析'];
      const keyword = keywords[Math.floor(Math.random() * keywords.length)];
      return await client.get(`/api/search?q=${keyword}`);
    }
  },
  {
    name: '获取活动列表',
    weight: 10,
    async execute(client) {
      return await client.get('/api/activities?page=1&limit=20');
    }
  }
];

// ========================================
// 统计数据
// ========================================
const stats = {
  requests: 0,
  success: 0,
  errors: 0,
  responseTimes: [],
  errorTypes: {},
  scenarioStats: {},
  startTime: null,
  endTime: null
};

// 初始化场景统计
scenarios.forEach(scenario => {
  stats.scenarioStats[scenario.name] = {
    requests: 0,
    success: 0,
    errors: 0,
    responseTimes: []
  };
});

// ========================================
// 虚拟用户类
// ========================================
class VirtualUser {
  constructor(id) {
    this.id = id;
    this.client = axios.create({
      baseURL: config.target,
      timeout: 30000,
      headers: {
        'User-Agent': `LoadTest-User-${id}`
      }
    });
    this.active = true;
  }

  // 选择测试场景
  selectScenario() {
    const totalWeight = scenarios.reduce((sum, s) => sum + s.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const scenario of scenarios) {
      random -= scenario.weight;
      if (random <= 0) {
        return scenario;
      }
    }
    
    return scenarios[0];
  }

  // 执行请求
  async executeRequest() {
    if (!this.active) return;

    const scenario = this.selectScenario();
    const startTime = performance.now();
    
    try {
      stats.requests++;
      stats.scenarioStats[scenario.name].requests++;
      
      await scenario.execute(this.client);
      
      const responseTime = performance.now() - startTime;
      stats.success++;
      stats.responseTimes.push(responseTime);
      stats.scenarioStats[scenario.name].success++;
      stats.scenarioStats[scenario.name].responseTimes.push(responseTime);
      
    } catch (error) {
      stats.errors++;
      stats.scenarioStats[scenario.name].errors++;
      
      const errorType = error.code || error.response?.status || 'UNKNOWN';
      stats.errorTypes[errorType] = (stats.errorTypes[errorType] || 0) + 1;
    }
    
    // 随机等待 1-3 秒后继续
    const thinkTime = 1000 + Math.random() * 2000;
    await new Promise(resolve => setTimeout(resolve, thinkTime));
    
    // 继续执行
    if (this.active) {
      this.executeRequest();
    }
  }

  stop() {
    this.active = false;
  }
}

// ========================================
// 统计计算
// ========================================
function calculateStats() {
  const duration = (stats.endTime - stats.startTime) / 1000;
  const sortedTimes = [...stats.responseTimes].sort((a, b) => a - b);
  
  const result = {
    duration: duration.toFixed(2),
    totalRequests: stats.requests,
    successRequests: stats.success,
    failedRequests: stats.errors,
    successRate: ((stats.success / stats.requests) * 100).toFixed(2),
    requestsPerSecond: (stats.requests / duration).toFixed(2),
    
    responseTime: {
      min: Math.min(...sortedTimes).toFixed(2),
      max: Math.max(...sortedTimes).toFixed(2),
      avg: (sortedTimes.reduce((a, b) => a + b, 0) / sortedTimes.length).toFixed(2),
      p50: sortedTimes[Math.floor(sortedTimes.length * 0.5)].toFixed(2),
      p90: sortedTimes[Math.floor(sortedTimes.length * 0.9)].toFixed(2),
      p95: sortedTimes[Math.floor(sortedTimes.length * 0.95)].toFixed(2),
      p99: sortedTimes[Math.floor(sortedTimes.length * 0.99)].toFixed(2),
    },
    
    errors: stats.errorTypes,
    
    scenarios: {}
  };
  
  // 计算每个场景的统计
  for (const [name, data] of Object.entries(stats.scenarioStats)) {
    if (data.requests > 0) {
      const scenarioTimes = [...data.responseTimes].sort((a, b) => a - b);
      result.scenarios[name] = {
        requests: data.requests,
        success: data.success,
        errors: data.errors,
        successRate: ((data.success / data.requests) * 100).toFixed(2),
        avgResponseTime: (scenarioTimes.reduce((a, b) => a + b, 0) / scenarioTimes.length).toFixed(2),
        p95ResponseTime: scenarioTimes[Math.floor(scenarioTimes.length * 0.95)]?.toFixed(2) || '0'
      };
    }
  }
  
  return result;
}

// ========================================
// 实时监控
// ========================================
function startMonitoring() {
  setInterval(() => {
    const elapsed = (Date.now() - stats.startTime) / 1000;
    const rps = stats.requests / elapsed;
    const successRate = (stats.success / stats.requests * 100).toFixed(1);
    
    process.stdout.write(`\r⏱️  ${elapsed.toFixed(0)}s | 📊 ${stats.requests} reqs | ✅ ${successRate}% | 🚀 ${rps.toFixed(1)} req/s | ❌ ${stats.errors} errors`);
  }, 1000);
}

// ========================================
// 主函数
// ========================================
async function main() {
  console.log('========================================');
  console.log('🚀 IEClub 负载测试');
  console.log('========================================');
  console.log(`目标服务器: ${config.target}`);
  console.log(`并发用户数: ${config.users}`);
  console.log(`测试时长: ${config.duration}秒`);
  console.log(`用户增长时间: ${config.rampup}秒`);
  console.log('========================================\n');
  
  // 健康检查
  try {
    await axios.get(`${config.target}/api/health`);
    console.log('✅ 服务器健康检查通过\n');
  } catch (error) {
    console.error('❌ 服务器健康检查失败:', error.message);
    process.exit(1);
  }
  
  const users = [];
  stats.startTime = Date.now();
  
  // 启动监控
  startMonitoring();
  
  // 逐步增加用户（Ramp-up）
  const rampupInterval = (config.rampup * 1000) / config.users;
  for (let i = 0; i < config.users; i++) {
    const user = new VirtualUser(i + 1);
    users.push(user);
    user.executeRequest();
    
    if (i < config.users - 1) {
      await new Promise(resolve => setTimeout(resolve, rampupInterval));
    }
  }
  
  // 等待测试完成
  await new Promise(resolve => setTimeout(resolve, config.duration * 1000));
  
  // 停止所有用户
  users.forEach(user => user.stop());
  
  // 等待所有请求完成
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  stats.endTime = Date.now();
  
  // 输出结果
  console.log('\n\n========================================');
  console.log('📊 测试结果');
  console.log('========================================\n');
  
  const result = calculateStats();
  
  console.log(`⏱️  测试时长: ${result.duration}s`);
  console.log(`📊 总请求数: ${result.totalRequests}`);
  console.log(`✅ 成功请求: ${result.successRequests}`);
  console.log(`❌ 失败请求: ${result.failedRequests}`);
  console.log(`📈 成功率: ${result.successRate}%`);
  console.log(`🚀 吞吐量: ${result.requestsPerSecond} req/s`);
  
  console.log('\n响应时间 (ms):');
  console.log(`  最小值: ${result.responseTime.min}`);
  console.log(`  最大值: ${result.responseTime.max}`);
  console.log(`  平均值: ${result.responseTime.avg}`);
  console.log(`  P50: ${result.responseTime.p50}`);
  console.log(`  P90: ${result.responseTime.p90}`);
  console.log(`  P95: ${result.responseTime.p95}`);
  console.log(`  P99: ${result.responseTime.p99}`);
  
  if (Object.keys(result.errors).length > 0) {
    console.log('\n错误类型:');
    for (const [type, count] of Object.entries(result.errors)) {
      console.log(`  ${type}: ${count}`);
    }
  }
  
  console.log('\n场景统计:');
  for (const [name, data] of Object.entries(result.scenarios)) {
    console.log(`\n  ${name}:`);
    console.log(`    请求数: ${data.requests}`);
    console.log(`    成功率: ${data.successRate}%`);
    console.log(`    平均响应时间: ${data.avgResponseTime}ms`);
    console.log(`    P95响应时间: ${data.p95ResponseTime}ms`);
  }
  
  console.log('\n========================================');
  console.log('✅ 测试完成');
  console.log('========================================\n');
  
  // 保存结果到文件
  const fs = require('fs');
  const reportPath = `load-test-report-${Date.now()}.json`;
  fs.writeFileSync(reportPath, JSON.stringify(result, null, 2));
  console.log(`📄 详细报告已保存到: ${reportPath}\n`);
}

// 运行测试
main().catch(error => {
  console.error('\n❌ 测试失败:', error.message);
  process.exit(1);
});

