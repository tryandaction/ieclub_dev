// 内容管理页面 - 帖子和话题管理
import React, { useEffect, useState } from 'react';
import {
  Tabs,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  message,
  Image,
  Card,
  Row,
  Col,
  Statistic,
  Badge,
  Tooltip,
} from 'antd';
import {
  FileTextOutlined,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  LockOutlined,
  UnlockOutlined,
  FireOutlined,
  StarOutlined,
  MessageOutlined,
  LikeOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { formatDateTime, formatRelativeTime, formatNumber } from '@/utils/format';
import { hasPermission } from '@/utils/auth';
import { useAppSelector } from '@/store/hooks';
import './index.less';

const { TextArea } = Input;
const { TabPane } = Tabs;

interface Post {
  id: number;
  title: string;
  type: string;
  content: string;
  author: {
    id: number;
    nickname: string;
    avatar?: string;
  };
  viewsCount: number;
  likesCount: number;
  commentsCount: number;
  status: string;
  createdAt: string;
}

interface Topic {
  id: number;
  title: string;
  description: string;
  category: string;
  cover?: string;
  creator: {
    id: number;
    nickname: string;
    avatar?: string;
  };
  postsCount: number;
  followersCount: number;
  status: string;
  createdAt: string;
}

const Content: React.FC = () => {
  const { admin } = useAppSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('posts');
  const [loading, setLoading] = useState(false);

  // 帖子状态
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsTotal, setPostsTotal] = useState(0);
  const [postsFilters, setPostsFilters] = useState({
    page: 1,
    pageSize: 20,
    keyword: '',
    type: undefined as string | undefined,
    status: undefined as string | undefined,
  });

  // 话题状态
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicsTotal, setTopicsTotal] = useState(0);
  const [topicsFilters, setTopicsFilters] = useState({
    page: 1,
    pageSize: 20,
    keyword: '',
    category: undefined as string | undefined,
    status: undefined as string | undefined,
  });

  // 详情模态框
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState<Post | Topic | null>(null);

  useEffect(() => {
    if (activeTab === 'posts') {
      fetchPosts();
    } else {
      fetchTopics();
    }
  }, [activeTab, postsFilters, topicsFilters]);

  // 获取帖子列表
  const fetchPosts = async () => {
    try {
      setLoading(true);
      // TODO: 调用API获取帖子列表
      // const response = await contentApi.getPosts(postsFilters);
      // setPosts(response.data.list);
      // setPostsTotal(response.data.total);
      
      // 模拟数据
      setPosts([]);
      setPostsTotal(0);
    } catch (error) {
      message.error('获取帖子列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取话题列表
  const fetchTopics = async () => {
    try {
      setLoading(true);
      // TODO: 调用API获取话题列表
      // const response = await contentApi.getTopics(topicsFilters);
      // setTopics(response.data.list);
      // setTopicsTotal(response.data.total);
      
      // 模拟数据
      setTopics([]);
      setTopicsTotal(0);
    } catch (error) {
      message.error('获取话题列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 查看详情
  const handleViewDetail = (item: Post | Topic) => {
    setCurrentItem(item);
    setDetailVisible(true);
  };

  // 删除内容
  const handleDelete = (id: number, type: 'post' | 'topic') => {
    Modal.confirm({
      title: `确认删除此${type === 'post' ? '帖子' : '话题'}？`,
      content: '删除后无法恢复',
      okText: '确认',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        try {
          // TODO: 调用删除API
          message.success('删除成功');
          if (type === 'post') {
            fetchPosts();
          } else {
            fetchTopics();
          }
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  // 锁定/解锁内容
  const handleToggleLock = async (id: number, type: 'post' | 'topic', isLocked: boolean) => {
    try {
      // TODO: 调用API
      message.success(isLocked ? '已解锁' : '已锁定');
      if (type === 'post') {
        fetchPosts();
      } else {
        fetchTopics();
      }
    } catch (error) {
      message.error('操作失败');
    }
  };

  // 帖子列表列
  const postColumns: ColumnsType<Post> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 300,
      ellipsis: true,
      render: (title: string, record) => (
        <Space>
          <a onClick={() => handleViewDetail(record)}>{title}</a>
          {record.status === 'deleted' && <Tag color="red">已删除</Tag>}
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => {
        const typeMap: Record<string, { color: string; text: string }> = {
          article: { color: 'blue', text: '文章' },
          question: { color: 'orange', text: '提问' },
          share: { color: 'green', text: '分享' },
          discussion: { color: 'purple', text: '讨论' },
        };
        const config = typeMap[type] || { color: 'default', text: type };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '作者',
      dataIndex: 'author',
      key: 'author',
      width: 150,
      render: (author: Post['author']) => (
        <Space>
          {author.avatar && <Image src={author.avatar} width={24} preview={false} />}
          <span>{author.nickname}</span>
        </Space>
      ),
    },
    {
      title: '数据',
      key: 'stats',
      width: 200,
      render: (_, record) => (
        <Space size="large">
          <Tooltip title="浏览量">
            <Space size={4}>
              <EyeOutlined />
              {formatNumber(record.viewsCount)}
            </Space>
          </Tooltip>
          <Tooltip title="点赞数">
            <Space size={4}>
              <LikeOutlined />
              {formatNumber(record.likesCount)}
            </Space>
          </Tooltip>
          <Tooltip title="评论数">
            <Space size={4}>
              <MessageOutlined />
              {formatNumber(record.commentsCount)}
            </Space>
          </Tooltip>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusMap: Record<string, { status: any; text: string }> = {
          published: { status: 'success', text: '已发布' },
          draft: { status: 'default', text: '草稿' },
          locked: { status: 'warning', text: '已锁定' },
          deleted: { status: 'error', text: '已删除' },
        };
        const config = statusMap[status] || { status: 'default', text: status };
        return <Badge status={config.status} text={config.text} />;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => formatRelativeTime(date),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>

          {hasPermission(admin, 'content:write') && (
            <>
              <Button
                type="link"
                size="small"
                icon={record.status === 'locked' ? <UnlockOutlined /> : <LockOutlined />}
                onClick={() => handleToggleLock(record.id, 'post', record.status === 'locked')}
              >
                {record.status === 'locked' ? '解锁' : '锁定'}
              </Button>

              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(record.id, 'post')}
              >
                删除
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  // 话题列表列
  const topicColumns: ColumnsType<Topic> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '话题',
      key: 'topic',
      width: 300,
      render: (_, record) => (
        <Space>
          {record.cover && <Image src={record.cover} width={40} height={40} preview={false} />}
          <div>
            <div>
              <a onClick={() => handleViewDetail(record)}>{record.title}</a>
            </div>
            <div style={{ fontSize: 12, color: '#999' }}>{record.description}</div>
          </div>
        </Space>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category: string) => <Tag>{category}</Tag>,
    },
    {
      title: '创建者',
      dataIndex: 'creator',
      key: 'creator',
      width: 150,
      render: (creator: Topic['creator']) => (
        <Space>
          {creator.avatar && <Image src={creator.avatar} width={24} preview={false} />}
          <span>{creator.nickname}</span>
        </Space>
      ),
    },
    {
      title: '数据',
      key: 'stats',
      width: 180,
      render: (_, record) => (
        <Space size="large">
          <Tooltip title="帖子数">
            <Space size={4}>
              <FileTextOutlined />
              {formatNumber(record.postsCount)}
            </Space>
          </Tooltip>
          <Tooltip title="关注数">
            <Space size={4}>
              <StarOutlined />
              {formatNumber(record.followersCount)}
            </Space>
          </Tooltip>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusMap: Record<string, { status: any; text: string }> = {
          active: { status: 'success', text: '活跃' },
          locked: { status: 'warning', text: '已锁定' },
          deleted: { status: 'error', text: '已删除' },
        };
        const config = statusMap[status] || { status: 'default', text: status };
        return <Badge status={config.status} text={config.text} />;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => formatRelativeTime(date),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>

          {hasPermission(admin, 'content:write') && (
            <>
              <Button
                type="link"
                size="small"
                icon={record.status === 'locked' ? <UnlockOutlined /> : <LockOutlined />}
                onClick={() => handleToggleLock(record.id, 'topic', record.status === 'locked')}
              >
                {record.status === 'locked' ? '解锁' : '锁定'}
              </Button>

              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(record.id, 'topic')}
              >
                删除
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="content-page">
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总帖子数"
              value={postsTotal}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总话题数"
              value={topicsTotal}
              prefix={<FireOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="今日新增帖子"
              value={0}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="今日新增话题"
              value={0}
              prefix={<FireOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 内容标签页 */}
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="帖子管理" key="posts">
            {/* 筛选栏 */}
            <div className="filter-bar" style={{ marginBottom: 16 }}>
              <Space>
                <Input
                  placeholder="搜索标题"
                  prefix={<SearchOutlined />}
                  style={{ width: 200 }}
                  value={postsFilters.keyword}
                  onChange={(e) => setPostsFilters({ ...postsFilters, keyword: e.target.value, page: 1 })}
                />

                <Select
                  placeholder="类型"
                  style={{ width: 120 }}
                  allowClear
                  value={postsFilters.type}
                  onChange={(value) => setPostsFilters({ ...postsFilters, type: value, page: 1 })}
                >
                  <Select.Option value="article">文章</Select.Option>
                  <Select.Option value="question">提问</Select.Option>
                  <Select.Option value="share">分享</Select.Option>
                  <Select.Option value="discussion">讨论</Select.Option>
                </Select>

                <Select
                  placeholder="状态"
                  style={{ width: 120 }}
                  allowClear
                  value={postsFilters.status}
                  onChange={(value) => setPostsFilters({ ...postsFilters, status: value, page: 1 })}
                >
                  <Select.Option value="published">已发布</Select.Option>
                  <Select.Option value="draft">草稿</Select.Option>
                  <Select.Option value="locked">已锁定</Select.Option>
                  <Select.Option value="deleted">已删除</Select.Option>
                </Select>
              </Space>
            </div>

            {/* 帖子表格 */}
            <Table
              columns={postColumns}
              dataSource={posts}
              rowKey="id"
              loading={loading}
              pagination={{
                current: postsFilters.page,
                pageSize: postsFilters.pageSize,
                total: postsTotal,
                onChange: (page, pageSize) => setPostsFilters({ ...postsFilters, page, pageSize }),
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条`,
              }}
              scroll={{ x: 1400 }}
            />
          </TabPane>

          <TabPane tab="话题管理" key="topics">
            {/* 筛选栏 */}
            <div className="filter-bar" style={{ marginBottom: 16 }}>
              <Space>
                <Input
                  placeholder="搜索话题"
                  prefix={<SearchOutlined />}
                  style={{ width: 200 }}
                  value={topicsFilters.keyword}
                  onChange={(e) => setTopicsFilters({ ...topicsFilters, keyword: e.target.value, page: 1 })}
                />

                <Select
                  placeholder="分类"
                  style={{ width: 120 }}
                  allowClear
                  value={topicsFilters.category}
                  onChange={(value) => setTopicsFilters({ ...topicsFilters, category: value, page: 1 })}
                >
                  <Select.Option value="technology">技术</Select.Option>
                  <Select.Option value="life">生活</Select.Option>
                  <Select.Option value="study">学习</Select.Option>
                  <Select.Option value="entertainment">娱乐</Select.Option>
                </Select>

                <Select
                  placeholder="状态"
                  style={{ width: 120 }}
                  allowClear
                  value={topicsFilters.status}
                  onChange={(value) => setTopicsFilters({ ...topicsFilters, status: value, page: 1 })}
                >
                  <Select.Option value="active">活跃</Select.Option>
                  <Select.Option value="locked">已锁定</Select.Option>
                  <Select.Option value="deleted">已删除</Select.Option>
                </Select>
              </Space>
            </div>

            {/* 话题表格 */}
            <Table
              columns={topicColumns}
              dataSource={topics}
              rowKey="id"
              loading={loading}
              pagination={{
                current: topicsFilters.page,
                pageSize: topicsFilters.pageSize,
                total: topicsTotal,
                onChange: (page, pageSize) => setTopicsFilters({ ...topicsFilters, page, pageSize }),
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条`,
              }}
              scroll={{ x: 1400 }}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* 详情模态框 */}
      <Modal
        title="内容详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={800}
      >
        {currentItem && (
          <div>
            <p>功能开发中...</p>
            <p>ID: {currentItem.id}</p>
            <p>标题: {currentItem.title}</p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Content;

