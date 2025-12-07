import {supabase} from '@/client/supabase'
import {stepsToDescription} from '@/utils/stepDescriptionSync'
import type {CreateStepInput, StepTemplate, TemplateStep} from './types'

export class StepGenerator {
  private static async getTemplates(): Promise<StepTemplate[]> {
    const {data, error} = await supabase.from('step_templates').select('*').order('priority', {ascending: false})

    if (error) {
      console.error('获取步骤模板失败:', error)
      return []
    }

    return Array.isArray(data) ? data : []
  }

  private static matchTemplate(
    title: string,
    description: string | undefined,
    category: string | undefined,
    templates: StepTemplate[]
  ): StepTemplate | null {
    const searchText = `${title} ${description || ''} ${category || ''}`.toLowerCase()

    for (const template of templates) {
      if (category && template.category === category) {
        return template
      }

      for (const keyword of template.keywords) {
        if (searchText.includes(keyword.toLowerCase())) {
          return template
        }
      }
    }

    return null
  }

  private static parseDescriptionForSteps(description: string): TemplateStep[] {
    const steps: TemplateStep[] = []
    const lines = description.split('\n').filter((line) => line.trim())

    for (const line of lines) {
      const trimmedLine = line.trim()

      if (
        trimmedLine.match(/^[\d一二三四五六七八九十]+[、.．。）)]/) ||
        trimmedLine.match(/^[-*•]/) ||
        trimmedLine.length > 5
      ) {
        const cleanedLine = trimmedLine
          .replace(/^[\d一二三四五六七八九十]+[、.．。）)]\s*/, '')
          .replace(/^[-*•]\s*/, '')
          .trim()

        if (cleanedLine.length > 0) {
          steps.push({
            title: cleanedLine.length > 20 ? cleanedLine.substring(0, 20) : cleanedLine,
            description: cleanedLine.length > 20 ? cleanedLine : '',
            category: '自定义'
          })
        }
      }
    }

    return steps
  }

  static async generateSteps(
    eventId: string,
    title: string,
    description: string | undefined,
    category: string | undefined
  ): Promise<CreateStepInput[]> {
    const templates = await StepGenerator.getTemplates()
    const generatedSteps: CreateStepInput[] = []

    let templateSteps: TemplateStep[] = []

    if (description && description.trim().length > 0) {
      const parsedSteps = StepGenerator.parseDescriptionForSteps(description)
      if (parsedSteps.length > 0) {
        templateSteps = parsedSteps
      }
    }

    if (templateSteps.length === 0) {
      const matchedTemplate = StepGenerator.matchTemplate(title, description, category, templates)
      if (matchedTemplate) {
        templateSteps = matchedTemplate.template_steps
      }
    }

    if (templateSteps.length === 0) {
      templateSteps = [
        {title: '开始准备', description: '收集必要的信息和资源', category: '准备'},
        {title: '制定计划', description: '规划具体的执行步骤', category: '规划'},
        {title: '执行任务', description: '按计划推进工作', category: '执行'},
        {title: '检查验收', description: '确认任务完成质量', category: '总结'}
      ]
    }

    templateSteps.forEach((step, index) => {
      generatedSteps.push({
        event_id: eventId,
        title: step.title,
        description: step.description || undefined,
        order_index: index,
        category: step.category || undefined,
        is_auto_generated: true
      })
    })

    return generatedSteps
  }

  static async createStepsForEvent(
    eventId: string,
    title: string,
    description: string | undefined,
    category: string | undefined
  ): Promise<boolean> {
    const steps = await StepGenerator.generateSteps(eventId, title, description, category)

    if (steps.length === 0) {
      return true
    }

    const {error} = await supabase.from('steps').insert(steps)

    if (error) {
      console.error('创建步骤失败:', error)
      return false
    }

    // 同步步骤到事件描述
    const {data: createdSteps} = await supabase
      .from('steps')
      .select('*')
      .eq('event_id', eventId)
      .order('order_index', {ascending: true})

    if (createdSteps && createdSteps.length > 0) {
      const newDescription = stepsToDescription(createdSteps)
      await supabase.from('events').update({description: newDescription}).eq('id', eventId)
    }

    return true
  }
}
