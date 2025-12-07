/*
# 添加本地销售事件分类模板

## 1. 概述
为"本地销售"事件分类添加智能步骤生成模板，包含完整的本地销售流程。

## 2. 模板内容
- **分类**: 本地销售
- **关键词**: 本地销售、本地、销售、delivery note、record
- **优先级**: 10
- **步骤**:
  1. 制作delivery note（发一车做一张）
  2. 如果司机发来的是record，保存，每月一结算
  3. 每月初根据上个月的records做delivery note和发票

## 3. 使用场景
适用于本地销售业务，包含从制作delivery note到月度结算的完整流程。
*/

-- 插入本地销售模板
INSERT INTO step_templates (category, keywords, priority, template_steps)
VALUES (
  '本地销售',
  ARRAY['本地销售', '本地', '销售', 'delivery note', 'record'],
  10,
  '[
    {
      "title": "制作delivery note（发一车做一张）",
      "description": "每发一车货物制作一张delivery note",
      "category": "单证制作"
    },
    {
      "title": "如果司机发来的是record，保存，每月一结算",
      "description": "收集并保存司机发来的records，准备月度结算",
      "category": "记录管理"
    },
    {
      "title": "每月初根据上个月的records做delivery note和发票",
      "description": "汇总上月所有records，制作delivery note和发票",
      "category": "月度结算"
    }
  ]'::jsonb
);
