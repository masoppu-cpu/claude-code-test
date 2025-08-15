'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase-client'
import Input from '../ui/Input'
import { Category, Tag } from '@/types/database'

interface SearchAndFilterProps {
  onSearchChange: (query: string) => void
  onCategoryChange: (categoryId: string | null) => void
  onDifficultyChange: (difficulty: string | null) => void
  onTagsChange: (tagIds: string[]) => void
  onSortChange: (sortBy: string) => void
}

export default function SearchAndFilter({
  onSearchChange,
  onCategoryChange,
  onDifficultyChange,
  onTagsChange,
  onSortChange
}: SearchAndFilterProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sortBy, setSortBy] = useState('created_at_desc')
  const [showFilters, setShowFilters] = useState(false)

  const supabase = createClient()

  const fetchFiltersData = useCallback(async () => {
    try {
      const [categoriesResult, tagsResult] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('tags').select('*').order('name')
      ])

      if (categoriesResult.data) setCategories(categoriesResult.data)
      if (tagsResult.data) setTags(tagsResult.data)
    } catch (error) {
      console.error('Error fetching filter data:', error)
    }
  }, [supabase])

  useEffect(() => {
    fetchFiltersData()
  }, [fetchFiltersData])

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    onSearchChange(value)
  }

  const handleCategoryChange = (categoryId: string) => {
    const newCategory = categoryId === selectedCategory ? null : categoryId
    setSelectedCategory(newCategory)
    onCategoryChange(newCategory)
  }

  const handleDifficultyChange = (difficulty: string) => {
    const newDifficulty = difficulty === selectedDifficulty ? null : difficulty
    setSelectedDifficulty(newDifficulty)
    onDifficultyChange(newDifficulty)
  }

  const handleTagChange = (tagId: string) => {
    const newTags = selectedTags.includes(tagId)
      ? selectedTags.filter(id => id !== tagId)
      : [...selectedTags, tagId]
    
    setSelectedTags(newTags)
    onTagsChange(newTags)
  }

  const handleSortChange = (value: string) => {
    setSortBy(value)
    onSortChange(value)
  }

  const clearAllFilters = () => {
    setSearchQuery('')
    setSelectedCategory(null)
    setSelectedDifficulty(null)
    setSelectedTags([])
    setSortBy('created_at_desc')
    
    onSearchChange('')
    onCategoryChange(null)
    onDifficultyChange(null)
    onTagsChange([])
    onSortChange('created_at_desc')
  }

  const hasActiveFilters = searchQuery || selectedCategory || selectedDifficulty || selectedTags.length > 0

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
      {/* 検索バー */}
      <div className="mb-4">
        <Input
          label="コースを検索"
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="タイトル、説明文で検索..."
          className="w-full"
        />
      </div>

      {/* フィルターの表示/非表示切り替え */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
        >
          <svg className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          <span>詳細フィルター</span>
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            すべてクリア
          </button>
        )}
      </div>

      {/* フィルター */}
      {showFilters && (
        <div className="space-y-6">
          {/* ソート */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">並び順</label>
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="w-full md:w-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="created_at_desc">新しい順</option>
              <option value="created_at_asc">古い順</option>
              <option value="title_asc">タイトル昇順</option>
              <option value="title_desc">タイトル降順</option>
              <option value="estimated_hours_asc">短時間順</option>
              <option value="estimated_hours_desc">長時間順</option>
            </select>
          </div>

          {/* カテゴリー */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">カテゴリー</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.id)}
                  className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category.id
                      ? 'text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  style={{
                    backgroundColor: selectedCategory === category.id ? category.color : 'transparent',
                    borderColor: category.color,
                    borderWidth: '1px',
                    borderStyle: 'solid'
                  }}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* 難易度 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">難易度</label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'beginner', label: '初級', color: '#10B981' },
                { value: 'intermediate', label: '中級', color: '#F59E0B' },
                { value: 'advanced', label: '上級', color: '#EF4444' }
              ].map((difficulty) => (
                <button
                  key={difficulty.value}
                  onClick={() => handleDifficultyChange(difficulty.value)}
                  className={`px-3 py-2 rounded-full text-sm font-medium border transition-colors ${
                    selectedDifficulty === difficulty.value
                      ? 'text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  style={{
                    backgroundColor: selectedDifficulty === difficulty.value ? difficulty.color : 'transparent',
                    borderColor: difficulty.color
                  }}
                >
                  {difficulty.label}
                </button>
              ))}
            </div>
          </div>

          {/* タグ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">タグ</label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => handleTagChange(tag.id)}
                  className={`px-3 py-2 rounded-full text-sm font-medium border transition-colors ${
                    selectedTags.includes(tag.id)
                      ? 'text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  style={{
                    backgroundColor: selectedTags.includes(tag.id) ? tag.color : 'transparent',
                    borderColor: tag.color
                  }}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* アクティブフィルターの表示 */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {searchQuery && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                検索: &quot;{searchQuery}&quot;
              </span>
            )}
            {selectedCategory && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
                {categories.find(c => c.id === selectedCategory)?.name}
              </span>
            )}
            {selectedDifficulty && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-orange-100 text-orange-800">
                {selectedDifficulty === 'beginner' ? '初級' : selectedDifficulty === 'intermediate' ? '中級' : '上級'}
              </span>
            )}
            {selectedTags.map(tagId => {
              const tag = tags.find(t => t.id === tagId)
              return tag ? (
                <span key={tagId} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800">
                  {tag.name}
                </span>
              ) : null
            })}
          </div>
        </div>
      )}
    </div>
  )
}