# 📚 排行榜API使用指南

## 🎯 排行榜API

### 1. 获取综合排行榜

**接口地址：** `GET /api/leaderboard/overall`

**请求参数：**
```javascript
{
  timeRange: 'week' | 'month' | 'all',  // 时间范围，默认week
  limit: 50                               // 返回数量，默认50
}
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "timeRange": "week",
    "leaderboard": [
      {
        "rank": 1,
        "user": {
          "id": "user123",
          "nickname": "张三",
          "avatar": "https://...",
          "level": 12,
          "department": "计算机系",
          "grade": "大三"
        },
        "score": 2340,
        "points": 1420,
        "stats": {
          "topicsCount": 23,
          "commentsCount": 156,
          "followersCount": 89,
          "likesCount": 234
        },
        "change": 2  // 排名变化，正数上升，负数下降
      }
    ],
    "total": 50,
    "updatedAt": "2024-10-27T10:00:00Z"
  }
}
```

### 2. 获取知识分享排行榜

**接口地址：** `GET /api/leaderboard/sharing`

**响应示例：**
```json
{
  "success": true,
  "data": {
    "leaderboard": [
      {
        "rank": 1,
        "user": { /* 用户信息 */ },
        "completedCount": 12,      // 成团次数
        "topicsCount": 18,          // 发布话题数
        "totalInterested": 234,     // 总想听人数
        "totalLikes": 456,
        "totalComments": 178,
        "score": 5678,
        "change": 0
      }
    ]
  }
}
```

### 3. 获取人气排行榜

**接口地址：** `GET /api/leaderboard/popularity`

**响应示例：**
```json
{
  "success": true,
  "data": {
    "leaderboard": [
      {
        "rank": 1,
        "user": { /* 用户信息 */ },
        "followersCount": 890,
        "topicsCount": 45,
        "likesCount": 1234,
        "change": 1
      }
    ]
  }
}
```

### 4. 获取话题热度排行榜

**接口地址：** `GET /api/leaderboard/topics`

**响应示例：**
```json
{
  "success": true,
  "data": {
    "leaderboard": [
      {
        "rank": 1,
        "topic": {
          "id": "topic123",
          "title": "Python爬虫实战教程",
          "type": "topic_offer",
          "cover": "https://...",
          "author": {
            "id": "user123",
            "nickname": "张三",
            "avatar": "https://..."
          }
        },
        "score": 8765,
        "stats": {
          "likes": 234,
          "comments": 89,
          "bookmarks": 156,
          "interested": 178,
          "views": 1234
        },
        "change": 0
      }
    ]
  }
}
```

### 5. 获取项目关注排行榜

**接口地址：** `GET /api/leaderboard/projects`

**响应示例：**
```json
{
  "success": true,
  "data": {
    "leaderboard": [
      {
        "rank": 1,
        "project": {
          "id": "project123",
          "title": "智能选课助手",
          "description": "基于AI的智能选课推荐系统",
          "cover": "https://...",
          "author": { /* 作者信息 */ }
        },
        "interestedCount": 234,
        "likesCount": 156,
        "commentsCount": 89,
        "bookmarksCount": 67,
        "change": 3
      }
    ]
  }
}
```

### 6. 获取用户排名详情

**接口地址：** `GET /api/leaderboard/user/:userId`

**响应示例：**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user123",
      "nickname": "张三",
      "avatar": "https://...",
      "level": 12,
      "points": 1420
    },
    "rankings": {
      "overall": {
        "rank": 8,
        "total": 1234,
        "beatPercentage": 99.4
      },
      "sharing": {
        "rank": 12,
        "total": 567,
        "beatPercentage": 97.9
      },
      "popularity": {
        "rank": 15,
        "total": 1234,
        "beatPercentage": 98.8
      }
    },
    "stats": {
      "topicsCount": 23,
      "commentsCount": 156,
      "followersCount": 89,
      "likesCount": 234
    }
  }
}
```

### 7. 获取我的排名

**接口地址：** `GET /api/leaderboard/my-ranking`

**需要登录**

**响应格式：** 同"获取用户排名详情"

---

## 🏅 徽章API

### 1. 获取所有徽章类型

**接口地址：** `GET /api/badges`

**响应示例：**
```json
{
  "success": true,
  "data": [
    {
      "id": "newbie",
      "name": "新手上路",
      "icon": "🌟",
      "condition": "Register account"
    },
    {
      "id": "student",
      "name": "学霸",
      "icon": "📚",
      "condition": "Publish 100 topics"
    }
  ]
}
```

### 2. 获取用户徽章

**接口地址：** `GET /api/badges/user/:userId`

**响应示例：**
```json
{
  "success": true,
  "data": [
    {
      "badgeId": "newbie",
      "badgeName": "新手上路",
      "badgeIcon": "🌟",
      "awardedAt": "2024-10-01T10:00:00Z"
    }
  ]
}
```

### 3. 获取积分规则

**接口地址：** `GET /api/badges/points-rules`

**响应示例：**
```json
{
  "success": true,
  "data": {
    "DAILY_SIGN_IN": 5,
    "COMPLETE_PROFILE": 20,
    "PUBLISH_TOPIC": 10,
    "TOPIC_LIKED": 2,
    "GET_FOLLOWER": 5,
    "COMPLETE_SESSION": 50,
    "WEEKLY_TOP3": 100,
    "MONTHLY_TOP10": 200
  }
}
```

---

## 📊 统计API

### 1. 获取平台统计

**接口地址：** `GET /api/stats/platform`

**响应示例：**
```json
{
  "success": true,
  "data": {
    "totalUsers": 1234,
    "totalTopics": 5678,
    "totalComments": 12345,
    "activeUsers": 456,
    "updatedAt": "2024-10-27T10:00:00Z"
  }
}
```

### 2. 获取热门标签

**接口地址：** `GET /api/stats/tags/popular`

**请求参数：**
```javascript
{
  limit: 20  // 返回数量，默认20
}
```

**响应示例：**
```json
{
  "success": true,
  "data": [
    { "tag": "Python", "count": 234 },
    { "tag": "机器学习", "count": 178 },
    { "tag": "前端开发", "count": 156 }
  ]
}
```

### 3. 获取用户统计

**接口地址：** `GET /api/stats/user/:userId`

**响应示例：**
```json
{
  "success": true,
  "data": {
    "basic": {
      "totalTopics": 23,
      "totalComments": 156,
      "followersCount": 89,
      "followingCount": 45,
      "totalLikes": 234,
      "totalBookmarks": 67,
      "points": 1420,
      "level": 12
    },
    "weekly": {
      "topicsCount": 3,
      "commentsCount": 12,
      "newFollowers": 5,
      "likesCount": 23
    },
    "monthly": {
      "topicsCount": 8,
      "commentsCount": 45,
      "newFollowers": 18,
      "likesCount": 89
    }
  }
}
```

### 4. 获取用户活跃度

**接口地址：** `GET /api/stats/user/:userId/activity`

**请求参数：**
```javascript
{
  days: 30  // 统计天数，默认30
}
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "activeDays": 25,
    "totalActivity": 156,
    "avgActivity": 6.2,
    "activityByDay": {
      "2024-10-27": {
        "topics": 1,
        "comments": 5,
        "likes": 8,
        "total": 14
      }
    }
  }
}
```

### 5. 获取用户影响力

**接口地址：** `GET /api/stats/user/:userId/influence`

**响应示例：**
```json
{
  "success": true,
  "data": {
    "influence": 2345
  }
}
```

### 6. 获取用户成长趋势

**接口地址：** `GET /api/stats/user/:userId/growth`

**请求参数：**
```javascript
{
  days: 30  // 统计天数，默认30
}
```

**响应示例：**
```json
{
  "success": true,
  "data": [
    {
      "date": "2024-10-27",
      "followers": 3,
      "topics": 1,
      "likes": 12
    },
    {
      "date": "2024-10-26",
      "followers": 2,
      "topics": 0,
      "likes": 8
    }
  ]
}
```

---

## 💡 使用示例

### 前端调用示例

```javascript
import api from './services/api';

// 1. 获取综合排行榜
const getOverallLeaderboard = async () => {
  const response = await api.get('/leaderboard/overall', {
    params: {
      timeRange: 'week',
      limit: 50
    }
  });
  return response.data.data.leaderboard;
};

// 2. 获取我的排名
const getMyRanking = async () => {
  const response = await api.get('/leaderboard/my-ranking');
  return response.data.data;
};

// 3. 获取用户统计
const getUserStats = async (userId) => {
  const response = await api.get(`/stats/user/${userId}`);
  return response.data.data;
};

// 4. 获取用户徽章
const getUserBadges = async (userId) => {
  const response = await api.get(`/badges/user/${userId}`);
  return response.data.data;
};
```

### React组件示例

```jsx
import React, { useState, useEffect } from 'react';

const LeaderboardComponent = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [timeRange, setTimeRange] = useState('week');

  useEffect(() => {
    loadLeaderboard();
  }, [timeRange]);

  const loadLeaderboard = async () => {
    const data = await getOverallLeaderboard();
    setLeaderboard(data);
  };

  return (
    <div>
      <select value={timeRange} onChange={e => setTimeRange(e.target.value)}>
        <option value="week">周榜</option>
        <option value="month">月榜</option>
        <option value="all">总榜</option>
      </select>

      {leaderboard.map(item => (
        <div key={item.user.id}>
          <span>{item.rank}</span>
          <span>{item.user.nickname}</span>
          <span>{item.score}</span>
        </div>
      ))}
    </div>
  );
};
```

---

## 🔒 权限说明

### 公开接口（无需登录）
- 所有排行榜查询接口
- 用户排名详情
- 平台统计
- 热门标签
- 徽章类型列表
- 积分规则

### 需要登录的接口
- `/api/leaderboard/my-ranking` - 我的排名
- `/api/badges/check/:userId` - 检查徽章（管理员）

---

## ⚡ 性能优化建议

### 缓存策略
```javascript
// Redis缓存排行榜数据（1小时）
const cacheKey = `leaderboard:${type}:${timeRange}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

// 计算排行榜
const data = await calculateLeaderboard();

// 存入缓存
await redis.setex(cacheKey, 3600, JSON.stringify(data));
```

### 分页加载
```javascript
// 首次加载前20条
const firstPage = await api.get('/leaderboard/overall?limit=20');

// 滚动加载更多
const nextPage = await api.get('/leaderboard/overall?limit=20&offset=20');
```

---

## 🎉 总结

排行榜API提供了丰富的功能：
- ✅ 5种排行榜类型
- ✅ 灵活的时间范围筛选
- ✅ 详细的用户统计
- ✅ 完整的徽章系统
- ✅ 积分奖励机制

开始使用这些API，打造精彩的排行榜功能吧！🚀

