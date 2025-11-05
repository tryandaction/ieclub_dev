// 仪表盘页面
import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Spin } from 'antd';
import {
  UserOutlined,
  FileTextOutlined,
  MessageOutlined,
  WarningOutlined,
  RiseOutlined,
  FallOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { statsApi } from '@/api/stats';
import { formatNumber, formatRelativeTime } from '@/utils/format';
import type { DashboardStats } from '@/types/stats';
import './index.less';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await statsApi.dashboard();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="dashboard-loading">
        <Spin size="large" />
      </div>
    );
  }

  const { overview, userTrend, contentTrend, topContent } = stats;

  // 用户趋势图表配置
  const userTrendOption = {
    title: {
      text: '用户增长趋势',
      left: 'center',
    },
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: ['新增用户', '活跃用户'],
      bottom: 0,
    },
    xAxis: {
      type: 'category',
      data: userTrend.map((item) => item.date),
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        name: '新增用户',
        type: 'line',
        data: userTrend.map((item) => item.newUsers),
        smooth: true,
      },
      {
        name: '活跃用户',
        type: 'line',
        data: userTrend.map((item) => item.activeUsers),
        smooth: true,
      },
    ],
  };

  // 内容趋势图表配置
  const contentTrendOption = {
    title: {
      text: '内容发布趋势',
      left: 'center',
    },
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: ['帖子', '话题', '评论'],
      bottom: 0,
    },
    xAxis: {
      type: 'category',
      data: contentTrend.map((item) => item.date),
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        name: '帖子',
        type: 'bar',
        data: contentTrend.map((item) => item.posts),
      },
      {
        name: '话题',
        type: 'bar',
        data: contentTrend.map((item) => item.topics),
      },
      {
        name: '评论',
        type: 'bar',
        data: contentTrend.map((item) => item.comments),
      },
    ],
  };

  // 热门帖子列表列配置
  const postColumns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '作者',
      dataIndex: 'author',
      key: 'author',
      width: 120,
    },
    {
      title: '浏览',
      dataIndex: 'viewCount',
      key: 'viewCount',
      width: 100,
      render: (count: number) => formatNumber(count),
    },
    {
      title: '点赞',
      dataIndex: 'likeCount',
      key: 'likeCount',
      width: 100,
      render: (count: number) => formatNumber(count),
    },
  ];

  return (
    <div className="dashboard-page">
      <h1 className="page-title">仪表盘</h1>

      {/* 核心指标 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总用户数"
              value={overview.totalUsers}
              prefix={<UserOutlined />}
              suffix={
                <span className="trend-tag trend-up">
                  <RiseOutlined /> +{overview.todayNew.users}
                </span>
              }
            />
            <div className="stat-desc">
              本周活跃: {formatNumber(overview.activeUsersWeek)}
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总帖子数"
              value={overview.totalPosts}
              prefix={<FileTextOutlined />}
              suffix={
                <span className="trend-tag trend-up">
                  <RiseOutlined /> +{overview.todayNew.posts}
                </span>
              }
            />
            <div className="stat-desc">
              话题: {formatNumber(overview.totalTopics)}
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总评论数"
              value={overview.totalComments}
              prefix={<MessageOutlined />}
              suffix={
                <span className="trend-tag trend-up">
                  <RiseOutlined /> +{overview.todayNew.comments}
                </span>
              }
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="待处理举报"
              value={overview.pending.reports}
              prefix={<WarningOutlined />}
              valueStyle={{ color: overview.pending.reports > 0 ? '#f5222d' : undefined }}
            />
            <div className="stat-desc">
              活跃封禁: {overview.activeBans}
            </div>
          </Card>
        </Col>
      </Row>

      {/* 趋势图表 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card>
            <ReactECharts option={userTrendOption} style={{ height: 350 }} />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card>
            <ReactECharts option={contentTrendOption} style={{ height: 350 }} />
          </Card>
        </Col>
      </Row>

      {/* 热门内容 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="热门帖子 TOP 10">
            <Table
              dataSource={topContent.posts}
              columns={postColumns}
              pagination={false}
              size="small"
              rowKey="id"
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="热门话题 TOP 10">
            <Table
              dataSource={topContent.topics}
              columns={[
                {
                  title: '话题',
                  dataIndex: 'title',
                  key: 'title',
                  ellipsis: true,
                },
                {
                  title: '创建者',
                  dataIndex: 'creator',
                  key: 'creator',
                  width: 120,
                },
                {
                  title: '帖子数',
                  dataIndex: 'postCount',
                  key: 'postCount',
                  width: 100,
                },
                {
                  title: '关注',
                  dataIndex: 'followCount',
                  key: 'followCount',
                  width: 100,
                  render: (count: number) => formatNumber(count),
                },
              ]}
              pagination={false}
              size="small"
              rowKey="id"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;

