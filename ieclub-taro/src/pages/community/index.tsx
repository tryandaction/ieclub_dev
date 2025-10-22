// src/pages/community/index.tsx
// 社区列表页面 - 基于开发代码优化版本，使用汉字图标

import React, { useEffect, useState } from 'react';
import { View, ScrollView, Input } from '@tarojs/components';
import Taro, { useLoad, useReachBottom, usePullDownRefresh } from '@tarojs/taro';
import useCommunityStore from '../../store/community';
import { UserSortType } from '../../types/community';
import UserCard from '../../components/UserCard';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import './index.scss';

const CommunityPage: React.FC = () => {
  const {
    users,
    currentSort,
    loading,
    hasMore,
    searchKeyword,
    setSort,
    setSearchKeyword,
    loadUsers,
    loadMore,
    searchUsers,
    reset
  } = useCommunityStore();

  const [localKeyword, setLocalKeyword] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // 页面加载
  useLoad(() => {
    loadUsers(true);
  });

  // 下拉刷新
  usePullDownRefresh(() => {
    loadUsers(true).finally(() => {
      Taro.stopPullDownRefresh();
    });
  });

  // 上拉加载更多
  useReachBottom(() => {
    if (hasMore && !loading) {
      loadMore();
    }
  });

  // 页面卸载时重置状态
  useEffect(() => {
    return () => {
      reset();
      // 清理搜索防抖定时器
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [reset, searchTimeout]);

  // 切换排序
  const handleSortChange = (sort: UserSortType) => {
    if (sort !== currentSort) {
      setSort(sort);
    }
  };

  // 搜索输入
  const handleSearchInput = (e: any) => {
    const keyword = e.detail.value;
    setLocalKeyword(keyword);

    // 防抖搜索
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      if (keyword.trim()) {
        searchUsers(keyword.trim());
      } else {
        setSearchKeyword('');
        loadUsers(true);
      }
    }, 500);

    setSearchTimeout(timeout);
  };

  // 清空搜索
  const handleClearSearch = () => {
    setLocalKeyword('');
    setSearchKeyword('');
    loadUsers(true);
  };

  return (
    <View className='community-page'>
      {/* 搜索栏 */}
      <View className='community-page__search'>
        <View className='search-bar'>
          <View className='search-bar__icon'>🔍</View>
          <Input
            className='search-bar__input'
            placeholder='搜索用户昵称...'
            value={localKeyword}
            onInput={handleSearchInput}
          />
          {localKeyword && (
            <View className='search-bar__clear' onClick={handleClearSearch}>
              ✕
            </View>
          )}
        </View>
      </View>

      {/* 排序标签 */}
      <View className='community-page__sort'>
        <View
          className={`sort-tab ${currentSort === UserSortType.REGISTER_TIME ? 'sort-tab--active' : ''}`}
          onClick={() => handleSortChange(UserSortType.REGISTER_TIME)}
        >
          最新加入
        </View>
        <View
          className={`sort-tab ${currentSort === UserSortType.INTERACTION ? 'sort-tab--active' : ''}`}
          onClick={() => handleSortChange(UserSortType.INTERACTION)}
        >
          人气最高
        </View>
      </View>

      {/* 用户列表 */}
      <ScrollView
        className='community-page__list'
        scrollY
        enableBackToTop
      >
        {users.length > 0 ? (
          <>
            {users.map(user => (
              <UserCard
                key={user.id}
                user={user}
                showInteraction={currentSort === UserSortType.INTERACTION}
              />
            ))}

            {/* 加载更多提示 */}
            {loading && (
              <View className='community-page__loading'>
                <LoadingSpinner />
              </View>
            )}

            {!hasMore && (
              <View className='community-page__no-more'>
                已经到底啦~
              </View>
            )}
          </>
        ) : loading ? (
          <View className='community-page__loading'>
            <LoadingSpinner />
          </View>
        ) : (
          <EmptyState
            title={searchKeyword ? '没有找到相关用户' : '暂无用户'}
          />
        )}
      </ScrollView>
    </View>
  );
};

export default CommunityPage;