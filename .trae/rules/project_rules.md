db和service文件夹是我们已经调好的后端项目文件，尽量不要动他。如果非要动，需要启动populate_db.js和testAiService来检测是否能跑通
遵循最小化改动原则，只修改必要的文件，遵循我的要求只改该改的地方。
后端端口为5000，写入.env文件中
后端必须检验所有请求是否带有token，没有token的请求必须拒绝访问。
每次创建逻辑代码时，要多使用logger记录日志，方便调试和错误定位。
用于测试的数据都以populate_db.js的为准，如需数据应该去该文件中。admin的密码是admin123;testuser的密码是123456.
前端存储token的变量名为authToken。
每次做完测试脚本通过测试之后，要看看源代码的逻辑、参数、产出和测试脚本的是否一致，否则会出现测试与实际情况不一致的情况。
questions表、users表、department表、role表等被用作外键的表在业务逻辑中只支持软删除，不支持硬删除。只有在调试逻辑中才可以用truncate进行硬删除来创建和初始化测试环境。
使用chrome-devtools-mcp来进行测试。

#项目概述
1.这是一个答题网页，用户可以选择不同的学科、题库进行练习。
2.拥有用户登陆功能。

#项目要求（必须严格遵守）
1.所有数据必须以真实的数据库返回数据进行，不允许使用虚拟数据。
2.技术栈使用Vue3，设计语言使用ant-design UI。
3.采用前后端分离，前端用Vue3，后端用Node.js。
4.遵守单一职责原则，不允许重复造轮子，按模块化拆分代码，不允许修改无关模块的逻辑。
5.代码要求简介易懂，禁止冗余代码 and 无用代码留存。

#页面类型
1.登录页。
2.选择题型页面。
3.练习模式答题页面。
4.测验模式答题页面。
5.测验得分总结页面。

#题型类型
1.单选题
2.多选题
3.判断题
4.问答题

#登陆页UI
1.设置用户账号和密码输入框、登陆按钮、忘记密码、重置密码、立即注册按钮。
2.页面设置标题“答题系统”。

#注册页UI
1.设置用户账号、真实姓名、邮箱、部门、密码、确认密码。
2.页面设置标题“注册系统”。
3.检测用户账号是否已存在，若存在则提示用户账号已被注册，并提示用户是否跳转登录界面，如否则不要清空界面。
4.部门信息从department表中获取。

#忘记密码页UI
1.设置用户名输入框、邮箱地址输入框、新密码输入框、确认新密码输入框、重置密码按钮。
2.页面设置标题“忘记密码”。
3.检测新密码和确认新密码是否一致，若不一致则提示用户两次输入密码不一致，并不要清空界面。
4.点击重置密码按钮后，检测用户名和邮箱地址是否匹配，若不匹配则提示用户用户名和邮箱地址不匹配，并不要清空界面，如匹配则将调用后端修改密码的方法更新密码。

#重置密码页UI
1.设置用户名输入框、当前密码输入框、新密码输入框、确认新密码输入框、重置密码按钮。
2.页面设置标题“重置密码”。
3.检测新密码和确认新密码是否一致，若不一致则提示用户两次输入密码不一致，并不要清空界面。
4.点击重置密码按钮后，检测用户名和当前密码是否匹配，若不匹配则提示用户用户名和当前密码不匹配，并不要清空界面，如匹配则将调用后端修改密码的方法更新密码。

#选择题型页面UI
1.顶部状态栏设置退出登录按钮。
2.分2个层级，分别选择：学科、题库类型，都选择了之后才显示开始答题按钮。
3.学科的集合从数据库的subjects表中获取。
4.题库类型分为：顺序题库、错题库、收藏题库、今日测验。

#首页UI
1.显示用户的基本信息，包括用户名、真实姓名、邮箱、部门。
2.进入练习题库（即选择题库UI）的按钮。
3.显示用户的经验、等级（从数据库的users表中获取）。
4.显示用户获得的徽章（先用虚拟数据，后面再实现）。
5.显示用户的历史做题数量（从数据库的user_answer_history表中获取）。
6.显示同部门等级排名（从数据库的users表中获取）。
7.显示进入今日测验的按钮（根据questions_today表中为今日且user_id为当前用户的题目）。
8.显示历史测验记录列表（从数据库的questions_today_task表中获取，根据user_id和task_date进行筛选），显示测验状态（未做完、批改中、已完成）、可以在此界面进入测验界面（如果没做完）或者是得分界面（如果已做完）。

#练习模式答题页面UI
1.顶部状态栏设置“重置进度”和“返回首页”按钮，并且显示当前答题进度（第x题/共x题），同时中间显示学科和题库类型。
2.左侧部分显示做题进度，表现形式为若干个“圆圈+题号”构成的item，颜色以该标准显示：未做-灰色，做错-红色，做对-绿色，等待判断-蓝色（等待判断的针对问答题等需要异步等待结果的）。点击item可以跳转到对应的题目。
3.问答区域包括题目显示区域、选项区域（针对单选题、多选题、判断题）、答案输入区域（针对问答题）、收藏按钮、提交答案按钮、查看解析按钮、上一题下一题按钮。
4.选项的宽度占满当前行的区域，且鼠标点击选项框内任意区域都算有效点击。
5.收藏按钮为空心五角星，点击后会将当前题目添加到用户的收藏题库中（即favorite表），且五角星会变黄色实心。
6.提交答案后禁止点击提交答案按钮，同时将选项框的颜色改为灰色，防止用户重复提交。同时提供一个重新回答按钮在操作区域，供用户重新做本题（实现方法为从user_answer_progress中删除该题的回答信息，同时刷新UI，但不删除user_answer_history的记录）。
7.完成该题库中所有题目后，以弹窗形式恭喜用户，同时让用户选择重置进度或者留在当前页面查看自己的做题情况。

#测验模式答题页面UI
1.顶部状态栏显示“放弃考试”和“提交答卷”按钮，并且显示当前答题进度（第x题/共x题），同时中间显示学科和题库类型（今日测验）。
2.可以选择是否限制时间（默认不限制），若选择限制时间，则需要输入限制时间（单位为分钟）。
3.左侧部分显示做题进度，表现形式为若干个“圆圈+题号”构成的item，颜色以该标准显示：未做-灰色，做错-红色，做对-绿色，等待判断-蓝色（等待判断的针对问答题等需要异步等待结果的）。点击item可以跳转到对应的题目。
4.问答区域包括题目显示区域、选项区域（针对单选题、多选题、判断题）、答案输入区域（针对问答题）。
5.测验模式没有收藏按钮、提交答案按钮、查看解析按钮，也不在答题中途调用判断对错的方法，统一在提交答卷后，由后端对当前批次测验题统一进行判断，并将结果显示在得分界面，并将当前结果存入数据库中持久化保存。

#测验得分总结页面UI
1.显示用户的最终得分，并且总结用户本次答题的表现。
2.下边显示“返回首页”按钮。

#题库管理页面UI
1.可以根据学科、题型，或者通过关键词搜索筛选题目。
2.可以对题目进行增删改查操作。
3.可以查看每一道题的所有用户的历史做题记录。
4.分页显示。
5.抽象出题库管理的题库管理弹窗作为组件，供其他地方复用。

#每日题库管理页面UI
1.顶部状态栏设置退出登录按钮。
2.从questions_today_task表中获取数据，形成一个分页的表显示每一个每日题库任务。
3.点击每一个每日题库任务，在下面显示相关的题库（从questions_today表中获取，根据task_id和task_date进行筛选）。
4.可以对每一个题目进行增删改查操作。
5.可以查看每一道题的所有用户的历史做题记录。
6.抽象出题库管理的题库管理弹窗作为组件，复用到这里


#数据库信息
数据库所在ip：DESKTOP-IAURSFU
1.数据库名：quiz_db
2.数据库连接账号：sa
3.数据库连接密码：123456
4.数据库类型：sqlserver2008
5.数据库的服务器名：DESKTOP-IAURSFU\THRenliMS

#数据库表格
1.subjects表：用于记录学科类型。
2.users表：用于记录用户账号密码等信息。
3.favorite表：用于记录用户收藏题目。
4.wrong表：用于记录用户错题。
5.questions表：题库表
6.user_answer_progress表：用于记录用户本次答题的详细记录，用户重置进度的时候会清空。
7.user_answer_history表：用于保留用户每次答题的详细记录，无论用户是否重置进度，都要保存下来，用于后续统计分析、错题分析、大数据挖掘。
8.department表：部门名称
9.role表：角色名称（如admin，normal）

#subjects表字段
1.subject_id：自增int类型ID
2.subject_name：中文的学科名字
3.subject_code：英文的学科名字（全大写）

#questions表字段
1.question_id：自增int类型ID
2.subject_id：外键，关联学科
3.question_type ENUM('single','multiple','true_false','essay') NOT NULL：题型
4.question_content：题干
5.options：Json类型，存储单选题和多选题的选项
6.correct_answer：正确答案
7.explanation：答案解析
8.create_at：timestamp类型，题目创建时间
9.update_at：timestamp类型，题目更新时间
10.is_deleted：boolean类型，是否已删除，0表示未删除，1表示已删除。

#users表字段
1.user_id：自增int类型ID
2.user_name：用户账号
3.password_hash：密码哈希值
4.real_name：真实姓名
5.email：邮箱
6.department_id：外键，关联部门
7.role_id：外键，关联角色
8.is_deleted：boolean类型，是否已删除，0表示未删除，1表示已删除。

#department表字段
1.department_id：自增int类型ID
2.department_name：部门名称
3.is_deleted：boolean类型，是否已删除，0表示未删除，1表示已删除。

#role表字段
1.role_id：自增int类型ID
2.role_name：角色名称
3.is_deleted：boolean类型，是否已删除，0表示未删除，1表示已删除。       

#favorite表字段
1.favorite_id：自增int类型ID
2.user_id：外键，关联users表的user_id
3.question_id：外键，关联questions表的question_id
4.create_at：创建时间
（Unique约束：同一user_id不能对同一question_id多次收藏）

#wrong表字段
1.wrong_id：自增int类型ID
2.user_id：外键，关联users表的user_id
3.wrong_count：错题次数
4.question_id：外键，关联questions表的question_id
5.create_at：创建时间
（Unique约束：同一user_id不能对同一question_id多次收藏）

#user_answer_history表字段
1.history_id：自增int类型ID
2.user_id：外键，关联users表的user_id
3.question_id：外键，关联questions表的question_id
4.user_answer：用户填写的答案
5.is_correct：是否答对
6.create_at：记录创建时间
7.library_type：题库类型（sequential,wrong,favorite,daily_test
8.ai_mark:ai评分，默认0-100
9.ai_remark:ai批改意见

#user_answer_progress表字段
1.progress_id：自增int类型ID
2.user_id：外键，关联users表的user_id
3.question_id：外键，关联questions表的question_id
4.user_answer：用户填写的答案
5.is_correct：是否答对
6.create_at：记录创建时间
7.library_type：题库类型（sequential,wrong,favorite,daily_test
8.ai_mark:ai评分，默认0-100
9.ai_remark:ai批改意见

#questions_today表字段
1.questions_today_id：自增int类型ID
2.question_id：外键，关联questions表的question_id
3.create_at：创建时间
4.user_id：外键，关联users表的user_id
5.is_correct：是否答对
6.user_answer：用户填写的答案
7.ai_mark：ai评分，默认0-100
8.ai_remark：ai批改意见

#question_today_task表字段
1.task_id：自增int类型ID
2.department_id：外键，关联department表的department_id
2.user_id：外键，关联users表的user_id
3.task_date：任务日期，格式为YYYY-MM-DD
4.create_at：创建时间
5.exam_mark：本次测验得分（以本次测验的正确率取整作为得分）
6.ai_remark：ai对本次测验的总体表现评价
7.task_status:任务情况（未做完、批改中、已完成）

#答题批改方法逻辑
1.位于后端的异步方法，等返回结果到前端时，更新前端答题记录和UI，并且更新数据库中的答题记录。

#答案比对逻辑设计：
1.单选题 (single)：用户提交： 一个字符串或数字，代表用户选择的唯一选项。后端处理：从数据库中获取该题目的 correct_answer 字段。直接比较用户提交的答案与 correct_answer 是否完全一致。例如：用户提交 "A"，correct_answer 为 "A"，则正确。
2.多选题 (multiple)：用户提交： 一个字符串数组，代表用户选择的所有选项。
后端处理：从数据库中获取该题目的 correct_answer 字段（该字段应存储一个字符串数组）。将用户提交的答案数组和 correct_answer 数组都进行排序。比较两个排序后的数组是否完全相等（即元素数量和每个元素都相同）。例如：用户提交 ["A", "C"]，correct_answer 为 ["C", "A"]，排序后都为 ["A", "C"]，则正确。
3.判断题 (true_false)：用户提交： 一个布尔值（true 或 false）或表示布尔值的字符串（例如 "true" 或 "false"）。后端处理：从数据库中获取该题目的 correct_answer 字段（该字段应存储一个布尔值）。将用户提交的答案转换为布尔值类型。直接比较转换后的用户答案与 correct_answer 是否一致。例如：用户提交 true，correct_answer 为 true，则正确。
4.问答题 (essay)：用户提交：一个字符串，代表用户的答案。后端处理：交由ai大模型模块进行答案批改，以ai大模型返回的正确或错误为准。

#AI大模型
1.采用智谱清言的glm-4-flash免费大模型
2.API Key是b8bc1a2a0bac4ba5bb5bf0262670bf09.ylJ3W3YugMkTmlv2
3.请求地址是https://open.bigmodel.cn/api/paas/v4/
4.发送给ai大模型的信息包括：题目，用户的答案，正确的答案
5.Ai返回的数据格式为json，包括属性有批改得分mark：0-100分，批改结果result:right或者wrong，批改意见remark：为什么对为什么错。后端根据mark和result结合判断用户的答案是否正确，大于等于60分且result为right则认为用户答案正确，如果mark小于60分且result为wrong则认为用户答案错误，如果result和mark不匹配（例如result为wrong但mark大于等于60分），则重新调用ai大模型进行批改，直到返回的result和mark匹配或者尝试次数超过3次为止，这时候结果判对，但是remark写明ai未能成功判断对错。
6.让ai严格依照如下示例的格式返回json：实例{ "result": "right",  "mark": 85,  "remark": "用户答案完全正确，与标准答案一致。"}
7.让ai以资深老师的语气给出用户友善的remark，语气去除ai味。
8.可以参考如下的prompt:你是一个专业的批改老师，请根据以下题目、用户答案和正确答案，给出批改结果。
请严格按照 JSON 格式返回，包含以下属性：
- result: 批改结果，只能是 "right" 或 "wrong"。
- mark: 批改得分，0-100分。
- remark: 批改意见，说明为什么对或为什么错。
请确保 result 和 mark 严格一致：
- 如果 mark >= 60 且 result 为 "right"，则认为用户答案正确。
- 如果 mark < 60 且 result 为 "wrong"，则认为用户答案错误。
- 如果 result 和 mark 不匹配（例如 result 为 "wrong" 但 mark >= 60），请重新判断，直到匹配为止。
- 如果尝试 3 次后仍不匹配，请将 result 设为 "right"，remark 设为 "AI 未能成功判断对错。"

题目: ${question}
用户答案: ${userAnswer}
正确答案: ${correctAnswer}

示例：
{
  "result": "right",
  "mark": 85,
  "remark": "用户答案完全正确，与标准答案一致。"
}