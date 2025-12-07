/*
# 添加发货类别步骤模板

1. 新增模板
    - 为"发货"类别添加智能步骤生成模板
    - 包含完整的发货流程步骤

2. 模板步骤
    - 客人确认block list
    - 货代配柜+制作T2L
    - 发货+制作delivery note
    - 制作invoice并发给客人+货代+会计师
    - 货代给我MRN和VGM
    - 最终的完整单证给到客人

3. 优先级
    - 设置为高优先级(10)，确保匹配时优先使用
*/

-- 插入发货类别的步骤模板
INSERT INTO step_templates (category, keywords, template_steps, priority) VALUES
('发货', ARRAY['发货', '出货', '货运', '物流', '配柜', 'shipping', 'delivery'], 
 '[
    {"title": "客人确认block list", "description": "与客户确认货物清单和装箱明细", "category": "准备"},
    {"title": "货代配柜+制作T2L", "description": "联系货代安排配柜并制作T2L文件", "category": "准备"},
    {"title": "发货+制作delivery note", "description": "安排发货并制作交货单", "category": "执行"},
    {"title": "制作invoice并发给客人+货代+会计师", "description": "制作发票并发送给相关方", "category": "执行"},
    {"title": "货代给我MRN和VGM", "description": "从货代处获取MRN和VGM信息", "category": "执行"},
    {"title": "最终的完整单证给到客人", "description": "整理并发送完整的货运单证给客户", "category": "完成"}
 ]'::jsonb, 10);
