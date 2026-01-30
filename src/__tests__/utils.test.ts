import { cn, formatTime, formatDate, getGreeting, isNightTime, generateId, debounce } from '../lib/utils'

describe('cn (classNames)', () => {
  it('应该合并多个类名', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('应该处理条件类名', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
  })

  it('应该处理空值', () => {
    expect(cn('foo', null, undefined, 'bar')).toBe('foo bar')
  })

  it('应该合并 Tailwind 类', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
  })
})

describe('formatTime', () => {
  it('应该格式化时间为 HH:mm 格式', () => {
    const date = new Date('2024-01-15T14:30:00')
    const result = formatTime(date)
    expect(result).toMatch(/14:30/)
  })

  it('应该使用24小时制', () => {
    const date = new Date('2024-01-15T22:45:00')
    const result = formatTime(date)
    expect(result).toMatch(/22:45/)
  })
})

describe('formatDate', () => {
  it('应该格式化日期', () => {
    const date = new Date('2024-01-15')
    const result = formatDate(date)
    // 验证包含月份和日期
    expect(result).toContain('15')
    expect(result).toContain('月')
  })
})

describe('getGreeting', () => {
  it('凌晨应返回"夜深了"', () => {
    expect(getGreeting(2)).toBe('夜深了')
    expect(getGreeting(5)).toBe('夜深了')
  })

  it('早上应返回"早上好"', () => {
    expect(getGreeting(6)).toBe('早上好')
    expect(getGreeting(9)).toBe('早上好')
    expect(getGreeting(11)).toBe('早上好')
  })

  it('中午应返回"中午好"', () => {
    expect(getGreeting(12)).toBe('中午好')
    expect(getGreeting(13)).toBe('中午好')
  })

  it('下午应返回"下午好"', () => {
    expect(getGreeting(14)).toBe('下午好')
    expect(getGreeting(17)).toBe('下午好')
  })

  it('晚上应返回"晚上好"', () => {
    expect(getGreeting(18)).toBe('晚上好')
    expect(getGreeting(21)).toBe('晚上好')
  })

  it('深夜应返回"夜深了"', () => {
    expect(getGreeting(22)).toBe('夜深了')
    expect(getGreeting(23)).toBe('夜深了')
  })
})

describe('isNightTime', () => {
  it('凌晨应判断为夜间', () => {
    expect(isNightTime(0)).toBe(true)
    expect(isNightTime(5)).toBe(true)
  })

  it('白天应判断为非夜间', () => {
    expect(isNightTime(6)).toBe(false)
    expect(isNightTime(12)).toBe(false)
    expect(isNightTime(18)).toBe(false)
  })

  it('晚上19点后应判断为夜间', () => {
    expect(isNightTime(19)).toBe(true)
    expect(isNightTime(23)).toBe(true)
  })
})

describe('generateId', () => {
  it('应该生成非空字符串', () => {
    const id = generateId()
    expect(id).toBeTruthy()
    expect(typeof id).toBe('string')
  })

  it('应该生成唯一ID', () => {
    const ids = new Set()
    for (let i = 0; i < 100; i++) {
      ids.add(generateId())
    }
    expect(ids.size).toBe(100)
  })

  it('应该生成指定长度的ID', () => {
    const id = generateId()
    expect(id.length).toBe(7)
  })
})

describe('debounce', () => {
  it('应该延迟执行函数', async () => {
    let counter = 0
    const fn = debounce(() => counter++, 50)
    
    fn()
    fn()
    fn()
    
    expect(counter).toBe(0)
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    expect(counter).toBe(1)
  })

  it('应该在延迟期间重置计时器', async () => {
    let counter = 0
    const fn = debounce(() => counter++, 50)
    
    fn()
    await new Promise(resolve => setTimeout(resolve, 30))
    fn()
    await new Promise(resolve => setTimeout(resolve, 30))
    fn()
    
    expect(counter).toBe(0)
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    expect(counter).toBe(1)
  })
})
