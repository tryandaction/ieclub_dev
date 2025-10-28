import { Component } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

/**
 * 社区页 - 帖子和讨论
 */
export default class CommunityPage extends Component {
  
  state = {
    posts: []
  }

  componentDidMount() {
    console.log('[Community] Page mounted')
    this.loadPosts()
  }

  loadPosts() {
    const mockPosts = [
      {
        id: 1,
        author: '张明',
        content: '寻找对AI+教育感兴趣的小伙伴，一起做项目！',
        likes: 23,
        comments: 8,
        time: '2小时前'
      },
      {
        id: 2,
        author: '李思',
        content: '分享一个Python学习路径，适合零基础同学',
        likes: 45,
        comments: 15,
        time: '5小时前'
      }
    ]
    
    this.setState({ posts: mockPosts })
  }

  handleLike = (post) => {
    Taro.showToast({
      title: '点赞成功',
      icon: 'success'
    })
  }

  render() {
    const { posts } = this.state

    return (
      <View className="community-page">
        <ScrollView scrollY className="post-list">
          {posts.map(post => (
            <View key={post.id} className="post-card">
              <View className="post-header">
                <Text className="author">{post.author}</Text>
                <Text className="time">{post.time}</Text>
              </View>
              <Text className="content">{post.content}</Text>
              <View className="post-footer">
                <View className="action" onClick={() => this.handleLike(post)}>
                  <Text>❤️ {post.likes}</Text>
                </View>
                <View className="action">
                  <Text>💬 {post.comments}</Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    )
  }
}

