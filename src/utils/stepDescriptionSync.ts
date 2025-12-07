/**
 * 步骤和描述同步工具
 * 用于在步骤列表和事件描述之间进行双向转换
 */

import type {Step} from '@/db/types'

/**
 * 将步骤列表转换为描述文本
 * @param steps 步骤列表
 * @returns 格式化的描述文本
 */
export function stepsToDescription(steps: Step[]): string {
  if (steps.length === 0) return ''

  return steps
    .map((step, index) => {
      const number = index + 1
      return `${number}. ${step.title}`
    })
    .join('\n')
}

/**
 * 从描述文本中提取步骤标题列表
 * @param description 描述文本
 * @returns 步骤标题数组
 */
export function descriptionToStepTitles(description: string): string[] {
  if (!description || !description.trim()) return []

  const lines = description.split('\n').map((line) => line.trim())
  const stepTitles: string[] = []

  for (const line of lines) {
    if (!line) continue

    // 匹配 "1. xxx" 或 "1) xxx" 或 "- xxx" 或 "* xxx" 格式
    const match = line.match(/^(?:\d+[.)]\s*|[-*]\s*)(.+)$/)
    if (match?.[1]) {
      stepTitles.push(match[1].trim())
    }
  }

  return stepTitles
}

/**
 * 检查描述是否包含步骤列表格式
 * @param description 描述文本
 * @returns 是否包含步骤列表
 */
export function hasStepListFormat(description: string): boolean {
  if (!description || !description.trim()) return false

  const lines = description.split('\n').map((line) => line.trim())
  let stepCount = 0

  for (const line of lines) {
    if (!line) continue
    // 匹配步骤格式
    if (/^(?:\d+[.)]\s*|[-*]\s*).+$/.test(line)) {
      stepCount++
    }
  }

  // 至少有2个步骤才认为是步骤列表
  return stepCount >= 2
}

/**
 * 合并描述和步骤
 * 如果描述中已有步骤列表，则替换；否则追加
 * @param currentDescription 当前描述
 * @param steps 步骤列表
 * @returns 合并后的描述
 */
export function mergeDescriptionWithSteps(currentDescription: string, steps: Step[]): string {
  if (steps.length === 0) return currentDescription

  const stepsText = stepsToDescription(steps)

  // 如果当前描述为空，直接返回步骤文本
  if (!currentDescription || !currentDescription.trim()) {
    return stepsText
  }

  // 如果描述中已有步骤列表格式，则替换
  if (hasStepListFormat(currentDescription)) {
    return stepsText
  }

  // 否则，在描述后追加步骤列表
  return `${currentDescription}\n\n执行步骤：\n${stepsText}`
}
