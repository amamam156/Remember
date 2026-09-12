import { useState, useMemo } from 'react'
import { ChevronLeft, MapPin } from 'lucide-react'
import { BlockMapData } from '../services/api'

interface BlockMapProps {
  data: BlockMapData[]
  onBlockClick?: (block: BlockMapData) => void
  colorScheme?: {
    low: string
    medium: string
    high: string
    veryHigh: string
  }
}

const BlockMap: React.FC<BlockMapProps> = ({
  data,
  onBlockClick,
  colorScheme = {
    low: '#10b981',      // 绿色
    medium: '#f59e0b',   // 橙色
    high: '#ef4444',     // 红色
    veryHigh: '#dc2626'  // 深红色
  }
}) => {
  const [selectedBlock, setSelectedBlock] = useState<BlockMapData | null>(null)
  const [viewStack, setViewStack] = useState<BlockMapData[]>([])

  // 获取当前显示的数据
  const currentData = useMemo(() => {
    if (viewStack.length === 0) return data
    return viewStack[viewStack.length - 1].children || []
  }, [data, viewStack])

  // 根据Visits获取颜色
  const getBlockColor = (visitCount: number): string => {
    if (visitCount === 0) return '#e5e7eb' // 灰色，Not visited
    if (visitCount <= 2) return colorScheme.low
    if (visitCount <= 5) return colorScheme.medium
    if (visitCount <= 10) return colorScheme.high
    return colorScheme.veryHigh
  }

  // 根据Visits获取透明度
  const getBlockOpacity = (visitCount: number): number => {
    if (visitCount === 0) return 0.3
    if (visitCount <= 2) return 0.6
    if (visitCount <= 5) return 0.75
    if (visitCount <= 10) return 0.9
    return 1
  }

  // 处理色块点击
  const handleBlockClick = (block: BlockMapData) => {
    setSelectedBlock(block)
    
    // 如果有子节点，进入下一级
    if (block.children && block.children.length > 0) {
      setViewStack([...viewStack, block])
    }
    
    // 触发回调
    if (onBlockClick) {
      onBlockClick(block)
    }
  }

  // Back上一级
  const handleBack = () => {
    if (viewStack.length > 0) {
      const newStack = [...viewStack]
      newStack.pop()
      setViewStack(newStack)
      setSelectedBlock(null)
    }
  }

  // 计算色块布局（使用网格布局）
  const getGridLayout = (count: number) => {
    const cols = Math.ceil(Math.sqrt(count))
    const rows = Math.ceil(count / cols)
    return { cols, rows }
  }

  const { cols, rows } = getGridLayout(currentData.length)

  return (
    <div className="block-map">
      {/* 顶部导航栏 */}
      <div className="block-map-header">
        {viewStack.length > 0 ? (
          <>
            <button onClick={handleBack} className="back-button">
              <ChevronLeft className="h-5 w-5" />
              <span>Back</span>
            </button>
            <h3 className="current-view-title">
              {viewStack[viewStack.length - 1].name}
            </h3>
          </>
        ) : (
          <h3 className="current-view-title">World map</h3>
        )}
      </div>

      {/* 色块网格 */}
      <div 
        className="block-grid"
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`
        }}
      >
        {currentData.map((block: BlockMapData) => (
          <div
            key={block.id}
            className={`block-item ${selectedBlock?.id === block.id ? 'selected' : ''} ${block.visitCount === 0 ? 'unvisited' : 'visited'}`}
            style={{
              backgroundColor: getBlockColor(block.visitCount),
              opacity: getBlockOpacity(block.visitCount)
            }}
            onClick={() => handleBlockClick(block)}
          >
            <div className="block-content">
              <div className="block-name">{block.name}</div>
              {block.visitCount > 0 && (
                <div className="block-count">
                  <MapPin className="h-3 w-3" />
                  <span>{block.visitCount}</span>
                </div>
              )}
            </div>
            
            {block.children && block.children.length > 0 && (
              <div className="block-badge">
                {block.children.filter((c: BlockMapData) => c.visitCount > 0).length} / {block.children.length}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 色块信息面板 */}
      {selectedBlock && (
        <div className="block-info-panel">
          <div className="info-header">
            <div>
              <h4 className="info-title">{selectedBlock.name}</h4>
              <p className="info-subtitle">{selectedBlock.nameEn}</p>
            </div>
            <button 
              className="close-button"
              onClick={() => setSelectedBlock(null)}
            >
              ×
            </button>
          </div>
          
          <div className="info-stats">
            <div className="stat-item">
              <span className="stat-label">Visits</span>
              <span className="stat-value">{selectedBlock.visitCount}</span>
            </div>
            
            {selectedBlock.children && (
              <>
                <div className="stat-item">
                  <span className="stat-label">Visited cities</span>
                  <span className="stat-value">
                    {selectedBlock.children.filter(c => c.visitCount > 0).length}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Total cities</span>
                  <span className="stat-value">{selectedBlock.children.length}</span>
                </div>
              </>
            )}
          </div>

          {selectedBlock.children && selectedBlock.children.length > 0 && (
            <button 
              className="explore-button"
              onClick={() => handleBlockClick(selectedBlock)}
            >
              Explore cities in {selectedBlock.name}
            </button>
          )}
        </div>
      )}

      {/* 图例 */}
      <div className="block-legend">
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#e5e7eb' }} />
          <span>Not visited</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: colorScheme.low }} />
          <span>1-2 visits</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: colorScheme.medium }} />
          <span>3-5 visits</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: colorScheme.high }} />
          <span>6-10 visits</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: colorScheme.veryHigh }} />
          <span>10+ visits</span>
        </div>
      </div>
    </div>
  )
}

export default BlockMap
